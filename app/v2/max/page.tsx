/**
 * V2 Max Page - AI Chat
 * 
 * 路由分流层：使用 MVVM 架构
 * - Brain: app/actions/chat.ts
 * - Bridge: hooks/domain/useMax.ts
 * - Skin: components/mobile/MaxChat.tsx | components/desktop/MaxChat.tsx
 */

import { headers } from 'next/headers';
import { MobileMaxChat } from '@/components/mobile';
import { DesktopMaxChat } from '@/components/desktop';

export const dynamic = 'force-dynamic';

function isMobileDevice(userAgent: string): boolean {
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent.toLowerCase()
    );
}

export default async function V2MaxPage() {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const capacitorPlatform = headersList.get('x-capacitor-platform');

    const isMobile = capacitorPlatform || isMobileDevice(userAgent);

    if (isMobile) {
        return <MobileMaxChat />;
    }

    return <DesktopMaxChat />;
}
