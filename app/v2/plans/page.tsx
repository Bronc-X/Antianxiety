/**
 * V2 Plans Page
 * 
 * 路由分流层：使用 MVVM 架构
 * - Brain: app/actions/plans.ts
 * - Bridge: hooks/domain/usePlans.ts
 * - Skin: components/mobile/Plans.tsx | components/desktop/Plans.tsx
 */

import { headers } from 'next/headers';
import { MobilePlans } from '@/components/mobile';
import { DesktopPlans } from '@/components/desktop';

export const dynamic = 'force-dynamic';

function isMobileDevice(userAgent: string): boolean {
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent.toLowerCase()
    );
}

export default async function V2PlansPage() {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const capacitorPlatform = headersList.get('x-capacitor-platform');

    const isMobile = capacitorPlatform || isMobileDevice(userAgent);

    if (isMobile) {
        return <MobilePlans />;
    }

    return <DesktopPlans />;
}
