"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { Card } from "@/components/ui/card";
import { StatItem } from "@/components/ui/stats-display";
import { Sparkles, ArrowRight, BrainCircuit, BarChart3, Users, Zap, CheckCircle, Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center overflow-hidden bg-background text-foreground">
      <BackgroundBeams />

      {/* Nav */}
      <nav className="w-full max-w-7xl mx-auto p-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse-glow">
            <Sparkles className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold gradient-text">
            myaitrainer
          </span>
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
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-accent">
              Log In
            </Button>
          </Link>
          <Link href="/login">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 rounded-xl">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10 max-w-5xl mx-auto py-12">

        {/* Badge */}
        <div className="mb-8 px-4 py-2 rounded-full text-sm flex items-center gap-2 animate-float bg-primary/10 border border-primary/20 text-primary">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span>Powered by Advanced AI Analytics</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
          <span className="text-foreground">
            Transform Your Team Into
          </span>
          <br />
          <span className="gradient-text">
            Elite Performers
          </span>
        </h1>

        <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed text-muted-foreground">
          Upload match data, track player development, and get AI-powered tactical insights.
          The complete coaching platform for the modern game.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-16">
          <Link href="/login">
            <Button size="lg" className="h-14 px-10 text-lg btn-premium group rounded-xl">
              Start Free Analysis
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="h-14 px-10 text-lg rounded-xl">
              See Features
            </Button>
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-8 text-sm mb-20 text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Instant setup</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Excel/CSV import</span>
          </div>
        </div>

        {/* Feature Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <FeatureCard
            icon={BarChart3}
            color="blue"
            title="Advanced Analytics"
            description="Track passes, shots, tackles, and more. Visualize trends with beautiful charts and graphs."
          />
          <FeatureCard
            icon={Users}
            color="purple"
            title="Player Development"
            description="Monitor individual progress, compare performances, and identify areas for improvement."
          />
          <FeatureCard
            icon={BrainCircuit}
            color="emerald"
            title="AI Coach Assistant"
            description="Get instant tactical analysis and personalized recommendations from our AI."
          />
        </div>

        {/* Stats Section */}
        <div className="mt-24 w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem value="100%" label="Data Privacy" />
            <StatItem value="< 1s" label="Analysis Speed" />
            <StatItem value="50+" label="Metrics Tracked" />
            <StatItem value="24/7" label="AI Available" />
          </div>
        </div>

        {/* CTA Section */}
        <Card className="mt-24 w-full p-10 text-center glass-card">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Ready to Elevate Your Coaching?
          </h2>
          <p className="mb-8 max-w-xl mx-auto text-muted-foreground">
            Join coaches who are using data-driven insights to develop elite players.
          </p>
          <Link href="/login">
            <Button size="lg" className="h-14 px-12 text-lg btn-premium rounded-xl">
              Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </Card>
      </main>

      <footer className="w-full py-8 text-center text-sm relative z-10 mt-12 text-muted-foreground border-t border-border">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-blue-500 w-4 h-4" />
            <span>&copy; 2024 myaitrainer</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="cursor-pointer transition-colors hover:text-foreground">Privacy</span>
            <span className="cursor-pointer transition-colors hover:text-foreground">Terms</span>
            <span className="cursor-pointer transition-colors hover:text-foreground">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, color, title, description }: FeatureCardProps) {
  const colorClasses: Record<string, string> = {
    blue: "from-blue-500 to-blue-600",
    purple: "from-purple-500 to-purple-600",
    emerald: "from-emerald-500 to-emerald-600",
  };

  return (
    <Card className="p-6 card-hover group glass-card">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className="text-white" size={24} />
      </div>
      <h3 className="text-lg font-bold mb-2 text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </Card>
  );
}
