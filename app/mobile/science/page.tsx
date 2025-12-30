"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, CheckCircle2, FlaskConical, PlayCircle, Lock, Loader2, ArrowRight } from "lucide-react";
import { usePlans } from "@/hooks/domain/usePlans";
import { useFeed } from "@/hooks/domain/useFeed";

// --- Components ---

function ActivePlanCard({ plan, language = 'en' }: { plan: any, language?: string }) {
    if (!plan) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-600 text-white rounded-[2rem] p-6 shadow-lg shadow-indigo-200 mb-6 relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-10 -mt-20 pointer-events-none" />

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <span className="text-indigo-200 text-xs tracking-widest uppercase font-semibold">
                        {language === 'en' ? 'Active Protocol' : '当前计划'}
                    </span>
                    <h3 className="text-xl font-bold mt-1 max-w-[80%]">{plan.title}</h3>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-serif">
                        {Math.ceil((plan.progress / 100) * (plan.durationDays || 21)) || 1}
                    </div>
                    <div className="text-indigo-200 text-xs">{language === 'en' ? 'Day' : '天'}</div>
                </div>
            </div>

            <div className="space-y-4 relative z-10">
                <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 flex gap-3 items-center">
                    <div className="w-6 h-6 rounded-full border-2 border-white/50 flex items-center justify-center">
                        {/* Checkbox circle */}
                    </div>
                    <span className="text-sm font-medium opacity-90 truncate">
                        {plan.tasks?.[0]?.title || (language === 'en' ? 'Complete today\'s session' : '完成今日任务')}
                    </span>
                </div>

                <div>
                    <div className="flex justify-between text-xs text-indigo-200 mb-2">
                        <span>{language === 'en' ? 'Progress' : '进度'}</span>
                        <span>{plan.progress}%</span>
                    </div>
                    <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-white"
                            initial={{ width: 0 }}
                            animate={{ width: `${plan.progress}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function FeedList({ items, isLoading }: { items: any[], isLoading: boolean }) {
    if (isLoading && items.length === 0) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
            </div>
        );
    }

    if (!items || items.length === 0) return null;

    return (
        <div className="space-y-4">
            {items.map((item, i) => (
                <motion.button
                    key={item.id || i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-left p-5 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${item.locked ? 'bg-slate-100 text-slate-400' : 'bg-green-50 text-green-600 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                            {item.locked ? <Lock className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                        </div>
                        <div>
                            <div className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors line-clamp-1">{item.title}</div>
                            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                                <span>{item.category || "Science"}</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                <span>{item.read_time || "5 min"}</span>
                            </div>
                        </div>
                    </div>
                    {!item.locked && <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors -ml-2 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0" />}
                </motion.button>
            ))}
        </div>
    );
}

export default function MobileSciencePage() {
    // Hooks
    const { activePlans, isLoading: plansLoading } = usePlans();
    const { items: feedItems, isLoading: feedLoading } = useFeed();

    const activePlan = activePlans?.[0] || null;

    return (
        <div className="px-6 py-8 space-y-8 pb-32">
            <div className="flex items-center justify-between sticky top-0 py-2 bg-slate-50/80 backdrop-blur-sm z-20">
                <h1 className="text-2xl font-serif text-slate-900 leading-tight">
                    Science<br />
                    <span className="font-bold">Protocols</span>
                </h1>
                <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600">
                    <FlaskConical className="w-6 h-6" />
                </div>
            </div>

            {/* Current Plan Section */}
            <div>
                {plansLoading ? (
                    <div className="w-full h-48 bg-slate-200 animate-pulse rounded-[2rem]" />
                ) : activePlan ? (
                    <ActivePlanCard plan={activePlan} />
                ) : (
                    <div className="p-6 bg-slate-100 rounded-[2rem] text-center mb-6">
                        <p className="text-slate-500 mb-2">No active protocols</p>
                        <button className="text-indigo-600 font-medium text-sm">Browse Plans</button>
                    </div>
                )}
            </div>

            {/* Knowledge Feed */}
            <div>
                <h3 className="font-serif text-lg text-slate-900 mb-4 flex items-center gap-2">
                    Latest Research
                    {feedLoading && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
                </h3>
                <FeedList items={feedItems} isLoading={feedLoading} />
            </div>
        </div>
    );
}
