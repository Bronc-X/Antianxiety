"use client";

import React from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

// --- Components ---

export const CardGlass = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <div
            className={cn(
                "group relative overflow-hidden rounded-[2rem] border border-white/40 bg-white/70 p-6 backdrop-blur-xl transition-all duration-300 hover:bg-white/80 hover:shadow-lg dark:border-white/10 dark:bg-black/40 dark:hover:bg-black/50 shadow-sm shadow-stone-200/50",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

// --- Health Metric Card ---

interface HealthMetricProps {
    title: string;
    value: string;
    unit?: string;
    icon: LucideIcon;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    colorClass?: string;
    className?: string;
}

export const HealthMetricCard = ({
    title,
    value,
    unit,
    icon: Icon,
    trend,
    trendValue,
    colorClass = "text-rose-500",
    className,
}: HealthMetricProps) => {
    return (
        <CardGlass className={cn("flex flex-col justify-between h-[180px]", className)}>
            <div className="flex justify-between items-start">
                <div className={cn("p-3 rounded-full bg-white/50 dark:bg-white/10", colorClass)}>
                    <Icon size={24} />
                </div>
                {trend && trendValue && trendValue !== "--" && (
                    <span
                        className={cn(
                            "text-sm font-medium px-2 py-1 rounded-full",
                            trend === "up" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                        )}
                    >
                        {trend === "up" ? "↑" : "↓"} {trendValue}
                    </span>
                )}
            </div>
            <div>
                <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-1">{title}</h3>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tight text-emerald-950 dark:text-emerald-50">{value}</span>
                    {unit && <span className="text-sm font-medium text-stone-400 dark:text-stone-500">{unit}</span>}
                </div>
            </div>
        </CardGlass>
    );
};

// --- Mood Wave Chart ---

interface MoodWaveChartProps {
    data: any[];
    title?: string;
    subtitle?: string;
    color?: string;
}

export const MoodWaveChart = ({
    data,
    title = "Emotional Resilience",
    subtitle = "Weekly calm & focus trends",
    color = "#059669"
}: MoodWaveChartProps) => {
    const hasData = data && data.length > 0;

    return (
        <CardGlass className="col-span-2 h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-emerald-950 dark:text-white">{title}</h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400">{subtitle}</p>
                </div>
            </div>
            <div className="flex-1 w-full min-h-0 relative">
                {hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="rounded-lg border border-stone-200 bg-white/90 p-2 shadow-sm backdrop-blur-sm dark:border-stone-800 dark:bg-black/90">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-[0.70rem] uppercase text-stone-500 dark:text-stone-400">Value</span>
                                                        <span className="font-bold text-emerald-900 dark:text-emerald-50">{payload[0].value}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={color}
                                strokeWidth={3}
                                fillOpacity={1}
                                fill={`url(#gradient-${title})`}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-stone-400 text-sm">
                        Waiting for data...
                    </div>
                )}
            </div>
        </CardGlass>
    );
};

// --- Generic Action Card (Replaces NextAppointmentCard) ---

interface ActionCardProps {
    onClick?: () => void;
    title: string;
    subtitle?: string;
    label?: string;
    icon: LucideIcon;
    bgClass?: string;
}

export const NextAppointmentCard = ({
    onClick,
    title,
    subtitle,
    label,
    icon: Icon,
    bgClass = "bg-gradient-to-br from-emerald-600 to-teal-700"
}: ActionCardProps) => {
    return (
        <CardGlass
            className={cn("h-[180px] text-white dark:border-none shadow-lg shadow-emerald-200 dark:shadow-none cursor-pointer hover:scale-[1.02]", bgClass)}
            onClick={onClick}
        >
            <div className="flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                        <Icon size={24} className="text-white" />
                    </div>
                    {label && (
                        <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full backdrop-blur-md">{label}</span>
                    )}
                </div>
                <div>
                    {subtitle && <h4 className="text-white/80 text-sm font-medium mb-1">{subtitle}</h4>}
                    <h3 className="text-2xl font-bold mb-2">{title}</h3>
                </div>
            </div>
        </CardGlass>
    );
};
