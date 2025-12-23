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
            title: language === 'en' ? 'Active AI Care' : '主动式 AI 诊疗',
            desc: language === 'en'
                ? 'The world\'s most attentive health assistant. It doesn\'t wait for you to ask.'
                : '世界上最了解你的医疗助理。它不会等你开口，而是通过数据异常主动发起关怀，像私人医生一样敏锐。',
            colSpan: 'md:col-span-8',
            bgClass: 'bg-[#E8DFD0]/30 dark:bg-[#2C2C2C]/30',
            color: "from-purple-500 to-indigo-600",
            detail: {
                title: language === 'en' ? "How does it work?" : "它是如何工作的？",
                content: language === 'en'
                    ? "Traditional health apps are passive—you input symptoms, they give advice. Antianxiety is active. It monitors your HRV, sleep, and surface temp 24/7. When your stress spikes, Max messages you: 'I noticed your deep sleep dropped to 40m. Feeling okay?'"
                    : "传统的医疗应用是「被动」的——你输入症状，它给出建议。Antianxiety 是「主动」的。它全天候监测你的 HRV、睡眠和体表温度。当你处于高压或异常状态时，Max 会主动发来询问：「我注意到你昨晚深睡只有 40 分钟，感觉还好吗？」这种主动关怀能让你在崩溃前得到支持。",
                highlight: language === 'en' ? "Detects anxiety before you do." : "比你自己更早发现你的焦虑。"
            }
        },
        {
            id: 'science',
            icon: Brain,
            title: language === 'en' ? 'Precision Science' : '精准科研情报',
            desc: language === 'en'
                ? 'Filters 99% of noise. Push only clinical research relevant to your symptoms.'
                : '为你过滤 99% 的噪音。基于你的健康画像，只推送与你当前症状高度相关的科研论文与临床指南。',
            colSpan: 'md:col-span-4',
            bgClass: 'bg-[#9CAF88]/10 dark:bg-[#9CAF88]/10',
            color: "from-blue-500 to-cyan-600",
            detail: {
                title: language === 'en' ? "Reject Pseudoscience" : "拒绝伪科学",
                content: language === 'en'
                    ? "The web is full of marketing fluff. We connect to PubMed and Semantic Scholar, pulling clinical studies relevant to YOUR specific profile (e.g. 'High Cortisol', 'Fragmented Sleep'). Every piece of advice is backed by solid evidence."
                    : "互联网上充斥着伪科学和营销软文。我们连接了 PubMed 和 Semantic Scholar 数据库，根据你的特定健康画像（如「高皮质醇」、「睡眠碎片化」），实时抓取最新的临床研究和荟萃分析。每一条建议背后，都有坚实的循证医学证据支持。",
                highlight: language === 'en' ? "Evidence only. No ads." : "只看证据，不看广告。"
            }
        },
        {
            id: 'bayesian',
            icon: Activity,
            title: language === 'en' ? 'Bayesian Engine' : '贝叶斯推理引擎',
            desc: language === 'en'
                ? 'Not a vague search. Transforms fuzzy feelings into precise medical hypotheses.'
                : '不再是百度的模糊搜索。基于贝叶斯概率模型，将模糊的身体感受转化为精准的医疗假设。',
            colSpan: 'md:col-span-4',
            bgClass: 'bg-[#D4AF37]/10 dark:bg-[#D4AF37]/10',
            color: "from-emerald-500 to-teal-600",
            detail: {
                title: language === 'en' ? "Probability, not Absolutes" : "概率而非绝对",
                content: language === 'en'
                    ? "Bodies aren't machines. We use Bayesian probability. When HRV drops, we don't jump to conclusions. We weigh your baseline, yesterday's stress, and subjective reports to calculate the probability of 'Overtraining' vs 'Illness', updating as new data comes in."
                    : "人体不是机器，不存在绝对的因果。我们使用贝叶斯概率模型来处理健康数据。当你的 HRV 下降时，它不会草率下结论，而是结合你的历史基线、昨日活动和主观感受，计算出「过度训练」或「潜在疾病」的概率分布，并随着新数据的输入不断自我修正。",
                highlight: language === 'en' ? "Think like a top doctor." : "像顶尖医生一样思考。"
            }
        },
        {
            id: 'calibration',
            icon: Sun,
            title: language === 'en' ? 'Daily Calibration' : '身心每日校准',
            desc: language === 'en'
                ? '1-minute rapid scan. Logs not just data, but faint signals.'
                : '1分钟快速扫描追踪。记录的不只是数据，更是你身体的微弱信号，建立你的个人生物模型。',
            colSpan: 'md:col-span-4',
            bgClass: 'bg-[#FAF6EF] border border-[#1A1A1A]/10 dark:bg-[#1A1A1A] dark:border-white/10',
            color: "from-amber-500 to-orange-600",
            detail: {
                title: language === 'en' ? "Clarity in Chaos" : "各种状态，一目了然",
                content: language === 'en'
                    ? "Like tuning an orchestra, your body needs daily calibration. Spend 1 minute each morning. We read your bio-data and subjective check-in to generate a 'Status Report'. It's not just a score—it's an energy budget for your day."
                    : "就像交响乐团演出前需要调音一样，你的身心也需要每日校准。每天早晨 1 分钟，通过简单的交互和生理数据读取，系统为你生成当天的「状态报告」。这不是单纯的打分，而是为你当天的活动设定合理的「能量预算」。",
                highlight: language === 'en' ? "Find order in chaos." : "在混乱中找到秩序。"
            }
        },
        {
            id: 'ecosystem',
            icon: Watch,
            title: language === 'en' ? 'Full Ecosystem' : '全生态设备支持',
            desc: language === 'en'
                ? 'Compatible with Apple Watch, Oura, Fitbit and more.'
                : '不需要为了使用软件买新手表。支持 Apple Watch、华为、小米、Fitbit 等主流设备。',
            colSpan: 'md:col-span-4',
            bgClass: 'bg-[#E8DFD0]/20 dark:bg-[#2C2C2C]/20',
            color: "from-pink-500 to-rose-600",
            detail: {
                title: language === 'en' ? "Zero Friction" : "零成本启动",
                content: language === 'en'
                    ? "Buying expensive gear is stress itself. We support 95% of wearables. Apple Watch, Mi Band, Oura... or even just your phone's sleep tracking sensors. Use what you have."
                    : "我们深知，为了健康而购买昂贵的设备本身就是一种压力。因此，我们兼容市面上 95% 的穿戴设备。无论你戴的是 Apple Watch 还是小米手环，亦或是 Oura Ring，我们都能无缝接入。甚至，仅凭手机的睡眠监测功能，也能获得不错的基础体验。",
                highlight: language === 'en' ? "Use what you have." : "用你现有的，就是最好的。"
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
