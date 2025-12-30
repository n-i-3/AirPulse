'use client';

import { useState, useEffect } from 'react';
import { Header } from "@/components/layout/Header";
import dynamic from 'next/dynamic';
import { Activity, Wind, AlertTriangle, Users, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import wardsData from '@/data/wards.json';

// Dynamically import the Map to avoid SSR issues
const StatsMap = dynamic(() => import('@/components/map/StatsMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center text-primary/50 text-xs font-mono">Loading Geospatial Engine...</div>
});

const ModernCard = ({ title, children, className, icon: Icon, trend }: { title: string, children: React.ReactNode, className?: string, icon?: any, trend?: string }) => (
  <div className={cn(
    "group relative flex flex-col gap-3 rounded-2xl glass-card p-5 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5",
    className
  )}>
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="h-4 w-4 text-primary/80" />}
        <span className="text-xs font-medium uppercase tracking-wider font-sans">{title}</span>
      </div>
      {trend && <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-600 dark:text-green-500 font-mono">{trend}</span>}
    </div>

    {/* Content */}
    <div className="flex-1">
      {children}
    </div>

    {/* Shine Effect */}
    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-2xl" />
  </div>
);

export default function Home() {
  const [avgAqi, setAvgAqi] = useState<number>(0);
  const [criticalZones, setCriticalZones] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      console.log('📊 Fetching dashboard metrics...');
      const features = (wardsData as any).features;
      const wardAqis: { [key: string]: number } = {};

      // Fetch AQI for all wards
      for (const feature of features) {
        const wardId = feature.properties.id;
        const wardName = feature.properties.name;
        const coords = feature.geometry.coordinates[0][0];
        const lng = coords[0];
        const lat = coords[1];

        try {
          const response = await fetch(`http://localhost:5000/api/aqi?lat=${lat}&lng=${lng}`);
          const data = await response.json();

          if (data && data.aqi) {
            wardAqis[wardName] = data.aqi;
          }
        } catch (err) {
          console.error(`Failed to fetch AQI for ${wardName}:`, err);
        }
      }

      // Calculate average AQI
      const aqiValues = Object.values(wardAqis);
      const average = aqiValues.reduce((sum, val) => sum + val, 0) / aqiValues.length;
      setAvgAqi(Math.round(average));

      // Find critical zones (AQI > 200)
      const critical = Object.entries(wardAqis)
        .filter(([_, aqi]) => aqi > 200)
        .map(([name, _]) => name)
        .slice(0, 3); // Limit to top 3

      setCriticalZones(critical);
      setLoading(false);
      console.log('✅ Dashboard data loaded:', { avgAqi: Math.round(average), criticalZones: critical });
    };

    fetchDashboardData();
  }, []);

  const getAqiLevel = (aqi: number) => {
    if (aqi > 300) return 'Hazardous';
    if (aqi > 200) return 'Very Unhealthy';
    if (aqi > 150) return 'Unhealthy';
    if (aqi > 100) return 'Moderate';
    if (aqi > 50) return 'Good';
    return 'Excellent';
  };

  return (
    <main className="min-h-screen bg-transparent text-foreground font-sans">
      <Header />
      <div className="mx-auto max-w-screen-2xl px-4 py-2 pb-10">

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <ModernCard title="Avg AQI (Delhi)" icon={Wind} trend="Live">
            <div className="flex items-end gap-3 mt-1">
              {loading ? (
                <span className="text-4xl font-bold tracking-tighter text-foreground animate-pulse">---</span>
              ) : (
                <>
                  <span className="text-4xl font-bold tracking-tighter text-foreground">{avgAqi}</span>
                  <span className="mb-1 text-sm text-muted-foreground font-medium">{getAqiLevel(avgAqi)}</span>
                </>
              )}
            </div>
            {/* Mini Chart Line */}
            <div className="mt-4 flex gap-0.5 h-8 items-end opacity-50">
              {[40, 60, 45, 70, 80, 50, 60, 75, 50, 40].map((h, i) => (
                <div key={i} className="flex-1 bg-primary rounded-t-sm" style={{ height: `${h}%` }} />
              ))}
            </div>
          </ModernCard>

          <ModernCard title="Active Reporters" icon={Users} trend="+14 Active">
            <div className="flex items-end gap-3 mt-1">
              <span className="text-4xl font-bold tracking-tighter text-foreground">1,203</span>
              <div className="flex -space-x-2 mb-1">
                {[1, 2, 3].map(i => <div key={i} className="h-6 w-6 rounded-full border border-background bg-zinc-800" />)}
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground font-medium">
              Verified Citizens contributing real-time data.
            </div>
          </ModernCard>

          <ModernCard title="Critical Zones" icon={AlertTriangle} className={criticalZones.length > 0 ? "border-red-500/30 bg-red-500/10" : ""}>
            <div className="flex items-end gap-3 mt-1">
              {loading ? (
                <span className="text-4xl font-bold tracking-tighter text-foreground animate-pulse">--</span>
              ) : (
                <>
                  <span className="text-4xl font-bold tracking-tighter text-foreground">{criticalZones.length.toString().padStart(2, '0')}</span>
                  <span className="mb-1 text-sm text-red-500 dark:text-red-400 font-medium">Require Mitigation</span>
                </>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-mono uppercase">
              {loading ? (
                <span className="px-2 py-1 rounded bg-muted/20 text-muted-foreground">Loading...</span>
              ) : criticalZones.length > 0 ? (
                criticalZones.map((zone, i) => (
                  <span key={i} className="px-2 py-1 rounded bg-red-500/10 text-red-600 dark:text-red-200 border border-red-500/20">{zone}</span>
                ))
              ) : (
                <span className="px-2 py-1 rounded bg-green-500/20 text-green-600 dark:text-green-200 border border-green-500/20">All Clear</span>
              )}
            </div>
          </ModernCard>

          <ModernCard title="AI Confidence" icon={Activity} trend="High">
            <div className="flex items-end gap-3 mt-1">
              <span className="text-4xl font-bold tracking-tighter text-foreground">89.4%</span>
            </div>
            <div className="mt-4 w-full bg-muted/20 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-purple-500 h-full w-[89%]" />
            </div>
            <div className="mt-2 text-[10px] text-muted-foreground flex justify-between font-mono">
              <span>MODEL: TF_V2.1</span>
              <span>NXT_UPDATE: 22m</span>
            </div>
          </ModernCard>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[700px]">

          {/* Map Module */}
          <div className="lg:col-span-8 h-full rounded-3xl glass-card overflow-hidden relative shadow-2xl">
            {/* Map Overlay Stats */}
            <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 pointer-events-none">
              <div className="bg-background/90 backdrop-blur-md border border-border rounded-lg px-3 py-2 text-foreground shadow-lg">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Live Feed</span>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-bold font-mono">DELHI_NCR_GRID</span>
                </div>
              </div>
            </div>

            <div className="h-full w-full">
              <StatsMap />
            </div>
          </div>

          {/* Right Sidebar - Intel */}
          <div className="lg:col-span-4 flex flex-col gap-4 h-full">

            {/* AI Advisor - Glass Card */}
            <div className="flex-1 rounded-3xl border border-primary/20 bg-gradient-to-b from-primary/10 to-transparent p-6 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4 text-primary">
                <Activity className="h-5 w-5" />
                <h3 className="font-bold tracking-tight">AI Advisory</h3>
              </div>

              <div className="space-y-4 relative z-10">
                {loading ? (
                  <h4 className="text-2xl font-medium leading-tight text-foreground animate-pulse">
                    Analyzing real-time data...
                  </h4>
                ) : avgAqi > 200 ? (
                  <>
                    <h4 className="text-2xl font-medium leading-tight text-foreground">
                      Critical pollution levels detected. Average AQI: <span className="text-primary font-bold">{avgAqi}</span>.
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Current readings indicate hazardous air quality across {criticalZones.length} zones.
                      Immediate action required to protect public health.
                    </p>
                  </>
                ) : avgAqi > 150 ? (
                  <>
                    <h4 className="text-2xl font-medium leading-tight text-foreground">
                      Elevated pollution levels. Average AQI: <span className="text-primary font-bold">{avgAqi}</span>.
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Air quality is unhealthy for sensitive groups. Recommend limiting outdoor exposure.
                    </p>
                  </>
                ) : (
                  <>
                    <h4 className="text-2xl font-medium leading-tight text-foreground">
                      Air quality within acceptable range. Average AQI: <span className="text-primary font-bold">{avgAqi}</span>.
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Continue monitoring. No immediate action required.
                    </p>
                  </>
                )}

                <div className="mt-4 p-4 rounded-xl bg-background/40 border border-border backdrop-blur-sm">
                  <div className="flex justify-between items-center text-xs font-mono mb-2 text-muted-foreground uppercase">
                    <span>Suggested Action</span>
                    <span>Priority: {avgAqi > 200 ? 'P0' : avgAqi > 150 ? 'P1' : 'P2'}</span>
                  </div>
                  <div className="text-sm font-medium text-foreground flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                    {avgAqi > 200 ? 'Initiate GRAP-IV Protocol' : avgAqi > 150 ? 'Initiate GRAP-III Protocol' : 'Monitoring Mode Active'}
                  </div>
                </div>
              </div>

              {/* Background decoration */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl opacity-50" />
            </div>

            {/* Recent Reports - Clean List */}
            <div className="flex-1 rounded-3xl glass-card p-6">
              <h3 className="font-bold tracking-tight mb-4 flex items-center justify-between">
                <span className="text-foreground">Verified Reports</span>
                <span className="text-xs font-normal text-muted-foreground bg-muted/10 px-2 py-1 rounded-full">Real-time</span>
              </h3>

              <div className="space-y-3 overflow-y-auto max-h-[250px] pr-2 scrollbar-none">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="group flex gap-4 items-start p-3 rounded-2xl hover:bg-muted/30 transition-colors border border-transparent hover:border-border cursor-pointer">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
                    <div>
                      <h5 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Illegal Waste Burning</h5>
                      <p className="text-xs text-muted-foreground mt-0.5">Reported 2m ago from Punjabi Bagh</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-mono bg-muted/10 px-1.5 py-0.5 rounded text-muted-foreground">Hash: 0x82...9f</span>
                        <span className="text-[10px] font-mono text-green-500 flex items-center gap-1">
                          <ShieldCheck className="h-2 w-2" /> Verified
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
