'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Sparkles, MessageCircle } from 'lucide-react';
import {
    AIInquiryPanel,
    MaxChatPanel,
    FeedbackLoop,
    WearableConnect,
    HRVDashboard,
    PlanDashboard,
    ScienceFeed,
    DailyCalibration,
    UnlearnFooter,
} from '@/components/unlearn';

export default function AppDashboard() {
    const { language } = useI18n();
    const [chatOpen, setChatOpen] = useState(false);
    const [showCalibration, setShowCalibration] = useState(false);

    return (
        <main className="unlearn-theme">
            {/* Welcome Header */}
            <section className="pt-24 pb-12 px-6" style={{ backgroundColor: '#0B3D2E' }}>
                <div className="max-w-[1200px] mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between"
                    >
                        <div>
                            <h1 className="text-white text-3xl md:text-4xl font-bold mb-2">
                                {language === 'en' ? 'Good morning!' : '早上好！'}
                            </h1>
                            <p className="text-white/60">
                                {language === 'en'
                                    ? "Here's what your digital twin learned about you"
                                    : '这是你的数字孪生对你的了解'}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCalibration(!showCalibration)}
                            className="flex items-center gap-2 px-5 py-3 bg-[#D4AF37] text-[#0B3D2E] font-medium hover:bg-[#E5C158] transition-colors"
                        >
                            <Sparkles className="w-5 h-5" />
                            {language === 'en' ? 'Daily Check-in' : '每日打卡'}
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

            {/* Floating Chat Button */}
            <button
                onClick={() => setChatOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-[#D4AF37] text-[#0B3D2E] flex items-center justify-center shadow-lg hover:bg-[#E5C158] transition-colors z-40"
            >
                <MessageCircle className="w-6 h-6" />
            </button>

            {/* Max Chat Panel */}
            <MaxChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
        </main>
    );
}
