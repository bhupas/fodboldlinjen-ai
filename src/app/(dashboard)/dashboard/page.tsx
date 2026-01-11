"use client";

import { useEffect, useState } from "react";
import { getDashboardStats } from "@/lib/services/dashboard";
import { StatCard } from "@/components/dashboard/StatCard";
import { Activity, Target, Shield } from "lucide-react";
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
        return <div className="text-white">Loading stats...</div>;
    }

    if (!data) return <div className="text-white">No data available. Upload some matches!</div>;

    return (
        <div className="space-y-8">
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
                />
                <StatCard
                    title="Avg. Passing Accuracy"
                    value={`${data.avgPassing.toFixed(1)}%`}
                    icon={Target}
                    trend="+2.4% vs last month"
                    trendUp={true}
                />
                <StatCard
                    title="Total Shots"
                    value={data.totalShots}
                    icon={Target}
                />
                <StatCard
                    title="Defensive Actions"
                    value={data.totalTackles}
                    icon={Shield}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Top Passers</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.topPlayers} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                <XAxis type="number" stroke="#94a3b8" />
                                <YAxis dataKey="name" type="category" width={100} stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="avgPassing" fill="#4F46E5" radius={[0, 4, 4, 0]}>
                                    {data.topPlayers.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#8B5CF6' : '#4F46E5'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Recent Team Performance</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.recentActivity}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#94a3b8"
                                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                    labelFormatter={(val) => new Date(val).toLocaleDateString()}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="performance"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#1e293b' }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
