'use client';

/**
 * Goals Client Component
 */

import { useGoals } from '@/hooks/domain/useGoals';
import { DesktopGoals } from '@/components/desktop/Goals';
import { MobileGoals } from '@/components/mobile/Goals';
import type { DeviceRoutingProps } from '@/types/architecture';

export function GoalsClient({ isMobile }: DeviceRoutingProps) {
    const goals = useGoals();

    return isMobile
        ? <MobileGoals goals={goals} />
        : <DesktopGoals goals={goals} />;
}

export default GoalsClient;
