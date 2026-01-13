/**
 * Performance Metrics Calculator
 * Calculates FIFA-style metrics and performance ratings from raw player statistics
 */

import { PERFORMANCE_WEIGHTS } from './constants';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Raw player statistics from the database
 */
export interface PlayerStat {
    match_id: string;
    player_name: string;
    successful_passes: number;
    total_passes: number;
    total_shots: number;
    tackles_own_half: number;
    tackles_opp_half: number;
    total_tackles: number;
    goals?: number;
    assists?: number;
    minutes_played?: number;
    yellow_cards?: number;
    red_cards?: number;
    distance_km?: number;
    feedback?: string;
    matches?: {
        date: string;
        opponent: string;
    };
}

/**
 * Enriched player statistics with calculated metrics
 */
export interface EnrichedPlayerStat extends PlayerStat {
    Match: string;
    date?: string;
    opponent?: string;
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

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate the quantile value from an array
 * @param arr - Array of numbers
 * @param q - Quantile (0-1)
 */
function getQuantile(arr: number[], q: number): number {
    if (arr.length === 0) return 0;

    const sorted = [...arr].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;

    if (sorted[base + 1] !== undefined) {
        return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    }
    return sorted[base];
}

/**
 * Safely get a numeric value, defaulting to 0
 */
function safeNumber(value: number | undefined | null): number {
    return value ?? 0;
}

// =============================================================================
// METRIC CALCULATIONS
// =============================================================================

interface BasicMetrics {
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
}

/**
 * Calculate basic metrics for a single player stat
 */
function calculateBasicMetrics(stat: PlayerStat): BasicMetrics {
    const total_passes = safeNumber(stat.total_passes);
    const successful_passes = safeNumber(stat.successful_passes);
    const total_shots = safeNumber(stat.total_shots);
    const total_tackles = safeNumber(stat.total_tackles);
    const tackles_opp = safeNumber(stat.tackles_opp_half);
    const tackles_own = safeNumber(stat.tackles_own_half);

    // Primary metrics
    const Passing_Accuracy = total_passes > 0
        ? (successful_passes / total_passes) * 100
        : 0;

    const Defensive_Action_Ratio = total_tackles > 0
        ? (tackles_opp / total_tackles) * 100
        : 0;

    // Contribution metrics
    const Offensive_Contribution = (total_shots * 2) + (successful_passes * 0.5);
    const Defensive_Contribution = (tackles_opp * 2) + tackles_own;

    // Ratio metrics
    const Shots_per_Pass = total_passes > 0
        ? (total_shots / total_passes) * 100
        : 0;

    const Player_Involvement = total_passes + total_shots + total_tackles;
    const Overall_Impact = Offensive_Contribution + Defensive_Contribution;

    // Advanced metrics
    const Pressing_Intensity = total_tackles > 0
        ? (tackles_opp / total_tackles) * 100
        : 0;

    const Shooting_Efficiency = Player_Involvement > 0
        ? (total_shots / Player_Involvement) * 100
        : 0;

    const Ball_Retention = Player_Involvement > 0
        ? Passing_Accuracy * (total_passes / Player_Involvement)
        : 0;

    const Defensive_Workrate = Player_Involvement > 0
        ? (total_tackles / Player_Involvement) * 100
        : 0;

    return {
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
    };
}

/**
 * Calculate normalized performance rating
 */
function calculatePerformanceRating(
    metrics: BasicMetrics,
    off_contrib_95: number,
    def_contrib_95: number
): number {
    const norm_off = Math.min(
        (metrics.Offensive_Contribution / (off_contrib_95 + 0.01)) * 100,
        100
    );
    const norm_def = Math.min(
        (metrics.Defensive_Contribution / (def_contrib_95 + 0.01)) * 100,
        100
    );

    return (
        metrics.Passing_Accuracy * PERFORMANCE_WEIGHTS.PASSING_ACCURACY +
        metrics.Defensive_Action_Ratio * PERFORMANCE_WEIGHTS.DEFENSIVE_ACTION_RATIO +
        norm_off * PERFORMANCE_WEIGHTS.OFFENSIVE_CONTRIBUTION +
        norm_def * PERFORMANCE_WEIGHTS.DEFENSIVE_CONTRIBUTION
    );
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

/**
 * Calculate enriched metrics for an array of player statistics
 * 
 * @param data - Array of raw player statistics
 * @returns Array of enriched statistics with calculated metrics
 */
export function calculateMetrics(data: PlayerStat[]): EnrichedPlayerStat[] {
    if (!data || data.length === 0) {
        return [];
    }

    // First pass: Calculate basic metrics
    const enrichedWithBasicMetrics = data.map((curr) => {
        // Build match identifier
        const matchDate = curr.matches?.date || 'Unknown Date';
        const opponent = curr.matches?.opponent || 'Unknown Opponent';
        const Match = `${opponent} (${matchDate})`;

        const basicMetrics = calculateBasicMetrics(curr);

        return {
            ...curr,
            Match,
            date: curr.matches?.date,
            opponent: curr.matches?.opponent,
            ...basicMetrics,
            Performance_Rating: 0, // Placeholder - calculated in second pass
        } as EnrichedPlayerStat;
    });

    // Calculate 95th percentile for normalization
    const offContribs = enrichedWithBasicMetrics.map((e) => e.Offensive_Contribution);
    const defContribs = enrichedWithBasicMetrics.map((e) => e.Defensive_Contribution);

    // Use max value for small datasets, 95th percentile for larger ones
    const off_contrib_95 = enrichedWithBasicMetrics.length > 10
        ? getQuantile(offContribs, 0.95)
        : Math.max(...offContribs, 1);

    const def_contrib_95 = enrichedWithBasicMetrics.length > 10
        ? getQuantile(defContribs, 0.95)
        : Math.max(...defContribs, 1);

    // Second pass: Calculate normalized performance ratings
    return enrichedWithBasicMetrics.map((curr) => ({
        ...curr,
        Performance_Rating: calculatePerformanceRating(curr, off_contrib_95, def_contrib_95),
    }));
}

/**
 * Calculate FIFA-style rating from average performance metrics (0-99 scale)
 */
export function calculateFIFARating(avgRating: number): number {
    // Map 0-100 performance rating to 45-99 FIFA rating
    return Math.round(45 + (avgRating / 100) * 54);
}

/**
 * Determine card tier based on FIFA rating
 */
export function getCardTier(rating: number): 'bronze' | 'silver' | 'gold' | 'special' {
    if (rating < 65) return 'bronze';
    if (rating < 75) return 'silver';
    if (rating < 90) return 'gold';
    return 'special';
}
