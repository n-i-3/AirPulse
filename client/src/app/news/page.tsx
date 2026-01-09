'use client';

import { useState, useEffect } from 'react';
import { Header } from "@/components/layout/Header";
import { AlertTriangle, TrendingUp, Activity, ChevronDown, ChevronUp, Zap, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { BentoCard } from '@/components/dashboard/BentoCard';
import { motion, AnimatePresence } from "framer-motion";

interface StationData {
    uid: number;
    lat: number;
    lon: number;
    aqi: string;
    station: {
        name: string;
        time: string;
    };
}

interface IntelItem {
    type: 'ALERT' | 'TREND' | 'CLUSTER' | 'ADVISORY';
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    timestamp: string;
    data?: any;
    details?: string[];
}

const severityConfig = {
    critical: {
        color: 'border-red-500/40 bg-red-950/20',
        textColor: 'text-red-400',
        icon: AlertTriangle,
        badge: 'bg-red-500/20 text-red-400 border-red-500/30'
    },
    high: {
        color: 'border-orange-500/40 bg-orange-950/20',
        textColor: 'text-orange-400',
        icon: Zap,
        badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    },
    medium: {
        color: 'border-yellow-500/40 bg-yellow-950/20',
        textColor: 'text-yellow-400',
        icon: Activity,
        badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    },
    low: {
        color: 'border-cyan-500/40 bg-cyan-950/20',
        textColor: 'text-cyan-400',
        icon: TrendingUp,
        badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
    }
};

export default function IntelPage() {
    const [intelFeed, setIntelFeed] = useState<IntelItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<string>('');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    useEffect(() => {
        fetchIntelligence();
        const interval = setInterval(fetchIntelligence, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchIntelligence = async () => {
        try {
            const lat1 = 28.4;
            const lng1 = 76.8;
            const lat2 = 28.9;
            const lng2 = 77.4;

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/aqi/bounds?lat1=${lat1}&lng1=${lng1}&lat2=${lat2}&lng2=${lng2}`);
            const data: StationData[] = await response.json();

            if (Array.isArray(data)) {
                const validStations = data.filter(s => s.aqi && s.aqi !== '-');
                const intelligence = analyzeStations(validStations);
                setIntelFeed(intelligence);
                setLastUpdate(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
            }
        } catch (err) {
            console.error('Intel fetch failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const analyzeStations = (stations: StationData[]): IntelItem[] => {
        const intel: IntelItem[] = [];
        const aqiValues = stations.map(s => parseInt(s.aqi)).filter(v => !isNaN(v));
        const avgAqi = aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length;

        // Critical zones alert
        const criticalStations = stations.filter(s => parseInt(s.aqi) > 200);
        if (criticalStations.length > 0) {
            intel.push({
                type: 'ALERT',
                title: `${criticalStations.length} Critical Pollution Zones Detected`,
                description: `Immediate action required in high-risk areas. AQI exceeds safe thresholds.`,
                severity: 'critical',
                timestamp: 'Now',
                data: criticalStations,
                details: criticalStations.map(s => `${s.station.name}: AQI ${s.aqi}`)
            });
        }

        // Average AQI assessment
        if (avgAqi > 150) {
            intel.push({
                type: 'ADVISORY',
                title: 'Delhi NCR Air Quality Deteriorating',
                description: `Average AQI: ${Math.round(avgAqi)} across ${stations.length} stations.`,
                severity: avgAqi > 200 ? 'critical' : 'high',
                timestamp: '2m ago',
                details: [
                    'Avoid prolonged outdoor activities',
                    'Use N95 or equivalent masks',
                    'Keep windows closed',
                    'Run air purifiers at maximum'
                ]
            });
        }

        // Geographic clustering
        const northStations = stations.filter(s => s.lat > 28.65);
        const southStations = stations.filter(s => s.lat < 28.55);
        const eastStations = stations.filter(s => s.lon > 77.25);
        const westStations = stations.filter(s => s.lon < 77.0);

        const zones = [
            { name: 'North Delhi', stations: northStations },
            { name: 'South Delhi', stations: southStations },
            { name: 'East Delhi', stations: eastStations },
            { name: 'West Delhi', stations: westStations },
        ];

        zones.forEach(zone => {
            if (zone.stations.length > 0) {
                const zoneAqis = zone.stations.map(s => parseInt(s.aqi)).filter(v => !isNaN(v));
                const zoneAvg = zoneAqis.reduce((a, b) => a + b, 0) / zoneAqis.length;

                if (zoneAvg > 150) {
                    intel.push({
                        type: 'CLUSTER',
                        title: `${zone.name} Pollution Cluster`,
                        description: `Average AQI: ${Math.round(zoneAvg)} | ${zone.stations.length} affected stations`,
                        severity: zoneAvg > 200 ? 'high' : 'medium',
                        timestamp: '5m ago',
                        details: zone.stations.slice(0, 5).map(s => `${s.station.name}: ${s.aqi}`)
                    });
                }
            }
        });

        // Trend analysis
        if (avgAqi > 100) {
            intel.push({
                type: 'TREND',
                title: 'Elevated Pollution Levels Persist',
                description: `Delhi NCR experiencing sustained poor air quality.`,
                severity: 'medium',
                timestamp: '15m ago',
                details: [
                    `Current average: ${Math.round(avgAqi)} AQI`,
                    `${stations.length} active monitoring stations`,
                    'Weather conditions unfavorable for dispersion'
                ]
            });
        }

        return intel;
    };

    return (
        <main className="min-h-screen bg-[#020617] text-white font-sans selection:bg-primary/30 relative overflow-x-hidden">
            <Header />

            <div className="mx-auto max-w-[1600px] px-6 py-8">

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                                    <Zap className="h-8 w-8 text-cyan-400" />
                                </div>
                                Intelligence Feed
                            </h1>
                            <p className="text-zinc-400">Real-time alerts and insights from satellite + ground sensors</p>
                        </div>
                        {lastUpdate && (
                            <div className="text-sm text-zinc-500 flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Last updated: {lastUpdate}
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <BentoCard className="p-4 border-red-500/30 hover:border-red-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10 relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                        <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2 relative z-10">Active Alerts</div>
                        <div className="text-3xl font-bold text-red-500 font-mono relative z-10">
                            {intelFeed.filter(i => i.severity === 'critical' || i.severity === 'high').length}
                        </div>
                    </BentoCard>

                    <BentoCard className="p-4 border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                        <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2 relative z-10">Total Insights</div>
                        <div className="text-3xl font-bold text-white font-mono relative z-10">{intelFeed.length}</div>
                    </BentoCard>

                    <BentoCard className="p-4 border-emerald-500/30 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                        <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2 relative z-10">System Status</div>
                        <div className="flex items-center gap-2 relative z-10">
                            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-sm text-emerald-500 font-mono">OPERATIONAL</span>
                        </div>
                    </BentoCard>
                </div>

                {/* Intel Feed */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-zinc-500 font-mono animate-pulse">Analyzing data streams...</div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {intelFeed.map((item, index) => {
                            const config = severityConfig[item.severity];
                            const Icon = config.icon;
                            const isExpanded = expandedId === index;

                            return (
                                <motion.div
                                    key={index}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
                                >
                                    <div
                                        className={cn(
                                            "relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-all duration-300",
                                            "bg-zinc-900/60 backdrop-blur-xl border hover:scale-[1.01]",
                                            config.color,
                                            isExpanded && "ring-2 ring-cyan-500/30"
                                        )}
                                        onClick={() => setExpandedId(isExpanded ? null : index)}
                                    >
                                        {/* Glow effect on hover */}
                                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

                                        {/* Card Header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-start gap-4 flex-1">
                                                {/* Icon with animated background */}
                                                <div className={cn(
                                                    "relative p-3 rounded-xl border transition-all duration-300",
                                                    config.badge,
                                                    isExpanded && "scale-110"
                                                )}>
                                                    <Icon className="h-6 w-6 relative z-10" />
                                                    <div className={cn(
                                                        "absolute inset-0 rounded-xl blur-xl opacity-50",
                                                        item.severity === 'critical' && "bg-red-500",
                                                        item.severity === 'high' && "bg-orange-500",
                                                        item.severity === 'medium' && "bg-yellow-500",
                                                        item.severity === 'low' && "bg-cyan-500"
                                                    )} />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    {/* Badges */}
                                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                        <span className={cn(
                                                            "text-xs font-mono uppercase px-3 py-1 rounded-full border font-bold",
                                                            config.badge
                                                        )}>
                                                            {item.type}
                                                        </span>
                                                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {item.timestamp}
                                                        </span>
                                                    </div>

                                                    {/* Title */}
                                                    <h3 className={cn(
                                                        "text-xl font-bold mb-2 transition-colors",
                                                        config.textColor
                                                    )}>
                                                        {item.title}
                                                    </h3>

                                                    {/* Description */}
                                                    <p className="text-sm text-zinc-300 leading-relaxed">
                                                        {item.description}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Expand Button */}
                                            <button
                                                className={cn(
                                                    "p-2 rounded-lg transition-all duration-300",
                                                    "hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20",
                                                    isExpanded && "bg-cyan-500/20 border-cyan-500/30"
                                                )}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setExpandedId(isExpanded ? null : index);
                                                }}
                                            >
                                                <motion.div
                                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <ChevronDown className={cn(
                                                        "h-5 w-5 transition-colors",
                                                        isExpanded ? "text-cyan-400" : "text-zinc-400"
                                                    )} />
                                                </motion.div>
                                            </button>
                                        </div>

                                        {/* Expanded Details */}
                                        <AnimatePresence>
                                            {isExpanded && item.details && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                                    animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                                                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                    className="pt-4 border-t border-cyan-500/20"
                                                >
                                                    <div className="ml-[4.5rem]">
                                                        <h4 className="text-sm font-bold text-zinc-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                                            <div className="h-1 w-1 rounded-full bg-cyan-500 animate-pulse" />
                                                            Detailed Analysis
                                                        </h4>
                                                        {/* Scrollable container with max height */}
                                                        <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                                                {item.details.map((detail, i) => (
                                                                    <motion.div
                                                                        key={i}
                                                                        initial={{ opacity: 0, x: -10 }}
                                                                        animate={{ opacity: 1, x: 0 }}
                                                                        transition={{ delay: i * 0.03 }}
                                                                        className={cn(
                                                                            "flex items-start gap-2 p-3 rounded-lg",
                                                                            "bg-gradient-to-br from-cyan-500/5 to-transparent",
                                                                            "border border-cyan-500/10 hover:border-cyan-500/20 transition-all"
                                                                        )}
                                                                    >
                                                                        <div className="mt-1 flex-shrink-0">
                                                                            <div className="h-1 w-1 rounded-full bg-cyan-400" />
                                                                        </div>
                                                                        <span className="text-xs text-zinc-200 flex-1 leading-relaxed">
                                                                            {detail}
                                                                        </span>
                                                                    </motion.div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
