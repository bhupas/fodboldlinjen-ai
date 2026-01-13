/**
 * Application-wide constants and configuration values
 * Centralized to avoid magic numbers and strings scattered across the codebase
 */

// =============================================================================
// AI CONFIGURATION
// =============================================================================

export const AI_CONFIG = {
    MODEL: 'gemini-flash-latest',
    TEMPERATURE: 0.8,
    TOP_P: 0.95,
    TOP_K: 40,
    MAX_OUTPUT_TOKENS: 8192,
} as const;

// =============================================================================
// PERFORMANCE METRICS
// =============================================================================

export const PERFORMANCE_WEIGHTS = {
    PASSING_ACCURACY: 0.25,
    DEFENSIVE_ACTION_RATIO: 0.15,
    OFFENSIVE_CONTRIBUTION: 0.3,
    DEFENSIVE_CONTRIBUTION: 0.3,
} as const;

export const FIFA_RATING_BASES = {
    PACE: 68,
    SHOOTING: 45,
    DRIBBLING: 58,
    DEFENSE: 35,
    PHYSICAL: 45,
} as const;

export const MATCH_RATING = {
    BASE_SCORE: 6.0,
    GOAL_WEIGHT: 1.0,
    ASSIST_WEIGHT: 0.8,
    TACKLE_WEIGHT: 0.2,
    HIGH_PASSING_BONUS: 0.5,
    MEDIUM_PASSING_BONUS: 0.2,
    HIGH_PASSING_THRESHOLD: 85,
    MEDIUM_PASSING_THRESHOLD: 75,
    MAX_RATING: 10.0,
} as const;

// =============================================================================
// CONSISTENCY METRICS
// =============================================================================

export const CONSISTENCY_THRESHOLDS = {
    HIGH: 10,  // Standard deviation below this = High consistency
    MEDIUM: 20, // Standard deviation below this = Medium consistency
} as const;

export const TREND_THRESHOLDS = {
    STRONG_IMPROVEMENT: 2,
    DECLINE: -2,
} as const;

// =============================================================================
// DATA LIMITS
// =============================================================================

export const DATA_LIMITS = {
    MAX_REPORTS: 20,
    RECENT_MATCHES: 5,
    TOP_PERFORMERS: 5,
    TOP_SCORERS: 3,
    FEEDBACK_PREVIEW_LENGTH: 200,
    FEEDBACK_MAX_LENGTH: 1500,
    MIN_MATCHES_FOR_TREND: 2,
    MIN_MATCHES_FOR_CONSISTENCY: 3,
} as const;

// =============================================================================
// ANALYSIS TYPES
// =============================================================================

export const ANALYSIS_TYPES = {
    TACTICAL: 'tactical',
    INDIVIDUAL: 'individual',
    PHYSICAL_MENTAL: 'physical_mental',
    FEEDBACK: 'feedback',
    GENERAL: 'general',
} as const;

export const ANALYSIS_TYPE_LABELS: Record<string, string> = {
    [ANALYSIS_TYPES.TACTICAL]: 'Taktisk dybdeanalyse',
    [ANALYSIS_TYPES.INDIVIDUAL]: 'Individuel udvikling',
    [ANALYSIS_TYPES.PHYSICAL_MENTAL]: 'Fysisk & Mental',
    [ANALYSIS_TYPES.FEEDBACK]: 'Feedback analyse',
    [ANALYSIS_TYPES.GENERAL]: 'Generel oversigt',
};

// =============================================================================
// SCOPE TYPES
// =============================================================================

export const SCOPE_TYPES = {
    TEAM: 'Team',
    MATCH: 'Match',
    PLAYER: 'Player',
} as const;

export type ScopeType = typeof SCOPE_TYPES[keyof typeof SCOPE_TYPES];

export const SCOPE_LABELS: Record<ScopeType, string> = {
    Team: 'Hold',
    Match: 'Kamp',
    Player: 'Spiller',
};

// =============================================================================
// RATING COLORS (FIFA Card Style)
// =============================================================================

export const CARD_RATING_TIERS = {
    BRONZE: { max: 65, colors: { from: '#cd7f32', to: '#8b5a2b' } },
    SILVER: { max: 75, colors: { from: '#c0c0c0', to: '#808080' } },
    GOLD: { max: 90, colors: { from: '#ffd700', to: '#b8860b' } },
    SPECIAL: { max: 100, colors: { from: '#9966cc', to: '#663399' } },
} as const;

// =============================================================================
// API ROUTES
// =============================================================================

export const API_ROUTES = {
    AI_REPORT: '/api/ai-report',
} as const;

// =============================================================================
// PROTECTED ROUTES (For Middleware)
// =============================================================================

export const PROTECTED_PATHS = [
    '/home',
    '/upload',
    '/players',
    '/comparison',
    '/ai',
    '/editor',
    '/settings',
    '/admin',
] as const;

export const AUTH_ROUTES = ['/login', '/signup'] as const;

// =============================================================================
// COLUMN MAPPINGS FOR FILE PARSING
// =============================================================================

export const MATCH_COLUMN_MAPPING: Record<string, string> = {
    'tidsstempel': 'Timestamp',
    'kamp - hvilket hold spillede du for': 'Team',
    'modstanderen (hvem spillede du mod)': 'Opponent',
    'navn (fulde navn)': 'Player',
    '#succesfulde pasninger /indlæg': 'Successful_Passes',
    '#total pasninger/indlæg (succesfulde + ikke succesfulde)': 'Total_Passes',
    '#total afslutninger': 'Total_Shots',
    '#succesfulde erobringer på egen bane': 'Tackles_Own_Half',
    '#succesfulde erobringer på deres bane': 'Tackles_Opponent_Half',
    '#total succesfulde erobringer (egen + deres bane)': 'Total_Tackles',
    'mål': 'Goals',
    'assist': 'Assists',
    'spilleminutter': 'Minutes',
    'gule kort': 'Yellow_Cards',
    'røde kort': 'Red_Cards',
    'hvad vil du gøre bedre i næste kamp ?': 'Feedback',
};

export const PERFORMANCE_COLUMN_MAPPING: Record<string, string> = {
    'navn': 'Player',
    'name': 'Player',
    'øvelse': 'Exercise',
    'ovelse': 'Exercise',
    'exercise': 'Exercise',
    '1.pr': 'PR1',
    '1. pr': 'PR1',
    '1 pr': 'PR1',
    'pr1': 'PR1',
    '2.pr': 'PR2',
    '2. pr': 'PR2',
    '2 pr': 'PR2',
    'pr2': 'PR2',
    '3.pr': 'PR3',
    '3. pr': 'PR3',
    '3 pr': 'PR3',
    'pr3': 'PR3',
    '4. pr': 'PR4',
    '4.pr': 'PR4',
    '4 pr': 'PR4',
    'pr4': 'PR4',
};
