"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("dark");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Check localStorage first, then system preference
        const stored = localStorage.getItem("theme") as Theme | null;
        if (stored) {
            setTheme(stored);
        } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
            setTheme("light");
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const root = document.documentElement;
        root.classList.remove("dark", "light");
        root.classList.add(theme);
        localStorage.setItem("theme", theme);
    }, [theme, mounted]);

    const toggleTheme = () => {
        setTheme(prev => prev === "dark" ? "light" : "dark");
    };

    // Prevent flash of wrong theme
    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        // Return a default/fallback when not within ThemeProvider (e.g., during SSR)
        return {
            theme: "dark" as Theme,
            toggleTheme: () => { },
            setTheme: () => { }
        };
    }
    return context;
}
