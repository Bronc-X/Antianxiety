'use client';

/**
 * V2 Dashboard Client Component
 * 
 * Client wrapper that connects Domain Hook (Bridge) to Presentational Component (Skin)
 * Per Kiro MVVM architecture: Page → Hook → Component
 */

import { useDashboard } from '@/hooks/domain/useDashboard';
import { DesktopDashboard } from '@/components/desktop';
import { MobileDashboard } from '@/components/mobile';

interface V2DashboardClientProps {
    isMobile: boolean;
}

export function V2DashboardClient({ isMobile }: V2DashboardClientProps) {
    const dashboard = useDashboard();

    if (isMobile) {
        return <MobileDashboard dashboard={dashboard} />;
    }

    return <DesktopDashboard dashboard={dashboard} />;
}
