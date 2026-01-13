"use client";

import { Suspense, lazy } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";

// Lazy load heavy background component
const BackgroundBeams = lazy(() =>
    import("@/components/aceternity/background-beams").then(mod => ({ default: mod.BackgroundBeams }))
);

// Loading fallback for background
function BackgroundFallback() {
    return <div className="fixed inset-0 -z-10 bg-gradient-to-br from-background via-background to-primary/5" />;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col md:flex-row min-h-screen md:h-screen overflow-hidden bg-background font-sans antialiased text-foreground">
            {/* Lazy loaded background with fallback */}
            <Suspense fallback={<BackgroundFallback />}>
                <BackgroundBeams className="-z-10" />
            </Suspense>

            <KeyboardShortcuts />
            <Sidebar />

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
                {/* Mobile header placeholder - using CSS for instant render */}
                <div className="md:hidden h-24 flex-shrink-0" aria-hidden="true" />

                {/* Main content area with smooth scroll */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 scroll-smooth pb-20 md:pb-8 scrollbar-thin">
                    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </div>
            </main>

            <MobileBottomNav />
        </div>
    );
}
