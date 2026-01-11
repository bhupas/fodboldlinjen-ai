"use client";

import { cn } from "@/lib/utils";
import { Divide } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: string;
    trendUp?: boolean;
    className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, trendUp, className }: StatCardProps) {
    return (
        <div className={cn("glass-card p-6 flex items-start justify-between", className)}>
            <div>
                <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-white">{value}</h3>
                {trend && (
                    <p className={cn("text-xs mt-2 flex items-center", trendUp ? "text-green-400" : "text-red-400")}>
                        {trendUp ? "↑" : "↓"} {trend}
                    </p>
                )}
            </div>
            <div className="p-3 bg-white/5 rounded-lg text-primary">
                <Icon size={24} />
            </div>
        </div>
    );
}
