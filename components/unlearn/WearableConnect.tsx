'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Activity, CheckCircle, Loader2 } from 'lucide-react';
import { syncHealthKitData, syncHealthConnectData } from '@/lib/services/wearables/client-sync';

// Apple Logo SVG
function AppleLogo({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
    );
}

// Android Logo SVG
function AndroidLogo({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-1.4-.59-2.96-.92-4.47-.92s-3.07.33-4.47.92L5.65 5.67c-.19-.29-.58-.38-.87-.2-.28.18-.37.54-.22.83L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52zM7 15.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zm10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"/>
        </svg>
    );
}

interface WearableProvider {
    id: string;
    name: string;
    icon: React.ReactNode;
    description: string;
    connected: boolean;
    lastSync?: string;
    platform: 'ios' | 'android' | 'all';
}

interface ProviderConnectionState {
    connected: boolean;
    lastSync?: string;
}

export default function WearableConnect() {
    const { language } = useI18n();
    const [platform, setPlatform] = useState<'ios' | 'android' | 'unknown'>('unknown');
    const [connections, setConnections] = useState<Record<string, ProviderConnectionState>>({});
    const [syncingProvider, setSyncingProvider] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showModal, setShowModal] = useState<string | null>(null);

    useEffect(() => {
        setErrorMessage(null);
    }, [language]);

    const checkConnections = useCallback(async () => {
        try {
            const res = await fetch('/api/wearables/sync', { method: 'GET' });
            const data = await res.json();

            if (data.connections) {
                setConnections(data.connections);
            }
        } catch (error) {
            console.error('Failed to check connections:', error);
        }
    }, []);

    useEffect(() => {
        // Detect platform
        const userAgent = navigator.userAgent.toLowerCase();
        if (/iphone|ipad|ipod/.test(userAgent)) {
            setPlatform('ios');
        } else if (/android/.test(userAgent)) {
            setPlatform('android');
        }
        checkConnections();
    }, [checkConnections]);

    useEffect(() => {
        const interval = setInterval(() => {
            checkConnections();
        }, 60000);

        const handleFocus = () => checkConnections();
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, [checkConnections]);

    const providers = useMemo<WearableProvider[]>(() => ([
        {
            id: 'healthkit',
            name: 'HealthKit',
            icon: <AppleLogo className="w-6 h-6" />,
            description: language === 'en' ? 'HRV, sleep, steps, heart rate' : '心率变异性、睡眠、步数、心率',
            connected: connections.healthkit?.connected || false,
            lastSync: connections.healthkit?.lastSync,
            platform: 'ios',
        },
        {
            id: 'health_connect',
            name: 'Health Connect',
            icon: <AndroidLogo className="w-6 h-6" />,
            description: language === 'en' ? 'Android health data aggregation' : 'Android 健康数据聚合',
            connected: connections.health_connect?.connected || false,
            lastSync: connections.health_connect?.lastSync,
            platform: 'android',
        },
    ]), [connections, language]);

    const connectProvider = async (providerId: string) => {
        setErrorMessage(null);

        if (providerId === 'healthkit' && platform !== 'ios') {
            setShowModal(providerId);
            return;
        }

        if (providerId === 'health_connect' && platform !== 'android') {
            setShowModal(providerId);
            return;
        }

        setSyncingProvider(providerId);
        try {
            const result = providerId === 'healthkit'
                ? await syncHealthKitData()
                : await syncHealthConnectData();

            if (!result.success) {
                if (result.error === 'permission') {
                    setErrorMessage(language === 'en'
                        ? 'Permission denied. Please enable access in your Health app.'
                        : '权限被拒绝，请在系统健康应用中开启访问权限。');
                } else if (result.error === 'unavailable') {
                    setErrorMessage(language === 'en'
                        ? 'Health data is not available on this device.'
                        : '当前设备暂不可用健康数据同步。');
                } else if (result.error === 'no_data') {
                    setErrorMessage(language === 'en'
                        ? 'No recent health data found to sync.'
                        : '未发现可同步的近期健康数据。');
                } else {
                    setErrorMessage(language === 'en'
                        ? 'Sync failed. Please try again.'
                        : '同步失败，请稍后重试。');
                }
                return;
            }

            await checkConnections();
        } finally {
            setSyncingProvider(null);
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
                        {language === 'en' ? 'Sync your OS-hub data' : '同步你的 OS Hub 数据'}
                    </h2>
                    <p className="text-[#1A1A1A]/60 max-w-xl mx-auto font-serif">
                        {language === 'en'
                            ? 'Connect HealthKit or Health Connect for real-time HRV tracking and personalized recommendations. Zero cost, no third-party accounts needed.'
                            : '连接 HealthKit 或 Health Connect 以获取实时 HRV 追踪和个性化建议。零成本，无需第三方账户。'}
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
                                    disabled={syncingProvider === provider.id}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#0B3D2E] text-white hover:bg-[#0B3D2E]/90 transition-colors font-serif disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {syncingProvider === provider.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Activity className="w-4 h-4" />
                                    )}
                                    <span className="text-sm">
                                        {syncingProvider === provider.id
                                            ? (language === 'en' ? 'Connecting...' : '连接中...')
                                            : (language === 'en' ? 'Connect' : '连接')}
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

                {connectedCount > 0 && (
                    <p className="text-center text-sm text-[#1A1A1A]/40 font-serif">
                        {language === 'en'
                            ? 'Health data syncs automatically from your mobile app.'
                            : '健康数据将从移动端自动同步。'}
                    </p>
                )}

                {errorMessage && (
                    <p className="text-center text-sm text-red-500 mt-6 font-serif">
                        {errorMessage}
                    </p>
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
                                {showModal === 'healthkit'
                                    ? (language === 'en' ? 'HealthKit Integration' : 'HealthKit 集成')
                                    : (language === 'en' ? 'Health Connect Integration' : 'Health Connect 集成')}
                            </h3>
                            <p className="text-[#1A1A1A]/60 mb-4 font-serif">
                                {showModal === 'healthkit'
                                    ? (language === 'en'
                                        ? 'HealthKit sync requires the iOS app. Install the mobile app to sync your HealthKit data.'
                                        : 'HealthKit 同步需要 iOS 应用。安装移动端应用以同步你的 HealthKit 数据。')
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
