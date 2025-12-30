'use client';

import { useCalibration } from '@/hooks/domain/useCalibration';
import { DesktopCalibration } from '@/components/desktop';
import { MobileCalibration } from '@/components/mobile';

interface V2CalibrationClientProps {
    isMobile: boolean;
}

export function V2CalibrationClient({ isMobile }: V2CalibrationClientProps) {
    const calibration = useCalibration();

    if (isMobile) {
        return <MobileCalibration calibration={calibration} />;
    }

    return <DesktopCalibration calibration={calibration} />;
}
