'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import {
    User, Bell, Shield, Watch, LogOut, ChevronRight,
    Moon, Globe, Heart, HelpCircle, FileText
} from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface SettingsItem {
    id: string;
    labelEn: string;
    labelZh: string;
    icon: React.ReactNode;
    color: string;
    action?: () => void;
    rightContent?: React.ReactNode;
}

interface SettingsSection {
    titleEn: string;
    titleZh: string;
    items: SettingsItem[];
}

function SettingsRow({
    item,
    delay,
    isLast
}: {
    item: SettingsItem;
    delay: number;
    isLast: boolean;
}) {
    const { language } = useI18n();

    return (
        <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay }}
            whileTap={{ scale: 0.98 }}
            onClick={async () => {
                try {
                    await Haptics.impact({ style: ImpactStyle.Light });
                } catch { }
                item.action?.();
            }}
            className={`w-full flex items-center gap-4 p-4 ${!isLast ? 'border-b border-gray-100' : ''}`}
        >
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${item.color}15` }}
            >
                <div style={{ color: item.color }}>{item.icon}</div>
            </div>
            <span className="flex-1 text-left font-medium text-gray-900">
                {language === 'en' ? item.labelEn : item.labelZh}
            </span>
            {item.rightContent || <ChevronRight className="w-5 h-5 text-gray-300" />}
        </motion.button>
    );
}

export default function MobileSettings() {
    const { language, setLanguage } = useI18n();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const settingsSections: SettingsSection[] = [
        {
            titleEn: 'Account',
            titleZh: '账户',
            items: [
                {
                    id: 'profile',
                    labelEn: 'Profile',
                    labelZh: '个人资料',
                    icon: <User className="w-5 h-5" />,
                    color: '#0B3D2E',
                },
                {
                    id: 'notifications',
                    labelEn: 'Notifications',
                    labelZh: '通知',
                    icon: <Bell className="w-5 h-5" />,
                    color: '#F59E0B',
                    rightContent: (
                        <div
                            className={`w-12 h-7 rounded-full p-1 transition-colors ${notificationsEnabled ? 'bg-[#0B3D2E]' : 'bg-gray-200'
                                }`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setNotificationsEnabled(!notificationsEnabled);
                            }}
                        >
                            <motion.div
                                animate={{ x: notificationsEnabled ? 20 : 0 }}
                                className="w-5 h-5 bg-white rounded-full shadow"
                            />
                        </div>
                    ),
                },
                {
                    id: 'privacy',
                    labelEn: 'Privacy & Security',
                    labelZh: '隐私与安全',
                    icon: <Shield className="w-5 h-5" />,
                    color: '#3B82F6',
                },
            ],
        },
        {
            titleEn: 'Health',
            titleZh: '健康',
            items: [
                {
                    id: 'wearables',
                    labelEn: 'Connected Devices',
                    labelZh: '已连接设备',
                    icon: <Watch className="w-5 h-5" />,
                    color: '#8B5CF6',
                },
                {
                    id: 'healthkit',
                    labelEn: 'Health Data',
                    labelZh: '健康数据',
                    icon: <Heart className="w-5 h-5" />,
                    color: '#EF4444',
                },
            ],
        },
        {
            titleEn: 'Preferences',
            titleZh: '偏好设置',
            items: [
                {
                    id: 'language',
                    labelEn: 'Language',
                    labelZh: '语言',
                    icon: <Globe className="w-5 h-5" />,
                    color: '#06B6D4',
                    rightContent: (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                                {language === 'en' ? 'English' : '中文'}
                            </span>
                            <ChevronRight className="w-5 h-5 text-gray-300" />
                        </div>
                    ),
                    action: () => setLanguage(language === 'en' ? 'zh' : 'en'),
                },
                {
                    id: 'appearance',
                    labelEn: 'Appearance',
                    labelZh: '外观',
                    icon: <Moon className="w-5 h-5" />,
                    color: '#6366F1',
                },
            ],
        },
        {
            titleEn: 'Support',
            titleZh: '支持',
            items: [
                {
                    id: 'help',
                    labelEn: 'Help Center',
                    labelZh: '帮助中心',
                    icon: <HelpCircle className="w-5 h-5" />,
                    color: '#10B981',
                },
                {
                    id: 'terms',
                    labelEn: 'Terms & Privacy',
                    labelZh: '条款与隐私',
                    icon: <FileText className="w-5 h-5" />,
                    color: '#64748B',
                },
            ],
        },
    ];

    return (
        <div
            className="min-h-screen pb-8"
            style={{
                background: 'linear-gradient(180deg, #F0F4F8 0%, #FFFFFF 100%)',
            }}
        >
            {/* Header */}
            <div className="px-5 pt-4 pb-6">
                <motion.h1
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-bold text-gray-900"
                >
                    {language === 'en' ? 'Settings' : '设置'}
                </motion.h1>
            </div>

            {/* Settings Sections */}
            <div className="px-5 space-y-6">
                {settingsSections.map((section, sectionIndex) => (
                    <motion.div
                        key={section.titleEn}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: sectionIndex * 0.1 }}
                    >
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                            {language === 'en' ? section.titleEn : section.titleZh}
                        </p>
                        <div
                            className="rounded-[24px] overflow-hidden"
                            style={{
                                background: 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.5)',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
                            }}
                        >
                            {section.items.map((item, itemIndex) => (
                                <SettingsRow
                                    key={item.id}
                                    item={item}
                                    delay={sectionIndex * 0.1 + itemIndex * 0.05}
                                    isLast={itemIndex === section.items.length - 1}
                                />
                            ))}
                        </div>
                    </motion.div>
                ))}

                {/* Logout Button */}
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                        try {
                            await Haptics.impact({ style: ImpactStyle.Medium });
                        } catch { }
                    }}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-[24px] bg-red-50 text-red-600 font-semibold"
                >
                    <LogOut className="w-5 h-5" />
                    {language === 'en' ? 'Log Out' : '退出登录'}
                </motion.button>

                {/* Version */}
                <p className="text-center text-xs text-gray-400 pt-4">
                    AntiAnxiety v1.0.0
                </p>
            </div>
        </div>
    );
}
