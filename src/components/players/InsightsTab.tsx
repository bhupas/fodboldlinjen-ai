"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Dumbbell, TrendingUp } from "lucide-react";
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Label as RechartsLabel
} from 'recharts';

interface PlayerData {
    name: string;
    games: number;
    avgPassing: number;
    totalShots: number;
    totalTackles: number;
    goals: number;
    assists: number;
    minutes: number;
    yellowCards: number;
    redCards: number;
    maxGymPR: number;
}

interface InsightsTabProps {
    aggregatedPlayers: PlayerData[];
}

export function InsightsTab({ aggregatedPlayers }: InsightsTabProps) {
    const router = useRouter();

    return (
        <div className="space-y-6">
            {/* Visual Analytics - Scatter Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Goals vs Shots */}
                <Card className="glass-card p-6">
                    <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                        <Target className="text-blue-500 w-5 h-5" />
                        Efficiency Matrix (Goals vs Shots)
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                                <XAxis type="number" dataKey="totalShots" name="Shots" stroke="hsl(var(--muted-foreground))" fontSize={11}>
                                    <RechartsLabel value="Total Shots" offset={-10} position="insideBottom" />
                                </XAxis>
                                <YAxis type="number" dataKey="goals" name="Goals" stroke="hsl(var(--muted-foreground))" fontSize={11}>
                                    <RechartsLabel value="Goals" angle={-90} position="left" />
                                </YAxis>
                                <ZAxis type="number" dataKey="games" range={[50, 200]} name="Games" />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            const conversion = data.totalShots > 0 ? ((data.goals / data.totalShots) * 100).toFixed(1) : '0';
                                            return (
                                                <div style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', padding: '8px 12px' }}>
                                                    <p className="font-bold text-foreground text-sm">{data.name}</p>
                                                    <p className="text-xs text-muted-foreground">Goals: <span className="text-green-500">{data.goals}</span></p>
                                                    <p className="text-xs text-muted-foreground">Shots: {data.totalShots}</p>
                                                    <p className="text-[10px] text-muted-foreground mt-1">Conv. Rate: {conversion}%</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Scatter name="Players" data={aggregatedPlayers.filter(p => p.totalShots > 0)}>
                                    {aggregatedPlayers.filter(p => p.totalShots > 0).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill="hsl(var(--primary))" fillOpacity={0.7} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Gym PR vs Tackles */}
                <Card className="glass-card p-6">
                    <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                        <Dumbbell className="text-yellow-500 w-5 h-5" />
                        Physicality Impact
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                                <XAxis type="number" dataKey="maxGymPR" name="Gym PR" stroke="hsl(var(--muted-foreground))" fontSize={11} unit="kg">
                                    <RechartsLabel value="Max Gym PR (kg)" offset={-10} position="insideBottom" />
                                </XAxis>
                                <YAxis type="number" dataKey="totalTackles" name="Tackles" stroke="hsl(var(--muted-foreground))" fontSize={11}>
                                    <RechartsLabel value="Total Tackles" angle={-90} position="left" />
                                </YAxis>
                                <ZAxis type="number" dataKey="games" range={[50, 200]} name="Games" />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', padding: '8px 12px' }}>
                                                    <p className="font-bold text-foreground text-sm">{data.name}</p>
                                                    <p className="text-xs text-muted-foreground">Tackles: <span className="text-blue-500">{data.totalTackles}</span></p>
                                                    <p className="text-xs text-muted-foreground">Best Lift: <span className="text-yellow-500">{data.maxGymPR}kg</span></p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Scatter name="Players" data={aggregatedPlayers.filter(p => p.maxGymPR > 0)}>
                                    {aggregatedPlayers.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill="hsl(217 91% 60%)" fillOpacity={0.7} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Leaderboards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Top Performers (Passing) */}
                <LeaderboardCard
                    title="Top Performers (Passing)"
                    icon={<TrendingUp className="text-green-500 w-5 h-5" />}
                    players={aggregatedPlayers
                        .filter(p => p.games >= 3)
                        .sort((a, b) => b.avgPassing - a.avgPassing)
                        .slice(0, 5)}
                    valueKey="avgPassing"
                    valueFormat={(v) => `${v.toFixed(1)}%`}
                    valueColor="text-green-500"
                    onPlayerClick={(name) => router.push(`/players/${name}`)}
                />

                {/* Top Scorers */}
                <LeaderboardCard
                    title="Top Scorers"
                    icon={<Target className="text-blue-500 w-5 h-5" />}
                    players={aggregatedPlayers
                        .sort((a, b) => b.goals - a.goals)
                        .slice(0, 5)}
                    valueKey="goals"
                    valueFormat={(v) => `${v} ⚽`}
                    valueColor="text-green-500"
                    badgeStyle
                    onPlayerClick={(name) => router.push(`/players/${name}`)}
                />

                {/* Best Gym Performance */}
                <LeaderboardCard
                    title="Best Gym Performance"
                    icon={<Dumbbell className="text-yellow-500 w-5 h-5" />}
                    players={aggregatedPlayers
                        .filter(p => p.maxGymPR > 0)
                        .sort((a, b) => b.maxGymPR - a.maxGymPR)
                        .slice(0, 5)}
                    valueKey="maxGymPR"
                    valueFormat={(v) => `${v} kg`}
                    valueColor="text-yellow-500"
                    onPlayerClick={(name) => router.push(`/players/${name}`)}
                />
            </div>
        </div>
    );
}

// Leaderboard Card Component
interface LeaderboardCardProps {
    title: string;
    icon: React.ReactNode;
    players: PlayerData[];
    valueKey: keyof PlayerData;
    valueFormat: (value: number) => string;
    valueColor: string;
    badgeStyle?: boolean;
    onPlayerClick: (name: string) => void;
}

function LeaderboardCard({ title, icon, players, valueKey, valueFormat, valueColor, badgeStyle, onPlayerClick }: LeaderboardCardProps) {
    return (
        <Card className="glass-card p-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                {icon}
                {title}
            </h3>
            <div className="space-y-3">
                {players.map((player, idx) => (
                    <div
                        key={player.name}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => onPlayerClick(player.name)}
                    >
                        <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-500 text-black' :
                                idx === 1 ? 'bg-gray-400 text-black' :
                                    idx === 2 ? 'bg-amber-600 text-white' :
                                        'bg-muted text-foreground'
                                }`}>
                                {idx + 1}
                            </span>
                            <span className="font-medium">{player.name}</span>
                        </div>
                        {badgeStyle ? (
                            <Badge variant="outline" className={`bg-opacity-10 border-opacity-30 ${valueColor}`}>
                                {valueFormat(player[valueKey] as number)}
                            </Badge>
                        ) : (
                            <span className={`font-mono ${valueColor}`}>
                                {valueFormat(player[valueKey] as number)}
                            </span>
                        )}
                    </div>
                ))}
                {players.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-4">No data available</p>
                )}
            </div>
        </Card>
    );
}
