"use client";

import { motion } from "framer-motion";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import InteractiveShape from "@/components/replication/InteractiveShape";

const DAYS = [
    { day: "一", date: 10, active: false },
    { day: "二", date: 11, active: false },
    { day: "三", date: 12, active: true }, // Today
    { day: "四", date: 13, active: false },
    { day: "五", date: 14, active: false },
    { day: "六", date: 15, active: false },
    { day: "日", date: 16, active: false },
];

const ENTRIES = [
    {
        time: "09:30",
        mood: "Peaceful",
        note: "晨间冥想完成，感觉很平静。",
        color: "from-teal-300 to-emerald-400"
    },
    {
        time: "14:15",
        mood: "Anxious",
        note: "工作会议有点压力，需要深呼吸。",
        color: "from-rose-300 to-pink-400"
    },
    {
        time: "19:00",
        mood: "Happy",
        note: "和朋友晚餐，非常愉快。",
        color: "from-amber-200 to-orange-300"
    }
];

export default function MoodDiaryPage() {
    return (
        <div className="flex flex-col h-full w-full relative bg-slate-50">

            {/* Header */}
            <header className="px-6 pt-12 pb-2 flex justify-between items-center z-10 bg-slate-50/80 backdrop-blur-md sticky top-0">
                <h1 className="text-2xl font-bold text-slate-900">情绪日记</h1>
                <button className="w-10 h-10 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-600">
                    <ChevronLeft className="w-5 h-5" />
                </button>
            </header>

            {/* Calendar Strip */}
            <div className="px-5 py-4">
                <div className="flex justify-between items-center bg-white rounded-[2rem] p-4 shadow-sm">
                    {DAYS.map((item, index) => (
                        <div key={index} className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${item.active ? "opacity-100 scale-110" : "opacity-40"}`}>
                            <span className="text-xs font-medium">{item.day}</span>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${item.active ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" : "bg-transparent text-slate-900"}`}>
                                {item.date}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto px-6 pb-32 no-scrollbar">
                <div className="relative pl-4 border-l-2 border-slate-100 space-y-8 py-4">
                    {ENTRIES.map((entry, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative"
                        >
                            {/* Visual Connector Dot */}
                            <div className={`absolute -left-[25px] top-6 w-4 h-4 rounded-full border-4 border-slate-50 bg-gradient-to-br ${entry.color}`} />

                            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-50/50 relative overflow-hidden group">
                                {/* Subtle Glass Noise/Texture */}
                                <div className="absolute inset-0 bg-slate-50/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-bold text-slate-900">{entry.time}</div>
                                    <div className={`text-xs px-2 py-1 rounded-full bg-slate-100/80 font-medium ${entry.mood === 'Anxious' ? 'text-rose-500' : 'text-slate-500'}`}>
                                        {entry.mood}
                                    </div>
                                </div>
                                <p className="text-slate-600 text-sm leading-relaxed relative z-10">
                                    {entry.note}
                                </p>

                                {/* Decorative Ambience Orb */}
                                <div className={`absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-gradient-to-br ${entry.color} blur-xl opacity-20`} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Floating Add Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute bottom-24 right-6 w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-2xl shadow-slate-900/30 active:scale-95 z-20"
            >
                <Plus className="w-6 h-6" />
            </motion.button>
        </div>
    );
}
