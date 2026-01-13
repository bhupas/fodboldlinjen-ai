/**
 * AI Reports Service
 * Handles saving, retrieving, and managing AI-generated reports
 */

import { supabase } from '@/lib/supabase/client';
import { DATA_LIMITS, SCOPE_TYPES } from '@/lib/constants';
import type { SavedReport, ScopeType } from '@/types';

// =============================================================================
// TYPES
// =============================================================================

type ReportScope = typeof SCOPE_TYPES[keyof typeof SCOPE_TYPES];

// =============================================================================
// REPORT MANAGEMENT
// =============================================================================

/**
 * Save a new AI report to the database
 * 
 * @param scope - The analysis scope (Team, Match, or Player)
 * @param targetLabel - Display label for the target
 * @param analysisType - Type of analysis performed
 * @param reportContent - The generated report content
 * @returns The saved report or null if save failed
 */
export async function saveReport(
    scope: ReportScope,
    targetLabel: string,
    analysisType: string,
    reportContent: string
): Promise<SavedReport | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Insert new report
    const { data, error } = await supabase
        .from('ai_reports')
        .insert({
            user_id: user.id,
            scope,
            target_label: targetLabel,
            analysis_type: analysisType,
            report_content: reportContent,
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving report:', error);
        return null;
    }

    // Clean up old reports to maintain limit
    await cleanupOldReports(user.id);

    return data as SavedReport;
}

/**
 * Get all saved reports for the current user
 * 
 * @returns Array of saved reports, ordered by creation date (newest first)
 */
export async function getSavedReports(): Promise<SavedReport[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('ai_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(DATA_LIMITS.MAX_REPORTS);

    if (error) {
        console.error('Error fetching reports:', error);
        return [];
    }

    return data as SavedReport[];
}

/**
 * Get a single report by its ID
 * 
 * @param id - The report ID
 * @returns The report or null if not found
 */
export async function getReportById(id: string): Promise<SavedReport | null> {
    const { data, error } = await supabase
        .from('ai_reports')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching report:', error);
        return null;
    }

    return data as SavedReport;
}

/**
 * Delete a report by its ID
 * 
 * @param id - The report ID to delete
 * @returns true if deleted successfully, false otherwise
 */
export async function deleteReport(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('ai_reports')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting report:', error);
        return false;
    }

    return true;
}

/**
 * Update an existing report's content
 * 
 * @param id - The report ID to update
 * @param content - The new report content
 * @returns true if updated successfully, false otherwise
 */
export async function updateReportContent(id: string, content: string): Promise<boolean> {
    const { error } = await supabase
        .from('ai_reports')
        .update({ report_content: content })
        .eq('id', id);

    if (error) {
        console.error('Error updating report:', error);
        return false;
    }

    return true;
}

// =============================================================================
// CLEANUP FUNCTIONS
// =============================================================================

/**
 * Clean up old reports to keep only the most recent ones
 * 
 * @param userId - The user ID to clean up reports for
 */
async function cleanupOldReports(userId: string): Promise<void> {
    // Get all reports for this user ordered by date
    const { data: reports, error } = await supabase
        .from('ai_reports')
        .select('id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error || !reports) return;

    // If more than MAX_REPORTS, delete the oldest ones
    if (reports.length > DATA_LIMITS.MAX_REPORTS) {
        const idsToDelete = reports.slice(DATA_LIMITS.MAX_REPORTS).map((r) => r.id);

        await supabase
            .from('ai_reports')
            .delete()
            .in('id', idsToDelete);
    }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get report count for the current user
 * 
 * @returns Number of reports for the current user
 */
export async function getReportCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
        .from('ai_reports')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    if (error) {
        console.error('Error counting reports:', error);
        return 0;
    }

    return count ?? 0;
}

/**
 * Check if user has reached the report limit
 * 
 * @returns true if limit reached, false otherwise
 */
export async function hasReachedReportLimit(): Promise<boolean> {
    const count = await getReportCount();
    return count >= DATA_LIMITS.MAX_REPORTS;
}
