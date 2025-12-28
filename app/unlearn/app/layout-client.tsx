'use client';

import { UnlearnNav } from '@/components/unlearn';
import { useI18n } from '@/lib/i18n';
import AppBottomNav from '@/components/unlearn/AppBottomNav';

export default function UnlearnAppLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    const { language } = useI18n();
    return (
        <div className="min-h-screen pb-safe" style={{ backgroundColor: '#FAF6EF' }}>
            {/* App Navigation - Desktop only */}
            <div className="hidden md:block">
                <UnlearnNav
                    links={language === 'en'
                        ? [
                            { label: 'Dashboard', href: '/unlearn/app' },
                            { label: 'Plans', href: '/unlearn/app/plans' },
                            { label: 'Insights', href: '/unlearn/app/insights' },
                            { label: 'Settings', href: '/unlearn/app/settings' },
                        ]
                        : [
                            { label: '仪表盘', href: '/unlearn/app' },
                            { label: '计划', href: '/unlearn/app/plans' },
                            { label: '洞察', href: '/unlearn/app/insights' },
                            { label: '设置', href: '/unlearn/app/settings' },
                        ]}
                    isAppNav={true}
                />
            </div>

            {/* Mobile Header - Simple title */}
            <div className="md:hidden px-4 py-3 border-b border-[#1A1A1A]/5">
                <h1 className="text-lg font-semibold text-[#1A1A1A]">
                    {language === 'en' ? 'No More Anxious' : '不再焦虑'}
                </h1>
            </div>

            {children}

            {/* Mobile Bottom Navigation */}
            <AppBottomNav />
        </div>
    );
}
