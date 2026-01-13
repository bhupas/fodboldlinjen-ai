"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { getDashboardStats } from "@/lib/services/dashboard";
import {
    DataTable,
    DataTableHeader,
    DataTableHead,
    DataTableBody,
    DataTableRow,
    DataTableCell,
    DataTableEmpty,
    DataTableLoading
} from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { ComboSelect } from "@/components/ui/combo-select";
import { FilterPanel, FilterRow, FilterSection } from "@/components/ui/filter-panel";
import { PageHeader } from "@/components/ui/page-header";
import { CountBadge } from "@/components/ui/stats-display";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/ui/stat-card";
import WordCloud from "@/components/dashboard/WordCloud";
import {
    Search,
    Users,
    Dumbbell,
    Ban,
    SlidersHorizontal,
    MessageSquare,
    BarChart3,
    TrendingUp,
    Target,
    Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    getAllFeedback,
    getFeedbackStats,
    getOpponentsWithFeedback,
    getPlayersWithFeedback,
    FeedbackEntry,
    FeedbackStats
} from "@/lib/services/feedback";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ScatterChart,
    Scatter,
    ZAxis,
    Label as RechartsLabel,
    ReferenceLine
} from 'recharts';

export default function PlayerStatsPage() {
    const [rawMatchStats, setRawMatchStats] = useState<any[]>([]);
    const [rawPerfStats, setRawPerfStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Filters
    const [search, setSearch] = useState("");
    const [minGames, setMinGames] = useState(0);
    const [minGoals, setMinGoals] = useState(0);
    const [minAssists, setMinAssists] = useState(0);
    const [ageRange, setAgeRange] = useState<[number, number]>([15, 40]);
    const [includeUnknownAge, setIncludeUnknownAge] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [showGymFilters, setShowGymFilters] = useState(false);
    const [showFeedbackFilters, setShowFeedbackFilters] = useState(false);
    const [sortBy, setSortBy] = useState("rating");

    // Profile Map for Age
    const [profiles, setProfiles] = useState<any[]>([]);

    // New Filters
    const [opponentFilter, setOpponentFilter] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Pagination
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    // Feedback Analysis State
    const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
    const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
    const [feedbackPlayers, setFeedbackPlayers] = useState<string[]>([]);
    const [feedbackOpponents, setFeedbackOpponents] = useState<string[]>([]);
    const [selectedFeedbackPlayer, setSelectedFeedbackPlayer] = useState<string>("all");
    const [selectedFeedbackOpponent, setSelectedFeedbackOpponent] = useState<string>("all");
    const [feedbackSearch, setFeedbackSearch] = useState<string>("");

    // Gym Filters
    const [gymSearch, setGymSearch] = useState<string>("");
    const [gymPlayerFilter, setGymPlayerFilter] = useState<string>("all");
    const [gymExerciseFilter, setGymExerciseFilter] = useState<string>("all");

    useEffect(() => {
        const fetchData = async () => {
            const { getRawStats } = await import("@/lib/services/dashboard");
            const { getAllProfiles } = await import("@/lib/services/profiles");

            const [statsData, profilesData] = await Promise.all([
                getRawStats(),
                getAllProfiles()
            ]);

            setRawMatchStats(statsData.matchStats);
            setRawPerfStats(statsData.perfStats);
            setProfiles(profilesData);

            // Load feedback data
            try {
                const [feedbackData, statsData2, opponentsData, playersData] = await Promise.all([
                    getAllFeedback(),
                    getFeedbackStats(),
                    getOpponentsWithFeedback(),
                    getPlayersWithFeedback()
                ]);
                setFeedback(feedbackData);
                setFeedbackStats(statsData2);
                setFeedbackOpponents(opponentsData);
                setFeedbackPlayers(playersData);
            } catch (err) {
                console.error("Failed to load feedback:", err);
            }

            setLoading(false);
        };

        fetchData();
    }, []);

    const uniqueOpponents = useMemo(() => {
        const opps = new Set(rawMatchStats.map(m => m.opponent));
        return Array.from(opps).filter(Boolean).sort();
    }, [rawMatchStats]);

    const aggregatedPlayers = useMemo(() => {
        let filteredStats = rawMatchStats;

        if (opponentFilter) {
            filteredStats = filteredStats.filter(s => s.opponent === opponentFilter);
        }
        if (startDate) {
            filteredStats = filteredStats.filter(s => new Date(s.date) >= new Date(startDate));
        }
        if (endDate) {
            filteredStats = filteredStats.filter(s => new Date(s.date) <= new Date(endDate));
        }

        const playerMap = new Map();

        filteredStats.forEach(s => {
            const cleanName = s.player_name ? s.player_name.trim() : "Unknown";

            if (!playerMap.has(cleanName)) {
                playerMap.set(cleanName, {
                    name: cleanName,
                    games: 0,
                    avgPassing: 0,
                    totalShots: 0,
                    totalTackles: 0,
                    goals: 0,
                    assists: 0,
                    minutes: 0,
                    yellowCards: 0,
                    redCards: 0,
                    perfCount: 0,
                    gymData: [],
                    feedbackList: []
                });
            }
            const p = playerMap.get(cleanName);
            p.games++;
            const passAcc = (s.total_passes && s.successful_passes)
                ? (s.successful_passes / s.total_passes) * 100
                : (s.passing_accuracy || 0);

            p.avgPassing += passAcc;
            p.totalShots += (s.total_shots || 0);
            p.totalTackles += (s.total_tackles || 0);
            p.goals += (s.goals || 0);
            p.assists += (s.assists || 0);
            p.minutes += (s.minutes_played || 0);
            p.yellowCards += (s.yellow_cards || 0);
            p.redCards += (s.red_cards || 0);
            if (s.feedback) p.feedbackList.push(s.feedback);
        });

        const gymMap = new Map();
        rawPerfStats.forEach(p => {
            const cleanName = p.player_name ? p.player_name.trim() : "Unknown";
            if (!gymMap.has(cleanName)) gymMap.set(cleanName, []);
            const maxPR = Math.max(p.pr_1 || 0, p.pr_2 || 0, p.pr_3 || 0, p.pr_4 || 0);
            gymMap.get(cleanName).push({ exercise: p.exercise, maxPR });
        });

        let players = Array.from(playerMap.values()).map(p => {
            const gymData = gymMap.get(p.name) || [];

            // Calculate Age
            const profile = profiles.find((prof: any) => {
                const fullName = `${prof.first_name || ''} ${prof.last_name || ''}`.trim();
                return fullName.toLowerCase() === p.name.toLowerCase() ||
                    (prof.first_name && prof.first_name.toLowerCase() === p.name.toLowerCase());
            });

            let age = null;
            if (profile && profile.date_of_birth) {
                const dob = new Date(profile.date_of_birth);
                const diff = Date.now() - dob.getTime();
                age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
            }

            return {
                ...p,
                avgPassing: p.games > 0 ? p.avgPassing / p.games : 0,
                gymData: gymData,
                perfCount: gymData.length,
                maxGymPR: gymData.length > 0 ? Math.max(...gymData.map((d: any) => d.maxPR)) : 0,
                age
            };
        });

        return players;
    }, [rawMatchStats, rawPerfStats, opponentFilter, startDate, endDate, profiles]);

    const filteredPlayers = useMemo(() => {
        let res = [...aggregatedPlayers];

        if (search) {
            res = res.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
        }
        if (minGames > 0) res = res.filter(p => p.games >= minGames);
        if (minGoals > 0) res = res.filter(p => p.goals >= minGoals);
        if (minAssists > 0) res = res.filter(p => p.assists >= minAssists);

        // Age Filter
        if (ageRange[0] > 15 || ageRange[1] < 40) {
            res = res.filter(p => {
                if (p.age === null) return includeUnknownAge;
                return p.age >= ageRange[0] && p.age <= ageRange[1];
            });
        } else if (!includeUnknownAge) {
            res = res.filter(p => p.age !== null);
        }

        res.sort((a, b) => {
            switch (sortBy) {
                case 'rating': return (b.avgPassing || 0) - (a.avgPassing || 0);
                case 'games': return b.games - a.games;
                case 'goals': return b.goals - a.goals;
                case 'assists': return b.assists - a.assists;
                case 'minutes': return b.minutes - a.minutes;
                case 'passing': return b.avgPassing - a.avgPassing;
                case 'gym': return b.maxGymPR - a.maxGymPR;
                case 'age': return (b.age || 0) - (a.age || 0);
                default: return 0;
            }
        });

        return res;
    }, [aggregatedPlayers, search, sortBy, minGames, minGoals, minAssists]);

    useEffect(() => {
        setPage(1);
    }, [search, minGames, minGoals, minAssists, sortBy, opponentFilter, startDate, endDate, ageRange, includeUnknownAge]);

    const paginatedPlayers = filteredPlayers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(filteredPlayers.length / ITEMS_PER_PAGE);

    const playerOptions = aggregatedPlayers
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(p => ({ label: p.name, value: p.name }));

    const opponentOptions = uniqueOpponents.map(o => ({ label: o, value: o }));

    // Filtered feedback
    const filteredFeedback = useMemo(() => {
        let result = [...feedback];
        if (selectedFeedbackPlayer !== "all") {
            result = result.filter(f => f.player_name === selectedFeedbackPlayer);
        }
        if (selectedFeedbackOpponent !== "all") {
            result = result.filter(f => f.opponent === selectedFeedbackOpponent);
        }
        if (feedbackSearch) {
            const searchLower = feedbackSearch.toLowerCase();
            result = result.filter(f =>
                f.feedback?.toLowerCase().includes(searchLower) ||
                f.player_name?.toLowerCase().includes(searchLower)
            );
        }
        return result;
    }, [feedback, selectedFeedbackPlayer, selectedFeedbackOpponent, feedbackSearch]);

    // Gym player and exercise lists
    const gymPlayers = useMemo(() => {
        return Array.from(new Set(rawPerfStats.map(p => p.player_name))).filter(Boolean).sort();
    }, [rawPerfStats]);

    const gymExercises = useMemo(() => {
        return Array.from(new Set(rawPerfStats.map(p => p.exercise))).filter(Boolean).sort();
    }, [rawPerfStats]);

    // Filtered gym data
    const filteredGymData = useMemo(() => {
        let result = [...rawPerfStats];
        if (gymPlayerFilter !== "all") {
            result = result.filter(p => p.player_name === gymPlayerFilter);
        }
        if (gymExerciseFilter !== "all") {
            result = result.filter(p => p.exercise === gymExerciseFilter);
        }
        if (gymSearch) {
            const searchLower = gymSearch.toLowerCase();
            result = result.filter(p =>
                p.player_name?.toLowerCase().includes(searchLower) ||
                p.exercise?.toLowerCase().includes(searchLower)
            );
        }
        return result;
    }, [rawPerfStats, gymPlayerFilter, gymExerciseFilter, gymSearch]);

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

    if (loading) return <LoadingSkeleton variant="table" />;

    return (
        <div className="space-y-8">
            <PageHeader
                icon={Users}
                iconColor="blue"
                title="Players"
                description="Detailed performance metrics, feedback analysis, and team insights"
                badge={<CountBadge count={filteredPlayers.length} label="Players Found" />}
            />

            {/* Main Tabs */}
            <Tabs defaultValue="players" className="w-full">
                <TabsList className="bg-muted p-1 rounded-xl w-full md:w-auto flex overflow-x-auto no-scrollbar md:inline-flex">
                    <TabsTrigger value="players" className="rounded-lg gap-2 flex-1 md:flex-none min-w-[100px]">
                        <TrendingUp size={16} />
                        Performance
                    </TabsTrigger>
                    <TabsTrigger value="gym" className="rounded-lg gap-2 flex-1 md:flex-none min-w-[80px]">
                        <Dumbbell size={16} />
                        Gym
                    </TabsTrigger>
                    <TabsTrigger value="feedback" className="rounded-lg gap-2 flex-1 md:flex-none min-w-[90px]">
                        <MessageSquare size={16} />
                        Feedback
                    </TabsTrigger>
                    <TabsTrigger value="insights" className="rounded-lg gap-2 flex-1 md:flex-none min-w-[90px]">
                        <BarChart3 size={16} />
                        Insights
                    </TabsTrigger>
                </TabsList>

                {/* Performance Tab */}
                <TabsContent value="players" className="mt-6 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Players"
                            value={aggregatedPlayers.length}
                            icon={Users}
                            color="blue"
                        />
                        <StatCard
                            title="Total Matches"
                            value={rawMatchStats.length}
                            icon={Target}
                            color="green"
                        />
                        <StatCard
                            title="Total Goals"
                            value={aggregatedPlayers.reduce((sum, p) => sum + p.goals, 0)}
                            icon={Sparkles}
                            color="purple"
                        />
                        <StatCard
                            title="Avg. Passing %"
                            value={`${(aggregatedPlayers.reduce((sum, p) => sum + p.avgPassing, 0) / Math.max(aggregatedPlayers.length, 1)).toFixed(1)}%`}
                            icon={TrendingUp}
                            color="yellow"
                        />
                    </div>

                    {/* Filter Panel */}
                    <FilterPanel>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col md:flex-row gap-4 items-end">
                                {/* Search */}
                                <div className="flex-1 relative w-full">
                                    <Label className="text-xs text-muted-foreground mb-2 block">Search Player</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                        <Input
                                            placeholder="Filter by name..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="pl-9 h-10"
                                        />
                                    </div>
                                    {search && (
                                        <button onClick={() => setSearch('')} className="text-xs text-destructive mt-1 hover:underline text-right w-full block">Clear</button>
                                    )}
                                </div>

                                {/* Sort */}
                                <div className="w-full md:w-48">
                                    <Label className="text-xs text-muted-foreground mb-2 block">Sort By</Label>
                                    <Select value={sortBy} onValueChange={setSortBy}>
                                        <SelectTrigger className="h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="rating">🔥 Performance</SelectItem>
                                            <SelectItem value="games">📅 Matches</SelectItem>
                                            <SelectItem value="goals">⚽ Goals</SelectItem>
                                            <SelectItem value="assists">👟 Assists</SelectItem>
                                            <SelectItem value="passing">🎯 Passing %</SelectItem>
                                            <SelectItem value="minutes">⏱ Minutes</SelectItem>
                                            <SelectItem value="age">🎂 Age</SelectItem>
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
                                    {(minGames > 0 || minGoals > 0 || minAssists > 0 || opponentFilter || startDate || endDate) && (
                                        <Badge variant="secondary" className="ml-1 px-1 h-5 text-[10px]">!</Badge>
                                    )}
                                </Button>
                            </div>

                            {showFilters && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t animate-in slide-in-from-top-2 fade-in duration-200">
                                    {/* Opposition */}
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-2 block">Opposition</Label>
                                        <ComboSelect
                                            options={[{ label: "All Opponents", value: "all" }, ...opponentOptions]}
                                            value={opponentFilter || "all"}
                                            onValueChange={(val) => setOpponentFilter(val === "all" ? "" : val)}
                                            placeholder="Select opponent"
                                            searchPlaceholder="Type to search..."
                                        />
                                        {opponentFilter && (
                                            <button onClick={() => setOpponentFilter('')} className="text-xs text-destructive mt-1 hover:underline">Clear</button>
                                        )}
                                    </div>

                                    {/* Date Range */}
                                    <div className="col-span-1 md:col-span-2 flex gap-4">
                                        <div className="flex-1">
                                            <Label className="text-xs text-muted-foreground mb-2 block">Start Date</Label>
                                            <Input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="h-10"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <Label className="text-xs text-muted-foreground mb-2 block">End Date</Label>
                                            <Input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="h-10"
                                            />
                                        </div>
                                    </div>

                                    {/* Sliders */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <Label className="text-muted-foreground text-xs uppercase font-bold">Age: {ageRange[0]} - {ageRange[1]}</Label>
                                            <div className="flex items-center gap-2">
                                                <label className="text-[10px] flex items-center gap-1 cursor-pointer select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={includeUnknownAge}
                                                        onChange={(e) => setIncludeUnknownAge(e.target.checked)}
                                                        className="accent-primary rounded-sm w-3 h-3"
                                                    />
                                                    Inc. Unknown
                                                </label>
                                            </div>
                                        </div>
                                        <Slider
                                            value={ageRange}
                                            max={40}
                                            min={15}
                                            step={1}
                                            onValueChange={(val: any) => setAgeRange(val)}
                                            className="py-2"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <Label className="text-muted-foreground text-xs uppercase font-bold">Min Matches</Label>
                                            <span className="text-primary text-xs font-mono">{minGames}</span>
                                        </div>
                                        <Slider value={[minGames]} max={20} step={1} onValueChange={(val) => setMinGames(val[0])} className="py-2" />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <Label className="text-muted-foreground text-xs uppercase font-bold">Min Goals</Label>
                                            <span className="text-green-500 text-xs font-mono">{minGoals}</span>
                                        </div>
                                        <Slider value={[minGoals]} max={10} step={1} onValueChange={(val) => setMinGoals(val[0])} className="py-2" />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <Label className="text-muted-foreground text-xs uppercase font-bold">Min Assists</Label>
                                            <span className="text-purple-500 text-xs font-mono">{minAssists}</span>
                                        </div>
                                        <Slider value={[minAssists]} max={10} step={1} onValueChange={(val) => setMinAssists(val[0])} className="py-2" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </FilterPanel>

                    {/* Results Table */}
                    <div className="overflow-x-auto">
                        <DataTable>
                            <DataTableHeader>
                                <DataTableHead>Player</DataTableHead>
                                <DataTableHead className="hidden md:table-cell">Age</DataTableHead>
                                <DataTableHead className="text-right">Matches</DataTableHead>
                                <DataTableHead className="text-right hidden lg:table-cell">Mins</DataTableHead>
                                <DataTableHead className="text-right">Goals</DataTableHead>
                                <DataTableHead className="text-right hidden sm:table-cell">Assists</DataTableHead>
                                <DataTableHead className="text-right hidden md:table-cell">Passing</DataTableHead>
                                <DataTableHead className="text-right hidden lg:table-cell">Tackles</DataTableHead>
                                <DataTableHead className="text-right hidden lg:table-cell">Cards</DataTableHead>
                            </DataTableHeader>
                            <DataTableBody>
                                {paginatedPlayers.length > 0 ? (
                                    paginatedPlayers.map((player) => (
                                        <DataTableRow
                                            key={player.name}
                                            onClick={() => router.push(`/players/${player.name}`)}
                                        >
                                            <DataTableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span className="text-base group-hover:text-primary transition-colors">{player.name}</span>
                                                </div>
                                            </DataTableCell>
                                            <DataTableCell className="hidden md:table-cell">
                                                {player.age ? (
                                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30 text-xs font-mono">
                                                        {player.age} yo
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/30 flex items-center gap-1" title="No DOB found"><Ban size={10} /> -</span>
                                                )}
                                            </DataTableCell>
                                            <DataTableCell className="text-right text-muted-foreground font-mono">{player.games}</DataTableCell>
                                            <DataTableCell className="text-right text-muted-foreground font-mono hidden lg:table-cell">
                                                {player.minutes}&apos;
                                            </DataTableCell>
                                            <DataTableCell className="text-right">
                                                {player.goals > 0 && (
                                                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500/20">
                                                        {player.goals} ⚽
                                                    </Badge>
                                                )}
                                                {player.goals === 0 && <span className="text-muted-foreground/50">-</span>}
                                            </DataTableCell>
                                            <DataTableCell className="text-right hidden sm:table-cell">
                                                {player.assists > 0 && (
                                                    <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30 hover:bg-purple-500/20">
                                                        {player.assists} 👟
                                                    </Badge>
                                                )}
                                                {player.assists === 0 && <span className="text-muted-foreground/50">-</span>}
                                            </DataTableCell>
                                            <DataTableCell className="text-right hidden md:table-cell">
                                                <span className={`${player.avgPassing >= 80 ? 'text-green-500' : player.avgPassing >= 70 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                                                    {player.avgPassing.toFixed(1)}%
                                                </span>
                                            </DataTableCell>
                                            <DataTableCell className="text-right text-muted-foreground hidden lg:table-cell">{player.totalTackles}</DataTableCell>
                                            <DataTableCell className="text-right hidden lg:table-cell">
                                                <div className="flex justify-end gap-1">
                                                    {player.yellowCards > 0 && <span className="w-3 h-4 bg-yellow-500 rounded-sm inline-block" title={`${player.yellowCards} Yellow`} />}
                                                    {player.redCards > 0 && <span className="w-3 h-4 bg-red-500 rounded-sm inline-block" title={`${player.redCards} Red`} />}
                                                    {player.yellowCards === 0 && player.redCards === 0 && <span className="text-muted-foreground/50">-</span>}
                                                </div>
                                            </DataTableCell>
                                        </DataTableRow>
                                    ))
                                ) : (
                                    <DataTableEmpty colSpan={9} message="No players match your filters." />
                                )}
                            </DataTableBody>
                        </DataTable>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-4">
                            <Button
                                variant="outline"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <span className="text-muted-foreground text-sm">
                                Page {page} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </TabsContent>

                {/* Gym Tab */}
                <TabsContent value="gym" className="mt-6 space-y-6">
                    {/* Stats Cards for Gym */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Gym Sessions"
                            value={rawPerfStats.length}
                            icon={Dumbbell}
                            color="yellow"
                        />
                        <StatCard
                            title="Active Players"
                            value={new Set(rawPerfStats.map(p => p.player_name)).size}
                            icon={Users}
                            color="blue"
                        />
                        <StatCard
                            title="Unique Exercises"
                            value={new Set(rawPerfStats.map(p => p.exercise)).size}
                            icon={Target}
                            color="green"
                        />
                        <StatCard
                            title="Best PR Overall"
                            value={`${Math.max(...rawPerfStats.flatMap(p => [p.pr_1 || 0, p.pr_2 || 0, p.pr_3 || 0, p.pr_4 || 0]))} kg`}
                            icon={TrendingUp}
                            color="purple"
                        />
                    </div>

                    {/* Filter Panel - Similar to Performance tab */}
                    <FilterPanel>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col md:flex-row gap-4 items-end">
                                {/* Search */}
                                <div className="flex-1 relative w-full">
                                    <Label className="text-xs text-muted-foreground mb-2 block">Search</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                        <Input
                                            placeholder="Filter by player or exercise..."
                                            value={gymSearch}
                                            onChange={(e) => setGymSearch(e.target.value)}
                                            className="pl-9 h-10"
                                        />
                                    </div>
                                    {gymSearch && (
                                        <button onClick={() => setGymSearch('')} className="text-xs text-destructive mt-1 hover:underline text-right w-full block">Clear</button>
                                    )}
                                </div>

                                <Button
                                    variant={showGymFilters ? "secondary" : "outline"}
                                    className="gap-2 h-10"
                                    onClick={() => setShowGymFilters(!showGymFilters)}
                                >
                                    <SlidersHorizontal size={16} />
                                    Filters
                                    {(gymPlayerFilter !== "all" || gymExerciseFilter !== "all") && (
                                        <Badge variant="secondary" className="ml-1 px-1 h-5 text-[10px]">!</Badge>
                                    )}
                                </Button>
                            </div>

                            {showGymFilters && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t animate-in slide-in-from-top-2 fade-in duration-200">
                                    {/* Player Filter */}
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-2 block">Player</Label>
                                        <ComboSelect
                                            options={[{ label: "All Players", value: "all" }, ...gymPlayers.map(p => ({ label: p, value: p }))]}
                                            value={gymPlayerFilter}
                                            onValueChange={setGymPlayerFilter}
                                            placeholder="Select player"
                                            searchPlaceholder="Type to search..."
                                        />
                                    </div>

                                    {/* Exercise Filter */}
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-2 block">Exercise</Label>
                                        <ComboSelect
                                            options={[{ label: "All Exercises", value: "all" }, ...gymExercises.map(e => ({ label: e, value: e }))]}
                                            value={gymExerciseFilter}
                                            onValueChange={setGymExerciseFilter}
                                            placeholder="Select exercise"
                                            searchPlaceholder="Type to search..."
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </FilterPanel>

                    {/* Gym Data Table */}
                    <Card className="glass-card p-6">
                        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <Dumbbell className="text-yellow-500 w-5 h-5" />
                            Gym Performance Data
                        </h3>
                        <div className="overflow-x-auto">
                            <DataTable>
                                <DataTableHeader>
                                    <DataTableHead>Player</DataTableHead>
                                    <DataTableHead>Exercise</DataTableHead>
                                    <DataTableHead className="text-right hidden md:table-cell">PR 1</DataTableHead>
                                    <DataTableHead className="text-right hidden md:table-cell">PR 2</DataTableHead>
                                    <DataTableHead className="text-right hidden md:table-cell">PR 3</DataTableHead>
                                    <DataTableHead className="text-right hidden md:table-cell">PR 4</DataTableHead>
                                    <DataTableHead className="text-right">Best</DataTableHead>
                                </DataTableHeader>
                                <DataTableBody>
                                    {filteredGymData.length > 0 ? (
                                        filteredGymData.slice(0, 50).map((row, idx) => {
                                            const best = Math.max(row.pr_1 || 0, row.pr_2 || 0, row.pr_3 || 0, row.pr_4 || 0);
                                            return (
                                                <DataTableRow key={idx} onClick={() => router.push(`/players/${row.player_name}`)}>
                                                    <DataTableCell className="font-medium">{row.player_name}</DataTableCell>
                                                    <DataTableCell className="text-primary font-medium">{row.exercise}</DataTableCell>
                                                    <DataTableCell className="text-right text-muted-foreground font-mono hidden md:table-cell">{row.pr_1 || '-'}</DataTableCell>
                                                    <DataTableCell className="text-right text-muted-foreground font-mono hidden md:table-cell">{row.pr_2 || '-'}</DataTableCell>
                                                    <DataTableCell className="text-right text-muted-foreground font-mono hidden md:table-cell">{row.pr_3 || '-'}</DataTableCell>
                                                    <DataTableCell className="text-right text-muted-foreground font-mono hidden md:table-cell">{row.pr_4 || '-'}</DataTableCell>
                                                    <DataTableCell className="text-right">
                                                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                                                            {best} kg
                                                        </Badge>
                                                    </DataTableCell>
                                                </DataTableRow>
                                            );
                                        })
                                    ) : (
                                        <DataTableEmpty colSpan={7} message="No gym performance data available." />
                                    )}
                                </DataTableBody>
                            </DataTable>
                        </div>
                        {filteredGymData.length > 50 && (
                            <p className="text-xs text-muted-foreground mt-4 text-center">
                                Showing 50 of {filteredGymData.length} records. Use Data Editor for full access.
                            </p>
                        )}
                    </Card>

                    {/* Exercise Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Array.from(new Set(rawPerfStats.map(p => p.exercise))).slice(0, 4).map(exercise => {
                            const exerciseData = rawPerfStats.filter(p => p.exercise === exercise);
                            const avgBest = exerciseData.reduce((sum, p) => {
                                const best = Math.max(p.pr_1 || 0, p.pr_2 || 0, p.pr_3 || 0, p.pr_4 || 0);
                                return sum + best;
                            }, 0) / exerciseData.length;

                            return (
                                <Card key={exercise} className="glass-card p-6">
                                    <h3 className="text-lg font-bold text-foreground mb-4">{exercise}</h3>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-muted-foreground text-sm">{exerciseData.length} players</span>
                                        <span className="text-yellow-500 font-bold">Avg: {avgBest.toFixed(1)} kg</span>
                                    </div>
                                    <div className="space-y-2">
                                        {exerciseData
                                            .sort((a, b) => {
                                                const bestA = Math.max(a.pr_1 || 0, a.pr_2 || 0, a.pr_3 || 0, a.pr_4 || 0);
                                                const bestB = Math.max(b.pr_1 || 0, b.pr_2 || 0, b.pr_3 || 0, b.pr_4 || 0);
                                                return bestB - bestA;
                                            })
                                            .slice(0, 5)
                                            .map((player, idx) => {
                                                const best = Math.max(player.pr_1 || 0, player.pr_2 || 0, player.pr_3 || 0, player.pr_4 || 0);
                                                return (
                                                    <div key={player.player_name} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-500 text-black' : 'bg-muted text-foreground'}`}>
                                                                {idx + 1}
                                                            </span>
                                                            <span className="text-sm">{player.player_name}</span>
                                                        </div>
                                                        <span className="font-mono text-yellow-500">{best} kg</span>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>

                {/* Feedback Tab */}
                <TabsContent value="feedback" className="mt-6 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Feedback"
                            value={feedbackStats?.totalFeedback || 0}
                            icon={MessageSquare}
                            color="purple"
                        />
                        <StatCard
                            title="Unique Players"
                            value={feedbackStats?.uniquePlayers || 0}
                            icon={Users}
                            color="blue"
                        />
                        <StatCard
                            title="Matches with Feedback"
                            value={feedbackStats?.uniqueMatches || 0}
                            icon={Target}
                            color="green"
                        />
                        <StatCard
                            title="Avg. Feedback Length"
                            value={`${Math.round(feedbackStats?.avgFeedbackLength || 0)} chars`}
                            icon={BarChart3}
                            color="yellow"
                        />
                    </div>

                    {/* Filters - Consistent with Players tab */}
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
                                            className="pl-9 h-10"
                                        />
                                    </div>
                                    {feedbackSearch && (
                                        <button onClick={() => setFeedbackSearch('')} className="text-xs text-destructive mt-1 hover:underline text-right w-full block">Clear</button>
                                    )}
                                </div>

                                <Button
                                    variant={showFeedbackFilters ? "secondary" : "outline"}
                                    className="gap-2 h-10"
                                    onClick={() => setShowFeedbackFilters(!showFeedbackFilters)}
                                >
                                    <SlidersHorizontal size={16} />
                                    Filters
                                    {(selectedFeedbackPlayer !== "all" || selectedFeedbackOpponent !== "all") && (
                                        <Badge variant="secondary" className="ml-1 px-1 h-5 text-[10px]">!</Badge>
                                    )}
                                </Button>
                            </div>

                            {showFeedbackFilters && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t animate-in slide-in-from-top-2 fade-in duration-200">
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
                                    <WordCloud
                                        text={feedbackText}
                                        width={700}
                                        height={350}
                                        className="rounded-lg"
                                    />
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
                                        {[
                                            { keyword: "pres", label: "Pressing & Intensity", icon: "⚡" },
                                            { keyword: "pasninger", label: "Passing Accuracy", icon: "🎯" },
                                            { keyword: "kommunikation", label: "Communication", icon: "📢" },
                                            { keyword: "skud", label: "Shooting", icon: "⚽" },
                                            { keyword: "erobringer", label: "Ball Recovery", icon: "🛡️" },
                                            { keyword: "tempo", label: "Game Speed", icon: "🏃" }
                                        ].map(({ keyword, label, icon }) => {
                                            const count = (feedbackText.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
                                            return (
                                                <div key={keyword} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <span>{icon}</span>
                                                        <span className="text-sm font-medium text-foreground">{label}</span>
                                                    </div>
                                                    <span className="text-sm font-mono text-primary">{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="list" className="mt-6">
                            <Card className="glass-card p-6">
                                <h3 className="text-lg font-bold text-foreground mb-4">📝 All Feedback Entries</h3>
                                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                                    {filteredFeedback.length > 0 ? (
                                        filteredFeedback.map((entry) => (
                                            <div
                                                key={entry.id}
                                                className="p-4 bg-muted/30 rounded-xl border border-border hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-semibold text-foreground">{entry.player_name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        vs {entry.opponent} • {entry.match_date}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground italic">"{entry.feedback}"</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-muted-foreground">
                                            No feedback entries found for the selected filters.
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </TabsContent>

                {/* Insights Tab */}
                <TabsContent value="insights" className="mt-6 space-y-6">
                    {/* Visual Analytics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="glass-card p-6">
                            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                                <Target className="text-blue-500 w-5 h-5" />
                                Efficiency Matrix (Goals vs Shots)
                            </h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                                        <XAxis type="number" dataKey="totalShots" name="Shots" stroke="hsl(var(--muted-foreground))" fontSize={11}>
                                            <RechartsLabel value="Total Shots" offset={-10} position="insideBottom" />
                                        </XAxis>
                                        <YAxis type="number" dataKey="goals" name="Goals" stroke="hsl(var(--muted-foreground))" fontSize={11}>
                                            <RechartsLabel value="Goals" angle={-90} position="left" />
                                        </YAxis>
                                        <ZAxis type="number" dataKey="games" range={[50, 200]} name="Games" />
                                        <Tooltip cursor={{ strokeDasharray: '3 3' }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    const conversion = data.totalShots > 0 ? ((data.goals / data.totalShots) * 100).toFixed(1) : '0';
                                                    return (
                                                        <div style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', padding: '8px 12px' }}>
                                                            <p className="font-bold text-foreground text-sm">{data.name}</p>
                                                            <p className="text-xs text-muted-foreground">Goals: <span className="text-green-500">{data.goals}</span></p>
                                                            <p className="text-xs text-muted-foreground">Shots: {data.totalShots}</p>
                                                            <p className="text-[10px] text-muted-foreground mt-1">Conv. Rate: {conversion}%</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Scatter name="Players" data={aggregatedPlayers.filter(p => p.totalShots > 0)}>
                                            {aggregatedPlayers.filter(p => p.totalShots > 0).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill="hsl(var(--primary))" fillOpacity={0.7} />
                                            ))}
                                        </Scatter>
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <Card className="glass-card p-6">
                            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                                <Dumbbell className="text-yellow-500 w-5 h-5" />
                                Physicality Impact (Causation?)
                            </h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                                        <XAxis type="number" dataKey="maxGymPR" name="Gym PR" stroke="hsl(var(--muted-foreground))" fontSize={11} unit="kg">
                                            <RechartsLabel value="Max Gym PR (kg)" offset={-10} position="insideBottom" />
                                        </XAxis>
                                        <YAxis type="number" dataKey="totalTackles" name="Tackles" stroke="hsl(var(--muted-foreground))" fontSize={11}>
                                            <RechartsLabel value="Total Tackles" angle={-90} position="left" />
                                        </YAxis>
                                        <ZAxis type="number" dataKey="games" range={[50, 200]} name="Games" />
                                        <Tooltip cursor={{ strokeDasharray: '3 3' }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', padding: '8px 12px' }}>
                                                            <p className="font-bold text-foreground text-sm">{data.name}</p>
                                                            <p className="text-xs text-muted-foreground">Tackles: <span className="text-blue-500">{data.totalTackles}</span></p>
                                                            <p className="text-xs text-muted-foreground">Best Lift: <span className="text-yellow-500">{data.maxGymPR}kg</span></p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Scatter name="Players" data={aggregatedPlayers.filter(p => p.maxGymPR > 0)}>
                                            {aggregatedPlayers.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill="hsl(var(--yellow-500))" fillOpacity={0.7} />
                                            ))}
                                        </Scatter>
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Top Performers */}
                        <Card className="glass-card p-6">
                            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <TrendingUp className="text-green-500 w-5 h-5" />
                                Top Performers (Passing)
                            </h3>
                            <div className="space-y-3">
                                {aggregatedPlayers
                                    .filter(p => p.games >= 3)
                                    .sort((a, b) => b.avgPassing - a.avgPassing)
                                    .slice(0, 5)
                                    .map((player, idx) => (
                                        <div
                                            key={player.name}
                                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50"
                                            onClick={() => router.push(`/players/${player.name}`)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-gray-400 text-black' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-muted text-foreground'}`}>
                                                    {idx + 1}
                                                </span>
                                                <span className="font-medium">{player.name}</span>
                                            </div>
                                            <span className="text-green-500 font-mono">{player.avgPassing.toFixed(1)}%</span>
                                        </div>
                                    ))}
                            </div>
                        </Card>

                        {/* Top Scorers */}
                        <Card className="glass-card p-6">
                            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <Target className="text-blue-500 w-5 h-5" />
                                Top Scorers
                            </h3>
                            <div className="space-y-3">
                                {aggregatedPlayers
                                    .sort((a, b) => b.goals - a.goals)
                                    .slice(0, 5)
                                    .map((player, idx) => (
                                        <div
                                            key={player.name}
                                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50"
                                            onClick={() => router.push(`/players/${player.name}`)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-gray-400 text-black' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-muted text-foreground'}`}>
                                                    {idx + 1}
                                                </span>
                                                <span className="font-medium">{player.name}</span>
                                            </div>
                                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                                                {player.goals} ⚽
                                            </Badge>
                                        </div>
                                    ))}
                            </div>
                        </Card>

                        {/* Best Gym Performance */}
                        <Card className="glass-card p-6">
                            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <Dumbbell className="text-yellow-500 w-5 h-5" />
                                Best Gym Performance
                            </h3>
                            <div className="space-y-3">
                                {(() => {
                                    // Calculate best PR per player from rawPerfStats
                                    const playerBestPR = new Map<string, number>();
                                    rawPerfStats.forEach(p => {
                                        const name = p.player_name?.trim() || "Unknown";
                                        const maxPR = Math.max(p.pr_1 || 0, p.pr_2 || 0, p.pr_3 || 0, p.pr_4 || 0);
                                        if (!playerBestPR.has(name) || maxPR > playerBestPR.get(name)!) {
                                            playerBestPR.set(name, maxPR);
                                        }
                                    });

                                    const sortedPlayers = Array.from(playerBestPR.entries())
                                        .filter(([_, pr]) => pr > 0)
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 5);

                                    if (sortedPlayers.length === 0) {
                                        return (
                                            <p className="text-center text-muted-foreground py-6">No gym data available</p>
                                        );
                                    }

                                    return sortedPlayers.map(([name, maxPR], idx) => (
                                        <div
                                            key={name}
                                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50"
                                            onClick={() => router.push(`/players/${name}`)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-gray-400 text-black' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-muted text-foreground'}`}>
                                                    {idx + 1}
                                                </span>
                                                <span className="font-medium">{name}</span>
                                            </div>
                                            <span className="text-yellow-500 font-mono">{maxPR} kg</span>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </Card>

                        {/* Most Minutes */}
                        <Card className="glass-card p-6">
                            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <BarChart3 className="text-purple-500 w-5 h-5" />
                                Most Minutes Played
                            </h3>
                            <div className="space-y-3">
                                {aggregatedPlayers
                                    .sort((a, b) => b.minutes - a.minutes)
                                    .slice(0, 5)
                                    .map((player, idx) => (
                                        <div
                                            key={player.name}
                                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50"
                                            onClick={() => router.push(`/players/${player.name}`)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-gray-400 text-black' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-muted text-foreground'}`}>
                                                    {idx + 1}
                                                </span>
                                                <span className="font-medium">{player.name}</span>
                                            </div>
                                            <span className="text-purple-500 font-mono">{player.minutes}'</span>
                                        </div>
                                    ))}
                            </div>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
