
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { calculateMetrics, EnrichedPlayerStat } from '@/lib/metrics';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase Admin Client (to bypass RLS if needed, or use standard)
// Ideally we forward the user's session, but for 'ai-report' we might trust the server to fetch data user has access to.
// We'll use the service role key or anon key depending on setup. Let's use anon key + client-side auth context if possible, 
// strictly speaking we should use createRouteHandlerClient from @supabase/auth-helpers-nextjs or similar.
// For simplicity in this demo environment, we will use the standard client with environment variables.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { scope, id, type, comparisonIds } = await req.json();

        // 1. Fetch Data
        let query = supabase.from('player_stats').select('*, matches(date, opponent)');

        if (scope === 'Match' && id) {
            // For specific match
            // We need to filter by match_date-opponent combination or match_id.
            // The frontend should pass match_date + opponent or just rows.
            // Let's assume frontend passes a match identifier string "Opponent (YYYY-MM-DD)" which is tricky.
            // Better: frontend passes distinct Match ID if we had it, strictly we have `match_id` in player_stats.
            // Let's assume `id` is the `matches.opponent` or something unique.
            // Actually, simplest is to just fetch ALL data and filter in memory if the dataset is small (<1000 rows).
            // Or better, let's look up match_id if scope is Match.
            // For now, let's fetch all and filter in JS to reuse `calculateMetrics` logic easily.
        }

        const { data: rawStats, error } = await query;
        if (error) throw error;
        if (!rawStats || rawStats.length === 0) {
            return NextResponse.json({ error: "No data found" }, { status: 404 });
        }

        // 2. Enrich Data
        let enriched = calculateMetrics(rawStats as any);

        // 3. Filter Data based on Scope
        let selectionName = "";
        let selectionData: EnrichedPlayerStat[] = [];

        if (scope === 'Team') {
            selectionData = enriched;
            selectionName = "Hele Holdet";
        } else if (scope === 'Match' && id) {
            selectionData = enriched.filter(e => e.Match === id);
            selectionName = `Kamp: ${id}`;
        } else if (scope === 'Player' && id) {
            selectionData = enriched.filter(e => e.player_name === id);
            selectionName = `Spiller: ${id}`;
        } else {
            selectionData = enriched;
            selectionName = "Generel Analyse";
        }

        if (selectionData.length === 0) {
            return NextResponse.json({ error: "No data found for selection" }, { status: 404 });
        }

        // 4. Calculate Summary Statistics for Prompt
        const avgRating = selectionData.reduce((acc, curr) => acc + curr.Performance_Rating, 0) / selectionData.length;
        const avgPassing = selectionData.reduce((acc, curr) => acc + curr.Passing_Accuracy, 0) / selectionData.length;
        const totalShots = selectionData.reduce((acc, curr) => acc + curr.total_shots, 0); // Sum or Avg? Python used mean for 'Skudfrekvens'?
        // Python: Skudfrekvens: {df['Total_Shots'].mean():.1f} per kamp
        const avgShots = selectionData.reduce((acc, curr) => acc + curr.total_shots, 0) / selectionData.length;
        const avgPressing = selectionData.reduce((acc, curr) => acc + curr.Pressing_Intensity, 0) / selectionData.length;
        const avgDefWork = selectionData.reduce((acc, curr) => acc + curr.Defensive_Workrate, 0) / selectionData.length;

        // Feedback Text
        const feedbackText = selectionData
            .filter(e => e.feedback)
            .map(e => e.feedback)
            .join(' ')
            .slice(0, 1000); // Limit length

        // Trend (Simple check of last few matches if applicable)
        // Omitted for brevity, but could be added.

        // 5. Construct Prompt
        const prompts = {
            tactical: `
                Fokuser på TAKTISKE elementer:
                - Formation og positionering
                - Pressstrategi og kompakthed
                - Omstillinger (defensiv→offensiv og omvendt)
                - Rumudnyttelse og bevægelsesmønstre
                - Samarbejde mellem kæder
            `,
            individual: `
                Fokuser på INDIVIDUELLE spillerpræstationer:
                - Tekniske færdigheder der skal forbedres
                - Fysiske aspekter (udholdenhed, hurtighed, styrke)
                - Mentale aspekter (beslutningstagning, mod, lederskab)
                - Specifik rolleforståelse
            `,
            physical_mental: `
                Fokuser på FYSISKE og MENTALE aspekter:
                - Kondition og udholdenhed gennem kampen
                - Mental styrke og fokus
                - Kommunikation og lederskab
                - Håndtering af pres og modgang
            `,
            feedback: `
                Fokuser på SPILLERFEEDBACK analyse:
                - Hovedtemaer i spillernes feedback
                - Gentagende udfordringer
                - Motivation og mentalitet
                - Konkrete forbedringspunkter spillerne selv identificerer
                - Anbefalinger baseret på spillernes input
            `,
            general: `
                Giv en BALANCERET analyse der dækker:
                - Holdets samlede præstation
                - Taktiske observationer
                - Individuelle højdepunkter og udviklingsområder
                - Praktiske træningsøvelser
            `
        };

        const specificPrompt = prompts[type as keyof typeof prompts] || prompts.general;

        const fullPrompt = `
            Du er en erfaren dansk fodboldtræner og taktisk ekspert der analyserer ungdomsfodbold på eliteniveau.
            Din analyse skal være skarp, konkret og handlingsorienteret.

            **DATA FOR: ${selectionName}**

            📊 **Kvantitative Nøgletal:**
            - Datapunkter analyseret: ${selectionData.length}
            - Gennemsnitlig Performance Rating: ${avgRating.toFixed(1)}/100
            - Pasningspræcision: ${avgPassing.toFixed(1)}%
            - Skudfrekvens: ${avgShots.toFixed(1)} per spiller/kamp
            - Presintensitet: ${avgPressing.toFixed(1)}%
            - Defensiv arbejdsrate: ${avgDefWork.toFixed(1)}%

            💭 **Spillernes Feedback:**
            "${feedbackText}"

            📋 **ANALYSEOMRÅDE:**
            ${specificPrompt}

            **DIN OPGAVE:**
            Skriv en professionel trænerrapport på DANSK med følgende struktur:

            ## 🎯 Hovedkonklusioner
            [3-4 skarpe observationer baseret på data]

            ## 💪 Styrker at Bygge På
            [Konkrete styrker med data-backing]

            ## ⚠️ Kritiske Udviklingsområder
            [Specifikke svagheder der SKAL addresses]

            ## 🏃 Træningsplan (Næste 2 Uger)
            [Konkrete øvelser og fokuspunkter]

            ## 📈 Målsætninger for Næste 3 Kampe
            [Specifikke, målbare mål]

            Vær KONKRET og HANDLINGSORIENTERET. Brug Markdown format.
        `;

        // 6. Generate via Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContent(fullPrompt);
        const response = result.response;
        const text = response.text();

        return NextResponse.json({ report: text });

    } catch (e: any) {
        console.error("AI Report Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
