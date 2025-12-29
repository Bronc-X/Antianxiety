'use client';

import { useI18n } from '@/lib/i18n';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';

export default function MobileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { language } = useI18n();

    return (
        <div
            className="min-h-screen"
            style={{
                backgroundColor: '#F8F9FA',
                paddingTop: 'env(safe-area-inset-top, 0px)',
            }}
        >
            {/* Main Content */}
            <main className="pb-safe">
                {children}
            </main>

            {/* Bottom Navigation */}
            <MobileBottomNav />
        </div>
    );
}
