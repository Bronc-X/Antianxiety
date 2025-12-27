'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
    Brain,
    Activity,
    Shield,
    Sparkles,
    LineChart,
    Zap,
    LucideIcon,
} from 'lucide-react';
import UnlearnCard from './UnlearnCard';

interface Feature {
    icon: LucideIcon;
    title: string;
    description: string;
}

const features: Feature[] = [
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
            'Evidence-based interventions from clinical-grade assessments like PHQ-9, GAD-7, and proprietary protocols.',
    },
    {
        icon: Sparkles,
        title: 'Adaptive Coaching',
        description:
            'Max, your AI health coach, adapts recommendations based on your state, preferences, and progress.',
    },
    {
        icon: LineChart,
        title: 'Trend Analysis',
        description:
            'Visualize your anxiety patterns over time. Identify triggers and celebrate improvements.',
    },
    {
        icon: Zap,
        title: 'Instant Interventions',
        description:
            'Quick breathing exercises, grounding techniques, and cognitive reframes when you need them most.',
    },
];

export default function UnlearnFeatures() {
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: true, margin: '-100px' });

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
                        Features
                    </p>
                    <h2
                        className="text-white font-bold leading-[1.1] tracking-[-0.02em] mb-6"
                        style={{ fontSize: 'clamp(32px, 5vw, 48px)' }}
                    >
                        Everything you need to understand and manage anxiety
                    </h2>
                    <p className="text-lg text-white/60 leading-relaxed">
                        Our platform combines cutting-edge AI with clinical expertise to deliver
                        personalized support that actually works.
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
