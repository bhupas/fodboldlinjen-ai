/**
 * AI Prompt Builder
 * Constructs prompts for the Gemini AI model based on analysis type and data
 */

import { ANALYSIS_TYPES } from './constants';

/**
 * Analysis-specific prompt sections
 */
export const ANALYSIS_PROMPTS: Record<string, string> = {
    [ANALYSIS_TYPES.TACTICAL]: `
        Fokuser på TAKTISKE elementer med konkrete eksempler:
        - Formation og positionering (forklar specifikke justeringer)
        - Pressstrategi og kompakthed (hvor/hvornår presse?)
        - Omstillinger (defensiv→offensiv og omvendt - timing og udførelse)
        - Rumudnyttelse og bevægelsesmønstre (konkrete løbebaner)
        - Samarbejde mellem kæder (målmandsudspil, kantspilleres rolle, etc.)
        - Konkrete justeringer til næste kamp
    `,
    [ANALYSIS_TYPES.INDIVIDUAL]: `
        Fokuser på INDIVIDUEL udvikling med actionable råd:
        - Tekniske færdigheder (specifik left/right foot, førsteberøring, etc.)
        - Fysiske aspekter (udholdenhed, sprint, styrke - med gym-tal hvis tilgængelig)
        - Mentale aspekter (beslutningstagning under pres, mod til at tage bolden)
        - Positionel forståelse (hvor være på banen i forskellige faser)
        - Personlig udviklingsplan med konkrete steps
    `,
    [ANALYSIS_TYPES.PHYSICAL_MENTAL]: `
        Fokuser på FYSIK og MENTAL tilstand:
        - Kondition gennem 90 minutter (analyser distance-data)
        - Styrke og eksplosivitet (ref. til gym-PRs hvis tilgængelig)
        - Mentale mønstre (kommunikation, kropsrog, energi)
        - Lederskab på og udenfor banen
        - Håndtering af modgang og pres-situationer
        - Korrelation: fysisk form ↔ match-performance
    `,
    [ANALYSIS_TYPES.FEEDBACK]: `
        Dyb FEEDBACK-analyse med psykologisk indsigt:
        - Gennemgående temaer i spillerfeedback
        - Diskrepans mellem spillers selv-opfattelse og data
        - Motivationsdrivere og barrierer
        - Team-kultur indikatorer
        - Kommunikations-mønstre
        - Anbefalinger til individuelt samtaler
        - Psykologiske udviklingsområder
    `,
    [ANALYSIS_TYPES.GENERAL]: `
        HOLISTISK analyse med balance:
        - Overall team/spiller performance (brug konkrete tal)
        - Taktiske styrker og svagheder
        - Individuelle highlights (nævn spillere ved navn)
        - Fysisk progression (hvis gym-data)
        - Praktiske træningsøvelser (beskriv detaljeret)
        - Mindset og team-kultur
    `,
};

/**
 * Build performance data summary for the prompt
 */
export function buildPerformanceSummary(filteredPerfStats: any[]): string {
    if (filteredPerfStats.length === 0) return '';

    const exerciseStats = new Map<string, { values: number[]; playerCount: number }>();

    filteredPerfStats.forEach((p: any) => {
        const exercise = p.exercise;
        const maxPr = Math.max(
            parseFloat(p.pr_1) || 0,
            parseFloat(p.pr_2) || 0,
            parseFloat(p.pr_3) || 0,
            parseFloat(p.pr_4) || 0
        );

        if (maxPr > 0) {
            if (!exerciseStats.has(exercise)) {
                exerciseStats.set(exercise, { values: [], playerCount: 0 });
            }
            exerciseStats.get(exercise)!.values.push(maxPr);
        }
    });

    const lines: string[] = [];
    exerciseStats.forEach((data, exercise) => {
        const avg = data.values.reduce((a, b) => a + b, 0) / data.values.length;
        const max = Math.max(...data.values);
        const min = Math.min(...data.values);
        const lcExercise = exercise.toLowerCase();
        const unit = lcExercise.includes('sprint') || lcExercise.includes('run') || lcExercise.includes('time')
            ? 's'
            : 'kg';
        lines.push(`  • ${exercise}: Avg ${avg.toFixed(1)}${unit}, Max ${max}${unit}, Min ${min}${unit} (${data.values.length} målinger)`);
    });

    return lines.length > 0
        ? `🏋️ **Fysisk Performance Data:**\n${lines.join('\n')}`
        : '';
}

/**
 * Build individual player breakdown section
 */
export function buildIndividualBreakdown(
    playerId: string,
    selectionData: any[],
    totalGoals: number,
    totalAssists: number,
    totalTackles: number,
    totalDistance: number,
    avgRating: number,
    avgDistance: number,
    consistency: string
): string {
    if (selectionData.length === 0) return '';

    const matchesPlayed = selectionData.length;
    const bestMatch = selectionData.reduce((best, curr) =>
        curr.Performance_Rating > best.Performance_Rating ? curr : best
    );
    const worstMatch = selectionData.reduce((worst, curr) =>
        curr.Performance_Rating < worst.Performance_Rating ? curr : worst
    );

    // Match-by-match recent form
    const recentMatches = selectionData.slice(-5).reverse();
    const matchList = recentMatches
        .map(
            (m, idx) =>
                `  ${idx + 1}. ${m.Match || 'Ukendt'}: Rating ${m.Performance_Rating.toFixed(1)}, ${m.goals || 0}G/${m.assists || 0}A, ${m.Passing_Accuracy.toFixed(0)}% passing`
        )
        .join('\n');

    return `
⚽ **Detaljeret Spillerstatistik (${playerId}):**

📊 Grundlæggende:
- Kampe spillet: ${matchesPlayed}
- Mål: ${totalGoals} (${(totalGoals / matchesPlayed).toFixed(2)}/kamp)
- Assists: ${totalAssists} (${(totalAssists / matchesPlayed).toFixed(2)}/kamp)
- Tacklinger: ${totalTackles} (${(totalTackles / matchesPlayed).toFixed(1)}/kamp)
- Total distance: ${totalDistance.toFixed(1)} km (${avgDistance.toFixed(1)} km/kamp)

📈 Performance:
- Gennemsnitlig rating: ${avgRating.toFixed(1)}/100
- Bedste kamp: ${bestMatch.Performance_Rating.toFixed(1)} (${bestMatch.Match || 'Ukendt'})
- Svageste kamp: ${worstMatch.Performance_Rating.toFixed(1)} (${worstMatch.Match || 'Ukendt'})
- Konsistens: ${consistency}

🎯 Seneste Form (seneste 5 kampe):
${matchList}
    `;
}

/**
 * Build team insights section
 */
export function buildTeamInsights(selectionData: any[]): string {
    if (selectionData.length === 0) return '';

    // Group by player
    const playerStats = new Map<
        string,
        { matches: number; avgRating: number; goals: number; assists: number }
    >();

    selectionData.forEach((stat) => {
        if (!playerStats.has(stat.player_name)) {
            playerStats.set(stat.player_name, { matches: 0, avgRating: 0, goals: 0, assists: 0 });
        }
        const ps = playerStats.get(stat.player_name)!;
        ps.matches++;
        ps.avgRating += stat.Performance_Rating;
        ps.goals += stat.goals || 0;
        ps.assists += stat.assists || 0;
    });

    // Calculate averages
    playerStats.forEach((stats) => {
        stats.avgRating = stats.avgRating / stats.matches;
    });

    // Top performers
    const sortedByRating = Array.from(playerStats.entries())
        .sort((a, b) => b[1].avgRating - a[1].avgRating)
        .slice(0, 5);

    const topScorers = Array.from(playerStats.entries())
        .sort((a, b) => b[1].goals - a[1].goals)
        .slice(0, 3);

    return `
🏆 **Hold-indsigter:**

Top 5 Spillere (gennemsnit rating):
${sortedByRating.map((p, i) => `  ${i + 1}. ${p[0]}: ${p[1].avgRating.toFixed(1)} (${p[1].matches} kampe)`).join('\n')}

Topscorere:
${topScorers.map((p, i) => `  ${i + 1}. ${p[0]}: ${p[1].goals} mål (${p[1].assists} assists)`).join('\n')}
    `;
}

/**
 * Calculate consistency rating based on standard deviation
 */
export function calculateConsistency(ratings: number[], avgRating: number): string {
    if (ratings.length < 3) return 'N/A';

    const variance = ratings.reduce((sum, r) => sum + Math.pow(r - avgRating, 2), 0) / ratings.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev < 10) return 'Høj (konsistent)';
    if (stdDev < 20) return 'Mellem';
    return 'Lav (varierende)';
}

/**
 * Calculate trend direction from recent performance
 */
export function calculateTrend(selectionData: any[]): string {
    if (selectionData.length < 2) return '';

    const recent = selectionData.slice(-5);
    const ratings = recent.map((r) => r.Performance_Rating);
    const avgRecent = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    const firstHalf = ratings.slice(0, Math.ceil(ratings.length / 2));
    const secondHalf = ratings.slice(Math.ceil(ratings.length / 2));
    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const improvement = avgSecond - avgFirst;

    const trendDirection =
        improvement > 2
            ? '⬆️ Klart stigende'
            : improvement > 0
                ? '↗️ Svagt stigende'
                : improvement < -2
                    ? '⬇️ Faldende'
                    : '➡️ Stabil';

    return `- Trend (Seneste ${recent.length} kampe): ${trendDirection} (Avg: ${avgRecent.toFixed(1)}, ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)} point)`;
}

/**
 * Build the full AI prompt with all data
 */
export function buildFullPrompt(params: {
    selectionName: string;
    selectionData: any[];
    avgRating: number;
    avgPassing: number;
    avgShots: number;
    avgPressing: number;
    avgDefWork: number;
    avgDistance: number;
    totalGoals: number;
    totalAssists: number;
    totalTackles: number;
    totalShots: number;
    trendData: string;
    consistency: string;
    individualBreakdown: string;
    teamInsights: string;
    perfSummary: string;
    feedbackText: string;
    analysisType: string;
}): string {
    const {
        selectionName,
        selectionData,
        avgRating,
        avgPassing,
        avgShots,
        avgPressing,
        avgDefWork,
        avgDistance,
        totalGoals,
        totalAssists,
        totalTackles,
        totalShots,
        trendData,
        consistency,
        individualBreakdown,
        teamInsights,
        perfSummary,
        feedbackText,
        analysisType,
    } = params;

    const specificPrompt = ANALYSIS_PROMPTS[analysisType] || ANALYSIS_PROMPTS[ANALYSIS_TYPES.GENERAL];

    const matchDataSection = selectionData.length > 0
        ? `
📊 **KAMPDATA OVERSIGT:**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Antal kampe analyseret: ${selectionData.length}
- Gennemsnitlig Performance Rating: ${avgRating.toFixed(1)}/100
- Pasningspræcision: ${avgPassing.toFixed(1)}%
- Skud per kamp: ${avgShots.toFixed(1)}
- Presintensitet: ${avgPressing.toFixed(1)}%
- Defensiv arbejdsrate: ${avgDefWork.toFixed(1)}%
- Gennemsnitlig distance: ${avgDistance.toFixed(1)} km/kamp

📈 **TREND & KONSISTENS:**
${trendData}
- Performance konsistens: ${consistency}

⚽ **OFFENSIVE TAL:**
- Total mål: ${totalGoals} (${(totalGoals / selectionData.length).toFixed(2)} per kamp)
- Total assists: ${totalAssists} (${(totalAssists / selectionData.length).toFixed(2)} per kamp)
- Goal involvements: ${totalGoals + totalAssists}
${totalShots > 0 ? `- Skud-effektivitet: ${((totalGoals / totalShots) * 100).toFixed(1)}%` : ''}

🛡️ **DEFENSIVE TAL:**
- Total tacklinger: ${totalTackles} (${(totalTackles / selectionData.length).toFixed(1)} per kamp)
`
        : `
⚠️ **BEMÆRK:** Ingen kampdata tilgængelig.
Fokuser udelukkende på fysisk/gym-data og generelle udviklingspunkter.
`;

    return `Du er en UEFA Pro-licens fodboldtræner med 15+ års erfaring i dansk ungdomsfodbold på eliteniveau.
Din ekspertise dækker taktik, fysisk træning, sportspsykologi og talent-udvikling.

**OPGAVE:** Analyser følgende data og lav en PROFESSIONEL trænerrapport på DANSK.

═══════════════════════════════════════════════════════════════
**ANALYSENS FOKUS:** ${selectionName}
═══════════════════════════════════════════════════════════════

${matchDataSection}

${individualBreakdown}

${teamInsights}

${perfSummary}

${feedbackText && feedbackText.length > 10 ? `
💭 **SPILLERFEEDBACK (citater):**
${feedbackText}
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 **ANALYSEOMRÅDE:**
${specificPrompt}

═══════════════════════════════════════════════════════════════
**DIN OPGAVE - SKRIV RAPPORT MED FØLGENDE STRUKTUR:**
═══════════════════════════════════════════════════════════════

## 🎯 Hovedkonklusioner
[3-5 SKARPE observationer. Brug konkrete TAL. Eksempel: "Pasningspræcision på 67% er 15% under målsætning"]

## 💪 Styrker at Bygge På
[List 3-4 styrker. Forklar HVORFOR de er vigtige og HVORDAN vi bygger videre. Brug data!]

## ⚠️ Kritiske Udviklingsområder
[List 3-4 svagheder. PRIORITER efter vigtighed. Vær specifik om konsekvensen af hver svaghed.]

## 🏃 Træningsplan (Næste 2 Uger)
[Beskriv 5-7 KONKRETE øvelser. For hver øvelse:
 - Navn på øvelsen
 - Formål (hvad træner den?)
 - Udførelse (step-by-step)
 - Intensitet/varighed
 - Succeskriterium

Inkluder mix af:
 • Taktiske øvelser (positionsspil, presøvelser)
 • Tekniske øvelser (pasninger, afslutninger)
 • Fysiske øvelser (styrke, udholdenhed)
 • Mentale øvelser (beslutningstagning under pres)]

## 📈 Målsætninger (Næste 3 Kampe/Tests)
[Lav 4-6 SMART mål. Format:
 "Øge pasningspræcision fra 67% til minimum 75% i de næste 3 kampe"
 (Specifikt: Pasningspræcision | Måleligt: 75% | Achievable: +8% | Relevant: Ja | Tidsbestemt: 3 kampe)]

## 💡 Anbefalinger til Træneren
[3-5 konkrete råd om:
 - Kommunikationsstil med spillere
 - Taktiske valg til næste kamp
 - Individuelle spillersamtaler
 - Team-building aktiviteter
 - Parent/club kommunikation]

═══════════════════════════════════════════════════════════════
**KVALITETSKRAV:**
✓ Vær KONKRET - ingen generelle floskler
✓ Brug DATA - underbyg alle påstande med tal
✓ Vær ACTIONABLE - alle råd skal kunne handles på i morgen
✓ Vær POSITIV men ærlig - konstruktiv kritik
✓ Skriv PROFESSIONELT men tilgængeligt
✓ Brug korrekt Markdown formatering
═══════════════════════════════════════════════════════════════`;
}
