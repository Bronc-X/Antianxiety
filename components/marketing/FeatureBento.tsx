'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Activity, Brain, Zap, Watch, Sun, ArrowRight, X, Sparkles, Check } from 'lucide-react';
import { useState } from 'react';

export default function FeatureBento() {
    const { t, language } = useI18n();
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const features = [
        {
            id: 'active_ai',
            icon: Zap,
            title: language === 'en' ? 'Proactive Care' : '主动关怀',
            desc: language === 'en'
                ? "Doesn't wait for you to break down. Notices when your deep sleep drops before you feel the crash."
                : '不等你崩溃才行动。在你感受到疲惫之前，就能察觉到你深睡眠的异常。',
            colSpan: 'md:col-span-8',
            bgClass: 'bg-[#E8DFD0]/30 dark:bg-[#2C2C2C]/30',
            color: "from-purple-500 to-indigo-600",
            detail: {
                title: language === 'en' ? "Better than waiting for symptoms" : "比等症状出现更好",
                content: language === 'en'
                    ? "When your HRV drops and sleep quality tanks, Max doesn't wait for you to complain. It reaches out first: 'Noticed rough sleep. Want to talk about it?' That's not surveillance—it's having someone who actually pays attention."
                    : '当你的 HRV 下降、睡眠质量变差时，Max 不会等你来抱怨。它会先问：「睡得不太好，想聊聊吗？」这不是监控——这是真正有人在意你。',
                highlight: language === 'en' ? "Catches problems before they become crises." : "在问题变成危机之前就发现它。"
            }
        },
        {
            id: 'science',
            icon: Brain,
            title: language === 'en' ? 'Real Research, Not Ads' : '真正的研究，不是广告',
            desc: language === 'en'
                ? 'Filters out marketing fluff. Only shows clinical studies that actually match your situation.'
                : '过滤掉营销软文。只推送真正与你情况相关的临床研究。',
            colSpan: 'md:col-span-4',
            bgClass: 'bg-[#9CAF88]/10 dark:bg-[#9CAF88]/10',
            color: "from-blue-500 to-cyan-600",
            detail: {
                title: language === 'en' ? "No more Dr. Google rabbit holes" : "不再掉进百度医疗的坑",
                content: language === 'en'
                    ? "We pull from PubMed and Semantic Scholar—actual medical databases. If you have sleep issues, you see sleep research. Not sponsored supplements. Not wellness influencer opinions."
                    : '我们从 PubMed 和 Semantic Scholar 抓取数据——真正的医学数据库。如果你有睡眠问题，你看到的就是睡眠研究。不是赞助的保健品广告，不是网红的养生意见。',
                highlight: language === 'en' ? "Evidence, not opinions." : "证据，而非观点。"
            }
        },
        {
            id: 'bayesian',
            icon: Activity,
            title: language === 'en' ? 'Honest Uncertainty' : '诚实面对不确定性',
            desc: language === 'en'
                ? "Doesn't pretend to know everything. Shows you probabilities, not false certainties."
                : '不假装什么都知道。给你的是概率，而不是虚假的确定性。',
            colSpan: 'md:col-span-4',
            bgClass: 'bg-[#D4AF37]/10 dark:bg-[#D4AF37]/10',
            color: "from-emerald-500 to-teal-600",
            detail: {
                title: language === 'en' ? "Probability beats false certainty" : "概率比虚假的确定性更好",
                content: language === 'en'
                    ? "Your body isn't a machine with error codes. When HRV drops, we don't instantly diagnose 'burnout'. We show: 60% likely overtraining, 25% sleep debt, 15% something else. Honest about what we know and don't."
                    : '你的身体不是一台会显示错误代码的机器。当 HRV 下降时，我们不会直接诊断「过度疲劳」。我们会说：60% 可能是训练过度，25% 可能是睡眠不足，15% 可能是其他原因。对已知和未知都保持诚实。',
                highlight: language === 'en' ? "We admit when we're not sure." : "我们承认自己不确定的时候。"
            }
        },
        {
            id: 'calibration',
            icon: Sun,
            title: language === 'en' ? 'Daily Check-In' : '每日身心校准',
            desc: language === 'en'
                ? '60 seconds. That\'s it. Just enough to know whether today is a push day or a rest day.'
                : '60秒。就这么多。足够让你知道今天该冲还是该歇。',
            colSpan: 'md:col-span-4',
            bgClass: 'bg-[#FAF6EF] border border-[#1A1A1A]/10 dark:bg-[#1A1A1A] dark:border-white/10',
            color: "from-amber-500 to-orange-600",
            detail: {
                title: language === 'en' ? "Know your capacity today" : "知道今天的容量",
                content: language === 'en'
                    ? "Most apps want you to track everything forever. We just want 60 seconds each morning. Quick subjective check + overnight bio-data = your energy budget for the day. Some days you have 100%. Some days you have 40%. Both are fine."
                    : '大多数应用想让你永远记录一切。我们只要每天早上60秒。快速主观检查 + 昨晚生理数据 = 你今天的能量预算。有些天你有100%，有些天只有40%。都可以。',
                highlight: language === 'en' ? "Permission to rest when needed." : "需要休息时，允许自己休息。"
            }
        },
        {
            id: 'ecosystem',
            icon: Watch,
            title: language === 'en' ? 'Use What You Have' : '用你现有的设备',
            desc: language === 'en'
                ? 'Apple Watch, Oura, Fitbit, Mi Band—whatever is already on your wrist works.'
                : 'Apple Watch、Oura、华为、小米手环——你手腕上戴着的就能用。',
            colSpan: 'md:col-span-4',
            bgClass: 'bg-[#E8DFD0]/20 dark:bg-[#2C2C2C]/20',
            color: "from-pink-500 to-rose-600",
            detail: {
                title: language === 'en' ? "No new purchases required" : "不需要买新设备",
                content: language === 'en'
                    ? "Buying expensive gadgets is its own stress. We work with 95% of wearables out there. Even just your phone's built-in sleep tracking can get you started. Use what you already own."
                    : '买昂贵的设备本身就是一种压力。我们兼容市面上95%的穿戴设备。甚至只用手机自带的睡眠追踪也能开始使用。用你已经有的就好。',
                highlight: language === 'en' ? "Start today, not after shopping." : "今天就开始，不用先去购物。"
            }
        }
    ];

    const activeFeature = features.find(f => f.id === selectedId);

    return (
        <section className="py-24 px-6 md:px-12 max-w-[1400px] mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-16 text-center md:text-left"
            >
                <span className="text-xs font-medium tracking-[0.2em] uppercase text-[#D4AF37] mb-4 block">
                    {language === 'en' ? 'Core Technology' : '核心功能'}
                </span>
                <h2 className="font-heading text-4xl md:text-5xl text-[#1A1A1A] dark:text-white max-w-2xl leading-tight">
                    {language === 'en' ? 'Smarter, Not Harder.' : '不是更努力，而是更聪明。'}
                </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {features.map((feature, idx) => (
                    <motion.div
                        key={feature.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => setSelectedId(feature.id)}
                        className={`${feature.colSpan} relative group overflow-hidden rounded-[0px] p-8 md:p-12 ${feature.bgClass} backdrop-blur-sm min-h-[340px] flex flex-col justify-between transition-transform duration-500 hover:scale-[1.01] cursor-pointer`}
                    >
                        {/* Hover Decor */}
                        <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity duration-500 scale-150 rotate-12 pointer-events-none">
                            <feature.icon className="w-48 h-48 stroke-[1]" />
                        </div>

                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-[#1A1A1A] dark:bg-white text-white dark:text-black flex items-center justify-center rounded-full mb-6 shadow-lg">
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-medium mb-4 text-[#1A1A1A] dark:text-white tracking-tight group-hover:text-[#D4AF37] transition-colors">
                                {feature.title}
                            </h3>
                            <p className="text-[#1A1A1A]/70 dark:text-white/70 leading-relaxed text-sm md:text-base pr-8">
                                {feature.desc}
                            </p>
                        </div>

                        <div className="w-full h-[1px] bg-[#1A1A1A]/10 dark:bg-white/10 mt-8 group-hover:bg-[#D4AF37]/50 transition-colors duration-500 origin-left scale-x-50 group-hover:scale-x-100" />

                        {/* Arrow hint */}
                        <div className="absolute bottom-12 right-12 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                            <ArrowRight className="w-6 h-6 text-[#D4AF37]" />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Detailed Modal */}
            <AnimatePresence>
                {activeFeature && (
                    <motion.div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedId(null)}
                    >
                        <motion.div
                            className="bg-[#FAF6EF] dark:bg-[#161618] rounded-[2px] max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#1A1A1A]/10 dark:border-white/10 relative shadow-2xl"
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Decorative background */}
                            <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${activeFeature.color} opacity-10 blur-[80px] pointer-events-none`} />

                            <div className="p-8 md:p-12 relative z-10">
                                <div className="flex justify-between items-start mb-8">
                                    <div className={`w-16 h-16 bg-gradient-to-br ${activeFeature.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                                        <activeFeature.icon className="w-8 h-8" />
                                    </div>
                                    <button
                                        onClick={() => setSelectedId(null)}
                                        className="p-2 rounded-full bg-[#1A1A1A]/5 dark:bg-white/5 hover:bg-[#1A1A1A]/10 dark:hover:bg-white/10 transition-colors text-[#1A1A1A]/40 dark:text-white/40 hover:text-[#1A1A1A] dark:hover:text-white"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <h3 className="text-3xl font-heading font-medium text-[#1A1A1A] dark:text-white mb-2">
                                    {activeFeature.title}
                                </h3>
                                <div className="h-1 w-20 bg-gradient-to-r from-transparent to-transparent via-[#1A1A1A]/10 dark:via-white/20 rounded-full mb-8 relative overflow-hidden">
                                    <div className={`absolute inset-0 bg-gradient-to-r ${activeFeature.color} opacity-50`} />
                                </div>

                                <div className="space-y-8">
                                    <div>
                                        <h4 className="text-[#D4AF37] font-serif italic text-xl mb-4">
                                            {activeFeature.detail.title}
                                        </h4>
                                        <p className="text-[#1A1A1A]/80 dark:text-white/80 text-lg leading-relaxed font-light">
                                            {activeFeature.detail.content}
                                        </p>
                                    </div>

                                    <div className="p-6 rounded-sm bg-[#1A1A1A]/5 dark:bg-white/5 border border-[#1A1A1A]/5 dark:border-white/5">
                                        <p className="text-[#1A1A1A] dark:text-white/90 font-medium flex items-center gap-3">
                                            <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                                            {activeFeature.detail.highlight}
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
