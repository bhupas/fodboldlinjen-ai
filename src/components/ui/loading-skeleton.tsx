"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSkeletonProps {
    variant?: 'dashboard' | 'table' | 'card' | 'page';
    className?: string;
}

export function LoadingSkeleton({ variant = 'page', className }: LoadingSkeletonProps) {
    if (variant === 'dashboard') {
        return (
            <div className={cn("space-y-8 animate-pulse", className)} suppressHydrationWarning>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl skeleton" />
                    <div className="space-y-2">
                        <div className="h-6 w-48 skeleton rounded" />
                        <div className="h-4 w-64 skeleton rounded" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-28 skeleton rounded-2xl" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-80 skeleton rounded-2xl" />
                    <div className="h-80 skeleton rounded-2xl" />
                </div>
            </div>
        );
    }

    if (variant === 'table') {
        return (
            <div className={cn("space-y-4 animate-pulse", className)} suppressHydrationWarning>
                <div className="h-12 skeleton rounded-xl" />
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 skeleton rounded-xl" />
                ))}
            </div>
        );
    }

    if (variant === 'card') {
        return (
            <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse", className)} suppressHydrationWarning>
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-48 skeleton rounded-2xl" />
                ))}
            </div>
        );
    }

    // Default: page loading
    return (
        <div className={cn("flex flex-col items-center justify-center min-h-[60vh]", className)} suppressHydrationWarning>
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
    );
}

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    text?: string;
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8'
    };

    return (
        <div className={cn("flex items-center justify-center gap-2", className)}>
            <Loader2 className={cn("text-primary animate-spin", sizeClasses[size])} />
            {text && <span className="text-muted-foreground">{text}</span>}
        </div>
    );
}
