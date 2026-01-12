"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CardGlass } from "@/components/mobile/HealthWidgets";
import {
    CheckCircle2,
    Circle,
    BookOpen,
    Sparkles,
    Bookmark,
    Plus,
    ArrowRight,
    Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ViewPlanCreator } from "./ViewPlanCreator";
import { ViewPlanDetail } from "./ViewPlanDetail";
import { ViewArticleReader } from "./ViewArticleReader";
import { useI18n } from "@/lib/i18n";

const pageVariants = {
    initial: { opacity: 0, x: 10 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -10 }
};

const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.3
} as const;

import { usePlans, type PlanData } from "@/hooks/domain/usePlans";
import { useFeed } from "@/hooks/domain/useFeed";

interface ViewPlanProps {
    onNavigate?: (view: string) => void;
}

export const ViewPlan = ({ onNavigate }: ViewPlanProps) => {
    const { plans, completedPlans, complete, resume, create, isSaving, error, isLoading } = usePlans();
    const { language } = useI18n();
    const feedLanguage = language === 'en' ? 'en' : 'zh';
    const feed = useFeed({ language: feedLanguage, cacheDaily: true, cacheNamespace: 'mobile-plan-discovery' });

    const [tab, setTab] = useState<'today' | 'discovery'>('today');
    const [filter, setFilter] = useState<'all' | 'saved'>('all');

    // Sub-view states
    const [showCreator, setShowCreator] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null);
    const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

    const handleTogglePlan = async (plan: PlanData) => {
        if (plan.status === 'completed') {
            // Re-activate? Domain hook doesn't have explicit 'uncomplete', using resume as proxy or we might need to add it.
            // For now assuming we can only complete active plans, or toggle back.
            // The hook has resume/pause. Let's assume we can't easily undo completion without a specific API, 
            // but for UI responsiveness we might want to allow it. 
            // Actually usePlans has updateItems. 
            // Let's just implement completion flow for now.
            await resume(plan.id); // Try to resume if completed?
        } else {
            await complete(plan.id);
        }
    };

    const progress = plans.length > 0 ? Math.round((completedPlans.length / plans.length) * 100) : 0;
    const filteredFeedItems = useMemo(() => {
        if (filter === 'saved') {
            return feed.items.filter(item => item.is_saved);
        }
        return feed.items;
    }, [feed.items, filter]);
    const activeArticle = selectedArticleId ? feed.items.find(item => item.id === selectedArticleId) : null;

    // Show loading skeleton when plans are loading
    if (isLoading) {
        return (
            <motion.div
                initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}
                className="flex flex-col h-full pb-24 items-center justify-center"
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full"
                />
                <p className="text-stone-500 text-sm mt-3">正在加载计划...</p>
            </motion.div>
        );
    }

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
                <button
                    onClick={() => onNavigate?.('goals')}
                    className="p-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-full"
                >
                    <Target size={20} />
                </button>
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

                            {plans.map((p) => {
                                const isCompleted = p.status === 'completed';
                                const rawType = p.plan_type || p.category || 'general';
                                const normalizedType = rawType.toLowerCase();
                                const uiType = normalizedType === 'exercise' || normalizedType === 'body'
                                    ? 'Body'
                                    : normalizedType === 'diet' || normalizedType === 'nutrition'
                                        ? 'Nutrition'
                                        : normalizedType === 'sleep'
                                            ? 'Sleep'
                                            : normalizedType === 'nature' || normalizedType === 'outdoors'
                                                ? 'Nature'
                                                : normalizedType === 'mind' || normalizedType === 'comprehensive'
                                                    ? 'Mind'
                                                    : 'General';

                                return (
                                    <CardGlass
                                        key={p.id}
                                        className={cn(
                                            "group p-4 flex flex-col gap-2 cursor-pointer hover:bg-stone-50 dark:hover:bg-white/5 transition-all border-stone-100 dark:border-white/5",
                                            isCompleted && "opacity-70 grayscale-[0.5]"
                                        )}
                                        onClick={() => setSelectedPlan(p)} // Open Details
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    onClick={(e) => { e.stopPropagation(); handleTogglePlan(p); }}
                                                    className={cn("transition-colors cursor-pointer", isCompleted ? "text-emerald-600" : "text-stone-300 dark:text-stone-600 group-hover:text-emerald-400")}
                                                >
                                                    {isCompleted ? <CheckCircle2 size={24} className="fill-emerald-600/10" /> : <Circle size={24} />}
                                                </div>
                                                <div>
                                                    <h4 className={cn("font-medium transition-all text-sm", isCompleted ? "text-stone-400 line-through decoration-stone-300" : "text-emerald-950 dark:text-emerald-50")}>{p.name}</h4>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={cn(
                                                            "text-[10px] px-1.5 py-0.5 rounded",
                                                            uiType === 'Mind' ? "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300" :
                                                                uiType === 'Body' ? "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300" :
                                                                    uiType === 'Nutrition' ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-300" :
                                                                        "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300"
                                                        )}>{uiType}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {p.items && p.items.length > 0 && (
                                                <div className="h-6 w-6 flex items-center justify-center rounded-full bg-stone-100 dark:bg-white/5 text-stone-400">
                                                    <span className="text-[10px] font-bold">{p.items.filter(t => t.completed).length}/{p.items.length}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Subtasks (Only showing if active for demo) */}
                                        {!isCompleted && p.items && p.items.length > 0 && (
                                            <div className="ml-10 mt-2 space-y-1.5 border-l-2 border-stone-100 dark:border-white/5 pl-4">
                                                {p.items.slice(0, 2).map(t => (
                                                    <div key={t.id} className="flex items-center gap-2">
                                                        <div className={cn("w-3 h-3 rounded border", t.completed ? "bg-emerald-500 border-emerald-500" : "border-stone-300 dark:border-stone-600")} />
                                                        <span className="text-xs text-stone-500">{t.text}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardGlass>
                                )
                            })}
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

                        {feed.isLoading && feed.items.length === 0 && (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-40 rounded-2xl bg-stone-100 dark:bg-white/5 animate-pulse" />
                                ))}
                            </div>
                        )}

                        {feed.error && feed.items.length === 0 && !feed.isLoading && (
                            <CardGlass className="p-4 text-center">
                                <p className="text-sm text-rose-600">{feed.error}</p>
                                <button
                                    onClick={() => feed.refresh()}
                                    className="mt-3 text-xs font-bold text-emerald-600"
                                >
                                    Retry
                                </button>
                            </CardGlass>
                        )}

                        {filteredFeedItems.map((item) => {
                            const readTime = typeof item.read_time_minutes === 'number' && item.read_time_minutes > 0
                                ? `${item.read_time_minutes} min`
                                : '3 min';
                            const categoryLabel = (item.category || item.type || 'general').toUpperCase();

                            return (
                                <CardGlass
                                    key={item.id}
                                    className="p-0 overflow-hidden group cursor-pointer border-stone-100 dark:border-white/5"
                                    onClick={() => {
                                        feed.read(item.id);
                                        setSelectedArticleId(item.id);
                                    }}
                                >
                                    <div className="h-32 overflow-hidden relative">
                                        {item.image_url ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-emerald-100 via-stone-100 to-amber-100" />
                                        )}
                                        <div className="absolute top-3 left-3 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-wide">
                                            {categoryLabel}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                feed.save(item.id);
                                            }}
                                            className="absolute top-3 right-3 p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors"
                                        >
                                            <Bookmark size={14} className={cn(item.is_saved && "fill-white")} />
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-emerald-950 dark:text-emerald-50 mb-1 leading-tight">{item.title}</h3>
                                        {item.summary && (
                                            <p className="text-xs text-stone-500 line-clamp-2">{item.summary}</p>
                                        )}
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-2 text-xs text-stone-400">
                                                <BookOpen size={12} /> {readTime} read
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowRight size={16} className="text-emerald-600" />
                                            </div>
                                        </div>
                                    </div>
                                </CardGlass>
                            );
                        })}

                        {filter === 'saved' && filteredFeedItems.length === 0 && !feed.isLoading && (
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
                {showCreator && (
                    <ViewPlanCreator
                        onClose={() => setShowCreator(false)}
                        onCreate={create}
                        isSaving={isSaving}
                        error={error}
                    />
                )}
                {selectedPlan && <ViewPlanDetail plan={selectedPlan} onClose={() => setSelectedPlan(null)} />}
                {activeArticle && (
                    <ViewArticleReader
                        article={activeArticle}
                        onClose={() => setSelectedArticleId(null)}
                        onSave={feed.save}
                        onFeedback={feed.feedback}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    )
}
