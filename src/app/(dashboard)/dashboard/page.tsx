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

    useEffect(() => {
        getDashboardStats().then(stats => {
            setData(stats);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return <div className="p-8 text-white flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
                <Activity className="h-12 w-12 text-blue-500 mb-4 animate-spin" />
                <p>Loading analytics...</p>
            </div>
        </div>;
    }

    if (!data) return <div className="text-white">No data available. Upload some matches!</div>;

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
                    title="Avg. Passing"
                    value={`${data.avgPassing.toFixed(1)}%`}
                    icon={Target}
                    color="purple"
                    trend="+2.4% vs last month"
                    trendUp={true}
                />
                <StatCard
                    title="Total Goals"
                    value={data.totalGoals || 0} // Added to service but needed here
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
                                <YAxis stroke="#9ca3af" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
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

                {/* Top Gym Performers (Vertical List/Chart) */}
                <div className="glass-panel p-6 border-t-4 border-t-green-500">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Dumbbell className="text-green-400" /> Gym Leaders
                    </h3>
                    <div className="space-y-4">
                        {data.topGymPlayers.map((player: any, i: number) => (
                            <div key={player.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-yellow-500 text-black' :
                                            i === 1 ? 'bg-gray-400 text-black' :
                                                i === 2 ? 'bg-orange-700 text-white' : 'bg-gray-700 text-gray-400'
                                        }`}>{i + 1}</span>
                                    <span className="text-gray-200 font-medium">{player.name}</span>
                                </div>
                                <span className="text-green-400 font-bold">{player.perfCount} <span className="text-xs text-gray-500 font-normal">Records</span></span>
                            </div>
                        ))}
                        {data.topGymPlayers.length === 0 && (
                            <p className="text-gray-500 text-center py-8">No gym data yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Secondary Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6 border-t-4 border-t-purple-500">
                    <h3 className="text-xl font-bold text-white mb-6">Top Passers</h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.topPlayers} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                                <XAxis type="number" stroke="#9ca3af" domain={[0, 100]} />
                                <YAxis dataKey="name" type="category" width={100} stroke="#9ca3af" fontSize={12} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                />
                                <Bar dataKey="avgPassing" radius={[0, 4, 4, 0]} barSize={20}>
                                    {data.topPlayers.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#a855f7' : '#6366f1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel p-6 border-t-4 border-t-yellow-500 flex flex-col justify-center items-center text-center">
                    <h3 className="text-xl font-bold text-white mb-2">Need Insights?</h3>
                    <p className="text-gray-400 mb-6 max-w-xs">Ask the AI Coach to analyze your latest match or training data.</p>
                    <a href="/ai-coach" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                        <Target size={18} /> Go to AI Coach
                    </a>
                </div>
            </div>
        </div>
    );
}
