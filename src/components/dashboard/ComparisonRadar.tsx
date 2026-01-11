"use client";

import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Legend,
    Tooltip
} from 'recharts';

interface PlayerComparisonProps {
    player1: any;
    player2: any;
}

export default function ComparisonRadar({ player1, player2 }: PlayerComparisonProps) {
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
            subject: 'Passing %',
            A: player1.avgPassing || 0,
            B: player2.avgPassing || 0,
            fullMark: 100,
        },
        {
            subject: 'Goals',
            A: normalize(player1.goals, MAX_GOALS),
            B: normalize(player2.goals, MAX_GOALS),
            fullMark: 100,
        },
        {
            subject: 'Assists',
            A: normalize(player1.assists, MAX_ASSISTS),
            B: normalize(player2.assists, MAX_ASSISTS),
            fullMark: 100,
        },
        {
            subject: 'Shots',
            A: normalize(player1.totalShots, MAX_SHOTS),
            B: normalize(player2.totalShots, MAX_SHOTS),
            fullMark: 100,
        },
        {
            subject: 'Defense',
            A: normalize(player1.totalTackles, MAX_TACKLES),
            B: normalize(player2.totalTackles, MAX_TACKLES),
            fullMark: 100,
        },
        {
            subject: 'Minutes',
            A: normalize(player1.minutes, MAX_MINUTES),
            B: normalize(player2.minutes, MAX_MINUTES),
            fullMark: 100,
        }
    ];

    return (
        <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke="#ffffff20" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <PolarRadiusAxis box={false} tick={false} axisLine={false} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                    />
                    <Radar
                        name={player1.name}
                        dataKey="A"
                        stroke="#3b82f6" // Blue
                        strokeWidth={3}
                        fill="#3b82f6"
                        fillOpacity={0.3}
                    />
                    <Radar
                        name={player2.name}
                        dataKey="B"
                        stroke="#a855f7" // Purple
                        strokeWidth={3}
                        fill="#a855f7"
                        fillOpacity={0.3}
                    />
                    <Legend wrapperStyle={{ color: '#fff' }} />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
