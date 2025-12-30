/**
 * V2 Settings Page
 * 
 * 路由分流层：使用 MVVM 架构
 * - Brain: app/actions/settings.ts
 * - Bridge: hooks/domain/useSettings.ts
 * - Skin: components/mobile/Settings.tsx | components/desktop/Settings.tsx
 */

import { headers } from 'next/headers';
import { MobileSettings } from '@/components/mobile';
import { DesktopSettings } from '@/components/desktop';

export const dynamic = 'force-dynamic';

function isMobileDevice(userAgent: string): boolean {
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent.toLowerCase()
    );
}

export default async function V2SettingsPage() {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const capacitorPlatform = headersList.get('x-capacitor-platform');

    const isMobile = capacitorPlatform || isMobileDevice(userAgent);

    if (isMobile) {
        return <MobileSettings />;
    }

    return <DesktopSettings />;
}
