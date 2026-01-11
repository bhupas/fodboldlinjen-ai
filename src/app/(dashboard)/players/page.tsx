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
    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState("");
    const [minGames, setMinGames] = useState(0);
    const [minGoals, setMinGoals] = useState(0);
    const [minAssists, setMinAssists] = useState(0);
    const [sortBy, setSortBy] = useState("rating");

    useEffect(() => {
        getDashboardStats().then((data) => {
            if (data && data.allPlayers) {
                setPlayers(data.allPlayers);
            }
            setLoading(false);
        });
    }, []);

    const filteredPlayers = useMemo(() => {
        let res = [...players];

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
                case 'rating': return (b.avgPassing || 0) - (a.avgPassing || 0); // Placeholder
                case 'games': return b.games - a.games;
                case 'goals': return b.goals - a.goals;
                case 'assists': return b.assists - a.assists;
                case 'minutes': return b.minutes - a.minutes;
                case 'passing': return b.avgPassing - a.avgPassing;
                default: return 0;
            }
        });

        return res;
    }, [search, players, sortBy, minGames, minGoals, minAssists]);

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
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Search */}
                    <div className="relative flex-1">
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

                    {/* Sort */}
                    <div className="w-full md:w-48">
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
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Sliders */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-2 border-t border-white/5">
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <Label className="text-gray-300 text-xs uppercase font-bold">Min Matches</Label>
                            <span className="text-blue-400 text-xs font-mono">{minGames}</span>
                        </div>
                        <Slider
                            value={[minGames]}
                            max={20}
                            step={1}
                            onValueChange={(val) => setMinGames(val[0])}
                            className="py-2"
                        />
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <Label className="text-gray-300 text-xs uppercase font-bold">Min Goals</Label>
                            <span className="text-green-400 text-xs font-mono">{minGoals}</span>
                        </div>
                        <Slider
                            value={[minGoals]}
                            max={10}
                            step={1}
                            onValueChange={(val) => setMinGoals(val[0])}
                            className="py-2"
                        />
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <Label className="text-gray-300 text-xs uppercase font-bold">Min Assists</Label>
                            <span className="text-purple-400 text-xs font-mono">{minAssists}</span>
                        </div>
                        <Slider
                            value={[minAssists]}
                            max={10}
                            step={1}
                            onValueChange={(val) => setMinAssists(val[0])}
                            className="py-2"
                        />
                    </div>
                </div>
            </Card>

            {/* Results Table */}
            <div className="glass-panel overflow-hidden rounded-xl border border-white/10">
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
                        {filteredPlayers.length > 0 ? (
                            filteredPlayers.map((player) => (
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
                                            <div className="flex justify-end">
                                                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 flex items-center gap-1">
                                                    <Dumbbell size={12} /> {player.perfCount}
                                                </Badge>
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
