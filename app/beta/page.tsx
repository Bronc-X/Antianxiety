'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ChevronDown, Mail, Check, Sparkles, Heart, Moon, Sun, ArrowRight, Brain, Activity, Zap, Watch } from 'lucide-react';

// ============ Global Noise & Styles ============
function GlobalStyles() {
    return (
        <style jsx global>{`
            .bg-noise {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 50;
                opacity: 0.05;
                background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            }
            .text-glow {
                text-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
            }
            @keyframes aurora {
                0% { background-position: 50% 50%, 50% 50%; }
                100% { background-position: 350% 50%, 350% 50%; }
            }
            .animate-aurora {
                animation: aurora 60s linear infinite;
            }
        `}</style>
    );
}

// ============ Hero Section ============
function HeroSection() {
    const [currentWord, setCurrentWord] = useState(0);
    const words = ['放弃', '休息', '躺平'];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentWord((prev) => (prev + 1) % words.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0f172a] via-[#1e1b4b] to-[#0f172a]">
            <GlobalStyles />
            <div className="bg-noise" />

            {/* Aurora Background */}
            <div className="absolute inset-0 opacity-60">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-blue-900/20 animate-aurora blur-3xl scale-150" />
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.08),transparent_50%)]" />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-full mb-10 backdrop-blur-sm shadow-[0_0_15px_-5px_rgba(212,175,55,0.3)]">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
                        </span>
                        <span className="text-[#D4AF37] text-xs font-bold tracking-wider uppercase">Beta 内测招募</span>
                    </div>
                </motion.div>

                <motion.h1
                    className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.1] mb-8 tracking-tight"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                >
                    <span className="block text-white/90 drop-shadow-lg">世界上第一个</span>
                    <span className="block mt-2">
                        会劝你「
                        <div className="relative inline-block min-w-[2ch] text-left mx-2 align-bottom">
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={currentWord}
                                    className="absolute left-0 bottom-0 text-[#D4AF37] text-glow italic font-serif whitespace-nowrap"
                                    initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                    exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
                                    transition={{ duration: 0.5 }}
                                >
                                    {words[currentWord]}
                                </motion.span>
                            </AnimatePresence>
                            <span className="invisible font-serif">{words[0]}</span>
                        </div>
                        」
                    </span>
                    <span className="block text-3xl md:text-5xl text-white/50 mt-6 font-normal tracking-normal">的健康教练</span>
                </motion.h1>

                <motion.p
                    className="text-xl md:text-2xl text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed font-light"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.4 }}
                >
                    当皮质醇过高时，<span className="text-white font-medium border-b border-[#D4AF37]/40 pb-0.5">休息</span>才是最高级的自律
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.6 }}
                >
                    <a href="#developer-program" className="group relative inline-flex items-center gap-3 px-10 py-5 bg-[#D4AF37] text-[#0a0a0a] font-bold text-lg rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(212,175,55,0.6)] active:scale-95">
                        <div className="absolute inset-0 bg-contain bg-center opacity-0 group-hover:opacity-10 transition-opacity duration-500" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
                        <div className="absolute inset-0 bg-white/40 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                        <span className="relative z-10">加入开发者计划</span>
                        <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                    </a>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, 10, 0] }}
                transition={{ delay: 1, duration: 2, repeat: Infinity }}
            >
                <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">Scroll</span>
            </motion.div>
        </section>
    );
}

// ============ Judgment Section (道德审判) ============
function JudgmentSection() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });
    const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
    const y = useTransform(scrollYProgress, [0, 0.3], [100, 0]);

    const [showNotification, setShowNotification] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowNotification(true), 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <section ref={ref} className="min-h-screen flex items-center justify-center bg-[#0f172a] py-24 px-6 relative overflow-hidden">
            {/* Spotlight */}
            <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[100px] pointer-events-none" />

            <motion.div style={{ opacity, y }} className="max-w-6xl mx-auto relative z-10">
                <div className="grid md:grid-cols-2 gap-20 items-center">
                    {/* Phone mockup */}
                    <div className="relative perspective-1000">
                        <motion.div
                            className="relative w-[300px] h-[600px] mx-auto bg-[#1a1a1a] rounded-[48px] border-[8px] border-[#2a2a2a] shadow-2xl overflow-hidden"
                            initial={{ rotateY: -15, rotateX: 5 }}
                            whileInView={{ rotateY: 0, rotateX: 0 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                        >
                            {/* Screen Reflection */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent z-20 pointer-events-none" />

                            {/* Phone screen */}
                            <div className="absolute inset-0 bg-[#000] overflow-hidden">
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
                                        <div className="h-40 rounded-2xl bg-gradient-to-br from-red-900/20 to-transparent border border-red-500/10 p-4">
                                            <div className="w-8 h-8 rounded-full border-2 border-red-500/30 mb-2" />
                                            <div className="h-2 bg-red-500/20 rounded w-1/2 mb-2" />
                                            <div className="h-2 bg-red-500/10 rounded w-3/4" />
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
                                            className="absolute top-4 left-2 right-2 z-30"
                                        >
                                            <div className="bg-[#1c1c1e]/90 backdrop-blur-xl rounded-[24px] p-4 shadow-2xl border border-white/10 flex items-center gap-4">
                                                <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/30">
                                                    <span className="text-2xl">⚠️</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-white font-semibold text-sm leading-tight">未完成打卡</h4>
                                                    <p className="text-white/60 text-xs mt-0.5 truncate">你已经中断了连续记录...</p>
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
                        <motion.blockquote
                            className="text-4xl md:text-5xl font-bold text-white leading-tight mb-10"
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="text-white/20 mr-2">“</span>
                            这哪里是加油，
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">这简直是道德审判。</span>
                            <span className="text-white/20 ml-2">”</span>
                        </motion.blockquote>

                        <motion.div
                            className="space-y-6 text-lg text-white/50"
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group">
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-red-500/10 transition-colors">
                                    <Activity className="w-5 h-5 text-white/40 group-hover:text-red-400" />
                                </div>
                                <p>它不在乎你昨天只睡了4小时</p>
                            </div>
                            <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group">
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-red-500/10 transition-colors">
                                    <Brain className="w-5 h-5 text-white/40 group-hover:text-red-400" />
                                </div>
                                <p>它不在乎你正在经历人生低谷</p>
                            </div>
                            <div className="pl-4 border-l-2 border-red-500/30">
                                <p className="text-white font-medium text-xl">它只在乎它的数据好不好看</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </section>
    );
}

// ============ Retreat Section (战术性撤退) ============
function RetreatSection() {
    return (
        <section className="min-h-screen flex items-center justify-center bg-[#0f172a] py-24 px-6 relative">
            {/* Background elements */}
            <div className="absolute right-0 top-1/4 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    {/* Text content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="order-2 md:order-1"
                    >
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] text-sm rounded-full mb-8 font-medium">
                            <Sparkles className="w-4 h-4" />
                            Antianxiety 的回应
                        </span>

                        <div className="bg-[#121212] rounded-[32px] p-10 border border-[#D4AF37]/20 shadow-[0_0_50px_-20px_rgba(212,175,55,0.15)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Heart className="w-32 h-32 text-[#D4AF37]" />
                            </div>

                            <div className="flex items-center gap-4 mb-8 relative z-10">
                                <div className="w-14 h-14 bg-gradient-to-br from-[#D4AF37] to-[#B8860B] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#D4AF37]/20">
                                    <Activity className="w-7 h-7 text-black" />
                                </div>
                                <div>
                                    <p className="text-white/60 text-xs tracking-wider uppercase">AI Health Coach</p>
                                    <p className="text-white font-medium text-lg">基于你的 HRV 数据</p>
                                </div>
                            </div>

                            <motion.div
                                className="text-xl md:text-2xl text-white/90 leading-relaxed font-light relative z-10"
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                transition={{ duration: 1, delay: 0.3 }}
                            >
                                <p className="mb-6">"嘿，数据看到了你深层的疲惫。</p>
                                <p className="mb-6">今天强行运动会伤害免疫系统。</p>
                                <div className="p-4 bg-[#D4AF37]/10 border-l-2 border-[#D4AF37] rounded-r-xl">
                                    <p className="text-[#D4AF37] font-medium">今天的最佳任务是：<br />回家，洗个热水澡，早睡20分钟。</p>
                                </div>
                                <p className="mt-6 text-right text-sm text-white/40">—— 这不是偷懒，是战术性撤退。</p>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* HRV Gauge */}
                    <motion.div
                        className="relative order-1 md:order-2 flex justify-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="relative w-80 h-80">
                            {/* Outer Glow */}
                            <div className="absolute inset-0 bg-[#D4AF37]/10 rounded-full blur-2xl" />

                            {/* Circular gauge */}
                            <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 200 200">
                                {/* Track */}
                                <circle cx="100" cy="100" r="80" fill="none" stroke="#2a2a2a" strokeWidth="12" strokeLinecap="round" />

                                {/* Ticks */}
                                {Array.from({ length: 40 }).map((_, i) => (
                                    <line
                                        key={i}
                                        x1="100"
                                        y1="25"
                                        x2="100"
                                        y2="30"
                                        stroke={i < 15 ? "#D4AF37" : "#333"}
                                        strokeWidth="2"
                                        transform={`rotate(${i * 9} 100 100)`}
                                        opacity={i < 15 ? 0.8 : 0.3}
                                    />
                                ))}

                                {/* Progress */}
                                <motion.circle
                                    cx="100"
                                    cy="100"
                                    r="80"
                                    fill="none"
                                    stroke="url(#hrvGradient)"
                                    strokeWidth="12"
                                    strokeLinecap="round"
                                    strokeDasharray="502"
                                    initial={{ strokeDashoffset: 502 }}
                                    whileInView={{ strokeDashoffset: 350 }}
                                    transition={{ duration: 2, ease: "easeOut" }}
                                />
                                <defs>
                                    <linearGradient id="hrvGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#D4AF37" />
                                        <stop offset="100%" stopColor="#8B6914" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            {/* Center content */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <motion.span
                                    className="text-7xl font-bold text-white tracking-tighter"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: 1 }}
                                >
                                    32
                                </motion.span>
                                <span className="text-white/40 text-sm font-mono tracking-widest mt-1">HRV SCORE</span>
                                <motion.div
                                    className="mt-4 px-3 py-1 bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-full"
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.5 }}
                                >
                                    <span className="text-[#D4AF37] text-xs font-bold uppercase">Need Rest</span>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Quote */}
                <motion.p
                    className="text-center text-2xl md:text-4xl text-white/80 mt-24 max-w-4xl mx-auto font-light leading-snug"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    "30岁以后，<span className="font-serif italic text-[#D4AF37] mx-2">敢于休息</span>比盲目坚持更需要勇气"
                </motion.p>
            </div>
        </section>
    );
}

// ============ Comparison Section ============
function ComparisonSection() {
    return (
        <section className="min-h-screen flex items-center justify-center bg-[#0f172a] py-24 px-6 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1a1a2e]/20 to-transparent pointer-events-none" />

            <div className="max-w-6xl mx-auto w-full relative z-10">
                <motion.div
                    className="text-center mb-20"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        科学的<span className="text-[#D4AF37] font-serif italic mx-2">温柔</span>
                    </h2>
                    <p className="text-white/40 text-lg">告别暴力算法，拥抱贝叶斯统计</p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                    {/* Traditional App */}
                    <motion.div
                        className="group bg-[#111111] rounded-[32px] p-8 md:p-12 border border-white/5 hover:border-red-500/20 transition-colors"
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="flex justify-between items-start mb-10">
                            <h3 className="text-2xl font-bold text-white group-hover:text-red-400 transition-colors">传统健身 App</h3>
                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                <div className="w-2 h-2 bg-red-500 rounded-full" />
                            </div>
                        </div>

                        {/* Linear chart animation */}
                        <div className="h-48 relative mb-10 bg-white/5 rounded-2xl p-4 overflow-hidden">
                            <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 gap-4 p-4 opacity-10">
                                {Array.from({ length: 24 }).map((_, i) => <div key={i} className="border-t border-r border-white/30" />)}
                            </div>
                            <svg className="w-full h-full relative z-10" viewBox="0 0 200 100" preserveAspectRatio="none">
                                <motion.path
                                    d="M0,80 L200,20"
                                    fill="none"
                                    stroke="#EF4444"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    whileInView={{ pathLength: 1 }}
                                    transition={{ duration: 1.5 }}
                                />
                                <motion.circle
                                    cx="100"
                                    cy="50"
                                    r="6"
                                    fill="#EF4444"
                                    initial={{ scale: 0 }}
                                    whileInView={{ scale: 1 }}
                                    transition={{ duration: 0.3, delay: 0.8 }}
                                >
                                    <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
                                </motion.circle>
                            </svg>
                            <div className="absolute bottom-4 left-4 text-red-400/50 text-xs font-mono">TARGET_UNDEFINED</div>
                        </div>

                        <div className="space-y-4 text-white/50">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                <p>"线性算法" - 必须永远向上</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                <p>无视身体周期性波动</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                <p>用户因挫败感而流失</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Antianxiety */}
                    <motion.div
                        className="group bg-[#161618] rounded-[32px] p-8 md:p-12 border border-[#D4AF37]/20 relative overflow-hidden"
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="flex justify-between items-start mb-10 relative z-10">
                            <h3 className="text-2xl font-bold text-white group-hover:text-[#D4AF37] transition-colors">Antianxiety</h3>
                            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                            </div>
                        </div>

                        {/* Wave chart animation */}
                        <div className="h-48 relative mb-10 bg-black/40 rounded-2xl p-4 overflow-hidden border border-[#D4AF37]/10 z-10">
                            <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 gap-4 p-4 opacity-10">
                                {Array.from({ length: 24 }).map((_, i) => <div key={i} className="border-t border-r border-[#D4AF37]/30" />)}
                            </div>
                            <svg className="w-full h-full relative z-10" viewBox="0 0 200 100" preserveAspectRatio="none">
                                <motion.path
                                    d="M0,60 C40,40 60,80 100,60 C140,40 160,80 200,60"
                                    fill="none"
                                    stroke="#D4AF37"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    whileInView={{ pathLength: 1 }}
                                    transition={{ duration: 1.5 }}
                                />
                                {/* Prediction range area */}
                                <motion.path
                                    d="M0,60 C40,40 60,80 100,60 C140,40 160,80 200,60 L200,90 C160,110 140,70 100,90 C60,110 40,70 0,90 Z"
                                    fill="url(#rangeGradient)"
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 0.3 }}
                                    transition={{ duration: 1, delay: 1 }}
                                />
                                <defs>
                                    <linearGradient id="rangeGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#D4AF37" />
                                        <stop offset="100%" stopColor="transparent" />
                                    </linearGradient>
                                </defs>
                                <motion.circle
                                    cx="100"
                                    cy="60"
                                    r="6"
                                    fill="#D4AF37"
                                    initial={{ scale: 0 }}
                                    whileInView={{ scale: 1 }}
                                    transition={{ duration: 0.3, delay: 0.8 }}
                                >
                                    <animate attributeName="r" values="6;9;6" dur="3s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="1;0.5;1" dur="3s" repeatCount="indefinite" />
                                </motion.circle>
                            </svg>
                            <div className="absolute bottom-4 left-4 text-[#D4AF37]/50 text-xs font-mono">BAYESIAN_OPTIMIZED</div>
                        </div>

                        <div className="space-y-4 text-white/70 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
                                <p>"贝叶斯算法" - 顺应生物波动</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
                                <p>精力资产管理与长线投资</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
                                <p>建立深度依赖与信任</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

// ============ Feature Showcase ============
function FeatureShowcase() {
    const [selectedFeature, setSelectedFeature] = useState<number | null>(null);

    const features = [
        {
            icon: <Zap className="w-8 h-8" />,
            title: "主动式 AI 诊疗",
            desc: "世界上最了解你的医疗助理。它不会等你开口，而是通过数据异常主动发起关怀，像私人医生一样敏锐。",
            color: "from-purple-500 to-indigo-600",
            detail: {
                title: "它是如何工作的？",
                content: "传统的医疗应用是「被动」的——你输入症状，它给出建议。Antianxiety 是「主动」的。它全天候监测你的 HRV、睡眠和体表温度。当你处于高压或异常状态时，Max 会主动发来询问：「我注意到你昨晚深睡只有 40 分钟，感觉还好吗？」这种主动关怀能让你在崩溃前得到支持。",
                highlight: "比你自己更早发现你的焦虑。"
            }
        },
        {
            icon: <Brain className="w-8 h-8" />,
            title: "精准科研情报",
            desc: "为你过滤 99% 的噪音。基于你的健康画像，只推送与你当前症状高度相关的科研论文与临床指南。",
            color: "from-blue-500 to-cyan-600",
            detail: {
                title: "拒绝伪科学",
                content: "互联网上充斥着伪科学和营销软文。我们连接了 PubMed 和 Semantic Scholar 数据库，根据你的特定健康画像（如「高皮质醇」、「睡眠碎片化」），实时抓取最新的临床研究和荟萃分析。每一条建议背后，都有坚实的循证医学证据支持。",
                highlight: "只看证据，不看广告。"
            }
        },
        {
            icon: <Activity className="w-8 h-8" />,
            title: "贝叶斯推理引擎",
            desc: "不再是百度的模糊搜索。基于贝叶斯概率模型，将模糊的身体感受转化为精准的医疗假设。",
            color: "from-emerald-500 to-teal-600",
            detail: {
                title: "概率而非绝对",
                content: "人体不是机器，不存在绝对的因果。我们使用贝叶斯概率模型来处理健康数据。当你的 HRV 下降时，它不会草率下结论，而是结合你的历史基线、昨日活动和主观感受，计算出「过度训练」或「潜在疾病」的概率分布，并随着新数据的输入不断自我修正。",
                highlight: "像顶尖医生一样思考。"
            }
        },
        {
            icon: <Sun className="w-8 h-8" />,
            title: "身心每日校准",
            desc: "1分钟快速扫描追踪。记录的不只是数据，更是你身体的微弱信号与长期趋势，建立你的个人生物模型。",
            color: "from-amber-500 to-orange-600",
            detail: {
                title: "各种状态，一目了然",
                content: "就像交响乐团演出前需要调音一样，你的身心也需要每日校准。每天早晨 1 分钟，通过简单的交互和生理数据读取，系统为你生成当天的「状态报告」。这不是单纯的打分，而是为你当天的活动设定合理的「能量预算」。",
                highlight: "在混乱中找到秩序。"
            }
        },
        {
            icon: <Watch className="w-8 h-8" />,
            title: "全生态设备支持",
            desc: "不需要为了使用软件买新手表。支持 Apple Watch、华为、小米、Fitbit 等主流设备，甚至无需穿戴设备也能通过手机传感器使用。",
            color: "from-pink-500 to-rose-600",
            detail: {
                title: "零成本启动",
                content: "我们深知，为了健康而购买昂贵的设备本身就是一种压力。因此，我们兼容市面上 95% 的穿戴设备。无论你戴的是 Apple Watch 还是小米手环，亦或是 Oura Ring，我们都能无缝接入。甚至，仅凭手机的睡眠监测功能，也能获得不错的基础体验。",
                highlight: "用你现有的，就是最好的。"
            },
            colSpan: "md:col-span-2"
        }
    ];

    return (
        <section className="py-32 px-6 bg-[#0f172a] relative overflow-hidden">
            <div className="max-w-6xl mx-auto relative z-10">
                <motion.div
                    className="text-center mb-20"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        核心功能
                    </h2>
                    <p className="text-white/40 text-lg">
                        不是更努力，而是更聪明
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-6">
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            className={`group relative h-[280px] rounded-[32px] overflow-hidden cursor-pointer ${feature.colSpan || ''}`}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            onClick={() => setSelectedFeature(i)}
                        >
                            {/* Card Background */}
                            <div className="absolute inset-0 bg-[#111] group-hover:bg-[#161618] transition-colors duration-500" />

                            {/* Inner Glow */}
                            <div className={`absolute -top-[100px] -right-[100px] w-48 h-48 bg-gradient-to-br ${feature.color} opacity-20 blur-[60px] group-hover:opacity-40 transition-opacity duration-500`} />

                            {/* Content */}
                            <div className="relative h-full p-10 flex flex-col justify-between z-10">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                                            {feature.icon}
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-all">
                                            {feature.title}
                                        </h3>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                        <div className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                                            <ArrowRight className="text-white w-5 h-5" />
                                        </div>
                                    </div>
                                </div>

                                <p className="text-white/50 leading-relaxed font-light text-lg">
                                    {feature.desc}
                                </p>
                            </div>

                            {/* Border */}
                            <div className="absolute inset-0 border border-white/5 rounded-[32px] pointer-events-none group-hover:border-white/10 transition-colors" />
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Detailed Modal */}
            <AnimatePresence>
                {selectedFeature !== null && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedFeature(null)}
                    >
                        <motion.div
                            className="bg-[#161618] rounded-[32px] max-w-2xl w-full border border-white/10 overflow-hidden relative"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Decorative background */}
                            <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${features[selectedFeature].color} opacity-10 blur-[80px] pointer-events-none`} />

                            <div className="p-8 md:p-12 relative z-10">
                                <div className="flex justify-between items-start mb-8">
                                    <div className={`w-16 h-16 bg-gradient-to-br ${features[selectedFeature].color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                                        {features[selectedFeature].icon}
                                    </div>
                                    <button
                                        onClick={() => setSelectedFeature(null)}
                                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                                    >
                                        <Check className="w-6 h-6 rotate-45" /> {/* Using Check rotated as X since we don't have XIcon imported and don't want to break things */}
                                    </button>
                                </div>

                                <h3 className="text-3xl font-bold text-white mb-2">
                                    {features[selectedFeature].title}
                                </h3>
                                <div className="h-1 w-20 bg-gradient-to-r from-transparent to-transparent via-white/20 rounded-full mb-8 relative overflow-hidden">
                                    <div className={`absolute inset-0 bg-gradient-to-r ${features[selectedFeature].color} opacity-50`} />
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-[#D4AF37] font-serif italic text-lg mb-2">
                                            {features[selectedFeature].detail.title}
                                        </h4>
                                        <p className="text-white/70 text-lg leading-relaxed font-light">
                                            {features[selectedFeature].detail.content}
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                        <p className="text-white/90 font-medium flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                                            {features[selectedFeature].detail.highlight}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}

// ============ Developer Program CTA ============
function DeveloperProgram() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        try {
            const res = await fetch('/api/beta/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (res.ok) {
                setStatus('success');
                setMessage('🎉 申请成功！我们会尽快通过邮件联系你');
                setEmail('');
            } else {
                const data = await res.json();
                setStatus('error');
                setMessage(data.error || '提交失败，请稍后重试');
            }
        } catch {
            setStatus('error');
            setMessage('网络错误，请稍后重试');
        }
    };

    return (
        <section id="developer-program" className="min-h-screen flex items-center justify-center py-24 px-6 bg-gradient-to-b from-[#0f172a] to-[#020617] relative overflow-hidden">
            {/* Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-xl mx-auto text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="bg-[#111111]/80 backdrop-blur-xl border border-white/10 p-10 md:p-14 rounded-[48px] shadow-2xl relative"
                >
                    {/* Decorative Top */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-[#D4AF37]/30 rounded-full mt-4" />

                    <div className="w-24 h-24 bg-gradient-to-br from-[#D4AF37] to-[#8B6914] rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-xl shadow-[#D4AF37]/20">
                        <Sparkles className="w-12 h-12 text-black" />
                    </div>

                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                        开发者计划
                    </h2>
                    <p className="text-white/50 mb-10 text-lg">
                        成为首批体验者，塑造产品的未来
                    </p>

                    {status === 'success' ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl p-8"
                        >
                            <Check className="w-12 h-12 text-[#D4AF37] mx-auto mb-4" />
                            <p className="text-[#D4AF37] text-lg font-medium">{message}</p>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative group">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-[#D4AF37] transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:border-[#D4AF37]/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30 transition-all text-lg"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full py-5 bg-[#D4AF37] text-black font-bold text-lg rounded-2xl hover:bg-[#E5C158] hover:shadow-[0_0_30px_-5px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50 disabled:hover:shadow-none flex items-center justify-center gap-3"
                            >
                                {status === 'loading' ? (
                                    <motion.div
                                        className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    />
                                ) : (
                                    <>
                                        申请加入
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>

                            {status === 'error' && (
                                <p className="text-red-400 text-sm mt-3">{message}</p>
                            )}
                        </form>
                    )}

                    <div className="mt-10 pt-8 border-t border-white/5">
                        <p className="text-white/30 text-xs uppercase tracking-widest">
                            限量 100 个名额 · 优先获得终身会员资格
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// ============ Footer ============
function Footer() {
    return (
        <footer className="py-12 px-6 bg-[#020617] border-t border-white/5 relative z-10">
            <div className="max-w-5xl mx-auto text-center">
                <div className="mb-8">
                    <span className="text-[#D4AF37] font-bold text-xl tracking-tighter">Antianxiety</span>
                </div>
                <p className="text-white/30 text-sm">
                    © 2025 Antianxiety. 用科学的温柔，守护你的健康。
                </p>
            </div>
        </footer>
    );
}

// ============ Main Page ============
export default function BetaPage() {
    return (
        <main className="bg-[#0f172a] text-white selection:bg-[#D4AF37]/30 selection:text-[#D4AF37]">
            <HeroSection />
            <JudgmentSection />
            <RetreatSection />
            <ComparisonSection />
            <FeatureShowcase />
            <DeveloperProgram />
            <Footer />
        </main>
    );
}
