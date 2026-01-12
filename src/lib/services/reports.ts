import { supabase } from '@/lib/supabase/client';

export interface SavedReport {
    id: string;
    scope: 'Team' | 'Match' | 'Player';
    target_label: string;
    analysis_type: string;
    report_content: string;
    created_at: string;
}

const MAX_REPORTS = 20;

export const saveReport = async (
    scope: 'Team' | 'Match' | 'Player',
    targetLabel: string,
    analysisType: string,
    reportContent: string
): Promise<SavedReport | null> => {
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
            report_content: reportContent
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving report:', error);
        return null;
    }

    // Clean up old reports (keep only last MAX_REPORTS)
    await cleanupOldReports(user.id);

    return data as SavedReport;
};

export const getSavedReports = async (): Promise<SavedReport[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('ai_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(MAX_REPORTS);

    if (error) {
        console.error('Error fetching reports:', error);
        return [];
    }

    return data as SavedReport[];
};

export const getReportById = async (id: string): Promise<SavedReport | null> => {
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
};

export const deleteReport = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('ai_reports')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting report:', error);
        return false;
    }

    return true;
};

const cleanupOldReports = async (userId: string): Promise<void> => {
    // Get all reports for this user ordered by date
    const { data: reports, error } = await supabase
        .from('ai_reports')
        .select('id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error || !reports) return;

    // If more than MAX_REPORTS, delete the oldest ones
    if (reports.length > MAX_REPORTS) {
        const idsToDelete = reports.slice(MAX_REPORTS).map(r => r.id);

        await supabase
            .from('ai_reports')
            .delete()
            .in('id', idsToDelete);
    }
};
