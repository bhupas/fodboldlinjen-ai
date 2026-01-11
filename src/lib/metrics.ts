
import { SupabaseClient } from '@supabase/supabase-js';

export interface PlayerStat {
    match_id: string;
    player_name: string;
    successful_passes: number;
    total_passes: number;
    total_shots: number;
    tackles_own_half: number;
    tackles_opp_half: number;
    total_tackles: number;
    feedback?: string;
    matches?: {
        date: string;
        opponent: string;
    }
}

export interface EnrichedPlayerStat extends PlayerStat {
    Match: string;
    Passing_Accuracy: number;
    Defensive_Action_Ratio: number;
    Offensive_Contribution: number;
    Defensive_Contribution: number;
    Shots_per_Pass: number;
    Player_Involvement: number;
    Overall_Impact: number;
    Pressing_Intensity: number;
    Shooting_Efficiency: number;
    Ball_Retention: number;
    Defensive_Workrate: number;
    Performance_Rating: number;
}

export const calculateMetrics = (data: PlayerStat[]): EnrichedPlayerStat[] => {
    // 1. First pass: Basic Metrics
    let enriched = data.map(curr => {
        // Safe match identifier
        const matchDate = curr.matches?.date || 'Unknown Date';
        const opponent = curr.matches?.opponent || 'Unknown Opponent';
        const Match = `${opponent} (${matchDate})`;

        const total_passes = curr.total_passes || 0;
        const successful_passes = curr.successful_passes || 0;
        const total_shots = curr.total_shots || 0;
        const total_tackles = curr.total_tackles || 0;
        const tackles_opp = curr.tackles_opp_half || 0;
        const tackles_own = curr.tackles_own_half || 0;

        const Passing_Accuracy = total_passes > 0 ? (successful_passes / total_passes) * 100 : 0;
        const Defensive_Action_Ratio = total_tackles > 0 ? (tackles_opp / total_tackles) * 100 : 0;

        const Offensive_Contribution = (total_shots * 2) + (successful_passes * 0.5);
        const Defensive_Contribution = (tackles_opp * 2) + tackles_own;

        const Shots_per_Pass = total_passes > 0 ? (total_shots / total_passes) * 100 : 0;
        const Player_Involvement = total_passes + total_shots + total_tackles;
        const Overall_Impact = Offensive_Contribution + Defensive_Contribution;

        // Advanced metrics
        const Pressing_Intensity = total_tackles > 0 ? (tackles_opp / total_tackles) * 100 : 0;
        const Shooting_Efficiency = Player_Involvement > 0 ? (total_shots / Player_Involvement) * 100 : 0;
        const Ball_Retention = Player_Involvement > 0 ? (Passing_Accuracy * (total_passes / Player_Involvement)) : 0;
        const Defensive_Workrate = Player_Involvement > 0 ? (total_tackles / Player_Involvement) * 100 : 0;

        return {
            ...curr,
            Match,
            Passing_Accuracy,
            Defensive_Action_Ratio,
            Offensive_Contribution,
            Defensive_Contribution,
            Shots_per_Pass,
            Player_Involvement,
            Overall_Impact,
            Pressing_Intensity,
            Shooting_Efficiency,
            Ball_Retention,
            Defensive_Workrate,
            Performance_Rating: 0 // Placeholder
        };
    });

    // 2. Calculate Quantiles for Normalization (simplified logic to match Python)
    // We need 95th percentile roughly.
    const getQuantile = (arr: number[], q: number) => {
        const sorted = [...arr].sort((a, b) => a - b);
        const pos = (sorted.length - 1) * q;
        const base = Math.floor(pos);
        const rest = pos - base;
        if (sorted[base + 1] !== undefined) {
            return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
        } else {
            return sorted[base];
        }
    };

    const offContribs = enriched.map(e => e.Offensive_Contribution);
    const defContribs = enriched.map(e => e.Defensive_Contribution);

    // If less than 10 records, max is safe enough as per python script logic
    const off_contrib_95 = enriched.length > 10 ? getQuantile(offContribs, 0.95) : Math.max(...offContribs, 1);
    const def_contrib_95 = enriched.length > 10 ? getQuantile(defContribs, 0.95) : Math.max(...defContribs, 1);

    // 3. Second pass: Calculate Performance Rating
    enriched = enriched.map(curr => {
        const norm_off = Math.min((curr.Offensive_Contribution / (off_contrib_95 + 0.01)) * 100, 100);
        const norm_def = Math.min((curr.Defensive_Contribution / (def_contrib_95 + 0.01)) * 100, 100);

        const Performance_Rating = (
            curr.Passing_Accuracy * 0.25 +
            curr.Defensive_Action_Ratio * 0.15 +
            norm_off * 0.3 +
            norm_def * 0.3
        );

        return {
            ...curr,
            Performance_Rating
        };
    });

    return enriched;
};
