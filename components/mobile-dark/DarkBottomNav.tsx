'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Activity, Sparkles, Compass, Settings } from 'lucide-react';
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
        labelEn: 'STATUS',
        labelZh: '状态',
        icon: <Activity className="w-5 h-5" strokeWidth={1.5} />,
        href: '/mobile-dark',
    },
    {
        id: 'max',
        labelEn: 'MAX',
        labelZh: 'MAX',
        icon: <Sparkles className="w-5 h-5" strokeWidth={1.5} />,
        href: '/mobile-dark/max',
    },
    {
        id: 'discover',
        labelEn: 'FEED',
        labelZh: '资讯',
        icon: <Compass className="w-5 h-5" strokeWidth={1.5} />,
        href: '/mobile-dark/discover',
    },
    {
        id: 'settings',
        labelEn: 'SYS',
        labelZh: '系统',
        icon: <Settings className="w-5 h-5" strokeWidth={1.5} />,
        href: '/mobile-dark/settings',
    },
];

async function triggerHaptic() {
    try {
        await Haptics.impact({ style: ImpactStyle.Light });
    } catch { }
}

export default function DarkBottomNav() {
    const pathname = usePathname();
    const { language } = useI18n();

    const isActive = (item: NavItem) => {
        if (item.id === 'home') {
            return pathname === '/mobile-dark' || pathname === '/mobile-dark/';
        }
        return pathname?.startsWith(item.href);
    };

    return (
        <>
            {/* Spacer */}
            <div className="h-24" />

            {/* Bottom Navigation - Minimal Dark */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-[9999]"
                style={{
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                    background: '#000000',
                    borderTop: '1px solid #222222',
                }}
            >
                {/* Nav Container */}
                <div className="flex justify-around items-center px-2 py-3">
                    {navItems.map((item) => {
                        const active = isActive(item);
                        const label = language === 'en' ? item.labelEn : item.labelZh;
                        const isMax = item.id === 'max';

                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                onClick={() => {
                                    if (!active) triggerHaptic();
                                }}
                                className="relative flex-1 flex flex-col items-center justify-center py-1"
                            >
                                {/* Active Indicator - Neon line */}
                                {active && (
                                    <motion.div
                                        layoutId="darkNavActive"
                                        className="absolute -top-3 w-8 h-[2px]"
                                        style={{ background: isMax ? '#007AFF' : '#00FF94' }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    />
                                )}

                                {/* Icon */}
                                <motion.div
                                    animate={{ opacity: active ? 1 : 0.4 }}
                                    className="transition-colors"
                                    style={{ color: active ? (isMax ? '#007AFF' : '#00FF94') : '#666666' }}
                                >
                                    {item.icon}
                                </motion.div>

                                {/* Label - Mono font */}
                                <span
                                    className="text-[9px] font-mono tracking-wider mt-1.5"
                                    style={{
                                        color: active ? (isMax ? '#007AFF' : '#00FF94') : '#444444',
                                        letterSpacing: '0.1em',
                                    }}
                                >
                                    {label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
