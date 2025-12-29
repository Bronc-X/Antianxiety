'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import {
    User, Bell, Shield, Watch, LogOut, ChevronRight,
    Moon, Globe, Heart, HelpCircle
} from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface SettingsItem {
    id: string;
    labelEn: string;
    labelZh: string;
    icon: React.ReactNode;
    color: string;
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
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay }}
            whileTap={{ scale: 0.98 }}
            onClick={async () => {
                try {
                    await Haptics.impact({ style: ImpactStyle.Light });
                } catch { }
            }}
            className={`w-full flex items-center gap-4 p-4 ${!isLast ? '' : ''}`}
            style={{
                background: '#0A0A0A',
                borderBottom: !isLast ? '1px solid #1A1A1A' : 'none',
            }}
        >
            <div
                className="w-8 h-8 flex items-center justify-center"
                style={{
                    background: `${item.color}15`,
                    border: `1px solid ${item.color}30`,
                }}
            >
                <div style={{ color: item.color }}>{item.icon}</div>
            </div>
            <span
                className="flex-1 text-left text-sm font-mono uppercase tracking-wide"
                style={{ color: '#CCCCCC' }}
            >
                {language === 'en' ? item.labelEn : item.labelZh}
            </span>
            {item.rightContent || (
                <ChevronRight className="w-4 h-4" style={{ color: '#333333' }} />
            )}
        </motion.button>
    );
}

export default function DarkSettings() {
    const { language, setLanguage } = useI18n();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const settingsSections: SettingsSection[] = [
        {
            titleEn: 'ACCOUNT',
            titleZh: '账户',
            items: [
                {
                    id: 'profile',
                    labelEn: 'Profile',
                    labelZh: '个人资料',
                    icon: <User className="w-4 h-4" />,
                    color: '#00FF94',
                },
                {
                    id: 'notifications',
                    labelEn: 'Notifications',
                    labelZh: '通知',
                    icon: <Bell className="w-4 h-4" />,
                    color: '#FFCC00',
                    rightContent: (
                        <div
                            className="w-10 h-5 p-0.5 transition-colors cursor-pointer"
                            style={{
                                background: notificationsEnabled ? '#00FF94' : '#222222',
                                border: `1px solid ${notificationsEnabled ? '#00FF94' : '#333333'}`,
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setNotificationsEnabled(!notificationsEnabled);
                            }}
                        >
                            <motion.div
                                animate={{ x: notificationsEnabled ? 18 : 0 }}
                                className="w-4 h-4"
                                style={{ background: notificationsEnabled ? '#000000' : '#666666' }}
                            />
                        </div>
                    ),
                },
                {
                    id: 'privacy',
                    labelEn: 'Privacy',
                    labelZh: '隐私',
                    icon: <Shield className="w-4 h-4" />,
                    color: '#007AFF',
                },
            ],
        },
        {
            titleEn: 'DATA',
            titleZh: '数据',
            items: [
                {
                    id: 'wearables',
                    labelEn: 'Wearables',
                    labelZh: '可穿戴设备',
                    icon: <Watch className="w-4 h-4" />,
                    color: '#8B5CF6',
                },
                {
                    id: 'health',
                    labelEn: 'Health Data',
                    labelZh: '健康数据',
                    icon: <Heart className="w-4 h-4" />,
                    color: '#FF3B30',
                },
            ],
        },
        {
            titleEn: 'SYSTEM',
            titleZh: '系统',
            items: [
                {
                    id: 'language',
                    labelEn: 'Language',
                    labelZh: '语言',
                    icon: <Globe className="w-4 h-4" />,
                    color: '#06B6D4',
                    rightContent: (
                        <span
                            className="text-[10px] font-mono"
                            style={{ color: '#555555' }}
                        >
                            {language === 'en' ? 'EN' : 'ZH'}
                        </span>
                    ),
                },
                {
                    id: 'theme',
                    labelEn: 'Theme',
                    labelZh: '主题',
                    icon: <Moon className="w-4 h-4" />,
                    color: '#6366F1',
                    rightContent: (
                        <span
                            className="text-[10px] font-mono"
                            style={{ color: '#555555' }}
                        >
                            DARK
                        </span>
                    ),
                },
                {
                    id: 'help',
                    labelEn: 'Help',
                    labelZh: '帮助',
                    icon: <HelpCircle className="w-4 h-4" />,
                    color: '#10B981',
                },
            ],
        },
    ];

    return (
        <div
            className="min-h-screen pb-8"
            style={{ background: '#000000' }}
        >
            {/* Header */}
            <div className="px-5 pt-4 pb-6">
                <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xl font-mono uppercase tracking-tight"
                    style={{ color: '#FFFFFF' }}
                >
                    {language === 'en' ? 'SYSTEM' : '系统'}
                </motion.h1>
            </div>

            {/* Settings Sections */}
            <div className="px-5 space-y-6">
                {settingsSections.map((section, sectionIndex) => (
                    <motion.div
                        key={section.titleEn}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: sectionIndex * 0.1 }}
                    >
                        <p
                            className="text-[9px] font-mono uppercase tracking-[0.15em] mb-2 px-1"
                            style={{ color: '#444444' }}
                        >
                            {language === 'en' ? section.titleEn : section.titleZh}
                        </p>
                        <div style={{ border: '1px solid #1A1A1A' }}>
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

                {/* Logout */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                        try {
                            await Haptics.impact({ style: ImpactStyle.Medium });
                        } catch { }
                    }}
                    className="w-full flex items-center justify-center gap-2 p-4"
                    style={{
                        background: 'transparent',
                        border: '1px solid #FF3B3050',
                    }}
                >
                    <LogOut className="w-4 h-4" style={{ color: '#FF3B30' }} />
                    <span
                        className="text-sm font-mono uppercase tracking-wider"
                        style={{ color: '#FF3B30' }}
                    >
                        {language === 'en' ? 'LOG OUT' : '退出登录'}
                    </span>
                </motion.button>

                {/* Version */}
                <p
                    className="text-center text-[10px] font-mono pt-4"
                    style={{ color: '#333333' }}
                >
                    ANTIANXIETY v1.0.0
                </p>
            </div>
        </div>
    );
}
