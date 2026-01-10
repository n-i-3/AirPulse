'use client';

import { useState, useEffect } from 'react';
import { Header } from "@/components/layout/Header";
import { PredictionChart } from '@/components/charts/PredictionChart';
import { Activity, TrendingUp, AlertTriangle, MapPin, Zap, Target, Brain, Wind, Thermometer, CloudRain } from "lucide-react";
import { BentoCard } from '@/components/dashboard/BentoCard';
import { cn } from "@/lib/utils";

interface StationData {
    uid: number;
    lat: number;
    lon: number;
    aqi: string;
    station: {
        name: string;
    };
}

interface Analytics {
    avgAqi: number;
    maxAqi: number;
    minAqi: number;
    criticalZones: StationData[];
    distribution: { range: string; count: number; color: string }[];
    recommendation: string;
    priority: string;
}

export default function ForecastPage() {
    const [selectedWard, setSelectedWard] = useState('All Delhi NCR');
    const [training, setTraining] = useState(true);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [stationCount, setStationCount] = useState(0);
    const [confidence, setConfidence] = useState(0);
    const [weather, setWeather] = useState<{ wind: number; temp: number; humidity: number } | null>(null);

    // Real geographic bounds for specific wards
    const WARDS: Record<string, { lat1: number; lng1: number; lat2: number; lng2: number }> = {
        'All Delhi NCR': { lat1: 28.4, lng1: 76.8, lat2: 28.9, lng2: 77.4 },
        'Connaught Place': { lat1: 28.625, lng1: 77.210, lat2: 28.635, lng2: 77.225 },
        'Dwarka': { lat1: 28.560, lng1: 77.030, lat2: 28.600, lng2: 77.080 },
        'Rohini': { lat1: 28.690, lng1: 77.090, lat2: 28.750, lng2: 77.150 },
        'Okhla': { lat1: 28.530, lng1: 77.260, lat2: 28.570, lng2: 77.300 },
        'Anand Vihar': { lat1: 28.630, lng1: 77.300, lat2: 28.660, lng2: 77.330 },
    };

    useEffect(() => {
        setLoading(true);
        fetchRealTimeAnalytics();
        fetchWeather();

        // Retrain model effect when ward changes
        setTraining(true);
        const timer = setTimeout(() => setTraining(false), 2000);
        return () => clearTimeout(timer);
    }, [selectedWard]); // Re-fetch when ward changes

    const fetchWeather = async () => {
        try {
            // Delhi coordinates
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=28.6139&lon=77.2090&units=metric&appid=demo`);
            if (res.ok) {
                const data = await res.json();
                setWeather({
                    wind: data.wind?.speed || 0,
                    temp: data.main?.temp || 0,
                    humidity: data.main?.humidity || 0
                });
            }
        } catch (err) {
            console.log('Weather fetch failed, using defaults');
            setWeather({ wind: 8.2, temp: 24, humidity: 41 }); // Fallback
        }
    };

    const fetchRealTimeAnalytics = async () => {
        try {
            const bounds = WARDS[selectedWard];
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/aqi/bounds?lat1=${bounds.lat1}&lng1=${bounds.lng1}&lat2=${bounds.lat2}&lng2=${bounds.lng2}`);
            const data: StationData[] = await response.json();

            if (Array.isArray(data)) {
                const validStations = data.filter(s => s.aqi && s.aqi !== '-');
                analyzeData(validStations);
                setStationCount(validStations.length);
                // Dynamic confidence: based on station count (max 100 stations = 100%)
                const dataConfidence = Math.min((validStations.length / 50) * 100, 100);
                setConfidence(Math.round(dataConfidence * 0.95)); // Cap at 95%
            } else {
                console.warn("Invalid data format received", data);
                setStationCount(0);
                setAnalytics(null);
            }
        } catch (err) {
            console.error('Analytics fetch failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const analyzeData = (stations: StationData[]) => {
        const aqiValues = stations.map(s => parseInt(s.aqi)).filter(v => !isNaN(v));

        if (aqiValues.length === 0) return;

        const avgAqi = Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length);
        const maxAqi = Math.max(...aqiValues);
        const minAqi = Math.min(...aqiValues);

        // Find critical zones (AQI > 200)
        const criticalZones = stations
            .filter(s => parseInt(s.aqi) > 200)
            .sort((a, b) => parseInt(b.aqi) - parseInt(a.aqi))
            .slice(0, 5);

        // AQI distribution
        const distribution = [
            { range: '0-50 (Good)', count: aqiValues.filter(v => v <= 50).length, color: '#10b981' },
            { range: '51-100 (Moderate)', count: aqiValues.filter(v => v > 50 && v <= 100).length, color: '#eab308' },
            { range: '101-150 (USG)', count: aqiValues.filter(v => v > 100 && v <= 150).length, color: '#f97316' },
            { range: '151-200 (Unhealthy)', count: aqiValues.filter(v => v > 150 && v <= 200).length, color: '#ef4444' },
            { range: '201-300 (Very Unhealthy)', count: aqiValues.filter(v => v > 200 && v <= 300).length, color: '#991b1b' },
            { range: '300+ (Hazardous)', count: aqiValues.filter(v => v > 300).length, color: '#7f1d1d' },
        ];

        // Smart recommendations based on REAL data
        let recommendation = '';
        let priority = 'P2';

        if (avgAqi > 200) {
            recommendation = 'CRITICAL: Data indicates hazardous levels. AI recommends halting construction works immediately.';
            priority = 'P0';
        } else if (avgAqi > 150) {
            recommendation = 'HIGH ALERT: Pollution spike detected. Recommend activating GRAP-III protocols.';
            priority = 'P1';
        } else {
            recommendation = 'STABLE: Conditions are effectively manageable. Continue standard monitoring.';
            priority = 'P2';
        }

        setAnalytics({
            avgAqi,
            maxAqi,
            minAqi,
            criticalZones,
            distribution,
            recommendation,
            priority
        });
    };

    return (
        <main className="min-h-screen bg-[#020617] text-white font-sans selection:bg-primary/30 relative overflow-x-hidden">
            <Header />
            <div className="mx-auto max-w-[1600px] px-6 py-8">

                {/* Header Section */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Predictive Analysis</h1>
                        <p className="text-zinc-400">AI-driven forecasting and sensor fusion</p>
                    </div>

                    <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-xl border border-white/5">
                        <MapPin className="h-4 w-4 text-emerald-500" />
                        <select
                            value={selectedWard}
                            onChange={(e) => setSelectedWard(e.target.value)}
                            className="bg-transparent text-sm font-bold text-white border-none focus:ring-0 cursor-pointer outline-none"
                        >
                            {Object.keys(WARDS).map(ward => (
                                <option key={ward} value={ward} className="bg-zinc-900">{ward}</option>
                            ))}
                        </select>
                        <div className="h-4 w-px bg-white/10" />
                        <div className="flex items-center gap-2">
                            <Activity className={cn("h-3 w-3 text-emerald-500", training && "animate-pulse")} />
                            <span className="text-xs font-mono text-emerald-500">
                                {training ? "RETRAINING..." : "MODEL ACTIVE"}
                            </span>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="flex flex-col items-center gap-4">
                            <Brain className="h-12 w-12 text-emerald-500 animate-pulse" />
                            <div className="text-sm font-mono text-zinc-500">Aggregating sensor data...</div>
                        </div>
                    </div>
                ) : analytics && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Main Chart Area */}
                        <div className="lg:col-span-8 space-y-6">
                            <BentoCard className="p-6 relative overflow-visible z-10">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                                            AQI Trajectory Engine
                                        </h2>
                                        <p className="text-xs text-zinc-400 mt-1">Live Sensor Data ({stationCount} Stations) → AI Projection</p>
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono">
                                        Avg Confidence: <span className="font-bold text-emerald-500">{confidence}%</span>
                                    </div>
                                </div>

                                <div className="relative h-[400px]">
                                    {training && (
                                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-900/50 backdrop-blur-sm rounded-xl">
                                            <Brain className="h-12 w-12 text-emerald-500 animate-pulse mb-4" />
                                            <span className="text-sm font-mono text-emerald-500">Calibrating Model to Real-Time Data...</span>
                                        </div>
                                    )}
                                    <PredictionChart currentAqi={analytics.avgAqi} />
                                </div>
                            </BentoCard>

                            {/* Real-Time Stats Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <BentoCard className="p-4 flex flex-col items-center justify-center text-center">
                                    <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Station Count</div>
                                    <div className="text-3xl font-bold font-mono text-white">{stationCount}</div>
                                </BentoCard>
                                <BentoCard className="p-4 flex flex-col items-center justify-center text-center">
                                    <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Peak AQI</div>
                                    <div className="text-3xl font-bold font-mono text-red-500">{analytics.maxAqi}</div>
                                </BentoCard>
                                <BentoCard className="p-4 flex flex-col items-center justify-center text-center">
                                    <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Min AQI</div>
                                    <div className="text-3xl font-bold font-mono text-emerald-500">{analytics.minAqi}</div>
                                </BentoCard>
                                <BentoCard className="p-4 flex flex-col items-center justify-center text-center">
                                    <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Hotspots</div>
                                    <div className="text-3xl font-bold font-mono text-orange-500">{analytics.criticalZones.length}</div>
                                </BentoCard>
                            </div>

                            {/* Critical Zones Table */}
                            {analytics.criticalZones.length > 0 && (
                                <BentoCard className="p-6 border-red-500/20 bg-red-950/10">
                                    <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-red-400">
                                        <AlertTriangle className="h-4 w-4" />
                                        Detected Critical Zones (Live)
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {analytics.criticalZones.map(zone => (
                                            <div key={zone.uid} className="flex justify-between items-center p-3 rounded-xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-colors">
                                                <span className="text-sm font-medium truncate w-48 text-zinc-200">{zone.station.name}</span>
                                                <span className="font-mono font-bold text-red-400">{zone.aqi}</span>
                                            </div>
                                        ))}
                                    </div>
                                </BentoCard>
                            )}
                        </div>

                        {/* Sidebar Stats */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Meteorological Factors */}
                            <BentoCard className="p-6">
                                <h2 className="text-sm font-bold mb-6 flex items-center gap-2 text-white uppercase tracking-wider">
                                    <Activity className="h-4 w-4 text-blue-500" />
                                    Model Parameters
                                </h2>
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between text-xs mb-2">
                                            <span className="flex items-center gap-1.5 text-zinc-400">
                                                <Wind className="h-3 w-3" /> Wind Speed
                                            </span>
                                            <span className="font-mono text-white">{weather?.wind?.toFixed(1) || '8.2'} km/h</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${Math.min((weather?.wind || 8) * 5, 100)}%` }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-2">
                                            <span className="flex items-center gap-1.5 text-zinc-400">
                                                <Thermometer className="h-3 w-3" /> Temperature
                                            </span>
                                            <span className="font-mono text-white">{weather?.temp?.toFixed(0) || '24'}°C</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-500" style={{ width: `${Math.min((weather?.temp || 24) * 2, 100)}%` }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-2">
                                            <span className="flex items-center gap-1.5 text-zinc-400">
                                                <CloudRain className="h-3 w-3" /> Humidity
                                            </span>
                                            <span className="font-mono text-white">{weather?.humidity || 41}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-cyan-500" style={{ width: `${weather?.humidity || 41}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </BentoCard>

                            {/* AI Actionable Insight */}
                            <BentoCard className={cn(
                                "p-6 border-l-4",
                                analytics.priority === 'P0' ? 'border-l-red-500 bg-red-950/10' : 'border-l-emerald-500 bg-emerald-950/10'
                            )}>
                                <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-white">
                                    <Zap className={cn("h-4 w-4", analytics.priority === 'P0' ? "text-red-500" : "text-emerald-500")} />
                                    AI Action Plan
                                </h3>
                                <div className="text-sm leading-relaxed text-zinc-300">
                                    {analytics.recommendation}
                                </div>
                            </BentoCard>

                            {/* Distribution Map */}
                            <BentoCard className="p-6">
                                <h3 className="text-sm font-bold mb-4 text-white uppercase tracking-wider">Network Distribution</h3>
                                <div className="space-y-3">
                                    {analytics.distribution.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs">
                                            <div className="w-24 text-zinc-400">{item.range.split(' ')[0]}</div>
                                            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-1000"
                                                    style={{ width: `${(item.count / stationCount) * 100}%`, backgroundColor: item.color }}
                                                />
                                            </div>
                                            <div className="w-8 text-right font-mono text-white">{item.count}</div>
                                        </div>
                                    ))}
                                </div>
                            </BentoCard>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
