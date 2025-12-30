'use client';

import { useState, useEffect } from 'react';
import { Header } from "@/components/layout/Header";
import { Activity, TrendingUp, AlertTriangle, MapPin, Zap, Target } from "lucide-react";

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

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [stationCount, setStationCount] = useState(0);

    useEffect(() => {
        fetchRealTimeAnalytics();
        const interval = setInterval(fetchRealTimeAnalytics, 5 * 60 * 1000); // Refresh every 5min
        return () => clearInterval(interval);
    }, []);

    const fetchRealTimeAnalytics = async () => {
        setLoading(true);
        try {
            // Delhi NCR bounds
            const lat1 = 28.4;
            const lng1 = 76.8;
            const lat2 = 28.9;
            const lng2 = 77.4;

            const response = await fetch(`http://localhost:5000/api/aqi/bounds?lat1=${lat1}&lng1=${lng1}&lat2=${lat2}&lng2=${lng2}`);
            const data: StationData[] = await response.json();

            if (Array.isArray(data)) {
                const validStations = data.filter(s => s.aqi && s.aqi !== '-');
                analyzeData(validStations);
                setStationCount(validStations.length);
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

        // Smart recommendations
        let recommendation = '';
        let priority = 'P2';

        if (avgAqi > 200) {
            recommendation = 'CRITICAL: Implement GRAP-IV immediately. Ban all non-essential vehicles, halt construction, mandate work-from-home.';
            priority = 'P0';
        } else if (avgAqi > 150) {
            recommendation = 'HIGH ALERT: Activate GRAP-III. Restrict BS-III/IV vehicles, limit outdoor activities, increase public transit.';
            priority = 'P1';
        } else if (avgAqi > 100) {
            recommendation = 'ELEVATED: Monitor sensitive groups. Recommend N95 masks for outdoor work, reduce strenuous activities.';
            priority = 'P2';
        } else {
            recommendation = 'NORMAL: Continue standard monitoring protocols. Air quality within acceptable range.';
            priority = 'P3';
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
                    <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                        <Activity className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">Real-Time Analytics</h1>
                        <p className="text-muted-foreground text-sm">Live AQI Analysis & Risk Assessment</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                        <Zap className="h-3 w-3 text-green-500 animate-pulse" />
                        <span className="text-xs font-mono text-green-500">LIVE</span>
                    </div>
                </div>

                {loading && !analytics ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="flex flex-col items-center gap-3">
                            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <div className="text-sm font-mono text-muted-foreground">Analyzing {stationCount || 'Delhi NCR'} stations...</div>
                        </div>
                    </div>
                ) : analytics && (
                    <>
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <div className="rounded-2xl glass-card p-5">
                                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-medium uppercase">Average AQI</span>
                                </div>
                                <div className="text-4xl font-bold text-foreground">{analytics.avgAqi}</div>
                                <div className="text-xs text-muted-foreground mt-1">Across {stationCount} stations</div>
                            </div>

                            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-xl p-5">
                                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                    <span className="text-xs font-medium uppercase">Peak AQI</span>
                                </div>
                                <div className="text-4xl font-bold text-red-600 dark:text-red-400">{analytics.maxAqi}</div>
                                <div className="text-xs text-red-500/80 dark:text-red-300 mt-1">Highest reading</div>
                            </div>

                            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 backdrop-blur-xl p-5">
                                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                    <Target className="h-4 w-4 text-green-500" />
                                    <span className="text-xs font-medium uppercase">Min AQI</span>
                                </div>
                                <div className="text-4xl font-bold text-green-600 dark:text-green-400">{analytics.minAqi}</div>
                                <div className="text-xs text-green-500/80 dark:text-green-300 mt-1">Best air quality</div>
                            </div>

                            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 backdrop-blur-xl p-5">
                                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                    <MapPin className="h-4 w-4 text-orange-500" />
                                    <span className="text-xs font-medium uppercase">Critical Zones</span>
                                </div>
                                <div className="text-4xl font-bold text-orange-600 dark:text-orange-400">{analytics.criticalZones.length}</div>
                                <div className="text-xs text-orange-500/80 dark:text-orange-300 mt-1">AQI &gt; 200</div>
                            </div>
                        </div>

                        {/* AQI Distribution */}
                        <div className="rounded-3xl glass-card p-8 mb-8">
                            <h2 className="text-xl font-bold text-foreground mb-6">AQI Distribution</h2>
                            <div className="space-y-3">
                                {analytics.distribution.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4">
                                        <div className="w-32 text-sm text-foreground/80 font-mono">{item.range}</div>
                                        <div className="flex-1 h-8 bg-muted/20 rounded-full border border-border">
                                            <div
                                                className="h-full flex items-center px-3 text-xs font-bold text-white transition-all duration-500 shadow-sm rounded-full"
                                                style={{
                                                    width: `${(item.count / stationCount) * 100}%`,
                                                    backgroundColor: item.color,
                                                    minWidth: item.count > 0 ? '40px' : '0'
                                                }}
                                            >
                                                {item.count > 0 && item.count}
                                            </div>
                                        </div>
                                        <div className="w-16 text-sm text-muted-foreground text-right">
                                            {Math.round((item.count / stationCount) * 100)}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Critical Zones */}
                        {analytics.criticalZones.length > 0 && (
                            <div className="rounded-3xl border border-red-500/20 bg-red-500/5 backdrop-blur-xl p-8 mb-8">
                                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                    Critical Pollution Zones
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {analytics.criticalZones.map((zone, idx) => (
                                        <div key={zone.uid} className="rounded-2xl border border-border bg-background/50 p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="text-sm font-medium text-foreground truncate pr-2" style={{ maxWidth: '200px' }}>
                                                    {zone.station.name}
                                                </div>
                                                <span className="text-2xl font-bold font-mono text-red-600 dark:text-red-400">
                                                    {zone.aqi}
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {zone.lat.toFixed(3)}, {zone.lon.toFixed(3)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recommendation */}
                        <div className={`rounded-3xl border p-8 ${analytics.priority === 'P0' ? 'border-red-500/30 bg-red-500/10' :
                            analytics.priority === 'P1' ? 'border-orange-500/30 bg-orange-500/10' :
                                'border-primary/20 bg-primary/5'
                            }`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${analytics.priority === 'P0' ? 'bg-red-500 text-white' :
                                    analytics.priority === 'P1' ? 'bg-orange-500 text-white' :
                                        'bg-primary text-primary-foreground'
                                    }`}>
                                    {analytics.priority} PRIORITY
                                </div>
                                <h2 className="text-xl font-bold text-foreground">Recommended Action</h2>
                            </div>
                            <p className="text-foreground/90 leading-relaxed">
                                {analytics.recommendation}
                            </p>
                        </div>
                    </>
                )}

            </div>
        </main>
    );
}
