"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { Card } from "@/components/ui/card";
import { Sparkles, ArrowLeft, Mail, MessageSquare, MapPin } from "lucide-react";

export default function ContactPage() {
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
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                        Contact <span className="gradient-text">Us</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        We'd love to hear from you. Get in touch with our team.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="p-8 glass-card space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
                                <Mail size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Email Us</h3>
                                <p className="text-muted-foreground text-sm mb-2">For general inquiries and support.</p>
                                <a href="mailto:support@myaitrainer.com" className="text-primary hover:underline">support@myaitrainer.com</a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500">
                                <MessageSquare size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Live Chat</h3>
                                <p className="text-muted-foreground text-sm">Available Mon-Fri, 9am - 5pm EST.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-green-500/10 text-green-500">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Office</h3>
                                <p className="text-muted-foreground text-sm">Copenhagen, Denmark</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-8 glass-card">
                        <form className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <input className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="Your name" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <input type="email" className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="you@example.com" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Message</label>
                                <textarea className="flex min-h-[120px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="How can we help?" />
                            </div>
                            <Button className="w-full btn-premium">Send Message</Button>
                        </form>
                    </Card>
                </div>
            </main>

            <footer className="w-full py-8 text-center text-sm relative z-10 mt-12 text-muted-foreground border-t border-border">
                <p>&copy; {new Date().getFullYear()} myaitrainer. All rights reserved.</p>
            </footer>
        </div>
    );
}
