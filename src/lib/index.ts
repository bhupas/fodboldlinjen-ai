/**
 * Library Index
 * Re-exports all library utilities for clean imports
 * 
 * Usage:
 * import { cn, calculateMetrics, parseFile } from '@/lib';
 */

// Utilities
export { cn, cleanText } from './utils';

// Constants
export * from './constants';

// Metrics
export { calculateMetrics, calculateFIFARating, getCardTier } from './metrics';
export type { PlayerStat, EnrichedPlayerStat } from './metrics';

// Parser
export { parseFile, validateFile } from './parser';

// AI Prompts
export {
    ANALYSIS_PROMPTS,
    buildPerformanceSummary,
    buildIndividualBreakdown,
    buildTeamInsights,
    calculateConsistency,
    calculateTrend,
    buildFullPrompt,
} from './ai-prompts';
