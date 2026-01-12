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
    ChevronRight,
    Moon,
    Sun,
    User,
    MessageSquare
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme-context";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Overview & Analytics" },
    { href: "/upload", label: "Upload Data", icon: Upload, description: "Import matches & gym data" },
    { href: "/players", label: "Player Analysis", icon: Users, description: "Stats, feedback & insights" },
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
    const { theme, toggleTheme } = useTheme();
    const [profile, setProfile] = useState<{ firstName: string; lastName: string; avatarUrl: string | null; role: string | null } | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('first_name, last_name, avatar_url, role')
                    .eq('id', user.id)
                    .single();
                if (data) {
                    setProfile({
                        firstName: data.first_name || '',
                        lastName: data.last_name || '',
                        avatarUrl: data.avatar_url,
                        role: data.role
                    });
                }
            }
        };
        fetchProfile();
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <aside className="hidden md:flex flex-col w-72 glass-panel m-4 mr-0 border-r-0 rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 2rem)' }}>
            {/* Header */}
            <div className="p-6 border-b border-border/50">
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
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">Main Menu</p>
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                                isActive
                                    ? "bg-gradient-to-r from-blue-500/20 to-purple-500/10 text-foreground border border-blue-500/20"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
                            )}
                            <div className={cn(
                                "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                                isActive
                                    ? "bg-blue-500/20"
                                    : "bg-accent/50 group-hover:bg-accent"
                            )}>
                                <item.icon size={18} className={cn("transition-colors", isActive ? "text-blue-500" : "text-muted-foreground group-hover:text-foreground")} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="font-medium text-sm block">{item.label}</span>
                                <span className="text-xs text-muted-foreground truncate block">{item.description}</span>
                            </div>
                            <ChevronRight size={16} className={cn("opacity-0 group-hover:opacity-100 transition-opacity", isActive && "opacity-100 text-blue-500")} />
                        </Link>
                    )
                })}

                {/* Admin Section */}
                {profile?.role === 'admin' && (
                    <div className="pt-6">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">Admin</p>
                        {ADMIN_ITEMS.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
                                        isActive
                                            ? "bg-gradient-to-r from-orange-500/20 to-red-500/10 text-foreground border border-orange-500/20"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                    )}
                                >
                                    <div className={cn(
                                        "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                                        isActive
                                            ? "bg-orange-500/20"
                                            : "bg-accent/50 group-hover:bg-accent"
                                    )}>
                                        <item.icon size={18} className={cn("transition-colors", isActive ? "text-orange-500" : "text-muted-foreground group-hover:text-foreground")} />
                                    </div>
                                    <div className="flex-1">
                                        <span className="font-medium text-sm">{item.label}</span>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </nav>

            {/* Footer with Profile */}
            <div className="p-4 border-t border-border/50 space-y-3 flex-shrink-0">
                {/* Profile Link */}
                <Link
                    href="/settings"
                    className={cn(
                        "flex items-center gap-3 p-2 rounded-xl transition-all duration-200 group hover:bg-accent/50",
                        pathname === "/settings" && "bg-gradient-to-r from-blue-500/20 to-purple-500/10 border border-blue-500/20"
                    )}
                >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-background shadow-lg">
                        {profile?.avatarUrl ? (
                            <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User size={18} className="text-muted-foreground" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm block truncate">
                            {profile?.firstName && profile?.lastName
                                ? `${profile.firstName} ${profile.lastName}`
                                : 'My Profile'}
                        </span>
                        <span className="text-xs text-muted-foreground">Account Settings</span>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>

                {/* Actions Row */}
                <div className="flex items-center gap-2">
                    {/* Sign Out */}
                    <Button
                        variant="ghost"
                        className="flex-1 justify-start text-muted-foreground hover:text-red-500 hover:bg-red-500/10 gap-2 py-2.5 px-3 rounded-xl text-sm"
                        onClick={handleSignOut}
                    >
                        <LogOut size={16} />
                        <span>Sign Out</span>
                    </Button>

                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        onClick={toggleTheme}
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </Button>
                </div>
            </div>
        </aside>
    );
}
