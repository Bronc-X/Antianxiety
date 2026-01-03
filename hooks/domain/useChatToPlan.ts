'use client';

/**
 * useChatToPlan Hook
 * 
 * Detects AI plan suggestions in chat messages and allows users to:
 * 1. Select which plans to save
 * 2. Edit plan items before saving
 * 3. Confirm and persist to user_plans
 * 
 * Shared between Desktop and Mobile.
 */

import { useState, useCallback, useMemo } from 'react';
import { containsPlans, parsePlans, type ParsedPlan } from '@/lib/plan-parser';
import { createPlansFromAI } from '@/app/actions/plans';

// ============================================
// Types
// ============================================

export interface EditablePlanItem {
    id: string;
    text: string;
    selected: boolean;
}

export interface EditablePlan extends ParsedPlan {
    id: string;
    selected: boolean;
    editableItems: EditablePlanItem[];
}

export interface UseChatToPlanReturn {
    // Detected plans from message
    detectedPlans: EditablePlan[];
    hasPlans: boolean;

    // States
    isProcessing: boolean;
    isSaving: boolean;
    error: string | null;
    savedCount: number;

    // Actions
    detectPlansFromMessage: (message: string) => void;
    togglePlanSelection: (planId: string) => void;
    toggleItemSelection: (planId: string, itemId: string) => void;
    updateItemText: (planId: string, itemId: string, newText: string) => void;
    addItemToPlan: (planId: string, text: string) => void;
    removeItemFromPlan: (planId: string, itemId: string) => void;
    saveSelectedPlans: () => Promise<boolean>;
    clearDetectedPlans: () => void;
    selectAllPlans: () => void;
    deselectAllPlans: () => void;
}

// ============================================
// Hook Implementation
// ============================================

export function useChatToPlan(): UseChatToPlanReturn {
    const [detectedPlans, setDetectedPlans] = useState<EditablePlan[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedCount, setSavedCount] = useState(0);

    const hasPlans = useMemo(() => detectedPlans.length > 0, [detectedPlans]);

    // Detect plans from message
    const detectPlansFromMessage = useCallback((message: string) => {
        setIsProcessing(true);
        setError(null);

        try {
            if (!containsPlans(message)) {
                setDetectedPlans([]);
                setIsProcessing(false);
                return;
            }

            const parsed = parsePlans(message);

            const editablePlans: EditablePlan[] = parsed.map((plan, index) => ({
                ...plan,
                id: `plan-${Date.now()}-${index}`,
                selected: true, // Default to selected
                editableItems: (plan.items || []).map((item, itemIndex) => ({
                    id: item.id || `item-${Date.now()}-${itemIndex}`,
                    text: item.text,
                    selected: true, // Default to selected
                })),
            }));

            setDetectedPlans(editablePlans);
        } catch (err) {
            console.error('Failed to parse plans:', err);
            setError('Failed to parse plans from message');
        } finally {
            setIsProcessing(false);
        }
    }, []);

    // Toggle plan selection
    const togglePlanSelection = useCallback((planId: string) => {
        setDetectedPlans(prev => prev.map(plan =>
            plan.id === planId
                ? { ...plan, selected: !plan.selected }
                : plan
        ));
    }, []);

    // Toggle individual item selection
    const toggleItemSelection = useCallback((planId: string, itemId: string) => {
        setDetectedPlans(prev => prev.map(plan => {
            if (plan.id !== planId) return plan;
            return {
                ...plan,
                editableItems: plan.editableItems.map(item =>
                    item.id === itemId
                        ? { ...item, selected: !item.selected }
                        : item
                ),
            };
        }));
    }, []);

    // Update item text
    const updateItemText = useCallback((planId: string, itemId: string, newText: string) => {
        setDetectedPlans(prev => prev.map(plan => {
            if (plan.id !== planId) return plan;
            return {
                ...plan,
                editableItems: plan.editableItems.map(item =>
                    item.id === itemId
                        ? { ...item, text: newText }
                        : item
                ),
            };
        }));
    }, []);

    // Add new item to plan
    const addItemToPlan = useCallback((planId: string, text: string) => {
        if (!text.trim()) return;

        setDetectedPlans(prev => prev.map(plan => {
            if (plan.id !== planId) return plan;
            return {
                ...plan,
                editableItems: [
                    ...plan.editableItems,
                    {
                        id: `item-${Date.now()}-new`,
                        text: text.trim(),
                        selected: true,
                    }
                ],
            };
        }));
    }, []);

    // Remove item from plan
    const removeItemFromPlan = useCallback((planId: string, itemId: string) => {
        setDetectedPlans(prev => prev.map(plan => {
            if (plan.id !== planId) return plan;
            return {
                ...plan,
                editableItems: plan.editableItems.filter(item => item.id !== itemId),
            };
        }));
    }, []);

    // Save selected plans
    const saveSelectedPlans = useCallback(async (): Promise<boolean> => {
        const selectedPlans = detectedPlans.filter(p => p.selected);

        if (selectedPlans.length === 0) {
            setError('Please select at least one plan to save');
            return false;
        }

        setIsSaving(true);
        setError(null);

        try {
            // Convert to ParsedPlan format with only selected items
            const plansToSave: ParsedPlan[] = selectedPlans.map(plan => ({
                title: plan.title,
                content: plan.content,
                difficulty: plan.difficulty,
                duration: plan.duration,
                items: plan.editableItems
                    .filter(item => item.selected)
                    .map(item => ({
                        text: item.text,
                        status: 'pending' as const,
                    })),
            }));

            const result = await createPlansFromAI(plansToSave);

            if (!result.success) {
                setError(result.error || 'Failed to save plans');
                return false;
            }

            setSavedCount(prev => prev + plansToSave.length);
            setDetectedPlans([]); // Clear after successful save

            return true;
        } catch (err) {
            console.error('Failed to save plans:', err);
            setError('Failed to save plans');
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [detectedPlans]);

    // Clear all detected plans
    const clearDetectedPlans = useCallback(() => {
        setDetectedPlans([]);
        setError(null);
    }, []);

    // Select all plans
    const selectAllPlans = useCallback(() => {
        setDetectedPlans(prev => prev.map(plan => ({ ...plan, selected: true })));
    }, []);

    // Deselect all plans
    const deselectAllPlans = useCallback(() => {
        setDetectedPlans(prev => prev.map(plan => ({ ...plan, selected: false })));
    }, []);

    return {
        detectedPlans,
        hasPlans,
        isProcessing,
        isSaving,
        error,
        savedCount,
        detectPlansFromMessage,
        togglePlanSelection,
        toggleItemSelection,
        updateItemText,
        addItemToPlan,
        removeItemFromPlan,
        saveSelectedPlans,
        clearDetectedPlans,
        selectAllPlans,
        deselectAllPlans,
    };
}

export type { ParsedPlan };
