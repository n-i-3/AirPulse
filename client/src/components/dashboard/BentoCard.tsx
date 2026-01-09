'use client';

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRef, useEffect } from "react";

interface BentoCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export function BentoCard({ children, className, onClick }: BentoCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty("--mouse-x", `${x}px`);
            card.style.setProperty("--mouse-y", `${y}px`);
        };

        card.addEventListener("mousemove", handleMouseMove);
        return () => card.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            onClick={onClick}
            className={cn(
                "group relative overflow-hidden rounded-2xl bg-zinc-900/40 backdrop-blur-xl border border-white/10 p-6",
                "hover:border-white/20 hover:bg-zinc-900/60",
                "transition-all duration-500 ease-out",
                onClick && "cursor-pointer",
                className
            )}
        >
            {/* Animated subtle glow on hover */}
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100 rounded-2xl z-0"
                style={{
                    background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.06), transparent 40%)`,
                }}
            />

            {/* Content wrapper */}
            <div className="relative z-10 h-full">
                {children}
            </div>
        </motion.div>
    );
}
