/**
 * V2 Feed Page - 期刊推荐
 * 
 * 路由分流层：使用 MVVM 架构
 * - Brain: app/actions/feed.ts
 * - Bridge: hooks/domain/useFeed.ts
 * - Skin: components/mobile/Feed.tsx | components/desktop/Feed.tsx
 */

import { headers } from 'next/headers';
import { MobileFeed } from '@/components/mobile';
import { DesktopFeed } from '@/components/desktop';

export const dynamic = 'force-dynamic';

function isMobileDevice(userAgent: string): boolean {
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent.toLowerCase()
    );
}

export default async function V2FeedPage() {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const capacitorPlatform = headersList.get('x-capacitor-platform');

    const isMobile = capacitorPlatform || isMobileDevice(userAgent);

    if (isMobile) {
        return <MobileFeed />;
    }

    return <DesktopFeed />;
}
