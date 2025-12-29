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
        labelEn: 'INTEL',
        labelZh: '情报',
        icon: <Compass className="w-5 h-5" strokeWidth={1.5} />,
        href: '/mobile-dark/discover',
    },
    {
        id: 'settings',
        labelEn: 'SYSTEM',
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
        <nav
            className="fixed bottom-0 left-0 right-0 z-[9999] bg-black border-t border-[#222222]"
            style={{
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
        >
            <div className="flex items-stretch h-16">
                {navItems.map((item) => {
                    const active = isActive(item);
                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => {
                                if (!active) triggerHaptic();
                            }}
                            className="flex-1 flex flex-col items-center justify-center relative group"
                        >
                            {/* Active Indicator - Top Line */}
                            {active && (
                                <motion.div
                                    layoutId="navIndicator"
                                    className="absolute top-0 left-0 right-0 h-[2px] bg-[#00FF94]"
                                />
                            )}

                            {/* Icon */}
                            <div style={{ color: active ? '#FFFFFF' : '#444444' }}>
                                {item.icon}
                            </div>

                            {/* Label */}
                            <span
                                className="text-[9px] font-mono mt-1 tracking-widest uppercase"
                                style={{ color: active ? '#00FF94' : '#444444' }}
                            >
                                {language === 'en' ? item.labelEn : item.labelZh}
                            </span>

                            {/* Separator */}
                            <div className="absolute right-0 top-4 bottom-4 w-[1px] bg-[#111111] last:hidden" />
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
