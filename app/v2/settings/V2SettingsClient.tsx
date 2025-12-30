'use client';

import { useSettings } from '@/hooks/domain/useSettings';
import { DesktopSettings } from '@/components/desktop';
import { MobileSettings } from '@/components/mobile';

interface V2SettingsClientProps {
    isMobile: boolean;
}

export function V2SettingsClient({ isMobile }: V2SettingsClientProps) {
    const settings = useSettings();

    if (isMobile) {
        return <MobileSettings settings={settings} />;
    }

    return <DesktopSettings settings={settings} />;
}
