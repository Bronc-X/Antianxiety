'use client';

import { UnlearnNav } from '@/components/unlearn';
import { useI18n } from '@/lib/i18n';

export default function UnlearnAppLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    const { language } = useI18n();
    return (
        <div className="min-h-screen" style={{ backgroundColor: '#FAF6EF' }}>
            {/* App Navigation */}
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

            {children}
        </div>
    );
}
