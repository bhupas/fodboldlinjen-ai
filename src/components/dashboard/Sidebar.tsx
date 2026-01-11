"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Upload,
    Users,
    Activity,
    BrainCircuit,
    LogOut,
    Sparkles,
    Database
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/upload", label: "Upload Data", icon: Upload },
    { href: "/players", label: "Player Stats", icon: Users },
    { href: "/comparison", label: "Head to Head", icon: Activity },
    { href: "/ai-coach", label: "AI Coach", icon: BrainCircuit },
    { href: "/editor", label: "Data Editor", icon: Database },
    { href: "/admin/users", label: "Sys Admin", icon: Users },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <aside className="hidden md:flex flex-col w-64 h-full glass-panel m-4 mr-0 border-r-0">
            <div className="p-6">
                <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="text-blue-400" size={24} />
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                        Elite Coach
                    </h1>
                </div>
                <p className="text-xs text-muted-foreground ml-8">Fodboldlinjen AI</p>
            </div>

            <nav className="flex-1 px-4 py-2 space-y-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                                isActive
                                    ? "bg-primary/20 text-primary border border-primary/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                            )}
                        >
                            <item.icon size={18} className={cn("transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-white")} />
                            <span className="font-medium text-sm">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-white/10 mt-auto">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-white hover:bg-white/5 gap-2"
                    onClick={handleSignOut}
                >
                    <LogOut size={18} />
                    Sign Out
                </Button>
            </div>
        </aside>
    );
}
