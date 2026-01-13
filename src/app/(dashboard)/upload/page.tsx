"use client";

import { useState, useCallback } from "react";
import { UploadCloud, CheckCircle, AlertTriangle, FileSpreadsheet, Loader2, Upload, RefreshCw, ChevronDown, ChevronUp, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UploadStatus {
    type: 'success' | 'error' | 'info' | 'warning' | null;
    message: string;
}

interface UploadStats {
    processed: number;
    uploaded: number;
    failed: number;
    fileName: string;
    fileSize: string;
    dataType: string;
}

interface UploadError {
    id: string;
    message: string;
    details?: string;
}

export default function UploadPage() {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<UploadStatus>({ type: null, message: '' });
    const [stats, setStats] = useState<UploadStats>({
        processed: 0,
        uploaded: 0,
        failed: 0,
        fileName: '',
        fileSize: '',
        dataType: ''
    });
    const [progress, setProgress] = useState(0);
    const [errors, setErrors] = useState<UploadError[]>([]);
    const [showErrors, setShowErrors] = useState(true);

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleFile = useCallback(async (file: File) => {
        if (!file) return;

        // Reset state
        setIsProcessing(true);
        setErrors([]);
        setStatus({ type: 'info', message: 'Reading file...' });
        setProgress(10);
        setStats({
            processed: 0,
            uploaded: 0,
            failed: 0,
            fileName: file.name,
            fileSize: formatFileSize(file.size),
            dataType: ''
        });

        try {
            // Dynamic import for better performance - xlsx is loaded only when needed
            setStatus({ type: 'info', message: 'Parsing data...' });
            setProgress(20);
            const { parseFile } = await import("@/lib/parser");

            setProgress(40);
            const parsedData = await parseFile(file);

            if (parsedData.length === 0) {
                throw new Error("No valid data found in file. Please check the file format and column headers.");
            }

            // Determine data type
            const dataType = parsedData[0]?._type === 'performance' ? 'Gym/Performance' : 'Match Statistics';
            setStats(s => ({ ...s, processed: parsedData.length, dataType }));

            setStatus({ type: 'info', message: `Uploading ${parsedData.length} ${dataType} records...` });
            setProgress(60);

            // Dynamic import for upload service
            const { uploadData } = await import("@/lib/services/data");
            const result = await uploadData(parsedData);

            setProgress(100);

            // Process errors with more detail
            const uploadErrors: UploadError[] = result.errors.map((err: string, idx: number) => ({
                id: `error-${idx}`,
                message: err,
                details: extractErrorDetails(err)
            }));

            setErrors(uploadErrors);

            const failedCount = result.errors.length;
            setStats(s => ({
                ...s,
                uploaded: result.successCount,
                failed: failedCount
            }));

            if (failedCount > 0 && result.successCount === 0) {
                setStatus({
                    type: 'error',
                    message: `Upload failed. ${failedCount} error(s) occurred.`
                });
            } else if (failedCount > 0) {
                setStatus({
                    type: 'warning',
                    message: `Partially completed. ${result.successCount} saved, ${failedCount} failed.`
                });
            } else {
                const typeLabel = result.type === 'performance' ? 'Performance Records' : 'Match Statistics';
                setStatus({
                    type: 'success',
                    message: `Successfully uploaded ${result.successCount} ${typeLabel}!`
                });
            }
        } catch (err: any) {
            console.error(err);
            setStatus({ type: 'error', message: err.message || "Failed to process file." });
            setErrors([{
                id: 'parse-error',
                message: err.message || "Unknown error occurred",
                details: "Check if the file format is correct and contains valid data."
            }]);
            setProgress(0);
        } finally {
            setIsProcessing(false);
        }
    }, []);

    // Extract more useful error details
    const extractErrorDetails = (error: string): string => {
        if (error.includes('duplicate key')) {
            return "This record already exists. Consider updating instead of inserting.";
        }
        if (error.includes('violates foreign key')) {
            return "Referenced match or player doesn't exist.";
        }
        if (error.includes('not authenticated')) {
            return "Please log in again and try uploading.";
        }
        if (error.includes('permission denied')) {
            return "You don't have permission to upload this data.";
        }
        return "";
    };

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const onDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.csv') || file.name.endsWith('.xls'))) {
            await handleFile(file);
        } else {
            setStatus({ type: 'error', message: "Please upload a valid .xlsx, .xls, or .csv file." });
        }
    }, [handleFile]);

    const onFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await handleFile(e.target.files[0]);
        }
    }, [handleFile]);

    const resetUpload = useCallback(() => {
        setStatus({ type: null, message: '' });
        setStats({ processed: 0, uploaded: 0, failed: 0, fileName: '', fileSize: '', dataType: '' });
        setProgress(0);
        setErrors([]);
    }, []);

    const dismissError = useCallback((id: string) => {
        setErrors(prev => prev.filter(e => e.id !== id));
    }, []);

    return (
        <div className="space-y-6">
            <PageHeader
                icon={Upload}
                iconColor="blue"
                title="Upload Data"
                description="Import your Excel/CSV files to update player stats and match analytics."
                actions={
                    (stats.uploaded > 0 || errors.length > 0) && (
                        <Button variant="outline" size="sm" onClick={resetUpload} className="gap-2">
                            <RefreshCw size={14} />
                            New Upload
                        </Button>
                    )
                }
            />

            {/* Drop Zone */}
            <Card
                className={cn(
                    "glass-card border-2 border-dashed p-8 md:p-12 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer group",
                    isDragging ? "border-primary bg-primary/10 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-primary/5",
                    isProcessing && "opacity-70 pointer-events-none"
                )}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => !isProcessing && document.getElementById('file-input')?.click()}
            >
                <input
                    type="file"
                    id="file-input"
                    className="hidden"
                    accept=".xlsx,.csv,.xls"
                    onChange={onFileSelect}
                    disabled={isProcessing}
                />

                <div className={cn(
                    "w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-primary/20 transition-transform duration-300",
                    !isProcessing && "group-hover:scale-110"
                )}>
                    {isProcessing ? (
                        <Loader2 className="animate-spin text-white" size={36} />
                    ) : (
                        <UploadCloud className="text-white transition-transform group-hover:-translate-y-1" size={36} />
                    )}
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-2">
                    {isProcessing ? "Processing..." : "Drag & Drop or Click to Upload"}
                </h3>
                <p className="text-muted-foreground max-w-sm mb-4">
                    Supports .xlsx, .xls, and .csv files with match or gym data.
                </p>

                {/* Progress bar */}
                {isProcessing && (
                    <div className="w-full max-w-xs mt-4">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{status.message}</p>
                    </div>
                )}

                {/* File type hints */}
                {!isProcessing && !stats.uploaded && errors.length === 0 && (
                    <div className="flex gap-4 mt-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <FileSpreadsheet size={14} className="text-green-500" />
                            <span>Match Data</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <FileSpreadsheet size={14} className="text-yellow-500" />
                            <span>Gym Data</span>
                        </div>
                    </div>
                )}
            </Card>

            {/* Status message */}
            {status.message && !isProcessing && (
                <div className={cn(
                    "p-4 rounded-xl flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300",
                    status.type === 'success' && "bg-green-500/10 text-green-500 border border-green-500/20",
                    status.type === 'error' && "bg-red-500/10 text-red-500 border border-red-500/20",
                    status.type === 'warning' && "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20",
                    status.type === 'info' && "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                )}>
                    {status.type === 'success' && <CheckCircle size={20} className="mt-0.5 flex-shrink-0" />}
                    {status.type === 'error' && <AlertTriangle size={20} className="mt-0.5 flex-shrink-0" />}
                    {status.type === 'warning' && <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />}
                    {status.type === 'info' && <Loader2 size={20} className="animate-spin mt-0.5 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                        <span className="font-semibold block">{status.message}</span>
                        {stats.fileName && (
                            <div className="text-xs opacity-70 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                <span>File: {stats.fileName}</span>
                                <span>Size: {stats.fileSize}</span>
                                {stats.dataType && <span>Type: {stats.dataType}</span>}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Error Details Section */}
            {errors.length > 0 && !isProcessing && (
                <Card className="glass-card overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                    {/* Header */}
                    <button
                        onClick={() => setShowErrors(!showErrors)}
                        className="w-full p-4 flex items-center justify-between bg-red-500/5 border-b border-red-500/10 hover:bg-red-500/10 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                                <AlertTriangle size={16} className="text-red-500" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-foreground">
                                    {errors.length} Error{errors.length > 1 ? 's' : ''} Occurred
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Click to {showErrors ? 'hide' : 'show'} details
                                </p>
                            </div>
                        </div>
                        {showErrors ? <ChevronUp size={20} className="text-muted-foreground" /> : <ChevronDown size={20} className="text-muted-foreground" />}
                    </button>

                    {/* Error List */}
                    {showErrors && (
                        <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                            {errors.map((error) => (
                                <div
                                    key={error.id}
                                    className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 flex items-start gap-3 group"
                                >
                                    <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <X size={12} className="text-red-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-foreground font-medium break-words">
                                            {error.message}
                                        </p>
                                        {error.details && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                💡 {error.details}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); dismissError(error.id); }}
                                        className="p-1 rounded hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                        title="Dismiss"
                                    >
                                        <X size={14} className="text-muted-foreground" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            {/* Stats cards */}
            {(stats.uploaded > 0 || stats.failed > 0) && !isProcessing && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-bottom-4 duration-500">
                    <StatCard
                        icon={FileSpreadsheet}
                        title="Rows Parsed"
                        value={stats.processed}
                        color="blue"
                    />
                    <StatCard
                        icon={CheckCircle}
                        title="Successfully Saved"
                        value={stats.uploaded}
                        color="green"
                    />
                    <StatCard
                        icon={AlertTriangle}
                        title="Failed"
                        value={stats.failed}
                        color={stats.failed > 0 ? "red" : "green"}
                    />
                </div>
            )}

            {/* Quick tips */}
            <Card className="glass-card p-6">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <span className="text-lg">💡</span>
                    Tips for Best Results
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">•</span>
                        <span><strong>Match data:</strong> Include columns like Player, Opponent, Date, Passes, Shots, Tackles, Goals, Assists</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-yellow-500 mt-0.5">•</span>
                        <span><strong>Gym data:</strong> Include columns like Player, Exercise, PR1, PR2, PR3, PR4</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>Duplicate entries are automatically updated (upsert) based on player + match/exercise</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-purple-500 mt-0.5">•</span>
                        <span>Files are processed entirely client-side for privacy before uploading to database</span>
                    </li>
                </ul>
            </Card>
        </div>
    );
}
