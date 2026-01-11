"use client";

import { useState, useEffect } from "react";
import { Download, Bot, Sparkles, Filter, FileText, User, Calendar, Users, Zap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getMetadata, MetadataOptions } from "@/lib/services/metadata";
import { ComboSelect } from "@/components/ui/combo-select";

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
        <div className="h-auto min-h-[calc(100vh-100px)] md:h-[calc(100vh-100px)] w-full flex flex-col md:flex-row gap-6 p-4">
            {/* Left Panel: Configuration */}
            <Card className="w-full md:w-1/3 flex flex-col glass-panel border-0 shadow-2xl overflow-hidden h-auto md:h-full">
                <div className="p-6 border-b border-white/10 bg-black/20">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="text-blue-400" />
                        Analysis Configuration
                    </h2>
                    <p className="text-sm text-gray-400 mt-2">Configure the AI to generate a specific tactical report.</p>
                </div>

                <div className="p-6 space-y-8 flex-1 overflow-y-auto">
                    {/* Scope Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Filter size={16} /> Analysis Scope
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setScope('Team')}
                                className={cn(
                                    "p-3 rounded-lg text-sm font-medium transition-all border",
                                    scope === 'Team'
                                        ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
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
                                    "p-3 rounded-lg text-sm font-medium transition-all border",
                                    scope === 'Match'
                                        ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
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
                                    "p-3 rounded-lg text-sm font-medium transition-all border",
                                    scope === 'Player'
                                        ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
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
                            <label className="text-sm font-medium text-gray-300">Select Match</label>
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
                            <label className="text-sm font-medium text-gray-300">Select Player</label>
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
                        <label className="text-sm font-medium text-gray-300">Analysis Focus</label>
                        <Select onValueChange={setAnalysisType} defaultValue="general">
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                <SelectValue placeholder="Select type..." />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1e293b] border-white/10 text-white">
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
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Zap size={16} className="text-yellow-400" /> Quick Actions
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                            <Button
                                variant="outline"
                                className="justify-start text-left border-white/10 hover:bg-white/5 text-gray-300 h-auto py-3"
                                onClick={() => {
                                    if (metadata.matches.length > 0) {
                                        setScope('Match');
                                        setSelectedId(metadata.matches[0].id); // Assumes sorted by date desc
                                        setAnalysisType('tactical');
                                    }
                                }}
                            >
                                <div>
                                    <div className="text-white font-medium text-xs">Analyze Last Match</div>
                                    <div className="text-[10px] text-gray-500">Deep dive into latest game</div>
                                </div>
                                <ArrowRight size={14} className="ml-auto text-gray-500" />
                            </Button>
                            <Button
                                variant="outline"
                                className="justify-start text-left border-white/10 hover:bg-white/5 text-gray-300 h-auto py-3"
                                onClick={() => {
                                    setScope('Team');
                                    setAnalysisType('physical_mental');
                                }}
                            >
                                <div>
                                    <div className="text-white font-medium text-xs">Team Fitness Report</div>
                                    <div className="text-[10px] text-gray-500">Review gym & physical state</div>
                                </div>
                                <ArrowRight size={14} className="ml-auto text-gray-500" />
                            </Button>
                        </div>
                    </div>

                    <Button
                        onClick={handleGenerate}
                        disabled={generating || (scope !== 'Team' && !selectedId)}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white h-12 text-lg shadow-lg shadow-blue-500/20"
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
            <Card className="flex-1 flex flex-col glass-panel border-0 shadow-2xl overflow-hidden relative min-h-[500px] h-auto md:h-full">
                <div className="p-6 border-b border-white/10 bg-black/20 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FileText className="text-purple-400" />
                        AI Analysis Report
                    </h2>
                    {report && (
                        <Button variant="outline" size="sm" onClick={downloadReport} className="border-white/20 text-white hover:bg-white/10">
                            <Download size={16} className="mr-2" /> Export
                        </Button>
                    )}
                </div>

                <ScrollArea className="flex-1 p-8 bg-black/20 relative">
                    {!report && !generating && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 opacity-50 pointer-events-none">
                            <Bot size={64} className="mb-4 text-white/20" />
                            <p className="text-lg">Select parameters and generate to see insights.</p>
                        </div>
                    )}

                    {generating && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Bot size={24} className="text-blue-400" />
                                </div>
                            </div>
                            <p className="text-blue-200 animate-pulse">Consulting Tactical Database...</p>
                        </div>
                    )}

                    {report && (
                        <div className="prose prose-invert max-w-none text-gray-200">
                            {/* Improved Markdown Rendering */}
                            {report.split('\n').map((line, i) => {
                                const key = `line-${i}`;

                                // Headers
                                if (line.startsWith('## ')) {
                                    return <h2 key={key} className="text-2xl font-bold text-blue-300 mt-8 mb-4 pb-2 border-b border-white/10">{line.replace('## ', '')}</h2>;
                                }
                                if (line.startsWith('### ')) {
                                    return <h3 key={key} className="text-xl font-bold text-purple-300 mt-6 mb-3">{line.replace('### ', '')}</h3>;
                                }

                                // Tables
                                if (line.startsWith('|')) {
                                    if (line.includes('---')) return null; // Skip separator lines
                                    const cells = line.split('|').filter(c => c.trim() !== '');
                                    return (
                                        <div key={key} className="grid grid-flow-col auto-cols-auto gap-4 py-2 border-b border-white/5 hover:bg-white/5 px-2 rounded">
                                            {cells.map((cell, idx) => (
                                                <div key={idx} className={cn("text-sm", i > 0 && report.split('\n')[i - 1].startsWith('|') ? "" : "font-bold text-blue-200")}>
                                                    {cell.replace(/\*\*(.*?)\*\*/g, '$1').trim()}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                }

                                // Lists
                                if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                                    return (
                                        <div key={key} className="flex gap-2 mb-2 ml-4">
                                            <span className="text-blue-400">•</span>
                                            <span dangerouslySetInnerHTML={{
                                                __html: line.replace(/^[\-\*]\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                                            }} />
                                        </div>
                                    );
                                }

                                // Ordered Lists
                                if (/^\d+\./.test(line.trim())) {
                                    return (
                                        <div key={key} className="flex gap-2 mb-3 ml-2">
                                            <span className="text-blue-400 font-bold min-w-[20px]">{line.match(/^\d+\./)?.[0]}</span>
                                            <span dangerouslySetInnerHTML={{
                                                __html: line.replace(/^\d+\.\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                                            }} />
                                        </div>
                                    );
                                }

                                // Empty Lines
                                if (line.trim() === '') {
                                    return <div key={key} className="h-2" />;
                                }

                                // Normal Text (with bold support)
                                return (
                                    <p key={key} className="mb-2 leading-relaxed" dangerouslySetInnerHTML={{
                                        __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                                    }} />
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </Card>
        </div>
    );
}
