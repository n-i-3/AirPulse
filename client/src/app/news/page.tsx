'use client';

import { useState, useEffect } from 'react';
import { Header } from "@/components/layout/Header";
import { Newspaper, AlertTriangle, TrendingUp, MapPin, Activity, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

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
}

export default function IntelPage() {
    const [intelFeed, setIntelFeed] = useState<IntelItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<string>('');

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

            const response = await fetch(`http://localhost:5000/api/aqi/bounds?lat1=${lat1}&lng1=${lng1}&lat2=${lat2}&lng2=${lng2}`);
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
                description: `Immediate action required. Stations: ${criticalStations.slice(0, 3).map(s => s.station.name).join(', ')}${criticalStations.length > 3 ? ` and ${criticalStations.length - 3} more` : ''}.`,
                severity: 'critical',
                timestamp: 'Now',
                data: criticalStations
            });
        }

        // Average AQI assessment
        if (avgAqi > 150) {
            intel.push({
                type: 'ADVISORY',
                title: 'Delhi NCR Air Quality Deteriorating',
                description: `Average AQI across ${stations.length} monitoring stations is ${Math.round(avgAqi)}. Recommend limiting outdoor activities and using N95 masks.`,
                severity: avgAqi > 200 ? 'critical' : 'high',
                timestamp: '2m ago'
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
            { name: 'West Delhi', stations: westStations }
        ];

        zones.forEach(zone => {
            if (zone.stations.length > 0) {
                const zoneAvg = zone.stations.reduce((sum, s) => sum + parseInt(s.aqi), 0) / zone.stations.length;
                if (zoneAvg > 180) {
                    intel.push({
                        type: 'CLUSTER',
                        title: `${zone.name} Shows Elevated Pollution Levels`,
                        description: `Regional average AQI: ${Math.round(zoneAvg)}. ${zone.stations.length} active monitoring stations in this zone.`,
                        severity: zoneAvg > 200 ? 'high' : 'medium',
                        timestamp: '5m ago'
                    });
                }
            }
        });

        // AQI variance analysis
        const maxAqi = Math.max(...aqiValues);
        const minAqi = Math.min(...aqiValues);
        if ((maxAqi - minAqi) > 150) {
            intel.push({
                type: 'TREND',
                title: 'High Spatial Variance Detected',
                description: `AQI ranges from ${minAqi} to ${maxAqi} across Delhi NCR. Significant localized pollution sources identified.`,
                severity: 'medium',
                timestamp: '8m ago'
            });
        }

        // Worst stations highlight
        const worst = stations.sort((a, b) => parseInt(b.aqi) - parseInt(a.aqi)).slice(0, 5);
        intel.push({
            type: 'TREND',
            title: 'Top 5 Polluted Areas',
            description: worst.map(s => `${s.station.name} (${s.aqi})`).join(', '),
            severity: 'medium',
            timestamp: '12m ago',
            data: worst
        });

        return intel;
    };

    const getSeverityStyle = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'border-red-500/30 bg-red-500/10';
            case 'high':
                return 'border-orange-500/30 bg-orange-500/10';
            case 'medium':
                return 'border-yellow-500/30 bg-yellow-500/10';
            default:
                return 'border-blue-500/30 bg-blue-500/10';
        }
    };

    const getSeverityBadge = (severity: string) => {
        const styles = {
            critical: 'bg-red-500 text-white',
            high: 'bg-orange-500 text-white',
            medium: 'bg-yellow-500 text-black',
            low: 'bg-blue-500 text-white'
        };
        return styles[severity as keyof typeof styles];
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'ALERT': return AlertTriangle;
            case 'TREND': return TrendingUp;
            case 'CLUSTER': return MapPin;
            case 'ADVISORY': return Activity;
            default: return Newspaper;
        }
    };

    return (
        <main className="min-h-screen bg-transparent text-foreground font-sans selection:bg-primary/20 selection:text-primary">
            <Header />
            <div className="mx-auto max-w-screen-xl px-4 py-8">

                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                        <Newspaper className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">Intelligence Feed</h1>
                        <p className="text-muted-foreground text-sm">Real-time pollution intelligence and threat analysis</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-mono text-green-500">LIVE {lastUpdate && `• ${lastUpdate}`}</span>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-muted-foreground font-mono animate-pulse">Aggregating intelligence sources...</div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {intelFeed.map((item, index) => {
                            const Icon = getIcon(item.type);
                            return (
                                <div
                                    key={index}
                                    className={cn(
                                        "group relative rounded-2xl border backdrop-blur-xl p-6 transition-all duration-300 hover:shadow-2xl glass-card",
                                        getSeverityStyle(item.severity)
                                    )}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-2 rounded-lg",
                                                item.severity === 'critical' ? 'bg-red-500/20' :
                                                    item.severity === 'high' ? 'bg-orange-500/20' :
                                                        'bg-primary/20'
                                            )}>
                                                <Icon className={cn(
                                                    "h-5 w-5",
                                                    item.severity === 'critical' ? 'text-red-500' :
                                                        item.severity === 'high' ? 'text-orange-500' :
                                                            'text-primary'
                                                )} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase",
                                                        getSeverityBadge(item.severity)
                                                    )}>
                                                        {item.type}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {item.timestamp}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold text-foreground">
                                                    {item.title}
                                                </h3>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-sm text-foreground/80 leading-relaxed">
                                        {item.description}
                                    </p>

                                    {item.data && Array.isArray(item.data) && item.data.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-border">
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                {item.data.slice(0, 6).map((station: StationData, idx: number) => (
                                                    <div key={idx} className="text-xs font-mono bg-background/50 rounded px-2 py-1 flex justify-between border border-border/50">
                                                        <span className="text-muted-foreground truncate pr-2">{station.station.name}</span>
                                                        <span className="text-primary font-bold">{station.aqi}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>
        </main>
    );
}
