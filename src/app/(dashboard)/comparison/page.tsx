"use client";

import { useEffect, useState } from "react";
import { getDashboardStats } from "@/lib/services/dashboard";
import ComparisonRadar from "@/components/dashboard/ComparisonRadar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Swords, Trophy, Footprints } from "lucide-react";

export default function ComparisonPage() {
    const [loading, setLoading] = useState(true);
    const [players, setPlayers] = useState<any[]>([]);

    const [player1Id, setPlayer1Id] = useState<string>("");
    const [player2Id, setPlayer2Id] = useState<string>("");

    useEffect(() => {
        getDashboardStats().then((data) => {
            if (data && data.allPlayers) {
                setPlayers(data.allPlayers);
                if (data.allPlayers.length >= 2) {
                    setPlayer1Id(data.allPlayers[0].name);
                    setPlayer2Id(data.allPlayers[1].name);
                }
            }
            setLoading(false);
        });
    }, []);

    const player1 = players.find(p => p.name === player1Id);
    const player2 = players.find(p => p.name === player2Id);

    if (loading) return <div className="p-8 text-white">Loading Arena...</div>;

    return (
        <div className="space-y-8 relative">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Swords className="text-white" size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Head-to-Head</h1>
                    <p className="text-gray-400">Deep compare player performance metrics.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Player 1 Details */}
                <PlayerCard
                    player={player1}
                    players={players}
                    selectedId={player1Id}
                    onSelect={setPlayer1Id}
                    color="blue"
                    label="PLAYER A"
                />

                {/* Center Radar */}
                <Card className="glass-panel p-6 flex flex-col items-center justify-center min-h-[400px]">
                    {player1 && player2 ? (
                        <div className="w-full">
                            <ComparisonRadar player1={player1} player2={player2} />
                            <div className="mt-6 text-center text-sm text-gray-400">
                                Comparison normalized against league averages
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-500">Select two players to compare</div>
                    )}
                </Card>

                {/* Player 2 Details */}
                <PlayerCard
                    player={player2}
                    players={players}
                    selectedId={player2Id}
                    onSelect={setPlayer2Id}
                    color="purple"
                    label="PLAYER B"
                />
            </div>

            {/* Detailed Stats Comparison Table */}
            {player1 && player2 && (
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Detailed Stat Breakdown</h3>
                    <div className="grid grid-cols-3 gap-4 border-b border-white/10 pb-2 mb-2 text-sm text-gray-400 font-semibold uppercase tracking-wider">
                        <div className="text-blue-400 text-right">{player1.name}</div>
                        <div className="text-center text-white">Metric</div>
                        <div className="text-purple-400 text-left">{player2.name}</div>
                    </div>

                    <StatRow label="Matches Played" val1={player1.games} val2={player2.games} unit="" />
                    <StatRow label="Minutes Played" val1={player1.minutes} val2={player2.minutes} unit="'" />
                    <StatRow label="Goals" val1={player1.goals} val2={player2.goals} unit=" ⚽" highlight />
                    <StatRow label="Assists" val1={player1.assists} val2={player2.assists} unit=" 👟" highlight />
                    <StatRow label="Passing Accuracy" val1={player1.avgPassing.toFixed(1)} val2={player2.avgPassing.toFixed(1)} unit="%" />
                    <StatRow label="Total Shots" val1={player1.totalShots} val2={player2.totalShots} unit="" />
                    <StatRow label="Total Tackles" val1={player1.totalTackles} val2={player2.totalTackles} unit="" />
                    <StatRow label="Exercises Tracked (Gym)" val1={player1.perfCount || 0} val2={player2.perfCount || 0} unit="" />
                    <StatRow label="Red/Yellow Cards" val1={`${player1.redCards}/${player1.yellowCards}`} val2={`${player2.redCards}/${player2.yellowCards}`} unit="" />
                </div>
            )}
        </div>
    );
}

function StatRow({ label, val1, val2, unit, highlight }: { label: string, val1: string | number, val2: string | number, unit: string, highlight?: boolean }) {
    // Determine winner purely for visual highlighting (simple check)
    // Note: This logic assumes higher is better, which isn't true for Cards.
    const isV1Num = typeof val1 === 'number';
    const isV2Num = typeof val2 === 'number';
    let win1 = false;
    let win2 = false;

    if (isV1Num && isV2Num) {
        win1 = val1 > val2;
        win2 = val2 > val1;
    }

    return (
        <div className={`grid grid-cols-3 gap-2 md:gap-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${highlight ? 'bg-white/5' : ''}`}>
            <div className={`text-right font-mono text-xs md:text-base ${win1 ? 'text-blue-400 font-bold' : 'text-gray-300'}`}>{val1}{unit}</div>
            <div className="text-center text-gray-400 text-[10px] md:text-sm flex items-center justify-center">{label}</div>
            <div className={`text-left font-mono text-xs md:text-base ${win2 ? 'text-purple-400 font-bold' : 'text-gray-300'}`}>{val2}{unit}</div>
        </div>
    )
}

function PlayerCard({ player, players, selectedId, onSelect, color, label }: any) {
    const colorClasses = color === 'blue' ? 'border-blue-500/30 text-blue-400' : 'border-purple-500/30 text-purple-400';
    const bgClasses = color === 'blue' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-purple-500/10 border-purple-500/20';

    return (
        <Card className={`glass-panel p-6 ${colorClasses} border`}>
            <h3 className={`text-sm font-medium mb-4 ${color === 'blue' ? 'text-blue-400' : 'text-purple-400'}`}>{label}</h3>
            <Select value={selectedId} onValueChange={onSelect}>
                <SelectTrigger className="w-full bg-white/5 border-white/10 text-white mb-6">
                    <SelectValue placeholder="Select Player" />
                </SelectTrigger>
                <SelectContent>
                    {players.map((p: any) => (
                        <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {player && (
                <div className="space-y-4">
                    <div className={`p-4 rounded-lg border ${bgClasses}`}>
                        <p className="text-3xl font-bold text-white">{player.goals || 0} <span className="text-lg font-normal text-gray-400">Goals</span></p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-white/5">
                            <p className="text-xl font-bold text-white">{player.assists || 0}</p>
                            <p className="text-xs text-gray-400">Assists</p>
                        </div>
                        <div className="p-4 rounded-lg bg-white/5">
                            <p className="text-xl font-bold text-white">{player.minutes || 0}'</p>
                            <p className="text-xs text-gray-400">Minutes</p>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    )
}
