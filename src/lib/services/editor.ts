
import { supabase } from '@/lib/supabase/client';

export type EditorTable = 'match_stats' | 'performance_stats';

export const getEditableData = async (table: EditorTable) => {
    if (table === 'match_stats') {
        const { data, error } = await supabase
            .from('player_stats')
            .select(`
                *,
                matches ( date, opponent )
            `)
            .order('matches(date)', { ascending: false });

        if (error) throw error;
        return data.map((row: any) => ({
            ...row,
            match_date: row.matches?.date,
            match_opponent: row.matches?.opponent
        }));
    } else {
        const { data, error } = await supabase
            .from('performance_stats')
            .select('*')
            .order('player_name', { ascending: true });

        if (error) throw error;
        return data;
    }
};

export const updateMatchStat = async (match_id: string, player_name: string, updates: any) => {
    const { error } = await supabase
        .from('player_stats')
        .update(updates)
        .eq('match_id', match_id)
        .eq('player_name', player_name);

    if (error) throw error;
    return true;
};

export const updatePerformanceStat = async (player_name: string, exercise: string, updates: any) => {
    const { error } = await supabase
        .from('performance_stats')
        .update(updates)
        .eq('player_name', player_name)
        .eq('exercise', exercise);

    if (error) throw error;
    return true;
};

export const updateMatch = async (match_id: string, updates: any) => {
    const { error } = await supabase
        .from('matches')
        .update(updates)
        .eq('id', match_id);

    if (error) throw error;
    return true;
};
