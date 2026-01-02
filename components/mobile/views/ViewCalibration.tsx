"use client";

import { useCalibration } from "@/hooks/domain/useCalibration";
import MobileCalibration from "../Calibration";

export const ViewCalibration = () => {
    const calibrationHook = useCalibration();
    return <MobileCalibration calibration={calibrationHook} />;
};
