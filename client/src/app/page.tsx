'use client';

import { useState, useEffect, useRef } from 'react';
import { Header } from "@/components/layout/Header";
import dynamic from 'next/dynamic';
import { Activity, Wind, AlertTriangle, Users, ShieldCheck, Map as MapIcon, Zap, Globe, Cpu, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import wardsData from '@/data/wards.json';
import { BentoCard } from "@/components/dashboard/BentoCard";
import { AtmosphereBackground } from "@/components/dashboard/AtmosphereBackground";
import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/dashboard/AnimatedCounter";

// Dynamically import the Map
const StatsMap = dynamic(() => import('@/components/map/StatsMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-primary/50 text-xs font-mono bg-zinc-900/50">
      <div className="flex flex-col items-center gap-2">
        <div className="h-4 w-4 bg-primary animate-ping rounded-full" />
        <span>INITIALIZING GEOSPATIAL CORE...</span>
      </div>
    </div>
  )
});

export default function Home() {
  const [avgAqi, setAvgAqi] = useState<number>(0);
  const [criticalZones, setCriticalZones] = useState<string[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemConfidence, setSystemConfidence] = useState<number>(0);
  const [activeStations, setActiveStations] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mouse tracking for spotlight effect
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const cards = containerRef.current.getElementsByClassName("group");
      for (const card of cards as any) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch dashboard summary with live data
        const summaryRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/dashboard/summary`);
        const summaryData = await summaryRes.json();

        if (summaryData.avgAqi !== undefined) {
          setAvgAqi(summaryData.avgAqi);
          setCriticalZones(summaryData.criticalZones || []);
          setSystemConfidence(summaryData.systemConfidence || 0);
          setActiveStations(summaryData.activeStations || 0);
        }

        // Fetch reports
        const reportsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reports`);
        const reportsData = await reportsRes.json();
        if (Array.isArray(reportsData)) {
          setReports(reportsData);
        }
      } catch (e) {
        console.error("Failed to fetch dashboard data", e);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getAqiColor = (aqi: number) => {
    if (aqi > 200) return "text-red-500";
    if (aqi > 100) return "text-yellow-500";
    return "text-emerald-500";
  };

  return (
    <main ref={containerRef} className="min-h-screen bg-[#020617] text-white font-sans selection:bg-primary/30 relative overflow-x-hidden">
      <AtmosphereBackground />
      <Header />

      <div className="mx-auto max-w-[1600px] px-6 py-8 pb-10">

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {/* Average AQI */}
          <BentoCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <Activity className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Delhi NCR AQI</div>
            </div>
            <AnimatedCounter
              value={avgAqi || 0}
              className="text-4xl font-bold text-white font-mono mb-2 block"
            />
            <div className="text-xs text-zinc-400">
              Live average across {activeStations} stations
            </div>
          </BentoCard>

          {/* Verified Reports */}
          <BentoCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Verified Reports</div>
            </div>
            <AnimatedCounter
              value={reports.length || 0}
              className="text-4xl font-bold text-emerald-500 font-mono mb-2 block"
            />
            <div className="text-xs text-zinc-400">
              Citizen pollution reports on-chain
            </div>
          </BentoCard>

          {/* Critical Zones */}
          <BentoCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Critical Zones</div>
            </div>
            <AnimatedCounter
              value={criticalZones.length || 0}
              className="text-4xl font-bold text-red-500 font-mono mb-2 block"
            />
            <div className="text-xs text-zinc-400">
              Areas with AQI &gt; 200 requiring immediate action
            </div>
          </BentoCard>

          {/* System Confidence */}
          <BentoCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-medium">System Confidence</div>
            </div>
            <div className="text-4xl font-bold text-white font-mono mb-3 block">
              {systemConfidence}%
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-2 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                style={{ width: `${systemConfidence}%` }}
              />
            </div>
            <div className="text-xs text-zinc-400">
              Data accuracy and source reliability
            </div>
          </BentoCard>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">

          {/* Main Map - Hero - Span 8cols */}
          <div className="lg:col-span-8 h-full rounded-2xl overflow-hidden border-2 border-cyan-500/30 bg-zinc-900/80 relative shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:shadow-[0_0_40px_rgba(6,182,212,0.25)] transition-all duration-300">
            <div className="h-full w-full relative z-0">
              <StatsMap />
            </div>
          </div>

          {/* Right Sidebar - Intel */}
          <div className="lg:col-span-4 flex flex-col gap-6 h-full">

            {/* System Intelligence Panel */}
            <BentoCard className="p-6 flex-1 relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white">System Intelligence</h3>
                </div>
                <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] text-emerald-500 font-mono tracking-wider font-bold">LIVE STREAM</span>
                </div>
              </div>

              {/* Intelligence Feed */}
              <div className="space-y-4 overflow-y-auto max-h-[500px] custom-scrollbar pr-1">
                {/* Grid Update */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-start gap-3">
                    <Globe className="h-4 w-4 text-zinc-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono text-zinc-500">SYSTEM_UPDATE</span>
                        <span className="text-[10px] text-zinc-600 font-mono">Just now</span>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        Monitoring active across <span className="font-mono text-white font-medium">{activeStations} stations</span>.
                        Network latency: <span className="text-emerald-400 font-mono">12ms</span>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Atmospheric Conditions */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-start gap-3">
                    <Activity className={cn(
                      "h-4 w-4 mt-0.5",
                      avgAqi > 200 ? "text-red-400" : avgAqi > 100 ? "text-yellow-400" : "text-emerald-400"
                    )} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                          "text-xs font-mono font-medium",
                          avgAqi > 200 ? "text-red-400" : avgAqi > 100 ? "text-yellow-400" : "text-emerald-400"
                        )}>
                          ATMOSPHERIC_STATUS: {avgAqi > 200 ? "CRITICAL" : avgAqi > 100 ? "DEGRADED" : "OPTIMAL"}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {avgAqi > 200
                          ? `Hazardous PM2.5 levels detected. Health advisory protocols active.`
                          : avgAqi > 100
                            ? `Moderate pollution levels observed. Sensitive groups should exercise caution.`
                            : `Air quality indices are within standard safety parameters.`
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Warning Alert */}
                {criticalZones.length > 0 && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 animate-pulse" />
                      <div className="flex-1">
                        <div className="text-xs font-bold text-red-400 font-mono mb-2">CRITICAL_ZONES_DETECTED</div>
                        <div className="flex flex-wrap gap-2">
                          {criticalZones.slice(0, 4).map((zone: any, i) => (
                            <span key={i} className="px-2 py-1 rounded bg-red-950/50 text-red-200 text-xs font-medium border border-red-500/20">
                              {zone.name}
                            </span>
                          ))}
                          {criticalZones.length > 4 && (
                            <span className="px-2 py-1 rounded bg-red-950/50 text-red-200 text-xs">+ {criticalZones.length - 4} more</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Protocol */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-start gap-3">
                    <Cpu className="h-4 w-4 text-zinc-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-mono text-zinc-500 mb-1">MITIGATION_PROTOCOL</div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div
                            className={cn(
                              "h-full rounded-full",
                              avgAqi > 200 ? "bg-red-500" : "bg-emerald-500"
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${systemConfidence}%` }}
                            transition={{ duration: 1 }}
                          />
                        </div>
                        <span className="text-xs font-mono text-white">{systemConfidence}% ready</span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-2">
                        {criticalZones.length > 0
                          ? "Automated alerts dispatched to zonal authorities."
                          : "System standby. Routine monitoring in progress."
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </BentoCard>

            {/* Recent Reports */}
            <BentoCard title="Verified Reports" icon={ShieldCheck} className="flex-1">
              <div className="space-y-3 overflow-y-auto max-h-[200px] pr-2 scrollbar-none mt-2">
                {reports.length === 0 ? (
                  <div className="text-center text-zinc-500 py-8 text-sm italic">No recent reports found.</div>
                ) : (
                  reports.map((report: any, i) => (
                    <div key={i} className="group flex gap-3 items-start p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/10">
                      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]" />
                      <div>
                        <h5 className="text-sm font-medium text-zinc-200 group-hover:text-emerald-400 transition-colors font-mono">
                          {report.metadata?.category || 'Pollution Event'}
                        </h5>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono text-zinc-600">
                            ID: {report.cid ? report.cid.substring(0, 6) : '....'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </BentoCard>

          </div>
        </div >
      </div >
    </main >
  );
}
