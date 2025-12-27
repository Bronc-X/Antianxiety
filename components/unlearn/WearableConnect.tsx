'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Watch, Smartphone, Activity, CheckCircle, Loader2, ExternalLink } from 'lucide-react';

interface WearableProvider {
    id: string;
    name: string;
    icon: React.ReactNode;
    description: string;
    connected: boolean;
    lastSync?: string;
}

export default function WearableConnect() {
    const { language } = useI18n();
    const [providers, setProviders] = useState<WearableProvider[]>([
        {
            id: 'oura',
            name: 'Oura Ring',
            icon: <Watch className="w-6 h-6" />,
            description: language === 'en' ? 'Sleep, HRV, readiness, activity' : '睡眠、HRV、准备度、活动',
            connected: false,
        },
        {
            id: 'fitbit',
            name: 'Fitbit',
            icon: <Activity className="w-6 h-6" />,
            description: language === 'en' ? 'Steps, heart rate, sleep stages' : '步数、心率、睡眠阶段',
            connected: false,
        },
        {
            id: 'health_connect',
            name: 'Health Connect',
            icon: <Smartphone className="w-6 h-6" />,
            description: language === 'en' ? 'Android health data aggregation' : 'Android 健康数据聚合',
            connected: false,
        },
    ]);
    const [connecting, setConnecting] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
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
        try {
            const res = await fetch('/api/wearables/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: providerId }),
            });
            const data = await res.json();

            if (data.authUrl) {
                window.open(data.authUrl, '_blank', 'width=600,height=700');
            }
        } catch (error) {
            console.error('Failed to connect:', error);
        } finally {
            setConnecting(null);
        }
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

    return (
        <section className="py-16 px-6" style={{ backgroundColor: '#FAF6EF' }}>
            <div className="max-w-[900px] mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <p className="text-sm uppercase tracking-widest font-medium mb-4 text-[#D4AF37]">
                        {language === 'en' ? 'Connect Your Devices' : '连接你的设备'}
                    </p>
                    <h2
                        className="text-[#1A1A1A] font-bold leading-[1.1] tracking-[-0.02em] mb-4"
                        style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}
                    >
                        {language === 'en' ? 'Sync your wearables for personalized insights' : '同步你的穿戴设备获取个性化洞察'}
                    </h2>
                    <p className="text-[#1A1A1A]/60 max-w-xl mx-auto">
                        {language === 'en'
                            ? 'Connect your devices to enable real-time HRV tracking and personalized recommendations'
                            : '连接你的设备以启用实时 HRV 追踪和个性化建议'}
                    </p>
                </div>

                {/* Provider Cards */}
                <div className="grid gap-4 mb-8">
                    {providers.map((provider, i) => (
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
                                    <h3 className="font-semibold text-[#1A1A1A]">{provider.name}</h3>
                                    <p className="text-sm text-[#1A1A1A]/50">{provider.description}</p>
                                    {provider.lastSync && (
                                        <p className="text-xs text-[#1A1A1A]/40 mt-1">
                                            {language === 'en' ? 'Last sync: ' : '上次同步: '}{provider.lastSync}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {provider.connected ? (
                                <div className="flex items-center gap-2 text-[#0B3D2E]">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="text-sm font-medium">{language === 'en' ? 'Connected' : '已连接'}</span>
                                </div>
                            ) : (
                                <button
                                    onClick={() => connectProvider(provider.id)}
                                    disabled={connecting === provider.id}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#0B3D2E] text-white hover:bg-[#0B3D2E]/90 transition-colors disabled:opacity-50"
                                >
                                    {connecting === provider.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <ExternalLink className="w-4 h-4" />
                                    )}
                                    <span className="text-sm">{language === 'en' ? 'Connect' : '连接'}</span>
                                </button>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Sync Button */}
                {connectedCount > 0 && (
                    <div className="text-center">
                        <button
                            onClick={syncData}
                            disabled={syncing}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-[#0B3D2E] font-medium hover:bg-[#E5C158] transition-colors disabled:opacity-50"
                        >
                            {syncing ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Activity className="w-5 h-5" />
                            )}
                            <span>{language === 'en' ? 'Sync All Devices' : '同步所有设备'}</span>
                        </button>
                        <p className="text-sm text-[#1A1A1A]/40 mt-2">
                            {connectedCount} {language === 'en' ? 'device(s) connected' : '个设备已连接'}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
