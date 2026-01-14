'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Activity, Brain, AlertTriangle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function ComparisonSection() {
    const { language } = useI18n();
    const ref = useRef(null);
    const [showNotification, setShowNotification] = useState(false);

    useEffect(() => {
        // Reveal notification after a delay once in view (simplified for this context)
        const timer = setInterval(() => {
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 4000);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section ref={ref} className="py-24 px-6 md:px-12 max-w-[1400px] mx-auto bg-[#FAF6EF] dark:bg-[#1A1A1A] overflow-hidden">
            {/* Spotlight */}
            <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-red-900/5 dark:bg-red-900/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="grid md:grid-cols-2 gap-20 items-center relative z-10">
                {/* Phone mockup from Beta */}
                <div className="relative perspective-1000 flex justify-center">
                    <motion.div
                        className="relative w-[300px] h-[600px] bg-[#1a1a1a] rounded-[48px] border-[8px] border-[#2a2a2a] shadow-2xl overflow-hidden"
                        initial={{ rotateY: -15, rotateX: 5 }}
                        whileInView={{ rotateY: 0, rotateX: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    >
                        {/* Screen Reflection */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent z-20 pointer-events-none" />

                        {/* Phone screen */}
                        <div className="absolute inset-0 bg-[#121212] overflow-hidden font-sans">
                            {/* Status Bar */}
                            <div className="absolute top-0 left-0 right-0 h-14 flex justify-between items-center px-6 text-white/80 text-xs z-20">
                                <span>9:41</span>
                                <div className="flex gap-1.5">
                                    <div className="w-4 h-2.5 border border-white/30 rounded-[2px]" />
                                </div>
                            </div>

                            {/* Dynamic Island / Notch Area */}
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-8 bg-black rounded-full z-20" />

                            {/* Realistic Fitness App UI */}
                            <div className="pt-16 px-4 h-full flex flex-col">
                                {/* App Header with Logo */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                                            <Activity className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-white/80 text-xs font-semibold tracking-wide">FitPro</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                        <span className="text-xs">👤</span>
                                    </div>
                                </div>

                                {/* Streak Counter - 连续打卡 */}
                                <div className="bg-gradient-to-br from-orange-600/30 to-red-600/20 border border-orange-500/30 rounded-2xl p-4 mb-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-white/60 text-xs">🔥 {language === 'en' ? 'Streak' : '连续打卡'}</span>
                                        <span className="text-orange-400 text-[10px] font-medium px-2 py-0.5 bg-orange-500/20 rounded-full">
                                            {language === 'en' ? 'KEEP IT UP!' : '继续保持!'}
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-bold text-white">47</span>
                                        <span className="text-white/50 text-xs">{language === 'en' ? 'days' : '天'}</span>
                                    </div>
                                    {/* Calendar dots */}
                                    <div className="flex gap-1 mt-3">
                                        {[...Array(7)].map((_, i) => (
                                            <div key={i} className={`w-5 h-5 rounded-md flex items-center justify-center text-[8px] ${i < 6 ? 'bg-green-500/30 text-green-400' : 'bg-white/10 text-white/30 border border-dashed border-white/20'}`}>
                                                {i < 6 ? '✓' : '?'}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Generic Workout Suggestion - 平庸建议 */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Brain className="w-4 h-4 text-blue-400" />
                                        <span className="text-white/70 text-xs">{language === 'en' ? "Today's Plan" : '今日计划'}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-white/80">🏃 {language === 'en' ? 'Run 5km' : '跑步 5公里'}</span>
                                            <span className="text-red-400 text-[10px]">{language === 'en' ? 'NOT DONE' : '未完成'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-white/80">💪 {language === 'en' ? '50 Push-ups' : '俯卧撑 50个'}</span>
                                            <span className="text-red-400 text-[10px]">{language === 'en' ? 'NOT DONE' : '未完成'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-white/80">🧘 {language === 'en' ? '10min Yoga' : '瑜伽 10分钟'}</span>
                                            <span className="text-red-400 text-[10px]">{language === 'en' ? 'NOT DONE' : '未完成'}</span>
                                        </div>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="mt-3">
                                        <div className="flex justify-between text-[10px] text-white/40 mb-1">
                                            <span>{language === 'en' ? 'Progress' : '今日进度'}</span>
                                            <span className="text-red-400">0%</span>
                                        </div>
                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full w-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-full" />
                                        </div>
                                    </div>
                                </div>

                                {/* Warning Card - 未完成警告 */}
                                <div className="bg-red-900/30 border border-red-500/30 rounded-2xl p-3 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                        <AlertTriangle className="w-4 h-4 text-red-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-red-300 text-xs font-medium">
                                            {language === 'en' ? 'You\'re falling behind!' : '你落后了！'}
                                        </p>
                                        <p className="text-red-400/60 text-[10px] truncate">
                                            {language === 'en' ? 'Complete tasks to maintain streak' : '完成任务才能保持连续记录'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Notification popup */}
                            <AnimatePresence>
                                {showNotification && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -50, scale: 0.8 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -50, scale: 0.8 }}
                                        className="absolute top-4 left-2 right-2 z-30"
                                    >
                                        <div className="bg-[#1c1c1e]/90 backdrop-blur-xl rounded-[24px] p-4 shadow-2xl border border-white/10 flex items-center gap-4">
                                            <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/30">
                                                <span className="text-2xl">⚠️</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-white font-semibold text-sm leading-tight">
                                                    {language === 'en' ? 'Goal Failed' : '未完成打卡'}
                                                </h4>
                                                <p className="text-white/60 text-xs mt-0.5 truncate">
                                                    {language === 'en' ? 'Streak broken...' : '你已经中断了连续记录...'}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* Red glow effect */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[80%] bg-red-600/10 rounded-full blur-3xl -z-10 animate-pulse" />
                </div>

                {/* Text content from Beta */}
                <div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-8"
                    >
                        <span className="text-xs font-bold tracking-[0.2em] text-red-500 uppercase">
                            {language === 'en' ? 'The Problem' : '这个时代的病症'}
                        </span>
                    </motion.div>

                    <motion.blockquote
                        className="text-3xl md:text-5xl font-heading font-medium text-[#1A1A1A] dark:text-white leading-tight mb-10"
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="text-[#1A1A1A]/20 dark:text-white/20 mr-2">“</span>
                        {language === 'en' ? "Your other apps aren't helping." : "你的那些打卡App，"}
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700 font-bold">
                            {language === 'en' ? "Don't seem to understand your fatigue." : "似乎根本不懂你的疲惫。"}
                        </span>
                        <span className="text-[#1A1A1A]/20 dark:text-white/20 ml-2">”</span>
                    </motion.blockquote>

                    <motion.div
                        className="space-y-6 text-lg text-[#1A1A1A]/60 dark:text-white/50"
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-[#1A1A1A]/5 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-[#1A1A1A]/5 dark:hover:border-white/5 group">
                            <div className="w-10 h-10 rounded-full bg-[#1A1A1A]/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-red-500/10 transition-colors">
                                <Activity className="w-5 h-5 text-[#1A1A1A]/40 dark:text-white/40 group-hover:text-red-400" />
                            </div>
                            <p>{language === 'en' ? "They demand a streak when you're crashing." : "在你崩溃边缘时，它还在催你连续打卡。"}</p>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-[#1A1A1A]/5 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-[#1A1A1A]/5 dark:hover:border-white/5 group">
                            <div className="w-10 h-10 rounded-full bg-[#1A1A1A]/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-red-500/10 transition-colors">
                                <Brain className="w-5 h-5 text-[#1A1A1A]/40 dark:text-white/40 group-hover:text-red-400" />
                            </div>
                            <p>{language === 'en' ? "They sell anxiety disguised as discipline." : "它们贩卖的不是自律，而是包装精美的焦虑。"}</p>
                        </div>
                        <div className="pl-4 border-l-2 border-red-500/30">
                            <p className="text-[#1A1A1A] dark:text-white font-medium text-xl">
                                {language === 'en' ? "Data without context is cruelty." : "没有上下文的数据，就是一种暴政。"}
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
