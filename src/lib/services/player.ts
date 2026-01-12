
import { supabase } from '@/lib/supabase/client';

export const getPlayerStats = async (playerName: string) => {
    // 1. Fetch Match Stats
    const { data: stats, error } = await supabase
        .from('player_stats')
        .select(`
      *,
      matches ( date, opponent )
    `)
        .eq('player_name', playerName)
        .order('created_at', { ascending: false }); // Best proxy for date if date not indexed

    if (error) throw error;

    // 2. Fetch Performance Stats
    const { data: perfStats, error: perfError } = await supabase
        .from('performance_stats')
        .select('*')
        .eq('player_name', playerName);

    if (perfError) throw perfError;

    // 3. Process Stats
    const matches = (stats || []).map(s => ({
        ...s,
        date: s.matches?.date,
        opponent: s.matches?.opponent,
        feedback: s.feedback || '',
        passing_accuracy: s.total_passes > 0 ? (s.successful_passes / s.total_passes) * 100 : 0
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Aggregate totals
    const totals = matches.reduce((acc, curr) => ({
        games: acc.games + 1,
        goals: acc.goals + (curr.goals || 0),
        assists: acc.assists + (curr.assists || 0),
        minutes: acc.minutes + (curr.minutes_played || 0),
        shots: acc.shots + (curr.total_shots || 0),
        tackles: acc.tackles + (curr.total_tackles || 0),
        passes: acc.passes + (curr.total_passes || 0),
        successful_passes: acc.successful_passes + (curr.successful_passes || 0)
    }), { games: 0, goals: 0, assists: 0, minutes: 0, shots: 0, tackles: 0, passes: 0, successful_passes: 0 });

    const avgPassing = totals.passes > 0 ? (totals.successful_passes / totals.passes) * 100 : 0;

    return {
        profile: { name: playerName, ...totals, avgPassing },
        matches,
        gym: perfStats || []
    };
};
