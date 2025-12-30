'use client';

/**
 * V2 Plans Page - 科学计划
 * 
 * 用户可见的核心功能之一：动态调整的健康计划
 */

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePlans } from '@/hooks/domain/usePlans';

export default function V2PlansPage() {
    const { plans, activePlans, completedPlans, isLoading, complete, refresh } = usePlans();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-emerald-400">加载中...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6">
            {/* Header */}
            <header className="flex items-center gap-4 mb-8">
                <Link href="/v2/home" className="text-emerald-400 hover:text-emerald-300">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <h1 className="text-2xl font-bold text-white">科学计划</h1>
            </header>

            {/* Active Plans */}
            <section className="mb-8">
                <h2 className="text-lg font-semibold text-emerald-400 mb-4">进行中 ({activePlans.length})</h2>
                <div className="space-y-4">
                    {activePlans.map((plan, index) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 bg-emerald-900/30 border border-emerald-700/30 rounded-2xl"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="text-white font-medium mb-1">{plan.name}</h3>
                                    <p className="text-emerald-400/60 text-sm line-clamp-2">{plan.description}</p>
                                </div>
                                <button
                                    onClick={() => complete(plan.id)}
                                    className="ml-4 px-3 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 rounded-lg text-emerald-300 text-sm transition-colors"
                                >
                                    完成
                                </button>
                            </div>
                            {/* Progress bar */}
                            <div className="mt-3 h-2 bg-emerald-950 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${plan.progress || 0}%` }}
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                                />
                            </div>
                        </motion.div>
                    ))}

                    {activePlans.length === 0 && (
                        <div className="text-center py-12 text-emerald-400/50">
                            <p>暂无进行中的计划</p>
                            <p className="text-sm mt-2">完成每日校准后，Max 会为你生成个性化计划</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Completed Plans */}
            {completedPlans.length > 0 && (
                <section>
                    <h2 className="text-lg font-semibold text-emerald-400/60 mb-4">已完成 ({completedPlans.length})</h2>
                    <div className="space-y-3 opacity-60">
                        {completedPlans.slice(0, 3).map((plan) => (
                            <div key={plan.id} className="p-3 bg-slate-800/30 rounded-xl">
                                <p className="text-slate-400 line-through">{plan.name}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
