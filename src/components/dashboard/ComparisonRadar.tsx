"use client";

import { useState } from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from 'recharts';

interface PlayerComparisonProps {
    player1: any;
    player2: any;
}

export default function ComparisonRadar({ player1, player2 }: PlayerComparisonProps) {
    const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);

    if (!player1 || !player2) return null;

    // Max values for normalization
    const MAX_GAMES = 20;
    const MAX_SHOTS = 50;
    const MAX_TACKLES = 50;
    const MAX_GOALS = 15;
    const MAX_ASSISTS = 15;
    const MAX_MINUTES = 1800; // ~20 games

    const normalize = (val: number, max: number) => {
        if (!val) return 0;
        return Math.min(100, (val / max) * 100);
    };

    const data = [
        {
            subject: 'Passing',
            A: player1.avgPassing || 0,
            B: player2.avgPassing || 0,
            fullMark: 100,
            rawA: `${(player1.avgPassing || 0).toFixed(1)}%`,
            rawB: `${(player2.avgPassing || 0).toFixed(1)}%`,
        },
        {
            subject: 'Goals',
            A: normalize(player1.goals, MAX_GOALS),
            B: normalize(player2.goals, MAX_GOALS),
            fullMark: 100,
            rawA: player1.goals || 0,
            rawB: player2.goals || 0,
        },
        {
            subject: 'Assists',
            A: normalize(player1.assists, MAX_ASSISTS),
            B: normalize(player2.assists, MAX_ASSISTS),
            fullMark: 100,
            rawA: player1.assists || 0,
            rawB: player2.assists || 0,
        },
        {
            subject: 'Shots',
            A: normalize(player1.totalShots, MAX_SHOTS),
            B: normalize(player2.totalShots, MAX_SHOTS),
            fullMark: 100,
            rawA: player1.totalShots || 0,
            rawB: player2.totalShots || 0,
        },
        {
            subject: 'Defense',
            A: normalize(player1.totalTackles, MAX_TACKLES),
            B: normalize(player2.totalTackles, MAX_TACKLES),
            fullMark: 100,
            rawA: player1.totalTackles || 0,
            rawB: player2.totalTackles || 0,
        },
        {
            subject: 'Playtime',
            A: normalize(player1.minutes, MAX_MINUTES),
            B: normalize(player2.minutes, MAX_MINUTES),
            fullMark: 100,
            rawA: `${player1.minutes || 0}'`,
            rawB: `${player2.minutes || 0}'`,
        }
    ];

    // Custom tooltip component
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const dataPoint = data.find(d => d.subject === label);
            return (
                <div className="bg-background/95 backdrop-blur-sm border border-border rounded-xl p-4 shadow-xl">
                    <p className="font-bold text-foreground mb-2">{label}</p>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-500" />
                            <span className="text-blue-400 font-medium">{player1.name}:</span>
                            <span className="text-foreground font-mono">{dataPoint?.rawA}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-purple-500" />
                            <span className="text-purple-400 font-medium">{player2.name}:</span>
                            <span className="text-foreground font-mono">{dataPoint?.rawB}</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Custom label renderer
    const renderCustomLabel = (props: any) => {
        const { cx, cy, payload, x, y } = props;
        const dataPoint = data.find(d => d.subject === payload.value);

        return (
            <g>
                <text
                    x={x}
                    y={y}
                    textAnchor={x > cx ? 'start' : x < cx ? 'end' : 'middle'}
                    dominantBaseline={y > cy ? 'hanging' : y < cy ? 'auto' : 'middle'}
                    fill="hsl(var(--foreground))"
                    fontSize={13}
                    fontWeight={600}
                >
                    {payload.value}
                </text>
                {dataPoint && (
                    <text
                        x={x}
                        y={y + 14}
                        textAnchor={x > cx ? 'start' : x < cx ? 'end' : 'middle'}
                        dominantBaseline={y > cy ? 'hanging' : 'auto'}
                        fill="hsl(var(--muted-foreground))"
                        fontSize={10}
                    >
                        {dataPoint.rawA} vs {dataPoint.rawB}
                    </text>
                )}
            </g>
        );
    };

    return (
        <div className="w-full flex flex-col">
            {/* Glow effects */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`w-48 h-48 rounded-full blur-3xl transition-opacity duration-300 ${hoveredPlayer === 'A' ? 'opacity-30' : 'opacity-10'} bg-blue-500`} />
                <div className={`w-48 h-48 rounded-full blur-3xl transition-opacity duration-300 ${hoveredPlayer === 'B' ? 'opacity-30' : 'opacity-10'} bg-purple-500 -ml-24`} />
            </div>

            <div className="h-[350px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                        <defs>
                            {/* Gradient for Player 1 */}
                            <linearGradient id="player1Gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                                <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.3} />
                            </linearGradient>
                            {/* Gradient for Player 2 */}
                            <linearGradient id="player2Gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.8} />
                                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.3} />
                            </linearGradient>
                            {/* Glow filter */}
                            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        <PolarGrid
                            stroke="hsl(var(--border))"
                            strokeOpacity={0.5}
                            gridType="polygon"
                        />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={renderCustomLabel}
                            tickLine={false}
                        />
                        <PolarRadiusAxis
                            angle={30}
                            domain={[0, 100]}
                            tick={false}
                            axisLine={false}
                        />

                        <Tooltip content={<CustomTooltip />} />

                        <Radar
                            name={player1.name}
                            dataKey="A"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fill="url(#player1Gradient)"
                            fillOpacity={0.4}
                            filter="url(#glow)"
                            onMouseEnter={() => setHoveredPlayer('A')}
                            onMouseLeave={() => setHoveredPlayer(null)}
                            style={{ cursor: 'pointer' }}
                        />
                        <Radar
                            name={player2.name}
                            dataKey="B"
                            stroke="#a855f7"
                            strokeWidth={3}
                            fill="url(#player2Gradient)"
                            fillOpacity={0.4}
                            filter="url(#glow)"
                            onMouseEnter={() => setHoveredPlayer('B')}
                            onMouseLeave={() => setHoveredPlayer(null)}
                            style={{ cursor: 'pointer' }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* Player color legend - responsive with proper spacing */}
            <div className="flex flex-wrap justify-center gap-3 mt-4 px-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 max-w-[160px]">
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    <span className="text-blue-400 font-medium text-xs truncate" title={player1.name}>{player1.name}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 max-w-[160px]">
                    <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                    <span className="text-purple-400 font-medium text-xs truncate" title={player2.name}>{player2.name}</span>
                </div>
            </div>

        </div>
    );
}
