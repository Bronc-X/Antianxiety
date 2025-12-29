'use client';

/**
 * useCalibration Domain Hook (The Bridge)
 * 
 * Manages daily calibration state.
 */

import { useState, useCallback, useEffect } from 'react';
import { useNetwork } from '@/hooks/useNetwork';
import {
    getTodayCalibration,
    saveCalibration,
    getCalibrationHistory,
    type CalibrationData,
    type CalibrationInput
} from '@/app/actions/calibration';

// ============================================
// Types
// ============================================

export interface UseCalibrationReturn {
    // Data
    todayData: CalibrationData | null;
    history: CalibrationData[];
    isCompleted: boolean;

    // States
    isLoading: boolean;
    isSaving: boolean;
    isOffline: boolean;
    error: string | null;

    // Actions
    save: (input: CalibrationInput) => Promise<boolean>;
    refresh: () => Promise<void>;
    loadHistory: (days?: number) => Promise<void>;
}

// ============================================
// Hook Implementation
// ============================================

export function useCalibration(): UseCalibrationReturn {
    const { isOnline } = useNetwork();

    const [todayData, setTodayData] = useState<CalibrationData | null>(null);
    const [history, setHistory] = useState<CalibrationData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch today's data on mount
    useEffect(() => {
        const fetchToday = async () => {
            try {
                const result = await getTodayCalibration();
                if (result.success) {
                    setTodayData(result.data || null);
                } else {
                    setError(result.error || 'Failed to load');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed');
            } finally {
                setIsLoading(false);
            }
        };

        fetchToday();
    }, []);

    // Save calibration
    const save = useCallback(async (input: CalibrationInput): Promise<boolean> => {
        setIsSaving(true);
        setError(null);

        try {
            const result = await saveCalibration(input);

            if (result.success && result.data) {
                setTodayData(result.data);
                return true;
            } else {
                setError(result.error || 'Failed to save');
                return false;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed');
            return false;
        } finally {
            setIsSaving(false);
        }
    }, []);

    // Refresh today's data
    const refresh = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await getTodayCalibration();
            if (result.success) {
                setTodayData(result.data || null);
                setError(null);
            }
        } catch {
            // Ignore
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load history
    const loadHistory = useCallback(async (days = 7) => {
        try {
            const result = await getCalibrationHistory(days);
            if (result.success && result.data) {
                setHistory(result.data);
            }
        } catch {
            // Ignore
        }
    }, []);

    // Check if today is completed
    const isCompleted = todayData !== null && (
        todayData.mood_status !== null ||
        todayData.sleep_duration_minutes !== null ||
        todayData.stress_level !== null
    );

    return {
        todayData,
        history,
        isCompleted,
        isLoading,
        isSaving,
        isOffline: !isOnline,
        error,
        save,
        refresh,
        loadHistory,
    };
}

export type { CalibrationData, CalibrationInput };
