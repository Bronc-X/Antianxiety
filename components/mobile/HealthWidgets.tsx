"use client";

import React from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Heart, Activity, Moon, Sun, Users, Calendar, ArrowRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---
interface HealthMetricProps {
    title: string;
    value: string;
    unit?: string;
    icon: React.ElementType;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    colorClass?: string;
    className?: string;
}

// --- Components ---

export const CardGlass = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    return (
        <div
            className={cn(
                "group relative overflow-hidden rounded-[2rem] border border-white/40 bg-white/70 p-6 backdrop-blur-xl transition-all duration-300 hover:bg-white/80 hover:shadow-lg dark:border-white/10 dark:bg-black/40 dark:hover:bg-black/50 shadow-sm shadow-stone-200/50",
                className
            )}
        >
            {children}
        </div>
    );
};

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
                {trend && (
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

const mockData = [
    { time: "Mon", value: 45 },
    { time: "Tue", value: 52 },
    { time: "Wed", value: 49 },
    { time: "Thu", value: 62 },
    { time: "Fri", value: 55 },
    { time: "Sat", value: 68 },
    { time: "Sun", value: 60 },
];

export const MoodWaveChart = () => {
    return (
        <CardGlass className="col-span-2 h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-emerald-950 dark:text-white">Emotional Resilience</h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400">Weekly calm & focus trends</p>
                </div>
                <button className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                    <MoreHorizontal size={20} className="text-stone-400" />
                </button>
            </div>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockData}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#059669" stopOpacity={0} />
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
                            stroke="#059669"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </CardGlass>
    );
};

export const NextAppointmentCard = () => {
    return (
        <CardGlass className="h-[180px] bg-gradient-to-br from-emerald-600 to-teal-700 text-white dark:border-none shadow-lg shadow-emerald-200 dark:shadow-none">
            <div className="flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                        <Calendar size={24} className="text-white" />
                    </div>
                    <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full backdrop-blur-md">In 2 hours</span>
                </div>
                <div>
                    <h4 className="text-white/80 text-sm font-medium mb-1">Psychologist Consultation</h4>
                    <h3 className="text-2xl font-bold mb-2">Dr. Sarah C.</h3>
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                        <span>02:00 PM</span>
                        <span>•</span>
                        <span>Video Call</span>
                    </div>
                </div>
            </div>
        </CardGlass>
    );
};

export const PatientListCompact = () => {
    const patients = [
        { name: "Alex M.", status: "Stable", time: "10:00 AM", img: "https://i.pravatar.cc/150?u=a" },
        { name: "Jordan K.", status: "Critical", time: "11:30 AM", img: "https://i.pravatar.cc/150?u=b" },
        { name: "Taylor R.", status: "Check-up", time: "14:15 PM", img: "https://i.pravatar.cc/150?u=c" },
    ];

    return (
        <CardGlass className="col-span-1 h-[300px]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-emerald-950 dark:text-white">Recent Patients</h3>
                <button className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">View All</button>
            </div>
            <div className="space-y-4">
                {patients.map((p, i) => (
                    <div key={i} className="flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-stone-100 overflow-hidden">
                                {/* Using a colored div as fallback if img fails, but src is generic. In real app use Next Image */}
                                <img src={p.img} alt={p.name} className="h-full w-full object-cover" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-emerald-950 dark:text-emerald-50 group-hover:text-emerald-600 transition-colors">{p.name}</p>
                                <p className="text-xs text-stone-500 dark:text-stone-400">{p.time}</p>
                            </div>
                        </div>
                        <span className={cn(
                            "text-xs px-2 py-1 rounded-full font-medium",
                            p.status === "Critical" ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" :
                                p.status === "Stable" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                    "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                        )}>
                            {p.status}
                        </span>
                    </div>
                ))}
            </div>
        </CardGlass>
    )
}
