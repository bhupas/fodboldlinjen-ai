"use client";

import { useState, useEffect } from "react";
import { Download, Bot, Sparkles, Filter, FileText, User, Calendar, Users, Zap, ArrowRight, BrainCircuit, Pencil, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getMetadata, MetadataOptions } from "@/lib/services/metadata";
import { ComboSelect } from "@/components/ui/combo-select";
import { FilterPanel } from "@/components/ui/filter-panel";
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
    const [isEditing, setIsEditing] = useState(false);

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

    const downloadReport = async () => {
        if (!report) return;

        try {
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).default;

            const element = document.getElementById('report-view');
            if (!element) return;

            // Create a temporary container for the PDF render
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.style.width = '794px'; // ~A4 width at 96dpi (210mm)
            container.style.backgroundColor = '#ffffff'; // Force white background
            container.style.color = '#000000'; // Force black text
            container.style.padding = '40px';
            container.style.fontFamily = 'Arial, sans-serif'; // Standard font

            // Re-render content without dark mode classes
            // We just use basic markdown-like structure for the print report.
            // Ideally we'd clone the element and strip classes, but cloning preserves computed styles (like yellow text).
            // So we'll inject the html string but inside a "prose" wrapper that is NOT inverted.
            // Actually, simply cloning and overriding CSS variables is easiest if we use Tailwind prose

            container.className = 'prose max-w-none text-black bg-white';
            // We manually style the inner HTML to ensure high contrast
            const cleanContent = element.innerHTML
                .replace(/text-primary/g, 'text-black font-bold') // Replace primary color with bold black
                .replace(/text-purple-500/g, 'text-black font-bold uppercase') // Replace purple headers
                .replace(/text-foreground/g, 'text-black')
                .replace(/text-muted-foreground/g, 'text-gray-600')
                .replace(/bg-muted\/30/g, 'bg-gray-100')
                .replace(/prose-invert/g, ''); // Remove invert

            container.innerHTML = `
                <div style="font-family: Arial, sans-serif; color: #000000;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
                        <div>
                            <h1 style="font-size: 28px; font-weight: bold; margin: 0; text-transform: uppercase;">AI Coach Analysis</h1>
                            <p style="font-size: 14px; margin: 5px 0 0 0; color: #444;">Professional Tactical Report</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="font-size: 12px; margin: 0; font-weight: bold;">FODBOLDLINJEN AI</p>
                            <p style="font-size: 12px; margin: 0;">${new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                    
                    <div style="font-size: 12px; line-height: 1.6;">
                        ${cleanContent}
                    </div>

                    <div style="margin-top: 50px; border-top: 1px solid #ccc; padding-top: 15px; text-align: center; font-size: 10px; color: #666;">
                        <p>Generated by Fodboldlinjen Intelligence Platform • Confidential Team Analysis</p>
                    </div>
                </div>
            `;

            document.body.appendChild(container);

            const canvas = await html2canvas(container, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
                onclone: (clonedDoc) => {
                    // Extra safety to force black styles in the cloned document before rendering
                    const allElements = clonedDoc.querySelectorAll('*');
                    allElements.forEach((el: any) => {
                        el.style.color = '#000000';
                        if (el.tagName === 'H1' || el.tagName === 'H2') {
                            el.style.borderBottomColor = '#000000';
                        }
                    });
                }
            });

            document.body.removeChild(container);

            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Add pages logic
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position -= pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            pdf.save(`AI_Coach_Report_${new Date().toISOString().split('T')[0]}.pdf`);

        } catch (error) {
            console.error("PDF Export failed", error);
            const blob = new Blob([report], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `AI_Coach_Report.txt`;
            a.click();
        }
    };

    return (
        <div className="space-y-8">
            <PageHeader
                icon={BrainCircuit}
                iconColor="purple"
                title="AI Coach"
                description="Get AI-powered tactical insights and analysis"
            />

            {/* Filter Configuration Panel */}
            <FilterPanel>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row gap-4 items-end">

                        {/* Scope Selector */}
                        <div className="w-full md:w-48">
                            <label className="text-xs text-muted-foreground mb-2 block font-medium">Analysis Scope</label>
                            <Select value={scope} onValueChange={(val: any) => setScope(val)}>
                                <SelectTrigger className="h-10">
                                    <div className="flex items-center gap-2">
                                        {scope === 'Team' && <Users size={16} />}
                                        {scope === 'Match' && <Calendar size={16} />}
                                        {scope === 'Player' && <User size={16} />}
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Team">Team Analysis</SelectItem>
                                    <SelectItem value="Match">Match Analysis</SelectItem>
                                    <SelectItem value="Player">Player Analysis</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Dynamic Context Selector */}
                        <div className="flex-1 w-full min-w-[200px]">
                            <label className="text-xs text-muted-foreground mb-2 block font-medium">
                                {scope === 'Team' ? 'Team Context' : scope === 'Match' ? 'Select Match' : 'Select Player'}
                            </label>
                            {scope === 'Team' ? (
                                <div className="h-10 px-3 flex items-center bg-muted/50 border border-border rounded-md text-sm text-muted-foreground cursor-not-allowed">
                                    Analyzing Full Squad Data
                                </div>
                            ) : scope === 'Match' ? (
                                <ComboSelect
                                    options={metadata.matches.map(m => ({ label: m.label, value: m.id }))}
                                    value={selectedId}
                                    onValueChange={setSelectedId}
                                    placeholder="Select a match..."
                                    searchPlaceholder="Search matches..."
                                />
                            ) : (
                                <ComboSelect
                                    options={metadata.players.map(p => ({ label: p, value: p }))}
                                    value={selectedId}
                                    onValueChange={setSelectedId}
                                    placeholder="Select a player..."
                                    searchPlaceholder="Search players..."
                                />
                            )}
                        </div>

                        {/* Analysis Type */}
                        <div className="w-full md:w-64">
                            <label className="text-xs text-muted-foreground mb-2 block font-medium">Analysis Focus</label>
                            <Select value={analysisType} onValueChange={setAnalysisType}>
                                <SelectTrigger className="h-10">
                                    <SelectValue />
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

                        {/* Generate Button */}
                        <Button
                            onClick={handleGenerate}
                            disabled={generating || (scope !== 'Team' && !selectedId)}
                            className="w-full md:w-auto btn-premium h-10 px-6"
                        >
                            {generating ? (
                                <>
                                    <Bot className="mr-2 animate-bounce w-4 h-4" /> Analyzing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 w-4 h-4" /> Generate Report
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </FilterPanel>

            {/* Report Output */}
            <div className="flex flex-col gap-6 animate-in fade-in-50 duration-500">

                {/* Right Panel: Output */}
                <Card className="flex-1 flex flex-col glass-card overflow-hidden relative min-h-[500px] h-auto md:h-full">
                    <div className="p-6 border-b border-border bg-muted/30 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <FileText className="text-purple-500" />
                            AI Analysis Report
                        </h2>
                        {report && !generating && (
                            <div className="flex gap-2">
                                {isEditing ? (
                                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">
                                        <Save size={16} className="mr-2" /> Done
                                    </Button>
                                ) : (
                                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                        <Pencil size={16} className="mr-2" /> Edit
                                    </Button>
                                )}
                                <Button variant="outline" size="sm" onClick={downloadReport}>
                                    <Download size={16} className="mr-2" /> Export
                                </Button>
                            </div>
                        )}
                    </div>

                    <ScrollArea className="flex-1 bg-muted/20 relative">
                        <div className="p-8 min-h-full">
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

                            {report && isEditing ? (
                                <textarea
                                    className="w-full h-full min-h-[500px] bg-background/50 p-4 rounded-lg border border-border resize-none font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    value={report}
                                    onChange={(e) => setReport(e.target.value)}
                                />
                            ) : report ? (
                                <div id="report-view" className="prose prose-invert dark:prose-invert max-w-none text-foreground">
                                    {report.split('\n').map((line, i) => {
                                        const key = `line-${i}`;

                                        if (line.startsWith('## ')) {
                                            return <h2 key={key} className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500 mt-8 mb-4 pb-2 border-b border-white/10 uppercase tracking-tight">{line.replace('## ', '')}</h2>;
                                        }
                                        if (line.startsWith('### ')) {
                                            return <h3 key={key} className="text-lg font-bold text-foreground mt-6 mb-3 flex items-center gap-2"><div className="h-4 w-1 bg-primary rounded-full" />{line.replace('### ', '')}</h3>;
                                        }

                                        if (line.startsWith('|')) {
                                            if (line.includes('---')) return null;
                                            const cells = line.split('|').filter(c => c.trim() !== '');
                                            return (
                                                <div key={key} className="grid grid-flow-col auto-cols-fr gap-4 py-3 border-b border-border/50 hover:bg-muted/50 px-3 rounded-lg transition-colors text-sm">
                                                    {cells.map((cell, idx) => (
                                                        <div key={idx} className={cn("flex items-center", i > 0 && report.split('\n')[i - 1].startsWith('|') ? "text-muted-foreground font-medium" : "text-primary font-bold uppercase text-xs tracking-wider")}>
                                                            {cell.replace(/\*\*(.*?)\*\*/g, '$1').trim()}
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        }

                                        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                                            return (
                                                <div key={key} className="flex gap-3 mb-2 ml-2 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                                                    <span className="text-primary mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                                    <span className="text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{
                                                        __html: line.replace(/^[\-\*]\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                                                    }} />
                                                </div>
                                            );
                                        }

                                        if (/^\d+\./.test(line.trim())) {
                                            return (
                                                <div key={key} className="flex gap-3 mb-3 ml-2 p-2 rounded-lg bg-muted/20 border border-transparent hover:border-border transition-all">
                                                    <span className="text-primary font-bold min-w-[20px]">{line.match(/^\d+\./)?.[0]}</span>
                                                    <span className="text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{
                                                        __html: line.replace(/^\d+\.\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                                                    }} />
                                                </div>
                                            );
                                        }

                                        if (line.trim() === '') {
                                            return <div key={key} className="h-4" />;
                                        }

                                        return (
                                            <p key={key} className="mb-2 leading-relaxed text-muted-foreground/90" dangerouslySetInnerHTML={{
                                                __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                                            }} />
                                        );
                                    })}
                                </div>
                            ) : null}
                        </div>
                    </ScrollArea>
                </Card>
            </div>
        </div >
    );
}
