"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getDashboardStats } from "@/lib/services/dashboard";
import { StatCard } from "@/components/dashboard/StatCard";
import { Activity, Target, Shield, Dumbbell, Trophy } from "lucide-react";
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
    Line
} from 'recharts';

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
        return <div className="p-8 text-white flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
                <Activity className="h-12 w-12 text-blue-500 mb-4 animate-spin" />
                <p>Loading analytics...</p>
            </div>
        </div>;
    }

    if (!data) return <div className="text-white">No data available. Upload some matches!</div>;

    // Prepare sorted lists
    const topPassers = [...data.allPlayers].sort((a: any, b: any) => b.avgPassing - a.avgPassing).slice(0, 5);
    const topScorers = [...data.allPlayers].sort((a: any, b: any) => b.goals - a.goals).slice(0, 5);
    const topAssists = [...data.allPlayers].sort((a: any, b: any) => b.assists - a.assists).slice(0, 5);
    const topTacklers = [...data.allPlayers].sort((a: any, b: any) => b.totalTackles - a.totalTackles).slice(0, 5);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div>
                <h1 className="text-3xl font-bold text-white">Team Overview</h1>
                <p className="text-gray-400">Key performance indicators for the season.</p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Matches Analyzed"
                    value={data.totalMatches}
                    icon={Activity}
                    color="blue"
                />
                <StatCard
                    title="Total Tackles"
                    value={data?.totalTackles || 0}
                    icon={Shield}
                    trend="+12% vs last month"
                />
                <StatCard
                    title="Avg. Passing"
                    value={`${Number(data.avgPassing).toFixed(3)}%`}
                    icon={Target}
                    color="purple"
                    trend="+2.4% vs last month"
                    trendUp={true}
                />
                <StatCard
                    title="Total Goals"
                    value={data.totalGoals || 0}
                    icon={Trophy}
                    color="yellow"
                />
                <StatCard
                    title="Gym PRs Tracked"
                    value={data.totalGymEntries}
                    icon={Dumbbell}
                    color="green"
                    trend="New Metric"
                />
            </div>

            {/* Main Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Evolution Chart (Wide) */}
                <div className="lg:col-span-2 glass-panel p-6 border-t-4 border-t-blue-500">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Activity className="text-blue-400" /> Performance Trend
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.recentActivity}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#9ca3af"
                                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                />
                                <YAxis stroke="#9ca3af" tickFormatter={(val) => Number(val).toFixed(0)} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(val: number) => val.toFixed(3)}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="performance"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    name="Team Rating"
                                    dot={{ fill: '#3b82f6', r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Gym Performers */}
                <div className="glass-panel p-6 border-t-4 border-t-green-500">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Dumbbell className="text-pink-500" />
                        Top Physical Performers
                    </h3>
                    <div className="space-y-4">
                        {data?.topGymPlayers.map((player: any, i: number) => (
                            <div
                                key={player.name}
                                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                                onClick={() => handlePlayerClick(player.name)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 font-bold">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <div className="font-medium text-white">{player.name}</div>
                                        <div className="text-xs text-gray-400">{player.perfCount} Exercises Logged</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-pink-400">
                                        {player.gymData && player.gymData.length > 0
                                            ? `${Math.max(...player.gymData.map((d: any) => d.maxPR))} kg Max`
                                            : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {data.topGymPlayers.length === 0 && (
                            <p className="text-gray-500 text-center py-8">No gym data yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Top Performers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    color="#ef4444" // Red
                    onPlayerClick={handlePlayerClick}
                />
            </div>

            <div className="glass-panel p-6 border-t-4 border-t-purple-500 flex flex-col justify-center items-center text-center">
                <h3 className="text-xl font-bold text-white mb-2">Need Insights?</h3>
                <p className="text-gray-400 mb-6 max-w-xs">Ask the AI Coach to analyze your latest match or training data.</p>
                <a href="/ai-coach" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                    <Target size={18} /> Go to AI Coach
                </a>
            </div>
        </div>
    );
}

const TopPlayerChart = ({ title, icon: Icon, data, dataKey, color, unit = "", onPlayerClick }: any) => {
    return (
        <div className={`glass-panel p-6 border-t-4`} style={{ borderColor: color }}>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Icon size={20} style={{ color }} /> {title}
            </h3>
            <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                        <XAxis type="number" stroke="#6b7280" fontSize={10} hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={100}
                            stroke="#9ca3af"
                            fontSize={11}
                            tick={{ fill: '#9ca3af' }}
                            interval={0}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                            formatter={(val: number) => [`${val.toFixed(3)}${unit}`, title]}
                        />
                        <Bar dataKey={dataKey} radius={[0, 4, 4, 0]} barSize={16} onClick={(data) => onPlayerClick(data.name)} cursor="pointer">
                            {data.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={color} style={{ opacity: 0.8 + (0.2 * ((5 - index) / 5)) }} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
