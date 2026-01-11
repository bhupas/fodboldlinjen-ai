"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { Sparkles, ArrowRight, Activity, Shield, BrainCircuit } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-[#0a0a0f] text-white relative flex flex-col items-center overflow-hidden">
      <BackgroundBeams />

      {/* Nav */}
      <nav className="w-full max-w-7xl mx-auto p-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="text-blue-500" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Fodboldlinjen AI
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">Log In</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10 max-w-4xl mx-auto">

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
          The Future of <br />
          <span className="text-blue-500">Elite Football Coaching</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Upload your match data, get instant tactical insights, and chat with an AI assistant trained on elite football methodology.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link href="/login">
            <Button size="lg" className="h-12 px-8 text-base bg-blue-600 hover:bg-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all">
              Start Analysis <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full text-left">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <Activity className="text-blue-400 mb-4" size={32} />
            <h3 className="text-lg font-bold text-white mb-2">Performance Tracking</h3>
            <p className="text-sm text-gray-400">Advanced metrics visualization for passing, defending, and possession.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <Shield className="text-purple-400 mb-4" size={32} />
            <h3 className="text-lg font-bold text-white mb-2">Tactical Insights</h3>
            <p className="text-sm text-gray-400">Automated analysis of defensive shape and pressing efficiency.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <BrainCircuit className="text-emerald-400 mb-4" size={32} />
            <h3 className="text-lg font-bold text-white mb-2">AI Assistant</h3>
            <p className="text-sm text-gray-400">Chat with a virtual elite coach to confirm your tactical theories.</p>
          </div>
        </div>
      </main>

      <footer className="w-full py-8 text-center text-gray-600 text-sm relative z-10">
        &copy; 2024 Fodboldlinjen. All rights reserved.
      </footer>
    </div>
  );
}
