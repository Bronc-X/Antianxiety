'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Calendar, Sparkles, BookOpen, Target } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface NavItem {
    id: string;
    labelEn: string;
    labelZh: string;
    icon: React.ReactNode;
    href: string;
}

const navItems: NavItem[] = [
    {
        id: 'home',
        labelEn: 'Home',
        labelZh: '首页',
        icon: <Home className="w-6 h-6" />,
        href: '/mobile',
    },
    {
        id: 'calibration',
        labelEn: 'Calibrate',
        labelZh: '校准',
        icon: <Calendar className="w-6 h-6" />,
        href: '/mobile/calibration',
    },
    {
        id: 'max',
        labelEn: 'Max',
        labelZh: 'Max',
        icon: <Sparkles className="w-6 h-6" />,
        href: '/mobile/max',
    },
    {
        id: 'feed',
        labelEn: 'Feed',
        labelZh: '资讯',
        icon: <BookOpen className="w-6 h-6" />,
        href: '/mobile/feed',
    },
    {
        id: 'plans',
        labelEn: 'Plans',
        labelZh: '计划',
        icon: <Target className="w-6 h-6" />,
        href: '/mobile/plans',
    },
];

async function triggerHaptic() {
    try {
        await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
        // Haptics not available (web)
    }
}

export default function MobileBottomNav() {
    const pathname = usePathname();
    const { language } = useI18n();

    const isActive = (item: NavItem) => {
        if (item.id === 'home') {
            return pathname === '/mobile' || pathname === '/mobile/';
        }
        return pathname?.startsWith(item.href);
    };

    return (
        <>
            {/* Spacer */}
            <div className="h-24" />

            {/* Bottom Navigation */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-[9999]"
                style={{
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                }}
            >
                {/* Top border */}
                <div className="absolute top-0 left-0 right-0 h-px bg-black/5" />

                {/* Nav Container */}
                <div className="flex justify-around items-center px-2 py-2">
                    {navItems.map((item) => {
                        const active = isActive(item);
                        const label = language === 'en' ? item.labelEn : item.labelZh;

                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                onClick={() => {
                                    if (!active) triggerHaptic();
                                }}
                                className="relative flex-1 flex flex-col items-center justify-center py-2"
                            >
                                {/* Active Indicator */}
                                {active && (
                                    <motion.div
                                        layoutId="mobileNavActive"
                                        className="absolute -top-1 w-8 h-1 rounded-full bg-[#0B3D2E]"
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    />
                                )}

                                {/* Icon */}
                                <motion.div
                                    animate={{
                                        scale: active ? 1.1 : 1,
                                        y: active ? -2 : 0,
                                    }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                    className={`transition-colors ${active
                                            ? item.id === 'max' ? 'text-[#D4AF37]' : 'text-[#0B3D2E]'
                                            : 'text-gray-400'
                                        }`}
                                >
                                    {item.icon}
                                </motion.div>

                                {/* Label */}
                                <motion.span
                                    animate={{ opacity: active ? 1 : 0.6 }}
                                    className={`text-[10px] font-medium mt-1 ${active
                                            ? item.id === 'max' ? 'text-[#D4AF37]' : 'text-[#0B3D2E]'
                                            : 'text-gray-400'
                                        }`}
                                >
                                    {label}
                                </motion.span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
