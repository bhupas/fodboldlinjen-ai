
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

    // Also fetch players from gym/performance data
    const { data: perfStats } = await supabase
        .from('performance_stats')
        .select('player_name');

    // Combine all unique player names from both sources
    const playerSet = new Set<string>();

    // Add players from match stats
    if (stats) {
        stats.forEach((s: any) => {
            if (s.player_name?.trim()) {
                playerSet.add(s.player_name.trim());
            }
        });
    }

    // Add players from gym/performance stats
    if (perfStats) {
        perfStats.forEach((p: any) => {
            if (p.player_name?.trim()) {
                playerSet.add(p.player_name.trim());
            }
        });
    }

    const players = Array.from(playerSet).sort();

    // Unique Matches
    const matchMap = new Map<string, string>();
    if (stats) {
        stats.forEach((s: any) => {
            const match = s.matches;
            if (match && match.opponent && match.date) {
                // Identifier: Opponent (Date)
                const label = `${match.opponent} (${match.date})`;
                matchMap.set(label, label); // Using label as ID for now since API uses string matching
            }
        });
    }

    const matches = Array.from(matchMap.values())
        .map(m => ({ id: m, label: m }))
        .sort((a, b) => b.label.localeCompare(a.label));

    return { matches, players };
};
