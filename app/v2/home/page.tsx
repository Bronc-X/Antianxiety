'use client';

/**
 * V2 Home Page - Dashboard
 * 
 * 用户可见的三个核心功能入口：
 * 1. 科学计划
 * 2. AI 对话
 * 3. 期刊推荐
 */

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { usePlans } from '@/hooks/domain/usePlans';
import { useCalibration } from '@/hooks/domain/useCalibration';
import { useProactiveInquiry } from '@/hooks/domain/useProactiveInquiry';
import { ProactiveInquiryModal } from '@/components/max/ProactiveInquiryModal';

export default function V2HomePage() {
    const { activePlans, isLoading: plansLoading } = usePlans();
    const { isCompleted: calibrationDone, todayData } = useCalibration();
    const { currentInquiry, isInquiryVisible, submitAnswer, dismissInquiry } = useProactiveInquiry();

    const features = [
        {
            id: 'plans',
            title: '科学计划',
            subtitle: '动态调整',
            icon: '📋',
            href: '/v2/plans',
            count: activePlans?.length || 0,
            color: 'from-emerald-600 to-teal-600',
        },
        {
            id: 'max',
            title: 'AI 对话',
            subtitle: '越来越懂你',
            icon: '💬',
            href: '/v2/max',
            color: 'from-blue-600 to-indigo-600',
        },
        {
            id: 'feed',
            title: '期刊推荐',
            subtitle: '95% 匹配度',
            icon: '📰',
            href: '/v2/feed',
            color: 'from-purple-600 to-pink-600',
        },
    ];

    return (
        <div className="min-h-screen p-6">
            {/* Header */}
            <header className="mb-8">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold text-white mb-2"
                >
                    AntiAnxiety
                </motion.h1>
                <p className="text-emerald-400/70">对抗焦虑，解锁身体潜能</p>
            </header>

            {/* Calibration Status */}
            {!calibrationDone && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-6 p-4 bg-amber-900/30 border border-amber-600/30 rounded-2xl"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⚡</span>
                        <div className="flex-1">
                            <p className="text-amber-200 font-medium">今日校准未完成</p>
                            <p className="text-amber-400/60 text-sm">快速校准，让 Max 更懂你</p>
                        </div>
                        <Link
                            href="/v2/calibration"
                            className="px-4 py-2 bg-amber-600/30 hover:bg-amber-600/50 rounded-xl text-amber-200 text-sm transition-colors"
                        >
                            开始
                        </Link>
                    </div>
                </motion.div>
            )}

            {/* Features Grid */}
            <div className="grid gap-4">
                {features.map((feature, index) => (
                    <motion.div
                        key={feature.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Link href={feature.href}>
                            <div className={`p-6 bg-gradient-to-br ${feature.color} rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group`}>
                                <div className="flex items-center gap-4">
                                    <span className="text-4xl">{feature.icon}</span>
                                    <div className="flex-1">
                                        <h2 className="text-xl font-bold text-white group-hover:translate-x-1 transition-transform">
                                            {feature.title}
                                        </h2>
                                        <p className="text-white/70 text-sm">{feature.subtitle}</p>
                                    </div>
                                    {feature.count !== undefined && feature.count > 0 && (
                                        <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm">
                                            {feature.count}
                                        </span>
                                    )}
                                    <svg className="w-6 h-6 text-white/60 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* Proactive Inquiry Modal */}
            <ProactiveInquiryModal
                inquiry={currentInquiry}
                isVisible={isInquiryVisible}
                onAnswer={submitAnswer}
                onDismiss={dismissInquiry}
            />
        </div>
    );
}
