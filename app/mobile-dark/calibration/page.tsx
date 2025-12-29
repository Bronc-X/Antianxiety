'use client';

import { MobileDailyQuestionnaire } from '@/components/mobile-dark/MobileDailyQuestionnaire';
import DarkBottomNav from '@/components/mobile-dark/DarkBottomNav';

export default function DarkCalibrationPage() {
    return (
        <div className="min-h-screen bg-black pb-32">
            <header className="px-6 pt-16 pb-6 border-b border-[#111111]">
                <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
                    Daily Calibration
                </h1>
                <p className="text-xs text-[#666666] font-mono uppercase tracking-wider">
                    SYNCING BIO-METRICS...
                </p>
            </header>

            <main className="px-6 pt-8">
                <MobileDailyQuestionnaire />
            </main>

            <DarkBottomNav />
        </div>
    );
}
