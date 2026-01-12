
import { supabase } from '@/lib/supabase/client';

export type MetadataOptions = {
    matches: { id: string, label: string }[];
    players: string[];
};

export const getMetadata = async (): Promise<MetadataOptions> => {
    // Fetch unique players and matches
    const { data: stats, error } = await supabase
        .from('player_stats')
        .select(`
            player_name,
            matches ( date, opponent )
        `);

    if (error) throw error;
    if (!stats) return { matches: [], players: [] };

    // Unique Players
    const players = Array.from(new Set(stats.map((s: any) => s.player_name?.trim()))).filter(Boolean).sort() as string[];

    // Unique Matches
    const matchMap = new Map<string, string>();
    stats.forEach((s: any) => {
        const match = s.matches;
        if (match && match.opponent && match.date) {
            // Identifier: Opponent (Date)
            const label = `${match.opponent} (${match.date})`;
            matchMap.set(label, label); // Using label as ID for now since API uses string matching
        }
    });

    const matches = Array.from(matchMap.values())
        .map(m => ({ id: m, label: m }))
        .sort((a, b) => b.label.localeCompare(a.label));

    return { matches, players };
};
