'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { LayoutGrid, Calendar, User, Zap } from 'lucide-react'; // Icons matching screenshot roughly
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    href: string;
}

const navItems: NavItem[] = [
    {
        id: 'home',
        label: 'Home',
        icon: <LayoutGrid className="w-5 h-5" />,
        href: '/mobile-dark',
    },
    {
        id: 'diary',
        label: 'Diary',
        icon: <Calendar className="w-5 h-5" />,
        href: '/mobile-dark/discover',
    },
    {
        id: 'profile',
        label: 'Profile',
        icon: <User className="w-5 h-5" />,
        href: '/mobile-dark/settings',
    },
];

export default function DarkBottomNav() {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === '/mobile-dark') {
            return pathname === '/mobile-dark' || pathname === '/mobile-dark/';
        }
        return pathname?.startsWith(href);
    };

    return (
        <div className="fixed bottom-6 left-0 right-0 z-[9999] px-12 flex justify-center">
            <nav
                className="flex items-center justify-between w-full max-w-[320px] px-2 py-2 rounded-full backdrop-blur-xl"
                style={{
                    background: 'rgba(20, 20, 20, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
                }}
            >
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => Haptics.impact({ style: ImpactStyle.Light })}
                            className="relative w-12 h-12 flex items-center justify-center rounded-full transition-all"
                        >
                            {active && (
                                <motion.div
                                    layoutId="navBlob"
                                    className="absolute inset-0 bg-black rounded-full"
                                    style={{ border: '1px solid rgba(255,255,255,0.2)' }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}

                            <div className="relative z-10" style={{ color: active ? '#FFFFFF' : '#666666' }}>
                                {item.icon}
                            </div>

                            {/* Label? Screenshot doesn't show text, just icons for main items usually. keeping simple. */}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
