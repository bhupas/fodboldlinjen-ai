
import { supabase } from '@/lib/supabase/client';
import { UploadedRow } from '@/types';

export const uploadData = async (rows: any[]) => {
    let successCount = 0;
    let errors: string[] = [];

    // 1. Group by Match (Opponent + Date)
    // We assume 'Match' identifier is Opponent + Timestamp (Date)
    // If Timestamp is missing, we use just Opponent, but that risks merging matches.

    const matchesMap = new Map<string, { date: string, opponent: string, team: string, rows: any[] }>();

    for (const row of rows) {
        // Basic cleaning
        const dateStr = row.Timestamp;
        // Need to handle Date parsing if it's an Excel serial or string
        let dateObj = new Date();
        if (typeof dateStr === 'number') {
            // Excel serial date roughly (simplification)
            dateObj = new Date(Math.round((dateStr - 25569) * 86400 * 1000));
        } else if (dateStr) {
            dateObj = new Date(dateStr);
        }

        const isoDate = !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        const opponent = row.Opponent || 'Unknown Opponent';
        const key = `${isoDate}_${opponent}`;

        if (!matchesMap.has(key)) {
            matchesMap.set(key, {
                date: isoDate,
                opponent: opponent,
                team: row.Team || 'My Team',
                rows: []
            });
        }
        matchesMap.get(key)!.rows.push(row);
    }

    // 2. Insert Matches and Stats
    for (const [key, matchData] of matchesMap.entries()) {
        try {
            // Check if match exists (deduplication logic could be stricter, here based on Date+Opponent)
            const { data: existingMatches, error: matchCheckError } = await supabase
                .from('matches')
                .select('id')
                .eq('date', matchData.date)
                .eq('opponent', matchData.opponent)
                .maybeSingle();

            if (matchCheckError) throw matchCheckError;

            let matchId = existingMatches?.id;

            if (!matchId) {
                const { data: newMatch, error: createError } = await supabase
                    .from('matches')
                    .insert({
                        date: matchData.date,
                        opponent: matchData.opponent,
                        team: matchData.team
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                matchId = newMatch.id;
            }

            // Insert Player Stats
            const statsToInsert = matchData.rows.map(r => ({
                match_id: matchId,
                player_name: r.Player,
                successful_passes: Number(r.Successful_Passes) || 0,
                total_passes: Number(r.Total_Passes) || 0,
                total_shots: Number(r.Total_Shots) || 0,
                tackles_own_half: Number(r.Tackles_Own_Half) || 0,
                tackles_opp_half: Number(r.Tackles_Opponent_Half) || 0,
                total_tackles: Number(r.Total_Tackles) || 0,
                goals: Number(r.Goals) || 0,
                assists: Number(r.Assists) || 0,
                minutes_played: Number(r.Minutes) || 0,
                yellow_cards: Number(r.Yellow_Cards) || 0,
                red_cards: Number(r.Red_Cards) || 0,
                feedback: r.Feedback
            }));

            const { error: statsError } = await supabase
                .from('player_stats')
                .upsert(statsToInsert, { onConflict: 'match_id, player_name' });

            if (statsError) throw statsError;

            successCount += matchData.rows.length;

        } catch (err: any) {
            console.error("Error inserting match group:", key, err);
            errors.push(`Failed to upload match vs ${matchData.opponent}: ${err.message}`);
        }
    }

    return { successCount, errors };
};
