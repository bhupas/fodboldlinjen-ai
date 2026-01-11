"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Upload,
    Users,
    Swords,
    BrainCircuit,
    LogOut,
    Sparkles,
    Database,
    Settings,
    ChevronRight
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Overview & Analytics" },
    { href: "/upload", label: "Upload Data", icon: Upload, description: "Import matches & gym data" },
    { href: "/players", label: "Player Analysis", icon: Users, description: "Individual performance" },
    { href: "/comparison", label: "Head to Head", icon: Swords, description: "Compare players" },
    { href: "/ai-coach", label: "AI Coach", icon: BrainCircuit, description: "Get tactical insights" },
    { href: "/editor", label: "Data Editor", icon: Database, description: "Edit records" },
];

const ADMIN_ITEMS = [
    { href: "/admin/users", label: "User Management", icon: Settings, description: "Manage users" },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <aside className="hidden md:flex flex-col w-72 h-full glass-panel m-4 mr-0 border-r-0 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/5">
                <Link href="/dashboard" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                        <Sparkles className="text-white" size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold gradient-text">
                            Elite Coach
                        </h1>
                        <p className="text-xs text-muted-foreground">myaitrainer</p>
                    </div>
                </Link>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-3">Main Menu</p>
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                                isActive
                                    ? "bg-gradient-to-r from-blue-500/20 to-purple-500/10 text-white border border-blue-500/20"
                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
                            )}
                            <div className={cn(
                                "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                                isActive
                                    ? "bg-blue-500/20"
                                    : "bg-white/5 group-hover:bg-white/10"
                            )}>
                                <item.icon size={18} className={cn("transition-colors", isActive ? "text-blue-400" : "text-muted-foreground group-hover:text-white")} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="font-medium text-sm block">{item.label}</span>
                                <span className="text-xs text-gray-500 truncate block">{item.description}</span>
                            </div>
                            <ChevronRight size={16} className={cn("opacity-0 group-hover:opacity-100 transition-opacity", isActive && "opacity-100 text-blue-400")} />
                        </Link>
                    )
                })}

                {/* Admin Section */}
                <div className="pt-6">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-3">Admin</p>
                    {ADMIN_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-gradient-to-r from-orange-500/20 to-red-500/10 text-white border border-orange-500/20"
                                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                                )}
                            >
                                <div className={cn(
                                    "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                                    isActive
                                        ? "bg-orange-500/20"
                                        : "bg-white/5 group-hover:bg-white/10"
                                )}>
                                    <item.icon size={18} className={cn("transition-colors", isActive ? "text-orange-400" : "text-muted-foreground group-hover:text-white")} />
                                </div>
                                <div className="flex-1">
                                    <span className="font-medium text-sm">{item.label}</span>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/5">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-red-400 hover:bg-red-500/10 gap-3 py-3 rounded-xl"
                    onClick={handleSignOut}
                >
                    <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                        <LogOut size={18} />
                    </div>
                    <span className="font-medium">Sign Out</span>
                </Button>
            </div>
        </aside>
    );
}
