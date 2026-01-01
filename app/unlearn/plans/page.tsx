'use client';

import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { PlanDashboard, UnlearnFooter } from '@/components/unlearn';

export default function PlansPage() {
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
                            {language === 'en' ? 'Plan Library' : '计划中心'}
                        </p>
                        <h1 className="text-3xl md:text-4xl font-bold mb-3">
                            {language === 'en' ? 'Your adaptive recovery plans' : '你的自适应恢复方案'}
                        </h1>
                        <p className="text-white/60">
                            {language === 'en'
                                ? 'Track progress, adjust steps, and create new routines with Max.'
                                : '追踪进度、调整步骤，并与 Max 共同创建新方案。'}
                        </p>
                    </motion.div>
                </div>
            </section>

            <PlanDashboard />

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
