"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { CountBadge } from "@/components/ui/stats-display";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerformanceTab, GymTab, FeedbackTab, InsightsTab } from "@/components/players";
import { Users, Dumbbell, MessageSquare, BarChart3, TrendingUp } from "lucide-react";
import {
    getAllFeedback,
    getFeedbackStats,
    getOpponentsWithFeedback,
    getPlayersWithFeedback,
    FeedbackEntry,
    FeedbackStats
} from "@/lib/services/feedback";

// Inner component that uses useSearchParams
function PlayerStatsContent() {
    const searchParams = useSearchParams();

    // Determine default tab from query param (for back navigation)
    const tabParam = searchParams.get('tab');
    const defaultTab = tabParam && ['players', 'gym', 'feedback', 'insights'].includes(tabParam)
        ? tabParam
        : 'players';

    // Raw data
    const [rawMatchStats, setRawMatchStats] = useState<any[]>([]);
    const [rawPerfStats, setRawPerfStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Feedback data
    const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
    const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
    const [feedbackPlayers, setFeedbackPlayers] = useState<string[]>([]);
    const [feedbackOpponents, setFeedbackOpponents] = useState<string[]>([]);

    // Load all data
    useEffect(() => {
        const fetchData = async () => {
            const { getRawStats } = await import("@/lib/services/dashboard");

            const statsData = await getRawStats();
            setRawMatchStats(statsData.matchStats);
            setRawPerfStats(statsData.perfStats);

            // Load feedback data
            try {
                const [feedbackData, statsData2, opponentsData, playersData] = await Promise.all([
                    getAllFeedback(),
                    getFeedbackStats(),
                    getOpponentsWithFeedback(),
                    getPlayersWithFeedback()
                ]);
                setFeedback(feedbackData);
                setFeedbackStats(statsData2);
                setFeedbackOpponents(opponentsData);
                setFeedbackPlayers(playersData);
            } catch (err) {
                console.error("Failed to load feedback:", err);
            }

            setLoading(false);
        };

        fetchData();
    }, []);

    // Get unique opponents for filtering
    const uniqueOpponents = useMemo(() => {
        const opps = new Set(rawMatchStats.map(m => m.opponent));
        return Array.from(opps).filter(Boolean).sort();
    }, [rawMatchStats]);

    // Aggregate player data
    const aggregatedPlayers = useMemo(() => {
        const playerMap = new Map();

        rawMatchStats.forEach(s => {
            const cleanName = s.player_name ? s.player_name.trim() : "Unknown";

            if (!playerMap.has(cleanName)) {
                playerMap.set(cleanName, {
                    name: cleanName,
                    games: 0,
                    avgPassing: 0,
                    totalShots: 0,
                    totalTackles: 0,
                    goals: 0,
                    assists: 0,
                    minutes: 0,
                    yellowCards: 0,
                    redCards: 0,
                });
            }
            const p = playerMap.get(cleanName);
            p.games++;
            const passAcc = (s.total_passes && s.successful_passes)
                ? (s.successful_passes / s.total_passes) * 100
                : (s.passing_accuracy || 0);

            p.avgPassing += passAcc;
            p.totalShots += (s.total_shots || 0);
            p.totalTackles += (s.total_tackles || 0);
            p.goals += (s.goals || 0);
            p.assists += (s.assists || 0);
            p.minutes += (s.minutes_played || 0);
            p.yellowCards += (s.yellow_cards || 0);
            p.redCards += (s.red_cards || 0);
        });

        // Create gym data map
        const gymMap = new Map();
        rawPerfStats.forEach(p => {
            const cleanName = p.player_name ? p.player_name.trim() : "Unknown";
            if (!gymMap.has(cleanName)) gymMap.set(cleanName, []);
            const maxPR = Math.max(p.pr_1 || 0, p.pr_2 || 0, p.pr_3 || 0, p.pr_4 || 0);
            gymMap.get(cleanName).push({ exercise: p.exercise, maxPR });
        });

        // Finalize player data
        const players = Array.from(playerMap.values()).map(p => {
            const gymData = gymMap.get(p.name) || [];
            return {
                ...p,
                avgPassing: p.games > 0 ? p.avgPassing / p.games : 0,
                maxGymPR: gymData.length > 0 ? Math.max(...gymData.map((d: any) => d.maxPR)) : 0,
                age: null as number | null
            };
        });

        return players;
    }, [rawMatchStats, rawPerfStats]);

    if (loading) return <LoadingSkeleton variant="table" />;

    return (
        <div className="space-y-6">
            <PageHeader
                icon={Users}
                iconColor="blue"
                title="Players"
                description="Detailed performance metrics, feedback analysis, and team insights"
                badge={<CountBadge count={aggregatedPlayers.length} label="Players" />}
            />

            {/* Main Tabs */}
            <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList className="bg-muted p-1 rounded-xl w-full md:w-auto flex overflow-x-auto no-scrollbar md:inline-flex">
                    <TabsTrigger value="players" className="rounded-lg gap-2 flex-1 md:flex-none min-w-[100px]">
                        <TrendingUp size={16} />
                        Performance
                    </TabsTrigger>
                    <TabsTrigger value="gym" className="rounded-lg gap-2 flex-1 md:flex-none min-w-[80px]">
                        <Dumbbell size={16} />
                        Gym
                    </TabsTrigger>
                    <TabsTrigger value="feedback" className="rounded-lg gap-2 flex-1 md:flex-none min-w-[90px]">
                        <MessageSquare size={16} />
                        Feedback
                    </TabsTrigger>
                    <TabsTrigger value="insights" className="rounded-lg gap-2 flex-1 md:flex-none min-w-[90px]">
                        <BarChart3 size={16} />
                        Insights
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="players" className="mt-6">
                    <PerformanceTab
                        rawMatchStats={rawMatchStats}
                        aggregatedPlayers={aggregatedPlayers}
                        uniqueOpponents={uniqueOpponents}
                    />
                </TabsContent>

                <TabsContent value="gym" className="mt-6">
                    <GymTab rawPerfStats={rawPerfStats} />
                </TabsContent>

                <TabsContent value="feedback" className="mt-6">
                    <FeedbackTab
                        feedback={feedback}
                        feedbackStats={feedbackStats}
                        feedbackPlayers={feedbackPlayers}
                        feedbackOpponents={feedbackOpponents}
                    />
                </TabsContent>

                <TabsContent value="insights" className="mt-6">
                    <InsightsTab aggregatedPlayers={aggregatedPlayers} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Wrapper component with Suspense boundary for useSearchParams
export default function PlayerStatsPage() {
    return (
        <Suspense fallback={<LoadingSkeleton variant="table" />}>
            <PlayerStatsContent />
        </Suspense>
    );
}
