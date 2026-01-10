'use client';
import Link from "next/link";

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
  const [intelEvents, setIntelEvents] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  /* Mouse tracking effect removed for performance */

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
          setIntelEvents(summaryData.intelEvents || []);
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

  // Helper to map backend color names to Tailwind (for dynamic rendering)
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'cyan': return { dot: 'bg-cyan-500/50 border-cyan-500 group-hover:bg-cyan-400', text: 'text-zinc-200' };
      case 'amber': return { dot: 'bg-amber-500/50 border-amber-500 group-hover:bg-amber-400', text: 'text-zinc-200' };
      case 'emerald': return { dot: 'bg-emerald-500/50 border-emerald-500 group-hover:bg-emerald-400', text: 'text-zinc-200' };
      case 'purple': return { dot: 'bg-purple-500/50 border-purple-500 group-hover:bg-purple-400', text: 'text-zinc-200' };
      default: return { dot: 'bg-cyan-500/50 border-cyan-500 group-hover:bg-cyan-400', text: 'text-zinc-200' };
    }
  };

  return (
    <main ref={containerRef} className="min-h-screen bg-[#020617] text-white font-sans selection:bg-primary/30 relative overflow-x-hidden">
      <AtmosphereBackground />
      <Header />

      <div className="mx-auto max-w-[1600px] px-6 py-8 pb-10">

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {/* Average AQI */}
          <Link href="/sources" className="block cursor-pointer">
            <BentoCard className="p-6 hover:border-cyan-500/50 transition-colors">
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
          </Link>

          {/* Verified Reports */}
          <Link href="/report" className="block cursor-pointer">
            <BentoCard className="p-6 hover:border-emerald-500/50 transition-colors">
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
          </Link>

          {/* Critical Zones */}
          <Link href="/news" className="block cursor-pointer">
            <BentoCard className="p-6 hover:border-red-500/50 transition-colors">
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
          </Link>

          {/* System Confidence */}
          <Link href="/forecast" className="block cursor-pointer">
            <BentoCard className="p-6 hover:border-blue-500/50 transition-colors">
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
          </Link>
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

            {/* System Intelligence Panel - V3 Situational Awareness Console */}
            <BentoCard className="flex-1 relative overflow-hidden bg-slate-950 border-cyan-500/20 group flex flex-col">

              {/* Header: Situation Summary */}
              <div className="px-5 py-4 border-b border-cyan-500/10 bg-cyan-950/5 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-3 w-3 rounded-full animate-pulse shadow-[0_0_10px_currentColor]",
                    avgAqi > 200 ? "bg-red-500 text-red-500" : avgAqi > 100 ? "bg-amber-500 text-amber-500" : "bg-emerald-500 text-emerald-500"
                  )} />
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">SYSTEM INTELLIGENCE</h3>
                    <p className={cn(
                      "text-[10px] font-mono font-medium tracking-widest uppercase",
                      avgAqi > 200 ? "text-red-400" : avgAqi > 100 ? "text-amber-400" : "text-emerald-400"
                    )}>
                      STATUS: {avgAqi > 200 ? "CRITICAL ALERT" : avgAqi > 100 ? "ELEVATED RISK" : "NOMINAL"}
                    </p>
                  </div>
                </div>
                {/* Live Clock / Pulse */}
                <div className="text-[10px] text-zinc-500 font-mono text-right">
                  <div>T-{new Date().getSeconds().toString().padStart(2, '0')}s</div>
                  <div className="text-cyan-600">SYNCED</div>
                </div>
              </div>

              {/* Body: Live Intelligence Feed */}
              <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-4">

                {/* Dynamic Insight Generator (Mocking the 'Engine' output visually for V3) */}
                {avgAqi > 200 && (
                  <div className="p-3 bg-red-950/20 border-l-2 border-red-500 rounded-r flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-red-100 mb-1">Hazardous Conditions Detected</h4>
                      <p className="text-[11px] text-red-200/70 leading-relaxed">
                        PM2.5 levels exceeding safety thresholds in {criticalZones.length} zones. Immediate containment protocols recommended.
                      </p>
                    </div>
                  </div>
                )}

                {/* Latest Intel Events - Plain English */}
                <div className="space-y-3">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Live Updates</div>

                  {/* Map over Dynamic Events */}
                  {intelEvents.map((event, i) => {
                    const colors = getColorClasses(event.color);
                    return (
                      <div key={i} className="group flex gap-3 items-start p-2 rounded hover:bg-white/5 transition-colors cursor-pointer">
                        <div className={cn("mt-1 h-2 w-2 rounded-full border", colors.dot)} />
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={cn("text-[11px] font-bold", colors.text)}>{event.title}</span>
                            <span className="text-[9px] text-zinc-500 font-mono">{event.time}</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-snug">
                            {event.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Fallback if no events */}
                  {intelEvents.length === 0 && (
                    <div className="text-[10px] text-zinc-600 italic pl-2">Waiting for new intelligence...</div>
                  )}

                </div>

              </div>

            </BentoCard>

            {/* Recent Reports */}
            <BentoCard className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Verified Reports</h3>
              </div>
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
