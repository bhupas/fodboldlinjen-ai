"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import MobileSidebar from "@/components/dashboard/MobileSidebar";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-background font-sans antialiased text-foreground">
            <BackgroundBeams className="-z-10" />
            <KeyboardShortcuts />
            <MobileSidebar />
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
                <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
                    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
