
import { supabase } from '@/lib/supabase/client';

interface UploadResult {
    successCount: number;
    errors: string[];
    type: string;
    details?: {
        matchesCreated?: number;
        matchesUpdated?: number;
        playersAffected?: string[];
    };
}

export const uploadData = async (rows: any[]): Promise<UploadResult> => {
    if (rows.length === 0) return { successCount: 0, errors: ['No data to upload'], type: '' };

    // Check type of first row
    if (rows[0]._type === 'performance') {
        const result = await uploadPerformanceData(rows);
        return { ...result, type: 'performance' };
    } else {
        const result = await uploadMatchData(rows);
        return { ...result, type: 'match' };
    }
};

const uploadPerformanceData = async (rows: any[]): Promise<Omit<UploadResult, 'type'>> => {
    let successCount = 0;
    const errors: string[] = [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { successCount: 0, errors: ["User not authenticated. Please log in again."] };

    // Validate and map rows to DB columns
    const validRows: any[] = [];
    const invalidRows: { row: number; reason: string }[] = [];

    rows.forEach((r, index) => {
        const playerName = String(r.Player || '').trim();
        const exercise = String(r.Exercise || '').trim();

        if (!playerName) {
            invalidRows.push({ row: index + 1, reason: 'Missing player name' });
            return;
        }
        if (!exercise) {
            invalidRows.push({ row: index + 1, reason: 'Missing exercise name' });
            return;
        }

        validRows.push({
            user_id: user.id,
            player_name: playerName,
            exercise: exercise,
            pr_1: parseFloat(r.PR1) || null,
            pr_2: parseFloat(r.PR2) || null,
            pr_3: parseFloat(r.PR3) || null,
            pr_4: parseFloat(r.PR4) || null
        });
    });

    // Report validation errors
    if (invalidRows.length > 0) {
        const grouped = invalidRows.reduce((acc, { reason }) => {
            acc[reason] = (acc[reason] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        Object.entries(grouped).forEach(([reason, count]) => {
            errors.push(`${count} row(s) skipped: ${reason}`);
        });
    }

    if (validRows.length === 0) {
        errors.push("No valid performance data found to insert.");
        return { successCount: 0, errors };
    }

    try {
        const { error } = await supabase
            .from('performance_stats')
            .upsert(validRows, { onConflict: 'user_id, player_name, exercise' });

        if (error) {
            errors.push(`Database error: ${error.message}`);
        } else {
            successCount = validRows.length;
        }

    } catch (err: any) {
        console.error("Error uploading performance data:", err);
        errors.push(`Upload failed: ${err.message}`);
    }

    return { successCount, errors };
};

const uploadMatchData = async (rows: any[]): Promise<Omit<UploadResult, 'type'>> => {
    let successCount = 0;
    const errors: string[] = [];
    const details = {
        matchesCreated: 0,
        matchesUpdated: 0,
        playersAffected: [] as string[]
    };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { successCount: 0, errors: ["User not authenticated. Please log in again."] };

    // Validate rows first
    const invalidRows: { row: number; reason: string }[] = [];
    const validRows: any[] = [];

    rows.forEach((row, index) => {
        const playerName = String(row.Player || '').trim();

        if (!playerName) {
            invalidRows.push({ row: index + 1, reason: 'Missing player name' });
            return;
        }

        validRows.push(row);
    });

    // Report validation errors
    if (invalidRows.length > 0) {
        errors.push(`${invalidRows.length} row(s) skipped: Missing player name`);
    }

    if (validRows.length === 0) {
        errors.push("No valid match data found to insert.");
        return { successCount: 0, errors };
    }

    // Group by Match (Opponent + Date)
    const matchesMap = new Map<string, { date: string, opponent: string, team: string, rows: any[] }>();

    for (const row of validRows) {
        const dateStr = row.Timestamp;
        let dateObj = new Date();
        if (typeof dateStr === 'number') {
            // Excel date serial number
            dateObj = new Date(Math.round((dateStr - 25569) * 86400 * 1000));
        } else if (dateStr) {
            dateObj = new Date(dateStr);
        }

        const isoDate = !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        const opponent = String(row.Opponent || '').trim() || 'Unknown Opponent';
        const key = `${isoDate}_${opponent}`;

        if (!matchesMap.has(key)) {
            matchesMap.set(key, {
                date: isoDate,
                opponent: opponent,
                team: String(row.Team || '').trim() || 'My Team',
                rows: []
            });
        }
        matchesMap.get(key)!.rows.push(row);
    }

    // Insert Matches and Stats
    for (const [key, matchData] of matchesMap.entries()) {
        try {
            // Check if match exists
            const { data: existingMatches, error: matchCheckError } = await supabase
                .from('matches')
                .select('id')
                .eq('date', matchData.date)
                .eq('opponent', matchData.opponent)
                .maybeSingle();

            if (matchCheckError) {
                errors.push(`Failed to check match "${matchData.opponent}" (${matchData.date}): ${matchCheckError.message}`);
                continue;
            }

            let matchId = existingMatches?.id;
            const isNewMatch = !matchId;

            if (!matchId) {
                const { data: newMatch, error: createError } = await supabase
                    .from('matches')
                    .insert({
                        user_id: user.id,
                        date: matchData.date,
                        opponent: matchData.opponent,
                        team: matchData.team
                    })
                    .select()
                    .single();

                if (createError) {
                    errors.push(`Failed to create match vs "${matchData.opponent}" (${matchData.date}): ${createError.message}`);
                    continue;
                }
                matchId = newMatch.id;
                details.matchesCreated++;
            } else {
                details.matchesUpdated++;
            }

            // Prepare player stats
            const statsToInsert = matchData.rows.map(r => {
                const playerName = String(r.Player || '').trim();
                if (!details.playersAffected.includes(playerName)) {
                    details.playersAffected.push(playerName);
                }
                return {
                    match_id: matchId,
                    player_name: playerName,
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
                };
            });

            const { error: statsError } = await supabase
                .from('player_stats')
                .upsert(statsToInsert, { onConflict: 'match_id, player_name' });

            if (statsError) {
                errors.push(`Failed to save stats for match vs "${matchData.opponent}": ${statsError.message}`);
                continue;
            }

            successCount += matchData.rows.length;

        } catch (err: any) {
            console.error("Error inserting match group:", key, err);
            errors.push(`Failed to upload match vs "${matchData.opponent}" (${matchData.date}): ${err.message}`);
        }
    }

    return { successCount, errors, details };
};
