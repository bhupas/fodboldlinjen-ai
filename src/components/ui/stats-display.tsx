"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Card } from "./card";

// Mini stat card for inline stats
interface MiniStatProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    color?: 'blue' | 'purple' | 'green' | 'yellow' | 'pink' | 'red';
    className?: string;
}

const colorStyles = {
    blue: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400',
    green: 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
    pink: 'bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400',
    red: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400',
};

export function MiniStat({ icon: Icon, label, value, color = 'blue', className }: MiniStatProps) {
    return (
        <Card className={cn("glass-card p-5", className)}>
            <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colorStyles[color])}>
                    <Icon size={24} />
                </div>
                <div>
                    <p className="text-2xl font-bold text-foreground">{value}</p>
                    <p className="text-sm text-muted-foreground">{label}</p>
                </div>
            </div>
        </Card>
    );
}

// Simple stat item for lists
interface StatItemProps {
    value: string | number;
    label: string;
    className?: string;
}

export function StatItem({ value, label, className }: StatItemProps) {
    return (
        <div className={cn("text-center", className)}>
            <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">{value}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
        </div>
    );
}

// Empty state component
interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center min-h-[40vh] text-center p-8", className)}>
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Icon className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
            {description && (
                <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
            )}
            {action}
        </div>
    );
}

// Badge for counts
interface CountBadgeProps {
    count: number | string;
    label: string;
    className?: string;
}

export function CountBadge({ count, label, className }: CountBadgeProps) {
    return (
        <div className={cn(
            "bg-primary/10 rounded-full px-4 py-1.5 text-sm text-primary border border-primary/20",
            className
        )}>
            {count} {label}
        </div>
    );
}

// Info row for player lists etc
interface InfoRowProps {
    rank?: number;
    title: string;
    subtitle?: string;
    value: string | number;
    valueLabel?: string;
    onClick?: () => void;
    className?: string;
}

export function InfoRow({ rank, title, subtitle, value, valueLabel, onClick, className }: InfoRowProps) {
    const getRankStyle = (rank: number) => {
        if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white';
        if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800';
        if (rank === 3) return 'bg-gradient-to-br from-orange-600 to-orange-700 text-white';
        return 'bg-muted text-muted-foreground';
    };

    return (
        <div
            className={cn(
                "flex items-center justify-between p-3 rounded-xl bg-accent/50 hover:bg-accent cursor-pointer transition-all group",
                className
            )}
            onClick={onClick}
        >
            <div className="flex items-center gap-3">
                {rank !== undefined && (
                    <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                        getRankStyle(rank)
                    )}>
                        {rank}
                    </div>
                )}
                <div>
                    <div className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">
                        {title}
                    </div>
                    {subtitle && (
                        <div className="text-xs text-muted-foreground">{subtitle}</div>
                    )}
                </div>
            </div>
            <div className="text-right">
                <div className="text-sm font-bold text-primary">{value}</div>
                {valueLabel && (
                    <div className="text-xs text-muted-foreground">{valueLabel}</div>
                )}
            </div>
        </div>
    );
}
