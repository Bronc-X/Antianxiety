'use client';

import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
    Brain,
    Activity,
    Shield,
    Sparkles,
    Zap,
    LucideIcon,
    ChevronRight,
    ChevronDown,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface Feature {
    icon: LucideIcon;
    title: string;
    description: string;
    details: string[];
}

export default function UnlearnFeatures() {
    const { language } = useI18n();
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: true, margin: '-100px' });
    const [activeIndex, setActiveIndex] = useState(0);
    const [mobileExpanded, setMobileExpanded] = useState<number | null>(0);

    const features: Feature[] = language === 'en'
        ? [
            {
                icon: Brain,
                title: 'AI Digital Twin',
                description: 'Your personal AI model that learns and evolves with you.',
                details: [
                    'Learns your unique behavioral patterns',
                    'Predicts energy levels and anxiety triggers',
                    'Continuously improves with each interaction',
                    'Privacy-first: your data stays yours',
                ],
            },
            {
                icon: Activity,
                title: 'Real-Time Biometrics',
                description: 'Connect your wearables for deeper insights.',
                details: [
                    'HRV tracking for stress detection',
                    'Sleep quality analysis',
                    'Activity and recovery balance',
                    'Seamless device integration',
                ],
            },
            {
                icon: Shield,
                title: 'Science-Backed Methods',
                description: 'Evidence-based interventions powered by top-tier research.',
                details: [
                    'PHQ-9 and GAD-7 clinical assessments',
                    'Personalized insights from Nature, The Lancet, JAMA',
                    'Real-time updates from PubMed & Semantic Scholar',
                    'Curated content from trusted health influencers',
                    'Transparent methodology with source citations',
                ],
            },
            {
                icon: Sparkles,
                title: 'Personal Health Agent',
                description: 'Max adapts to your unique needs.',
                details: [
                    'Dynamic recommendation engine',
                    'Learns your preferences over time',
                    'Context-aware suggestions',
                    'Available 24/7 when you need support',
                ],
            },
            {
                icon: Zap,
                title: 'Instant Interventions',
                description: 'Quick relief when you need it most.',
                details: [
                    'Guided breathing exercises',
                    'Grounding techniques',
                    'Cognitive reframing tools',
                    'Micro-meditations under 5 minutes',
                ],
            },
        ]
        : [
            {
                icon: Brain,
                title: 'AI 数字孪生',
                description: '与你一起学习和进化的个人 AI 模型。',
                details: [
                    '学习你独特的行为模式',
                    '预测能量水平和焦虑触发点',
                    '每次互动都在持续改进',
                    '隐私优先：你的数据归你所有',
                ],
            },
            {
                icon: Activity,
                title: '实时生物指标',
                description: '连接穿戴设备获取更深入的洞察。',
                details: [
                    'HRV 追踪用于压力检测',
                    '睡眠质量分析',
                    '活动与恢复平衡',
                    '无缝设备集成',
                ],
            },
            {
                icon: Shield,
                title: '循证方法',
                description: '基于顶级研究的循证干预，个性化推送给你。',
                details: [
                    'PHQ-9 和 GAD-7 临床评估',
                    '来自 Nature、The Lancet、JAMA 等顶级期刊的个性化洞察',
                    'PubMed 和 Semantic Scholar 实时研究更新',
                    '精选高质量健康自媒体内容',
                    '透明方法论，所有建议附带来源引用',
                ],
            },
            {
                icon: Sparkles,
                title: '个人健康智能体',
                description: 'Max 适应你的独特需求。',
                details: [
                    '动态推荐引擎',
                    '随时间学习你的偏好',
                    '情境感知建议',
                    '全天候支持',
                ],
            },
            {
                icon: Zap,
                title: '即时干预',
                description: '在最需要时快速缓解。',
                details: [
                    '引导式呼吸练习',
                    '接地技术',
                    '认知重构工具',
                    '5 分钟内的微冥想',
                ],
            },
        ];

    const activeFeature = features[activeIndex];

    return (
        <section
            ref={containerRef}
            id="features"
            className="relative py-24"
            style={{ backgroundColor: '#0B3D2E' }}
        >
            {/* Background Glow */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] rounded-full blur-[200px] pointer-events-none"
                style={{ backgroundColor: 'rgba(212, 175, 55, 0.08)' }}
            />

            <div className="relative z-10 max-w-[1280px] mx-auto px-6">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <p className="text-sm uppercase tracking-widest font-medium mb-4 text-[#D4AF37] font-serif">
                        {language === 'en' ? 'Features' : '核心功能'}
                    </p>
                    <h2 className="text-white font-serif font-bold leading-[1.1] tracking-[-0.02em] text-4xl md:text-5xl">
                        {language === 'en' ? 'Everything you need' : '掌控焦虑所需的一切'}
                    </h2>
                </motion.div>

                {/* Desktop: Side Navigation */}
                <div className="hidden md:grid md:grid-cols-[280px_1fr] gap-8 lg:gap-16">
                    {/* Left: Navigation */}
                    <div className="space-y-1">
                        {features.map((feature, index) => (
                            <motion.button
                                key={feature.title}
                                initial={{ opacity: 0, x: -20 }}
                                animate={isInView ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                onMouseEnter={() => setActiveIndex(index)}
                                onClick={() => setActiveIndex(index)}
                                className={`w-full text-left p-4 flex items-center gap-4 transition-all duration-300 group ${
                                    activeIndex === index
                                        ? 'bg-[#D4AF37]/10 border-l-2 border-[#D4AF37]'
                                        : 'border-l-2 border-transparent hover:bg-white/5'
                                }`}
                            >
                                <feature.icon
                                    className={`w-5 h-5 transition-colors duration-300 ${
                                        activeIndex === index ? 'text-[#D4AF37]' : 'text-white/40 group-hover:text-white/60'
                                    }`}
                                />
                                <span
                                    className={`font-serif font-medium transition-colors duration-300 ${
                                        activeIndex === index ? 'text-[#D4AF37]' : 'text-white/60 group-hover:text-white/80'
                                    }`}
                                >
                                    {feature.title}
                                </span>
                                <ChevronRight
                                    className={`w-4 h-4 ml-auto transition-all duration-300 ${
                                        activeIndex === index
                                            ? 'text-[#D4AF37] translate-x-0 opacity-100'
                                            : 'text-white/20 -translate-x-2 opacity-0 group-hover:opacity-50'
                                    }`}
                                />
                            </motion.button>
                        ))}
                    </div>

                    {/* Right: Content */}
                    <div className="relative min-h-[400px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeIndex}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="p-8 lg:p-12"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                                    border: '1px solid rgba(212, 175, 55, 0.15)',
                                }}
                            >
                                {/* Icon */}
                                <div className="w-16 h-16 bg-[#D4AF37]/10 flex items-center justify-center mb-6">
                                    <activeFeature.icon className="w-8 h-8 text-[#D4AF37]" />
                                </div>

                                {/* Title & Description */}
                                <h3 className="text-3xl font-serif font-bold text-white mb-4">
                                    {activeFeature.title}
                                </h3>
                                <p className="text-lg text-white/70 font-serif mb-8 max-w-lg">
                                    {activeFeature.description}
                                </p>

                                {/* Details List */}
                                <ul className="space-y-4">
                                    {activeFeature.details.map((detail, i) => (
                                        <motion.li
                                            key={detail}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="flex items-start gap-3"
                                        >
                                            <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full mt-2 shrink-0" />
                                            <span className="text-white/80 font-serif">{detail}</span>
                                        </motion.li>
                                    ))}
                                </ul>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Mobile: Accordion */}
                <div className="md:hidden space-y-3">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            style={{
                                background: mobileExpanded === index
                                    ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)'
                                    : 'rgba(255, 255, 255, 0.02)',
                                border: mobileExpanded === index
                                    ? '1px solid rgba(212, 175, 55, 0.2)'
                                    : '1px solid rgba(255, 255, 255, 0.05)',
                            }}
                        >
                            {/* Header */}
                            <button
                                onClick={() => setMobileExpanded(mobileExpanded === index ? null : index)}
                                className="w-full p-5 flex items-center gap-4"
                            >
                                <div
                                    className={`w-10 h-10 flex items-center justify-center transition-colors ${
                                        mobileExpanded === index ? 'bg-[#D4AF37]/15' : 'bg-white/5'
                                    }`}
                                >
                                    <feature.icon
                                        className={`w-5 h-5 transition-colors ${
                                            mobileExpanded === index ? 'text-[#D4AF37]' : 'text-white/50'
                                        }`}
                                    />
                                </div>
                                <span
                                    className={`font-serif font-medium flex-1 text-left transition-colors ${
                                        mobileExpanded === index ? 'text-[#D4AF37]' : 'text-white/80'
                                    }`}
                                >
                                    {feature.title}
                                </span>
                                <ChevronDown
                                    className={`w-5 h-5 transition-transform duration-300 ${
                                        mobileExpanded === index ? 'text-[#D4AF37] rotate-180' : 'text-white/30'
                                    }`}
                                />
                            </button>

                            {/* Content */}
                            <AnimatePresence>
                                {mobileExpanded === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-5 pb-5">
                                            <p className="text-white/70 font-serif mb-4">
                                                {feature.description}
                                            </p>
                                            <ul className="space-y-3">
                                                {feature.details.map((detail) => (
                                                    <li key={detail} className="flex items-start gap-3">
                                                        <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full mt-2 shrink-0" />
                                                        <span className="text-sm text-white/70 font-serif">{detail}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
