"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FilterPanel } from "@/components/ui/filter-panel";
import { StatCard } from "@/components/ui/stat-card";
import { ComboSelect } from "@/components/ui/combo-select";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WordCloud from "@/components/dashboard/WordCloud";
import { Search, MessageSquare, Users, Target, BarChart3, TrendingUp, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { FeedbackEntry, FeedbackStats } from "@/lib/services/feedback";

interface FeedbackTabProps {
    feedback: FeedbackEntry[];
    feedbackStats: FeedbackStats | null;
    feedbackPlayers: string[];
    feedbackOpponents: string[];
}

export function FeedbackTab({ feedback, feedbackStats, feedbackPlayers, feedbackOpponents }: FeedbackTabProps) {
    const router = useRouter();

    // Filter state
    const [feedbackSearch, setFeedbackSearch] = useState("");
    const [selectedFeedbackPlayer, setSelectedFeedbackPlayer] = useState("all");
    const [selectedFeedbackOpponent, setSelectedFeedbackOpponent] = useState("all");
    const [showFilters, setShowFilters] = useState(false);

    // New filter states
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [minLength, setMinLength] = useState("");
    const [sortBy, setSortBy] = useState("newest");

    // Filtered feedback
    const filteredFeedback = useMemo(() => {
        let result = [...feedback];

        // Player filter
        if (selectedFeedbackPlayer !== "all") {
            result = result.filter(f => f.player_name === selectedFeedbackPlayer);
        }

        // Opponent filter
        if (selectedFeedbackOpponent !== "all") {
            result = result.filter(f => f.opponent === selectedFeedbackOpponent);
        }

        // Search filter
        if (feedbackSearch) {
            const searchLower = feedbackSearch.toLowerCase();
            result = result.filter(f =>
                f.feedback?.toLowerCase().includes(searchLower) ||
                f.player_name?.toLowerCase().includes(searchLower)
            );
        }

        // Date range filters
        if (startDate) {
            result = result.filter(f => f.match_date && new Date(f.match_date) >= new Date(startDate));
        }
        if (endDate) {
            result = result.filter(f => f.match_date && new Date(f.match_date) <= new Date(endDate));
        }

        // Minimum length filter
        if (minLength && !isNaN(Number(minLength))) {
            result = result.filter(f => (f.feedback?.length || 0) >= Number(minLength));
        }

        // Sorting
        switch (sortBy) {
            case "newest":
                result.sort((a, b) => new Date(b.match_date || 0).getTime() - new Date(a.match_date || 0).getTime());
                break;
            case "oldest":
                result.sort((a, b) => new Date(a.match_date || 0).getTime() - new Date(b.match_date || 0).getTime());
                break;
            case "longest":
                result.sort((a, b) => (b.feedback?.length || 0) - (a.feedback?.length || 0));
                break;
            case "player_asc":
                result.sort((a, b) => (a.player_name || "").localeCompare(b.player_name || ""));
                break;
        }

        return result;
    }, [feedback, selectedFeedbackPlayer, selectedFeedbackOpponent, feedbackSearch, startDate, endDate, minLength, sortBy]);

    // Count active filters
    const activeFilterCount = [
        selectedFeedbackPlayer !== "all",
        selectedFeedbackOpponent !== "all",
        startDate !== "",
        endDate !== "",
        minLength !== ""
    ].filter(Boolean).length;

    // Clear all filters
    const clearFilters = () => {
        setSelectedFeedbackPlayer("all");
        setSelectedFeedbackOpponent("all");
        setStartDate("");
        setEndDate("");
        setMinLength("");
        setSortBy("newest");
    };

    // Combined feedback text for wordcloud
    const feedbackText = useMemo(() => {
        return filteredFeedback.map(f => f.feedback).join(' ');
    }, [filteredFeedback]);

    // Theme analysis
    const themeAnalysis = useMemo(() => {
        const themes = {
            "Teknisk": ['pasninger', 'afleveringer', 'første berøring', 'boldkontrol', 'teknik', 'afslutninger', 'skud'],
            "Fysisk": ['pres', 'løb', 'tempo', 'hurtigere', 'aggressiv', 'erobringer', 'dueller'],
            "Taktisk": ['positionering', 'placering', 'rum', 'dybde', 'position', 'bevægelse'],
            "Mental": ['fokus', 'kommunikation', 'lyd', 'koncentration', 'snakke', 'mere', 'bedre']
        };

        const text = feedbackText.toLowerCase();
        const counts: Record<string, number> = {};

        for (const [theme, keywords] of Object.entries(themes)) {
            counts[theme] = keywords.reduce((sum, kw) => sum + (text.split(kw).length - 1), 0);
        }

        return counts;
    }, [feedbackText]);

    // Common improvement areas
    const improvementAreas = [
        { keyword: "pres", label: "Pressing & Intensity", icon: "⚡" },
        { keyword: "pasninger", label: "Passing Accuracy", icon: "🎯" },
        { keyword: "position", label: "Positioning", icon: "📍" },
        { keyword: "kommunikation", label: "Communication", icon: "🗣️" },
        { keyword: "tempo", label: "Game Tempo", icon: "⏱️" }
    ];

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Feedback" value={feedbackStats?.totalFeedback || 0} icon={MessageSquare} color="purple" />
                <StatCard title="Unique Players" value={feedbackStats?.uniquePlayers || 0} icon={Users} color="blue" />
                <StatCard title="Matches with Feedback" value={feedbackStats?.uniqueMatches || 0} icon={Target} color="green" />
                <StatCard title="Avg. Feedback Length" value={`${Math.round(feedbackStats?.avgFeedbackLength || 0)} chars`} icon={BarChart3} color="yellow" />
            </div>

            {/* Filter Panel */}
            <FilterPanel>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        {/* Search */}
                        <div className="flex-1 relative w-full">
                            <Label className="text-xs text-muted-foreground mb-2 block">Search Feedback</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                <Input
                                    placeholder="Search in feedback content..."
                                    value={feedbackSearch}
                                    onChange={(e) => setFeedbackSearch(e.target.value)}
                                    className="pl-9 pr-14 h-10"
                                />
                                {feedbackSearch && (
                                    <button
                                        onClick={() => setFeedbackSearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-destructive hover:underline"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Sort By */}
                        <div className="w-full md:w-48">
                            <Label className="text-xs text-muted-foreground mb-2 block">Sort By</Label>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">📅 Newest First</SelectItem>
                                    <SelectItem value="oldest">📅 Oldest First</SelectItem>
                                    <SelectItem value="longest">📝 Longest First</SelectItem>
                                    <SelectItem value="player_asc">👤 Player (A-Z)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            variant={showFilters ? "secondary" : "outline"}
                            className="gap-2 h-10"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <SlidersHorizontal size={16} />
                            Filters
                            {activeFilterCount > 0 && (
                                <Badge variant="secondary" className="ml-1 px-1.5 h-5 text-[10px]">{activeFilterCount}</Badge>
                            )}
                        </Button>
                    </div>

                    {showFilters && (
                        <div className="pt-4 border-t animate-in slide-in-from-top-2 fade-in duration-200 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                {/* Player Filter */}
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-2 block">Player</Label>
                                    <ComboSelect
                                        options={[{ label: "All Players", value: "all" }, ...feedbackPlayers.map(p => ({ label: p, value: p }))]}
                                        value={selectedFeedbackPlayer}
                                        onValueChange={setSelectedFeedbackPlayer}
                                        placeholder="Select player"
                                        searchPlaceholder="Type to search..."
                                    />
                                </div>

                                {/* Opponent Filter */}
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-2 block">Opponent</Label>
                                    <ComboSelect
                                        options={[{ label: "All Opponents", value: "all" }, ...feedbackOpponents.map(o => ({ label: o, value: o }))]}
                                        value={selectedFeedbackOpponent}
                                        onValueChange={setSelectedFeedbackOpponent}
                                        placeholder="Select opponent"
                                        searchPlaceholder="Type to search..."
                                    />
                                </div>

                                {/* Start Date */}
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-2 block">From Date</Label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="h-10"
                                    />
                                </div>

                                {/* End Date */}
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-2 block">To Date</Label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="h-10"
                                    />
                                </div>

                                {/* Min Length */}
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-2 block">Min Length (chars)</Label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 50"
                                        value={minLength}
                                        onChange={(e) => setMinLength(e.target.value)}
                                        className="h-10"
                                    />
                                </div>
                            </div>

                            {/* Active filters display & Clear button */}
                            {activeFilterCount > 0 && (
                                <div className="flex items-center gap-2 flex-wrap pt-2">
                                    <span className="text-xs text-muted-foreground">Active filters:</span>
                                    {selectedFeedbackPlayer !== "all" && (
                                        <Badge variant="secondary" className="gap-1">
                                            Player: {selectedFeedbackPlayer}
                                            <X size={12} className="cursor-pointer" onClick={() => setSelectedFeedbackPlayer("all")} />
                                        </Badge>
                                    )}
                                    {selectedFeedbackOpponent !== "all" && (
                                        <Badge variant="secondary" className="gap-1">
                                            vs {selectedFeedbackOpponent}
                                            <X size={12} className="cursor-pointer" onClick={() => setSelectedFeedbackOpponent("all")} />
                                        </Badge>
                                    )}
                                    {startDate && (
                                        <Badge variant="secondary" className="gap-1">
                                            From: {startDate}
                                            <X size={12} className="cursor-pointer" onClick={() => setStartDate("")} />
                                        </Badge>
                                    )}
                                    {endDate && (
                                        <Badge variant="secondary" className="gap-1">
                                            To: {endDate}
                                            <X size={12} className="cursor-pointer" onClick={() => setEndDate("")} />
                                        </Badge>
                                    )}
                                    {minLength && (
                                        <Badge variant="secondary" className="gap-1">
                                            Min: {minLength} chars
                                            <X size={12} className="cursor-pointer" onClick={() => setMinLength("")} />
                                        </Badge>
                                    )}
                                    <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive" onClick={clearFilters}>
                                        Clear All
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </FilterPanel>

            {/* Feedback Sub-tabs */}
            <Tabs defaultValue="wordcloud" className="w-full">
                <TabsList className="bg-muted p-1 rounded-xl">
                    <TabsTrigger value="wordcloud" className="rounded-lg">☁️ Word Cloud</TabsTrigger>
                    <TabsTrigger value="themes" className="rounded-lg">📊 Themes</TabsTrigger>
                    <TabsTrigger value="list" className="rounded-lg">📝 All Feedback</TabsTrigger>
                </TabsList>

                <TabsContent value="wordcloud" className="mt-6">
                    <Card className="glass-card p-6">
                        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <Sparkles className="text-purple-500 w-5 h-5" />
                            Feedback Word Cloud
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            Visual representation of the most common words in player feedback. Larger words appear more frequently.
                        </p>
                        <div className="flex justify-center bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl p-4">
                            <WordCloud text={feedbackText} width={700} height={350} className="rounded-lg" />
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="themes" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="glass-card p-6">
                            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <TrendingUp className="text-green-500 w-5 h-5" />
                                Feedback Themes
                            </h3>
                            <div className="space-y-4">
                                {Object.entries(themeAnalysis).sort((a, b) => b[1] - a[1]).map(([theme, count]) => {
                                    const maxCount = Math.max(...Object.values(themeAnalysis));
                                    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                                    const colors: Record<string, string> = {
                                        "Teknisk": "bg-blue-500",
                                        "Fysisk": "bg-green-500",
                                        "Taktisk": "bg-purple-500",
                                        "Mental": "bg-yellow-500"
                                    };

                                    return (
                                        <div key={theme}>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm font-medium text-foreground">{theme}</span>
                                                <span className="text-sm text-muted-foreground">{count} mentions</span>
                                            </div>
                                            <div className="h-3 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${colors[theme] || "bg-primary"} transition-all duration-500`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        <Card className="glass-card p-6">
                            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <Target className="text-red-500 w-5 h-5" />
                                Common Improvement Areas
                            </h3>
                            <div className="space-y-3">
                                {improvementAreas.map(({ keyword, label, icon }) => {
                                    const count = (feedbackText.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
                                    return (
                                        <div key={keyword} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{icon}</span>
                                                <span className="text-sm font-medium">{label}</span>
                                            </div>
                                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                                                {count} mentions
                                            </Badge>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="list" className="mt-6">
                    <Card className="glass-card p-6">
                        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <MessageSquare className="text-purple-500 w-5 h-5" />
                            All Feedback
                            <Badge className="ml-2 bg-purple-500/10 text-purple-500 border-purple-500/30">{filteredFeedback.length}</Badge>
                        </h3>
                        <div className="space-y-4">
                            {filteredFeedback.length > 0 ? (
                                filteredFeedback.slice(0, 50).map((entry, idx) => (
                                    <div
                                        key={idx}
                                        className="p-4 bg-muted/30 rounded-xl border border-border hover:border-primary/30 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/players/${entry.player_name}?from=feedback`)}
                                    >
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className="font-semibold text-primary">{entry.player_name}</span>
                                            <span className="text-muted-foreground text-xs">vs</span>
                                            <Badge variant="outline" className="text-xs">{entry.opponent}</Badge>
                                            <span className="text-muted-foreground text-xs ml-auto">{entry.match_date}</span>
                                        </div>
                                        <p className="text-sm text-foreground/80 italic">"{entry.feedback}"</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>No feedback matches your filters.</p>
                                </div>
                            )}
                        </div>
                        {filteredFeedback.length > 50 && (
                            <p className="text-xs text-muted-foreground mt-4 text-center">
                                Showing 50 of {filteredFeedback.length} entries.
                            </p>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
