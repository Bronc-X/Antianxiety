"use client";

/**
 * PlanSelectorContext
 * 
 * Provides callbacks for PlanSelector to save plans and send messages
 * without prop drilling through markdown rendering layers.
 */

import { createContext, useContext, FC, ReactNode } from "react";
import type { ParsedPlan } from "@/lib/plan-parser";

interface PlanSelectorContextValue {
    savePlan: (plan: ParsedPlan) => Promise<boolean>;
    requestAlternative: (plan: ParsedPlan) => void;
    isSaving: boolean;
}

const PlanSelectorContext = createContext<PlanSelectorContextValue | null>(null);

export const usePlanSelectorContext = () => {
    const context = useContext(PlanSelectorContext);
    if (!context) {
        throw new Error("usePlanSelectorContext must be used within PlanSelectorProvider");
    }
    return context;
};

interface PlanSelectorProviderProps {
    children: ReactNode;
    savePlan: (plan: ParsedPlan) => Promise<boolean>;
    requestAlternative: (plan: ParsedPlan) => void;
    isSaving: boolean;
}

export const PlanSelectorProvider: FC<PlanSelectorProviderProps> = ({
    children,
    savePlan,
    requestAlternative,
    isSaving,
}) => {
    return (
        <PlanSelectorContext.Provider value={{ savePlan, requestAlternative, isSaving }}>
            {children}
        </PlanSelectorContext.Provider>
    );
};
