'use client';

import DarkBottomNav from '@/components/mobile-dark/DarkBottomNav';

export default function DarkMobileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div
            className="min-h-screen"
            style={{
                backgroundColor: '#000000',
                paddingTop: 'env(safe-area-inset-top, 0px)',
            }}
        >
            {/* Main Content */}
            <main>
                {children}
            </main>

            {/* Bottom Navigation */}
            <DarkBottomNav />
        </div>
    );
}
