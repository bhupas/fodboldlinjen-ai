
import { supabase } from '@/lib/supabase/client';

export type DashboardStats = {
    totalMatches: number;
    avgRating: number;
    avgPassing: number;
    totalGoals: number; // approximations from shots? No, shots != goals. But we have 'Total_Shots'. 
    // We can track 'Total_Shots', 'Total_Tackles', etc.
};

export const getDashboardStats = async () => {
    const { data: stats, error } = await supabase
        .from('player_stats')
        .select(`
      *,
      matches ( date, opponent )
    `);

    const { data: perfStats, error: perfError } = await supabase
        .from('performance_stats')
        .select('*');

    if (error) throw error;
    if (perfError) throw perfError;

    if (error) throw error;
    if (!stats) return null;

    // Aggregate
    const uniqueMatchIds = new Set(stats.map(s => s.match_id));
    const totalMatches = uniqueMatchIds.size;

    // Calculate Performance Rating if not present (simple formula from python)
    // Rating = (Passing% * 0.25) + (DefActionRatio... ) -- hard to replicate exactly without all columns in DB immediately correct.
    // We imported 'successful_passes' etc.

    // Let's compute a simple rating for now or assume it's calculated on fly.
    // The python code calculated 'Performance_Rating' on the fly.
    // We should replicate that logic here or in the 'upload' phase. 
    // Ideally in 'upload' phase we computed it? NO, I didn't add it to `uploadData` service logic. 
    // I only inserted raw stats. So I must compute it on the fly here.

    const enrichedStats = stats.map(s => {
        const total_passes = s.total_passes || 0;
        const successful_passes = s.successful_passes || 0;
        const passing_accuracy = total_passes > 0 ? (successful_passes / total_passes) * 100 : 0;

        // Simplified Rating for dashboard demo:
        // This is a placeholder. 
        // Real logic from python:
        // Off_Contrib = shots*2 + succ_pass*0.5
        // Def_Contrib = opp_tackles*2 + own_tackles
        // ...
        const off_contrib = (s.total_shots * 2) + (s.successful_passes * 0.5);
        const def_contrib = (s.tackles_opp_half * 2) + (s.tackles_own_half);

        // Normalize? The python code used quantiles. That's hard to do one-by-one.
        // For now, let's just return raw aggregates and compute averages.
        return {
            ...s,
            passing_accuracy,
            off_contrib,
            def_contrib
        };
    });

    const avgPassing = enrichedStats.reduce((acc, s) => acc + s.passing_accuracy, 0) / (enrichedStats.length || 1);
    const totalShots = enrichedStats.reduce((acc, s) => acc + s.total_shots, 0);
    const totalTackles = enrichedStats.reduce((acc, s) => acc + s.total_tackles, 0);

    // Group by Player for Top Performers
    const playerMap = new Map<string, {
        name: string,
        games: number,
        avgPassing: number,
        totalShots: number,
        totalTackles: number,
        goals: number,
        assists: number,
        minutes: number,
        yellowCards: number,
        redCards: number,
        perfCount: number,
        offContrib: number,
        defContrib: number
    }>();

    enrichedStats.forEach(s => {
        if (!playerMap.has(s.player_name)) {
            playerMap.set(s.player_name, {
                name: s.player_name,
                games: 0,
                avgPassing: 0,
                totalShots: 0,
                totalTackles: 0,
                goals: 0,
                assists: 0,
                minutes: 0,
                yellowCards: 0,
                redCards: 0,
                perfCount: 0,
                offContrib: 0,
                defContrib: 0
            });
        }
        const p = playerMap.get(s.player_name)!;
        p.games++;
        p.avgPassing += s.passing_accuracy;
        p.totalShots += s.total_shots;
        p.totalTackles += s.total_tackles;
        p.goals += (s.goals || 0);
        p.assists += (s.assists || 0);
        p.minutes += (s.minutes_played || 0);
        p.yellowCards += (s.yellow_cards || 0);
        p.redCards += (s.red_cards || 0);
        p.offContrib += s.off_contrib;
        p.defContrib += s.def_contrib;
    });

    if (perfStats) {
        perfStats.forEach((p: any) => {
            if (!playerMap.has(p.player_name)) {
                playerMap.set(p.player_name, {
                    name: p.player_name,
                    games: 0, avgPassing: 0, totalShots: 0, totalTackles: 0, goals: 0, assists: 0, minutes: 0,
                    yellowCards: 0, redCards: 0, perfCount: 0, offContrib: 0, defContrib: 0
                });
            }
            const player = playerMap.get(p.player_name)!;
            player.perfCount++;
        });
    }

    // Gym Data Enrichment
    const playerGymMap = new Map<string, { exercise: string, maxPR: number }[]>();
    if (perfStats) {
        perfStats.forEach((p: any) => {
            if (!playerGymMap.has(p.player_name)) {
                playerGymMap.set(p.player_name, []);
            }
            const maxPR = Math.max(p.pr_1 || 0, p.pr_2 || 0, p.pr_3 || 0, p.pr_4 || 0);
            playerGymMap.get(p.player_name)!.push({
                exercise: p.exercise,
                maxPR: maxPR
            });
        });
    }

    const allPlayers = Array.from(playerMap.values()).map(p => ({
        name: p.name,
        avgPassing: p.avgPassing / (p.games || 1), // Prevent div by zero
        totalShots: p.totalShots,
        totalTackles: p.totalTackles,
        goals: p.goals,
        assists: p.assists,
        minutes: p.minutes,
        yellowCards: p.yellowCards,
        redCards: p.redCards,
        perfCount: p.perfCount,
        games: p.games,
        offContrib: p.offContrib / (p.games || 1), // Average per game
        defContrib: p.defContrib / (p.games || 1), // Average per game
        gymData: playerGymMap.get(p.name) || [] // Attach detailed gym data
    })).sort((a, b) => b.games - a.games); // Default sort by games played

    const topPlayers = [...allPlayers].sort((a, b) => b.avgPassing - a.avgPassing).slice(0, 5);

    // Recent Activity (Average Performance per Match over time)
    const matchMap = new Map<string, { date: string, totalRating: number, count: number }>();

    enrichedStats.forEach(s => {
        const date = s.matches?.date || 'Unknown';
        if (!matchMap.has(date)) {
            matchMap.set(date, { date, totalRating: 0, count: 0 });
        }
        const m = matchMap.get(date)!;
        // Approximation of rating if not present
        const rating = s.performance_rating || (s.passing_accuracy * 0.5 + (s.total_shots || 0) * 5);
        m.totalRating += rating;
        m.count++;
    });

    const recentActivity = Array.from(matchMap.values())
        .map(m => ({
            date: m.date,
            performance: m.totalRating / m.count
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-10); // Last 10 matches

    const topGymPlayers = [...allPlayers].sort((a, b) => b.perfCount - a.perfCount).slice(0, 5);
    const totalGymEntries = perfStats ? perfStats.length : 0;

    return {
        totalMatches,
        avgPassing,
        totalShots,
        totalTackles,
        topPlayers,
        topGymPlayers,
        totalGymEntries,
        allPlayers,
        recentActivity
    };
};

export const getRawStats = async () => {
    const { data: matchStats, error } = await supabase
        .from('player_stats')
        .select(`
      *,
      matches ( date, opponent )
    `);

    const { data: perfStats, error: perfError } = await supabase
        .from('performance_stats')
        .select('*');

    if (error) throw error;
    if (perfError) throw perfError;

    return {
        matchStats: matchStats?.map(s => ({
            ...s,
            date: s.matches?.date,
            opponent: s.matches?.opponent
        })) || [],
        perfStats: perfStats || []
    };
};
