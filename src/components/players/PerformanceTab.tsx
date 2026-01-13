"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    DataTable,
    DataTableHeader,
    DataTableHead,
    DataTableBody,
    DataTableRow,
    DataTableCell,
    DataTableEmpty,
    DataTablePagination,
    useSorting
} from "@/components/ui/data-table";
import { FilterPanel } from "@/components/ui/filter-panel";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Search, Users, Target, Sparkles, TrendingUp, SlidersHorizontal, Ban } from "lucide-react";

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
    age: number | null;
}

interface PerformanceTabProps {
    rawMatchStats: any[];
    aggregatedPlayers: PlayerData[];
    uniqueOpponents: string[];
}

const ITEMS_PER_PAGE = 50;

export function PerformanceTab({ rawMatchStats, aggregatedPlayers, uniqueOpponents }: PerformanceTabProps) {
    const router = useRouter();

    // Filter state
    const [search, setSearch] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [minGames, setMinGames] = useState(0);
    const [minGoals, setMinGoals] = useState(0);
    const [minAssists, setMinAssists] = useState(0);
    const [page, setPage] = useState(1);

    // Sorting hook
    const { sortConfig, handleSort, sortData } = useSorting('avgPassing', 'desc');

    // Filtered players
    const filteredPlayers = useMemo(() => {
        let res = [...aggregatedPlayers];

        if (search) {
            res = res.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
        }
        if (minGames > 0) res = res.filter(p => p.games >= minGames);
        if (minGoals > 0) res = res.filter(p => p.goals >= minGoals);
        if (minAssists > 0) res = res.filter(p => p.assists >= minAssists);

        return res;
    }, [aggregatedPlayers, search, minGames, minGoals, minAssists]);

    // Apply sorting
    const sortedPlayers = useMemo(() => sortData(filteredPlayers), [filteredPlayers, sortData]);

    const paginatedPlayers = sortedPlayers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(sortedPlayers.length / ITEMS_PER_PAGE);

    // Reset page when filters change
    const handleFilterChange = () => setPage(1);

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Players" value={aggregatedPlayers.length} icon={Users} color="blue" />
                <StatCard title="Total Matches" value={rawMatchStats.length} icon={Target} color="green" />
                <StatCard title="Total Goals" value={aggregatedPlayers.reduce((sum, p) => sum + p.goals, 0)} icon={Sparkles} color="purple" />
                <StatCard
                    title="Avg. Passing %"
                    value={`${(aggregatedPlayers.reduce((sum, p) => sum + p.avgPassing, 0) / Math.max(aggregatedPlayers.length, 1)).toFixed(1)}%`}
                    icon={TrendingUp}
                    color="yellow"
                />
            </div>

            {/* Filter Panel */}
            <FilterPanel>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        {/* Search */}
                        <div className="flex-1 relative w-full">
                            <Label className="text-xs text-muted-foreground mb-2 block">Search Player</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                <Input
                                    placeholder="Filter by name..."
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); handleFilterChange(); }}
                                    className="pl-9 h-10"
                                />
                            </div>
                        </div>

                        <Button
                            variant={showFilters ? "secondary" : "outline"}
                            className="gap-2 h-10"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <SlidersHorizontal size={16} />
                            Filters
                            {(minGames > 0 || minGoals > 0 || minAssists > 0) && (
                                <Badge variant="secondary" className="ml-1 px-1 h-5 text-[10px]">!</Badge>
                            )}
                        </Button>
                    </div>

                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t animate-in slide-in-from-top-2 fade-in duration-200">
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label className="text-muted-foreground text-xs uppercase font-bold">Min Matches</Label>
                                    <span className="text-primary text-xs font-mono">{minGames}</span>
                                </div>
                                <Slider value={[minGames]} max={20} step={1} onValueChange={(val) => { setMinGames(val[0]); handleFilterChange(); }} className="py-2" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label className="text-muted-foreground text-xs uppercase font-bold">Min Goals</Label>
                                    <span className="text-green-500 text-xs font-mono">{minGoals}</span>
                                </div>
                                <Slider value={[minGoals]} max={10} step={1} onValueChange={(val) => { setMinGoals(val[0]); handleFilterChange(); }} className="py-2" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label className="text-muted-foreground text-xs uppercase font-bold">Min Assists</Label>
                                    <span className="text-purple-500 text-xs font-mono">{minAssists}</span>
                                </div>
                                <Slider value={[minAssists]} max={10} step={1} onValueChange={(val) => { setMinAssists(val[0]); handleFilterChange(); }} className="py-2" />
                            </div>
                        </div>
                    )}
                </div>
            </FilterPanel>

            {/* Results Table */}
            <div>
                <DataTable fullHeight>
                    <DataTableHeader sticky>
                        <DataTableHead sortable sortKey="name" sortConfig={sortConfig} onSort={handleSort}>Player</DataTableHead>
                        <DataTableHead className="hidden md:table-cell">Age</DataTableHead>
                        <DataTableHead className="text-right" sortable sortKey="games" sortConfig={sortConfig} onSort={handleSort}>Matches</DataTableHead>
                        <DataTableHead className="text-right hidden lg:table-cell" sortable sortKey="minutes" sortConfig={sortConfig} onSort={handleSort}>Mins</DataTableHead>
                        <DataTableHead className="text-right" sortable sortKey="goals" sortConfig={sortConfig} onSort={handleSort}>Goals</DataTableHead>
                        <DataTableHead className="text-right hidden sm:table-cell" sortable sortKey="assists" sortConfig={sortConfig} onSort={handleSort}>Assists</DataTableHead>
                        <DataTableHead className="text-right hidden md:table-cell" sortable sortKey="avgPassing" sortConfig={sortConfig} onSort={handleSort}>Passing</DataTableHead>
                        <DataTableHead className="text-right hidden lg:table-cell" sortable sortKey="totalTackles" sortConfig={sortConfig} onSort={handleSort}>Tackles</DataTableHead>
                        <DataTableHead className="text-right hidden lg:table-cell">Cards</DataTableHead>
                    </DataTableHeader>
                    <DataTableBody>
                        {paginatedPlayers.length > 0 ? (
                            paginatedPlayers.map((player) => (
                                <DataTableRow key={player.name} onClick={() => router.push(`/players/${player.name}?from=players`)}>
                                    <DataTableCell className="font-medium">{player.name}</DataTableCell>
                                    <DataTableCell className="hidden md:table-cell">
                                        {player.age ? (
                                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30 text-xs font-mono">{player.age} yo</Badge>
                                        ) : (
                                            <span className="text-xs text-muted-foreground/30 flex items-center gap-1"><Ban size={10} /> -</span>
                                        )}
                                    </DataTableCell>
                                    <DataTableCell className="text-right text-muted-foreground font-mono">{player.games}</DataTableCell>
                                    <DataTableCell className="text-right text-muted-foreground font-mono hidden lg:table-cell">{player.minutes}&apos;</DataTableCell>
                                    <DataTableCell className="text-right">
                                        {player.goals > 0 ? (
                                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">{player.goals} ⚽</Badge>
                                        ) : <span className="text-muted-foreground/50">-</span>}
                                    </DataTableCell>
                                    <DataTableCell className="text-right hidden sm:table-cell">
                                        {player.assists > 0 ? (
                                            <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30">{player.assists} 👟</Badge>
                                        ) : <span className="text-muted-foreground/50">-</span>}
                                    </DataTableCell>
                                    <DataTableCell className="text-right hidden md:table-cell">
                                        <span className={`${player.avgPassing >= 80 ? 'text-green-500' : player.avgPassing >= 70 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                                            {player.avgPassing.toFixed(1)}%
                                        </span>
                                    </DataTableCell>
                                    <DataTableCell className="text-right text-muted-foreground hidden lg:table-cell">{player.totalTackles}</DataTableCell>
                                    <DataTableCell className="text-right hidden lg:table-cell">
                                        <div className="flex justify-end gap-1">
                                            {player.yellowCards > 0 && <span className="w-3 h-4 bg-yellow-500 rounded-sm inline-block" />}
                                            {player.redCards > 0 && <span className="w-3 h-4 bg-red-500 rounded-sm inline-block" />}
                                            {player.yellowCards === 0 && player.redCards === 0 && <span className="text-muted-foreground/50">-</span>}
                                        </div>
                                    </DataTableCell>
                                </DataTableRow>
                            ))
                        ) : (
                            <DataTableEmpty colSpan={9} message="No players match your filters." />
                        )}
                    </DataTableBody>
                </DataTable>

                {sortedPlayers.length > 0 && (
                    <Card className="glass-card mt-0 rounded-t-none border-t-0">
                        <DataTablePagination
                            currentPage={page}
                            totalPages={totalPages}
                            pageSize={ITEMS_PER_PAGE}
                            totalItems={sortedPlayers.length}
                            onPageChange={setPage}
                        />
                    </Card>
                )}
            </div>
        </div>
    );
}
