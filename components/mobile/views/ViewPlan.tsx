"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CardGlass } from "@/components/mobile/HealthWidgets";
import {
    CheckCircle2,
    Circle,
    Zap,
    BookOpen,
    Sparkles,
    Filter,
    Bookmark,
    Plus,
    MoreHorizontal,
    Clock,
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ViewPlanCreator } from "./ViewPlanCreator";
import { ViewPlanDetail } from "./ViewPlanDetail";
import { ViewArticleReader } from "./ViewArticleReader";

const pageVariants = {
    initial: { opacity: 0, x: 10 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -10 }
};

const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.3
};

interface Plan {
    id: number;
    title: string;
    time: string;
    completed: boolean;
    type: "Mind" | "Body" | "Nutrition" | "Sleep";
    subtasks?: { id: number, title: string, completed: boolean }[];
}

interface Article {
    id: number;
    title: string;
    category: string;
    img: string;
    readTime: string;
    saved: boolean;
}

export const ViewPlan = () => {
    const [tab, setTab] = useState<'today' | 'discovery'>('today');
    const [filter, setFilter] = useState<'all' | 'saved'>('all');

    // Sub-view states
    const [showCreator, setShowCreator] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

    // Simulated Plan Data
    const [plans, setPlans] = useState<Plan[]>([
        { id: 1, title: "Morning Meditation", time: "10 min", completed: true, type: "Mind" },
        {
            id: 2, title: "HIIT Workout", time: "30 min", completed: false, type: "Body", subtasks: [
                { id: 1, title: "Warm up (5 min)", completed: false },
                { id: 2, title: "Circuit A (10 min)", completed: false }
            ]
        },
        { id: 3, title: "Log Lunch", time: "5 min", completed: false, type: "Nutrition" },
        { id: 4, title: "Evening Stretch", time: "15 min", completed: false, type: "Body" },
    ]);

    const [feed, setFeed] = useState<Article[]>([
        { id: 1, title: "Understanding Cortisol", category: "Science", img: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800", readTime: "5 min", saved: false },
        { id: 2, title: "The Power of Sleep", category: "Recovery", img: "https://images.unsplash.com/photo-1511296187010-86b2e30cad41?auto=format&fit=crop&q=80&w=800", readTime: "8 min", saved: true },
        { id: 3, title: "Nutrition for Brain Fog", category: "Nutrition", img: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=800", readTime: "6 min", saved: false },
    ]);

    const togglePlan = (id: number) => {
        setPlans(plans.map(p => p.id === id ? { ...p, completed: !p.completed } : p));
    };

    const toggleSave = (id: number) => {
        setFeed(feed.map(a => a.id === id ? { ...a, saved: !a.saved } : a));
    };

    const progress = Math.round((plans.filter(p => p.completed).length / plans.length) * 100);

    return (
        <motion.div
            initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}
            className="flex flex-col h-full pb-24 relative"
        >
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">Your Plan</h2>
                <div className="flex bg-stone-200 dark:bg-white/5 p-1 rounded-xl">
                    <button
                        onClick={() => setTab('today')}
                        className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", tab === 'today' ? "bg-white dark:bg-white/10 shadow-sm text-emerald-900 dark:text-emerald-50" : "text-stone-500 dark:text-stone-400 hover:text-emerald-800")}
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setTab('discovery')}
                        className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", tab === 'discovery' ? "bg-white dark:bg-white/10 shadow-sm text-emerald-900 dark:text-emerald-50" : "text-stone-500 dark:text-stone-400 hover:text-emerald-800")}
                    >
                        Discovery
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {tab === 'today' ? (
                    <motion.div
                        key="today" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {/* Progress Header */}
                        <CardGlass className="bg-emerald-600 text-white border-none p-5 shadow-lg shadow-emerald-200 dark:shadow-none relative overflow-hidden">
                            {/* Confetti / Decoration Background */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />

                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div>
                                    <h3 className="font-bold text-lg">Daily Progress</h3>
                                    <p className="text-emerald-100 text-xs">{progress === 100 ? "All done! Amazing work." : "Keep going, you check these off."}</p>
                                </div>
                                <span className="text-3xl font-bold">{progress}%</span>
                            </div>
                            <div className="h-2 bg-black/10 rounded-full overflow-hidden relative z-10">
                                <motion.div
                                    className="h-full bg-amber-400 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                />
                            </div>
                        </CardGlass>

                        {/* AI Generate Action */}
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowCreator(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-200 to-amber-300 dark:from-amber-600/30 dark:to-amber-500/30 text-amber-900 dark:text-amber-100 rounded-full text-[10px] font-bold shadow-sm hover:scale-105 transition-transform"
                            >
                                <Sparkles size={12} /> Regenerate with AI
                            </button>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">
                                <span>To Do</span>
                                <button
                                    onClick={() => setShowCreator(true)}
                                    className="p-1 hover:bg-stone-100 dark:hover:bg-white/5 rounded-full"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>

                            {plans.map((p) => (
                                <CardGlass
                                    key={p.id}
                                    className={cn(
                                        "group p-4 flex flex-col gap-2 cursor-pointer hover:bg-stone-50 dark:hover:bg-white/5 transition-all border-stone-100 dark:border-white/5",
                                        p.completed && "opacity-70 grayscale-[0.5]"
                                    )}
                                    onClick={() => setSelectedPlan(p)} // Open Details
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div
                                                onClick={(e) => { e.stopPropagation(); togglePlan(p.id); }}
                                                className={cn("transition-colors cursor-pointer", p.completed ? "text-emerald-600" : "text-stone-300 dark:text-stone-600 group-hover:text-emerald-400")}
                                            >
                                                {p.completed ? <CheckCircle2 size={24} className="fill-emerald-600/10" /> : <Circle size={24} />}
                                            </div>
                                            <div>
                                                <h4 className={cn("font-medium transition-all text-sm", p.completed ? "text-stone-400 line-through decoration-stone-300" : "text-emerald-950 dark:text-emerald-50")}>{p.title}</h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={cn(
                                                        "text-[10px] px-1.5 py-0.5 rounded",
                                                        p.type === 'Mind' ? "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300" :
                                                            p.type === 'Body' ? "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300" :
                                                                "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300"
                                                    )}>{p.type}</span>
                                                    <span className="text-xs text-stone-400 flex items-center gap-1"><Zap size={10} /> {p.time}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {p.subtasks && (
                                            <div className="h-6 w-6 flex items-center justify-center rounded-full bg-stone-100 dark:bg-white/5 text-stone-400">
                                                <span className="text-[10px] font-bold">{p.subtasks.filter(t => t.completed).length}/{p.subtasks.length}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Subtasks (Only showing if active for demo) */}
                                    {!p.completed && p.subtasks && (
                                        <div className="ml-10 mt-2 space-y-1.5 border-l-2 border-stone-100 dark:border-white/5 pl-4">
                                            {p.subtasks.map(t => (
                                                <div key={t.id} className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded border border-stone-300 dark:border-stone-600" />
                                                    <span className="text-xs text-stone-500">{t.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardGlass>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="discovery" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {/* Feed Filters */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                            <button
                                onClick={() => setFilter('all')}
                                className={cn("px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors", filter === 'all' ? "bg-emerald-900 text-white shadow-md" : "bg-white dark:bg-white/5 text-stone-500 border border-stone-200 dark:border-white/10")}
                            >
                                All Posts
                            </button>
                            <button
                                onClick={() => setFilter('saved')}
                                className={cn("px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5", filter === 'saved' ? "bg-emerald-900 text-white shadow-md" : "bg-white dark:bg-white/5 text-stone-500 border border-stone-200 dark:border-white/10")}
                            >
                                <Bookmark size={12} className={filter === 'saved' ? "fill-white" : ""} /> Saved
                            </button>
                        </div>

                        {feed
                            .filter(f => filter === 'all' || (filter === 'saved' && f.saved))
                            .map((item) => (
                                <CardGlass
                                    key={item.id}
                                    className="p-0 overflow-hidden group cursor-pointer border-stone-100 dark:border-white/5"
                                    onClick={() => setSelectedArticle(item)} // Open Article Reader
                                >
                                    <div className="h-32 overflow-hidden relative">
                                        <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute top-3 left-3 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-wide">
                                            {item.category}
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleSave(item.id); }}
                                            className="absolute top-3 right-3 p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors"
                                        >
                                            <Bookmark size={14} className={cn(item.saved && "fill-white")} />
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-emerald-950 dark:text-emerald-50 mb-1 leading-tight">{item.title}</h3>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-2 text-xs text-stone-400">
                                                <BookOpen size={12} /> {item.readTime} read
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowRight size={16} className="text-emerald-600" />
                                            </div>
                                        </div>
                                    </div>
                                </CardGlass>
                            ))}

                        {filter === 'saved' && feed.filter(f => f.saved).length === 0 && (
                            <div className="py-12 text-center">
                                <Bookmark size={32} className="mx-auto text-stone-300 mb-2" />
                                <p className="text-stone-400 text-sm">No saved articles yet.</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Overlays */}
            <AnimatePresence>
                {showCreator && <ViewPlanCreator onClose={() => setShowCreator(false)} />}
                {selectedPlan && <ViewPlanDetail plan={selectedPlan} onClose={() => setSelectedPlan(null)} />}
                {selectedArticle && <ViewArticleReader article={selectedArticle} onClose={() => setSelectedArticle(null)} />}
            </AnimatePresence>
        </motion.div>
    )
}
