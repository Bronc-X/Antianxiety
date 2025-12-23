'use client';

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
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
                        <div className="absolute inset-0 bg-[#000] overflow-hidden font-sans">
                            {/* Status Bar */}
                            <div className="absolute top-0 left-0 right-0 h-14 flex justify-between items-center px-6 text-white/80 text-xs z-20">
                                <span>9:41</span>
                                <div className="flex gap-1.5">
                                    <div className="w-4 h-2.5 border border-white/30 rounded-[2px]" />
                                </div>
                            </div>

                            {/* Dynamic Island / Notch Area */}
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-8 bg-black rounded-full z-20" />

                            {/* Fake app UI */}
                            <div className="pt-20 px-6">
                                <div className="flex items-center justify-between mb-8 opacity-50">
                                    <div className="w-10 h-10 bg-red-500/20 rounded-xl" />
                                    <div className="text-white/40 text-xs font-mono">FITNESS_PRO</div>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-40 rounded-2xl bg-gradient-to-br from-red-900/20 to-transparent border border-red-500/10 p-4 relative overflow-hidden">
                                        {/* Chart-like elements */}
                                        <div className="absolute bottom-4 left-4 right-4 flex items-end gap-1 h-20 opacity-30">
                                            {[40, 60, 30, 80, 20, 90, 10].map((h, i) => (
                                                <div key={i} className="flex-1 bg-red-500 rounded-sm" style={{ height: `${h}%` }} />
                                            ))}
                                        </div>
                                        <div className="relative z-10">
                                            <div className="w-8 h-8 rounded-full border-2 border-red-500/30 mb-2 flex items-center justify-center">
                                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                            </div>
                                            <div className="h-2 bg-red-500/20 rounded w-1/2 mb-2" />
                                            <div className="h-2 bg-red-500/10 rounded w-3/4" />
                                        </div>
                                    </div>
                                    <div className="h-24 rounded-2xl bg-white/5" />
                                    <div className="h-24 rounded-2xl bg-white/5" />
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
                    <motion.blockquote
                        className="text-3xl md:text-5xl font-heading font-medium text-[#1A1A1A] dark:text-white leading-tight mb-10"
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="text-[#1A1A1A]/20 dark:text-white/20 mr-2">“</span>
                        {language === 'en' ? "This isn't encouragement," : "这哪里是加油，"}
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700 font-bold">
                            {language === 'en' ? "it's moral judgment." : "这简直是道德审判。"}
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
                            <p>{language === 'en' ? "It doesn't care you only slept 4 hours." : "它不在乎你昨天只睡了4小时"}</p>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-[#1A1A1A]/5 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-[#1A1A1A]/5 dark:hover:border-white/5 group">
                            <div className="w-10 h-10 rounded-full bg-[#1A1A1A]/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-red-500/10 transition-colors">
                                <Brain className="w-5 h-5 text-[#1A1A1A]/40 dark:text-white/40 group-hover:text-red-400" />
                            </div>
                            <p>{language === 'en' ? "It doesn't care you're burning out." : "它不在乎你正在经历人生低谷"}</p>
                        </div>
                        <div className="pl-4 border-l-2 border-red-500/30">
                            <p className="text-[#1A1A1A] dark:text-white font-medium text-xl">
                                {language === 'en' ? "It only cares about its data." : "它只在乎它的数据好不好看"}
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
