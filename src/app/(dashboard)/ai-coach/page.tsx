"use client";

import { useState, useEffect } from "react";
import { Download, Bot, Sparkles, Filter, FileText, User, Calendar, Users, Zap, ArrowRight, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getMetadata, MetadataOptions } from "@/lib/services/metadata";
import { ComboSelect } from "@/components/ui/combo-select";
import { PageHeader } from "@/components/ui/page-header";

export default function AICoachPage() {
    const [metadata, setMetadata] = useState<MetadataOptions>({ matches: [], players: [] });
    const [loadingData, setLoadingData] = useState(true);

    // Selection State
    const [scope, setScope] = useState<'Team' | 'Match' | 'Player'>('Team');
    const [selectedId, setSelectedId] = useState<string>("");
    const [analysisType, setAnalysisType] = useState<string>("general");

    // Report State
    const [report, setReport] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        getMetadata().then(data => {
            setMetadata(data);
            setLoadingData(false);
        });
    }, []);

    const handleGenerate = async () => {
        setGenerating(true);
        setReport(null);
        try {
            const res = await fetch('/api/ai-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scope,
                    id: selectedId,
                    type: analysisType
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setReport(data.report);
        } catch (err: any) {
            console.error("AI Generation Error:", err);
            setReport(`Error generating report: ${err.message || "Unknown error occurred"}. Please try again.`);
        } finally {
            setGenerating(false);
        }
    };

    const downloadReport = () => {
        if (!report) return;
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AI_Coach_Report_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                icon={BrainCircuit}
                iconColor="purple"
                title="AI Coach"
                description="Get AI-powered tactical insights and analysis"
            />

            <div className="h-auto min-h-[calc(100vh-250px)] w-full flex flex-col md:flex-row gap-6">
                {/* Left Panel: Configuration */}
                <Card className="w-full md:w-1/3 flex flex-col glass-card overflow-hidden h-auto md:h-full">
                    <div className="p-6 border-b border-border bg-muted/30">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <Sparkles className="text-primary" />
                            Analysis Configuration
                        </h2>
                        <p className="text-sm text-muted-foreground mt-2">Configure the AI to generate a specific tactical report.</p>
                    </div>

                    <div className="p-6 space-y-8 flex-1 overflow-y-auto">
                        {/* Scope Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Filter size={16} /> Analysis Scope
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => setScope('Team')}
                                    className={cn(
                                        "p-3 rounded-xl text-sm font-medium transition-all border",
                                        scope === 'Team'
                                            ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20"
                                            : "bg-muted border-border text-muted-foreground hover:bg-accent"
                                    )}
                                >
                                    <div className="flex flex-col items-center gap-1">
                                        <Users size={18} />
                                        Team
                                    </div>
                                </button>
                                <button
                                    onClick={() => setScope('Match')}
                                    className={cn(
                                        "p-3 rounded-xl text-sm font-medium transition-all border",
                                        scope === 'Match'
                                            ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20"
                                            : "bg-muted border-border text-muted-foreground hover:bg-accent"
                                    )}
                                >
                                    <div className="flex flex-col items-center gap-1">
                                        <Calendar size={18} />
                                        Match
                                    </div>
                                </button>
                                <button
                                    onClick={() => setScope('Player')}
                                    className={cn(
                                        "p-3 rounded-xl text-sm font-medium transition-all border",
                                        scope === 'Player'
                                            ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20"
                                            : "bg-muted border-border text-muted-foreground hover:bg-accent"
                                    )}
                                >
                                    <div className="flex flex-col items-center gap-1">
                                        <User size={18} />
                                        Player
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Dynamic Selection */}
                        {scope === 'Match' && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                <label className="text-sm font-medium text-foreground">Select Match</label>
                                <ComboSelect
                                    options={metadata.matches.map(m => ({ label: m.label, value: m.id }))}
                                    value={selectedId}
                                    onValueChange={setSelectedId}
                                    placeholder="Select a match..."
                                    searchPlaceholder="Search matches..."
                                />
                            </div>
                        )}

                        {scope === 'Player' && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                <label className="text-sm font-medium text-foreground">Select Player</label>
                                <ComboSelect
                                    options={metadata.players.map(p => ({ label: p, value: p }))}
                                    value={selectedId}
                                    onValueChange={setSelectedId}
                                    placeholder="Select a player..."
                                    searchPlaceholder="Search players..."
                                />
                            </div>
                        )}

                        {/* Analysis Type */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-foreground">Analysis Focus</label>
                            <Select onValueChange={setAnalysisType} defaultValue="general">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="general">📊 General Overview</SelectItem>
                                    <SelectItem value="tactical">🎯 Tactical Deep Dive</SelectItem>
                                    <SelectItem value="individual">👤 Individual Development</SelectItem>
                                    <SelectItem value="physical_mental">💪 Physical & Mental</SelectItem>
                                    <SelectItem value="feedback">💭 Feedback & Psychology</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Quick Actions */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Zap size={16} className="text-yellow-500" /> Quick Actions
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                <Button
                                    variant="outline"
                                    className="justify-start text-left h-auto py-3"
                                    onClick={() => {
                                        if (metadata.matches.length > 0) {
                                            setScope('Match');
                                            setSelectedId(metadata.matches[0].id);
                                            setAnalysisType('tactical');
                                        }
                                    }}
                                >
                                    <div>
                                        <div className="font-medium text-xs">Analyze Last Match</div>
                                        <div className="text-[10px] text-muted-foreground">Deep dive into latest game</div>
                                    </div>
                                    <ArrowRight size={14} className="ml-auto text-muted-foreground" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="justify-start text-left h-auto py-3"
                                    onClick={() => {
                                        setScope('Team');
                                        setAnalysisType('physical_mental');
                                    }}
                                >
                                    <div>
                                        <div className="font-medium text-xs">Team Fitness Report</div>
                                        <div className="text-[10px] text-muted-foreground">Review gym & physical state</div>
                                    </div>
                                    <ArrowRight size={14} className="ml-auto text-muted-foreground" />
                                </Button>
                            </div>
                        </div>

                        <Button
                            onClick={handleGenerate}
                            disabled={generating || (scope !== 'Team' && !selectedId)}
                            className="w-full btn-premium h-12 text-lg"
                        >
                            {generating ? (
                                <>
                                    <Bot className="mr-2 animate-bounce" /> Analyzing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2" /> Generate Report
                                </>
                            )}
                        </Button>
                    </div>
                </Card>

                {/* Right Panel: Output */}
                <Card className="flex-1 flex flex-col glass-card overflow-hidden relative min-h-[500px] h-auto md:h-full">
                    <div className="p-6 border-b border-border bg-muted/30 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <FileText className="text-purple-500" />
                            AI Analysis Report
                        </h2>
                        {report && (
                            <Button variant="outline" size="sm" onClick={downloadReport}>
                                <Download size={16} className="mr-2" /> Export
                            </Button>
                        )}
                    </div>

                    <ScrollArea className="flex-1 p-8 bg-muted/20 relative">
                        {!report && !generating && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/50 pointer-events-none">
                                <Bot size={64} className="mb-4" />
                                <p className="text-lg">Select parameters and generate to see insights.</p>
                            </div>
                        )}

                        {generating && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Bot size={24} className="text-primary" />
                                    </div>
                                </div>
                                <p className="text-primary animate-pulse">Consulting Tactical Database...</p>
                            </div>
                        )}

                        {report && (
                            <div className="prose prose-invert dark:prose-invert max-w-none text-foreground">
                                {report.split('\n').map((line, i) => {
                                    const key = `line-${i}`;

                                    if (line.startsWith('## ')) {
                                        return <h2 key={key} className="text-2xl font-bold text-primary mt-8 mb-4 pb-2 border-b border-border">{line.replace('## ', '')}</h2>;
                                    }
                                    if (line.startsWith('### ')) {
                                        return <h3 key={key} className="text-xl font-bold text-purple-500 mt-6 mb-3">{line.replace('### ', '')}</h3>;
                                    }

                                    if (line.startsWith('|')) {
                                        if (line.includes('---')) return null;
                                        const cells = line.split('|').filter(c => c.trim() !== '');
                                        return (
                                            <div key={key} className="grid grid-flow-col auto-cols-auto gap-4 py-2 border-b border-border/50 hover:bg-accent/50 px-2 rounded">
                                                {cells.map((cell, idx) => (
                                                    <div key={idx} className={cn("text-sm", i > 0 && report.split('\n')[i - 1].startsWith('|') ? "" : "font-bold text-primary")}>
                                                        {cell.replace(/\*\*(.*?)\*\*/g, '$1').trim()}
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    }

                                    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                                        return (
                                            <div key={key} className="flex gap-2 mb-2 ml-4">
                                                <span className="text-primary">•</span>
                                                <span dangerouslySetInnerHTML={{
                                                    __html: line.replace(/^[\-\*]\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
                                                }} />
                                            </div>
                                        );
                                    }

                                    if (/^\d+\./.test(line.trim())) {
                                        return (
                                            <div key={key} className="flex gap-2 mb-3 ml-2">
                                                <span className="text-primary font-bold min-w-[20px]">{line.match(/^\d+\./)?.[0]}</span>
                                                <span dangerouslySetInnerHTML={{
                                                    __html: line.replace(/^\d+\.\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
                                                }} />
                                            </div>
                                        );
                                    }

                                    if (line.trim() === '') {
                                        return <div key={key} className="h-2" />;
                                    }

                                    return (
                                        <p key={key} className="mb-2 leading-relaxed" dangerouslySetInnerHTML={{
                                            __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
                                        }} />
                                    );
                                })}
                            </div>
                        )}
                    </ScrollArea>
                </Card>
            </div>
        </div>
    );
}
