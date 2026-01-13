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
import { ComboSelect } from "@/components/ui/combo-select";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Dumbbell, Users, Target, TrendingUp, SlidersHorizontal, ArrowUpRight, Trophy, X } from "lucide-react";

interface GymTabProps {
    rawPerfStats: any[];
}

const ITEMS_PER_PAGE = 50;

export function GymTab({ rawPerfStats }: GymTabProps) {
    const router = useRouter();

    // Filter state
    const [gymSearch, setGymSearch] = useState("");
    const [gymExerciseFilter, setGymExerciseFilter] = useState("all");
    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(1);

    // New filter states
    const [minPR, setMinPR] = useState("");
    const [maxPR, setMaxPR] = useState("");
    const [showTopPerformers, setShowTopPerformers] = useState(false);
    const [showProgressing, setShowProgressing] = useState(false);
    const [sortBy, setSortBy] = useState("best_desc");

    // Sorting hook
    const { sortConfig, handleSort, sortData } = useSorting();

    // Derived data
    const gymPlayers = useMemo(() => {
        return Array.from(new Set(rawPerfStats.map(p => p.player_name))).filter(Boolean).sort();
    }, [rawPerfStats]);

    const gymExercises = useMemo(() => {
        return Array.from(new Set(rawPerfStats.map(p => p.exercise))).filter(Boolean).sort();
    }, [rawPerfStats]);

    // Calculate best PR for each row (used in filtering and display)
    const dataWithBest = useMemo(() => {
        return rawPerfStats.map(p => ({
            ...p,
            best: Math.max(p.pr_1 || 0, p.pr_2 || 0, p.pr_3 || 0, p.pr_4 || 0),
            hasProgression: (p.pr_4 || 0) > (p.pr_1 || 0) || (p.pr_3 || 0) > (p.pr_1 || 0) || (p.pr_2 || 0) > (p.pr_1 || 0)
        }));
    }, [rawPerfStats]);

    // Calculate top performers per exercise (top 3 for each)
    const topPerformers = useMemo(() => {
        const topSet = new Set<string>();
        gymExercises.forEach(exercise => {
            const exerciseData = dataWithBest.filter(p => p.exercise === exercise);
            exerciseData
                .sort((a, b) => b.best - a.best)
                .slice(0, 3)
                .forEach(p => topSet.add(`${p.player_name}-${p.exercise}`));
        });
        return topSet;
    }, [dataWithBest, gymExercises]);

    // Filtered gym data with new filters
    const filteredGymData = useMemo(() => {
        let result = [...dataWithBest];

        // Exercise filter
        if (gymExerciseFilter !== "all") {
            result = result.filter(p => p.exercise === gymExerciseFilter);
        }

        // Search filter
        if (gymSearch) {
            const searchLower = gymSearch.toLowerCase();
            result = result.filter(p =>
                p.player_name?.toLowerCase().includes(searchLower) ||
                p.exercise?.toLowerCase().includes(searchLower)
            );
        }

        // Min PR filter
        if (minPR && !isNaN(Number(minPR))) {
            result = result.filter(p => p.best >= Number(minPR));
        }

        // Max PR filter
        if (maxPR && !isNaN(Number(maxPR))) {
            result = result.filter(p => p.best <= Number(maxPR));
        }

        // Top performers filter
        if (showTopPerformers) {
            result = result.filter(p => topPerformers.has(`${p.player_name}-${p.exercise}`));
        }

        // Progressing players filter
        if (showProgressing) {
            result = result.filter(p => p.hasProgression);
        }

        // Apply sorting
        switch (sortBy) {
            case "best_desc":
                result.sort((a, b) => b.best - a.best);
                break;
            case "best_asc":
                result.sort((a, b) => a.best - b.best);
                break;
            case "player_asc":
                result.sort((a, b) => (a.player_name || "").localeCompare(b.player_name || ""));
                break;
            case "exercise_asc":
                result.sort((a, b) => (a.exercise || "").localeCompare(b.exercise || ""));
                break;
        }

        return result;
    }, [dataWithBest, gymExerciseFilter, gymSearch, minPR, maxPR, showTopPerformers, showProgressing, sortBy, topPerformers]);

    const paginatedData = filteredGymData.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(filteredGymData.length / ITEMS_PER_PAGE);

    // Stats
    const bestPR = rawPerfStats.length > 0
        ? Math.max(...rawPerfStats.flatMap(p => [p.pr_1 || 0, p.pr_2 || 0, p.pr_3 || 0, p.pr_4 || 0]))
        : 0;

    // Count active filters
    const activeFilterCount = [
        gymExerciseFilter !== "all",
        minPR !== "",
        maxPR !== "",
        showTopPerformers,
        showProgressing
    ].filter(Boolean).length;

    // Clear all filters
    const clearFilters = () => {
        setGymExerciseFilter("all");
        setMinPR("");
        setMaxPR("");
        setShowTopPerformers(false);
        setShowProgressing(false);
        setSortBy("best_desc");
        setPage(1);
    };

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
                                    placeholder="Search player or exercise..."
                                    value={gymSearch}
                                    onChange={(e) => { setGymSearch(e.target.value); setPage(1); }}
                                    className="pl-9 pr-14 h-10"
                                />
                                {gymSearch && (
                                    <button
                                        onClick={() => setGymSearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-destructive hover:underline"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Sort By */}
                        <div className="w-full md:w-48">
                            <Label className="text-xs text-muted-foreground mb-2 block">Sort By</Label>
                            <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1); }}>
                                <SelectTrigger className="h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="best_desc">🏆 Best PR (High to Low)</SelectItem>
                                    <SelectItem value="best_asc">📉 Best PR (Low to High)</SelectItem>
                                    <SelectItem value="player_asc">👤 Player Name (A-Z)</SelectItem>
                                    <SelectItem value="exercise_asc">🏋️ Exercise (A-Z)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            variant={showFilters ? "secondary" : "outline"}
                            className="gap-2 h-10"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <SlidersHorizontal size={16} />
                            Filters
                            {activeFilterCount > 0 && (
                                <Badge variant="secondary" className="ml-1 px-1.5 h-5 text-[10px]">{activeFilterCount}</Badge>
                            )}
                        </Button>
                    </div>

                    {showFilters && (
                        <div className="pt-4 border-t animate-in slide-in-from-top-2 fade-in duration-200 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Exercise Filter */}
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

                                {/* Min PR */}
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-2 block">Minimum PR (kg)</Label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 50"
                                        value={minPR}
                                        onChange={(e) => { setMinPR(e.target.value); setPage(1); }}
                                        className="h-10"
                                    />
                                </div>

                                {/* Max PR */}
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-2 block">Maximum PR (kg)</Label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 200"
                                        value={maxPR}
                                        onChange={(e) => { setMaxPR(e.target.value); setPage(1); }}
                                        className="h-10"
                                    />
                                </div>

                                {/* Quick Actions */}
                                <div className="flex flex-col gap-2">
                                    <Label className="text-xs text-muted-foreground mb-0.5 block">Quick Filters</Label>
                                    <div className="flex gap-2 flex-wrap">
                                        <Button
                                            variant={showTopPerformers ? "default" : "outline"}
                                            size="sm"
                                            className="h-8 gap-1"
                                            onClick={() => { setShowTopPerformers(!showTopPerformers); setPage(1); }}
                                        >
                                            <Trophy size={14} />
                                            Top 3
                                        </Button>
                                        <Button
                                            variant={showProgressing ? "default" : "outline"}
                                            size="sm"
                                            className="h-8 gap-1"
                                            onClick={() => { setShowProgressing(!showProgressing); setPage(1); }}
                                        >
                                            <ArrowUpRight size={14} />
                                            Progressing
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Active filters display & Clear button */}
                            {activeFilterCount > 0 && (
                                <div className="flex items-center gap-2 flex-wrap pt-2">
                                    <span className="text-xs text-muted-foreground">Active filters:</span>
                                    {gymExerciseFilter !== "all" && (
                                        <Badge variant="secondary" className="gap-1">
                                            {gymExerciseFilter}
                                            <X size={12} className="cursor-pointer" onClick={() => setGymExerciseFilter("all")} />
                                        </Badge>
                                    )}
                                    {minPR && (
                                        <Badge variant="secondary" className="gap-1">
                                            Min: {minPR}kg
                                            <X size={12} className="cursor-pointer" onClick={() => setMinPR("")} />
                                        </Badge>
                                    )}
                                    {maxPR && (
                                        <Badge variant="secondary" className="gap-1">
                                            Max: {maxPR}kg
                                            <X size={12} className="cursor-pointer" onClick={() => setMaxPR("")} />
                                        </Badge>
                                    )}
                                    {showTopPerformers && (
                                        <Badge variant="secondary" className="gap-1">
                                            Top 3 Only
                                            <X size={12} className="cursor-pointer" onClick={() => setShowTopPerformers(false)} />
                                        </Badge>
                                    )}
                                    {showProgressing && (
                                        <Badge variant="secondary" className="gap-1">
                                            Progressing
                                            <X size={12} className="cursor-pointer" onClick={() => setShowProgressing(false)} />
                                        </Badge>
                                    )}
                                    <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive" onClick={clearFilters}>
                                        Clear All
                                    </Button>
                                </div>
                            )}
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
                    <DataTable fullHeight>
                        <DataTableHeader sticky>
                            <DataTableHead>Player</DataTableHead>
                            <DataTableHead>Exercise</DataTableHead>
                            <DataTableHead className="text-right hidden md:table-cell">PR 1</DataTableHead>
                            <DataTableHead className="text-right hidden md:table-cell">PR 2</DataTableHead>
                            <DataTableHead className="text-right hidden md:table-cell">PR 3</DataTableHead>
                            <DataTableHead className="text-right hidden md:table-cell">PR 4</DataTableHead>
                            <DataTableHead className="text-right">Best</DataTableHead>
                            <DataTableHead className="text-center w-16">Status</DataTableHead>
                        </DataTableHeader>
                        <DataTableBody>
                            {paginatedData.length > 0 ? (
                                paginatedData.map((row, idx) => {
                                    const isTop = topPerformers.has(`${row.player_name}-${row.exercise}`);
                                    return (
                                        <DataTableRow key={idx} onClick={() => router.push(`/players/${row.player_name}?from=gym`)}>
                                            <DataTableCell className="font-medium">{row.player_name}</DataTableCell>
                                            <DataTableCell className="text-primary font-medium">{row.exercise}</DataTableCell>
                                            <DataTableCell className="text-right text-muted-foreground font-mono hidden md:table-cell">{row.pr_1 || '-'}</DataTableCell>
                                            <DataTableCell className="text-right text-muted-foreground font-mono hidden md:table-cell">{row.pr_2 || '-'}</DataTableCell>
                                            <DataTableCell className="text-right text-muted-foreground font-mono hidden md:table-cell">{row.pr_3 || '-'}</DataTableCell>
                                            <DataTableCell className="text-right text-muted-foreground font-mono hidden md:table-cell">{row.pr_4 || '-'}</DataTableCell>
                                            <DataTableCell className="text-right">
                                                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                                                    {row.best} kg
                                                </Badge>
                                            </DataTableCell>
                                            <DataTableCell className="text-center">
                                                <div className="flex justify-center gap-1">
                                                    {isTop && (
                                                        <Trophy size={14} className="text-yellow-500" title="Top 3 Performer" />
                                                    )}
                                                    {row.hasProgression && (
                                                        <ArrowUpRight size={14} className="text-green-500" title="Showing Improvement" />
                                                    )}
                                                </div>
                                            </DataTableCell>
                                        </DataTableRow>
                                    );
                                })
                            ) : (
                                <DataTableEmpty colSpan={8} message="No gym performance data matches your filters." />
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
                    const exerciseData = dataWithBest.filter(p => p.exercise === exercise);
                    const avgBest = exerciseData.reduce((sum, p) => sum + p.best, 0) / exerciseData.length;

                    return (
                        <Card key={exercise} className="glass-card p-6">
                            <h3 className="text-lg font-bold text-foreground mb-4">{exercise}</h3>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-muted-foreground text-sm">{exerciseData.length} players</span>
                                <span className="text-yellow-500 font-bold">Avg: {avgBest.toFixed(1)} kg</span>
                            </div>
                            <div className="space-y-2">
                                {exerciseData
                                    .sort((a, b) => b.best - a.best)
                                    .slice(0, 5)
                                    .map((player, idx) => {
                                        return (
                                            <div key={player.player_name} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-gray-400 text-black' : idx === 2 ? 'bg-orange-600 text-white' : 'bg-muted text-foreground'}`}>
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-sm">{player.player_name}</span>
                                                    {player.hasProgression && (
                                                        <ArrowUpRight size={12} className="text-green-500" />
                                                    )}
                                                </div>
                                                <span className="font-mono text-yellow-500">{player.best} kg</span>
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
