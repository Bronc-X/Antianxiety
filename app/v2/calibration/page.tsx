/**
 * V2 Calibration Page - 每日校准
 * 
 * 路由分流层：使用 MVVM 架构
 * - Brain: app/actions/calibration.ts
 * - Bridge: hooks/domain/useCalibration.ts
 * - Skin: components/mobile/Calibration.tsx | components/desktop/Calibration.tsx
 */

import { headers } from 'next/headers';
import { MobileCalibration } from '@/components/mobile';
import { DesktopCalibration } from '@/components/desktop';

export const dynamic = 'force-dynamic';

function isMobileDevice(userAgent: string): boolean {
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent.toLowerCase()
    );
}

export default async function V2CalibrationPage() {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const capacitorPlatform = headersList.get('x-capacitor-platform');

    const isMobile = capacitorPlatform || isMobileDevice(userAgent);

    if (isMobile) {
        return <MobileCalibration />;
    }

    return <DesktopCalibration />;
}
