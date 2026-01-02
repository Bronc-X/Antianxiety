"use client";

import { useSettings } from "@/hooks/domain/useSettings";
import MobileSettings from "../Settings";

export const ViewSettings = () => {
    const settingsHook = useSettings();
    return <MobileSettings settings={settingsHook} />;
};
