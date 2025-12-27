'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Smartphone, Activity, CheckCircle, Loader2, Heart, Apple } from 'lucide-react';

interface WearableProvider {
    id: string;
    name: string;
    icon: React.ReactNode;
    description: string;
    connected: boolean;
    lastSync?: string;
    platform: 'ios' | 'android' | 'all';
}

export default function WearableConnect() {
    const { language } = useI18n();
    const [platform, setPlatform] = useState<'ios' | 'android' | 'unknown'>('unknown');
    const [providers, setProviders] = useState<WearableProvider[]>([
        {
            id: 'apple_health',
            name: 'Apple Health',
            icon: <Heart className="w-6 h-6" />,
            description: language === 'en' ? 'HRV, sleep, steps, heart rate' : '心率变异性、睡眠、步数、心率',
            connected: false,
            platform: 'ios',
        },
        {
            id: 'health_connect',
            name: 'Health Connect',
            icon: <Smartphone className="w-6 h-6" />,
            description: language === 'en' ? 'Android health data aggregation' : 'Android 健康数据聚合',
            connected: false,
            platform: 'android',
        },
    ]);
    const [connecting, setConnecting] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [showModal, setShowModal] = useState<string | null>(null);

    useEffect(() => {
        // Detect platform
        const userAgent = navigator.userAgent.toLowerCase();
        if (/iphone|ipad|ipod/.test(userAgent)) {
            setPlatform('ios');
        } else if (/android/.test(userAgent)) {
            setPlatform('android');
        }
        checkConnections();
    }, []);

    const checkConnections = async () => {
        try {
            const res = await fetch('/api/wearables/sync', { method: 'GET' });
            const data = await res.json();

            if (data.connections) {
                setProviders(prev => prev.map(p => ({
                    ...p,
                    connected: data.connections[p.id]?.connected || false,
                    lastSync: data.connections[p.id]?.lastSync,
                })));
            }
        } catch (error) {
            console.error('Failed to check connections:', error);
        }
    };

    const connectProvider = async (providerId: string) => {
        setConnecting(providerId);

        if (providerId === 'apple_health') {
            // HealthKit requires native iOS integration
            setShowModal('apple_health');
            setConnecting(null);
            return;
        }

        if (providerId === 'health_connect') {
            // Health Connect requires native Android integration
            setShowModal('health_connect');
            setConnecting(null);
            return;
        }

        setConnecting(null);
    };

    const syncData = async () => {
        setSyncing(true);
        try {
            await fetch('/api/wearables/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ daysBack: 7 }),
            });
            await checkConnections();
        } catch (error) {
            console.error('Failed to sync:', error);
        } finally {
            setSyncing(false);
        }
    };

    const connectedCount = providers.filter(p => p.connected).length;

    // Filter providers based on platform (show both if unknown)
    const visibleProviders = platform === 'unknown'
        ? providers
        : providers.filter(p => p.platform === platform || p.platform === 'all');

    return (
        <section className="py-16 px-6" style={{ backgroundColor: '#FAF6EF' }}>
            <div className="max-w-[900px] mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <p className="text-sm uppercase tracking-widest font-medium mb-4 text-[#D4AF37] font-serif">
                        {language === 'en' ? 'Connect Your Device' : '连接你的设备'}
                    </p>
                    <h2
                        className="text-[#1A1A1A] font-bold leading-[1.1] tracking-[-0.02em] mb-4 font-serif"
                        style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}
                    >
                        {language === 'en' ? 'Sync your health data' : '同步你的健康数据'}
                    </h2>
                    <p className="text-[#1A1A1A]/60 max-w-xl mx-auto font-serif">
                        {language === 'en'
                            ? 'Connect to Apple Health or Health Connect for real-time HRV tracking and personalized recommendations. Zero cost, no third-party accounts needed.'
                            : '连接 Apple Health 或 Health Connect 以获取实时 HRV 追踪和个性化建议。零成本，无需第三方账户。'}
                    </p>
                </div>

                {/* Provider Cards */}
                <div className="grid gap-4 mb-8">
                    {visibleProviders.map((provider, i) => (
                        <motion.div
                            key={provider.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center justify-between p-6 bg-white border border-[#1A1A1A]/10"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 flex items-center justify-center ${provider.connected ? 'bg-[#0B3D2E] text-white' : 'bg-[#1A1A1A]/5 text-[#1A1A1A]/40'
                                    }`}>
                                    {provider.icon}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[#1A1A1A] font-serif">{provider.name}</h3>
                                    <p className="text-sm text-[#1A1A1A]/50 font-serif">{provider.description}</p>
                                    {provider.lastSync && (
                                        <p className="text-xs text-[#1A1A1A]/40 mt-1 font-serif">
                                            {language === 'en' ? 'Last sync: ' : '上次同步: '}{provider.lastSync}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {provider.connected ? (
                                <div className="flex items-center gap-2 text-[#0B3D2E]">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="text-sm font-medium font-serif">{language === 'en' ? 'Connected' : '已连接'}</span>
                                </div>
                            ) : (
                                <button
                                    onClick={() => connectProvider(provider.id)}
                                    disabled={connecting === provider.id}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#0B3D2E] text-white hover:bg-[#0B3D2E]/90 transition-colors disabled:opacity-50 font-serif"
                                >
                                    {connecting === provider.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Activity className="w-4 h-4" />
                                    )}
                                    <span className="text-sm">
                                        {language === 'en' ? 'Connect' : '连接'}
                                    </span>
                                </button>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Platform hint */}
                {platform === 'unknown' && (
                    <p className="text-center text-sm text-[#1A1A1A]/40 mb-6 font-serif">
                        {language === 'en'
                            ? 'Open this page on your mobile device to connect.'
                            : '在移动设备上打开此页面以连接。'}
                    </p>
                )}

                {/* Sync Button */}
                {connectedCount > 0 && (
                    <div className="text-center">
                        <button
                            onClick={syncData}
                            disabled={syncing}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-[#0B3D2E] font-medium hover:bg-[#E5C158] transition-colors disabled:opacity-50 font-serif"
                        >
                            {syncing ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Activity className="w-5 h-5" />
                            )}
                            <span>{language === 'en' ? 'Sync Now' : '立即同步'}</span>
                        </button>
                        <p className="text-sm text-[#1A1A1A]/40 mt-2 font-serif">
                            {connectedCount} {language === 'en' ? 'device(s) connected' : '个设备已连接'}
                        </p>
                    </div>
                )}
            </div>

            {/* Info Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
                        onClick={() => setShowModal(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="w-full max-w-lg bg-[#FAF6EF] border border-[#1A1A1A]/10 p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2 font-serif">
                                {showModal === 'apple_health'
                                    ? (language === 'en' ? 'Apple Health Integration' : 'Apple Health 集成')
                                    : (language === 'en' ? 'Health Connect Integration' : 'Health Connect 集成')}
                            </h3>
                            <p className="text-[#1A1A1A]/60 mb-4 font-serif">
                                {showModal === 'apple_health'
                                    ? (language === 'en'
                                        ? 'Apple Health integration requires the iOS app. Download our app from the App Store to sync your HealthKit data.'
                                        : 'Apple Health 集成需要 iOS 应用。从 App Store 下载我们的应用以同步你的 HealthKit 数据。')
                                    : (language === 'en'
                                        ? 'Health Connect integration requires the Android app. Download our app from Google Play to sync your health data.'
                                        : 'Health Connect 集成需要 Android 应用。从 Google Play 下载我们的应用以同步你的健康数据。')}
                            </p>
                            <div className="flex items-center gap-3 p-4 bg-[#0B3D2E]/5 mb-6">
                                <Activity className="w-8 h-8 text-[#0B3D2E]" />
                                <div>
                                    <p className="text-sm font-medium text-[#1A1A1A] font-serif">
                                        {language === 'en' ? 'Free & No Account Needed' : '免费且无需账户'}
                                    </p>
                                    <p className="text-xs text-[#1A1A1A]/50 font-serif">
                                        {language === 'en' ? 'Data stays on your device' : '数据保留在你的设备上'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowModal(null)}
                                    className="px-4 py-2 border border-[#1A1A1A]/10 text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors font-serif"
                                >
                                    {language === 'en' ? 'Close' : '关闭'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
