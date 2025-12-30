'use client';

/**
 * V2 Welcome Page - 营销页
 * 
 * 简洁有力的入口页，CTA → 注册
 */

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function V2WelcomePage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900" />

            {/* Animated orbs */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ duration: 2 }}
                className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-3xl"
            />
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                transition={{ duration: 2, delay: 0.5 }}
                className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-teal-500 rounded-full blur-3xl"
            />

            {/* Content */}
            <div className="relative z-10 text-center max-w-lg">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-5xl font-bold text-white mb-4">
                        AntiAnxiety
                    </h1>
                    <p className="text-xl text-emerald-400 mb-2">
                        对抗焦虑，解锁身体潜能
                    </p>
                    <p className="text-emerald-300/60 mb-12">
                        基于科学的个性化健康管理
                    </p>
                </motion.div>

                {/* Features */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="grid grid-cols-3 gap-4 mb-12"
                >
                    <div className="p-4 bg-white/5 rounded-2xl border border-emerald-700/20">
                        <span className="text-2xl">📋</span>
                        <p className="text-sm text-emerald-300 mt-2">科学计划</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-emerald-700/20">
                        <span className="text-2xl">💬</span>
                        <p className="text-sm text-emerald-300 mt-2">AI 对话</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-emerald-700/20">
                        <span className="text-2xl">📰</span>
                        <p className="text-sm text-emerald-300 mt-2">期刊推荐</p>
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="space-y-4"
                >
                    <Link href="/v2/auth/signup">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-2xl text-white font-semibold text-lg shadow-lg shadow-emerald-900/30 transition-all"
                        >
                            开始使用
                        </motion.button>
                    </Link>
                    <Link href="/v2/auth/login">
                        <button className="w-full py-3 text-emerald-400 hover:text-emerald-300 transition-colors">
                            已有账号？登录
                        </button>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
