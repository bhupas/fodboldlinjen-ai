"use client";

import { cn } from "@/lib/utils";
import { Card } from "./card";

interface FilterPanelProps {
    children: React.ReactNode;
    className?: string;
}

export function FilterPanel({ children, className }: FilterPanelProps) {
    return (
        <Card className={cn("glass-card p-6", className)}>
            {children}
        </Card>
    );
}

interface FilterRowProps {
    children: React.ReactNode;
    className?: string;
}

export function FilterRow({ children, className }: FilterRowProps) {
    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-4 gap-6", className)}>
            {children}
        </div>
    );
}

interface FilterSectionProps {
    children: React.ReactNode;
    className?: string;
    separator?: boolean;
}

export function FilterSection({ children, className, separator }: FilterSectionProps) {
    return (
        <div className={cn(
            "flex flex-col md:flex-row gap-6",
            separator && "pt-4 border-t border-border",
            className
        )}>
            {children}
        </div>
    );
}
