'use client';

/**
 * useAnalysis Domain Hook (The Bridge)
 * 
 * Manages health analysis and reports state.
 */

import { useState, useCallback, useEffect } from 'react';
import { useNetwork } from '@/hooks/useNetwork';
import {
    getLatestAnalysis,
    getTrendData,
    generateAnalysis,
    getAnalysisHistory,
    type AnalysisReport,
    type TrendData
} from '@/app/actions/analysis';

// ============================================
// Types
// ============================================

export interface UseAnalysisReturn {
    // Data
    latestReport: AnalysisReport | null;
    trends: TrendData[];
    history: AnalysisReport[];

    // States
    isLoading: boolean;
    isGenerating: boolean;
    isOffline: boolean;
    error: string | null;

    // Actions
    refresh: () => Promise<void>;
    loadTrends: (days?: number) => Promise<void>;
    loadHistory: () => Promise<void>;
    generate: (type?: 'weekly' | 'monthly') => Promise<boolean>;
}

// ============================================
// Hook Implementation
// ============================================

export function useAnalysis(): UseAnalysisReturn {
    const { isOnline } = useNetwork();

    const [latestReport, setLatestReport] = useState<AnalysisReport | null>(null);
    const [trends, setTrends] = useState<TrendData[]>([]);
    const [history, setHistory] = useState<AnalysisReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load latest report on mount
    useEffect(() => {
        const loadLatest = async () => {
            try {
                const [reportResult, trendsResult] = await Promise.all([
                    getLatestAnalysis(),
                    getTrendData(30),
                ]);

                if (reportResult.success) {
                    setLatestReport(reportResult.data || null);
                }

                if (trendsResult.success && trendsResult.data) {
                    setTrends(trendsResult.data);
                }
            } catch {
                // Ignore
            } finally {
                setIsLoading(false);
            }
        };

        loadLatest();
    }, []);

    // Refresh
    const refresh = useCallback(async () => {
        setIsLoading(true);

        try {
            const result = await getLatestAnalysis();
            if (result.success) {
                setLatestReport(result.data || null);
                setError(null);
            }
        } catch {
            // Ignore
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load trends
    const loadTrends = useCallback(async (days = 30) => {
        try {
            const result = await getTrendData(days);
            if (result.success && result.data) {
                setTrends(result.data);
            }
        } catch {
            // Ignore
        }
    }, []);

    // Load history
    const loadHistory = useCallback(async () => {
        try {
            const result = await getAnalysisHistory();
            if (result.success && result.data) {
                setHistory(result.data);
            }
        } catch {
            // Ignore
        }
    }, []);

    // Generate new analysis
    const generate = useCallback(async (type: 'weekly' | 'monthly' = 'weekly'): Promise<boolean> => {
        setIsGenerating(true);
        setError(null);

        try {
            const result = await generateAnalysis(type);

            if (result.success && result.data) {
                setLatestReport(result.data);
                return true;
            } else {
                setError(result.error || 'Failed to generate');
                return false;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed');
            return false;
        } finally {
            setIsGenerating(false);
        }
    }, []);

    return {
        latestReport,
        trends,
        history,
        isLoading,
        isGenerating,
        isOffline: !isOnline,
        error,
        refresh,
        loadTrends,
        loadHistory,
        generate,
    };
}

export type { AnalysisReport, TrendData };
