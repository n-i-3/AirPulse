'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Activity, ShieldAlert, Newspaper, Brain } from 'lucide-react';

export function Header() {
    const pathname = usePathname();

    const routes = [
        { href: '/', label: 'Overview', icon: Activity },
        { href: '/report', label: 'Report', icon: ShieldAlert },
        { href: '/news', label: 'Intel', icon: Newspaper },
        { href: '/forecast', label: 'AI Forecast', icon: Brain },
    ];

    return (
        <header className="sticky top-0 z-50 w-full">
            {/* Glass Bar */}
            <div className="mx-auto max-w-screen-2xl px-4 py-3">
                <div className="relative flex h-12 items-center justify-between rounded-full border border-white/10 bg-background/60 px-6 backdrop-blur-md shadow-2xl shadow-black/50">

                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-primary animate-pulse shadow-[0_0_10px_var(--color-primary)]" />
                        <span className="font-sans font-bold tracking-tight text-white">AirPulse</span>
                        <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold text-primary font-mono">PRO</span>
                    </div>

                    {/* Navigation */}
                    <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex items-center gap-1 p-1 rounded-full bg-white/5 border border-white/5">
                        {routes.map((route) => (
                            <Link
                                key={route.href}
                                href={route.href}
                                className={cn(
                                    "flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300",
                                    pathname === route.href
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                                )}
                            >
                                {/* <route.icon className="h-3 w-3" /> */}
                                {route.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Status */}
                    <div className="flex items-center gap-4 text-xs font-mono">
                        <div className="hidden md:flex items-center gap-2 text-muted-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            <span>SYSTEM_ACTIVE</span>
                        </div>
                        <div className="text-white/60">
                            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
