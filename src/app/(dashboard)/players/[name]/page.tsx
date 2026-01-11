
"use client";

import { useEffect, useState } from "react";
import { getPlayerStats } from "@/lib/services/player";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, TrendingUp, Activity, Dumbbell, Calendar, Target, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { useRouter } from "next/navigation";

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

    if (loading) return <div className="p-8 text-white">Loading profile...</div>;
    if (!data) return <div className="p-8 text-white">Player not found</div>;

    const { profile, matches, gym } = data;

    // Prepare chart data
    const chartData = matches.map((m: any) => ({
        date: m.date,
        rating: (m.passing_accuracy * 0.4) + (m.total_shots * 5) + (m.total_tackles * 2), // Rough heuristic again
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
            <div className="flex items-center gap-4">
                <Link href="/players">
                    <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/10">
                        <ArrowLeft size={20} className="mr-2" /> Back
                    </Button>
                </Link>
                <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">{profile.name}</h1>
                    <p className="text-gray-400 flex items-center gap-2 mt-1">
                        <Activity size={16} className="text-green-400" />
                        {profile.games} Matches Played
                        <span className="bg-white/10 w-1 h-1 rounded-full mx-2" />
                        {profile.minutes}' Minutes
                    </p>
                </div>
                <div className="ml-auto flex gap-3">
                    <Button
                        onClick={() => router.push('/ai-coach')}
                        className="bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                    >
                        Consult AI Coach <ArrowRight size={16} className="ml-2" />
                    </Button>
                </div>
            </div>

            {/* Key Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="glass-panel p-6 border-t-4 border-t-blue-500">
                    <div className="flex justify-between items-start mb-2">
                        <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                            <Target size={20} />
                        </div>
                        <span className="text-xs text-gray-400 font-mono">SEASON</span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{profile.goals}</div>
                    <div className="text-sm text-gray-400">Total Goals</div>
                </Card>
                <Card className="glass-panel p-6 border-t-4 border-t-purple-500">
                    <div className="flex justify-between items-start mb-2">
                        <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400">
                            <Activity size={20} />
                        </div>
                        <Badge variant="outline" className="border-purple-500/30 text-purple-300">{profile.avgPassing.toFixed(1)}%</Badge>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{profile.assists}</div>
                    <div className="text-sm text-gray-400">Total Assists</div>
                </Card>
                <Card className="glass-panel p-6 border-t-4 border-t-green-500">
                    <div className="flex justify-between items-start mb-2">
                        <div className="bg-green-500/20 p-2 rounded-lg text-green-400">
                            <Shield size={20} />
                        </div>
                        <span className="text-green-500 text-xs font-bold">DEFENSE</span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{profile.tackles}</div>
                    <div className="text-sm text-gray-400">Total Tackles</div>
                </Card>
                <Card className="glass-panel p-6 border-t-4 border-t-yellow-500">
                    <div className="flex justify-between items-start mb-2">
                        <div className="bg-yellow-500/20 p-2 rounded-lg text-yellow-400">
                            <Dumbbell size={20} />
                        </div>
                        <span className="text-yellow-500 text-xs font-bold">GYM</span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{gym.length}</div>
                    <div className="text-sm text-gray-400">Exercises Tracked</div>
                </Card>
            </div>

            {/* Tabs Content */}
            <Tabs defaultValue="matches" className="w-full">
                <TabsList className="bg-black/20 border border-white/10 p-1">
                    <TabsTrigger value="matches" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400">Match History</TabsTrigger>
                    <TabsTrigger value="gym" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white text-gray-400">Gym & Physical</TabsTrigger>
                </TabsList>

                <TabsContent value="matches" className="space-y-6 mt-6">
                    {/* Charts */}
                    <Card className="glass-panel p-6 h-[300px]">
                        <h3 className="text-lg font-bold text-white mb-4">Passing Accuracy Trend</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                                <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Line type="monotone" dataKey="passing" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Histoy List */}
                    <div className="space-y-2">
                        {matches.map((m: any) => (
                            <div key={m.id} className="glass-panel p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white/5 p-3 rounded-lg text-gray-300">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-lg">{m.opponent}</p>
                                        <p className="text-sm text-gray-400">{new Date(m.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-6 text-right">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase">Goals</p>
                                        <p className="text-white font-mono font-bold text-lg">{m.goals}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase">Assist</p>
                                        <p className="text-white font-mono font-bold text-lg">{m.assists}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase">Passing</p>
                                        <p className={`font-mono font-bold text-lg ${m.passing_accuracy > 80 ? 'text-green-400' : 'text-blue-400'}`}>
                                            {m.passing_accuracy.toFixed(0)}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="gym" className="space-y-6 mt-6">
                    {gym.length === 0 && (
                        <div className="glass-panel p-12 text-center">
                            <Dumbbell size={48} className="mx-auto text-gray-600 mb-4" />
                            <h3 className="text-xl text-white font-bold mb-2">No Gym Data Found</h3>
                            <p className="text-gray-400">Upload "Performans-Data" to track gym progress.</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {uniqueExercises.map((ex: any) => {
                            const data = getExerciseData(ex);
                            return (
                                <Card key={ex} className="glass-panel p-6">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <Dumbbell className="text-yellow-500" size={18} /> {ex}
                                    </h3>
                                    <div className="h-[200px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={data}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                                                <YAxis stroke="#9ca3af" fontSize={12} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                                />
                                                <Line type="step" dataKey="value" stroke="#eab308" strokeWidth={3} dot={{ fill: '#eab308' }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 mt-4 text-center">
                                        {data.map((d: any) => (
                                            <div key={d.name} className="bg-white/5 p-2 rounded">
                                                <p className="text-xs text-gray-500">{d.name}</p>
                                                <p className="text-white font-bold">{d.value}</p>
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
