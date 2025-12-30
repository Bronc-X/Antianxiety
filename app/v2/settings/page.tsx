'use client';

/**
 * V2 Settings Page
 * 
 * 用户设置管理
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase-client';
import { useSettings } from '@/hooks/domain/useSettings';

export default function V2SettingsPage() {
    const router = useRouter();
    const { settings, isLoading, update } = useSettings();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            const supabase = createClient();
            await supabase.auth.signOut();
            console.log('[V2 Settings] 退出登录');
            router.push('/v2/welcome');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    const menuItems = [
        { label: '个人资料', icon: '👤', href: '/v2/profile' },
        { label: '通知设置', icon: '🔔', action: () => { } },
        { label: '穿戴设备', icon: '⌚', action: () => { } },
        { label: '语言设置', icon: '🌐', action: () => { } },
        { label: '关于我们', icon: 'ℹ️', action: () => { } },
    ];

    return (
        <div className="min-h-screen p-6">
            {/* Header */}
            <header className="flex items-center gap-4 mb-8">
                <Link href="/v2/home" className="text-emerald-400 hover:text-emerald-300">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <h1 className="text-2xl font-bold text-white">设置</h1>
            </header>

            {/* Menu */}
            <div className="space-y-2 mb-8">
                {menuItems.map((item, index) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        {item.href ? (
                            <Link href={item.href}>
                                <div className="p-4 bg-slate-800/50 hover:bg-emerald-900/30 rounded-xl flex items-center gap-4 transition-colors">
                                    <span className="text-xl">{item.icon}</span>
                                    <span className="text-white flex-1">{item.label}</span>
                                    <svg className="w-5 h-5 text-emerald-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </Link>
                        ) : (
                            <button
                                onClick={item.action}
                                className="w-full p-4 bg-slate-800/50 hover:bg-emerald-900/30 rounded-xl flex items-center gap-4 transition-colors text-left"
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span className="text-white flex-1">{item.label}</span>
                                <svg className="w-5 h-5 text-emerald-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Logout */}
            <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full p-4 bg-red-900/30 hover:bg-red-900/50 border border-red-700/30 rounded-xl text-red-300 transition-colors disabled:opacity-50"
            >
                {isLoggingOut ? '退出中...' : '退出登录'}
            </button>

            {/* Version */}
            <p className="text-center text-emerald-400/30 text-sm mt-8">
                AntiAnxiety V2.0
            </p>
        </div>
    );
}
