"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getDashboardStats } from "@/lib/services/dashboard";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState, InfoRow } from "@/components/ui/stats-display";
import { Activity, Target, Dumbbell, Trophy, TrendingUp, Calendar, Users } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Area,
    AreaChart
} from 'recharts';
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        getDashboardStats().then(stats => {
            setData(stats);
            setLoading(false);
        });
    }, []);

    const handlePlayerClick = (playerName: string) => {
        router.push(`/players?search=${encodeURIComponent(playerName)}`);
    };

    if (loading) {
        return <LoadingSkeleton variant="dashboard" />;
    }

    if (!data) {
        return (
            <EmptyState
                icon={Activity}
                title="No Data Yet"
                description="Upload your first match or training data to see analytics here."
                action={
                    <Link href="/upload">
                        <Button className="btn-premium">Upload Data</Button>
                    </Link>
                }
            />
        );
    }

    // Prepare sorted lists
    const topPassers = [...data.allPlayers].sort((a: any, b: any) => b.avgPassing - a.avgPassing).slice(0, 5);
    const topScorers = [...data.allPlayers].sort((a: any, b: any) => b.goals - a.goals).slice(0, 5);
    const topAssists = [...data.allPlayers].sort((a: any, b: any) => b.assists - a.assists).slice(0, 5);
    const topTacklers = [...data.allPlayers].sort((a: any, b: any) => b.totalTackles - a.totalTackles).slice(0, 5);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <PageHeader
                icon={TrendingUp}
                iconColor="blue"
                title="Team Overview"
                description="Key performance indicators for the season"
                actions={
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Last updated: {new Date().toLocaleDateString()}</span>
                    </div>
                }
            />

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                    title="Matches"
                    value={data.totalMatches}
                    icon={Activity}
                    color="blue"
                />
                <StatCard
                    title="Players"
                    value={data.allPlayers?.length || 0}
                    icon={Users}
                    color="purple"
                />
                <StatCard
                    title="Goals"
                    value={data.totalGoals || 0}
                    icon={Trophy}
                    color="yellow"
                />
                <StatCard
                    title="Avg. Passing"
                    value={`${Number(data.avgPassing || 0).toFixed(1)}%`}
                    icon={Target}
                    color="green"
                />
                <StatCard
                    title="Gym PRs"
                    value={data.totalGymEntries}
                    icon={Dumbbell}
                    color="pink"
                />
            </div>

            {/* Main Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Performance Trend (Wide) */}
                <Card className="lg:col-span-2 glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Activity className="text-primary w-5 h-5" />
                            Performance Trend
                        </h3>
                        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                            Last 10 matches
                        </span>
                    </div>
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.recentActivity}>
                                <defs>
                                    <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="date"
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={11}
                                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: '12px',
                                        color: 'hsl(var(--foreground))'
                                    }}
                                    labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                                    formatter={(val: number) => [val.toFixed(1), 'Performance']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="performance"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2}
                                    fill="url(#performanceGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Top Gym Performers */}
                <Card className="glass-card p-6">
                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <Dumbbell className="text-pink-500 w-5 h-5" />
                        Top Physical
                    </h3>
                    <div className="space-y-2">
                        {data?.topGymPlayers.slice(0, 5).map((player: any, i: number) => (
                            <InfoRow
                                key={player.name}
                                rank={i + 1}
                                title={player.name}
                                subtitle={`${player.perfCount} exercises`}
                                value={
                                    player.gymData && player.gymData.length > 0
                                        ? `${Math.max(...player.gymData.map((d: any) => d.maxPR))}kg`
                                        : '-'
                                }
                                onClick={() => handlePlayerClick(player.name)}
                            />
                        ))}
                        {data.topGymPlayers.length === 0 && (
                            <p className="text-muted-foreground text-center py-6 text-sm">No gym data yet</p>
                        )}
                    </div>
                </Card>
            </div>

            {/* Top Performers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <TopPlayerChart
                    title="Top Passers"
                    icon={Target}
                    data={topPassers}
                    dataKey="avgPassing"
                    color="hsl(var(--chart-1, 280 65% 60%))"
                    unit="%"
                    onPlayerClick={handlePlayerClick}
                />
                <TopPlayerChart
                    title="Top Scorers"
                    icon={Trophy}
                    data={topScorers}
                    dataKey="goals"
                    color="hsl(var(--chart-2, 48 96% 53%))"
                    onPlayerClick={handlePlayerClick}
                />
                <TopPlayerChart
                    title="Top Assists"
                    icon={Activity}
                    data={topAssists}
                    dataKey="assists"
                    color="hsl(var(--primary))"
                    onPlayerClick={handlePlayerClick}
                />
                <TopPlayerChart
                    title="Top Tacklers"
                    icon={Target}
                    data={topTacklers}
                    dataKey="totalTackles"
                    color="hsl(var(--destructive, 0 84% 60%))"
                    onPlayerClick={handlePlayerClick}
                />
            </div>

            {/* CTA Banner */}
            <Card className="glass-card p-8 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-left">
                        <h3 className="text-xl font-bold text-foreground mb-2">Need Deeper Insights?</h3>
                        <p className="text-muted-foreground max-w-md">
                            Ask the AI Coach to analyze your latest match or training data.
                        </p>
                    </div>
                    <Link href="/ai-coach">
                        <Button className="btn-premium whitespace-nowrap flex items-center gap-2">
                            <Target size={18} />
                            Go to AI Coach
                        </Button>
                    </Link>
                </div>
            </Card>
        </div>
    );
}

// Shared component for top player charts
interface TopPlayerChartProps {
    title: string;
    icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
    data: any[];
    dataKey: string;
    color: string;
    unit?: string;
    onPlayerClick: (name: string) => void;
}

function TopPlayerChart({ title, icon: Icon, data, dataKey, color, unit = "", onPlayerClick }: TopPlayerChartProps) {
    return (
        <Card className="glass-card p-5 card-hover" style={{ borderTop: `3px solid ${color}` }}>
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Icon size={16} style={{ color }} />
                {title}
            </h3>
            <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ left: -10, right: 10 }}>
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={80}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--accent))' }}
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                borderColor: 'hsl(var(--border))',
                                borderRadius: '8px',
                                color: 'hsl(var(--foreground))',
                                fontSize: '12px'
                            }}
                            formatter={(val: number) => [`${val.toFixed(1)}${unit}`, title]}
                        />
                        <Bar
                            dataKey={dataKey}
                            radius={[0, 6, 6, 0]}
                            barSize={14}
                            onClick={(data) => onPlayerClick(data.name)}
                            cursor="pointer"
                        >
                            {data.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={color} style={{ opacity: 1 - (index * 0.15) }} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
