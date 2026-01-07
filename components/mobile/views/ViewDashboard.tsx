"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    LiquidGlassCard,
    LiquidGlassButton,
    AnimatedBlobBackground,
    GlassTabBar,
    RPESlider
} from "@/components/mobile/LiquidGlassWidgets";
import {
    FileText,
    Activity,
    Dumbbell,
    Info,
    ChevronRight,
    Clock,
    Volume2,
    Plus,
    SlidersHorizontal,
    ArrowLeft,
    MoreHorizontal,
    Heart
} from "lucide-react";
import { useDashboard } from "@/hooks/domain/useDashboard";
import { usePlans } from "@/hooks/domain/usePlans";
import { format } from "date-fns";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ComposedChart,
    Bar,
    Line
} from "recharts";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

// MARK: - Types & Constants

enum Tab {
    Today = "today",
    Progress = "progress",
    Workouts = "workouts"
}

const formatDuration = (minutes?: number | null) => {
    if (!minutes || minutes <= 0) return "0:05:00";
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${hrs}:${pad(mins)}:00`;
};

const getInitials = (name?: string) => {
    if (!name) return "🙂";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 0) return "🙂";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const getReadinessMeta = (percent: number) => {
    if (percent >= 80) {
        return {
            label: "High Readiness",
            copy: "You are in a strong recovery state. Training can be productive today if you stay consistent."
        };
    }
    if (percent >= 60) {
        return {
            label: "Moderate Readiness",
            copy: "You've started light, and your readiness can hold up for another session. Keep it productive and stay within your limits."
        };
    }
    return {
        label: "Low Readiness",
        copy: "Recovery is still in progress. Keep it light and prioritize sleep, hydration, and low strain."
    };
};

// MARK: - Today View (Readiness)

const TodayView = () => {
    const { profile, weeklyLogs, hardwareData } = useDashboard();
    const { activePlans } = usePlans();

    const today = new Date();
    const todayKey = format(today, "yyyy-MM-dd");
    const todayLog = weeklyLogs.find((log) => log.log_date?.startsWith(todayKey));

    const readinessRaw = todayLog?.overall_readiness ?? null;
    const readinessPercent = readinessRaw !== null
        ? Math.round(readinessRaw <= 5 ? (readinessRaw / 5) * 100 : readinessRaw)
        : 73;
    const readiness = getReadinessMeta(readinessPercent);

    const sleepMissing = !(todayLog?.sleep_duration_minutes || hardwareData?.sleep_score?.value);

    const workoutPlan = activePlans.find((plan) => plan.plan_type === "exercise") || activePlans[0];
    const workoutTitle = workoutPlan?.name || "Aerobics";
    const workoutDate = format(today, "EEEE, MMM d");
    const workoutDuration = formatDuration(todayLog?.exercise_duration_minutes || undefined);

    const avatarInitials = getInitials(profile?.full_name);

    return (
        <div className="relative min-h-screen pb-32 overflow-hidden bg-[#0B0B0D] text-white">
            {/* Hero background */}
            <div className="absolute inset-x-0 top-0 h-[360px]">
                <div className="absolute inset-0 bg-gradient-to-b from-[#19b100] via-[#0ea000] to-[#0a6300]" />
                <div className="absolute inset-x-0 top-[45%] h-16 bg-gradient-to-r from-[#0e7a00] via-[#22ff57] to-[#0e7a00] opacity-55" />
                <div className="absolute right-[-20%] top-[28%] h-[60%] w-[60%] bg-[radial-gradient(circle,rgba(190,255,64,0.95)_0%,rgba(0,0,0,0)_60%)] blur-2xl" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/65" />
            </div>

            <div className="relative z-10 p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-end gap-2">
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl font-bold tracking-tight"
                        >
                            Today
                        </motion.h1>
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-sm text-white/70"
                        >
                            {format(today, "MMMM d")}
                        </motion.span>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-sm font-semibold">
                        {avatarInitials}
                    </div>
                </div>

                {/* Readiness Hero */}
                <div className="pt-6 space-y-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-baseline">
                            <motion.span
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: "spring", bounce: 0.45 }}
                                className="text-[68px] font-bold tracking-tighter"
                            >
                                {readinessPercent}
                            </motion.span>
                            <span className="text-2xl font-bold text-white/90 ml-1">%</span>
                        </div>
                        <div className="h-7 w-7 rounded-full bg-white/15 border border-white/20 flex items-center justify-center">
                            <Info className="text-white/70" size={14} />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-white mb-1">{readiness.label}</h3>
                        <p className="text-sm text-white/80 leading-relaxed max-w-[320px]">
                            {todayLog?.ai_recommendation || readiness.copy}
                        </p>
                    </div>
                </div>

                {/* Missing Data Alert */}
                <LiquidGlassCard className="px-4 py-3 rounded-full before:rounded-full" interactive>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white/90">
                            {sleepMissing ? "Overnight Data Missing" : "Overnight Data Ready"}
                        </span>
                        <ChevronRight className="text-white/40" size={16} />
                    </div>
                </LiquidGlassCard>

                {/* Workouts List */}
                <div className="space-y-3">
                    <h3 className="text-base font-semibold text-white/90">Today&apos;s Workouts</h3>

                    <LiquidGlassCard className="p-4" interactive>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg">
                                <Activity size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-white">{workoutTitle}</h4>
                                <div className="flex items-center gap-3 mt-1 text-xs text-white/60">
                                    <span>{workoutDate}</span>
                                    <span className="w-1 h-1 rounded-full bg-white/30" />
                                    <div className="flex items-center gap-1">
                                        <Clock size={10} />
                                        <span>{workoutDuration}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[#ff4d8d]">
                                        <Volume2 size={10} />
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="text-white/40" size={16} />
                        </div>
                    </LiquidGlassCard>
                </div>
            </div>
        </div>
    );
};

// MARK: - Progress View (Cardio Fitness)

const ProgressView = () => {
    const data = [
        { name: "31", value: 28 },
        { name: "", value: 29 },
        { name: "7", value: 30.5 },
        { name: "", value: 31.2 },
        { name: "14", value: 31.8 },
        { name: "", value: 32.1 },
        { name: "21", value: 32.6 },
    ];

    return (
        <div className="relative min-h-screen pb-32 overflow-hidden bg-[#0B0B0D] text-white">
            <div className="absolute inset-0 bg-gradient-to-b from-[#4d0e0e] via-[#1d0a0a] to-[#0B0B0D]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,70,70,0.35)_0%,rgba(0,0,0,0)_55%)]" />

            <div className="relative z-10 p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <button className="h-9 w-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                        <ArrowLeft size={16} />
                    </button>
                    <span className="text-[10px] uppercase tracking-widest text-white/40">Highlight</span>
                    <button className="h-9 w-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                        <MoreHorizontal size={16} />
                    </button>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-white/80">
                        <Heart className="text-red-400" size={16} />
                        <span className="font-semibold">Cardio Fitness</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold">32.6</span>
                        <span className="text-sm text-white/60">VO₂ max</span>
                    </div>
                    <p className="text-xs text-white/50">Sep 23, 2025</p>
                    <p className="text-sm text-white/70 leading-relaxed max-w-[320px]">
                        Your cardiovascular fitness is low. Consistent movement, even at low intensity, can help improve energy, mobility, and daily function.
                    </p>
                </div>

                <div className="flex items-center justify-between text-xs text-white/50">
                    <span>Aug 27 – Sep 23, 2025</span>
                    <div className="flex gap-2">
                        {"4W 6M".split(" ").map((label) => (
                            <span key={label} className="px-2 py-1 rounded-full bg-white/10 border border-white/10">
                                {label}
                            </span>
                        ))}
                    </div>
                </div>

                <LiquidGlassCard className="p-4 bg-black/40">
                    <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">4-Week Overview</div>
                    <div className="h-[150px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="cardioLine" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#ff4d4d" stopOpacity={0.2} />
                                        <stop offset="100%" stopColor="#ff4d4d" stopOpacity={0.8} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis hide domain={[24, 36]} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" }}
                                    labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                                    itemStyle={{ color: "#fff" }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#ff4d4d"
                                    strokeWidth={2}
                                    fill="url(#cardioLine)"
                                    fillOpacity={0.25}
                                    dot={{ r: 3, fill: "#ff4d4d" }}
                                    activeDot={{ r: 5, fill: "#ff4d4d" }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </LiquidGlassCard>
            </div>
        </div>
    );
};

// MARK: - Workouts View

const WorkoutsView = () => {
    const [timeRange, setTimeRange] = useState("Year");
    const [isRPEOpen, setIsRPEOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [rpeValue, setRpeValue] = useState(4);

    const chartData = useMemo(() => {
        if (timeRange === "Week") {
            return [
                { name: "Mon", line: 12, bar: 2 },
                { name: "Tue", line: 18, bar: 3 },
                { name: "Wed", line: 22, bar: 4 },
                { name: "Thu", line: 28, bar: 3 },
                { name: "Fri", line: 34, bar: 5 },
                { name: "Sat", line: 38, bar: 4 },
                { name: "Sun", line: 41, bar: 3 },
            ];
        }
        if (timeRange === "Month") {
            return Array.from({ length: 12 }, (_, i) => ({
                name: `${i + 1}`,
                line: 12 + i * 2.2,
                bar: Math.max(2, (i % 5) + 2),
            }));
        }
        return [
            { name: "Jan", line: 18, bar: 3 },
            { name: "Feb", line: 22, bar: 4 },
            { name: "Mar", line: 26, bar: 3 },
            { name: "Apr", line: 30, bar: 5 },
            { name: "May", line: 36, bar: 6 },
            { name: "Jun", line: 41, bar: 7 },
            { name: "Jul", line: 48, bar: 6 },
            { name: "Aug", line: 52, bar: 5 },
            { name: "Sep", line: 58, bar: 4 },
            { name: "Oct", line: 63, bar: 3 },
            { name: "Nov", line: 68, bar: 5 },
            { name: "Dec", line: 72, bar: 4 },
        ];
    }, [timeRange]);

    const summaryCards = [
        { title: "Training Load", value: "10,241", sub: "245", accent: true },
        { title: "Duration", value: "113h 35m", sub: "1h 59m" },
        { title: "Distance", value: "85.42 mi", sub: "5.04 mi" },
        { title: "Elevation Gain", value: "66 ft", sub: "0 ft" },
    ];

    return (
        <div className="relative min-h-screen pb-32 overflow-hidden bg-[#0B0B0D] text-white">
            <AnimatedBlobBackground theme="blue" />

            <div className="relative z-10 p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">Workouts</h1>
                    <div className="flex items-center gap-2">
                        <LiquidGlassButton className="h-10 w-10 p-0" onClick={() => setIsRPEOpen(true)}>
                            <Plus size={18} />
                        </LiquidGlassButton>
                        <LiquidGlassButton className="h-10 w-10 p-0">
                            <SlidersHorizontal size={18} />
                        </LiquidGlassButton>
                        <div className="h-10 w-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs font-semibold">
                            <span>AB</span>
                        </div>
                    </div>
                </div>

                {/* Range Picker */}
                <div className="flex p-1 rounded-full bg-white/10 border border-white/10">
                    {["Week", "Month", "Year"].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={cn(
                                "flex-1 py-1.5 text-xs font-semibold rounded-full transition-all",
                                timeRange === range ? "bg-white/15 text-white" : "text-white/50 hover:text-white/70"
                            )}
                        >
                            {range}
                        </button>
                    ))}
                </div>

                {/* Chart */}
                <LiquidGlassCard className="p-4">
                    <div className="flex items-center justify-between text-xs text-white/50 mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-white/70">2025</span>
                            <span>vs. 2024</span>
                        </div>
                        <span className="text-white/40">{timeRange}</span>
                    </div>
                    <div className="h-[210px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData}>
                                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis hide domain={[0, 80]} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "rgba(5,10,18,0.85)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" }}
                                    labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                                    itemStyle={{ color: "#fff" }}
                                />
                                <Bar dataKey="bar" barSize={10} fill="#2ea7ff" radius={[6, 6, 0, 0]} />
                                <Line type="monotone" dataKey="line" stroke="#2ea7ff" strokeWidth={2.5} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </LiquidGlassCard>

                {/* Summary Metrics */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-sm font-semibold text-white">Summary</h3>
                            <p className="text-[10px] text-white/40">Jan 1 – Dec 14</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-6 w-6 rounded-full bg-white/10 border border-white/10" />
                            <span className="h-6 w-6 rounded-full bg-white/10 border border-white/10" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {summaryCards.map((card) => (
                            <LiquidGlassCard
                                key={card.title}
                                className={cn(
                                    "p-4",
                                    card.accent && "bg-[#2ea7ff] text-[#0B0B0D] border-transparent"
                                )}
                            >
                                <div className={cn("text-[10px] uppercase tracking-widest font-semibold mb-1", card.accent ? "text-[#0B0B0D]/70" : "text-white/40")}>
                                    {card.title}
                                </div>
                                <div className="text-xl font-bold">{card.value}</div>
                                <div className={cn("text-[10px]", card.accent ? "text-[#0B0B0D]/60" : "text-white/35")}>
                                    {card.sub}
                                </div>
                            </LiquidGlassCard>
                        ))}
                    </div>
                </div>

                {/* Strength Training Card */}
                <LiquidGlassCard className="p-4" interactive onClick={() => setIsDetailOpen(true)}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                                <Dumbbell size={20} />
                            </div>
                            <div>
                                <h4 className="text-base font-semibold">Strength Training</h4>
                                <p className="text-xs text-white/50">Tuesday, Dec 9 · 5:01 PM</p>
                                <span className="inline-flex items-center gap-1 text-[10px] mt-2 px-2 py-0.5 rounded-full bg-yellow-400/90 text-black font-semibold">
                                    ★ Favorite
                                </span>
                            </div>
                        </div>
                        <ChevronRight className="text-white/40" size={16} />
                    </div>
                </LiquidGlassCard>
            </div>

            {/* RPE Drawer */}
            <Drawer.Root open={isRPEOpen} onOpenChange={setIsRPEOpen}>
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
                    <Drawer.Content className="fixed inset-0 z-50 flex items-end justify-center outline-none">
                        <div className="w-full max-w-sm mx-auto mb-6 px-4">
                            <div className="rounded-[30px] border border-white/10 bg-[#16171c]/90 backdrop-blur-2xl shadow-[0_30px_80px_rgba(0,0,0,0.6)] p-4">
                                <div className="mx-auto w-12 h-1.5 rounded-full bg-white/20 mb-5" />
                                <h2 className="text-xl font-bold text-white text-center">Perceived Exertion</h2>
                                <p className="text-center text-white/50 text-sm mb-2">How did it feel?</p>
                                <RPESlider
                                    value={rpeValue}
                                    onChange={setRpeValue}
                                    onSave={(val) => {
                                        console.log("Saved RPE:", val);
                                        setIsRPEOpen(false);
                                    }}
                                    onDismiss={() => setIsRPEOpen(false)}
                                />
                            </div>
                        </div>
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>

            {/* Strength Training Drawer */}
            <Drawer.Root open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                    <Drawer.Content className="fixed inset-0 z-50 flex items-end justify-center outline-none">
                        <div className="w-full max-w-sm mx-auto mb-4 px-4">
                            <div className="rounded-[28px] border border-white/10 bg-[#101114]/95 backdrop-blur-2xl shadow-[0_30px_80px_rgba(0,0,0,0.6)] p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        onClick={() => setIsDetailOpen(false)}
                                        className="h-9 w-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center"
                                    >
                                        <ArrowLeft size={16} />
                                    </button>
                                    <button className="h-9 w-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                                        <MoreHorizontal size={16} />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-white/70 text-sm">
                                        <Dumbbell size={16} />
                                        <span>Strength Training</span>
                                    </div>
                                    <p className="text-xs text-white/50">Tuesday, December 9, 2025 at 5:01 PM</p>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400/90 text-black text-[10px] font-semibold">
                                            ★ Favorite
                                        </span>
                                        <span className="text-[10px] text-white/50">Tracked with Watch</span>
                                    </div>
                                </div>

                                <div className="mt-5">
                                    <h4 className="text-xs text-white/50 uppercase tracking-widest mb-3">Key Stats</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-[10px] text-white/40">Total Time</div>
                                            <div className="text-xl font-semibold">1:03:08</div>
                                            <div className="text-[10px] text-white/40">1:04:04</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-white/40">Training Load</div>
                                            <div className="text-xl font-semibold">79</div>
                                            <div className="text-[10px] text-white/40">105</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-white/40">Avg HR</div>
                                            <div className="text-xl font-semibold">133 bpm</div>
                                            <div className="text-[10px] text-white/40">143 bpm</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-white/40">Energy</div>
                                            <div className="text-xl font-semibold">254 kcal</div>
                                            <div className="text-[10px] text-white/40">307 kcal</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <h4 className="text-xs text-white/50 uppercase tracking-widest mb-3">Zones</h4>
                                    <div className="flex p-1 rounded-full bg-white/10 border border-white/10 text-[10px] mb-3">
                                        <button className="flex-1 py-1 rounded-full bg-white/15 text-white">Training Focus</button>
                                        <button className="flex-1 py-1 rounded-full text-white/50">Heart Rate</button>
                                    </div>

                                    <div className="space-y-3">
                                        {[
                                            { label: "Anaerobic", pct: 8, duration: "0:04:22", color: "bg-purple-500" },
                                            { label: "High Aerobic", pct: 21, duration: "0:18:12", color: "bg-red-500" },
                                            { label: "Low Aerobic", pct: 44, duration: "0:29:08", color: "bg-orange-500" },
                                            { label: "Warm Up", pct: 27, duration: "0:09:08", color: "bg-yellow-500" },
                                        ].map((zone) => (
                                            <div key={zone.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white/60 w-20">{zone.label}</span>
                                                    <div className="h-2 flex-1 rounded-full bg-white/10 overflow-hidden">
                                                        <div className={cn("h-full rounded-full", zone.color)} style={{ width: `${zone.pct}%` }} />
                                                    </div>
                                                </div>
                                                <span className="text-white/50 w-8 text-right">{zone.pct}%</span>
                                                <span className="text-white/40 w-12 text-right">{zone.duration}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>
        </div>
    );
};

// MARK: - Main Dashboard Container

export const ViewDashboard = ({ onNavigate: _onNavigate }: { onNavigate?: (view: string) => void }) => {
    const [activeTab, setActiveTab] = useState<Tab>(Tab.Today);

    const tabs = [
        { id: Tab.Today, label: "Today", icon: FileText },
        { id: Tab.Progress, label: "Progress", icon: Activity },
        { id: Tab.Workouts, label: "Workouts", icon: Dumbbell },
    ];

    return (
        <div className="bg-[#0B0B0D] min-h-screen text-white font-sans selection:bg-emerald-500/30">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                    className="min-h-screen"
                >
                    {activeTab === Tab.Today && <TodayView />}
                    {activeTab === Tab.Progress && <ProgressView />}
                    {activeTab === Tab.Workouts && <WorkoutsView />}
                </motion.div>
            </AnimatePresence>

            <GlassTabBar
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={(id) => setActiveTab(id as Tab)}
            />
        </div>
    );
};
