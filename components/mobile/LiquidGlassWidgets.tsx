"use client";

import React, { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

// MARK: - Liquid Glass Card
interface LiquidGlassCardProps {
    children: React.ReactNode;
    className?: string;
    tint?: "neutral" | "green" | "blue" | "red";
    interactive?: boolean;
    onClick?: () => void;
}

export const LiquidGlassCard = ({
    children,
    className,
    tint = "neutral",
    interactive = false,
    onClick
}: LiquidGlassCardProps) => {
    const tintColors = {
        neutral: "bg-white/5",
        green: "bg-emerald-500/12",
        blue: "bg-blue-500/12",
        red: "bg-red-500/12",
    };

    const Wrapper = interactive ? motion.div : "div";

    return (
        // @ts-expect-error - framer motion types
        <Wrapper
            whileTap={interactive ? { scale: 0.98 } : undefined}
            onClick={onClick}
            className={cn(
                "relative overflow-hidden rounded-[22px]",
                "border border-white/10",
                "backdrop-blur-[24px] shadow-[0_12px_30px_rgba(0,0,0,0.35)]",
                "before:absolute before:inset-0 before:rounded-[22px] before:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] before:content-['']",
                tintColors[tint],
                className
            )}
        >
            {/* Noise Texture */}
            <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Gloss Highlights */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-60" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent opacity-30" />

            {/* Content */}
            <div className="relative z-10">{children}</div>
        </Wrapper>
    );
};

// MARK: - Liquid Glass Button
export const LiquidGlassButton = ({
    children,
    className,
    onClick,
}: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}) => {
    return (
        <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onClick}
            className={cn(
                "relative overflow-hidden rounded-full p-3",
                "bg-white/10 border border-white/10 backdrop-blur-md",
                "flex items-center justify-center text-white",
                "shadow-[0_4px_12px_rgba(0,0,0,0.2)]",
                className
            )}
        >
            {children}
        </motion.button>
    );
};

// MARK: - Animated Blob Background
export const AnimatedBlobBackground = ({ theme = "green" }: { theme?: "green" | "blue" | "red" | "neutral" }) => {
    const colors = {
        green: ["bg-emerald-500/50", "bg-lime-400/40", "bg-teal-500/30"],
        blue: ["bg-blue-600/50", "bg-cyan-400/40", "bg-indigo-500/30"],
        red: ["bg-red-600/50", "bg-orange-400/40", "bg-rose-500/30"],
        neutral: ["bg-stone-500/40", "bg-gray-400/30", "bg-zinc-500/30"],
    }[theme];

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
            <div className="absolute inset-0 bg-[#0B0B0D]" />
            <motion.div
                className={cn("absolute w-[85vw] h-[85vw] rounded-full mix-blend-screen opacity-25 blur-[90px]", colors[0])}
                animate={{
                    x: ["-18%", "18%", "-18%"],
                    y: ["-18%", "12%", "-18%"],
                    scale: [1, 1.12, 1],
                }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                style={{ top: "-20%", left: "-25%" }}
            />
            <motion.div
                className={cn("absolute w-[70vw] h-[70vw] rounded-full mix-blend-screen opacity-22 blur-[70px]", colors[1])}
                animate={{
                    x: ["15%", "-12%", "15%"],
                    y: ["30%", "0%", "30%"],
                    scale: [1.05, 0.92, 1.05],
                }}
                transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                style={{ top: "18%", right: "-8%" }}
            />
        </div>
    );
};

// MARK: - Glass Tab Bar
interface TabItem {
    id: string;
    label: string;
    icon: React.ElementType;
}

export const GlassTabBar = ({
    tabs,
    activeTab,
    onTabChange,
}: {
    tabs: TabItem[];
    activeTab: string;
    onTabChange: (id: string) => void;
}) => {
    const activeAccent = "#ff4d8d"; // Neon pink/red accent for active state

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[86%] max-w-[320px]">
            <div className="flex items-center gap-1.5 p-1.5 rounded-[28px] bg-black/60 backdrop-blur-[32px] border border-white/10 shadow-[0_10px_32px_rgba(0,0,0,0.45)]">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={cn(
                                "relative flex-1 py-2.5 rounded-[18px]",
                                "flex flex-col items-center justify-center gap-1",
                                "text-[10px] font-semibold tracking-wide transition-colors duration-300",
                                isActive ? "text-white" : "text-white/60 hover:text-white/80"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="glass-tab-pill"
                                    className="absolute inset-0 rounded-[18px] border"
                                    style={{
                                        backgroundColor: `${activeAccent}26`, // 15% opacity
                                        borderColor: `${activeAccent}55`, // 33% opacity
                                    }}
                                    transition={{ type: "spring", bounce: 0.25, duration: 0.55 }}
                                />
                            )}
                            <span className="relative z-10 flex flex-col items-center gap-0.5">
                                <Icon
                                    size={18}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    style={{ color: isActive ? activeAccent : undefined }}
                                />
                                <span style={{ color: isActive ? activeAccent : undefined }}>
                                    {tab.label}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// MARK: - RPE Slider Code
export const RPESlider = ({ value, onChange, onSave, onDismiss }: { value: number; onChange: (v: number) => void; onSave?: (v: number) => void; onDismiss?: () => void }) => {
    const constraintsRef = useRef<HTMLDivElement>(null);
    const percent = Math.max(0, Math.min(100, ((value - 1) / 9) * 100));

    const getColor = (v: number) => {
        if (v <= 3) return "#22c55e"; // Green
        if (v <= 5) return "#f59e0b"; // Yellow
        if (v <= 6) return "#f97316"; // Orange
        if (v <= 8) return "#ef4444"; // Red
        return "#a855f7"; // Purple
    };

    const getDescription = (v: number) => {
        if (v <= 1) return "No Effort";
        if (v <= 3) return "Light Effort";
        if (v <= 5) return "Moderate";
        if (v <= 7) return "Hard";
        if (v <= 9) return "Very Hard";
        return "Max Effort";
    };

    const currentColor = getColor(value);
    const isAboveUsual = value > 4; // Simple threshold logic

    return (
        <div className="flex flex-col items-center w-full">
            {/* Value Display */}
            <div className="text-center space-y-1 mb-8">
                <motion.div
                    key={Math.round(value)}
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="text-7xl font-bold tracking-tighter"
                    style={{ color: currentColor }}
                >
                    {Math.round(value)}
                </motion.div>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xl font-semibold text-white/95"
                >
                    {getDescription(value)}
                </motion.div>
                <div className="text-xs text-white/40 font-medium tracking-wide uppercase mt-1">
                    Based on available HR data
                </div>
            </div>

            {/* Slider Track */}
            <div className="relative w-full h-12 flex items-center justify-center select-none touch-none mb-8" ref={constraintsRef}>
                {/* Glow */}
                <div className="absolute inset-x-0 h-3 rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 via-orange-500 to-purple-600 opacity-50 blur-[3px]" />

                {/* Track */}
                <div className="absolute inset-x-0 h-3 rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 via-orange-500 to-purple-600 overflow-hidden">
                    {/* Hash pattern for "Above Usual" range */}
                    <div
                        className="absolute inset-y-0 right-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0tMSw1IEw1LC0xIiBzdHJva2U9InJnYmEoMCwwLDAsMC4yKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] opacity-60"
                        style={{ left: '40%' /* Assuming '4' is 40% threshold for alert */ }}
                    />
                </div>

                {/* Knob */}
                <motion.div
                    drag="x"
                    dragConstraints={constraintsRef}
                    dragElastic={0}
                    dragMomentum={false}
                    onDrag={(_, info) => {
                        if (constraintsRef.current) {
                            const width = constraintsRef.current.offsetWidth;
                            const newPercent = Math.min(100, Math.max(0, (info.point.x - constraintsRef.current.getBoundingClientRect().left) / width * 100));
                            // Map 0-100% to 1-10
                            const newValue = 1 + (newPercent / 100) * 9;
                            onChange(newValue);
                        }
                    }}
                    animate={{ left: `${percent}%`, x: "-50%" }}
                    className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#0B0B0D] z-20 cursor-grab active:cursor-grabbing"
                    style={{ boxShadow: `0 0 20px ${currentColor}80` }}
                >
                    <div className="absolute inset-1 rounded-full border-2 bg-white/90" style={{ borderColor: currentColor }} />
                </motion.div>
            </div>

            {/* Alert / Notice */}
            <AnimatePresence>
                {isAboveUsual && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="w-full mb-6 overflow-hidden"
                    >
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex items-start gap-3">
                            <div className="w-1 h-full min-h-[24px] rounded-full bg-orange-500" />
                            <div>
                                <h4 className="text-sm font-semibold text-orange-400">Above-usual Range</h4>
                                <p className="text-xs text-orange-300/70 leading-relaxed mt-0.5">
                                    Your effort is higher than what is typical for this heart rate zone. Ensure you are recovering well.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Actions */}
            <div className="w-full space-y-3">
                <button
                    onClick={() => onSave?.(value)}
                    className="w-full py-4 rounded-2xl font-bold text-lg text-black shadow-lg transition-transform active:scale-[0.98]"
                    style={{ backgroundColor: currentColor }}
                >
                    {isAboveUsual ? "Confirm High Effort" : "Save RPE"}
                </button>
                <div className="flex items-center justify-between px-2">
                    <button onClick={onDismiss} className="text-xs font-semibold text-white/40 hover:text-white transition-colors">
                        Clear Entry
                    </button>
                    <button className="text-xs font-semibold text-white/40 hover:text-white transition-colors">
                        How to Self-Assess?
                    </button>
                </div>
            </div>
        </div>
    );
};
