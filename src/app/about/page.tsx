"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { Card } from "@/components/ui/card";
import { Sparkles, ArrowLeft, Users, Trophy, Target, Heart } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="min-h-screen w-full relative flex flex-col items-center overflow-hidden bg-background text-foreground">
            <BackgroundBeams className="opacity-50" />

            {/* Nav */}
            <nav className="w-full max-w-7xl mx-auto p-6 flex items-center justify-between relative z-10">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Sparkles className="text-white" size={20} />
                    </div>
                    <span className="text-xl font-bold gradient-text">
                        myaitrainer
                    </span>
                </Link>
                <Link href="/">
                    <Button variant="ghost" className="gap-2">
                        <ArrowLeft size={16} />
                        Back to Home
                    </Button>
                </Link>
            </nav>

            <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-12 relative z-10">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                        Revolutionizing <br />
                        <span className="gradient-text">Football Coaching</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        We're on a mission to democratize elite-level improvements by making advanced data analytics accessible to every coach and player.
                    </p>
                </div>

                {/* Mission Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                    <Card className="p-8 glass-card border-l-4 border-l-blue-500">
                        <Target className="w-10 h-10 text-blue-500 mb-4" />
                        <h3 className="text-xl font-bold mb-3">Our Mission</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            To empower coaches with tools that turn raw data into actionable insights, fostering the next generation of football talent through precision and understanding.
                        </p>
                    </Card>
                    <Card className="p-8 glass-card border-l-4 border-l-purple-500">
                        <Trophy className="w-10 h-10 text-purple-500 mb-4" />
                        <h3 className="text-xl font-bold mb-3">Our Vision</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            A world where every player, regardless of their level, has access to the same quality of analysis and feedback as the pros.
                        </p>
                    </Card>
                </div>

                {/* Story Section */}
                <div className="space-y-8 text-center md:text-left">
                    <div className="flex flex-col md:flex-row gap-8 items-center bg-accent/20 p-8 rounded-2xl border border-border/50">
                        <div className="flex-shrink-0 w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center">
                            <Heart className="text-white w-10 h-10" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold mb-3">Built with Passion</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                myaitrainer was born from the frustrating gap between professional analytics software and what was available to grassroots and semi-pro clubs. We believe potential shouldn't be limited by budget or technology.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Team Section Placeholder */}
                <div className="mt-20 text-center">
                    <h2 className="text-3xl font-bold mb-10">Who We Are</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <TeamMember
                            name="Alex Johnson"
                            role="Founder & CEO"
                            description="Former semi-pro player turned data scientist."
                        />
                        <TeamMember
                            name="Sarah Chen"
                            role="Head of Product"
                            description="UX expert passionate about youth development."
                        />
                        <TeamMember
                            name="Mike Ross"
                            role="Lead Engineer"
                            description="Building systems that scale for the global game."
                        />
                    </div>
                </div>
            </main>

            <footer className="w-full py-8 text-center text-sm relative z-10 mt-12 text-muted-foreground border-t border-border">
                <p>&copy; {new Date().getFullYear()} myaitrainer. All rights reserved.</p>
            </footer>
        </div>
    );
}

function TeamMember({ name, role, description }: { name: string, role: string, description: string }) {
    return (
        <Card className="p-6 glass-card flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
            <div className="w-20 h-20 rounded-full bg-muted mb-4 flex items-center justify-center overflow-hidden">
                <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg text-foreground">{name}</h3>
            <p className="text-sm text-primary font-medium mb-2">{role}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
        </Card>
    )
}
