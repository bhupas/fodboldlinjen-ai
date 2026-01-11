"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
    Menu,
    X
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/upload", label: "Upload Data", icon: Upload },
    { href: "/players", label: "Player Stats", icon: Users },
    { href: "/comparison", label: "Head to Head", icon: Activity },
    { href: "/ai-coach", label: "AI Coach", icon: BrainCircuit },
    { href: "/admin/users", label: "Sys Admin", icon: Users },
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
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <Sparkles className="text-blue-400" size={20} />
                    <span className="font-bold text-lg text-white">Elite Coach</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="text-white">
                    <Menu size={24} />
                </Button>
            </div>

            {/* Backdrop */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm animate-in fade-in"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Drawer */}
            <div className={cn(
                "fixed inset-y-0 right-0 w-[280px] bg-[#0f172a] border-l border-white/10 z-[70] transform transition-transform duration-300 ease-in-out flex flex-col",
                open ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="p-4 flex items-center justify-between border-b border-white/10">
                    <span className="font-bold text-white">Menu</span>
                    <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">
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
                                    "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                                    isActive
                                        ? "bg-blue-600/20 text-blue-400 border border-blue-600/20"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <item.icon size={18} className={isActive ? "text-blue-400" : ""} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/5 gap-2"
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
