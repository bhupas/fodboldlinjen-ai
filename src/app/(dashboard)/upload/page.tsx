"use client";

import { useState } from "react";
import { parseFile } from "@/lib/parser";
import { uploadData } from "@/lib/services/data";
import { UploadCloud, CheckCircle, AlertTriangle, FileSpreadsheet, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function UploadPage() {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
    const [stats, setStats] = useState<{ processed: number, uploaded: number }>({ processed: 0, uploaded: 0 });

    const handleFile = async (file: File) => {
        if (!file) return;

        setIsProcessing(true);
        setStatus({ type: null, message: '' });

        try {
            // 1. Parse
            const parsedData = await parseFile(file);
            setStats(s => ({ ...s, processed: parsedData.length }));

            if (parsedData.length === 0) {
                throw new Error("No valid data found in file.");
            }

            // 2. Upload
            const result = await uploadData(parsedData);

            if (result.errors.length > 0) {
                console.warn("Some uploads failed:", result.errors);
                setStatus({ type: 'error', message: `Completed with warnings. ${result.successCount} saved, ${result.errors.length} failed.` });
            } else {
                setStatus({ type: 'success', message: `Successfully uploaded ${result.successCount} records!` });
            }
            setStats(s => ({ ...s, uploaded: result.successCount }));
        } catch (err: any) {
            console.error(err);
            setStatus({ type: 'error', message: err.message || "Failed to process file." });
        } finally {
            setIsProcessing(false);
        }
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.csv'))) {
            await handleFile(file);
        } else {
            setStatus({ type: 'error', message: "Please upload a valid .xlsx or .csv file." });
        }
    };

    const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await handleFile(e.target.files[0]);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-white">Upload Match Data</h1>
                <p className="text-gray-400">Import your Excel/CSV files to update player stats and match analytics.</p>
            </div>

            <div
                className={cn(
                    "glass-panel border-2 border-dashed p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer",
                    isDragging ? "border-blue-500 bg-blue-500/10 scale-[1.02]" : "border-white/20 hover:border-white/40",
                    isProcessing && "opacity-50 pointer-events-none"
                )}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => document.getElementById('file-input')?.click()}
            >
                <input
                    type="file"
                    id="file-input"
                    className="hidden"
                    accept=".xlsx,.csv"
                    onChange={onFileSelect}
                />

                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                    {isProcessing ? <Loader2 className="animate-spin text-white" size={32} /> : <UploadCloud className="text-white" size={32} />}
                </div>

                <h3 className="text-xl font-semibold text-white mb-2">
                    {isProcessing ? "Processing Data..." : "Drag & Drop or Click to Upload"}
                </h3>
                <p className="text-gray-400 max-w-sm">
                    Supports .xlsx and .csv files with standard myaitrainer columns.
                </p>
            </div>

            {status.message && (
                <div className={cn(
                    "p-4 rounded-lg flex items-center gap-3",
                    status.type === 'success' ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                )}>
                    {status.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                    <span className="font-medium">{status.message}</span>
                </div>
            )}

            {stats.uploaded > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-card p-6 flex items-center gap-4">
                        <div className="bg-blue-500/20 p-3 rounded-lg text-blue-400">
                            <FileSpreadsheet size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Rows Parsed</p>
                            <p className="text-2xl font-bold text-white">{stats.processed}</p>
                        </div>
                    </div>
                    <div className="glass-card p-6 flex items-center gap-4">
                        <div className="bg-green-500/20 p-3 rounded-lg text-green-400">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Records Saved</p>
                            <p className="text-2xl font-bold text-white">{stats.uploaded}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
