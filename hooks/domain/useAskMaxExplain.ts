'use client';

/**
 * useAskMaxExplain Domain Hook (The Bridge)
 * 
 * Manages "Ask Max" feature for health recommendations.
 * Calls LLM to generate plain language explanations and tracks user interests.
 */

import { useState, useCallback } from 'react';

// ============================================
// Types
// ============================================

export interface AskMaxState {
    expandedRecId: string | null;
    explanations: Record<string, string>;
    loadingRecId: string | null;
}

export interface UseAskMaxExplainReturn {
    // State
    expandedRecId: string | null;
    explanations: Record<string, string>;
    isLoading: (recId: string) => boolean;
    isExpanded: (recId: string) => boolean;
    getExplanation: (recId: string) => string | undefined;

    // Actions
    askMax: (params: AskMaxParams) => Promise<void>;
    toggleExpand: (recId: string) => void;
    clearAll: () => void;
}

export interface AskMaxParams {
    recId: string;
    title: string;
    description: string;
    science: string;
    category?: string;
    language: 'en' | 'zh';
}

// ============================================
// Hook Implementation
// ============================================

export function useAskMaxExplain(): UseAskMaxExplainReturn {
    const [expandedRecId, setExpandedRecId] = useState<string | null>(null);
    const [explanations, setExplanations] = useState<Record<string, string>>({});
    const [loadingRecId, setLoadingRecId] = useState<string | null>(null);

    // Check if a specific recommendation is loading
    const isLoading = useCallback((recId: string) => loadingRecId === recId, [loadingRecId]);

    // Check if a specific recommendation is expanded
    const isExpanded = useCallback((recId: string) => expandedRecId === recId, [expandedRecId]);

    // Get explanation for a specific recommendation
    const getExplanation = useCallback((recId: string) => explanations[recId], [explanations]);

    // Toggle expand state
    const toggleExpand = useCallback((recId: string) => {
        setExpandedRecId(prev => prev === recId ? null : recId);
    }, []);

    // Clear all explanations and state
    const clearAll = useCallback(() => {
        setExpandedRecId(null);
        setExplanations({});
        setLoadingRecId(null);
    }, []);

    // Call API to get Max's explanation
    const askMax = useCallback(async ({
        recId,
        title,
        description,
        science,
        category,
        language,
    }: AskMaxParams) => {
        // Toggle if already expanded with explanation
        if (expandedRecId === recId && explanations[recId]) {
            setExpandedRecId(null);
            return;
        }

        // If we already have the explanation, just expand
        if (explanations[recId]) {
            setExpandedRecId(recId);
            return;
        }

        // Call API
        setLoadingRecId(recId);
        setExpandedRecId(recId);

        try {
            const response = await fetch('/api/digital-twin/explain-recommendation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recommendationId: recId,
                    title,
                    description,
                    science,
                    language,
                    category,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setExplanations(prev => ({ ...prev, [recId]: data.explanation }));
            } else {
                const errorMsg = language === 'en'
                    ? 'Sorry, I couldn\'t generate an explanation. Please try again.'
                    : '抱歉，无法生成解释。请稍后再试。';
                setExplanations(prev => ({ ...prev, [recId]: errorMsg }));
            }
        } catch (error) {
            console.error('Ask Max error:', error);
            const errorMsg = language === 'en'
                ? 'Network error. Please check your connection.'
                : '网络错误，请检查连接。';
            setExplanations(prev => ({ ...prev, [recId]: errorMsg }));
        } finally {
            setLoadingRecId(null);
        }
    }, [expandedRecId, explanations]);

    return {
        // State
        expandedRecId,
        explanations,
        isLoading,
        isExpanded,
        getExplanation,

        // Actions
        askMax,
        toggleExpand,
        clearAll,
    };
}

export default useAskMaxExplain;
