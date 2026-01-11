"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    iconColor?: 'blue' | 'purple' | 'green' | 'yellow' | 'pink' | 'red' | 'orange';
    badge?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

const iconColorStyles = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    pink: 'from-pink-500 to-pink-600',
    red: 'from-red-500 to-red-600',
    orange: 'from-orange-500 to-orange-600',
};

export function PageHeader({
    title,
    description,
    icon: Icon,
    iconColor = 'blue',
    badge,
    actions,
    className
}: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col md:flex-row justify-between items-start md:items-center gap-4", className)}>
            <div className="flex items-start gap-3">
                {Icon && (
                    <div className={cn(
                        "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg flex-shrink-0",
                        iconColorStyles[iconColor]
                    )}>
                        <Icon className="text-white" size={20} />
                    </div>
                )}
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
                    {description && (
                        <p className="text-muted-foreground mt-1">{description}</p>
                    )}
                </div>
                {badge && <div className="ml-2">{badge}</div>}
            </div>
            {actions && (
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {actions}
                </div>
            )}
        </div>
    );
}
