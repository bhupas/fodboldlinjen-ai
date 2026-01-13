"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    LayoutDashboard,
    Upload,
    Users,
    Swords,
    BrainCircuit,
    Database,
    Settings,
    Search,
    Command
} from "lucide-react";

const shortcuts = [
    { key: "d", label: "Home", href: "/home", icon: LayoutDashboard },
    { key: "u", label: "Upload", href: "/upload", icon: Upload },
    { key: "p", label: "Players", href: "/players", icon: Users },
    { key: "c", label: "Head to Head", href: "/comparison", icon: Swords },
    { key: "a", label: "AI", href: "/ai", icon: BrainCircuit },
    { key: "e", label: "Editor", href: "/editor", icon: Database },
    { key: "s", label: "Settings", href: "/settings", icon: Settings },
];

export function KeyboardShortcuts() {
    const router = useRouter();
    const pathname = usePathname();
    const [showHelp, setShowHelp] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                e.target instanceof HTMLSelectElement
            ) {
                return;
            }

            // Show help dialog with Ctrl+/
            if (e.key === "/" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                setShowHelp(true);
                return;
            }

            // Close help dialog with Escape
            if (e.key === "Escape") {
                setShowHelp(false);
                return;
            }

            // Navigation shortcuts (only work in dashboard)
            if (pathname.startsWith("/home") ||
                pathname.startsWith("/upload") ||
                pathname.startsWith("/players") ||
                pathname.startsWith("/comparison") ||
                pathname.startsWith("/ai") ||
                pathname.startsWith("/editor") ||
                pathname.startsWith("/settings") ||
                pathname.startsWith("/admin")) {

                const shortcut = shortcuts.find(s => s.key === e.key.toLowerCase());
                if (shortcut && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    // Only trigger if no input focused (already checked above)
                    e.preventDefault();
                    router.push(shortcut.href);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [router, pathname]);

    return (
        <Dialog open={showHelp} onOpenChange={setShowHelp}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Command size={20} className="text-primary" />
                        Keyboard Shortcuts
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">
                        Press any of these keys to quickly navigate:
                    </p>
                    <div className="grid gap-2">
                        {shortcuts.map((shortcut) => (
                            <div
                                key={shortcut.key}
                                className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <shortcut.icon size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                    <span className="text-sm font-medium">{shortcut.label}</span>
                                </div>
                                <kbd className="px-2.5 py-1 text-xs font-mono rounded-lg bg-background border border-border shadow-sm">
                                    {shortcut.key.toUpperCase()}
                                </kbd>
                            </div>
                        ))}
                    </div>
                    <div className="pt-4 border-t border-border">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Show this help</span>
                            <div className="flex gap-1">
                                <kbd className="px-2.5 py-1 text-xs font-mono rounded-lg bg-background border border-border shadow-sm">
                                    Ctrl
                                </kbd>
                                <span className="text-muted-foreground">+</span>
                                <kbd className="px-2.5 py-1 text-xs font-mono rounded-lg bg-background border border-border shadow-sm">
                                    /
                                </kbd>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
