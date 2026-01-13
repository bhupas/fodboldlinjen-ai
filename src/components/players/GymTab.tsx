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
    DataTablePagination
} from "@/components/ui/data-table";
import { FilterPanel } from "@/components/ui/filter-panel";
import { StatCard } from "@/components/ui/stat-card";
import { ComboSelect } from "@/components/ui/combo-select";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, Dumbbell, Users, Target, TrendingUp, SlidersHorizontal } from "lucide-react";

interface GymTabProps {
    rawPerfStats: any[];
}

const ITEMS_PER_PAGE = 50;

export function GymTab({ rawPerfStats }: GymTabProps) {
    const router = useRouter();

    // Filter state
    const [gymSearch, setGymSearch] = useState("");
    const [gymPlayerFilter, setGymPlayerFilter] = useState("all");
    const [gymExerciseFilter, setGymExerciseFilter] = useState("all");
    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(1);

    // Derived data
    const gymPlayers = useMemo(() => {
        return Array.from(new Set(rawPerfStats.map(p => p.player_name))).filter(Boolean).sort();
    }, [rawPerfStats]);

    const gymExercises = useMemo(() => {
        return Array.from(new Set(rawPerfStats.map(p => p.exercise))).filter(Boolean).sort();
    }, [rawPerfStats]);

    // Filtered gym data
    const filteredGymData = useMemo(() => {
        let result = [...rawPerfStats];
        if (gymPlayerFilter !== "all") {
            result = result.filter(p => p.player_name === gymPlayerFilter);
        }
        if (gymExerciseFilter !== "all") {
            result = result.filter(p => p.exercise === gymExerciseFilter);
        }
        if (gymSearch) {
            const searchLower = gymSearch.toLowerCase();
            result = result.filter(p =>
                p.player_name?.toLowerCase().includes(searchLower) ||
                p.exercise?.toLowerCase().includes(searchLower)
            );
        }
        return result;
    }, [rawPerfStats, gymPlayerFilter, gymExerciseFilter, gymSearch]);

    const paginatedData = filteredGymData.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(filteredGymData.length / ITEMS_PER_PAGE);

    // Stats
    const bestPR = rawPerfStats.length > 0
        ? Math.max(...rawPerfStats.flatMap(p => [p.pr_1 || 0, p.pr_2 || 0, p.pr_3 || 0, p.pr_4 || 0]))
        : 0;

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Gym Sessions" value={rawPerfStats.length} icon={Dumbbell} color="yellow" />
                <StatCard title="Active Players" value={new Set(rawPerfStats.map(p => p.player_name)).size} icon={Users} color="blue" />
                <StatCard title="Unique Exercises" value={new Set(rawPerfStats.map(p => p.exercise)).size} icon={Target} color="green" />
                <StatCard title="Best PR Overall" value={`${bestPR} kg`} icon={TrendingUp} color="purple" />
            </div>

            {/* Filter Panel */}
            <FilterPanel>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        {/* Search */}
                        <div className="flex-1 relative w-full">
                            <Label className="text-xs text-muted-foreground mb-2 block">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                <Input
                                    placeholder="Filter by player or exercise..."
                                    value={gymSearch}
                                    onChange={(e) => { setGymSearch(e.target.value); setPage(1); }}
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
                            {(gymPlayerFilter !== "all" || gymExerciseFilter !== "all") && (
                                <Badge variant="secondary" className="ml-1 px-1 h-5 text-[10px]">!</Badge>
                            )}
                        </Button>
                    </div>

                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t animate-in slide-in-from-top-2 fade-in duration-200">
                            <div>
                                <Label className="text-xs text-muted-foreground mb-2 block">Player</Label>
                                <ComboSelect
                                    options={[{ label: "All Players", value: "all" }, ...gymPlayers.map(p => ({ label: p, value: p }))]}
                                    value={gymPlayerFilter}
                                    onValueChange={(val) => { setGymPlayerFilter(val); setPage(1); }}
                                    placeholder="Select player"
                                    searchPlaceholder="Type to search..."
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground mb-2 block">Exercise</Label>
                                <ComboSelect
                                    options={[{ label: "All Exercises", value: "all" }, ...gymExercises.map(e => ({ label: e, value: e }))]}
                                    value={gymExerciseFilter}
                                    onValueChange={(val) => { setGymExerciseFilter(val); setPage(1); }}
                                    placeholder="Select exercise"
                                    searchPlaceholder="Type to search..."
                                />
                            </div>
                        </div>
                    )}
                </div>
            </FilterPanel>

            {/* Results Table */}
            <Card className="glass-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Dumbbell size={20} className="text-yellow-500" />
                    Performance Records
                    <Badge className="ml-2 bg-yellow-500/10 text-yellow-500 border-yellow-500/30">{filteredGymData.length}</Badge>
                </h3>

                <div>
                    <DataTable maxHeight="400px">
                        <DataTableHeader sticky>
                            <DataTableHead>Player</DataTableHead>
                            <DataTableHead>Exercise</DataTableHead>
                            <DataTableHead className="text-right hidden md:table-cell">PR 1</DataTableHead>
                            <DataTableHead className="text-right hidden md:table-cell">PR 2</DataTableHead>
                            <DataTableHead className="text-right hidden md:table-cell">PR 3</DataTableHead>
                            <DataTableHead className="text-right hidden md:table-cell">PR 4</DataTableHead>
                            <DataTableHead className="text-right">Best</DataTableHead>
                        </DataTableHeader>
                        <DataTableBody>
                            {paginatedData.length > 0 ? (
                                paginatedData.map((row, idx) => {
                                    const best = Math.max(row.pr_1 || 0, row.pr_2 || 0, row.pr_3 || 0, row.pr_4 || 0);
                                    return (
                                        <DataTableRow key={idx} onClick={() => router.push(`/players/${row.player_name}`)}>
                                            <DataTableCell className="font-medium">{row.player_name}</DataTableCell>
                                            <DataTableCell className="text-primary font-medium">{row.exercise}</DataTableCell>
                                            <DataTableCell className="text-right text-muted-foreground font-mono hidden md:table-cell">{row.pr_1 || '-'}</DataTableCell>
                                            <DataTableCell className="text-right text-muted-foreground font-mono hidden md:table-cell">{row.pr_2 || '-'}</DataTableCell>
                                            <DataTableCell className="text-right text-muted-foreground font-mono hidden md:table-cell">{row.pr_3 || '-'}</DataTableCell>
                                            <DataTableCell className="text-right text-muted-foreground font-mono hidden md:table-cell">{row.pr_4 || '-'}</DataTableCell>
                                            <DataTableCell className="text-right">
                                                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                                                    {best} kg
                                                </Badge>
                                            </DataTableCell>
                                        </DataTableRow>
                                    );
                                })
                            ) : (
                                <DataTableEmpty colSpan={7} message="No gym performance data available." />
                            )}
                        </DataTableBody>
                    </DataTable>

                    {filteredGymData.length > ITEMS_PER_PAGE && (
                        <DataTablePagination
                            currentPage={page}
                            totalPages={totalPages}
                            pageSize={ITEMS_PER_PAGE}
                            totalItems={filteredGymData.length}
                            onPageChange={setPage}
                        />
                    )}
                </div>
            </Card>

            {/* Exercise Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {gymExercises.slice(0, 4).map(exercise => {
                    const exerciseData = rawPerfStats.filter(p => p.exercise === exercise);
                    const avgBest = exerciseData.reduce((sum, p) => {
                        const best = Math.max(p.pr_1 || 0, p.pr_2 || 0, p.pr_3 || 0, p.pr_4 || 0);
                        return sum + best;
                    }, 0) / exerciseData.length;

                    return (
                        <Card key={exercise} className="glass-card p-6">
                            <h3 className="text-lg font-bold text-foreground mb-4">{exercise}</h3>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-muted-foreground text-sm">{exerciseData.length} players</span>
                                <span className="text-yellow-500 font-bold">Avg: {avgBest.toFixed(1)} kg</span>
                            </div>
                            <div className="space-y-2">
                                {exerciseData
                                    .sort((a, b) => {
                                        const bestA = Math.max(a.pr_1 || 0, a.pr_2 || 0, a.pr_3 || 0, a.pr_4 || 0);
                                        const bestB = Math.max(b.pr_1 || 0, b.pr_2 || 0, b.pr_3 || 0, b.pr_4 || 0);
                                        return bestB - bestA;
                                    })
                                    .slice(0, 5)
                                    .map((player, idx) => {
                                        const best = Math.max(player.pr_1 || 0, player.pr_2 || 0, player.pr_3 || 0, player.pr_4 || 0);
                                        return (
                                            <div key={player.player_name} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-500 text-black' : 'bg-muted text-foreground'}`}>
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-sm">{player.player_name}</span>
                                                </div>
                                                <span className="font-mono text-yellow-500">{best} kg</span>
                                            </div>
                                        );
                                    })}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
