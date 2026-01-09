'use client';

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
    value: number;
    className?: string;
    duration?: number;
}

export const AnimatedCounter = ({ value, className, duration = 1500 }: AnimatedCounterProps) => {
    const [displayValue, setDisplayValue] = useState(0);
    const startTime = useRef<number | null>(null);
    const startValue = useRef(0);

    useEffect(() => {
        startValue.current = displayValue;
        startTime.current = null;

        // If we're already at the value, don't animate
        if (displayValue === value) return;

        let animationFrameId: number;

        const animate = (timestamp: number) => {
            if (!startTime.current) startTime.current = timestamp;
            const progress = timestamp - startTime.current;
            const percentage = Math.min(progress / duration, 1);

            // Ease out quart
            const ease = 1 - Math.pow(1 - percentage, 4);

            const nextValue = Math.floor(startValue.current + (value - startValue.current) * ease);
            setDisplayValue(nextValue);

            if (percentage < 1) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                setDisplayValue(value);
            }
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [value, duration]);

    return (
        <span className={cn("tabular-nums", className)}>
            {displayValue}
        </span>
    );
};
