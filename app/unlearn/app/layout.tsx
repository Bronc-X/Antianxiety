'use client';

import { UnlearnNav } from '@/components/unlearn';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen" style={{ backgroundColor: '#FAF6EF' }}>
            {/* App Navigation */}
            <UnlearnNav
                links={[
                    { label: 'Dashboard', href: '/unlearn/app' },
                    { label: 'Plans', href: '/unlearn/app/plans' },
                    { label: 'Insights', href: '/unlearn/app/insights' },
                    { label: 'Settings', href: '/unlearn/app/settings' },
                ]}
                ctaLabel="New Check-in"
                ctaHref="/unlearn/app/calibration"
            />

            {children}
        </div>
    );
}
