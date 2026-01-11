"use client";

import { useEffect, useState } from "react";
import { getPlayerStats } from "@/lib/services/player";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowLeft,
    TrendingUp,
    Activity,
    Dumbbell,
    Calendar,
    Target,
    Shield,
    ArrowRight,
    User
} from "lucide-react";
import Link from "next/link";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
} from "recharts";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { ThemeAwareTooltip } from "@/components/ui/theme-aware-tooltip"; // I'll create this helper or inline it

export default function PlayerProfilePage({ params }: { params: { name: string } }) {
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

    // Prepare chart data
    const chartData = matches.map((m: any) => ({
        date: m.date,
        rating: (m.passing_accuracy * 0.4) + (m.total_shots * 5) + (m.total_tackles * 2),
        goals: m.goals,
        passing: m.passing_accuracy
    }));

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

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/players">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft size={20} />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
                            {profile.name}
                        </h1>
                        <p className="text-muted-foreground flex items-center gap-2 mt-1 text-sm">
                            <Activity size={14} className="text-green-500" />
                            {profile.games} Matches
                            <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                            {profile.minutes}' Minutes
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => router.push('/ai-coach')}
                    className="btn-premium shadow-lg shadow-primary/20"
                >
                    Consult AI Coach <ArrowRight size={16} className="ml-2" />
                </Button>
            </div>

            {/* Key Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Goals"
                    value={profile.goals}
                    icon={Target}
                    color="blue"
                />
                <StatCard
                    title="Avg. Passing"
                    value={`${profile.avgPassing.toFixed(1)}%`}
                    icon={Activity}
                    color="purple"
                />
                <StatCard
                    title="Total Tackles"
                    value={profile.tackles}
                    icon={Shield}
                    color="green"
                />
                <StatCard
                    title="Gym Exercises"
                    value={gym.length}
                    icon={Dumbbell}
                    color="yellow"
                />
            </div>

            {/* Tabs Content */}
            <Tabs defaultValue="matches" className="w-full">
                <TabsList className="bg-muted p-1 rounded-xl w-full md:w-auto grid grid-cols-2 md:inline-flex">
                    <TabsTrigger
                        value="matches"
                        className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                        Match History
                    </TabsTrigger>
                    <TabsTrigger
                        value="gym"
                        className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                        Gym & Physical
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="matches" className="space-y-6 mt-6">
                    {/* Charts */}
                    <Card className="glass-card p-6 h-[350px]">
                        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <TrendingUp className="text-primary w-5 h-5" />
                            Passing Accuracy Trend
                        </h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                />
                                <YAxis
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                    domain={[0, 100]}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `${val}%`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        color: 'hsl(var(--foreground))',
                                        borderRadius: '12px'
                                    }}
                                    itemStyle={{ color: 'hsl(var(--primary))' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="passing"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={3}
                                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* History List */}
                    <div className="space-y-3">
                        {matches.map((m: any) => (
                            <Card key={m.id} className="glass-card p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-accent/50 transition-colors cursor-default">
                                <div className="flex items-center gap-4">
                                    <div className="bg-primary/10 p-3 rounded-xl text-primary">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p className="text-foreground font-bold text-lg">{m.opponent}</p>
                                        <p className="text-sm text-muted-foreground">{new Date(m.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex w-full md:w-auto justify-between md:justify-end gap-8 text-right">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Goals</p>
                                        <p className="text-foreground font-mono font-bold text-lg">{m.goals}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Assist</p>
                                        <p className="text-foreground font-mono font-bold text-lg">{m.assists}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Passing</p>
                                        <p className={`font-mono font-bold text-lg ${m.passing_accuracy >= 80 ? 'text-green-500' : m.passing_accuracy >= 70 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                                            {Number(m.passing_accuracy).toFixed(0)}%
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="gym" className="space-y-6 mt-6">
                    {gym.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-2xl bg-muted/20">
                            <Dumbbell size={48} className="text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-xl text-foreground font-bold mb-2">No Gym Data Found</h3>
                            <p className="text-muted-foreground">Upload performance data to track gym progress.</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {uniqueExercises.map((ex: any) => {
                            const data = getExerciseData(ex);
                            return (
                                <Card key={ex} className="glass-card p-6">
                                    <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                                        <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                                            <Dumbbell size={18} />
                                        </div>
                                        {ex}
                                    </h3>
                                    <div className="h-[220px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={data}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'hsl(var(--card))',
                                                        borderColor: 'hsl(var(--border))',
                                                        color: 'hsl(var(--foreground))',
                                                        borderRadius: '8px'
                                                    }}
                                                />
                                                <Line
                                                    type="stepAfter"
                                                    dataKey="value"
                                                    stroke="#eab308"
                                                    strokeWidth={3}
                                                    dot={{ fill: '#eab308', r: 4 }}
                                                    activeDot={{ r: 6 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 mt-4 text-center">
                                        {data.map((d: any) => (
                                            <div key={d.name} className="bg-muted p-2 rounded-lg">
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold">{d.name}</p>
                                                <p className="text-foreground font-bold">{d.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
