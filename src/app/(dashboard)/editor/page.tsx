"use client";

import { useState, useEffect } from "react";
import { getEditableData, updateMatchStat, updatePerformanceStat, EditorTable } from "@/lib/services/editor";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Save, CheckCircle, AlertCircle, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DataEditorPage() {
    const [mode, setMode] = useState<EditorTable>('match_stats');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null); // "row_id-col"
    const [lastSaved, setLastSaved] = useState<number>(0);

    useEffect(() => {
        loadData();
    }, [mode]);

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

    const handleUpdate = async (row: any, field: string, value: string) => {
        // Optimistic update
        const newData = [...data];
        const rowIndex = newData.findIndex(r =>
            mode === 'match_stats'
                ? (r.match_id === row.match_id && r.player_name === row.player_name)
                : (r.player_name === row.player_name && r.exercise === row.exercise)
        );

        if (rowIndex === -1) return;

        // Convert value if number
        let finalValue: any = value;
        if (['goals', 'assists', 'minutes_played', 'total_passes', 'successful_passes', 'total_shots', 'total_tackles', 'yellow_cards', 'red_cards', 'pr_1', 'pr_2', 'pr_3', 'pr_4'].includes(field)) {
            finalValue = value === '' ? null : Number(value);
        }

        newData[rowIndex] = { ...newData[rowIndex], [field]: finalValue };
        setData(newData);

        const key = `${mode === 'match_stats' ? row.match_id : row.player_name}-${field}`;
        setSaving(key);

        try {
            if (mode === 'match_stats') {
                await updateMatchStat(row.match_id, row.player_name, { [field]: finalValue });
            } else {
                await updatePerformanceStat(row.player_name, row.exercise, { [field]: finalValue });
            }
            setLastSaved(Date.now());
        } catch (err) {
            console.error("Save failed", err);
            // Revert? (Complex, skipping for now, showing error state would be better)
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <Database className="text-pink-500" />
                        Data Editor
                    </h1>
                    <p className="text-gray-400">Directly edit database records. Changes save automatically.</p>
                </div>

                <div className="flex items-center gap-4 bg-black/20 p-2 rounded-lg border border-white/10">
                    <Select value={mode} onValueChange={(v: EditorTable) => setMode(v)}>
                        <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                            <SelectItem value="match_stats">⚽ Match Stats</SelectItem>
                            <SelectItem value="performance_stats">🏋️ Gym Performance</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2 px-3">
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
            </div>

            <Card className="glass-panel border-0 flex-1 overflow-hidden relative flex flex-col">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto">
                        <Table>
                            <TableHeader className="bg-black/40 sticky top-0 z-10 backdrop-blur-md">
                                <TableRow className="border-white/10 hover:bg-transparent">
                                    {mode === 'match_stats' ? (
                                        <>
                                            <TableHead className="text-gray-300 min-w-[150px]">Player</TableHead>
                                            <TableHead className="text-gray-300 min-w-[120px]">Date</TableHead>
                                            <TableHead className="text-gray-300 min-w-[150px]">Opponent</TableHead>
                                            <TableHead className="text-gray-300 text-center w-[80px]">Mins</TableHead>
                                            <TableHead className="text-gray-300 text-center w-[80px]">Goals</TableHead>
                                            <TableHead className="text-gray-300 text-center w-[80px]">Assists</TableHead>
                                            <TableHead className="text-gray-300 text-center w-[80px]">Shots</TableHead>
                                            <TableHead className="text-gray-300 text-center w-[80px]">Passes</TableHead>
                                            <TableHead className="text-gray-300 text-center w-[80px]">Succ. Passes</TableHead>
                                            <TableHead className="text-gray-300 text-center w-[80px]">Tackles</TableHead>
                                        </>
                                    ) : (
                                        <>
                                            <TableHead className="text-gray-300 min-w-[200px]">Player</TableHead>
                                            <TableHead className="text-gray-300 min-w-[200px]">Exercise</TableHead>
                                            <TableHead className="text-gray-300 text-center w-[100px]">PR 1</TableHead>
                                            <TableHead className="text-gray-300 text-center w-[100px]">PR 2</TableHead>
                                            <TableHead className="text-gray-300 text-center w-[100px]">PR 3</TableHead>
                                            <TableHead className="text-gray-300 text-center w-[100px]">PR 4</TableHead>
                                        </>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((row) => (
                                    <TableRow key={mode === 'match_stats' ? `${row.match_id}-${row.player_name}` : `${row.player_name}-${row.exercise}`} className="border-white/5 hover:bg-white/5">
                                        {mode === 'match_stats' ? (
                                            <>
                                                <TableCell className="font-medium text-white">{row.player_name}</TableCell>
                                                <TableCell className="text-gray-400 text-xs">{row.match_date}</TableCell>
                                                <TableCell className="text-gray-400 text-xs">{row.match_opponent}</TableCell>

                                                <EditableCell row={row} field="minutes_played" val={row.minutes_played} onUpdate={handleUpdate} />
                                                <EditableCell row={row} field="goals" val={row.goals} onUpdate={handleUpdate} highlight />
                                                <EditableCell row={row} field="assists" val={row.assists} onUpdate={handleUpdate} highlight />
                                                <EditableCell row={row} field="total_shots" val={row.total_shots} onUpdate={handleUpdate} />
                                                <EditableCell row={row} field="total_passes" val={row.total_passes} onUpdate={handleUpdate} />
                                                <EditableCell row={row} field="successful_passes" val={row.successful_passes} onUpdate={handleUpdate} />
                                                <EditableCell row={row} field="total_tackles" val={row.total_tackles} onUpdate={handleUpdate} />
                                            </>
                                        ) : (
                                            <>
                                                <TableCell className="font-medium text-white">{row.player_name}</TableCell>
                                                <TableCell className="text-blue-300 font-medium">{row.exercise}</TableCell>
                                                <EditableCell row={row} field="pr_1" val={row.pr_1} onUpdate={handleUpdate} />
                                                <EditableCell row={row} field="pr_2" val={row.pr_2} onUpdate={handleUpdate} />
                                                <EditableCell row={row} field="pr_3" val={row.pr_3} onUpdate={handleUpdate} />
                                                <EditableCell row={row} field="pr_4" val={row.pr_4} onUpdate={handleUpdate} />
                                            </>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </Card>
        </div>
    );
}

const EditableCell = ({ row, field, val, onUpdate, highlight }: any) => {
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
                value={localVal}
                onChange={(e) => setLocalVal(e.target.value)}
                onBlur={handleBlur}
                className={`h-8 w-full text-center bg-transparent border-transparent hover:border-white/20 focus:bg-white/10 focus:border-blue-500 transition-all ${highlight ? 'text-green-400 font-bold' : 'text-gray-300'}`}
            />
        </TableCell>
    )
}
