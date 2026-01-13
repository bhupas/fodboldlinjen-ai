"use client";

import { useState, useEffect } from "react";
import { Download, Bot, Sparkles, FileText, BrainCircuit, Pencil, Save, Users, Calendar, User, History, Trash2, Eye, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getMetadata, MetadataOptions } from "@/lib/services/metadata";
import { getSavedReports, saveReport, deleteReport, SavedReport } from "@/lib/services/reports";
import { ComboSelect } from "@/components/ui/combo-select";
import { FilterPanel } from "@/components/ui/filter-panel";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";

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

    // History State
    const [savedReports, setSavedReports] = useState<SavedReport[]>([]);

    useEffect(() => {
        const loadJava = async () => {
            const [meta, reports] = await Promise.all([
                getMetadata(),
                getSavedReports()
            ]);
            setMetadata(meta);
            setSavedReports(reports);
            setLoadingData(false);
        };
        loadJava();
    }, []);

    // Get human-readable labels
    const getAnalysisTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'general': '📊 General Overview',
            'tactical': '🎯 Tactical Deep Dive',
            'individual': '👤 Individual Development',
            'physical_mental': '💪 Physical & Mental',
            'feedback': '💭 Feedback & Psychology'
        };
        return labels[type] || type;
    };

    const getScopeLabel = () => {
        if (scope === 'Team') return 'Full Squad';
        if (scope === 'Match') {
            const match = metadata.matches.find(m => m.id === selectedId);
            return match?.label || selectedId;
        }
        return selectedId;
    };

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

            // Save to database
            const saved = await saveReport(scope, getScopeLabel(), analysisType, data.report);
            if (saved) {
                setSavedReports(prev => [saved, ...prev]);
            }

        } catch (err: any) {
            console.error("AI Generation Error:", err);
            setReport(`Error generating report: ${err.message || "Unknown error occurred"}. Please try again.`);
        } finally {
            setGenerating(false);
        }
    };

    const handleDeleteReport = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const success = await deleteReport(id);
        if (success) {
            setSavedReports(prev => prev.filter(r => r.id !== id));
        }
    };

    const handleLoadReport = (saved: SavedReport) => {
        setReport(saved.report_content);
        setScope(saved.scope);
    };

    const downloadReport = async () => {
        if (!report) return;

        try {
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).default;

            const sourceElement = document.getElementById('report-view');
            if (!sourceElement) return;

            // 1. Prepare the container for generating pages
            const workContainer = document.createElement('div');
            workContainer.style.position = 'absolute';
            workContainer.style.left = '-9999px';
            workContainer.style.top = '0';
            workContainer.style.width = '794px'; // A4 width at 96 DPI
            workContainer.className = 'font-sans text-black bg-white';
            document.body.appendChild(workContainer);

            // 2. Styles for the print pages
            const pageStyle = {
                width: '794px',
                minHeight: '1120px', // A4 height
                padding: '40px 60px',
                backgroundColor: 'white',
                boxSizing: 'border-box' as const,
                position: 'relative' as const,
                overflow: 'hidden' as const,
                borderBottom: '1px solid #eee' // visual separator while debugging
            };

            const createNewPage = (pageNum: number) => {
                const page = document.createElement('div');
                Object.assign(page.style, pageStyle);

                // Add Header
                page.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 30px;">
                        <div>
                            <h1 style="font-size: 24px; font-weight: bold; margin: 0; text-transform: uppercase; color: #000;">AI Coach Analysis</h1>
                            <p style="font-size: 10px; margin: 5px 0 0 0; color: #444;">PROFESSIONAL TACTICAL REPORT</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="font-size: 14px; margin: 0; font-weight: bold; color: #000;">myaitrainer</p>
                            <p style="font-size: 10px; margin: 0; color: #666;">Page ${pageNum} • ${new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div class="page-content" style="font-size: 12px; line-height: 1.5; color: #000;"></div>
                `;
                return page;
            };

            // 3. Process Content and Paginate
            let currentPage = createNewPage(1);
            let contentContainer = currentPage.querySelector('.page-content') as HTMLElement;
            workContainer.appendChild(currentPage);

            let pageNum = 1;
            const contentNodes = Array.from(sourceElement.children);

            // Helper to clean styles of a node
            const cleanNode = (node: Element) => {
                const cloned = node.cloneNode(true) as HTMLElement;
                // Strip all classes that give color
                cloned.className = '';
                cloned.style.color = '#000000';
                cloned.style.backgroundColor = 'transparent';
                cloned.style.border = 'none';

                // Fix headers
                if (['H1', 'H2', 'H3'].includes(cloned.tagName)) {
                    cloned.style.marginTop = '20px';
                    cloned.style.marginBottom = '10px';
                    cloned.style.fontWeight = 'bold';
                    cloned.style.textTransform = 'uppercase';
                    cloned.style.borderBottom = cloned.tagName === 'H2' ? '1px solid #000' : 'none';
                    cloned.style.paddingBottom = cloned.tagName === 'H2' ? '5px' : '0';
                }

                // Fix Lists/Cards styling from the image provided
                // The image showed grey boxes. We want to convert them to simple clear text blocks.
                if (cloned.tagName === 'DIV' || cloned.tagName === 'P') {
                    // Check if it was one of those grid/flex rows
                    const isGrid = node.className.includes('grid') || node.className.includes('flex');
                    if (isGrid) {
                        cloned.style.display = 'block';
                        cloned.style.marginBottom = '8px';
                        cloned.style.padding = '0';
                    }
                }

                // Aggressive recursive styling for children to remove colors
                const children = cloned.querySelectorAll('*');
                children.forEach((child: any) => {
                    child.style.color = '#000000';
                    child.style.backgroundColor = 'transparent';
                    // Convert badges/chips to bold text
                    if (child.className && typeof child.className === 'string' && child.className.includes('Badge')) {
                        child.style.border = '1px solid #000';
                        child.style.padding = '2px 4px';
                        child.style.borderRadius = '4px';
                    }
                });

                return cloned;
            };

            for (const node of contentNodes) {
                // If it's a spacer div, skip
                if (node.tagName === 'DIV' && node.className === 'h-4') continue;

                const cleanElement = cleanNode(node);
                contentContainer.appendChild(cleanElement);

                // Check overflow
                // We use a safe height of approx 950px for content area (1120 total - margins)
                if (contentContainer.getBoundingClientRect().height > 850) {
                    // Oops, this element made it overflow.
                    // Remove it from this page
                    contentContainer.removeChild(cleanElement);

                    // Start new page
                    pageNum++;
                    currentPage = createNewPage(pageNum);
                    contentContainer = currentPage.querySelector('.page-content') as HTMLElement;
                    workContainer.appendChild(currentPage);

                    // Add element to new page
                    contentContainer.appendChild(cleanElement);
                }
            }

            // Add Footer to last page
            const footer = document.createElement('div');
            footer.innerHTML = `
                <div style="margin-top: 40px; border-top: 1px solid #ccc; padding-top: 10px; text-align: center; font-size: 9px; color: #888;">
                    <p>Generated by myaitrainer Intelligence Platform • Confidential Team Analysis</p>
                </div>
            `;
            // Check if footer fits, else new page (rare but possible)
            contentContainer.appendChild(footer);
            if (contentContainer.getBoundingClientRect().height > 900) {
                contentContainer.removeChild(footer);
                pageNum++;
                currentPage = createNewPage(pageNum);
                contentContainer = currentPage.querySelector('.page-content') as HTMLElement;
                workContainer.appendChild(currentPage);
                contentContainer.appendChild(footer);
            }


            // 4. Generate PDF from Pages
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pages = Array.from(workContainer.children);

            for (let i = 0; i < pages.length; i++) {
                const pageElement = pages[i] as HTMLElement;
                const canvas = await html2canvas(pageElement, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff'
                });

                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();

                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            }

            pdf.save(`myaitrainer_Report_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.removeChild(workContainer);

        } catch (error) {
            console.error("PDF Export failed", error);
            const blob = new Blob([report], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `myaitrainer_Analysis.txt`;
            a.click();
        }
    };

    return (
        <div className="space-y-8">
            <PageHeader
                icon={BrainCircuit}
                iconColor="purple"
                title="AI"
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
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in-50 duration-500">
                {/* History Sidebar */}
                <Card className="lg:col-span-1 glass-card p-4 space-y-4 h-auto lg:h-[600px] flex flex-col">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground pb-2 border-b border-border">
                        <History size={16} className="text-primary" />
                        Analysis History
                        <Badge variant="secondary" className="ml-auto text-xs">{savedReports.length}</Badge>
                    </div>

                    <ScrollArea className="flex-1 -mx-2 px-2">
                        <div className="space-y-2">
                            {savedReports.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Clock size={24} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-xs">No saved reports yet.</p>
                                </div>
                            ) : (
                                savedReports.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleLoadReport(item)}
                                        className="group relative flex flex-col gap-1 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 border border-transparent hover:border-primary/20 transition-all cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <span className="text-xs font-semibold text-foreground truncate flex-1">
                                                {item.target_label}
                                            </span>
                                            <button
                                                onClick={(e) => handleDeleteReport(e, item.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 text-destructive rounded transition-all"
                                                title="Delete report"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                            <Badge variant="outline" className="text-[9px] h-4 px-1 py-0 border-border/50">
                                                {item.scope}
                                            </Badge>
                                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <span className="text-[10px] text-primary/70 truncate">
                                            {getAnalysisTypeLabel(item.analysis_type)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </Card>

                {/* Main Report Panel */}
                <Card className="lg:col-span-3 flex flex-col glass-card overflow-hidden relative min-h-[600px] h-auto">
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
