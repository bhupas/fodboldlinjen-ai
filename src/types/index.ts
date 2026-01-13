/**
 * Core Type Definitions for Fodboldlinjen AI
 * All shared types should be defined here for consistency
 */

// =============================================================================
// DATABASE ENTITY TYPES
// =============================================================================

/**
 * Match entity from the matches table
 */
export interface Match {
    id: string;
    date: string;
    opponent: string;
    team?: string;
    user_id?: string;
    created_at: string;
}

/**
 * Player statistics from the player_stats table
 */
export interface PlayerStats {
    id: string;
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
    created_at: string;
}

/**
 * Performance/Gym statistics from the performance_stats table
 */
export interface PerformanceStats {
    id: string;
    user_id: string;
    player_name: string;
    exercise: string;
    pr_1: number | null;
    pr_2: number | null;
    pr_3: number | null;
    pr_4: number | null;
    created_at: string;
}

/**
 * Saved AI report from the ai_reports table
 */
export interface SavedReport {
    id: string;
    user_id: string;
    scope: 'Team' | 'Match' | 'Player';
    target_label: string;
    analysis_type: string;
    report_content: string;
    created_at: string;
}

// =============================================================================
// ANALYTICS & CALCULATED TYPES
// =============================================================================

/**
 * Enriched player statistics with calculated metrics
 */
export interface EnrichedPlayerStat extends PlayerStats {
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
    // Match join data
    matches?: {
        date: string;
        opponent: string;
    };
    date?: string;
    opponent?: string;
}

/**
 * Dashboard statistics summary
 */
export interface DashboardStats {
    totalMatches: number;
    avgRating: number;
    avgPassing: number;
    totalGoals: number;
    matchData: MatchChartData[];
    topPlayers: TopPlayerData[];
    topScorers: TopScorerData[];
    topPassers: TopPasserData[];
    recentMatches: RecentMatchData[];
}

export interface MatchChartData {
    date: string;
    opponent: string;
    rating: number;
    goals: number;
    passing: number;
}

export interface TopPlayerData {
    name: string;
    avgRating: number;
    matches: number;
}

export interface TopScorerData {
    name: string;
    totalGoals: number;
    matches: number;
}

export interface TopPasserData {
    name: string;
    avgPassingAccuracy: number;
    matches: number;
}

export interface RecentMatchData {
    date: string;
    opponent: string;
    rating: number;
    goals: number;
}

/**
 * Player profile with aggregated data
 */
export interface PlayerProfile {
    name: string;
    games: number;
    goals: number;
    assists: number;
    minutes: number;
    shots: number;
    tackles: number;
    passes: number;
    successful_passes: number;
    avgPassing: number;
}

/**
 * Complete player data including profile, matches, and gym data
 */
export interface PlayerData {
    profile: PlayerProfile;
    matches: EnrichedPlayerStat[];
    gym: PerformanceStats[];
}

// =============================================================================
// DATA UPLOAD TYPES
// =============================================================================

/**
 * Raw uploaded row from Excel/CSV file (match data format)
 */
export interface UploadedMatchRow {
    Timestamp?: string;
    Team?: string;
    Opponent?: string;
    Player?: string;
    Successful_Passes?: number | string;
    Total_Passes?: number | string;
    Total_Shots?: number | string;
    Tackles_Own_Half?: number | string;
    Tackles_Opponent_Half?: number | string;
    Total_Tackles?: number | string;
    Goals?: number | string;
    Assists?: number | string;
    Minutes?: number | string;
    Yellow_Cards?: number | string;
    Red_Cards?: number | string;
    Feedback?: string;
    _type?: 'match';
}

/**
 * Raw uploaded row from Excel/CSV file (performance/gym data format)
 */
export interface UploadedPerformanceRow {
    Player?: string;
    Exercise?: string;
    PR1?: number | string;
    PR2?: number | string;
    PR3?: number | string;
    PR4?: number | string;
    _type?: 'performance';
}

/**
 * Union type for all uploaded row types
 */
export type UploadedRow = UploadedMatchRow | UploadedPerformanceRow;

/**
 * Result of an upload operation
 */
export interface UploadResult {
    successCount: number;
    errors: string[];
    type: 'match' | 'performance' | '';
}

// =============================================================================
// LEGACY COMPATIBILITY (Deprecated - use new types above)
// =============================================================================

/**
 * @deprecated Use UploadedMatchRow instead
 */
export interface UploadedRow_Legacy {
    Timestamp?: string;
    'Kamp - Hvilket hold spillede du for'?: string;
    'Modstanderen (Hvem spillede du mod)'?: string;
    'Navn (Fulde Navn)'?: string;
    '#Succesfulde pasninger /indlæg'?: number | string;
    '#Total pasninger/indlæg (succesfulde + ikke succesfulde)'?: number | string;
    '#Total afslutninger'?: number | string;
    '#Succesfulde erobringer på EGEN bane'?: number | string;
    '#Succesfulde erobringer på DERES bane'?: number | string;
    '#Total Succesfulde Erobringer (Egen + Deres bane)'?: number | string;
    'Mål'?: number | string;
    'Assist'?: number | string;
    'Spilleminutter'?: number | string;
    'Gule kort'?: number | string;
    'Røde kort'?: number | string;
    'Hvad vil du gøre bedre i næste kamp ?'?: string;
}

// =============================================================================
// AI REPORT TYPES
// =============================================================================

/**
 * Request body for AI report generation
 */
export interface AIReportRequest {
    scope: 'Team' | 'Match' | 'Player';
    id?: string;
    type: 'tactical' | 'individual' | 'physical_mental' | 'feedback' | 'general';
}

/**
 * Response from AI report generation
 */
export interface AIReportResponse {
    report?: string;
    error?: string;
    details?: string;
}

// =============================================================================
// METADATA TYPES
// =============================================================================

/**
 * Options for AI analysis scope selection
 */
export interface MetadataOptions {
    matches: Array<{ id: string; label: string }>;
    players: string[];
}

// =============================================================================
// FEEDBACK TYPES
// =============================================================================

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

// =============================================================================
// EDITOR TYPES
// =============================================================================

export type EditorTable = 'match_stats' | 'performance_stats' | 'feedback';

export interface EditorRowData {
    [key: string]: unknown;
    match_date?: string;
    match_opponent?: string;
}
