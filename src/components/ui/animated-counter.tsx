"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
    value: string;
    label: string;
    duration?: number;
    className?: string;
}

export function AnimatedCounter({ value, label, duration = 2000, className }: AnimatedCounterProps) {
    const [displayValue, setDisplayValue] = useState("0");
    const [hasAnimated, setHasAnimated] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated) {
                    setHasAnimated(true);
                    animateValue();
                }
            },
            { threshold: 0.5 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [hasAnimated]);

    const animateValue = () => {
        // Extract number from value (handles "50+", "<1s", "24/7", "100%")
        const numericMatch = value.match(/[\d.]+/);
        if (!numericMatch) {
            setDisplayValue(value);
            return;
        }

        const endValue = parseFloat(numericMatch[0]);
        const prefix = value.slice(0, value.indexOf(numericMatch[0]));
        const suffix = value.slice(value.indexOf(numericMatch[0]) + numericMatch[0].length);

        const startTime = performance.now();
        const isDecimal = value.includes('.');

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out-expo)
            const easeOutExpo = 1 - Math.pow(2, -10 * progress);
            const currentValue = endValue * easeOutExpo;

            if (isDecimal) {
                setDisplayValue(`${prefix}${currentValue.toFixed(1)}${suffix}`);
            } else {
                setDisplayValue(`${prefix}${Math.floor(currentValue)}${suffix}`);
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setDisplayValue(value);
            }
        };

        requestAnimationFrame(animate);
    };

    return (
        <div ref={ref} className={cn("text-center", className)}>
            <div className="text-4xl md:text-5xl font-bold gradient-text mb-2 tabular-nums">
                {displayValue}
            </div>
            <div className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
                {label}
            </div>
        </div>
    );
}
