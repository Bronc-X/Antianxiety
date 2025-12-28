'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
    Brain,
    Activity,
    Shield,
    Sparkles,
    Zap,
    LucideIcon,
} from 'lucide-react';
import UnlearnCard from './UnlearnCard';
import { useI18n } from '@/lib/i18n';

interface Feature {
    icon: LucideIcon;
    title: string;
    description: string;
}

export default function UnlearnFeatures() {
    const { language } = useI18n();
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: true, margin: '-100px' });
    const features: Feature[] = language === 'en'
        ? [
            {
                icon: Brain,
                title: 'AI Digital Twin',
                description:
                    'Your personal AI model learns your unique patterns, predicting energy levels and anxiety triggers before they happen.',
            },
            {
                icon: Activity,
                title: 'Real-Time Biometrics',
                description:
                    'Connect wearables to track HRV, sleep quality, and activity. We turn data into actionable insights.',
            },
            {
                icon: Shield,
                title: 'Science-Backed Methods',
                description:
                    'Evidence-based interventions from clinical-grade assessments like PHQ-9 and GAD-7.',
            },
            {
                icon: Sparkles,
                title: 'Adaptive Coaching',
                description:
                    'Max adapts recommendations based on your state, preferences, and progress.',
            },
            {
                icon: Zap,
                title: 'Instant Interventions',
                description:
                    'Quick breathing exercises, grounding techniques, and cognitive reframes when you need them most.',
            },
        ]
        : [
            {
                icon: Brain,
                title: 'AI 数字孪生',
                description: '你的个人 AI 模型学习独特模式，提前预测能量与焦虑触发。',
            },
            {
                icon: Activity,
                title: '实时生物指标',
                description: '连接穿戴设备追踪 HRV、睡眠与活动，把数据变成行动建议。',
            },
            {
                icon: Shield,
                title: '循证方法',
                description: '基于 PHQ-9、GAD-7 等临床量表与专业协议的干预方式。',
            },
            {
                icon: Sparkles,
                title: '自适应教练',
                description: 'Max 会根据你的状态与偏好动态调整建议。',
            },
            {
                icon: Zap,
                title: '即时干预',
                description: '需要时随时进行呼吸训练、正念调节与认知重构。',
            },
        ];

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
                    className="max-w-3xl mb-16"
                >
                    <p className="text-sm uppercase tracking-widest font-medium mb-4 text-[#D4AF37]">
                        {language === 'en' ? 'Features' : '核心功能'}
                    </p>
                    <h2
                        className="text-white font-bold leading-[1.1] tracking-[-0.02em] mb-6"
                        style={{ fontSize: 'clamp(32px, 5vw, 48px)' }}
                    >
                        {language === 'en' ? 'Everything you need to understand and manage anxiety' : '掌控焦虑所需的一切能力'}
                    </h2>
                    <p className="text-lg text-white/60 leading-relaxed">
                        {language === 'en'
                            ? 'Our platform combines cutting-edge AI with clinical expertise to deliver personalized support that actually works.'
                            : '平台结合前沿 AI 与临床经验，为你提供真正有效的个性化支持。'}
                    </p>
                </motion.div>

                {/* Feature Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                        >
                            <UnlearnCard
                                icon={feature.icon}
                                title={feature.title}
                                description={feature.description}
                                variant="dark"
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
