"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { useTheme } from "@/lib/theme-context";
import {
    LayoutDashboard,
    Upload,
    Users,
    BrainCircuit,
    MoreHorizontal,
    Swords,
    Database,
    Settings,
    LogOut,
    Sparkles,
    X,
    User,
    Moon,
    Sun
} from "lucide-react";

// Main nav items shown in bottom bar
const MAIN_NAV_ITEMS = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/players", label: "Players", icon: Users },
    { href: "/upload", label: "Upload", icon: Upload },
    { href: "/ai-coach", label: "AI", icon: BrainCircuit },
];

// More items shown in modal
const MORE_NAV_ITEMS = [
    { href: "/comparison", label: "Head to Head", icon: Swords },
    { href: "/editor", label: "Data Editor", icon: Database },
    { href: "/admin/users", label: "Admin", icon: Settings },
];

export default function MobileBottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [showMore, setShowMore] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const [profile, setProfile] = useState<{ firstName: string; lastName: string; avatarUrl: string | null } | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('first_name, last_name, avatar_url')
                    .eq('id', user.id)
                    .single();
                if (data) {
                    setProfile({
                        firstName: data.first_name || '',
                        lastName: data.last_name || '',
                        avatarUrl: data.avatar_url
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

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard";
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 border-b border-border bg-background/90 backdrop-blur-md safe-area-top">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <Sparkles className="text-primary" size={24} />
                    <span className="font-bold text-xl text-foreground">Elite Coach</span>
                </Link>

                {/* Profile Avatar - Top Right */}
                <Link href="/settings" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border shadow-sm">
                    {profile?.avatarUrl ? (
                        <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <User size={20} className="text-muted-foreground" />
                    )}
                </Link>
            </div>

            {/* More Modal Overlay */}
            {showMore && (
                <div
                    className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] animate-in fade-in duration-200"
                    onClick={() => setShowMore(false)}
                />
            )}

            {/* More Modal */}
            <div className={cn(
                "md:hidden fixed bottom-0 left-0 right-0 z-[70] bg-card border-t border-border rounded-t-3xl transform transition-transform duration-300 ease-out safe-area-bottom",
                showMore ? "translate-y-0" : "translate-y-full"
            )}>
                <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">More Options</span>
                        <Button variant="ghost" size="icon" onClick={() => setShowMore(false)} className="text-muted-foreground hover:text-foreground">
                            <X size={20} />
                        </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {MORE_NAV_ITEMS.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setShowMore(false)}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all",
                                        active
                                            ? "bg-primary/10 text-primary"
                                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    <item.icon size={24} />
                                    <span className="text-xs font-medium text-center">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="space-y-2">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="w-full flex items-center gap-3 p-3 rounded-xl text-muted-foreground hover:bg-accent/50 transition-all"
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            <span className="font-medium">
                                {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            </span>
                        </button>

                        <Button
                            variant="ghost"
                            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-3 rounded-xl h-12 px-3"
                            onClick={handleSignOut}
                        >
                            <LogOut size={20} />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </div>

            {/* Bottom Navigation Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border safe-area-bottom">
                <div className="flex items-center justify-around h-16 px-2">
                    {MAIN_NAV_ITEMS.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors duration-200",
                                    active
                                        ? "text-primary"
                                        : "text-muted-foreground"
                                )}
                            >
                                <div className={cn(
                                    "p-1.5 rounded-xl transition-all duration-200",
                                    active && "bg-primary/15"
                                )}>
                                    <item.icon size={20} strokeWidth={active ? 2.5 : 2} />
                                </div>
                                <span className={cn(
                                    "text-[10px] font-medium",
                                    active && "font-semibold"
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}

                    {/* More Button */}
                    <button
                        onClick={() => setShowMore(true)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors duration-200",
                            "text-muted-foreground"
                        )}
                    >
                        <div className="p-1.5 rounded-xl">
                            <MoreHorizontal size={20} strokeWidth={2} />
                        </div>
                        <span className="text-[10px] font-medium">More</span>
                    </button>
                </div>
            </nav>
        </>
    );
}
