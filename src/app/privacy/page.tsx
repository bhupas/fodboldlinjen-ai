"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { Card } from "@/components/ui/card";
import { Sparkles, Shield, Lock, FileText, Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export default function PrivacyPage() {
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
                        Privacy <span className="gradient-text">Policy</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        We are committed to protecting your data and ensuring your privacy.
                    </p>
                </div>

                <Card className="p-8 glass-card space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Shield className="text-blue-500 w-6 h-6" />
                            <h2 className="text-xl font-bold">Data Collection</h2>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            We collect data necessary to provide our coaching analytics services, including match statistics, player performance metrics, and basic user profile information.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Lock className="text-purple-500 w-6 h-6" />
                            <h2 className="text-xl font-bold">Data Security</h2>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            Your data is encrypted effectively and stored securely. We do not share your personal data with third parties without your explicit consent.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <FileText className="text-green-500 w-6 h-6" />
                            <h2 className="text-xl font-bold">Your Rights</h2>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            You have the right to access, correct, or delete your personal data at any time. Contact us if you wish to exercise these rights.
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
