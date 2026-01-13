"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
    Upload,
    Users,
    BrainCircuit,
    Swords,
    ArrowRight,
    Keyboard
} from "lucide-react";

const quickActions = [
    {
        href: "/upload",
        icon: Upload,
        label: "Upload Data",
        description: "Import match or gym data",
        color: "from-blue-500 to-cyan-500",
        shortcut: "U"
    },
    {
        href: "/players",
        icon: Users,
        label: "View Players",
        description: "Analyze player stats",
        color: "from-purple-500 to-pink-500",
        shortcut: "P"
    },
    {
        href: "/ai",
        icon: BrainCircuit,
        label: "AI Coach",
        description: "Get tactical insights",
        color: "from-emerald-500 to-teal-500",
        shortcut: "A"
    },
    {
        href: "/comparison",
        icon: Swords,
        label: "Head to Head",
        description: "Compare players",
        color: "from-orange-500 to-amber-500",
        shortcut: "C"
    },
];

export function QuickActions() {
    return (
        <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Keyboard className="w-5 h-5 text-primary" />
                    Quick Actions
                </h3>
                <span className="text-xs text-muted-foreground">Press ? for all shortcuts</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {quickActions.map((action) => (
                    <Link
                        key={action.href}
                        href={action.href}
                        className="group"
                    >
                        <div className="relative p-4 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                            <div className={cn(
                                "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 group-hover:scale-110 transition-transform",
                                action.color
                            )}>
                                <action.icon className="text-white" size={20} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-sm text-foreground">{action.label}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </div>
                            <kbd className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-mono rounded bg-background/80 border border-border text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                {action.shortcut}
                            </kbd>
                        </div>
                    </Link>
                ))}
            </div>
        </Card>
    );
}
