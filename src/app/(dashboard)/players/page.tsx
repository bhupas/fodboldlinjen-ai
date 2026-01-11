"use client";

import { useRouter } from "next/navigation";

import { useEffect, useState, useMemo } from "react";
import { getDashboardStats } from "@/lib/services/dashboard";
import {
    DataTable,
    DataTableHeader,
    DataTableHead,
    DataTableBody,
    DataTableRow,
    DataTableCell,
    DataTableEmpty,
    DataTableLoading
} from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { ComboSelect } from "@/components/ui/combo-select";
import { FilterPanel, FilterRow, FilterSection } from "@/components/ui/filter-panel";
import { PageHeader } from "@/components/ui/page-header";
import { CountBadge } from "@/components/ui/stats-display";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Search, Users, Dumbbell, Download, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function PlayerStatsPage() {
    const [rawMatchStats, setRawMatchStats] = useState<any[]>([]);
    const [rawPerfStats, setRawPerfStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Filters
    const [search, setSearch] = useState("");
    const [minGames, setMinGames] = useState(0);
    const [minGoals, setMinGoals] = useState(0);
    const [minAssists, setMinAssists] = useState(0);
    const [ageRange, setAgeRange] = useState<[number, number]>([0, 99]);
    const [sortBy, setSortBy] = useState("rating");

    // Profile Map for Age
    const [profiles, setProfiles] = useState<any[]>([]);

    // New Filters
    const [opponentFilter, setOpponentFilter] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Pagination
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    useEffect(() => {
        const fetchData = async () => {
            const { getRawStats } = await import("@/lib/services/dashboard");
            const { getAllProfiles } = await import("@/lib/services/profiles");

            const [statsData, profilesData] = await Promise.all([
                getRawStats(),
                getAllProfiles()
            ]);

            setRawMatchStats(statsData.matchStats);
            setRawPerfStats(statsData.perfStats);
            setProfiles(profilesData);
            setLoading(false);
        };

        fetchData();
    }, []);

    const uniqueOpponents = useMemo(() => {
        const opps = new Set(rawMatchStats.map(m => m.opponent));
        return Array.from(opps).filter(Boolean).sort();
    }, [rawMatchStats]);

    const aggregatedPlayers = useMemo(() => {
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

        const playerMap = new Map();

        filteredStats.forEach(s => {
            const cleanName = s.player_name ? s.player_name.trim() : "Unknown";

            if (!playerMap.has(cleanName)) {
                playerMap.set(cleanName, {
                    name: cleanName,
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
            const p = playerMap.get(cleanName);
            p.games++;
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

        const gymMap = new Map();
        rawPerfStats.forEach(p => {
            const cleanName = p.player_name ? p.player_name.trim() : "Unknown";
            if (!gymMap.has(cleanName)) gymMap.set(cleanName, []);
            const maxPR = Math.max(p.pr_1 || 0, p.pr_2 || 0, p.pr_3 || 0, p.pr_4 || 0);
            gymMap.get(cleanName).push({ exercise: p.exercise, maxPR });
        });

        let players = Array.from(playerMap.values()).map(p => {
            const gymData = gymMap.get(p.name) || [];

            // Calculate Age
            const profile = profiles.find((prof: any) => {
                const fullName = `${prof.first_name || ''} ${prof.last_name || ''}`.trim();
                return fullName.toLowerCase() === p.name.toLowerCase() ||
                    (prof.first_name && prof.first_name.toLowerCase() === p.name.toLowerCase());
            });

            let age = null;
            if (profile && profile.date_of_birth) {
                const dob = new Date(profile.date_of_birth);
                const diff = Date.now() - dob.getTime();
                age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
            }

            return {
                ...p,
                avgPassing: p.games > 0 ? p.avgPassing / p.games : 0,
                gymData: gymData,
                perfCount: gymData.length,
                maxGymPR: gymData.length > 0 ? Math.max(...gymData.map((d: any) => d.maxPR)) : 0,
                age
            };
        });

        return players;
    }, [rawMatchStats, rawPerfStats, opponentFilter, startDate, endDate, profiles]);

    const filteredPlayers = useMemo(() => {
        let res = [...aggregatedPlayers];

        if (search) {
            res = res.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
        }
        if (minGames > 0) res = res.filter(p => p.games >= minGames);
        if (minGoals > 0) res = res.filter(p => p.goals >= minGoals);
        if (minAssists > 0) res = res.filter(p => p.assists >= minAssists);

        // Age Filter
        if (ageRange[0] > 0 || ageRange[1] < 99) {
            res = res.filter(p => p.age !== null && p.age >= ageRange[0] && p.age <= ageRange[1]);
        }

        res.sort((a, b) => {
            switch (sortBy) {
                case 'rating': return (b.avgPassing || 0) - (a.avgPassing || 0);
                case 'games': return b.games - a.games;
                case 'goals': return b.goals - a.goals;
                case 'assists': return b.assists - a.assists;
                case 'minutes': return b.minutes - a.minutes;
                case 'passing': return b.avgPassing - a.avgPassing;
                case 'gym': return b.maxGymPR - a.maxGymPR;
                case 'age': return (b.age || 0) - (a.age || 0);
                default: return 0;
            }
        });

        return res;
    }, [aggregatedPlayers, search, sortBy, minGames, minGoals, minAssists]);

    useEffect(() => {
        setPage(1);
    }, [search, minGames, minGoals, minAssists, sortBy, opponentFilter, startDate, endDate, ageRange]);

    const paginatedPlayers = filteredPlayers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(filteredPlayers.length / ITEMS_PER_PAGE);

    const playerOptions = aggregatedPlayers
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(p => ({ label: p.name, value: p.name }));

    const opponentOptions = uniqueOpponents.map(o => ({ label: o, value: o }));

    // Export Functionality
    const handleExport = () => {
        const headers = ["Player", "Age", "Matches", "Minutes", "Goals", "Assists", "Passing %", "Tackles", "Yellow Cards", "Red Cards", "Gym Sessions", "Best PR"];
        const rows = filteredPlayers.map(p => [
            p.name,
            p.age || "N/A",
            p.games,
            p.minutes,
            p.goals,
            p.assists,
            p.avgPassing.toFixed(2),
            p.totalTackles,
            p.yellowCards,
            p.redCards,
            p.perfCount,
            p.maxGymPR
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `player_analysis_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <LoadingSkeleton variant="table" />;

    return (
        <div className="space-y-8">
            <PageHeader
                icon={Users}
                iconColor="blue"
                title="Player Analysis"
                description="Detailed performance metrics across the squad"
                badge={<CountBadge count={filteredPlayers.length} label="Players Found" />}
                actions={
                    <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
                        <Download size={14} />
                        Export CSV
                    </Button>
                }
            />

            {/* Filter Panel */}
            <FilterPanel>
                <FilterRow>
                    {/* Search */}
                    <div className="relative">
                        <Label className="text-xs text-muted-foreground mb-2 block">Search Player</Label>
                        <ComboSelect
                            options={playerOptions}
                            value={search}
                            onValueChange={setSearch}
                            placeholder="Select player"
                            searchPlaceholder="Type to search..."
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="text-xs text-destructive mt-1 hover:underline text-right w-full block">Clear</button>
                        )}
                    </div>

                    {/* Opponent Filter */}
                    <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">Opposition</Label>
                        <ComboSelect
                            options={[{ label: "All Opponents", value: "all" }, ...opponentOptions]}
                            value={opponentFilter || "all"}
                            onValueChange={(val) => setOpponentFilter(val === "all" ? "" : val)}
                            placeholder="Select opponent"
                            searchPlaceholder="Type to search..."
                        />
                        {opponentFilter && (
                            <button onClick={() => setOpponentFilter('')} className="text-xs text-destructive mt-1 hover:underline">Clear</button>
                        )}
                    </div>

                    {/* Date Range */}
                    <div className="col-span-1 md:col-span-2 flex gap-4">
                        <div className="flex-1">
                            <Label className="text-xs text-muted-foreground mb-2 block">Start Date</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-10"
                            />
                        </div>
                        <div className="flex-1">
                            <Label className="text-xs text-muted-foreground mb-2 block">End Date</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-10"
                            />
                        </div>
                    </div>
                </FilterRow>

                <FilterSection separator>
                    {/* Sort */}
                    <div className="w-full md:w-64">
                        <Label className="text-xs text-muted-foreground mb-2 block">Sort By</Label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="h-10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="rating">🔥 Performance</SelectItem>
                                <SelectItem value="games">📅 Matches</SelectItem>
                                <SelectItem value="goals">⚽ Goals</SelectItem>
                                <SelectItem value="assists">👟 Assists</SelectItem>
                                <SelectItem value="passing">🎯 Passing %</SelectItem>
                                <SelectItem value="minutes">⏱ Minutes</SelectItem>
                                <SelectItem value="gym">🏋️ Gym (Max PR)</SelectItem>
                                <SelectItem value="age">🎂 Age</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sliders Area */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <Label className="text-muted-foreground text-xs uppercase font-bold">Min Matches</Label>
                                <span className="text-primary text-xs font-mono">{minGames}</span>
                            </div>
                            <Slider value={[minGames]} max={20} step={1} onValueChange={(val) => setMinGames(val[0])} className="py-2" />
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <Label className="text-muted-foreground text-xs uppercase font-bold">Min Goals</Label>
                                <span className="text-green-500 text-xs font-mono">{minGoals}</span>
                            </div>
                            <Slider value={[minGoals]} max={10} step={1} onValueChange={(val) => setMinGoals(val[0])} className="py-2" />
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <Label className="text-muted-foreground text-xs uppercase font-bold">Min Assists</Label>
                                <span className="text-purple-500 text-xs font-mono">{minAssists}</span>
                            </div>
                            <Slider value={[minAssists]} max={10} step={1} onValueChange={(val) => setMinAssists(val[0])} className="py-2" />
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <Label className="text-muted-foreground text-xs uppercase font-bold">Age Range: {ageRange[0]} - {ageRange[1]}</Label>
                                <span className="text-blue-500 text-xs font-mono">{ageRange[0]}-{ageRange[1]}</span>
                            </div>
                            <Slider
                                value={ageRange}
                                max={40}
                                min={10}
                                step={1}
                                onValueChange={(val: any) => setAgeRange(val)}
                                className="py-2"
                            />
                        </div>
                    </div>
                </FilterSection>
            </FilterPanel>

            {/* Results Table */}
            <div className="overflow-x-auto">
                <DataTable>
                    <DataTableHeader>
                        <DataTableHead>Player</DataTableHead>
                        <DataTableHead>Age</DataTableHead>
                        <DataTableHead className="text-right">Matches</DataTableHead>
                        <DataTableHead className="text-right">Mins</DataTableHead>
                        <DataTableHead className="text-right">Goals</DataTableHead>
                        <DataTableHead className="text-right">Assists</DataTableHead>
                        <DataTableHead className="text-right">Passing</DataTableHead>
                        <DataTableHead className="text-right">Tackles</DataTableHead>
                        <DataTableHead className="text-right">Cards</DataTableHead>
                        <DataTableHead className="text-right">Gym</DataTableHead>
                    </DataTableHeader>
                    <DataTableBody>
                        {paginatedPlayers.length > 0 ? (
                            paginatedPlayers.map((player) => (
                                <DataTableRow
                                    key={player.name}
                                    onClick={() => router.push(`/players/${player.name}`)}
                                >
                                    <DataTableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span className="text-base group-hover:text-primary transition-colors">{player.name}</span>
                                        </div>
                                    </DataTableCell>
                                    <DataTableCell>
                                        {player.age ? (
                                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30 text-xs font-mono">
                                                {player.age} yo
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-muted-foreground/30 flex items-center gap-1" title="No DOB found"><Ban size={10} /> -</span>
                                        )}
                                    </DataTableCell>
                                    <DataTableCell className="text-right text-muted-foreground font-mono">{player.games}</DataTableCell>
                                    <DataTableCell className="text-right text-muted-foreground font-mono">
                                        {player.minutes}&apos;
                                    </DataTableCell>
                                    <DataTableCell className="text-right">
                                        {player.goals > 0 && (
                                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500/20">
                                                {player.goals} ⚽
                                            </Badge>
                                        )}
                                        {player.goals === 0 && <span className="text-muted-foreground/50">-</span>}
                                    </DataTableCell>
                                    <DataTableCell className="text-right">
                                        {player.assists > 0 && (
                                            <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30 hover:bg-purple-500/20">
                                                {player.assists} 👟
                                            </Badge>
                                        )}
                                        {player.assists === 0 && <span className="text-muted-foreground/50">-</span>}
                                    </DataTableCell>
                                    <DataTableCell className="text-right">
                                        <span className={`${player.avgPassing >= 80 ? 'text-green-500' : player.avgPassing >= 70 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                                            {player.avgPassing.toFixed(1)}%
                                        </span>
                                    </DataTableCell>
                                    <DataTableCell className="text-right text-muted-foreground">{player.totalTackles}</DataTableCell>
                                    <DataTableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            {player.yellowCards > 0 && <span className="w-3 h-4 bg-yellow-500 rounded-sm inline-block" title={`${player.yellowCards} Yellow`} />}
                                            {player.redCards > 0 && <span className="w-3 h-4 bg-red-500 rounded-sm inline-block" title={`${player.redCards} Red`} />}
                                            {player.yellowCards === 0 && player.redCards === 0 && <span className="text-muted-foreground/50">-</span>}
                                        </div>
                                    </DataTableCell>
                                    <DataTableCell className="text-right">
                                        {player.perfCount > 0 ? (
                                            <div className="flex flex-col items-end gap-1">
                                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 flex items-center gap-1">
                                                    <Dumbbell size={12} /> {player.perfCount}
                                                </Badge>
                                                {player.gymData && player.gymData.length > 0 && (
                                                    <span className="text-[10px] text-muted-foreground">
                                                        Best: {Math.max(...player.gymData.map((d: any) => d.maxPR))} kg
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground/50">-</span>
                                        )}
                                    </DataTableCell>
                                </DataTableRow>
                            ))
                        ) : (
                            <DataTableEmpty colSpan={9} message="No players match your filters." />
                        )}
                    </DataTableBody>
                </DataTable>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                    <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </Button>
                    <span className="text-muted-foreground text-sm">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
