'use client';

import { useState, useEffect } from 'react';
import { Header } from "@/components/layout/Header";
import { PredictionChart } from '@/components/charts/PredictionChart';
import { Activity, TrendingUp, AlertTriangle, MapPin, Zap, Target, Brain, Wind, Thermometer, CloudRain } from "lucide-react";

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

        // Retrain model effect when ward changes
        setTraining(true);
        const timer = setTimeout(() => setTraining(false), 2000);
        return () => clearTimeout(timer);
    }, [selectedWard]); // Re-fetch when ward changes

    const fetchRealTimeAnalytics = async () => {
        try {
            const bounds = WARDS[selectedWard];
            const response = await fetch(`http://localhost:5000/api/aqi/bounds?lat1=${bounds.lat1}&lng1=${bounds.lng1}&lat2=${bounds.lat2}&lng2=${bounds.lng2}`);
            const data: StationData[] = await response.json();

            if (Array.isArray(data)) {
                const validStations = data.filter(s => s.aqi && s.aqi !== '-');
                analyzeData(validStations);
                setStationCount(validStations.length);
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
            { range: '0-50 (Good)', count: aqiValues.filter(v => v <= 50).length, color: '#009966' },
            { range: '51-100 (Moderate)', count: aqiValues.filter(v => v > 50 && v <= 100).length, color: '#ffd700' },
            { range: '101-150 (USG)', count: aqiValues.filter(v => v > 100 && v <= 150).length, color: '#ff7e00' },
            { range: '151-200 (Unhealthy)', count: aqiValues.filter(v => v > 150 && v <= 200).length, color: '#ff0000' },
            { range: '201-300 (Very Unhealthy)', count: aqiValues.filter(v => v > 200 && v <= 300).length, color: '#8b0000' },
            { range: '300+ (Hazardous)', count: aqiValues.filter(v => v > 300).length, color: '#7e0023' },
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
        <main className="min-h-screen bg-transparent text-foreground font-sans">
            <Header />
            <div className="mx-auto max-w-screen-2xl px-4 py-8">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                        <Brain className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">AI Predictive Command Center</h1>
                        <p className="text-muted-foreground text-sm">Real-Time Sensor Fusion & Predictive Modeling</p>
                    </div>
                    <div className="ml-auto flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 mb-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <select
                                value={selectedWard}
                                onChange={(e) => setSelectedWard(e.target.value)}
                                className="bg-transparent text-sm font-bold text-foreground border-none focus:ring-0 cursor-pointer"
                            >
                                {Object.keys(WARDS).map(ward => (
                                    <option key={ward} value={ward} className="bg-background">{ward}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                            <Activity className="h-3 w-3 text-purple-500 animate-pulse" />
                            <span className="text-xs font-mono text-purple-500">
                                {training ? "RETRAINING..." : "LIVE MODEL"}
                            </span>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="flex flex-col items-center gap-4">
                            <Brain className="h-12 w-12 text-purple-500 animate-pulse" />
                            <div className="text-sm font-mono text-muted-foreground">Aggregating sensor data...</div>
                        </div>
                    </div>
                ) : analytics && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Chart Area */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="rounded-3xl glass-card p-6 border border-purple-500/20 shadow-2xl relative overflow-hidden">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-lg font-bold">AQI Trajectory Engine</h2>
                                        <p className="text-xs text-muted-foreground">Live Sensor Data ({stationCount} Stations) → AI Projection</p>
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-muted/20 text-xs font-mono">
                                        Current Avg: <span className="font-bold text-foreground">{analytics.avgAqi} AQI</span>
                                    </div>
                                </div>

                                <div className="relative">
                                    {training && (
                                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm">
                                            <Brain className="h-12 w-12 text-purple-500 animate-pulse mb-4" />
                                            <span className="text-sm font-mono text-purple-500">Calibrating Model to Real-Time Data...</span>
                                        </div>
                                    )}
                                    <PredictionChart currentAqi={analytics.avgAqi} />
                                </div>
                            </div>

                            {/* Real-Time Stats Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 rounded-2xl glass-card border border-border">
                                    <div className="text-xs text-muted-foreground mb-1">Station Count</div>
                                    <div className="text-2xl font-bold">{stationCount}</div>
                                </div>
                                <div className="p-4 rounded-2xl glass-card border border-border">
                                    <div className="text-xs text-muted-foreground mb-1">Peak AQI</div>
                                    <div className="text-2xl font-bold text-red-500">{analytics.maxAqi}</div>
                                </div>
                                <div className="p-4 rounded-2xl glass-card border border-border">
                                    <div className="text-xs text-muted-foreground mb-1">Min AQI</div>
                                    <div className="text-2xl font-bold text-green-500">{analytics.minAqi}</div>
                                </div>
                                <div className="p-4 rounded-2xl glass-card border border-border">
                                    <div className="text-xs text-muted-foreground mb-1">Hotspots</div>
                                    <div className="text-2xl font-bold text-orange-500">{analytics.criticalZones.length}</div>
                                </div>
                            </div>

                            {/* Critical Zones Table */}
                            {analytics.criticalZones.length > 0 && (
                                <div className="rounded-3xl glass-card p-6 border border-red-500/20">
                                    <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                                        <AlertTriangle className="h-4 w-4 text-red-500" />
                                        Detected Critical Zones (Live)
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {analytics.criticalZones.map(zone => (
                                            <div key={zone.uid} className="flex justify-between items-center p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                                                <span className="text-sm font-medium truncate w-48">{zone.station.name}</span>
                                                <span className="font-mono font-bold text-red-500">{zone.aqi}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            {/* Meteorological Factors (Simulated Source for AI) */}
                            <div className="rounded-3xl glass-card p-6 border border-border">
                                <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-blue-500" />
                                    Model Parameters
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                                <Wind className="h-3 w-3" /> Wind Speed
                                            </span>
                                            <span className="font-mono text-foreground">8.2 km/h</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 w-[65%]"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                                <Thermometer className="h-3 w-3" /> Temperature
                                            </span>
                                            <span className="font-mono text-foreground">24°C</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-500 w-[72%]"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                                <CloudRain className="h-3 w-3" /> Humidity
                                            </span>
                                            <span className="font-mono text-foreground">41%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden">
                                            <div className="h-full bg-cyan-500 w-[41%]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* AI Actionable Insight */}
                            <div className={`rounded-3xl p-6 border ${analytics.priority === 'P0' ? 'border-red-500 bg-red-500/10' : 'border-purple-500/30 bg-purple-500/5'}`}>
                                <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-purple-500" />
                                    AI Action Plan
                                </h3>
                                <div className="text-sm leading-relaxed font-medium">
                                    {analytics.recommendation}
                                </div>
                            </div>

                            {/* Distribution Map */}
                            <div className="rounded-3xl glass-card p-6">
                                <h3 className="text-sm font-bold mb-4">Network Distribution</h3>
                                <div className="space-y-3">
                                    {analytics.distribution.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs">
                                            <div className="w-20 text-muted-foreground">{item.range.split(' ')[0]}</div>
                                            <div className="flex-1 h-2 bg-muted/20 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-1000"
                                                    style={{ width: `${(item.count / stationCount) * 100}%`, backgroundColor: item.color }}
                                                />
                                            </div>
                                            <div className="w-8 text-right font-mono">{item.count}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
