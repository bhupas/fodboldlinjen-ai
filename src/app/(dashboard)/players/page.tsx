"use client";

import { useEffect, useState, useMemo } from "react";
import { getDashboardStats } from "@/lib/services/dashboard";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Search, Filter, Trophy, Footprints, Target, Shield, Clock, Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

export default function PlayerStatsPage() {
    const [rawMatchStats, setRawMatchStats] = useState<any[]>([]);
    const [rawPerfStats, setRawPerfStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState("");
    const [minGames, setMinGames] = useState(0);
    const [minGoals, setMinGoals] = useState(0);
    const [minAssists, setMinAssists] = useState(0);
    const [sortBy, setSortBy] = useState("rating");

    // New Filters
    const [opponentFilter, setOpponentFilter] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Pagination
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    useEffect(() => {
        // Fetch raw data for client-side aggregation
        import("@/lib/services/dashboard").then(mod => {
            mod.getRawStats().then((data) => {
                setRawMatchStats(data.matchStats);
                setRawPerfStats(data.perfStats);
                setLoading(false);
            });
        });
    }, []);

    const uniqueOpponents = useMemo(() => {
        const opps = new Set(rawMatchStats.map(m => m.opponent));
        return Array.from(opps).filter(Boolean).sort();
    }, [rawMatchStats]);

    const aggregatedPlayers = useMemo(() => {
        // 1. Filter Raw Stats
        let filteredStats = rawMatchStats;

        if (opponentFilter) {
            filteredStats = filteredStats.filter(s => s.opponent === opponentFilter);
        }
        if (startDate) {
            filteredStats = filteredStats.filter(s => new Date(s.date) >= new Date(startDate));
        }
        if (endDate) {
            filteredStats = filteredStats.filter(s => new Date(s.date) <= new Date(endDate));
        }

        // 2. Aggregate
        const playerMap = new Map();

        filteredStats.forEach(s => {
            if (!playerMap.has(s.player_name)) {
                playerMap.set(s.player_name, {
                    name: s.player_name,
                    games: 0,
                    avgPassing: 0,
                    totalShots: 0,
                    totalTackles: 0,
                    goals: 0,
                    assists: 0,
                    minutes: 0,
                    yellowCards: 0,
                    redCards: 0,
                    perfCount: 0,
                    gymData: []
                });
            }
            const p = playerMap.get(s.player_name);
            p.games++;
            // Calculate passing accuracy if not available
            const passAcc = (s.total_passes && s.successful_passes)
                ? (s.successful_passes / s.total_passes) * 100
                : (s.passing_accuracy || 0);

            p.avgPassing += passAcc;
            p.totalShots += (s.total_shots || 0);
            p.totalTackles += (s.total_tackles || 0);
            p.goals += (s.goals || 0);
            p.assists += (s.assists || 0);
            p.minutes += (s.minutes_played || 0);
            p.yellowCards += (s.yellow_cards || 0);
            p.redCards += (s.red_cards || 0);
        });

        // 3. Attach Gym Data (Gym data is usually global, not per-match, so we attach unfiltered unless date on perf stats?)
        // Assuming perf stats are global for now as they don't have dates in the current view usually
        const gymMap = new Map();
        rawPerfStats.forEach(p => {
            if (!gymMap.has(p.player_name)) gymMap.set(p.player_name, []);
            const maxPR = Math.max(p.pr_1 || 0, p.pr_2 || 0, p.pr_3 || 0, p.pr_4 || 0);
            gymMap.get(p.player_name).push({ exercise: p.exercise, maxPR });
        });

        // 4. Finalize List
        let players = Array.from(playerMap.values()).map(p => {
            const gymData = gymMap.get(p.name) || [];
            return {
                ...p,
                avgPassing: p.games > 0 ? p.avgPassing / p.games : 0,
                gymData: gymData,
                perfCount: gymData.length,
                maxGymPR: gymData.length > 0 ? Math.max(...gymData.map((d: any) => d.maxPR)) : 0
            };
        });

        // Add players who have gym data but no match data if filters are clear? 
        // Or strictly stats from the filtered matches?
        // User behavior: if I filter by opponent, I likely only want players who played.

        return players;

    }, [rawMatchStats, rawPerfStats, opponentFilter, startDate, endDate]);

    const filteredPlayers = useMemo(() => {
        let res = [...aggregatedPlayers];

        // Text Search
        if (search) {
            res = res.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
        }

        // Numeric Filters
        if (minGames > 0) res = res.filter(p => p.games >= minGames);
        if (minGoals > 0) res = res.filter(p => p.goals >= minGoals);
        if (minAssists > 0) res = res.filter(p => p.assists >= minAssists);

        // Sorting
        res.sort((a, b) => {
            switch (sortBy) {
                case 'rating': return (b.avgPassing || 0) - (a.avgPassing || 0);
                case 'games': return b.games - a.games;
                case 'goals': return b.goals - a.goals;
                case 'assists': return b.assists - a.assists;
                case 'minutes': return b.minutes - a.minutes;
                case 'passing': return b.avgPassing - a.avgPassing;
                case 'gym': return b.maxGymPR - a.maxGymPR;
                default: return 0;
            }
        });

        return res;
    }, [aggregatedPlayers, search, sortBy, minGames, minGoals, minAssists]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [search, minGames, minGoals, minAssists, sortBy, opponentFilter, startDate, endDate]);

    const paginatedPlayers = filteredPlayers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(filteredPlayers.length / ITEMS_PER_PAGE);

    if (loading) return <div className="text-white">Loading player data...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <UsersIcon /> Player Analysis
                    </h1>
                    <p className="text-gray-400">Detailed performance metrics across the squad.</p>
                </div>
                <div className="bg-white/5 rounded-full px-4 py-1 text-sm text-blue-300 border border-white/10">
                    {filteredPlayers.length} Players Found
                </div>
            </div>

            {/* Filter Panel */}
            <Card className="glass-panel border-0 p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Search */}
                    <div className="relative">
                        <Label className="text-xs text-gray-400 mb-2 block">Search Player</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
                            <Input
                                placeholder="Name..."
                                className="pl-10 bg-black/20 border-white/10 text-white h-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Opponent Filter */}
                    <div>
                        <Label className="text-xs text-gray-400 mb-2 block">Opposition</Label>
                        <Select value={opponentFilter} onValueChange={setOpponentFilter}>
                            <SelectTrigger className="bg-black/20 border-white/10 text-white h-10">
                                <SelectValue placeholder="All Opponents" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                                <SelectItem value="all">All Opponents</SelectItem>
                                {uniqueOpponents.map(opp => (
                                    <SelectItem key={opp} value={opp}>{opp}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {opponentFilter && opponentFilter !== 'all' && (
                            <button onClick={() => setOpponentFilter('')} className="text-xs text-red-400 mt-1 hover:underline">Clear</button>
                        )}
                    </div>

                    {/* Date Range */}
                    <div className="col-span-1 md:col-span-2 flex gap-4">
                        <div className="flex-1">
                            <Label className="text-xs text-gray-400 mb-2 block">Start Date</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-black/20 border-white/10 text-white h-10"
                            />
                        </div>
                        <div className="flex-1">
                            <Label className="text-xs text-gray-400 mb-2 block">End Date</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-black/20 border-white/10 text-white h-10"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 pt-4 border-t border-white/5">
                    {/* Sort */}
                    <div className="w-full md:w-64">
                        <Label className="text-xs text-gray-400 mb-2 block">Sort By</Label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="bg-black/20 border-white/10 text-white h-10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                                <SelectItem value="rating">🔥 Performance</SelectItem>
                                <SelectItem value="games">📅 Matches</SelectItem>
                                <SelectItem value="goals">⚽ Goals</SelectItem>
                                <SelectItem value="assists">👟 Assists</SelectItem>
                                <SelectItem value="passing">🎯 Passing %</SelectItem>
                                <SelectItem value="minutes">⏱ Minutes</SelectItem>
                                <SelectItem value="gym">🏋️ Gym (Max PR)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sliders Area */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <Label className="text-gray-300 text-xs uppercase font-bold">Min Matches</Label>
                                <span className="text-blue-400 text-xs font-mono">{minGames}</span>
                            </div>
                            <Slider value={[minGames]} max={20} step={1} onValueChange={(val) => setMinGames(val[0])} className="py-2" />
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <Label className="text-gray-300 text-xs uppercase font-bold">Min Goals</Label>
                                <span className="text-green-400 text-xs font-mono">{minGoals}</span>
                            </div>
                            <Slider value={[minGoals]} max={10} step={1} onValueChange={(val) => setMinGoals(val[0])} className="py-2" />
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <Label className="text-gray-300 text-xs uppercase font-bold">Min Assists</Label>
                                <span className="text-purple-400 text-xs font-mono">{minAssists}</span>
                            </div>
                            <Slider value={[minAssists]} max={10} step={1} onValueChange={(val) => setMinAssists(val[0])} className="py-2" />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Results Table */}
            <div className="glass-panel overflow-hidden rounded-xl border border-white/10 overflow-x-auto">
                <Table>
                    <TableHeader className="bg-black/40">
                        <TableRow className="border-white/10 hover:bg-transparent">
                            <TableHead className="text-gray-300">Player</TableHead>
                            <TableHead className="text-right text-gray-300">Matches</TableHead>
                            <TableHead className="text-right text-gray-300">Mins</TableHead>
                            <TableHead className="text-right text-gray-300">Goals</TableHead>
                            <TableHead className="text-right text-gray-300">Assists</TableHead>
                            <TableHead className="text-right text-gray-300">Passing</TableHead>
                            <TableHead className="text-right text-gray-300">Tackles</TableHead>
                            <TableHead className="text-right text-gray-300">Cards</TableHead>
                            <TableHead className="text-right text-gray-300">Gym</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedPlayers.length > 0 ? (
                            paginatedPlayers.map((player) => (
                                <TableRow
                                    key={player.name}
                                    className="border-white/5 hover:bg-white/5 transition-colors group cursor-pointer"
                                    onClick={() => window.location.href = `/players/${player.name}`}
                                >
                                    <TableCell className="font-medium text-white">
                                        <div className="flex flex-col">
                                            <span className="text-base group-hover:text-blue-300 transition-colors">{player.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right text-gray-300 font-mono">{player.games}</TableCell>
                                    <TableCell className="text-right text-gray-300 font-mono">
                                        {player.minutes}'
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {player.goals > 0 && (
                                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20">
                                                {player.goals} ⚽
                                            </Badge>
                                        )}
                                        {player.goals === 0 && <span className="text-gray-600">-</span>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {player.assists > 0 && (
                                            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20">
                                                {player.assists} 👟
                                            </Badge>
                                        )}
                                        {player.assists === 0 && <span className="text-gray-600">-</span>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={`${player.avgPassing >= 80 ? 'text-green-400' : player.avgPassing >= 70 ? 'text-yellow-400' : 'text-gray-400'}`}>
                                            {player.avgPassing.toFixed(1)}%
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right text-gray-400">{player.totalTackles}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            {player.yellowCards > 0 && <span className="w-3 h-4 bg-yellow-500 rounded-sm inline-block" title={`${player.yellowCards} Yellow`} />}
                                            {player.redCards > 0 && <span className="w-3 h-4 bg-red-500 rounded-sm inline-block" title={`${player.redCards} Red`} />}
                                            {player.yellowCards === 0 && player.redCards === 0 && <span className="text-gray-700">-</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {player.perfCount > 0 ? (
                                            <div className="flex flex-col items-end gap-1">
                                                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 flex items-center gap-1">
                                                    <Dumbbell size={12} /> {player.perfCount}
                                                </Badge>
                                                {player.gymData && player.gymData.length > 0 && (
                                                    <span className="text-[10px] text-gray-400">
                                                        Best: {Math.max(...player.gymData.map((d: any) => d.maxPR))} kg
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-600">-</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={9} className="h-32 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <Search size={32} className="mb-2 opacity-50" />
                                        <p>No players match your filters.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 px-4 rounded bg-white/5 border border-white/10 text-white disabled:opacity-50 hover:bg-white/10"
                    >
                        Previous
                    </button>
                    <span className="text-gray-400 text-sm">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 px-4 rounded bg-white/5 border border-white/10 text-white disabled:opacity-50 hover:bg-white/10"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

function UsersIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-blue-400"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}
