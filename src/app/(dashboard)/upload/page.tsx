"use client";

import { useState } from "react";
import { parseFile } from "@/lib/parser";
import { uploadData } from "@/lib/services/data";
import { UploadCloud, CheckCircle, AlertTriangle, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { MiniStat } from "@/components/ui/stats-display";
import { Card } from "@/components/ui/card";

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
            const parsedData = await parseFile(file);
            setStats(s => ({ ...s, processed: parsedData.length }));

            if (parsedData.length === 0) {
                throw new Error("No valid data found in file.");
            }

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
            <PageHeader
                icon={Upload}
                iconColor="blue"
                title="Upload Match Data"
                description="Import your Excel/CSV files to update player stats and match analytics."
            />

            <Card
                className={cn(
                    "glass-card border-2 border-dashed p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer",
                    isDragging ? "border-primary bg-primary/10 scale-[1.02]" : "border-border hover:border-primary/50",
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

                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                    {isProcessing ? <Loader2 className="animate-spin text-white" size={32} /> : <UploadCloud className="text-white" size={32} />}
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-2">
                    {isProcessing ? "Processing Data..." : "Drag & Drop or Click to Upload"}
                </h3>
                <p className="text-muted-foreground max-w-sm">
                    Supports .xlsx and .csv files with standard myaitrainer columns.
                </p>
            </Card>

            {status.message && (
                <div className={cn(
                    "p-4 rounded-xl flex items-center gap-3",
                    status.type === 'success' ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-destructive/10 text-destructive border border-destructive/20"
                )}>
                    {status.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                    <span className="font-medium">{status.message}</span>
                </div>
            )}

            {stats.uploaded > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MiniStat
                        icon={FileSpreadsheet}
                        label="Rows Parsed"
                        value={stats.processed}
                        color="blue"
                    />
                    <MiniStat
                        icon={CheckCircle}
                        label="Records Saved"
                        value={stats.uploaded}
                        color="green"
                    />
                </div>
            )}
        </div>
    );
}
