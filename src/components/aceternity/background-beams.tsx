"use client";
import React from "react";
import { cn } from "@/lib/utils";

export const BackgroundBeams = ({ className }: { className?: string }) => {
    return (
        <div
            className={cn(
                "absolute h-full w-full inset-0 bg-background flex flex-col items-center justify-center pointer-events-none transition-colors duration-300",
                className
            )}
        >
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5 dark:from-blue-500/20 dark:to-purple-500/20 opacity-40 dark:opacity-30" />

            {/* Beams */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-500/20 rounded-full blur-[100px] animate-pulse mix-blend-multiply dark:mix-blend-screen" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/20 dark:bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000 mix-blend-multiply dark:mix-blend-screen" />
        </div>
    );
};
