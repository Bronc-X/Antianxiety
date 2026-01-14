'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Activity, Brain, AlertTriangle, Signal, Wifi, Battery } from 'lucide-react';
import { useState, useEffect } from 'react';
import TermPopover from './TermPopover';

export default function ProblemSolution() {
    const { language } = useI18n();
    const [showNotification, setShowNotification] = useState(false);

    useEffect(() => {
        let hideTimer: NodeJS.Timeout;
        // Initial setup
        const timer = setInterval(() => {
            setShowNotification(true);
            hideTimer = setTimeout(() => setShowNotification(false), 4000);
        }, 6000);

        return () => {
            clearInterval(timer);
            clearTimeout(hideTimer);
        };
    }, []);

    // Or better logic:
    /*
    useEffect(() => {
        let hideTimer: NodeJS.Timeout;
        const timer = setInterval(() => {
            setShowNotification(true);
            hideTimer = setTimeout(() => setShowNotification(false), 4000);
        }, 6000);
        return () => {
            clearInterval(timer);
            clearTimeout(hideTimer);
        };
    }, []);
    */

    return (
        <>
            {/* Problem Section - Light Background */}
            {/* Problem Section - Light Background */}
            <section className="py-24 px-6 md:px-12 relative z-20" style={{ backgroundColor: '#FAF6EF' }}>
                <div className="max-w-[1400px] mx-auto">
                    {/* Spotlight */}
                    <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-red-900/5 rounded-full blur-[100px] pointer-events-none" />

                    <div className="grid md:grid-cols-2 gap-20 items-center relative z-10">
                        {/* Phone mockup */}
                        <div className="relative perspective-1000 flex justify-center">
                            <motion.div
                                className="relative w-[280px] h-[560px] bg-[#1a1a1a] rounded-[40px] border-[6px] border-[#2a2a2a] shadow-2xl overflow-hidden"
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
                                    <div className="absolute top-0 left-0 right-0 h-12 flex justify-between items-center px-5 text-white/80 text-xs z-20">
                                        <span>9:41</span>
                                        <div className="flex gap-1.5">
                                            <Signal className="w-3 h-3 fill-current" />
                                            <Wifi className="w-3 h-3" />
                                            <Battery className="w-3.5 h-3.5 fill-current" />
                                        </div>
                                    </div>

                                    {/* Dynamic Island */}
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-7 bg-black rounded-full z-20" />

                                    {/* Fitness App UI */}
                                    <div className="pt-14 px-4 h-full flex flex-col">
                                        {/* App Header */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                                                    <Activity className="w-3.5 h-3.5 text-white" />
                                                </div>
                                                <span className="text-white/80 text-xs font-semibold">FitPro</span>
                                            </div>
                                            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                                                <span className="text-[10px]">👤</span>
                                            </div>
                                        </div>

                                        {/* Streak Counter */}
                                        <div className="bg-gradient-to-br from-orange-600/30 to-red-600/20 border border-orange-500/30 rounded-xl p-3 mb-2">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-white/60 text-[10px]">🔥 {language === 'en' ? 'Streak' : '连续打卡'}</span>
                                                <span className="text-orange-400 text-[9px] font-medium px-1.5 py-0.5 bg-orange-500/20 rounded-full">
                                                    {language === 'en' ? 'KEEP IT UP!' : '继续保持!'}
                                                </span>
                                            </div>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-bold text-white">47</span>
                                                <span className="text-white/50 text-[10px]">{language === 'en' ? 'days' : '天'}</span>
                                            </div>
                                            <div className="flex gap-0.5 mt-2">
                                                {[...Array(7)].map((_, i) => (
                                                    <div key={i} className={`w-4 h-4 rounded flex items-center justify-center text-[7px] ${i < 6 ? 'bg-green-500/30 text-green-400' : 'bg-white/10 text-white/30 border border-dashed border-white/20'}`}>
                                                        {i < 6 ? '✓' : '?'}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Apple Health Style Activity Rings */}
                                        <div className="bg-black/40 border border-white/10 rounded-xl p-3 mb-2">
                                            <div className="flex items-center gap-3">
                                                {/* Rings */}
                                                <div className="relative w-16 h-16 flex-shrink-0">
                                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                                                        {/* Move Ring (Red) - Background */}
                                                        <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,59,48,0.3)" strokeWidth="5" />
                                                        {/* Move Ring (Red) - Progress 35% */}
                                                        <circle cx="32" cy="32" r="28" fill="none" stroke="#FF3B30" strokeWidth="5" strokeLinecap="round"
                                                            strokeDasharray="176" strokeDashoffset="114" />

                                                        {/* Exercise Ring (Green) - Background */}
                                                        <circle cx="32" cy="32" r="21" fill="none" stroke="rgba(48,209,88,0.3)" strokeWidth="5" />
                                                        {/* Exercise Ring (Green) - Progress 20% */}
                                                        <circle cx="32" cy="32" r="21" fill="none" stroke="#30D158" strokeWidth="5" strokeLinecap="round"
                                                            strokeDasharray="132" strokeDashoffset="106" />

                                                        {/* Stand Ring (Blue) - Background */}
                                                        <circle cx="32" cy="32" r="14" fill="none" stroke="rgba(10,132,255,0.3)" strokeWidth="5" />
                                                        {/* Stand Ring (Blue) - Progress 50% */}
                                                        <circle cx="32" cy="32" r="14" fill="none" stroke="#0A84FF" strokeWidth="5" strokeLinecap="round"
                                                            strokeDasharray="88" strokeDashoffset="44" />
                                                    </svg>
                                                </div>

                                                {/* Ring Labels */}
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="w-2 h-2 rounded-full bg-[#FF3B30]" />
                                                            <span className="text-[9px] text-white/70">{language === 'en' ? 'Move' : '活动'}</span>
                                                        </div>
                                                        <span className="text-[9px] text-red-400">35%</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="w-2 h-2 rounded-full bg-[#30D158]" />
                                                            <span className="text-[9px] text-white/70">{language === 'en' ? 'Exercise' : '锻炼'}</span>
                                                        </div>
                                                        <span className="text-[9px] text-green-400">20%</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="w-2 h-2 rounded-full bg-[#0A84FF]" />
                                                            <span className="text-[9px] text-white/70">{language === 'en' ? 'Stand' : '站立'}</span>
                                                        </div>
                                                        <span className="text-[9px] text-blue-400">50%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Workout Suggestion */}
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-2">
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <Brain className="w-3.5 h-3.5 text-blue-400" />
                                                <span className="text-white/70 text-[10px]">{language === 'en' ? "Today's Plan" : '今日计划'}</span>
                                            </div>
                                            <div className="space-y-1.5">
                                                {[
                                                    { icon: '🏃', task: language === 'en' ? 'Run 5km' : '跑步 5公里' },
                                                    { icon: '💪', task: language === 'en' ? '50 Push-ups' : '俯卧撑 50个' },
                                                    { icon: '🧘', task: language === 'en' ? '10min Yoga' : '瑜伽 10分钟' },
                                                ].map((item, i) => (
                                                    <div key={i} className="flex items-center justify-between text-[10px]">
                                                        <span className="text-white/80">{item.icon} {item.task}</span>
                                                        <span className="text-red-400 text-[9px]">{language === 'en' ? 'NOT DONE' : '未完成'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-2">
                                                <div className="flex justify-between text-[9px] text-white/40 mb-1">
                                                    <span>{language === 'en' ? 'Progress' : '今日进度'}</span>
                                                    <span className="text-red-400">0%</span>
                                                </div>
                                                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                                    <div className="h-full w-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-full" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Warning Card */}
                                        <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-2.5 flex items-center gap-2">
                                            <div className="w-7 h-7 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-red-300 text-[10px] font-medium">
                                                    {language === 'en' ? 'You\'re falling behind!' : '你落后了！'}
                                                </p>
                                                <p className="text-red-400/60 text-[9px] truncate">
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
                                                <div className="bg-[#1c1c1e]/90 backdrop-blur-xl rounded-2xl p-3 shadow-2xl border border-white/10 flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/30">
                                                        <span className="text-xl">⚠️</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-white font-semibold text-xs leading-tight">
                                                            {language === 'en' ? 'Goal Failed' : '未完成打卡'}
                                                        </h4>
                                                        <p className="text-white/60 text-[10px] mt-0.5 truncate">
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

                        {/* Text content */}
                        <div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="mb-8"
                            >
                                <span className="text-xs font-bold tracking-[0.2em] text-[#C4A77D] uppercase font-serif">
                                    {language === 'en' ? 'The Problem' : '为什么很难坚持运动'}
                                </span>
                            </motion.div>

                            <motion.blockquote
                                className="text-3xl md:text-5xl font-serif font-bold text-[#0B3D2E] leading-tight mb-10"
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                            >
                                &ldquo;现在的健康App，似乎不太懂你的疲惫。&rdquo;
                            </motion.blockquote>

                            <motion.div
                                className="space-y-4 text-lg text-[#1A1A1A]/60 font-serif"
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                            >
                                <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-[#1A1A1A]/5 transition-colors border border-transparent hover:border-[#1A1A1A]/5 group">
                                    <div className="w-10 h-10 rounded-full bg-[#1A1A1A]/5 flex items-center justify-center group-hover:bg-red-500/10 transition-colors">
                                        <Activity className="w-5 h-5 text-[#1A1A1A]/40 group-hover:text-red-400" />
                                    </div>
                                    <p>{language === 'en' ? "They demand a streak when you're crashing." : "在你崩溃边缘时，它还在催你连续打卡。"}</p>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-[#1A1A1A]/5 transition-colors border border-transparent hover:border-[#1A1A1A]/5 group">
                                    <div className="w-10 h-10 rounded-full bg-[#1A1A1A]/5 flex items-center justify-center group-hover:bg-red-500/10 transition-colors">
                                        <Brain className="w-5 h-5 text-[#1A1A1A]/40 group-hover:text-red-400" />
                                    </div>
                                    <p>{language === 'en' ? "They sell anxiety disguised as discipline." : "它们贩卖的不是自律，而是包装精美的焦虑。"}</p>
                                </div>
                                <div className="pl-4 border-l-2 border-[#C4A77D]/30 relative z-20">
                                    <div className="text-[#1A1A1A] font-medium text-xl font-serif leading-relaxed">
                                        没有
                                        <TermPopover
                                            term="上下文"
                                            title="上下文工程 (Context Engineering)"
                                            description={
                                                <>
                                                    <p><strong>没有语境的数据，只是噪音。</strong></p>
                                                    <p>我们参考了 Manus (Context Engineering 领域的先行者) 的理念：Max 不仅记录你走了 5000 步，更知道这是你在焦虑失眠一整夜后，为了缓解压力而走的散步。</p>
                                                    <p>Max 能读懂数据背后的「语境」，所以他不会在你生病时催你闭环，也不会在你心碎时让你燃脂。</p>
                                                </>
                                            }
                                        />
                                        的数据，就是一种敷衍。
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Solution Section - Light Background */}
            <section className="py-24 px-6 md:px-12 relative z-20" style={{ backgroundColor: 'transparent' }}>
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-[1400px] mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 items-center relative z-10">
                        {/* Text Side */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="order-2 md:order-1"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="mb-8"
                            >
                                <span className="text-xs font-bold tracking-[0.2em] text-[#D4AF37] uppercase">
                                    {language === 'en' ? 'The Solution' : '我们的答案'}
                                </span>
                            </motion.div>

                            <h2 className="font-heading text-4xl md:text-5xl leading-tight mb-8 text-[#0B3D2E]">
                                {language === 'en' ? (
                                    <>Rest is <span className="italic text-[#D4AF37]">Strategy.</span></>
                                ) : (
                                    <>收回拳头，是为了<span className="italic text-[#D4AF37]">下一记重击</span>。</>
                                )}
                            </h2>

                            <div className="bg-white/40 backdrop-blur-sm border border-[#0B3D2E]/10 p-8 mb-8 rounded-2xl shadow-sm">
                                <p className="text-xl font-light leading-relaxed mb-6 font-serif italic text-[#0B3D2E]">
                                    {language === 'en'
                                        ? '"Hey, the data sees your deep fatigue. Forcing a workout today will hurt your immunity. Your best task: Go home, take a hot bath, sleep 20 mins early."'
                                        : '"嘿，数据看到了你深层的疲惫。今天强行运动会伤害免疫系统。今天的最佳任务是：回家，洗个热水澡，早睡20分钟。"'}
                                </p>
                                <div className="flex items-center gap-3 opacity-60">
                                    <Activity className="w-4 h-4 text-[#0B3D2E]" />
                                    <span className="text-xs tracking-widest uppercase text-[#0B3D2E]">— Max, {language === 'en' ? 'Your Personal Health Agent' : '你的个人健康智能体'}</span>
                                </div>
                            </div>

                            <p className="text-[#0B3D2E]/80 max-w-md leading-relaxed font-medium">
                                {language === 'en'
                                    ? 'After 30, knowing when to stop requires more courage than blindly pushing through. We give you the courage with science.'
                                    : (
                                        <>
                                            敢于休息比盲目坚持更需要勇气。
                                            <span className="block mt-2 font-bold text-[#0B3D2E] text-lg">我们用科学给你勇气。</span>
                                        </>
                                    )}
                            </p>
                        </motion.div>

                        {/* HRV Gauge */}
                        <div className="order-1 md:order-2 flex justify-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="relative w-72 h-72"
                            >
                                <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 200 200">
                                    <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(11, 61, 46, 0.05)" strokeWidth="1" />
                                    <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(11, 61, 46, 0.1)" strokeWidth="8" strokeLinecap="round" strokeDasharray="502" strokeDashoffset="0" opacity="0.3" />

                                    {/* Active arc */}
                                    <motion.circle
                                        cx="100" cy="100" r="80" fill="none" stroke="#EAB308" strokeWidth="8" strokeLinecap="round"
                                        strokeDasharray="502"
                                        initial={{ strokeDashoffset: 502 }}
                                        whileInView={{ strokeDashoffset: 350 }}
                                        transition={{ duration: 2, ease: "easeOut" }}
                                    />
                                </svg>

                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-6xl font-heading text-[#0B3D2E] drop-shadow-sm">41</span>
                                    <div className="mt-2 px-3 py-1 bg-red-100 rounded-full border border-red-200">
                                        <span className="text-xs tracking-[0.2em] text-red-600 font-bold block animate-pulse">HRV LOW</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-4">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                            <span className="text-[10px] text-[#0B3D2E]/50">&lt;40</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                            <span className="text-[10px] text-[#0B3D2E]/50">40-55</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-[#30D158]"></span>
                                            <span className="text-[10px] text-[#0B3D2E]/50">&gt;55</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
