"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getDashboardStats } from "@/lib/services/dashboard";
import { StatCard } from "@/components/dashboard/StatCard";
import { Activity, Target, Shield, Dumbbell, Trophy, TrendingUp, Calendar, Users } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LineChart,
    Line,
    Area,
    AreaChart
} from 'recharts';
import Link from "next/link";

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
        return <LoadingSkeleton />;
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
                    <Activity className="w-12 h-12 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">No Data Yet</h2>
                <p className="text-gray-400 mb-6 max-w-md">
                    Upload your first match or training data to see analytics here.
                </p>
                <Link href="/upload" className="btn-premium px-6 py-3 rounded-xl">
                    Upload Data
                </Link>
            </div>
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        Team Overview
                    </h1>
                    <p className="text-gray-400 mt-1">Key performance indicators for the season</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Last updated: {new Date().toLocaleDateString()}</span>
                </div>
            </div>

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
                <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Activity className="text-blue-400 w-5 h-5" />
                            Performance Trend
                        </h3>
                        <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">Last 10 matches</span>
                    </div>
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.recentActivity}>
                                <defs>
                                    <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#6b7280"
                                    fontSize={11}
                                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                />
                                <YAxis stroke="#6b7280" fontSize={11} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                    labelStyle={{ color: '#9ca3af' }}
                                    formatter={(val: number) => [val.toFixed(1), 'Performance']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="performance"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    fill="url(#performanceGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Gym Performers */}
                <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Dumbbell className="text-pink-400 w-5 h-5" />
                        Top Physical
                    </h3>
                    <div className="space-y-3">
                        {data?.topGymPlayers.slice(0, 5).map((player: any, i: number) => (
                            <div
                                key={player.name}
                                className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-all group"
                                onClick={() => handlePlayerClick(player.name)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' :
                                            i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800' :
                                                i === 2 ? 'bg-gradient-to-br from-orange-600 to-orange-700 text-white' :
                                                    'bg-white/10 text-gray-400'
                                        }`}>
                                        {i + 1}
                                    </div>
                                    <div>
                                        <div className="font-medium text-white text-sm group-hover:text-blue-400 transition-colors">{player.name}</div>
                                        <div className="text-xs text-gray-500">{player.perfCount} exercises</div>
                                    </div>
                                </div>
                                <div className="text-sm font-bold text-pink-400">
                                    {player.gymData && player.gymData.length > 0
                                        ? `${Math.max(...player.gymData.map((d: any) => d.maxPR))}kg`
                                        : '-'}
                                </div>
                            </div>
                        ))}
                        {data.topGymPlayers.length === 0 && (
                            <p className="text-gray-500 text-center py-6 text-sm">No gym data yet</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Top Performers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <TopPlayerChart
                    title="Top Passers"
                    icon={Target}
                    data={topPassers}
                    dataKey="avgPassing"
                    color="#a855f7"
                    unit="%"
                    onPlayerClick={handlePlayerClick}
                />
                <TopPlayerChart
                    title="Top Scorers"
                    icon={Trophy}
                    data={topScorers}
                    dataKey="goals"
                    color="#eab308"
                    onPlayerClick={handlePlayerClick}
                />
                <TopPlayerChart
                    title="Top Assists"
                    icon={Activity}
                    data={topAssists}
                    dataKey="assists"
                    color="#3b82f6"
                    onPlayerClick={handlePlayerClick}
                />
                <TopPlayerChart
                    title="Top Tacklers"
                    icon={Shield}
                    data={topTacklers}
                    dataKey="totalTackles"
                    color="#ef4444"
                    onPlayerClick={handlePlayerClick}
                />
            </div>

            {/* CTA Banner */}
            <div className="glass-panel p-8 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-white/10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-left">
                        <h3 className="text-xl font-bold text-white mb-2">Need Deeper Insights?</h3>
                        <p className="text-gray-400 max-w-md">Ask the AI Coach to analyze your latest match or training data.</p>
                    </div>
                    <Link href="/ai-coach" className="btn-premium px-8 py-3 rounded-xl whitespace-nowrap flex items-center gap-2">
                        <Target size={18} />
                        Go to AI Coach
                    </Link>
                </div>
            </div>
        </div>
    );
}

// Loading Skeleton Component
function LoadingSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl skeleton" />
                <div className="space-y-2">
                    <div className="h-6 w-48 skeleton rounded" />
                    <div className="h-4 w-64 skeleton rounded" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-28 skeleton rounded-2xl" />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-80 skeleton rounded-2xl" />
                <div className="h-80 skeleton rounded-2xl" />
            </div>
        </div>
    );
}

const TopPlayerChart = ({ title, icon: Icon, data, dataKey, color, unit = "", onPlayerClick }: any) => {
    return (
        <div className="glass-panel p-5 rounded-2xl card-hover" style={{ borderTop: `3px solid ${color}` }}>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
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
                            tick={{ fill: '#9ca3af', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
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
        </div>
    );
};
