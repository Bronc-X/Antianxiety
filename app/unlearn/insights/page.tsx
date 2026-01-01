'use client';

import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import {
    HRVDashboard,
    FeedbackLoop,
    ScienceFeed,
    UnlearnFooter,
} from '@/components/unlearn';

export default function InsightsPage() {
    const { language } = useI18n();

    return (
        <main className="unlearn-theme font-serif">
            <section className="pt-24 pb-12 px-6" style={{ backgroundColor: '#0B3D2E' }}>
                <div className="max-w-[1000px] mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-white"
                    >
                        <p className="text-sm uppercase tracking-widest text-[#D4AF37] mb-2">
                            {language === 'en' ? 'Insights' : '洞察'}
                        </p>
                        <h1 className="text-3xl md:text-4xl font-bold mb-3">
                            {language === 'en' ? 'Your biometric and AI insights' : '你的生物指标与 AI 洞察'}
                        </h1>
                        <p className="text-white/60">
                            {language === 'en'
                                ? 'Monitor HRV, see learning progress, and discover research tailored to you.'
                                : '查看 HRV 变化、学习进度，并获取为你定制的研究内容。'}
                        </p>
                    </motion.div>
                </div>
            </section>

            <HRVDashboard />
            <FeedbackLoop />
            <ScienceFeed />

            <UnlearnFooter
                socialLinks={{
                    twitter: 'https://twitter.com/antianxiety',
                    linkedin: 'https://linkedin.com/company/antianxiety',
                    youtube: 'https://youtube.com/@antianxiety',
                }}
            />
        </main>
    );
}
