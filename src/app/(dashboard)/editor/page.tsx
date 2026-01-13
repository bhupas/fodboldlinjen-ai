"use client";

import { useState, useEffect, useMemo } from "react";
import {
    getEditableData,
    updateMatchStat,
    updatePerformanceStat,
    updateFeedback,
    updateMatch,
    createMatchStat,
    createPerformanceStat,
    createFeedback,
    deleteMatchStat,
    deletePerformanceStat,
    deleteFeedback,
    getMatches,
    EditorTable
} from "@/lib/services/editor";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { PageHeader } from "@/components/ui/page-header";
import { FilterPanel } from "@/components/ui/filter-panel";
import { Loader2, CheckCircle, Database, Search, Plus, Trash2, SlidersHorizontal, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ComboSelect } from "@/components/ui/combo-select";
import { Badge } from "@/components/ui/badge";

export default function DataEditorPage() {
    const [mode, setMode] = useState<EditorTable>('match_stats');
    const [data, setData] = useState<any[]>([]);
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [lastSaved, setLastSaved] = useState<number>(0);
    const [search, setSearch] = useState("");

    // Add Dialog State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newRecord, setNewRecord] = useState<any>({});
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadData();
    }, [mode]);

    useEffect(() => {
        getMatches().then(setMatches).catch(console.error);
    }, []);

    // Filters
    const [opponentFilter, setOpponentFilter] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    const uniqueOpponents = useMemo(() => {
        const opps = new Set(data.filter(d => d.match_opponent).map(d => d.match_opponent));
        return Array.from(opps).sort();
    }, [data]);

    const uniquePlayers = useMemo(() => {
        const players = new Set(data.filter(d => d.player_name).map(d => d.player_name));
        return Array.from(players).sort();
    }, [data]);

    // Player filter state
    const [playerFilter, setPlayerFilter] = useState("");

    const filteredData = useMemo(() => {
        let res = [...data];

        // Global Text Search
        if (search) {
            const lowerSearch = search.toLowerCase();
            res = res.filter(row => {
                if (mode === 'match_stats') {
                    return (
                        row.player_name?.toLowerCase().includes(lowerSearch) ||
                        row.match_opponent?.toLowerCase().includes(lowerSearch) ||
                        row.match_date?.toLowerCase().includes(lowerSearch)
                    );
                } else {
                    return (
                        row.player_name?.toLowerCase().includes(lowerSearch) ||
                        row.exercise?.toLowerCase().includes(lowerSearch)
                    );
                }
            });
        }

        // Additional Filters for Match Stats
        if (mode === 'match_stats') {
            if (opponentFilter && opponentFilter !== 'all') {
                res = res.filter(row => row.match_opponent === opponentFilter);
            }
            if (startDate) {
                res = res.filter(row => new Date(row.match_date) >= new Date(startDate));
            }
            if (endDate) {
                res = res.filter(row => new Date(row.match_date) <= new Date(endDate));
            }
        }

        // Player filter (applies to both modes)
        if (playerFilter && playerFilter !== 'all') {
            res = res.filter(row => row.player_name === playerFilter);
        }

        return res;
    }, [data, search, mode, opponentFilter, startDate, endDate, playerFilter]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await getEditableData(mode);
            setData(res);
        } catch (err) {
            console.error("Failed to load data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (row: any) => {
        if (!confirm("Are you sure you want to delete this record?")) return;

        try {
            if (mode === 'match_stats') {
                await deleteMatchStat(row.match_id, row.player_name);
            } else if (mode === 'performance_stats') {
                await deletePerformanceStat(row.player_name, row.exercise);
            } else {
                await deleteFeedback(row.id);
            }
            // Remove locally
            setData(prev => prev.filter(r => {
                if (mode === 'match_stats') {
                    return r.match_id !== row.match_id || r.player_name !== row.player_name;
                } else if (mode === 'performance_stats') {
                    return r.player_name !== row.player_name || r.exercise !== row.exercise;
                } else {
                    return r.id !== row.id;
                }
            }));
        } catch (err) {
            alert("Failed to delete record");
            console.error(err);
        }
    };

    const handleCreate = async () => {
        setIsCreating(true);
        try {
            if (mode === 'match_stats') {
                if (!newRecord.match_id || !newRecord.player_name) {
                    alert("Match and Player Name are required");
                    return;
                }
                await createMatchStat(newRecord.match_id, newRecord.player_name, newRecord);
            } else if (mode === 'performance_stats') {
                if (!newRecord.player_name || !newRecord.exercise) {
                    alert("Player Name and Exercise are required");
                    return;
                }
                await createPerformanceStat(newRecord.player_name, newRecord.exercise, newRecord);
            } else {
                if (!newRecord.match_id || !newRecord.player_name || !newRecord.feedback) {
                    alert("Match, Player Name, and Feedback are required");
                    return;
                }
                await createFeedback(newRecord.match_id, newRecord.player_name, newRecord.feedback);
            }
            setIsAddOpen(false);
            setNewRecord({});
            loadData();
        } catch (err) {
            alert("Failed to create record");
            console.error(err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpdate = async (row: any, field: string, value: string) => {
        // Optimistic update logic
        const newData = [...data];
        const rowIndex = newData.findIndex(r => {
            if (mode === 'match_stats') {
                return r.match_id === row.match_id && r.player_name === row.player_name;
            } else if (mode === 'performance_stats') {
                return r.player_name === row.player_name && r.exercise === row.exercise;
            } else {
                return r.id === row.id;
            }
        });

        if (rowIndex === -1) return;

        let finalValue: any = value;
        const numberFields = ['goals', 'assists', 'minutes_played', 'total_passes', 'successful_passes', 'total_shots', 'total_tackles', 'yellow_cards', 'red_cards', 'pr_1', 'pr_2', 'pr_3', 'pr_4'];

        if (numberFields.includes(field)) {
            finalValue = value === '' ? null : Number(value);
        }

        // Apply update to local state based on field type
        if (field === 'match_date') {
            newData.forEach(r => {
                if (r.match_id === row.match_id) r.match_date = value;
            });
        } else if (field === 'match_opponent') {
            newData.forEach(r => {
                if (r.match_id === row.match_id) r.match_opponent = value;
            });
        } else {
            newData[rowIndex] = { ...newData[rowIndex], [field]: finalValue };
        }

        setData(newData);

        const key = mode === 'feedback' ? `${row.id}-${field}` : `${mode === 'match_stats' ? row.match_id : row.player_name}-${field}`;
        setSaving(key);

        try {
            if ((mode === 'match_stats' || mode === 'feedback') && (field === 'match_date' || field === 'match_opponent')) {
                if (field === 'match_date') {
                    await updateMatch(row.match_id, { date: value });
                } else {
                    await updateMatch(row.match_id, { opponent: value });
                }
            } else if (mode === 'match_stats') {
                await updateMatchStat(row.match_id, row.player_name, { [field]: finalValue });
            } else if (mode === 'performance_stats') {
                await updatePerformanceStat(row.player_name, row.exercise, { [field]: finalValue });
            } else {
                await updateFeedback(row.id, { [field]: finalValue });
            }
            setLastSaved(Date.now());
        } catch (err) {
            console.error("Save failed", err);
        } finally {
            setSaving(null);
        }
    };

    // Export functionality - exports filtered data based on current filters
    const handleExport = () => {
        if (filteredData.length === 0) {
            alert("No data to export");
            return;
        }

        let headers: string[];
        let rows: any[][];
        let filename: string;

        if (mode === 'match_stats') {
            headers = ["Player", "Match", "Opponent", "Date", "Passing %", "Distance (km)", "Tackles", "Yellow Cards", "Red Cards", "Goals", "Assists", "Minutes"];
            rows = filteredData.map(row => [
                row.player_name || "",
                row.match_name || "",
                row.match_opponent || "",
                row.match_date || "",
                row.passing_pct || "",
                row.distance_km || "",
                row.tackles || "",
                row.yellow_cards || "0",
                row.red_cards || "0",
                row.goals || "0",
                row.assists || "0",
                row.minutes_played || ""
            ]);
            filename = `match_stats_export_${new Date().toISOString().slice(0, 10)}.csv`;
        } else if (mode === 'performance_stats') {
            headers = ["Player", "Exercise", "Personal Record", "Date"];
            rows = filteredData.map(row => [
                row.player_name || "",
                row.exercise || "",
                row.personal_record || "",
                row.recorded_at || ""
            ]);
            filename = `gym_performance_export_${new Date().toISOString().slice(0, 10)}.csv`;
        } else {
            headers = ["Player", "Opponent", "Date", "Feedback"];
            rows = filteredData.map(row => [
                row.player_name || "",
                row.match_opponent || "",
                row.match_date || "",
                row.feedback || ""
            ]);
            filename = `feedback_export_${new Date().toISOString().slice(0, 10)}.csv`;
        }

        // Build CSV content
        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <PageHeader
                icon={Database}
                iconColor="pink"
                title="Data Editor"
                description="Edit, manage, and export your match statistics and performance records"
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleExport} disabled={filteredData.length === 0}>
                            <Download size={16} className="mr-2" />
                            Export {filteredData.length > 0 && `(${filteredData.length})`}
                        </Button>
                        <Button onClick={() => setIsAddOpen(true)} className="bg-primary hover:bg-primary/90">
                            <Plus size={16} className="mr-2" /> Add Record
                        </Button>
                    </div>
                }
            />

            {/* Filter Panel - Similar to Player Analysis */}
            <FilterPanel>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        {/* Search */}
                        <div className="flex-1 relative w-full">
                            <Label className="text-xs text-muted-foreground mb-2 block">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                <Input
                                    placeholder="Filter by player, opponent, exercise..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-10"
                                />
                            </div>
                            {search && (
                                <button onClick={() => setSearch('')} className="text-xs text-destructive mt-1 hover:underline text-right w-full block">Clear</button>
                            )}
                        </div>

                        {/* Table Mode Selector */}
                        <div className="w-full md:w-52">
                            <Label className="text-xs text-muted-foreground mb-2 block">Data Type</Label>
                            <Select value={mode} onValueChange={(v: EditorTable) => { setMode(v); setSearch(""); setOpponentFilter(""); setPlayerFilter(""); }}>
                                <SelectTrigger className="h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="match_stats">⚽ Match Stats</SelectItem>
                                    <SelectItem value="performance_stats">🏋️ Gym Performance</SelectItem>
                                    <SelectItem value="feedback">💬 Player Feedback</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Filters Button */}
                        <Button
                            variant={showFilters ? "secondary" : "outline"}
                            className="gap-2 h-10"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <SlidersHorizontal size={16} />
                            Filters
                            {(opponentFilter || startDate || endDate || playerFilter) && (
                                <Badge variant="secondary" className="ml-1 px-1 h-5 text-[10px]">!</Badge>
                            )}
                        </Button>

                        {/* Save Status */}
                        <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-xl border border-border h-10">
                            {saving ? (
                                <span className="text-yellow-500 text-xs flex items-center gap-1">
                                    <Loader2 size={12} className="animate-spin" /> Saving...
                                </span>
                            ) : lastSaved > 0 ? (
                                <span className="text-green-500 text-xs flex items-center gap-1 animate-in fade-in">
                                    <CheckCircle size={12} /> Saved
                                </span>
                            ) : (
                                <span className="text-muted-foreground text-xs">Auto-save enabled</span>
                            )}
                        </div>
                    </div>

                    {/* Advanced Filters - Collapsible */}
                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t animate-in slide-in-from-top-2 fade-in duration-200">
                            {/* Player Filter - Always Available */}
                            <div>
                                <Label className="text-xs text-muted-foreground mb-2 block">Player</Label>
                                <ComboSelect
                                    options={[{ label: "All Players", value: "all" }, ...uniquePlayers.map(p => ({ label: p, value: p }))]}
                                    value={playerFilter || "all"}
                                    onValueChange={(val) => setPlayerFilter(val === "all" ? "" : val)}
                                    placeholder="Select player"
                                    searchPlaceholder="Type to search..."
                                />
                            </div>

                            {/* Match Stats only filters */}
                            {mode === 'match_stats' && (
                                <>
                                    {/* Opposition Filter */}
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-2 block">Opposition</Label>
                                        <ComboSelect
                                            options={[{ label: "All Opponents", value: "all" }, ...uniqueOpponents.map(o => ({ label: o, value: o }))]}
                                            value={opponentFilter || "all"}
                                            onValueChange={(val) => setOpponentFilter(val === "all" ? "" : val)}
                                            placeholder="Select opponent"
                                            searchPlaceholder="Type to search..."
                                        />
                                    </div>

                                    {/* Date Range */}
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-2 block">Start Date</Label>
                                        <Input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="h-10"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-2 block">End Date</Label>
                                        <Input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="h-10"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </FilterPanel>

            {/* Data Table */}
            < DataTable >
                <DataTableHeader>
                    {mode === 'match_stats' ? (
                        <>
                            <DataTableHead className="min-w-[150px]">Player</DataTableHead>
                            <DataTableHead className="min-w-[130px]">Date</DataTableHead>
                            <DataTableHead className="min-w-[150px]">Opponent</DataTableHead>
                            <DataTableHead className="text-center w-[80px]">Mins</DataTableHead>
                            <DataTableHead className="text-center w-[80px]">Goals</DataTableHead>
                            <DataTableHead className="text-center w-[80px]">Assists</DataTableHead>
                            <DataTableHead className="text-center w-[80px]">Shots</DataTableHead>
                            <DataTableHead className="text-center w-[80px]">Passes</DataTableHead>
                            <DataTableHead className="text-center w-[80px]">Succ. Passes</DataTableHead>
                            <DataTableHead className="text-center w-[80px]">Tackles</DataTableHead>
                            <DataTableHead className="w-[50px]"></DataTableHead>
                        </>
                    ) : mode === 'performance_stats' ? (
                        <>
                            <DataTableHead className="min-w-[200px]">Player</DataTableHead>
                            <DataTableHead className="min-w-[200px]">Exercise</DataTableHead>
                            <DataTableHead className="text-center w-[100px]">PR 1</DataTableHead>
                            <DataTableHead className="text-center w-[100px]">PR 2</DataTableHead>
                            <DataTableHead className="text-center w-[100px]">PR 3</DataTableHead>
                            <DataTableHead className="text-center w-[100px]">PR 4</DataTableHead>
                            <DataTableHead className="w-[50px]"></DataTableHead>
                        </>
                    ) : (
                        <>
                            <DataTableHead className="min-w-[150px]">Player</DataTableHead>
                            <DataTableHead className="min-w-[130px]">Date</DataTableHead>
                            <DataTableHead className="min-w-[150px]">Opponent</DataTableHead>
                            <DataTableHead className="min-w-[400px]">Feedback</DataTableHead>
                            <DataTableHead className="w-[50px]"></DataTableHead>
                        </>
                    )}
                </DataTableHeader>
                <DataTableBody>
                    {loading ? (
                        <DataTableLoading colSpan={mode === 'match_stats' ? 12 : mode === 'performance_stats' ? 7 : 5} />
                    ) : filteredData.length === 0 ? (
                        <DataTableEmpty colSpan={mode === 'match_stats' ? 12 : mode === 'performance_stats' ? 7 : 5} message="No data matches your search." />
                    ) : (
                        filteredData.map((row) => (
                            <DataTableRow key={mode === 'feedback' ? row.id : mode === 'match_stats' ? `${row.match_id}-${row.player_name}` : `${row.player_name}-${row.exercise}`}>
                                {mode === 'match_stats' ? (
                                    <>
                                        <EditableCell row={row} field="player_name" val={row.player_name} onUpdate={handleUpdate} className="font-medium" />
                                        <EditableCell row={row} field="match_date" val={row.match_date} onUpdate={handleUpdate} className="text-muted-foreground text-xs" type="date" />
                                        <EditableCell row={row} field="match_opponent" val={row.match_opponent} onUpdate={handleUpdate} className="text-muted-foreground text-xs" />
                                        <EditableCell row={row} field="minutes_played" val={row.minutes_played} onUpdate={handleUpdate} />
                                        <EditableCell row={row} field="goals" val={row.goals} onUpdate={handleUpdate} highlight />
                                        <EditableCell row={row} field="assists" val={row.assists} onUpdate={handleUpdate} highlight />
                                        <EditableCell row={row} field="total_shots" val={row.total_shots} onUpdate={handleUpdate} />
                                        <EditableCell row={row} field="total_passes" val={row.total_passes} onUpdate={handleUpdate} />
                                        <EditableCell row={row} field="successful_passes" val={row.successful_passes} onUpdate={handleUpdate} />
                                        <EditableCell row={row} field="total_tackles" val={row.total_tackles} onUpdate={handleUpdate} />
                                        <DataTableCell className="p-1">
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(row)} className="text-destructive/50 hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0">
                                                <Trash2 size={16} />
                                            </Button>
                                        </DataTableCell>
                                    </>
                                ) : mode === 'performance_stats' ? (
                                    <>
                                        <EditableCell row={row} field="player_name" val={row.player_name} onUpdate={handleUpdate} className="font-medium" />
                                        <EditableCell row={row} field="exercise" val={row.exercise} onUpdate={handleUpdate} className="text-primary font-medium" />
                                        <EditableCell row={row} field="pr_1" val={row.pr_1} onUpdate={handleUpdate} />
                                        <EditableCell row={row} field="pr_2" val={row.pr_2} onUpdate={handleUpdate} />
                                        <EditableCell row={row} field="pr_3" val={row.pr_3} onUpdate={handleUpdate} />
                                        <EditableCell row={row} field="pr_4" val={row.pr_4} onUpdate={handleUpdate} />
                                        <DataTableCell className="p-1">
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(row)} className="text-destructive/50 hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0">
                                                <Trash2 size={16} />
                                            </Button>
                                        </DataTableCell>
                                    </>
                                ) : (
                                    <>
                                        <EditableCell row={row} field="player_name" val={row.player_name} onUpdate={handleUpdate} className="font-medium" />
                                        <EditableCell row={row} field="match_date" val={row.match_date} onUpdate={handleUpdate} className="text-muted-foreground text-xs" type="date" />
                                        <EditableCell row={row} field="match_opponent" val={row.match_opponent} onUpdate={handleUpdate} className="text-muted-foreground text-xs" />
                                        <EditableCell row={row} field="feedback" val={row.feedback} onUpdate={handleUpdate} className="text-left text-sm italic text-muted-foreground" />
                                        <DataTableCell className="p-1">
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(row)} className="text-destructive/50 hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0">
                                                <Trash2 size={16} />
                                            </Button>
                                        </DataTableCell>
                                    </>
                                )}
                            </DataTableRow>
                        ))
                    )}
                </DataTableBody>
            </DataTable >

            {/* Add Record Dialog */}
            < Dialog open={isAddOpen} onOpenChange={setIsAddOpen} >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">
                            Add New {mode === 'match_stats' ? 'Match Statistic' : mode === 'performance_stats' ? 'Performance Record' : 'Feedback Entry'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Player Name</Label>
                            <Input
                                placeholder="Full Name"
                                value={newRecord.player_name || ''}
                                onChange={e => setNewRecord({ ...newRecord, player_name: e.target.value })}
                                className="h-11"
                            />
                        </div>

                        {mode === 'match_stats' || mode === 'feedback' ? (
                            <div className="space-y-2">
                                <Label>Match</Label>
                                <ComboSelect
                                    options={matches.map(m => ({ label: `${m.date} vs ${m.opponent}`, value: m.id }))}
                                    value={newRecord.match_id}
                                    onValueChange={(val) => setNewRecord({ ...newRecord, match_id: val })}
                                    placeholder="Select Match..."
                                    searchPlaceholder="Search matches..."
                                />
                                {mode === 'match_stats' && (
                                    <p className="text-xs text-muted-foreground">Note: To create a new match, please do so via Database Admin or API.</p>
                                )}
                            </div>
                        ) : null}

                        {mode === 'performance_stats' && (
                            <div className="space-y-2">
                                <Label>Exercise</Label>
                                <Input
                                    placeholder="e.g. Squat 1RM"
                                    value={newRecord.exercise || ''}
                                    onChange={e => setNewRecord({ ...newRecord, exercise: e.target.value })}
                                    className="h-11"
                                />
                            </div>
                        )}

                        {mode === 'feedback' && (
                            <div className="space-y-2">
                                <Label>Feedback</Label>
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Enter player feedback here..."
                                    value={newRecord.feedback || ''}
                                    onChange={e => setNewRecord({ ...newRecord, feedback: e.target.value })}
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={isCreating}>
                            {isCreating ? <Loader2 size={16} className="animate-spin" /> : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >
        </div >
    );
}

// Editable Cell Component
interface EditableCellProps {
    row: any;
    field: string;
    val: any;
    onUpdate: (row: any, field: string, value: string) => void;
    highlight?: boolean;
    className?: string;
    type?: string;
}

function EditableCell({ row, field, val, onUpdate, highlight, className, type = "text" }: EditableCellProps) {
    const [localVal, setLocalVal] = useState(val ?? '');

    useEffect(() => {
        setLocalVal(val ?? '');
    }, [val]);

    const handleBlur = () => {
        if (localVal != val) {
            onUpdate(row, field, localVal);
        }
    };

    return (
        <DataTableCell className="p-1">
            <Input
                type={type}
                value={localVal}
                onChange={(e) => setLocalVal(e.target.value)}
                onBlur={handleBlur}
                className={`h-8 w-full bg-transparent border-transparent hover:border-border focus:bg-muted focus:border-primary transition-all ${className ? className : 'text-center'} ${highlight ? 'text-green-500 font-bold' : (!className && 'text-muted-foreground')}`}
            />
        </DataTableCell>
    );
}
