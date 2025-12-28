'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Sparkles } from 'lucide-react';
import {
    AIInquiryPanel,
    FeedbackLoop,
    WearableConnect,
    HRVDashboard,
    PlanDashboard,
    ScienceFeed,
    DailyCalibration,
    UnlearnFooter,
    MaxFloatingButton,
} from '@/components/unlearn';

export default function AppDashboard() {
    const { language } = useI18n();
    const [showCalibration, setShowCalibration] = useState(false);

    // Get time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (language === 'en') {
            if (hour < 12) return 'Good morning';
            if (hour < 18) return 'Good afternoon';
            return 'Good evening';
        } else {
            if (hour < 12) return '早上好';
            if (hour < 18) return '下午好';
            return '晚上好';
        }
    };

    return (
        <main className="unlearn-theme font-serif">
            {/* Welcome Header */}
            <section className="pt-24 pb-12 px-6" style={{ backgroundColor: '#0B3D2E' }}>
                <div className="max-w-[1200px] mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between"
                    >
                        <div>
                            <h1 className="text-white text-3xl md:text-4xl font-bold mb-2 font-serif">
                                {getGreeting()}
                            </h1>
                            <p className="text-white/60 font-serif">
                                {language === 'en'
                                    ? "Here's what your digital twin learned about you"
                                    : '这是你的数字孪生对你的最新洞察'}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCalibration(!showCalibration)}
                            className="flex items-center gap-2 px-5 py-3 bg-[#D4AF37] text-[#0B3D2E] font-semibold font-serif hover:bg-[#E5C158] transition-colors"
                        >
                            <Sparkles className="w-5 h-5" />
                            {language === 'en' ? 'Daily Calibration' : '每日校准'}
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* Daily Calibration (toggleable) */}
            {showCalibration && <DailyCalibration />}

            {/* AI Proactive Inquiry */}
            <AIInquiryPanel onInquiryComplete={() => console.log('Inquiry completed')} />

            {/* HRV Dashboard */}
            <HRVDashboard />

            {/* Wearable Connections */}
            <WearableConnect />

            {/* Plans Dashboard */}
            <PlanDashboard />

            {/* AI Learning Feedback */}
            <FeedbackLoop />

            {/* Science Feed */}
            <ScienceFeed />

            {/* Footer */}
            <UnlearnFooter
                socialLinks={{
                    twitter: 'https://twitter.com/antianxiety',
                    linkedin: 'https://linkedin.com/company/antianxiety',
                    youtube: 'https://youtube.com/@antianxiety',
                }}
            />

            {/* Floating Max Button */}
            <MaxFloatingButton />
        </main>
    );
}
