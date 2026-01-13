import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface FifaCardProps {
    name: string;
    position?: string;
    rating: number;
    stats: {
        pac: number;
        sho: number;
        pas: number;
        dri: number;
        def: number;
        phy: number;
    };
    country?: string; // ISO code or name
    club?: string;
    className?: string;
    imageUrl?: string;
}

export function FifaCard({
    name,
    position = "CM",
    rating,
    stats,
    className,
    imageUrl
}: FifaCardProps) {

    const getCardTheme = (r: number) => {
        if (r >= 90) return {
            bg: "bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f3460]", // Special Dark Blue
            text: "text-white",
            border: "border-blue-400/50",
            accent: "text-blue-200",
            divider: "bg-blue-400/30",
            glow: "bg-blue-500/30"
        };
        if (r >= 75) return {
            bg: "bg-gradient-to-b from-[#fceabb] to-[#f8b500]", // Gold
            text: "text-[#382d1c]",
            border: "border-[#e8b548]",
            accent: "text-[#382d1c]/80",
            divider: "bg-[#382d1c]/30",
            glow: "bg-yellow-400/20"
        };
        if (r >= 65) return {
            bg: "bg-gradient-to-b from-[#e0e0e0] to-[#bdbdbd]", // Silver
            text: "text-[#1f1f1f]",
            border: "border-[#a0a0a0]",
            accent: "text-[#1f1f1f]/80",
            divider: "bg-[#1f1f1f]/30",
            glow: "bg-gray-400/20"
        };
        return {
            bg: "bg-gradient-to-b from-[#e6aa86] to-[#a36f49]", // Bronze
            text: "text-[#2e1d11]",
            border: "border-[#8a5d3b]",
            accent: "text-[#2e1d11]/80",
            divider: "bg-[#2e1d11]/30",
            glow: "bg-orange-400/20"
        };
    };

    const theme = getCardTheme(rating);

    return (
        // Wrapper applying drop-shadow filter for the clipped shape
        <div className={cn("relative w-64 h-96 select-none transition-transform hover:scale-105 duration-300 filter drop-shadow-2xl", className)}>

            {/* Card Shape & Background */}
            <div
                className={cn(
                    "absolute inset-0 w-full h-full rounded-t-2xl rounded-b-[3rem] border-2 shadow-inner overflow-hidden",
                    theme.bg,
                    theme.border
                )}
                style={{
                    clipPath: "path('M 0 0 L 256 0 L 256 300 C 256 340 220 384 128 384 C 36 384 0 340 0 300 Z')"
                }}
            >
                {/* Inner Border/Texture */}
                <div className={cn("absolute inset-1 border-2 rounded-t-xl rounded-b-[2.8rem] opacity-50", theme.border)} />

                {/* Top Info */}
                <div className={cn("absolute top-8 left-6 font-bold flex flex-col items-center leading-none", theme.text)}>
                    <span className="text-3xl">{rating}</span>
                    <span className="text-sm mt-1">{position}</span>
                </div>

                {/* Player Image */}
                <div className="absolute top-8 right-4 w-32 h-32 flex items-center justify-center">
                    {imageUrl ? (
                        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                        <User className={cn("w-24 h-24 opacity-80", theme.text)} />
                    )}
                </div>

                {/* Name */}
                <div className="absolute top-[50%] left-0 w-full text-center">
                    <h2 className={cn("font-bold text-xl uppercase tracking-tighter truncate px-4 font-serif", theme.text)}>
                        {name}
                    </h2>
                    <div className={cn("mx-auto w-3/4 h-[1px] mt-1", theme.divider)} />
                </div>

                {/* Stats Grid */}
                <div className="absolute top-[60%] left-0 w-full px-6 py-2">
                    <div className={cn("grid grid-cols-2 gap-x-2 gap-y-1", theme.text)}>
                        <div className="flex items-center justify-between">
                            <span className="font-bold">{stats.pac}</span>
                            <span className={cn("text-xs font-semibold", theme.accent)}>PAC</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-bold">{stats.dri}</span>
                            <span className={cn("text-xs font-semibold", theme.accent)}>DRI</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="font-bold">{stats.sho}</span>
                            <span className={cn("text-xs font-semibold", theme.accent)}>SHO</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-bold">{stats.def}</span>
                            <span className={cn("text-xs font-semibold", theme.accent)}>DEF</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="font-bold">{stats.pas}</span>
                            <span className={cn("text-xs font-semibold", theme.accent)}>PAS</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-bold">{stats.phy}</span>
                            <span className={cn("text-xs font-semibold", theme.accent)}>PHY</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Deco */}
                <div className="absolute bottom-6 left-0 w-full flex justify-center opacity-40">
                    <div className={cn("w-2 h-2 rounded-full mx-1", theme.text.replace('text-', 'bg-'))} />
                    <div className={cn("w-2 h-2 rounded-full mx-1", theme.text.replace('text-', 'bg-'))} />
                </div>
            </div>

            {/* Glow Effect - behind the card */}
            <div className={cn("absolute -inset-2 blur-xl rounded-full -z-10", theme.glow)} />
        </div>
    );
}
