'use client';

import { usePlans } from '@/hooks/domain/usePlans';
import { DesktopPlans } from '@/components/desktop';
import { MobilePlans } from '@/components/mobile';

interface V2PlansClientProps {
    isMobile: boolean;
}

export function V2PlansClient({ isMobile }: V2PlansClientProps) {
    const plans = usePlans();

    if (isMobile) {
        return <MobilePlans plans={plans} />;
    }

    return <DesktopPlans plans={plans} />;
}
