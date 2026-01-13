"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { Card } from "@/components/ui/card";
import { Sparkles, Book, CheckSquare, Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export default function TermsPage() {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="min-h-screen w-full relative flex flex-col items-center overflow-hidden bg-background text-foreground">
            <BackgroundBeams className="opacity-50" />

            {/* Nav */}
            <nav className="w-full max-w-7xl mx-auto p-6 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse-glow group-hover:scale-105 transition-transform">
                            <Sparkles className="text-white" size={20} />
                        </div>
                        <span className="text-xl font-bold gradient-text">
                            myaitrainer
                        </span>
                    </Link>
                </div>

                {/* Desktop Nav Links */}
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
                    <Link href="/#features" className="hover:text-foreground transition-colors">Features</Link>
                    <Link href="/#about" className="hover:text-foreground transition-colors">About</Link>
                    <Link href="/#contact" className="hover:text-foreground transition-colors">Contact</Link>
                </div>

                <div className="flex items-center gap-3">
                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent"
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </Button>
                    <Link href="/login">
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 rounded-xl">
                            Log In
                        </Button>
                    </Link>
                </div>
            </nav>

            <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-12 relative z-10">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                        Terms of <span className="gradient-text">Service</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Please read these terms carefully before using our platform.
                    </p>
                </div>

                <Card className="p-8 glass-card space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Book className="text-blue-500 w-6 h-6" />
                            <h2 className="text-xl font-bold">Acceptance of Terms</h2>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            By accessing or using myaitrainer, you agree to be bound by these Terms of Service and all applicable laws and regulations.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <CheckSquare className="text-purple-500 w-6 h-6" />
                            <h2 className="text-xl font-bold">Use License</h2>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            We grant you a personal, non-exclusive, non-transferable license to use our software for your internal coaching and analysis purposes.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold">Disclaimer</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            The materials on myaitrainer are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability.
                        </p>
                    </div>
                </Card>
            </main>

            <footer className="w-full py-8 text-center text-sm relative z-10 mt-12 text-muted-foreground border-t border-border">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="text-blue-500 w-4 h-4" />
                        <span>&copy; 2024 myaitrainer</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <Link href="/privacy" className="cursor-pointer transition-colors hover:text-foreground">Privacy</Link>
                        <Link href="/terms" className="cursor-pointer transition-colors hover:text-foreground">Terms</Link>
                        <Link href="/#about" className="cursor-pointer transition-colors hover:text-foreground">About Us</Link>
                        <Link href="/#contact" className="cursor-pointer transition-colors hover:text-foreground">Contact</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
