'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Brain, Target, Activity, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

/**
 * Digital Twin Entry Cards
 * Main navigation cards for the Personal Health Agent system
 * Shows on landing page to guide users to:
 * - Dashboard (unified health profile)
 * - Daily Calibration (daily check-in)
 * - Goals (phase plans)
 */
export default function DigitalTwinCards() {
    const { language } = useI18n();
    const isZh = language !== 'en';

    const cards = [
        {
            href: '/dashboard',
            icon: Brain,
            title: isZh ? '我的画像' : 'My Profile',
            subtitle: isZh ? '查看你的健康数据' : 'View your health data',
            gradient: 'from-emerald-500 to-teal-600',
            bgPattern: 'bg-emerald-50',
        },
        {
            href: '/daily-calibration',
            icon: Activity,
            title: isZh ? '每日校准' : 'Daily Check',
            subtitle: isZh ? '记录今日状态' : 'Log today\'s status',
            gradient: 'from-blue-500 to-indigo-600',
            bgPattern: 'bg-blue-50',
        },
        {
            href: '/goals',
            icon: Target,
            title: isZh ? '阶段计划' : 'Phase Goals',
            subtitle: isZh ? '设定健康目标' : 'Set health goals',
            gradient: 'from-amber-500 to-orange-600',
            bgPattern: 'bg-amber-50',
        },
    ];

    return (
        <section className="w-full px-4 py-6">
            <div className="max-w-4xl mx-auto">
                {/* Section Header */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B3D2E]/60">
                        {isZh ? '你的数字孪生' : 'Your Digital Twin'}
                    </h2>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-3 gap-3">
                    {cards.map((card, index) => {
                        const Icon = card.icon;
                        return (
                            <Link key={card.href} href={card.href}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`relative overflow-hidden rounded-2xl ${card.bgPattern} border border-[#E7E1D6]/50 p-4 cursor-pointer group h-full`}
                                >
                                    {/* Background Gradient */}
                                    <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-[40px] bg-gradient-to-br ${card.gradient} opacity-20 group-hover:opacity-30 transition-opacity`} />

                                    {/* Icon */}
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>

                                    {/* Text */}
                                    <h3 className="font-bold text-sm text-[#0B3D2E] mb-0.5">
                                        {card.title}
                                    </h3>
                                    <p className="text-xs text-[#0B3D2E]/50 line-clamp-1">
                                        {card.subtitle}
                                    </p>

                                    {/* Arrow */}
                                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronRight className="w-4 h-4 text-[#0B3D2E]/30" />
                                    </div>
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
