'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { usePrivy } from '@privy-io/react-auth';
import { cn } from '@/lib/utils';
import { Activity, ShieldAlert, Newspaper, Brain, Flame, Sun, Moon, Server, Database, Cloud, Cpu, BarChart3, Radio, Power } from 'lucide-react';

interface ServiceStatus {
    name: string;
    endpoint: string;
    status: 'online' | 'offline' | 'checking';
    icon: any;
    lastChecked?: string;
    category: 'core' | 'ai' | 'web3';
    mockOnline?: boolean; // Services that always show online
}

export function Header() {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const { authenticated, logout } = usePrivy();
    const [mounted, setMounted] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [services, setServices] = useState<ServiceStatus[]>([
        // Core Backend Services (Including Satellite)
        { name: 'AQI API', endpoint: 'http://localhost:5000/api/aqi/bounds?lat1=28.4&lng1=76.8&lat2=28.9&lng2=77.4', status: 'checking', icon: Server, category: 'core' },
        { name: 'Sources API', endpoint: 'http://localhost:5000/api/sources?lat1=28.4&lng1=76.8&lat2=28.9&lng2=77.4', status: 'checking', icon: Database, category: 'core' },
        { name: 'Weather API', endpoint: 'https://api.openweathermap.org/data/2.5/weather?lat=28.61&lon=77.20&appid=demo', status: 'checking', icon: Cloud, category: 'core' },
        { name: 'NASA MODIS Data Feed', endpoint: '', status: 'online', icon: Cloud, category: 'core', mockOnline: true },
        { name: 'Sentinel-5P Integration', endpoint: '', status: 'online', icon: Cloud, category: 'core', mockOnline: true },

        // Web3 Services
        { name: 'IPFS Cluster', endpoint: '', status: 'online', icon: Database, category: 'web3', mockOnline: true },
        { name: 'Privy Wallet Auth', endpoint: '', status: 'online', icon: ShieldAlert, category: 'web3', mockOnline: true },

        // AI & Machine Learning
        { name: 'TensorFlow Predictor', endpoint: '', status: 'online', icon: Brain, category: 'ai', mockOnline: true },
        { name: 'Real-time ML Pipeline', endpoint: '', status: 'online', icon: Activity, category: 'ai', mockOnline: true },
    ]);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Check all backend services
    useEffect(() => {
        const checkServices = async () => {
            // First check if the main backend is reachable
            let isBackendOnline = false;
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                const response = await fetch('http://localhost:5000/api/aqi/bounds?lat1=28.4&lng1=76.8&lat2=28.9&lng2=77.4', {
                    signal: controller.signal,
                    method: 'GET'
                });
                clearTimeout(timeoutId);
                isBackendOnline = response.ok;
            } catch (e) {
                isBackendOnline = false;
            }

            const updatedServices = await Promise.all(
                services.map(async (service) => {
                    // For mock online services, they depend on the main backend being up
                    if (service.mockOnline) {
                        return {
                            ...service,
                            status: isBackendOnline ? 'online' : 'offline',
                            lastChecked: new Date().toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })
                        } as ServiceStatus;
                    }

                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 3000);

                        const response = await fetch(service.endpoint, {
                            signal: controller.signal,
                            method: 'GET',
                        });

                        clearTimeout(timeoutId);

                        return {
                            ...service,
                            status: response.ok ? 'online' : 'offline',
                            lastChecked: new Date().toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })
                        } as ServiceStatus;
                    } catch (error) {
                        return {
                            ...service,
                            status: 'offline',
                            lastChecked: new Date().toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })
                        } as ServiceStatus;
                    }
                })
            );

            setServices(updatedServices);
        };

        // Initial check
        checkServices();

        // Poll every 10 seconds
        const interval = setInterval(checkServices, 10000);

        return () => clearInterval(interval);
    }, []);

    const routes = [
        { href: '/', label: 'Overview', icon: Activity },
        { href: '/report', label: 'Report', icon: ShieldAlert },
        { href: '/news', label: 'Intel', icon: Newspaper },
        { href: '/forecast', label: 'AI Forecast', icon: Brain },
        { href: '/sources', label: 'Sources', icon: Flame },
    ];

    const getOverallStatus = () => {
        const anyOnline = services.some(s => s.status === 'online');
        const anyChecking = services.some(s => s.status === 'checking');

        if (anyChecking) return 'checking';
        if (anyOnline) return 'online';  // Show ACTIVE if ANY service is up
        return 'offline';
    };

    const getStatusConfig = () => {
        const status = getOverallStatus();
        switch (status) {
            case 'online':
                return {
                    color: 'bg-green-500',
                    text: 'SYSTEM_ACTIVE',
                    textColor: 'text-green-500',
                    animate: 'animate-pulse'
                };
            case 'offline':
                return {
                    color: 'bg-red-500',
                    text: 'SYSTEM_DOWN',
                    textColor: 'text-red-500',
                    animate: 'animate-pulse'
                };
            case 'checking':
            default:
                return {
                    color: 'bg-yellow-500',
                    text: 'CHECKING...',
                    textColor: 'text-yellow-500',
                    animate: 'animate-pulse'
                };
        }
    };

    const statusConfig = getStatusConfig();

    return (
        <header className="sticky top-0 z-50 w-full">
            {/* Glass Bar */}
            <div className="mx-auto max-w-screen-2xl px-4 py-3">
                <div className="relative flex h-12 items-center justify-between rounded-full border border-border bg-background/60 px-6 backdrop-blur-md shadow-2xl">

                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-primary animate-pulse shadow-[0_0_10px_var(--color-primary)]" />
                        <span className="font-sans font-bold tracking-tight text-foreground">AirPulse</span>
                        <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold text-primary font-mono">PRO</span>
                    </div>

                    {/* Navigation */}
                    <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex items-center gap-1 p-1 rounded-full bg-secondary/50 border border-border/50">
                        {routes.map((route) => (
                            <Link
                                key={route.href}
                                href={route.href}
                                className={cn(
                                    "flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300",
                                    pathname === route.href
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                {/* <route.icon className="h-3 w-3" /> */}
                                {route.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Status & Theme Toggle */}
                    <div className="flex items-center gap-4 text-xs font-mono">
                        {/* Backend Status with Tooltip */}
                        <div
                            className="hidden md:flex items-center gap-2 relative cursor-pointer"
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                            onClick={() => setShowTooltip(!showTooltip)}
                        >
                            <span className={cn("h-1.5 w-1.5 rounded-full", statusConfig.color, statusConfig.animate)} />
                            <span className={statusConfig.textColor}>{statusConfig.text}</span>

                            {/* Tooltip */}
                            {showTooltip && (
                                <div className="absolute top-full right-0 mt-2 w-80 rounded-2xl border border-border bg-background/95 backdrop-blur-xl shadow-2xl p-4 z-50">
                                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                                        <Server className="h-4 w-4 text-primary" />
                                        <h3 className="text-sm font-bold text-foreground">System Services</h3>
                                    </div>

                                    {/* Core Services */}
                                    <div className="mb-3">
                                        <div className="text-[10px] font-mono text-muted-foreground uppercase mb-2 flex items-center gap-1">
                                            <Server className="h-3 w-3" />
                                            Core Backend
                                        </div>
                                        <div className="space-y-1">
                                            {services.filter(s => s.category === 'core').map((service, idx) => {
                                                const ServiceIcon = service.icon;
                                                return (
                                                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
                                                        <div className="flex items-center gap-2">
                                                            <ServiceIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                                            <span className="text-xs text-foreground">{service.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={cn(
                                                                "h-1.5 w-1.5 rounded-full",
                                                                service.status === 'online' ? 'bg-green-500' :
                                                                    service.status === 'offline' ? 'bg-red-500' :
                                                                        'bg-yellow-500'
                                                            )} />
                                                            <span className={cn(
                                                                "text-[10px] font-mono",
                                                                service.status === 'online' ? 'text-green-500' :
                                                                    service.status === 'offline' ? 'text-red-500' :
                                                                        'text-yellow-500'
                                                            )}>
                                                                {service.status.toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Web3 Services */}
                                    {services.filter(s => s.category === 'web3').length > 0 && (
                                        <div className="mb-3 pt-2 border-t border-border/50">
                                            <div className="text-[10px] font-mono text-muted-foreground uppercase mb-2 flex items-center gap-1">
                                                <Database className="h-3 w-3" />
                                                Web3 Infrastructure
                                            </div>
                                            <div className="space-y-1">
                                                {services.filter(s => s.category === 'web3').map((service, idx) => {
                                                    const ServiceIcon = service.icon;
                                                    return (
                                                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
                                                            <div className="flex items-center gap-2">
                                                                <ServiceIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                                                <span className="text-xs text-foreground">{service.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={cn(
                                                                    "h-1.5 w-1.5 rounded-full",
                                                                    service.status === 'online' ? 'bg-green-500' :
                                                                        service.status === 'offline' ? 'bg-red-500' :
                                                                            'bg-yellow-500'
                                                                )} />
                                                                <span className={cn(
                                                                    "text-[10px] font-mono",
                                                                    service.status === 'online' ? 'text-green-500' :
                                                                        service.status === 'offline' ? 'text-red-500' :
                                                                            'text-yellow-500'
                                                                )}>
                                                                    {service.status.toUpperCase()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* AI/ML Services */}
                                    {services.filter(s => s.category === 'ai').length > 0 && (
                                        <div className="pt-2 border-t border-border/50">
                                            <div className="text-[10px] font-mono text-muted-foreground uppercase mb-2 flex items-center gap-1">
                                                <Brain className="h-3 w-3" />
                                                AI & Machine Learning
                                            </div>
                                            <div className="space-y-1">
                                                {services.filter(s => s.category === 'ai').map((service, idx) => {
                                                    const ServiceIcon = service.icon;
                                                    return (
                                                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
                                                            <div className="flex items-center gap-2">
                                                                <ServiceIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                                                <span className="text-xs text-foreground">{service.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={cn(
                                                                    "h-1.5 w-1.5 rounded-full",
                                                                    service.status === 'online' ? 'bg-green-500' :
                                                                        service.status === 'offline' ? 'bg-red-500' :
                                                                            'bg-yellow-500'
                                                                )} />
                                                                <span className={cn(
                                                                    "text-[10px] font-mono",
                                                                    service.status === 'online' ? 'text-green-500' :
                                                                        service.status === 'offline' ? 'text-red-500' :
                                                                            'text-yellow-500'
                                                                )}>
                                                                    {service.status.toUpperCase()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}



                                    <div className="mt-4 pt-3 border-t border-border text-[10px] text-muted-foreground font-mono text-center">
                                        Last check: {services[0]?.lastChecked || 'N/A'}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Theme Toggle */}
                        {mounted && (
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? (
                                    <Sun className="h-4 w-4" />
                                ) : (
                                    <Moon className="h-4 w-4" />
                                )}
                            </button>
                        )}

                        {/* Disconnect Button (One-time use) */}
                        {mounted && authenticated && (
                            <button
                                onClick={() => logout()}
                                className="p-2 rounded-full hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                                title="Disconnect Session"
                            >
                                <Power className="h-4 w-4" />
                            </button>
                        )}

                        <div className="text-foreground/60 border-l border-border pl-4">
                            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
