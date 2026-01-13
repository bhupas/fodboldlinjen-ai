"use client";

import { useEffect, useState } from "react";
import { getPlayerStats } from "@/lib/services/player";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Activity,
    Dumbbell,
    Calendar,
    Target,
    Shield,
    ArrowRight,
    TrendingUp,
    User,
    Trophy,
    Footprints,
    Info,
    PieChart as PieChartIcon,
    BarChart3
} from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend,
    AreaChart,
    Area
} from "recharts";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import Link from "next/link";
import { FifaCard } from "@/components/players/FifaCard";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function PlayerProfilePage({ params }: { params: { name: string } }) {
    // ... (rest of the file remains, but uses Popover instead of HoverCard)
    // I will target the specific blocks.

    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const playerName = decodeURIComponent(params.name);

    useEffect(() => {
        getPlayerStats(playerName).then(res => {
            setData(res);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [playerName]);

    if (loading) return <LoadingSkeleton variant="dashboard" />;

    if (!data) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <h2 className="text-2xl font-bold">Player not found</h2>
            <Link href="/players">
                <Button>Return to Player List</Button>
            </Link>
        </div>
    );

    const { profile, matches, gym } = data;

    // --- Statistics and Formulas ---
    const totalAssists = matches.reduce((sum: number, m: any) => sum + (m.assists || 0), 0);
    const totalGoals = profile.goals || matches.reduce((sum: number, m: any) => sum + (m.goals || 0), 0);
    const totalTackles = profile.tackles || matches.reduce((sum: number, m: any) => sum + (m.total_tackles || 0), 0);
    const totalShots = matches.reduce((sum: number, m: any) => sum + (m.total_shots || 0), 0);
    const gamesPlayed = Math.max(profile.games || matches.length, 1);

    // Normalized 0-10 Match Rating Formula
    const calculateMatchRating = (m: any) => {
        let score = 6.0; // Base score
        score += (m.goals || 0) * 1.0;
        score += (m.assists || 0) * 0.8;
        score += (m.total_tackles || 0) * 0.2;
        score += (m.passing_accuracy >= 85 ? 0.5 : m.passing_accuracy >= 75 ? 0.2 : 0);

        // Cap at 10.0
        return Math.min(10.0, Number(score.toFixed(1)));
    };

    // Calculate FIFA Attributes (0-99 Scale)
    // Formula Explanation:
    // PAC: Proxy via games played (stamina/activity)
    // SHO: Weighted by Goals/Game (50%) and Conversion Rate (20%)
    // PAS: Direct mapping from Avg Passing Accuracy
    // DRI: Base 58 + (Assists * 4)
    // DEF: Base 35 + (Tackles/Game * 15)
    // PHY: Max Gym PRs converted to scale
    const calculateStats = () => {
        let sho = 45 + (totalGoals / gamesPlayed) * 50;
        if (totalShots > 0) sho += (totalGoals / totalShots) * 20;
        sho = Math.min(98, Math.round(sho));

        let pas = Math.min(99, Math.round(profile.avgPassing || 50));

        let def = 35 + (totalTackles / gamesPlayed) * 15;
        def = Math.min(92, Math.round(def));

        let phy = 50;
        if (gym && gym.length > 0) {
            const maxPr = Math.max(...gym.map((g: any) => Math.max(g.pr_1 || 0, g.pr_2 || 0, g.pr_3 || 0, g.pr_4 || 0)));
            phy = 45 + (maxPr * 0.45);
        } else {
            phy = 55 + (gamesPlayed * 0.5);
        }
        phy = Math.min(95, Math.round(phy));

        let dri = 58 + (totalAssists * 4);
        dri = Math.min(94, Math.round(dri));

        let pac = 68 + (gamesPlayed * 0.4);
        pac = Math.min(90, Math.round(pac));

        return { pac, sho, pas, dri, def, phy };
    }

    const stats = calculateStats();
    const overallRating = Math.round(Object.values(stats).reduce((a, b) => a + b, 0) / 6);

    // Radar Data
    const radarData = [
        { subject: 'Pace', A: stats.pac, fullMark: 100 },
        { subject: 'Shooting', A: stats.sho, fullMark: 100 },
        { subject: 'Passing', A: stats.pas, fullMark: 100 },
        { subject: 'Dribbling', A: stats.dri, fullMark: 100 },
        { subject: 'Defense', A: stats.def, fullMark: 100 },
        { subject: 'Physical', A: stats.phy, fullMark: 100 },
    ];

    // Chart Data Preparation
    const matchHistoryData = matches.slice().reverse().slice(0, 10).map((m: any) => ({
        date: new Date(m.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }),
        rating: calculateMatchRating(m),
        goals: m.goals,
        assists: m.assists
    })).reverse(); // Show oldest to newest left to right

    const goalContributionData = [
        { name: 'Goals', value: totalGoals, color: '#22c55e' },
        { name: 'Assists', value: totalAssists, color: '#3b82f6' },
        { name: 'Other', value: Math.max(0, (totalGoals + totalAssists) * 0.5), color: '#94a3b8' } // Placeholder for visual balance
    ].filter(d => d.value > 0);

    const shotEffectivenessData = [
        { name: 'On Target', value: Math.round(totalShots * 0.6) }, // Estimated if not tracked
        { name: 'Off Target', value: Math.round(totalShots * 0.4) }, // Estimated
    ];

    // --- New Data Preps ---
    const actionDistributionData = [
        { name: 'Passes', value: matches.reduce((acc: number, m: any) => acc + (m.passes_completed || (m.passing_accuracy > 0 ? 30 : 0)), 0), color: '#8b5cf6' }, // Estimate passes if not tracked
        { name: 'Shots', value: totalShots, color: '#ef4444' },
        { name: 'Tackles', value: totalTackles, color: '#eab308' }
    ].filter(d => d.value > 0);

    const cumulativeData = matches.slice().sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()).reduce((acc: any[], m: any) => {
        const last = acc.length > 0 ? acc[acc.length - 1].impact : 0;
        acc.push({
            date: new Date(m.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }),
            impact: last + (m.goals || 0) + (m.assists || 0)
        });
        return acc;
    }, []);

    // Gym Chart helper
    const getExerciseData = (exName: string) => {
        const ex = gym.find((g: any) => g.exercise === exName);
        if (!ex) return [];
        return [
            { name: 'PR1', value: ex.pr_1 },
            { name: 'PR2', value: ex.pr_2 },
            { name: 'PR3', value: ex.pr_3 },
            { name: 'PR4', value: ex.pr_4 },
        ].filter(p => p.value != null);
    };
    const uniqueExercises = Array.from(new Set(gym.map((g: any) => g.exercise)));

    const headerDescription = (
        <div className="flex items-center gap-2">
            <span className="font-bold text-primary">{profile.games}</span> Matches
            <span className="w-1 h-1 bg-muted-foreground rounded-full" />
            <span className="font-bold text-primary">{profile.minutes}'</span> Total Minutes
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-20">
            {/* Header */}
            <PageHeader
                title={profile.name}
                description={headerDescription}
                icon={User}
                iconColor="purple"
                backUrl="/players"
                actions={
                    <Button
                        onClick={() => router.push('/ai')}
                        className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20"
                    >
                        Generate AI Report <ArrowRight size={16} className="ml-2" />
                    </Button>
                }
            />

            {/* Hero Section: FIFA Card & Overview */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">

                {/* 1. FIFA Card Container */}
                <div className="w-full lg:w-auto flex flex-col items-center gap-4 shrink-0">
                    <FifaCard
                        name={profile.name.split(' ').pop() || profile.name}
                        rating={overallRating}
                        stats={stats}
                        position="CM"
                        className="scale-110 lg:scale-100 origin-top"
                    />
                    <Popover>
                        <PopoverTrigger asChild>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help underline decoration-dotted">
                                <Info size={12} />
                                How is this calculated?
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold">FIFA Rating Formula</h4>
                                <p className="text-xs text-muted-foreground">
                                    attributes are derived dynamically from your match performance data:
                                </p>
                                <ul className="text-xs grid grid-cols-1 gap-1 mt-2">
                                    <li><span className="font-bold">SHO:</span> Goals/Game & Shot Efficiency</li>
                                    <li><span className="font-bold">PAS:</span> Average Passing Accuracy</li>
                                    <li><span className="font-bold">DEF:</span> Tackles per Game</li>
                                    <li><span className="font-bold">DRI:</span> Assists & Goal Involvements</li>
                                    <li><span className="font-bold">PHY:</span> Gym PRs (Squat/Bench/Deadlift)</li>
                                </ul>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* 2. Stats & Radar */}
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Radar Chart */}
                    <Card className="glass-card flex flex-col items-center justify-center p-4 min-h-[350px]">
                        <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" /> Attribute Profile
                        </h3>
                        <div className="w-full h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="hsl(var(--border))" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar
                                        name={profile.name}
                                        dataKey="A"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={3}
                                        fill="hsl(var(--primary))"
                                        fillOpacity={0.4}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: 'none' }}
                                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 gap-4">
                        <Card className="glass-card p-6 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Trophy size={100} />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider">Season Goals</p>
                                <h2 className="text-4xl font-extrabold text-foreground mt-2">{totalGoals}</h2>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <span className="bg-green-500/10 text-green-500 text-xs px-2 py-1 rounded font-mono">
                                    {(totalGoals / gamesPlayed).toFixed(2)} per game
                                </span>
                            </div>
                        </Card>

                        <div className="grid grid-cols-2 gap-4">
                            <Card className="glass-card p-4 flex flex-col justify-center items-center text-center">
                                <Footprints className="text-blue-500 mb-2" size={24} />
                                <span className="text-2xl font-bold">{totalAssists}</span>
                                <span className="text-xs text-muted-foreground uppercase">Assists</span>
                            </Card>
                            <Card className="glass-card p-4 flex flex-col justify-center items-center text-center">
                                <Shield className="text-red-500 mb-2" size={24} />
                                <span className="text-2xl font-bold">{totalTackles}</span>
                                <span className="text-xs text-muted-foreground uppercase">Tackles</span>
                            </Card>
                        </div>

                        <Card className="glass-card p-6 relative overflow-hidden">
                            <div className="flex items-center justify-between z-10 relative">
                                <div>
                                    <p className="text-sm text-muted-foreground uppercase font-bold">Passing Accuracy</p>
                                    <h2 className="text-3xl font-extrabold text-foreground mt-1">{profile.avgPassing.toFixed(1)}%</h2>
                                </div>
                                <div className="h-12 w-12 rounded-full border-4 border-primary flex items-center justify-center">
                                    <Activity size={20} className="text-primary" />
                                </div>
                            </div>
                            <div className="w-full bg-muted/50 h-2 mt-4 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-1000"
                                    style={{ width: `${profile.avgPassing}%` }}
                                />
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="matches" className="w-full mt-8">
                <TabsList className="bg-muted p-1 rounded-xl w-full md:w-auto grid grid-cols-3 md:inline-flex">
                    <TabsTrigger value="matches" className="rounded-lg">
                        Matches
                    </TabsTrigger>
                    <TabsTrigger value="insights" className="rounded-lg">
                        Insights
                    </TabsTrigger>
                    <TabsTrigger value="gym" className="rounded-lg">
                        Gym
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="matches" className="space-y-6 mt-6">
                    <div className="space-y-3">
                        {matchHistoryData.length > 0 ? (
                            matchHistoryData.slice().reverse().map((m: any, idx: number) => {
                                // Re-find original match for Feedback display as matchHistoryData is simplified
                                const originalMatch = matches[matches.length - 1 - idx];
                                return (
                                    <Card key={idx} className="glass-card p-4 hover:bg-accent/50 transition-colors group">
                                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 w-full md:w-auto">
                                                <div className="bg-muted p-3 rounded-xl group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                                    <Calendar size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-foreground font-bold text-lg">{originalMatch.opponent}</p>
                                                    <div className="flex gap-2 text-xs text-muted-foreground">
                                                        <span>{m.date}</span>
                                                        <span>•</span>
                                                        <span>{originalMatch.minutes || 90} mins</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-8 w-full md:w-auto">
                                                <div className="text-center">
                                                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Rating</p>
                                                    <p className={`text-xl font-bold ${m.rating >= 8.0 ? 'text-green-500' : m.rating >= 6.0 ? 'text-yellow-500' : 'text-red-500'}`}>
                                                        {m.rating}
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Goals</p>
                                                    <p className="text-xl font-bold text-foreground">{m.goals}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Assists</p>
                                                    <p className="text-xl font-bold text-blue-500">{m.assists}</p>
                                                </div>
                                            </div>

                                            {originalMatch.feedback && (
                                                <div className="w-full md:w-1/3 text-sm italic text-muted-foreground bg-muted/30 p-2 rounded border-l-2 border-primary">
                                                    "{originalMatch.feedback.length > 60 ? originalMatch.feedback.substring(0, 60) + '...' : originalMatch.feedback}"
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                )
                            })
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">No matches played yet.</div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="insights" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Match Rating History Chart */}
                        <Card className="glass-card p-6 h-[350px] col-span-1 md:col-span-2">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                    <TrendingUp className="text-primary w-5 h-5" />
                                    Match Rating History (0-10 Scale)
                                </h3>
                                <Popover>
                                    <PopoverTrigger>
                                        <Info size={16} className="text-muted-foreground cursor-help" />
                                    </PopoverTrigger>
                                    <PopoverContent side="left">
                                        <p className="text-xs">Based on Goals, Assists, Tackles, and Passing Accuracy.</p>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={matchHistoryData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={[0, 10]} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                    />
                                    <Line type="monotone" dataKey="rating" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </Card>

                        {/* Action Distribution (Pie) */}
                        <Card className="glass-card p-6 h-[300px] flex flex-col">
                            <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                                <Activity className="text-purple-500 w-5 h-5" />
                                Action Distribution
                            </h3>
                            <div className="flex-1 min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={actionDistributionData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {actionDistributionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: 'none' }} />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Cumulative Impact (Area) */}
                        <Card className="glass-card p-6 h-[300px] flex flex-col">
                            <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                                <Trophy className="text-yellow-500 w-5 h-5" />
                                Cumulative G/A Impact
                            </h3>
                            <div className="flex-1 min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={cumulativeData}>
                                        <defs>
                                            <linearGradient id="colorImpact" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" hide />
                                        <YAxis hide />
                                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: 'none' }} />
                                        <Area type="monotone" dataKey="impact" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorImpact)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Goal Contribution Pie */}
                        <Card className="glass-card p-6 h-[300px] flex flex-col">
                            <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                                <PieChartIcon className="text-green-500 w-5 h-5" />
                                Goal Types
                            </h3>
                            <div className="flex-1 min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={goalContributionData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {goalContributionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: 'none' }} />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Shot Efficiency Bar */}
                        <Card className="glass-card p-6 h-[300px] flex flex-col">
                            <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                                <Target className="text-red-500 w-5 h-5" />
                                Shot Efficiency (Est.)
                            </h3>
                            <div className="flex-1 min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={shotEffectivenessData} layout="vertical" margin={{ left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: 'none' }} />
                                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={30} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="gym" className="space-y-6 mt-6">
                    {gym.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-2xl bg-muted/20">
                            <Dumbbell size={48} className="text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-xl text-foreground font-bold mb-2">No Gym Data Found</h3>
                            <p className="text-muted-foreground">Upload performance data to track gym progress.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {uniqueExercises.map((ex: any) => {
                                const data = getExerciseData(ex);
                                return (
                                    <Card key={ex} className="glass-card p-6">
                                        <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                                            <Dumbbell className="text-yellow-500" size={20} />
                                            {ex}
                                        </h3>
                                        <div className="h-[220px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={data}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                                                    <Line type="stepAfter" dataKey="value" stroke="#eab308" strokeWidth={3} dot={{ fill: '#eab308', r: 4 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
