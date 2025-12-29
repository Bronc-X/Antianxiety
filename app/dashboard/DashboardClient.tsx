'use client';

/**
 * Dashboard Client Component
 * 
 * Client-side wrapper that:
 * - Calls useDashboard hook
 * - Routes to Desktop or Mobile component based on isMobile prop
 * 
 * Requirements: 4.2, 4.3
 */

import { useDashboard } from '@/hooks/domain/useDashboard';
import { DesktopDashboard } from '@/components/desktop/Dashboard';
import { MobileDashboard } from '@/components/mobile/Dashboard';
import type { DeviceRoutingProps } from '@/types/architecture';

export function DashboardClient({ isMobile }: DeviceRoutingProps) {
  const dashboard = useDashboard();
  
  return isMobile 
    ? <MobileDashboard dashboard={dashboard} />
    : <DesktopDashboard dashboard={dashboard} />;
}

export default DashboardClient;
