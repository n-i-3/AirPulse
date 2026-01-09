'use client';

import React, { useState, useEffect } from 'react';
import { Header } from "@/components/layout/Header";
import { AlertTriangle, MapPin, Flame, Wind, Factory, Car, Trash, TrendingUp, Users, Building2, ChevronRight } from "lucide-react";
import { BentoCard } from '@/components/dashboard/BentoCard';
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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

const sourceConfig = {
    industrial: { icon: Factory, label: 'Industrial', color: 'orange' },
    vehicular: { icon: Car, label: 'Vehicular', color: 'blue' },
    waste: { icon: Trash, label: 'Waste Burning', color: 'red' },
    construction: { icon: Building2, label: 'Construction', color: 'yellow' }
};

export default function WardDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedWard, setSelectedWard] = useState<string | null>(null);

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

    const getAQILevel = (aqi: number) => {
        if (aqi > 300) return { label: 'Hazardous', color: 'bg-red-500', textColor: 'text-red-500' };
        if (aqi > 200) return { label: 'Very Unhealthy', color: 'bg-orange-500', textColor: 'text-orange-500' };
        if (aqi > 150) return { label: 'Unhealthy', color: 'bg-yellow-500', textColor: 'text-yellow-500' };
        if (aqi > 100) return { label: 'Moderate', color: 'bg-lime-500', textColor: 'text-lime-500' };
        return { label: 'Good', color: 'bg-emerald-500', textColor: 'text-emerald-500' };
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-[#020617] text-white font-sans">
                <Header />
                <div className="flex items-center justify-center h-screen">
                    <div className="text-zinc-500 font-mono">Loading ward analysis...</div>
                </div>
            </main>
        );
    }

    if (!data) return null;

    return (
        <main className="min-h-screen bg-[#020617] text-white font-sans">
            <Header />

            <div className="mx-auto max-w-[1600px] px-6 py-8">

                {/* Professional Header */}
                <div className="mb-8 pb-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Ward-Level Source Attribution Analysis</h1>
                            <p className="text-zinc-400">Granular pollution source identification and mitigation strategies for Delhi NCR</p>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Last Updated</div>
                            <div className="text-sm font-mono text-white">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                    </div>
                </div>

                {/* Executive Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <BentoCard className="p-6 bg-zinc-900/60 border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                                <MapPin className="h-6 w-6 text-cyan-400" />
                            </div>
                            <div className="text-3xl font-bold font-mono text-white">{data.total_wards}</div>
                        </div>
                        <div className="text-sm text-zinc-400 relative z-10">Total Wards Analyzed</div>
                    </BentoCard>

                    <BentoCard className="p-6 bg-zinc-900/60 border-red-500/30 hover:border-red-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10 relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                <AlertTriangle className="h-6 w-6 text-red-400" />
                            </div>
                            <div className="text-3xl font-bold font-mono text-red-500">{data.critical_count}</div>
                        </div>
                        <div className="text-sm text-zinc-400 relative z-10">Critical Priority Zones</div>
                        <div className="text-xs text-red-400/60 mt-1 relative z-10">AQI &gt; 200</div>
                    </BentoCard>

                    <BentoCard className="p-6 bg-zinc-900/60 border-orange-500/30 hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                                <Flame className="h-6 w-6 text-orange-400" />
                            </div>
                            <div className="text-3xl font-bold font-mono text-orange-500">{data.regional_fires.total}</div>
                        </div>
                        <div className="text-sm text-zinc-400 relative z-10">Active Fire Incidents</div>
                        <div className="text-xs text-zinc-500 mt-1 relative z-10">{data.regional_fires.high_confidence} high confidence</div>
                    </BentoCard>

                    <BentoCard className="p-6 bg-zinc-900/60 border-blue-500/30 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <Wind className="h-6 w-6 text-blue-400" />
                            </div>
                            <div className="text-3xl font-bold font-mono text-white">{data.regional_weather.speed.toFixed(1)}</div>
                        </div>
                        <div className="text-sm text-zinc-400 relative z-10">Wind Speed (m/s)</div>
                        <div className="text-xs text-zinc-500 mt-1 uppercase relative z-10">{data.regional_weather.wind}</div>
                    </BentoCard>
                </div>

                {/* Ward Analysis Table */}
                <BentoCard className="overflow-hidden bg-zinc-900/60 border-cyan-500/30 relative shadow-lg shadow-cyan-500/5 hover:shadow-cyan-500/10 transition-all duration-500">
                    {/* Animated top border gradient */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-pulse opacity-60" />

                    {/* Table Header */}
                    <div className="bg-zinc-800/60 px-6 py-4 border-b border-cyan-500/20 relative">
                        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
                        <h2 className="text-lg font-bold text-white">Detailed Ward Analysis</h2>
                        <p className="text-sm text-zinc-400 mt-1">Click any ward to view comprehensive source attribution and recommendations</p>
                    </div>

                    {/* Professional Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10 bg-black/20">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ward Name</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">AQI Level</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Primary Sources</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">Priority</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {data.wards.map((ward, idx) => {
                                    const aqiLevel = getAQILevel(ward.aqi);
                                    const isExpanded = selectedWard === ward.ward;

                                    return (
                                        <React.Fragment key={idx}>
                                            <motion.tr
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: idx * 0.02 }}
                                                className={cn(
                                                    "hover:bg-white/5 transition-colors cursor-pointer",
                                                    isExpanded && "bg-cyan-500/5"
                                                )}
                                                onClick={() => setSelectedWard(isExpanded ? null : ward.ward)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <MapPin className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                                                        <span className="font-medium text-white">{ward.ward}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className={cn("h-2 w-2 rounded-full", aqiLevel.color)} />
                                                        <span className={cn("text-2xl font-bold font-mono", aqiLevel.textColor)}>{ward.aqi}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-xs text-zinc-400">{aqiLevel.label}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {ward.sources.slice(0, 3).map((source, i) => {
                                                            const config = sourceConfig[source.type.toLowerCase() as keyof typeof sourceConfig];
                                                            if (!config) return null;
                                                            const Icon = config.icon;
                                                            return (
                                                                <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10">
                                                                    <Icon className="h-3 w-3 text-zinc-400" />
                                                                    <span className="text-xs text-zinc-300 font-mono">{source.contribution}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={cn(
                                                        "inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase border",
                                                        ward.recommendations.priority === 'critical' && "bg-red-500/10 text-red-400 border-red-500/30",
                                                        ward.recommendations.priority === 'high' && "bg-orange-500/10 text-orange-400 border-orange-500/30",
                                                        ward.recommendations.priority === 'medium' && "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
                                                        ward.recommendations.priority === 'low' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                                    )}>
                                                        {ward.recommendations.priority}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
                                                        <ChevronRight className={cn(
                                                            "h-5 w-5 transition-transform",
                                                            isExpanded && "rotate-90"
                                                        )} />
                                                    </button>
                                                </td>
                                            </motion.tr>

                                            {/* Expanded Row */}
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={6} className="bg-black/40 border-t border-white/10">
                                                        <div className="p-8">
                                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                                                                {/* Health Advisory */}
                                                                <div className="lg:col-span-3 p-6 rounded-xl bg-red-500/5 border border-red-500/20">
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <AlertTriangle className="h-5 w-5 text-red-400" />
                                                                        <h3 className="font-bold text-red-400 uppercase tracking-wide text-sm">Health Advisory</h3>
                                                                    </div>
                                                                    <p className="text-zinc-200 leading-relaxed">{ward.recommendations.health_advisory}</p>
                                                                </div>

                                                                {/* Source Breakdown */}
                                                                <div>
                                                                    <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wide">Pollution Source Analysis</h3>
                                                                    <div className="space-y-3">
                                                                        {ward.sources.map((source, i) => {
                                                                            const config = sourceConfig[source.type.toLowerCase() as keyof typeof sourceConfig];
                                                                            if (!config) return null;
                                                                            const Icon = config.icon;
                                                                            return (
                                                                                <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                                                    <div className="flex items-center justify-between mb-2">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <Icon className="h-4 w-4 text-zinc-400" />
                                                                                            <span className="font-semibold text-white text-sm">{config.label}</span>
                                                                                        </div>
                                                                                        <span className="text-xs font-mono px-2 py-1 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                                                                            {source.contribution}
                                                                                        </span>
                                                                                    </div>
                                                                                    <p className="text-xs text-zinc-400 leading-relaxed">{source.details}</p>
                                                                                    <div className="text-xs text-zinc-600 mt-2 font-mono">Confidence: {source.confidence}</div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>

                                                                {/* Citizen Recommendations */}
                                                                <div>
                                                                    <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                                                                        <Users className="h-4 w-4 text-emerald-400" />
                                                                        For Citizens
                                                                    </h3>
                                                                    <div className="space-y-2">
                                                                        {ward.recommendations.for_citizens.map((rec, i) => (
                                                                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                                                                                <span className="text-sm text-zinc-300 leading-relaxed">{rec}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                {/* Government Recommendations */}
                                                                <div>
                                                                    <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                                                                        <Building2 className="h-4 w-4 text-blue-400" />
                                                                        For Authorities
                                                                    </h3>
                                                                    <div className="space-y-2">
                                                                        {ward.recommendations.for_government.map((rec, i) => (
                                                                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                                                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                                                                                <span className="text-sm text-zinc-300 leading-relaxed">{rec}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </BentoCard>
            </div>
        </main>
    );
}
