"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
    className?: string;
    color?: 'blue' | 'purple' | 'green' | 'yellow' | 'pink' | 'red';
}

const colorStyles = {
    blue: {
        bg: 'from-blue-500/20 to-blue-500/5',
        bgLight: 'light:from-blue-100 light:to-blue-50',
        icon: 'bg-blue-500/20 text-blue-500',
        glow: 'shadow-blue-500/10'
    },
    purple: {
        bg: 'from-purple-500/20 to-purple-500/5',
        bgLight: 'light:from-purple-100 light:to-purple-50',
        icon: 'bg-purple-500/20 text-purple-500',
        glow: 'shadow-purple-500/10'
    },
    green: {
        bg: 'from-green-500/20 to-green-500/5',
        bgLight: 'light:from-green-100 light:to-green-50',
        icon: 'bg-green-500/20 text-green-500',
        glow: 'shadow-green-500/10'
    },
    yellow: {
        bg: 'from-yellow-500/20 to-yellow-500/5',
        bgLight: 'light:from-yellow-100 light:to-yellow-50',
        icon: 'bg-yellow-500/20 text-yellow-500',
        glow: 'shadow-yellow-500/10'
    },
    pink: {
        bg: 'from-pink-500/20 to-pink-500/5',
        bgLight: 'light:from-pink-100 light:to-pink-50',
        icon: 'bg-pink-500/20 text-pink-500',
        glow: 'shadow-pink-500/10'
    },
    red: {
        bg: 'from-red-500/20 to-red-500/5',
        bgLight: 'light:from-red-100 light:to-red-50',
        icon: 'bg-red-500/20 text-red-500',
        glow: 'shadow-red-500/10'
    }
};

export function StatCard({ title, value, icon: Icon, trend, trendUp, className, color = 'blue' }: StatCardProps) {
    const styles = colorStyles[color];

    return (
        <div className={cn(
            "relative overflow-hidden rounded-2xl p-5 border border-border bg-gradient-to-br transition-all duration-300 hover:scale-[1.02] card-hover",
            styles.bg,
            `shadow-lg ${styles.glow}`,
            className
        )}>
            {/* Background decoration */}
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-foreground/5 blur-2xl" />

            <div className="flex items-start justify-between relative z-10">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <h3 className="text-2xl font-bold text-foreground stat-number">{value}</h3>
                    {trend && (
                        <p className={cn(
                            "text-xs mt-1 flex items-center gap-1",
                            trendUp === true ? "text-green-500" : trendUp === false ? "text-red-500" : "text-muted-foreground"
                        )}>
                            {trendUp === true && "↑"}
                            {trendUp === false && "↓"}
                            {trend}
                        </p>
                    )}
                </div>
                <div className={cn(
                    "p-3 rounded-xl",
                    styles.icon
                )}>
                    <Icon size={22} />
                </div>
            </div>
        </div>
    );
}
