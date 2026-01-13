/**
 * Services Index
 * Re-exports all service modules for clean imports
 * 
 * Usage:
 * import { getDashboardStats, saveReport, getPlayerStats } from '@/lib/services';
 */

// Dashboard
export { getDashboardStats, getRawStats } from './dashboard';

// Data Upload
export { uploadData } from './data';

// Editor
export {
    getEditableData,
    updateMatchStat,
    updatePerformanceStat,
    updateFeedback,
    deleteMatchStat,
    deletePerformanceStat,
    deleteFeedback,
    createMatchStat,
    createPerformanceStat,
    createFeedback,
    createMatch,
    getMatches,
    updateMatch,
} from './editor';
export type { EditorTable } from './editor';

// Feedback
export {
    getAllFeedback,
    getFeedbackByPlayer,
    getFeedbackByMatch,
    getFeedbackStats,
    getAllFeedbackText,
    getOpponentsWithFeedback,
    getPlayersWithFeedback,
} from './feedback';
export type { FeedbackEntry, FeedbackStats } from './feedback';

// Metadata
export { getMetadata } from './metadata';
export type { MetadataOptions } from './metadata';

// Player
export { getPlayerStats } from './player';

// Reports
export {
    saveReport,
    getSavedReports,
    getReportById,
    deleteReport,
    updateReportContent,
    getReportCount,
    hasReachedReportLimit,
} from './reports';
