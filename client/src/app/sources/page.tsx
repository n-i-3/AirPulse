'use client';

import { useState, useEffect } from 'react';
import { Header } from "@/components/layout/Header";
import { Target, AlertTriangle, Users, Building2, ChevronDown, ChevronUp, MapPin, Clock } from "lucide-react";

interface WardData {
    ward: string;
    lat: number;
    lon: number;
    aqi: number;
    level: string;
    sources: Array<{
        type: string;
        contribution: string;
        details: string;
        confidence: string;
    }>;
    recommendations: {
        for_citizens: string[];
        for_government: string[];
        health_advisory: string;
        priority: string;
    };
    last_updated: string;
}

interface DashboardData {
    total_wards: number;
    critical_count: number;
    wards: WardData[];
    regional_weather: {
        wind: string;
        speed: number;
        factors: Array<{ factor: string; impact: string; description: string }>;
    };
    regional_fires: {
        total: number;
        high_confidence: number;
    };
}

export default function WardDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedWard, setExpandedWard] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/sources/wards?lat1=28.4&lng1=76.8&lat2=28.9&lng2=77.4`);
            const result = await response.json();
            setData(result);
        } catch (err) {
            console.error('Failed to fetch ward data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'bg-red-500 text-white';
            case 'high': return 'bg-orange-500 text-white';
            case 'medium': return 'bg-yellow-500 text-black';
            default: return 'bg-green-500 text-white';
        }
    };

    const getAQIColor = (aqi: number) => {
        if (aqi > 300) return 'bg-red-900/90 text-white border-red-500 shadow-red-500/20';
        if (aqi > 200) return 'bg-red-700/90 text-white border-red-500 shadow-red-500/20';
        if (aqi > 150) return 'bg-orange-600/90 text-white border-orange-400 shadow-orange-500/20';
        if (aqi > 100) return 'bg-yellow-500/90 text-white border-yellow-400 shadow-yellow-500/20';
        return 'bg-green-600/90 text-white border-green-500 shadow-green-500/20';
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-transparent text-foreground font-sans">
                <Header />
                <div className="flex items-center justify-center h-screen">
                    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </main>
        );
    }

    if (!data) return null;

    return (
        <main className="min-h-screen bg-transparent text-foreground font-sans">
            <Header />
            <div className="mx-auto max-w-screen-2xl px-4 py-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                            <Target className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground tracking-tight">Ward-Wise Pollution Action Dashboard</h1>
                            <p className="text-muted-foreground text-sm">Real-time source attribution & actionable recommendations</p>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="rounded-2xl glass-card p-4">
                        <div className="text-xs text-muted-foreground mb-1">Total Wards</div>
                        <div className="text-3xl font-bold text-foreground">{data.total_wards}</div>
                    </div>
                    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 backdrop-blur-xl p-4">
                        <div className="text-xs text-red-500 dark:text-red-300 mb-1">Critical Zones</div>
                        <div className="text-3xl font-bold text-red-600 dark:text-red-400">{data.critical_count}</div>
                        <div className="text-[10px] text-red-500/80 dark:text-red-300 mt-1">AQI &gt; 200</div>
                    </div>
                    <div className="rounded-2xl glass-card p-4">
                        <div className="text-xs text-muted-foreground mb-1">Active Fires</div>
                        <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{data.regional_fires.total}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">{data.regional_fires.high_confidence} high confidence</div>
                    </div>
                    <div className="rounded-2xl glass-card p-4">
                        <div className="text-xs text-muted-foreground mb-1">Wind Conditions</div>
                        <div className="text-2xl font-bold text-foreground">{data.regional_weather.speed.toFixed(1)} m/s</div>
                        <div className="text-[10px] text-muted-foreground mt-1">{data.regional_weather.wind}</div>
                    </div>
                </div>

                {/* Ward Table */}
                <div className="rounded-3xl glass-card overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <h2 className="text-xl font-bold text-foreground">Ward-Level Analysis</h2>
                        <p className="text-sm text-muted-foreground mt-1">Click any ward for detailed recommendations</p>
                    </div>

                    <div className="divide-y divide-border">
                        {data.wards.map((ward, idx) => (
                            <div key={idx} className="hover:bg-muted/30 transition-colors">
                                {/* Ward Row */}
                                <div
                                    className="p-4 cursor-pointer flex items-center justify-between"
                                    onClick={() => setExpandedWard(expandedWard === ward.ward ? null : ward.ward)}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="text-xl font-bold text-muted-foreground/40 w-8">{idx + 1}</div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-bold text-foreground">{ward.ward}</h3>
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${getPriorityColor(ward.recommendations.priority)}`}>
                                                    {ward.recommendations.priority.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="text-sm text-muted-foreground mt-1">{ward.level}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className={`px-6 py-3 rounded-xl border-2 shadow-lg ${getAQIColor(ward.aqi)}`}>
                                            <div className="text-xs opacity-90 mb-1 font-medium">AQI</div>
                                            <div className="text-3xl font-bold">{ward.aqi}</div>
                                        </div>
                                        <div className="text-muted-foreground">
                                            {expandedWard === ward.ward ? <ChevronUp /> : <ChevronDown />}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {expandedWard === ward.ward && (
                                    <div className="p-6 bg-muted/40 border-t border-border shadow-inner">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                            {/* Sources */}
                                            <div>
                                                <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-primary" />
                                                    Pollution Sources
                                                </h4>
                                                <div className="space-y-2">
                                                    {ward.sources.map((source, sidx) => (
                                                        <div key={sidx} className="rounded-lg bg-background/50 border border-border p-3">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className="text-sm font-medium text-foreground capitalize">
                                                                    {source.type.replace('_', ' ')}
                                                                </span>
                                                                <span className={`text-xs px-2 py-0.5 rounded ${source.contribution === 'high' ? 'bg-red-500 text-white' :
                                                                    source.contribution === 'medium' ? 'bg-yellow-500 text-black' :
                                                                        'bg-green-500 text-white'
                                                                    }`}>
                                                                    {source.contribution}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">{source.details}</p>
                                                            <div className="text-[10px] text-muted-foreground/60 mt-1">Confidence: {source.confidence}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Recommendations */}
                                            <div>
                                                <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4 text-primary" />
                                                    Action Plan
                                                </h4>

                                                {/* Health Advisory */}
                                                <div className={`rounded-lg p-3 mb-3 ${ward.recommendations.priority === 'critical' ? 'bg-red-500/10 border border-red-500/20' :
                                                    ward.recommendations.priority === 'high' ? 'bg-orange-500/10 border border-orange-500/20' :
                                                        'bg-primary/5 border border-primary/10'
                                                    }`}>
                                                    <div className="text-xs font-bold text-foreground/80 mb-1">HEALTH ADVISORY</div>
                                                    <div className="text-sm text-foreground">{ward.recommendations.health_advisory}</div>
                                                </div>

                                                {/* Action Items */}
                                                <div className="space-y-4">
                                                    <div>
                                                        <span className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Data-Driven Recommendations</span>
                                                        <div className="space-y-2">
                                                            {ward.recommendations.for_citizens.map((item, ridx) => (
                                                                <div key={`cit-${ridx}`} className="text-sm text-muted-foreground flex items-start gap-2">
                                                                    <span className="text-primary mt-1">•</span>
                                                                    <span>{item}</span>
                                                                </div>
                                                            ))}
                                                            {ward.recommendations.for_government.map((item, ridx) => (
                                                                <div key={`gov-${ridx}`} className="text-sm text-muted-foreground flex items-start gap-2">
                                                                    <span className="text-blue-500 mt-1">•</span>
                                                                    <span>{item}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </main>
    );
}
