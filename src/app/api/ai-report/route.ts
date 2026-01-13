/**
 * AI Report Generation API Route
 * POST /api/ai-report
 * 
 * Generates AI-powered analysis reports for teams, matches, or players
 * using Google Gemini AI.
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { calculateMetrics } from '@/lib/metrics';
import { NextRequest, NextResponse } from 'next/server';
import { AI_CONFIG, DATA_LIMITS, SCOPE_TYPES } from '@/lib/constants';
import { EnrichedPlayerStat, AIReportRequest } from '@/types';
import {
    buildPerformanceSummary,
    buildIndividualBreakdown,
    buildTeamInsights,
    calculateConsistency,
    calculateTrend,
    buildFullPrompt,
} from '@/lib/ai-prompts';

// =============================================================================
// INITIALIZATION
// =============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Safely divide by selection data length
 */
function safeAverage(value: number, count: number): number {
    return count > 0 ? value / count : 0;
}

/**
 * Fetch match statistics from the database
 */
async function fetchMatchStats() {
    const { data, error } = await supabase
        .from('player_stats')
        .select('*, matches(date, opponent)');

    if (error) throw error;
    return data;
}

/**
 * Fetch performance/gym statistics from the database
 */
async function fetchPerformanceStats(scope: string, playerId?: string) {
    let query = supabase.from('performance_stats').select('*');

    if (scope === SCOPE_TYPES.PLAYER && playerId) {
        query = query.eq('player_name', playerId);
    }

    const { data } = await query;
    return data || [];
}

/**
 * Filter data based on the selected scope
 */
function filterDataByScope(
    enriched: EnrichedPlayerStat[],
    perfStats: any[],
    scope: string,
    id?: string
): {
    selectionData: EnrichedPlayerStat[];
    selectionName: string;
    targetPlayerNames: Set<string>;
} {
    let selectionData: EnrichedPlayerStat[] = [];
    let selectionName = '';
    const targetPlayerNames = new Set<string>();

    switch (scope) {
        case SCOPE_TYPES.TEAM:
            selectionData = enriched;
            selectionName = 'Hele Holdet';
            perfStats.forEach((p: any) => targetPlayerNames.add(p.player_name));
            enriched.forEach((p) => targetPlayerNames.add(p.player_name));
            break;

        case SCOPE_TYPES.MATCH:
            if (id) {
                selectionData = enriched.filter((e) => e.Match === id);
                selectionName = `Kamp: ${id}`;
                selectionData.forEach((p) => targetPlayerNames.add(p.player_name));
            }
            break;

        case SCOPE_TYPES.PLAYER:
            if (id) {
                selectionData = enriched.filter((e) => e.player_name === id);
                selectionName = `Spiller: ${id}`;
                targetPlayerNames.add(id);
            }
            break;

        default:
            selectionData = enriched;
            selectionName = 'Generel Analyse';
            perfStats.forEach((p: any) => targetPlayerNames.add(p.player_name));
            enriched.forEach((p) => targetPlayerNames.add(p.player_name));
    }

    return { selectionData, selectionName, targetPlayerNames };
}

/**
 * Calculate aggregate statistics from selection data
 */
function calculateAggregates(selectionData: EnrichedPlayerStat[]) {
    const count = selectionData.length;

    const totalGoals = selectionData.reduce((acc, curr) => acc + (curr.goals || 0), 0);
    const totalAssists = selectionData.reduce((acc, curr) => acc + (curr.assists || 0), 0);
    const totalTackles = selectionData.reduce((acc, curr) => acc + (curr.total_tackles || 0), 0);
    const totalShots = selectionData.reduce((acc, curr) => acc + (curr.total_shots || 0), 0);
    const totalDistance = selectionData.reduce((acc, curr) => acc + (curr.distance_km || 0), 0);

    const sumRating = selectionData.reduce((acc, curr) => acc + curr.Performance_Rating, 0);
    const sumPassing = selectionData.reduce((acc, curr) => acc + curr.Passing_Accuracy, 0);
    const sumPressing = selectionData.reduce((acc, curr) => acc + curr.Pressing_Intensity, 0);
    const sumDefWork = selectionData.reduce((acc, curr) => acc + curr.Defensive_Workrate, 0);

    return {
        totalGoals,
        totalAssists,
        totalTackles,
        totalShots,
        totalDistance,
        avgRating: safeAverage(sumRating, count),
        avgPassing: safeAverage(sumPassing, count),
        avgShots: safeAverage(totalShots, count),
        avgPressing: safeAverage(sumPressing, count),
        avgDefWork: safeAverage(sumDefWork, count),
        avgDistance: safeAverage(totalDistance, count),
    };
}

/**
 * Generate feedback text from selection data
 */
function buildFeedbackText(selectionData: EnrichedPlayerStat[]): string {
    return selectionData
        .filter((e) => e.feedback && e.feedback.trim().length > 0)
        .map((e) => `"${e.feedback!.slice(0, DATA_LIMITS.FEEDBACK_PREVIEW_LENGTH)}"`)
        .join(' | ')
        .slice(0, DATA_LIMITS.FEEDBACK_MAX_LENGTH);
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

export async function POST(req: NextRequest) {
    try {
        const { scope, id, type } = (await req.json()) as AIReportRequest;

        // 1. Fetch all data
        const rawStats = await fetchMatchStats();
        const perfStats = await fetchPerformanceStats(scope, id);

        // 2. Enrich match data with calculated metrics
        const enriched = calculateMetrics(rawStats as any);

        // 3. Filter data based on scope
        const { selectionData, selectionName, targetPlayerNames } = filterDataByScope(
            enriched,
            perfStats,
            scope,
            id
        );

        // 4. Filter performance stats for relevant players
        const filteredPerfStats = perfStats.filter((p: any) =>
            targetPlayerNames.has(p.player_name)
        );

        // 5. Check if we have any data to analyze
        if (selectionData.length === 0 && filteredPerfStats.length === 0) {
            return NextResponse.json(
                { error: 'Ingen data fundet for valgt scope' },
                { status: 404 }
            );
        }

        // 6. Calculate aggregates
        const aggregates = calculateAggregates(selectionData);

        // 7. Calculate consistency
        const ratings = selectionData.map((s) => s.Performance_Rating);
        const consistency = calculateConsistency(ratings, aggregates.avgRating);

        // 8. Calculate trend
        const trendData = calculateTrend(selectionData);

        // 9. Build player-specific breakdown (for Player scope)
        let individualBreakdown = '';
        if (scope === SCOPE_TYPES.PLAYER && id && selectionData.length > 0) {
            individualBreakdown = buildIndividualBreakdown(
                id,
                selectionData,
                aggregates.totalGoals,
                aggregates.totalAssists,
                aggregates.totalTackles,
                aggregates.totalDistance,
                aggregates.avgRating,
                aggregates.avgDistance,
                consistency
            );
        }

        // 10. Build team insights (for Team scope)
        let teamInsights = '';
        if (scope === SCOPE_TYPES.TEAM && selectionData.length > 0) {
            teamInsights = buildTeamInsights(selectionData);
        }

        // 11. Build performance summary
        const perfSummary = buildPerformanceSummary(filteredPerfStats);

        // 12. Build feedback text
        const feedbackText = buildFeedbackText(selectionData);

        // 13. Construct the full prompt
        const fullPrompt = buildFullPrompt({
            selectionName,
            selectionData,
            avgRating: aggregates.avgRating,
            avgPassing: aggregates.avgPassing,
            avgShots: aggregates.avgShots,
            avgPressing: aggregates.avgPressing,
            avgDefWork: aggregates.avgDefWork,
            avgDistance: aggregates.avgDistance,
            totalGoals: aggregates.totalGoals,
            totalAssists: aggregates.totalAssists,
            totalTackles: aggregates.totalTackles,
            totalShots: aggregates.totalShots,
            trendData,
            consistency,
            individualBreakdown,
            teamInsights,
            perfSummary,
            feedbackText,
            analysisType: type,
        });

        // 14. Generate AI response
        const model = genAI.getGenerativeModel({
            model: AI_CONFIG.MODEL,
            generationConfig: {
                temperature: AI_CONFIG.TEMPERATURE,
                topP: AI_CONFIG.TOP_P,
                topK: AI_CONFIG.TOP_K,
                maxOutputTokens: AI_CONFIG.MAX_OUTPUT_TOKENS,
            },
        });

        const result = await model.generateContent(fullPrompt);
        const response = result.response;
        const text = response.text();

        return NextResponse.json({ report: text });

    } catch (e: unknown) {
        const error = e as Error;
        console.error('AI Report Error:', error);
        return NextResponse.json(
            {
                error: `Fejl ved generering af rapport: ${error.message}`,
                details: error.toString(),
            },
            { status: 500 }
        );
    }
}
