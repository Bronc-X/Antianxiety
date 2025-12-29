'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DarkOnboarding() {
    const { language } = useI18n();
    const router = useRouter();
    const [step, setStep] = useState(0);

    const next = () => {
        if (step < 3) setStep(step + 1);
        else router.push('/mobile-dark');
    };

    const content = [
        {
            title: "BIO-TWIN INITIALIZATION",
            subtitle: "ESTABLISHING BASELINE METRICS",
            text: "System will now calibrate to your unique physiological signature."
        },
        {
            title: "DATA PERMISSIONS",
            subtitle: "READ_ONLY ACCESS REQUIRED",
            text: "Allow access to HealthKit for live HRV and Sleep stage analysis."
        },
        {
            title: "NOTIFICATION PROTOCOL",
            subtitle: "INTERVENTION ALERTS",
            text: "System requires permission to send immediate intervention alerts during stress spikes."
        },
        {
            title: "SYSTEM READY",
            subtitle: "ALL CHECKS PASSED",
            text: "Initialization complete. Entering monitoring mode."
        }
    ];

    return (
        <div className="min-h-screen bg-black text-white p-6 flex flex-col justify-between font-mono">
            {/* Top Status */}
            <div className="flex justify-between items-start pt-8 border-t-2 border-white">
                <span className="text-[10px] tracking-widest">SEQ_0{step + 1}</span>
                <div className="flex gap-1">
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className={`w-2 h-2 ${i <= step ? 'bg-[#00FF94]' : 'bg-[#222222]'}`} />
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                    >
                        <h1 className="text-4xl font-sans font-bold tracking-tighter leading-none mb-4 uppercase">
                            {content[step].title}
                        </h1>
                        <div className="w-12 h-1 bg-[#007AFF] mb-6" />
                        <h2 className="text-sm text-[#00FF94] tracking-widest mb-4 uppercase">
                            {content[step].subtitle}
                        </h2>
                        <p className="text-sm text-[#888888] leading-relaxed max-w-xs">
                            {content[step].text}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Action */}
            <button
                onClick={next}
                className="w-full py-4 bg-white text-black font-bold tracking-widest uppercase hover:bg-[#CCCCCC] transition-colors flex justify-between px-6 items-center group"
            >
                <span>{step === 3 ? 'LAUNCH' : 'PROCEED'}</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );
}
