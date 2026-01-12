
import { supabase } from '@/lib/supabase/client';

export interface FeedbackEntry {
    id: string;
    player_name: string;
    feedback: string;
    match_date: string;
    opponent: string;
    performance_rating?: number;
}

export interface FeedbackStats {
    totalFeedback: number;
    uniquePlayers: number;
    uniqueMatches: number;
    avgFeedbackLength: number;
}

// Get all feedback entries with match info
export const getAllFeedback = async (): Promise<FeedbackEntry[]> => {
    const { data, error } = await supabase
        .from('player_stats')
        .select(`
            id,
            player_name,
            feedback,
            total_passes,
            successful_passes,
            total_shots,
            total_tackles,
            matches ( date, opponent )
        `)
        .not('feedback', 'is', null)
        .neq('feedback', '')
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => {
        // Calculate a simple performance rating
        const passingAcc = item.total_passes > 0
            ? (item.successful_passes / item.total_passes) * 100
            : 0;
        const performanceRating = (passingAcc * 0.4) + (item.total_shots * 5) + (item.total_tackles * 2);

        return {
            id: item.id,
            player_name: item.player_name,
            feedback: item.feedback,
            match_date: item.matches?.date || 'Unknown',
            opponent: item.matches?.opponent || 'Unknown',
            performance_rating: performanceRating
        };
    });
};

// Get feedback by player
export const getFeedbackByPlayer = async (playerName: string): Promise<FeedbackEntry[]> => {
    const { data, error } = await supabase
        .from('player_stats')
        .select(`
            id,
            player_name,
            feedback,
            matches ( date, opponent )
        `)
        .eq('player_name', playerName)
        .not('feedback', 'is', null)
        .neq('feedback', '')
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
        id: item.id,
        player_name: item.player_name,
        feedback: item.feedback,
        match_date: item.matches?.date || 'Unknown',
        opponent: item.matches?.opponent || 'Unknown'
    }));
};

// Get feedback by match (opponent)
export const getFeedbackByMatch = async (opponent: string): Promise<FeedbackEntry[]> => {
    // First get match IDs for this opponent
    const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select('id')
        .eq('opponent', opponent);

    if (matchError) throw matchError;

    if (!matches || matches.length === 0) return [];

    const matchIds = matches.map(m => m.id);

    const { data, error } = await supabase
        .from('player_stats')
        .select(`
            id,
            player_name,
            feedback,
            matches ( date, opponent )
        `)
        .in('match_id', matchIds)
        .not('feedback', 'is', null)
        .neq('feedback', '');

    if (error) throw error;

    return (data || []).map((item: any) => ({
        id: item.id,
        player_name: item.player_name,
        feedback: item.feedback,
        match_date: item.matches?.date || 'Unknown',
        opponent: item.matches?.opponent || 'Unknown'
    }));
};

// Get feedback statistics
export const getFeedbackStats = async (): Promise<FeedbackStats> => {
    const feedback = await getAllFeedback();

    const uniquePlayers = new Set(feedback.map(f => f.player_name)).size;
    const uniqueMatches = new Set(feedback.map(f => `${f.opponent}-${f.match_date}`)).size;
    const avgLength = feedback.length > 0
        ? feedback.reduce((acc, f) => acc + f.feedback.length, 0) / feedback.length
        : 0;

    return {
        totalFeedback: feedback.length,
        uniquePlayers,
        uniqueMatches,
        avgFeedbackLength: avgLength
    };
};

// Combine all feedback text for wordcloud
export const getAllFeedbackText = async (): Promise<string> => {
    const feedback = await getAllFeedback();
    return feedback.map(f => f.feedback).join(' ');
};

// Get unique opponents with feedback
export const getOpponentsWithFeedback = async (): Promise<string[]> => {
    const feedback = await getAllFeedback();
    const opponents = new Set(feedback.map(f => f.opponent).filter(o => o !== 'Unknown'));
    return Array.from(opponents).sort();
};

// Get unique players with feedback
export const getPlayersWithFeedback = async (): Promise<string[]> => {
    const feedback = await getAllFeedback();
    const players = new Set(feedback.map(f => f.player_name));
    return Array.from(players).sort();
};
