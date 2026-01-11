"use client";

import { useState, useEffect, useMemo } from "react";
import {
    getEditableData,
    updateMatchStat,
    updatePerformanceStat,
    updateMatch,
    createMatchStat,
    createPerformanceStat,
    deleteMatchStat,
    deletePerformanceStat,
    getMatches,
    EditorTable
} from "@/lib/services/editor";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CheckCircle, Database, Search, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";

export default function DataEditorPage() {
    const [mode, setMode] = useState<EditorTable>('match_stats');
    const [data, setData] = useState<any[]>([]);
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null); // "row_id-col"
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

    const uniqueOpponents = useMemo(() => {
        const opps = new Set(data.filter(d => d.match_opponent).map(d => d.match_opponent));
        return Array.from(opps).sort();
    }, [data]);

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

        return res;
    }, [data, search, mode, opponentFilter, startDate, endDate]);

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
            } else {
                await deletePerformanceStat(row.player_name, row.exercise);
            }
            // Remove locally
            setData(prev => prev.filter(r =>
                mode === 'match_stats'
                    ? (r.match_id !== row.match_id || r.player_name !== row.player_name)
                    : (r.player_name !== row.player_name || r.exercise !== row.exercise)
            ));
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
            } else {
                if (!newRecord.player_name || !newRecord.exercise) {
                    alert("Player Name and Exercise are required");
                    return;
                }
                await createPerformanceStat(newRecord.player_name, newRecord.exercise, newRecord);
            }
            setIsAddOpen(false);
            setNewRecord({});
            loadData(); // Refresh to include new row with proper joins
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
        const rowIndex = newData.findIndex(r =>
            mode === 'match_stats'
                ? (r.match_id === row.match_id && r.player_name === row.player_name)
                : (r.player_name === row.player_name && r.exercise === row.exercise)
        );

        if (rowIndex === -1) return;

        let finalValue: any = value;
        const numberFields = ['goals', 'assists', 'minutes_played', 'total_passes', 'successful_passes', 'total_shots', 'total_tackles', 'yellow_cards', 'red_cards', 'pr_1', 'pr_2', 'pr_3', 'pr_4'];

        if (numberFields.includes(field)) {
            finalValue = value === '' ? null : Number(value);
        }

        // Apply update to local state based on field type
        if (field === 'match_date') {
            // Update all rows with this match_id locally to keep UI consistent
            newData.forEach(r => {
                if (r.match_id === row.match_id) r.match_date = value;
            });
        } else if (field === 'match_opponent') {
            newData.forEach(r => {
                if (r.match_id === row.match_id) r.match_opponent = value;
            });
        } else {
            // Update single row
            newData[rowIndex] = { ...newData[rowIndex], [field]: finalValue };
        }

        setData(newData);

        const key = `${mode === 'match_stats' ? row.match_id : row.player_name}-${field}`;
        setSaving(key);

        try {
            if (mode === 'match_stats') {
                if (field === 'match_date') {
                    await updateMatch(row.match_id, { date: value });
                } else if (field === 'match_opponent') {
                    await updateMatch(row.match_id, { opponent: value });
                } else {
                    // Standard stat update
                    await updateMatchStat(row.match_id, row.player_name, { [field]: finalValue });
                }
            } else {
                await updatePerformanceStat(row.player_name, row.exercise, { [field]: finalValue });
            }
            setLastSaved(Date.now());
        } catch (err) {
            console.error("Save failed", err);
        } finally {
            setSaving(null);
        }
    };



    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sticky top-0 bg-background/80 backdrop-blur-md z-40 py-4 border-b border-white/5 -mx-4 px-4 md:-mx-8 md:px-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                            <Database className="text-pink-500" />
                            Data Editor
                        </h1>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 w-full">
                    {/* Search Bar */}
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <Input
                            placeholder="Filter data..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-white/5 border-white/10 text-white"
                        />
                    </div>

                    {mode === 'match_stats' && (
                        <>
                            {/* Opposition Filter */}
                            <Select value={opponentFilter} onValueChange={setOpponentFilter}>
                                <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                                    <SelectValue placeholder="Opponent" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                                    <SelectItem value="all">All Opponents</SelectItem>
                                    {uniqueOpponents.map(op => (
                                        <SelectItem key={op} value={op}>{op}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Date Range */}
                            <div className="flex gap-2 items-center">
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-[140px] bg-white/5 border-white/10 text-white"
                                />
                                <span className="text-gray-500">-</span>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-[140px] bg-white/5 border-white/10 text-white"
                                />
                            </div>
                        </>
                    )}

                    <div className="flex-1" />

                    <div className="flex items-center gap-4 bg-black/20 p-2 rounded-lg border border-white/10 w-full md:w-auto">
                        <Select value={mode} onValueChange={(v: EditorTable) => { setMode(v); setSearch(""); }}>
                            <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                                <SelectItem value="match_stats">⚽ Match Stats</SelectItem>
                                <SelectItem value="performance_stats">🏋️ Gym Performance</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2 px-3 min-w-[100px] justify-end">
                            {saving ? (
                                <span className="text-yellow-400 text-xs flex items-center gap-1">
                                    <Loader2 size={12} className="animate-spin" /> Saving...
                                </span>
                            ) : lastSaved > 0 ? (
                                <span className="text-green-400 text-xs flex items-center gap-1 animate-in fade-in">
                                    <CheckCircle size={12} /> Saved
                                </span>
                            ) : null}
                        </div>
                    </div>

                    <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white">
                        <Plus size={16} className="mr-2" /> Add Record
                    </Button>
                </div>
            </div>

            <Card className="glass-panel border-0 overflow-hidden">
                {loading ? (
                    <div className="p-12 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-black/40">
                                <TableRow className="border-white/10 hover:bg-transparent">
                                    {mode === 'match_stats' ? (
                                        <>
                                            <TableHead className="text-gray-300 min-w-[150px]">Player</TableHead>
                                            <TableHead className="text-gray-300 min-w-[130px]">Date</TableHead>
                                            <TableHead className="text-gray-300 min-w-[150px]">Opponent</TableHead>
                                            <TableHead className="text-gray-300 text-center w-[80px]">Mins</TableHead>
                                            <TableHead className="text-gray-300 text-center w-[80px]">Goals</TableHead>
                                            <TableHead className="text-gray-300 text-center w-[80px]">Assists</TableHead>
                                            <TableHead className="text-gray-300 text-center w-[80px]">Shots</TableHead>
                                            <TableHead className="text-gray-300 text-center w-[80px]">Passes</TableHead>
                                            <TableHead className="text-gray-300 text-center w-[80px]">Succ. Passes</TableHead>
                                            <TableHead className="text-gray-300 text-center w-[80px]">Tackles</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </>
                                    ) : (
                                        <>
                                            <TableHead className="text-gray-300 min-w-[200px]">Player</TableHead>
                                            <TableHead className="text-gray-300 min-w-[200px]">Exercise</TableHead>
                                            <TableHead className="text-gray-300 text-center w-[100px]">PR 1</TableHead>
                                            <TableHead className="text-gray-300 text-center w-[100px]">PR 2</TableHead>
                                            <TableHead className="text-gray-300 text-center w-[100px]">PR 3</TableHead>
                                            <TableHead className="text-gray-300 text-center w-[100px]">PR 4</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.map((row) => (
                                    <TableRow key={mode === 'match_stats' ? `${row.match_id}-${row.player_name}` : `${row.player_name}-${row.exercise}`} className="border-white/5 hover:bg-white/5 group">
                                        {mode === 'match_stats' ? (
                                            <>
                                                <EditableCell row={row} field="player_name" val={row.player_name} onUpdate={handleUpdate} className="text-white font-medium" />
                                                <EditableCell row={row} field="match_date" val={row.match_date} onUpdate={handleUpdate} className="text-gray-400 text-xs" type="date" />
                                                <EditableCell row={row} field="match_opponent" val={row.match_opponent} onUpdate={handleUpdate} className="text-gray-400 text-xs" />

                                                <EditableCell row={row} field="minutes_played" val={row.minutes_played} onUpdate={handleUpdate} />
                                                <EditableCell row={row} field="goals" val={row.goals} onUpdate={handleUpdate} highlight />
                                                <EditableCell row={row} field="assists" val={row.assists} onUpdate={handleUpdate} highlight />
                                                <EditableCell row={row} field="total_shots" val={row.total_shots} onUpdate={handleUpdate} />
                                                <EditableCell row={row} field="total_passes" val={row.total_passes} onUpdate={handleUpdate} />
                                                <EditableCell row={row} field="successful_passes" val={row.successful_passes} onUpdate={handleUpdate} />
                                                <EditableCell row={row} field="total_tackles" val={row.total_tackles} onUpdate={handleUpdate} />
                                                <TableCell className="p-1">
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(row)} className="text-red-500/50 hover:text-red-500 hover:bg-red-500/10 h-8 w-8 p-0">
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </TableCell>
                                            </>
                                        ) : (
                                            <>
                                                <EditableCell row={row} field="player_name" val={row.player_name} onUpdate={handleUpdate} className="text-white font-medium" />
                                                <EditableCell row={row} field="exercise" val={row.exercise} onUpdate={handleUpdate} className="text-blue-300 font-medium" />
                                                <EditableCell row={row} field="pr_1" val={row.pr_1} onUpdate={handleUpdate} />
                                                <EditableCell row={row} field="pr_2" val={row.pr_2} onUpdate={handleUpdate} />
                                                <EditableCell row={row} field="pr_3" val={row.pr_3} onUpdate={handleUpdate} />
                                                <EditableCell row={row} field="pr_4" val={row.pr_4} onUpdate={handleUpdate} />
                                                <TableCell className="p-1">
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(row)} className="text-red-500/50 hover:text-red-500 hover:bg-red-500/10 h-8 w-8 p-0">
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </TableCell>
                                            </>
                                        )}
                                    </TableRow>
                                ))}
                                {filteredData.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                                            No data matches your search.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </Card>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="bg-[#0f172a] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Add New {mode === 'match_stats' ? 'Match Statistic' : 'Performance Record'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Player Name</Label>
                            <Input
                                placeholder="Full Name"
                                value={newRecord.player_name || ''}
                                onChange={e => setNewRecord({ ...newRecord, player_name: e.target.value })}
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>

                        {mode === 'match_stats' ? (
                            <div className="space-y-2">
                                <Label>Match</Label>
                                <SearchableSelect
                                    options={matches.map(m => ({ label: `${m.date} vs ${m.opponent}`, value: m.id }))}
                                    value={newRecord.match_id}
                                    onValueChange={(val) => setNewRecord({ ...newRecord, match_id: val })}
                                    placeholder="Select Match..."
                                    className="w-full"
                                />
                                <p className="text-xs text-gray-500">Note: To create a new match, please do so via Database Admin or API.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>Exercise</Label>
                                <Input
                                    placeholder="e.g. Squat 1RM"
                                    value={newRecord.exercise || ''}
                                    onChange={e => setNewRecord({ ...newRecord, exercise: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)} className="border-white/10 text-gray-400 hover:text-white">Cancel</Button>
                        <Button onClick={handleCreate} disabled={isCreating} className="bg-blue-600 hover:bg-blue-500 text-white">
                            {isCreating ? <Loader2 size={16} className="animate-spin" /> : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

const EditableCell = ({ row, field, val, onUpdate, highlight, className, type = "text" }: any) => {
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
        <TableCell className="p-1">
            <Input
                type={type}
                value={localVal}
                onChange={(e) => setLocalVal(e.target.value)}
                onBlur={handleBlur}
                className={`h-8 w-full bg-transparent border-transparent hover:border-white/20 focus:bg-white/10 focus:border-blue-500 transition-all ${className ? className : 'text-center'} ${highlight ? 'text-green-400 font-bold' : (!className && 'text-gray-300')}`}
            />
        </TableCell>
    )
}
