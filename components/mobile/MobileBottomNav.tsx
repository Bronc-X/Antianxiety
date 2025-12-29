'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Home, Sparkles, Compass, Settings } from 'lucide-react';
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
        id: 'max',
        labelEn: 'Max',
        labelZh: 'Max',
        icon: <Sparkles className="w-6 h-6" />,
        href: '/mobile/max',
    },
    {
        id: 'discover',
        labelEn: 'Discover',
        labelZh: '发现',
        icon: <Compass className="w-6 h-6" />,
        href: '/mobile/discover',
    },
    {
        id: 'settings',
        labelEn: 'Settings',
        labelZh: '设置',
        icon: <Settings className="w-6 h-6" />,
        href: '/mobile/settings',
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
            <div className="h-28" />

            {/* Bottom Navigation - Glass Effect */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-[9999]"
                style={{
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                }}
            >
                {/* Glass Background */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'rgba(255, 255, 255, 0.85)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderTop: '1px solid rgba(255, 255, 255, 0.5)',
                    }}
                />

                {/* Nav Container */}
                <div className="relative flex justify-around items-center px-4 py-3">
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
                                className="relative flex-1 flex flex-col items-center justify-center"
                            >
                                {/* Floating Icon Container */}
                                <motion.div
                                    animate={{
                                        y: active ? -8 : 0,
                                        scale: active ? 1.15 : 1,
                                    }}
                                    whileTap={{ scale: 0.9 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                    className={`relative p-3 rounded-2xl transition-all duration-300 ${active
                                            ? isMax
                                                ? 'bg-gradient-to-br from-[#D4AF37] to-[#B8860B] shadow-lg shadow-[#D4AF37]/30'
                                                : 'bg-gradient-to-br from-[#0B3D2E] to-[#1a5c47] shadow-lg shadow-[#0B3D2E]/30'
                                            : ''
                                        }`}
                                >
                                    <div className={`${active
                                            ? 'text-white'
                                            : isMax
                                                ? 'text-[#D4AF37]'
                                                : 'text-gray-400'
                                        }`}>
                                        {item.icon}
                                    </div>

                                    {/* Active Glow Ring */}
                                    {active && (
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1.3, opacity: 0 }}
                                            transition={{ duration: 0.6, repeat: Infinity }}
                                            className={`absolute inset-0 rounded-2xl ${isMax ? 'bg-[#D4AF37]' : 'bg-[#0B3D2E]'
                                                }`}
                                        />
                                    )}
                                </motion.div>

                                {/* Label */}
                                <motion.span
                                    animate={{
                                        opacity: active ? 1 : 0.6,
                                        y: active ? 4 : 0,
                                    }}
                                    className={`text-[11px] font-semibold mt-1 ${active
                                            ? isMax ? 'text-[#D4AF37]' : 'text-[#0B3D2E]'
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
