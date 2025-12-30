/**
 * V2 Home Page - Dashboard
 * 
 * 路由分流层：使用 MVVM 架构
 * - Brain: app/actions/dashboard.ts
 * - Bridge: hooks/domain/useDashboard.ts (called in V2DashboardClient)
 * - Skin: components/mobile/Dashboard.tsx | components/desktop/Dashboard.tsx
 */

import { headers } from 'next/headers';
import { V2DashboardClient } from './V2DashboardClient';

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
    const isMobile = !!(capacitorPlatform || isMobileDevice(userAgent));

    return <V2DashboardClient isMobile={isMobile} />;
}
