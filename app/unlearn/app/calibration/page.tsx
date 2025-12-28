'use client';

import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { DailyCalibration, UnlearnFooter, MaxFloatingButton } from '@/components/unlearn';

export default function CalibrationPage() {
    const { language } = useI18n();

    return (
        <main className="unlearn-theme font-serif">
            <section className="pt-24 pb-12 px-6" style={{ backgroundColor: '#0B3D2E' }}>
                <div className="max-w-[900px] mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-white"
                    >
                        <p className="text-sm uppercase tracking-widest text-[#D4AF37] mb-2">
                            {language === 'en' ? 'Daily Calibration' : '每日校准'}
                        </p>
                        <h1 className="text-3xl md:text-4xl font-bold mb-3">
                            {language === 'en' ? 'Log today’s signals' : '记录今天的状态'}
                        </h1>
                        <p className="text-white/60">
                            {language === 'en'
                                ? 'Answer a few questions to keep your digital twin aligned.'
                                : '回答几个问题，让数字孪生持续校准。'}
                        </p>
                    </motion.div>
                </div>
            </section>

            <DailyCalibration />

            <UnlearnFooter
                socialLinks={{
                    twitter: 'https://twitter.com/antianxiety',
                    linkedin: 'https://linkedin.com/company/antianxiety',
                    youtube: 'https://youtube.com/@antianxiety',
                }}
            />

            <MaxFloatingButton />
        </main>
    );
}
