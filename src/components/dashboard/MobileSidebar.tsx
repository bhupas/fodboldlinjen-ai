"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
    Menu,
    X,
    Database,
    Settings
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/upload", label: "Upload Data", icon: Upload },
    { href: "/players", label: "Player Stats", icon: Users },
    { href: "/comparison", label: "Head to Head", icon: Swords },
    { href: "/ai-coach", label: "AI Coach", icon: BrainCircuit },
    { href: "/editor", label: "Data Editor", icon: Database },
    { href: "/admin/users", label: "Sys Admin", icon: Settings },
];

export default function MobileSidebar() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <div className="md:hidden">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <Sparkles className="text-primary" size={20} />
                    <span className="font-bold text-lg text-foreground">Elite Coach</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="text-foreground">
                    <Menu size={24} />
                </Button>
            </div>

            {/* Backdrop */}
            {open && (
                <div
                    className="fixed inset-0 bg-background/80 z-[60] backdrop-blur-sm animate-in fade-in"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Drawer */}
            <div className={cn(
                "fixed inset-y-0 right-0 w-[280px] bg-card border-l border-border z-[70] transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl",
                open ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="p-4 flex items-center justify-between border-b border-border">
                    <span className="font-bold text-foreground">Menu</span>
                    <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </Button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                                    isActive
                                        ? "bg-primary/10 text-primary border border-primary/20"
                                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                )}
                            >
                                <item.icon size={18} className={isActive ? "text-primary" : ""} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-border">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-2 rounded-xl"
                        onClick={handleSignOut}
                    >
                        <LogOut size={18} />
                        Sign Out
                    </Button>
                </div>
            </div>
        </div>
    );
}
