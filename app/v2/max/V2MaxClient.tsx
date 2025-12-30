'use client';

import { useMax } from '@/hooks/domain/useMax';
import { DesktopMaxChat } from '@/components/desktop';
import { MobileMaxChat } from '@/components/mobile';

interface V2MaxClientProps {
    isMobile: boolean;
}

export function V2MaxClient({ isMobile }: V2MaxClientProps) {
    const max = useMax();

    if (isMobile) {
        return <MobileMaxChat max={max} />;
    }

    return <DesktopMaxChat max={max} />;
}
