
import { supabase } from '@/lib/supabase/client';
import { UploadedRow } from '@/types';

export const uploadData = async (rows: any[]) => {
    if (rows.length === 0) return { successCount: 0, errors: [] };

    // Check type of first row
    if (rows[0]._type === 'performance') {
        return uploadPerformanceData(rows);
    } else {
        return uploadMatchData(rows);
    }
};

const uploadPerformanceData = async (rows: any[]) => {
    let successCount = 0;
    const errors: string[] = [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { successCount: 0, errors: ["User not authenticated"] };

    // Map rows to DB columns
    const toInsert = rows.map(r => ({
        user_id: user.id, // Explicitly bind to user
        player_name: r.Player,
        exercise: r.Exercise,
        pr_1: parseFloat(r.PR1) || null,
        pr_2: parseFloat(r.PR2) || null,
        pr_3: parseFloat(r.PR3) || null,
        pr_4: parseFloat(r.PR4) || null
    })).filter(r => r.player_name && r.exercise);

    if (toInsert.length === 0) {
        return { successCount: 0, errors: ["No valid performance data found to insert."] };
    }

    try {
        const { error } = await supabase
            .from('performance_stats')
            .upsert(toInsert, { onConflict: 'user_id, player_name, exercise' });

        if (error) throw error;

        successCount = toInsert.length;

    } catch (err: any) {
        console.error("Error uploading performance data:", err);
        errors.push(err.message);
    }

    return { successCount, errors };
};

const uploadMatchData = async (rows: any[]) => {
    let successCount = 0;
    let errors: string[] = [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { successCount: 0, errors: ["User not authenticated"] };

    // 1. Group by Match (Opponent + Date)
    const matchesMap = new Map<string, { date: string, opponent: string, team: string, rows: any[] }>();

    for (const row of rows) {
        const dateStr = row.Timestamp;
        let dateObj = new Date();
        if (typeof dateStr === 'number') {
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
            // RLS automatically filters by user_id for SELECT
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
                        user_id: user.id, // Explicitly bind
                        date: matchData.date,
                        opponent: matchData.opponent,
                        team: matchData.team
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                matchId = newMatch.id;
            }

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
                feedback: r.Feedback || ''
            }));

            // player_stats has no user_id column, relies on match_id link
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
