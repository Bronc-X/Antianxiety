'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { WearableConnect, UnlearnFooter, MaxFloatingButton } from '@/components/unlearn';

export default function SettingsPage() {
    const { language } = useI18n();
    const [preferences, setPreferences] = useState({
        dailyReminder: true,
        weeklySummary: false,
        researchDigest: true,
    });

    const togglePreference = (key: keyof typeof preferences) => {
        setPreferences(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const preferenceRows = [
        {
            key: 'dailyReminder' as const,
            title: language === 'en' ? 'Daily check-in reminder' : '每日打卡提醒',
            description: language === 'en'
                ? 'Gentle prompts for your daily calibration window.'
                : '在每日校准窗口内轻提醒你。',
        },
        {
            key: 'weeklySummary' as const,
            title: language === 'en' ? 'Weekly progress summary' : '每周进度汇总',
            description: language === 'en'
                ? 'Receive a recap of HRV trends and plan adherence.'
                : '每周查看 HRV 趋势与计划执行情况。',
        },
        {
            key: 'researchDigest' as const,
            title: language === 'en' ? 'Research digest' : '研究简报',
            description: language === 'en'
                ? 'Curated science updates aligned with your profile.'
                : '与个人档案匹配的科学内容更新。',
        },
    ];

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
                            {language === 'en' ? 'Settings' : '设置'}
                        </p>
                        <h1 className="text-3xl md:text-4xl font-bold mb-3">
                            {language === 'en' ? 'Customize your experience' : '个性化你的体验'}
                        </h1>
                        <p className="text-white/60">
                            {language === 'en'
                                ? 'Manage notifications, data sync, and how Max supports you.'
                                : '管理通知、数据同步，以及 Max 的陪伴方式。'}
                        </p>
                    </motion.div>
                </div>
            </section>

            <section className="py-16 px-6" style={{ backgroundColor: '#FAF6EF' }}>
                <div className="max-w-[900px] mx-auto space-y-6">
                    <div className="bg-white border border-[#1A1A1A]/10 p-6">
                        <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">
                            {language === 'en' ? 'Notifications' : '通知设置'}
                        </h2>
                        <div className="space-y-4">
                            {preferenceRows.map((item) => (
                                <div key={item.key} className="flex items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-[#1A1A1A] font-medium">{item.title}</h3>
                                        <p className="text-sm text-[#1A1A1A]/50">{item.description}</p>
                                    </div>
                                    <button
                                        onClick={() => togglePreference(item.key)}
                                        className={`w-12 h-6 flex items-center rounded-full transition-colors ${preferences[item.key]
                                                ? 'bg-[#0B3D2E]'
                                                : 'bg-[#1A1A1A]/10'
                                            }`}
                                        aria-pressed={preferences[item.key]}
                                    >
                                        <span
                                            className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${preferences[item.key] ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <WearableConnect />

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
