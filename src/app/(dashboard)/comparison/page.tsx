"use client";

import { useEffect, useState } from "react";
import { getDashboardStats } from "@/lib/services/dashboard";
import ComparisonRadar from "@/components/dashboard/ComparisonRadar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Swords } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { ComboSelect } from "@/components/ui/combo-select";

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

    if (loading) return <LoadingSkeleton variant="dashboard" />;

    return (
        <div className="space-y-8 relative">
            <PageHeader
                icon={Swords}
                iconColor="orange"
                title="Head-to-Head"
                description="Deep compare player performance metrics."
            />

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
                <Card className="glass-card p-6 flex flex-col items-center justify-center min-h-[400px]">
                    {player1 && player2 ? (
                        <div className="w-full">
                            <ComparisonRadar player1={player1} player2={player2} />
                            <div className="mt-6 text-center text-sm text-muted-foreground">
                                Comparison normalized against league averages
                            </div>
                        </div>
                    ) : (
                        <div className="text-muted-foreground">Select two players to compare</div>
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
                <Card className="glass-card p-6">
                    <h3 className="text-lg font-bold text-foreground mb-6">Detailed Stat Breakdown</h3>
                    <div className="grid grid-cols-3 gap-4 border-b border-border pb-2 mb-2 text-sm text-muted-foreground font-semibold uppercase tracking-wider">
                        <div className="text-blue-500 text-right">{player1.name}</div>
                        <div className="text-center text-foreground">Metric</div>
                        <div className="text-purple-500 text-left">{player2.name}</div>
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

                    {/* Dynamic Gym Stats Comparison */}
                    {getCommonExercises(player1, player2).map((ex) => (
                        <StatRow
                            key={ex.name}
                            label={`${ex.name} MAX`}
                            val1={ex.p1Max || '-'}
                            val2={ex.p2Max || '-'}
                            unit="kg"
                        />
                    ))}
                </Card>
            )}
        </div>
    );
}

function getCommonExercises(p1: any, p2: any) {
    const p1Exercises = p1.gymData || [];
    const p2Exercises = p2.gymData || [];

    const allExNames = Array.from(new Set([...p1Exercises.map((e: any) => e.exercise), ...p2Exercises.map((e: any) => e.exercise)]));

    return allExNames.map(name => {
        const p1Data = p1Exercises.find((e: any) => e.exercise === name);
        const p2Data = p2Exercises.find((e: any) => e.exercise === name);
        return {
            name,
            p1Max: p1Data ? p1Data.maxPR : null,
            p2Max: p2Data ? p2Data.maxPR : null
        };
    }).filter(e => e.p1Max !== null || e.p2Max !== null);
}

interface StatRowProps {
    label: string;
    val1: string | number;
    val2: string | number;
    unit: string;
    highlight?: boolean;
}

function StatRow({ label, val1, val2, unit, highlight }: StatRowProps) {
    const isV1Num = typeof val1 === 'number';
    const isV2Num = typeof val2 === 'number';
    let win1 = false;
    let win2 = false;

    if (isV1Num && isV2Num) {
        win1 = val1 > val2;
        win2 = val2 > val1;
    }

    return (
        <div className={`grid grid-cols-3 gap-2 md:gap-4 py-3 border-b border-border hover:bg-accent/50 transition-colors ${highlight ? 'bg-accent/30' : ''}`}>
            <div className={`text-right font-mono text-xs md:text-base ${win1 ? 'text-blue-500 font-bold' : 'text-foreground'}`}>{val1}{unit}</div>
            <div className="text-center text-muted-foreground text-[10px] md:text-sm flex items-center justify-center">{label}</div>
            <div className={`text-left font-mono text-xs md:text-base ${win2 ? 'text-purple-500 font-bold' : 'text-foreground'}`}>{val2}{unit}</div>
        </div>
    )
}

interface PlayerCardProps {
    player: any;
    players: any[];
    selectedId: string;
    onSelect: (id: string) => void;
    color: 'blue' | 'purple';
    label: string;
}

function PlayerCard({ player, players, selectedId, onSelect, color, label }: PlayerCardProps) {
    const colorClasses = color === 'blue' ? 'border-blue-500/30' : 'border-purple-500/30';
    const textColor = color === 'blue' ? 'text-blue-500' : 'text-purple-500';
    const bgClasses = color === 'blue' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-purple-500/10 border-purple-500/20';

    const options = players.map((p: any) => ({
        label: p.name,
        value: p.name
    }));

    return (
        <Card className={`glass-card p-6 ${colorClasses} border`}>
            <h3 className={`text-sm font-medium mb-4 ${textColor}`}>{label}</h3>

            <ComboSelect
                options={options}
                value={selectedId}
                onValueChange={onSelect}
                placeholder="Select Player"
                searchPlaceholder="Search players..."
                className="mb-6"
            />

            {player && (
                <div className="space-y-4">
                    <div className={`p-4 rounded-xl border ${bgClasses}`}>
                        <p className="text-3xl font-bold text-foreground">{player.goals || 0} <span className="text-lg font-normal text-muted-foreground">Goals</span></p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-muted">
                            <p className="text-xl font-bold text-foreground">{player.assists || 0}</p>
                            <p className="text-xs text-muted-foreground">Assists</p>
                        </div>
                        <div className="p-4 rounded-xl bg-muted">
                            <p className="text-xl font-bold text-foreground">{player.minutes || 0}'</p>
                            <p className="text-xs text-muted-foreground">Minutes</p>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    )
}
