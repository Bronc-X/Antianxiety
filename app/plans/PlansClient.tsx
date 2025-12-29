'use client';

/**
 * Plans Client Component
 * 
 * Client-side wrapper that:
 * - Calls usePlans hook
 * - Routes to Desktop or Mobile component based on isMobile prop
 */

import { usePlans } from '@/hooks/domain/usePlans';
import { DesktopPlans } from '@/components/desktop/Plans';
import { MobilePlans } from '@/components/mobile/Plans';
import type { DeviceRoutingProps } from '@/types/architecture';

export function PlansClient({ isMobile }: DeviceRoutingProps) {
    const plans = usePlans();

    return isMobile
        ? <MobilePlans plans={plans} />
        : <DesktopPlans plans={plans} />;
}

export default PlansClient;
