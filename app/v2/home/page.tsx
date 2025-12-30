/**
 * V2 Home Page - Dashboard
 * 
 * 路由分流层：使用 MVVM 架构
 * - Brain: app/actions/dashboard.ts
 * - Bridge: hooks/domain/useDashboard.ts
 * - Skin: components/mobile/Dashboard.tsx
 */

import { headers } from 'next/headers';
import { MobileDashboard } from '@/components/mobile';
import { DesktopDashboard } from '@/components/desktop';

export const dynamic = 'force-dynamic';

// Server-side device detection
function isMobileDevice(userAgent: string): boolean {
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent.toLowerCase()
    );
}

export default async function V2HomePage() {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const capacitorPlatform = headersList.get('x-capacitor-platform');

    // Capacitor detection is authoritative
    const isMobile = capacitorPlatform || isMobileDevice(userAgent);

    if (isMobile) {
        return <MobileDashboard />;
    }

    return <DesktopDashboard />;
}
