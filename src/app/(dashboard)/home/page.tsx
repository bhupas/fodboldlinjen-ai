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
    AreaChart,
    ScatterChart,
    Scatter,
    ZAxis,
    ReferenceLine,
    ReferenceArea,
    Label
} from 'recharts';
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuickActions } from "@/components/dashboard/QuickActions";

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

    // Dynamic greeting based on time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <PageHeader
                icon={TrendingUp}
                iconColor="blue"
                title={`${getGreeting()}, Coach 👋`}
                description="Here's your team's performance overview"
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

            {/* Quick Actions */}
            <QuickActions />

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

            {/* Advanced Analytics - Player Roles Quadrant */}
            <Card className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Users className="text-purple-500 w-5 h-5" />
                            Player Roles Analysis
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Center (0,0) represents the Team Average.
                        </p>
                    </div>
                    <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border">
                        Relative Performance
                    </span>
                </div>
                <div className="h-[400px] w-full">
                    {(() => {
                        // 1. Calculate Averages
                        const playerCount = data.allPlayers.length || 1;
                        const avgDef = data.allPlayers.reduce((sum: number, p: any) => sum + p.defContrib, 0) / playerCount;
                        const avgOff = data.allPlayers.reduce((sum: number, p: any) => sum + p.offContrib, 0) / playerCount;

                        // 2. Center Data
                        const centeredData = data.allPlayers.map((p: any) => ({
                            ...p,
                            x: p.defContrib - avgDef,
                            y: p.offContrib - avgOff,
                            originalDef: p.defContrib,
                            originalOff: p.offContrib
                        }));

                        // 3. Determine symmetric scale size
                        const maxAbsX = Math.max(...centeredData.map((p: any) => Math.abs(p.x))) * 1.2 || 10;
                        const maxAbsY = Math.max(...centeredData.map((p: any) => Math.abs(p.y))) * 1.2 || 10;
                        const domain = Math.max(maxAbsX, maxAbsY);

                        // Premium color palette
                        const COLORS = {
                            totalPackage: '#10b981',      // Emerald - balanced excellence
                            totalPackageBg: '#059669',
                            attacker: '#f43f5e',          // Rose - offensive power
                            attackerBg: '#e11d48',
                            defender: '#06b6d4',          // Cyan - defensive stability
                            defenderBg: '#0891b2',
                            developing: '#f59e0b',        // Amber - growth potential
                            developingBg: '#d97706',
                            grid: 'rgba(255,255,255,0.15)',
                            axes: 'rgba(255,255,255,0.6)'
                        };

                        return (
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                                    <defs>
                                        {/* Gradient for Total Package quadrant */}
                                        <linearGradient id="totalPackageGrad" x1="0" y1="1" x2="1" y2="0">
                                            <stop offset="0%" stopColor={COLORS.totalPackage} stopOpacity={0.15} />
                                            <stop offset="100%" stopColor={COLORS.totalPackageBg} stopOpacity={0.05} />
                                        </linearGradient>
                                        {/* Gradient for Attacker quadrant */}
                                        <linearGradient id="attackerGrad" x1="1" y1="1" x2="0" y2="0">
                                            <stop offset="0%" stopColor={COLORS.attacker} stopOpacity={0.12} />
                                            <stop offset="100%" stopColor={COLORS.attackerBg} stopOpacity={0.03} />
                                        </linearGradient>
                                        {/* Gradient for Defender quadrant */}
                                        <linearGradient id="defenderGrad" x1="0" y1="0" x2="1" y2="1">
                                            <stop offset="0%" stopColor={COLORS.defender} stopOpacity={0.12} />
                                            <stop offset="100%" stopColor={COLORS.defenderBg} stopOpacity={0.03} />
                                        </linearGradient>
                                        {/* Gradient for Developing quadrant */}
                                        <linearGradient id="developingGrad" x1="1" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={COLORS.developing} stopOpacity={0.1} />
                                            <stop offset="100%" stopColor={COLORS.developingBg} stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>

                                    <XAxis
                                        type="number"
                                        dataKey="x"
                                        name="Relative Defense"
                                        domain={[-domain, domain]}
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={10}
                                        tickFormatter={(val) => val === 0 ? '' : val.toFixed(1)}
                                    >
                                        <Label value="Defensive Contribution vs. Avg" offset={-10} position="insideBottom" fontSize={11} fill="hsl(var(--muted-foreground))" />
                                    </XAxis>
                                    <YAxis
                                        type="number"
                                        dataKey="y"
                                        name="Relative Offense"
                                        domain={[-domain, domain]}
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={10}
                                        tickFormatter={(val) => val === 0 ? '' : val.toFixed(1)}
                                    >
                                        <Label value="Offensive Contribution vs. Avg" angle={-90} position="left" style={{ textAnchor: 'middle' }} fontSize={11} fill="hsl(var(--muted-foreground))" />
                                    </YAxis>
                                    <ZAxis type="number" dataKey="games" range={[80, 500]} name="Games" />

                                    <Tooltip cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.3)' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const d = payload[0].payload;
                                                // Determine quadrant color
                                                let quadrantColor = COLORS.developing;
                                                let quadrantName = 'Developing';
                                                if (d.x > 0 && d.y > 0) { quadrantColor = COLORS.totalPackage; quadrantName = 'Total Package'; }
                                                else if (d.x > 0 && d.y <= 0) { quadrantColor = COLORS.defender; quadrantName = 'Defensive Specialist'; }
                                                else if (d.x <= 0 && d.y > 0) { quadrantColor = COLORS.attacker; quadrantName = 'Attacker'; }

                                                return (
                                                    <div style={{
                                                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                                        border: `1px solid ${quadrantColor}40`,
                                                        borderRadius: '12px',
                                                        padding: '12px 16px',
                                                        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${quadrantColor}20`,
                                                        backdropFilter: 'blur(8px)'
                                                    }}>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: quadrantColor }} />
                                                            <p className="font-bold text-white text-sm">{d.name}</p>
                                                        </div>
                                                        <p className="text-xs mb-2" style={{ color: quadrantColor }}>{quadrantName}</p>
                                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                                            <span className="text-slate-400">Defense:</span>
                                                            <span style={{ color: d.x >= 0 ? COLORS.totalPackage : COLORS.attacker }}>
                                                                {d.originalDef.toFixed(1)} ({d.x >= 0 ? '+' : ''}{d.x.toFixed(1)})
                                                            </span>
                                                            <span className="text-slate-400">Offense:</span>
                                                            <span style={{ color: d.y >= 0 ? COLORS.totalPackage : COLORS.defender }}>
                                                                {d.originalOff.toFixed(1)} ({d.y >= 0 ? '+' : ''}{d.y.toFixed(1)})
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 mt-2 border-t pt-2 border-slate-700">{d.games} Matches Played</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />

                                    {/* The Cartesian Axes */}
                                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />
                                    <ReferenceLine x={0} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />

                                    {/* Top Right: Total Package - Emerald */}
                                    <ReferenceArea x1={0} x2={domain} y1={0} y2={domain} fill="url(#totalPackageGrad)" />
                                    <ReferenceArea x1={domain * 0.5} x2={domain} y1={domain * 0.6} y2={domain} fill="transparent">
                                        <Label value="Total Package" position="center" fill={COLORS.totalPackage} fontSize={14} fontWeight="bold" />
                                    </ReferenceArea>

                                    {/* Bottom Right: Defensive Specialist - Cyan */}
                                    <ReferenceArea x1={0} x2={domain} y1={-domain} y2={0} fill="url(#defenderGrad)" />
                                    <ReferenceArea x1={domain * 0.5} x2={domain} y1={-domain} y2={-domain * 0.6} fill="transparent">
                                        <Label value="Defender" position="center" fill={COLORS.defender} fontSize={14} fontWeight="bold" />
                                    </ReferenceArea>

                                    {/* Top Left: Attacking Specialist - Rose */}
                                    <ReferenceArea x1={-domain} x2={0} y1={0} y2={domain} fill="url(#attackerGrad)" />
                                    <ReferenceArea x1={-domain} x2={-domain * 0.5} y1={domain * 0.6} y2={domain} fill="transparent">
                                        <Label value="Attacker" position="center" fill={COLORS.attacker} fontSize={14} fontWeight="bold" />
                                    </ReferenceArea>

                                    {/* Bottom Left: Developing - Amber */}
                                    <ReferenceArea x1={-domain} x2={0} y1={-domain} y2={0} fill="url(#developingGrad)" />
                                    <ReferenceArea x1={-domain} x2={-domain * 0.5} y1={-domain} y2={-domain * 0.6} fill="transparent">
                                        <Label value="Developing" position="center" fill={COLORS.developing} fontSize={14} fontWeight="bold" />
                                    </ReferenceArea>

                                    <Scatter name="Players" data={centeredData}>
                                        {centeredData.map((entry: any, index: number) => {
                                            // Dynamic coloring based on quadrant
                                            let color = COLORS.developing;
                                            if (entry.x > 0 && entry.y > 0) color = COLORS.totalPackage;
                                            else if (entry.x > 0 && entry.y <= 0) color = COLORS.defender;
                                            else if (entry.x <= 0 && entry.y > 0) color = COLORS.attacker;

                                            return (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={color}
                                                    stroke="rgba(255,255,255,0.3)"
                                                    strokeWidth={2}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            );
                                        })}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        );
                    })()}
                </div>
            </Card>

            {/* Top Performers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <TopPlayerChart
                    title="Top Passers"
                    icon={Target}
                    data={topPassers}
                    dataKey="avgPassing"
                    color="#c084fc"
                    unit="%"
                    onPlayerClick={handlePlayerClick}
                />
                <TopPlayerChart
                    title="Top Scorers"
                    icon={Trophy}
                    data={topScorers}
                    dataKey="goals"
                    color="#facc15"
                    onPlayerClick={handlePlayerClick}
                />
                <TopPlayerChart
                    title="Top Assists"
                    icon={Activity}
                    data={topAssists}
                    dataKey="assists"
                    color="#60a5fa"
                    onPlayerClick={handlePlayerClick}
                />
                <TopPlayerChart
                    title="Top Tacklers"
                    icon={Target}
                    data={topTacklers}
                    dataKey="totalTackles"
                    color="#f87171"
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
                    <Link href="/ai">
                        <Button className="btn-premium whitespace-nowrap flex items-center gap-2">
                            <Target size={18} />
                            Go to AI
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
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    const value = payload[0].value as number;
                                    return (
                                        <div style={{ backgroundColor: '#000', border: '1px solid #444', borderRadius: '8px', padding: '8px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.6)' }}>
                                            <p style={{ color: '#fff', fontWeight: 600, fontSize: '13px', margin: 0 }}>{label}</p>
                                            <p style={{ color: '#ddd', fontSize: '12px', margin: '4px 0 0 0' }}>{title}: {value.toFixed(1)}{unit}</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar
                            dataKey={dataKey}
                            radius={[0, 6, 6, 0]}
                            barSize={14}
                            onClick={(data) => onPlayerClick(data.name)}
                            cursor="pointer"
                        >
                            {data.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
