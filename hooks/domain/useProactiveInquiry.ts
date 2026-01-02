'use client';

/**
 * useProactiveInquiry Domain Hook (The Bridge)
 * 
 * Enhanced Max AI proactive inquiry system with:
 * - 40-minute interval timer
 * - AI-generated personalized questions
 * - Inquiry history tracking
 * - Adaptive frequency based on user engagement
 * - Quiet hours detection
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
    identifyDataGaps,
    generateInquiryQuestion,
    type DataGap,
} from '@/lib/inquiry-engine';
import type { InquiryQuestion } from '@/types/adaptive-interaction';
import { createInquiry, respondToInquiry } from '@/app/actions/inquiry';

// ============================================
// Constants
// ============================================

const DEFAULT_INQUIRY_INTERVAL_MS = 40 * 60 * 1000; // 40 minutes
const MIN_INQUIRY_INTERVAL_MS = 20 * 60 * 1000; // 20 minutes (high engagement)
const MAX_INQUIRY_INTERVAL_MS = 120 * 60 * 1000; // 2 hours (low engagement)
const QUIET_HOURS_START = 22; // 10 PM
const QUIET_HOURS_END = 8; // 8 AM
const STORAGE_KEY = 'proactive_inquiry_last_time';
const HISTORY_STORAGE_KEY = 'proactive_inquiry_history';
const ENGAGEMENT_STORAGE_KEY = 'proactive_inquiry_engagement';

// ============================================
// Types
// ============================================

export interface InquiryHistoryItem {
    id: string;
    questionText: string;
    questionType: string;
    answer: string | null;
    answeredAt: string | null;
    createdAt: string;
    responseTimeMs: number | null;
    dismissed: boolean;
}

export interface ResponsePattern {
    totalInquiries: number;
    answeredCount: number;
    dismissedCount: number;
    responseRate: number; // 0-1
    avgResponseTimeMs: number;
    preferredTopics: string[];
    engagementLevel: 'high' | 'medium' | 'low';
}

export interface UserContext {
    recentData: Record<string, { value: string; timestamp: string }>;
    dataGaps: DataGap[];
    timeOfDay: 'morning' | 'afternoon' | 'evening';
    dayOfWeek: number;
    lastInquiryTopic?: string;
    userMood?: string;
}

export interface UseProactiveInquiryReturn {
    // Current inquiry state
    currentInquiry: InquiryQuestion | null;
    isInquiryVisible: boolean;

    // Data gaps
    dataGaps: DataGap[];

    // Core Actions
    showInquiry: () => void;
    dismissInquiry: () => void;
    submitAnswer: (answer: string) => Promise<void>;

    // Timer info
    nextInquiryIn: number | null;
    currentInterval: number;
    isPaused: boolean;
    pause: () => void;
    resume: () => void;

    // NEW: AI-generated questions
    generateAIQuestion: (context?: Partial<UserContext>) => Promise<InquiryQuestion | null>;
    isGeneratingAI: boolean;

    // NEW: History & Analytics
    getInquiryHistory: (limit?: number) => InquiryHistoryItem[];
    getResponsePatterns: () => ResponsePattern;
    clearHistory: () => void;

    // NEW: Adaptive frequency
    adjustFrequency: (engagement: 'high' | 'medium' | 'low') => void;
    engagementLevel: 'high' | 'medium' | 'low';
}

// ============================================
// Helper Functions
// ============================================

function isQuietHours(): boolean {
    const hour = new Date().getHours();
    return hour >= QUIET_HOURS_START || hour < QUIET_HOURS_END;
}

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'evening';
}

function getLastInquiryTime(): number {
    if (typeof window === 'undefined') return 0;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : 0;
}

function setLastInquiryTime(time: number): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, time.toString());
}

function getStoredHistory(): InquiryHistoryItem[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveToHistory(item: InquiryHistoryItem): void {
    if (typeof window === 'undefined') return;
    const history = getStoredHistory();
    history.unshift(item);
    // Keep only last 100 items
    const trimmed = history.slice(0, 100);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
}

function getStoredEngagement(): 'high' | 'medium' | 'low' {
    if (typeof window === 'undefined') return 'medium';
    const stored = localStorage.getItem(ENGAGEMENT_STORAGE_KEY);
    if (stored === 'high' || stored === 'medium' || stored === 'low') return stored;
    return 'medium';
}

function saveEngagement(level: 'high' | 'medium' | 'low'): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ENGAGEMENT_STORAGE_KEY, level);
}

function getIntervalForEngagement(engagement: 'high' | 'medium' | 'low'): number {
    switch (engagement) {
        case 'high': return MIN_INQUIRY_INTERVAL_MS;
        case 'low': return MAX_INQUIRY_INTERVAL_MS;
        default: return DEFAULT_INQUIRY_INTERVAL_MS;
    }
}

// ============================================
// Hook Implementation
// ============================================

export function useProactiveInquiry(
    recentData: Record<string, { value: string; timestamp: string }> = {},
    language: 'zh' | 'en' = 'zh',
    enabled: boolean = true
): UseProactiveInquiryReturn {
    const [currentInquiry, setCurrentInquiry] = useState<InquiryQuestion | null>(null);
    const [isInquiryVisible, setIsInquiryVisible] = useState(false);
    const [dataGaps, setDataGaps] = useState<DataGap[]>([]);
    const [nextInquiryIn, setNextInquiryIn] = useState<number | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [inquiryRecordId, setInquiryRecordId] = useState<string | null>(null);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [engagementLevel, setEngagementLevel] = useState<'high' | 'medium' | 'low'>('medium');
    const [currentInterval, setCurrentInterval] = useState(DEFAULT_INQUIRY_INTERVAL_MS);
    const [inquiryStartTime, setInquiryStartTime] = useState<number | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize engagement from storage
    useEffect(() => {
        const stored = getStoredEngagement();
        setEngagementLevel(stored);
        setCurrentInterval(getIntervalForEngagement(stored));
    }, []);

    // NEW: Generate AI-powered question using LLM
    const generateAIQuestion = useCallback(async (contextOverride?: Partial<UserContext>): Promise<InquiryQuestion | null> => {
        setIsGeneratingAI(true);

        try {
            const gaps = identifyDataGaps(recentData, 24);
            setDataGaps(gaps);

            const context: UserContext = {
                recentData,
                dataGaps: gaps,
                timeOfDay: getTimeOfDay(),
                dayOfWeek: new Date().getDay(),
                ...contextOverride,
            };

            // Call AI API for personalized question
            const response = await fetch('/api/ai/generate-inquiry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context,
                    language,
                    history: getStoredHistory().slice(0, 5), // Send recent history for context
                }),
            });

            if (!response.ok) {
                // Fallback to template-based generation
                console.warn('[ProactiveInquiry] AI generation failed, using template');
                return generateInquiryQuestion(gaps, [], language);
            }

            const data = await response.json();
            return data.question as InquiryQuestion;
        } catch (error) {
            console.error('[ProactiveInquiry] AI generation error:', error);
            // Fallback to template-based generation
            const gaps = identifyDataGaps(recentData, 24);
            return generateInquiryQuestion(gaps, [], language);
        } finally {
            setIsGeneratingAI(false);
        }
    }, [recentData, language]);

    // Check for data gaps and generate inquiry
    const checkAndGenerateInquiry = useCallback(async () => {
        if (isQuietHours()) {
            console.log('[ProactiveInquiry] Quiet hours, skipping');
            return false;
        }

        const gaps = identifyDataGaps(recentData, 24);
        setDataGaps(gaps);

        if (gaps.length === 0) {
            console.log('[ProactiveInquiry] No data gaps found');
            return false;
        }

        // Try AI generation first, fall back to template
        let question: InquiryQuestion | null = null;

        try {
            question = await generateAIQuestion();
        } catch {
            question = generateInquiryQuestion(gaps, [], language);
        }

        if (!question) {
            console.log('[ProactiveInquiry] Could not generate question');
            return false;
        }

        let recordId: string | null = null;
        try {
            const recordResult = await createInquiry({
                question_text: question.question_text,
                question_type: question.question_type,
                priority: question.priority,
                data_gaps_addressed: question.data_gaps_addressed,
                delivery_method: 'in_app',
            });

            if (recordResult.success && recordResult.data) {
                recordId = recordResult.data.id;
            }
        } catch (error) {
            console.warn('[ProactiveInquiry] Failed to persist inquiry:', error);
        }

        setInquiryRecordId(recordId);
        setCurrentInquiry(recordId ? { ...question, id: recordId } : question);
        setIsInquiryVisible(true);
        setInquiryStartTime(Date.now());
        setLastInquiryTime(Date.now());

        // Save to history
        saveToHistory({
            id: recordId || question.id,
            questionText: question.question_text,
            questionType: question.question_type,
            answer: null,
            answeredAt: null,
            createdAt: new Date().toISOString(),
            responseTimeMs: null,
            dismissed: false,
        });

        console.log('[ProactiveInquiry] Generated inquiry:', question.id);
        return true;
    }, [recentData, language, generateAIQuestion]);

    // Show inquiry manually
    const showInquiry = useCallback(() => {
        void checkAndGenerateInquiry();
    }, [checkAndGenerateInquiry]);

    // Dismiss inquiry
    const dismissInquiry = useCallback(() => {
        setIsInquiryVisible(false);

        // Update history to mark as dismissed
        if (currentInquiry) {
            const history = getStoredHistory();
            const updated = history.map(h =>
                h.id === (inquiryRecordId || currentInquiry.id)
                    ? { ...h, dismissed: true }
                    : h
            );
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
        }

        setInquiryRecordId(null);
        setTimeout(() => setCurrentInquiry(null), 300);
    }, [currentInquiry, inquiryRecordId]);

    // Submit answer
    const submitAnswer = useCallback(async (answer: string) => {
        if (!currentInquiry) return;

        const responseTimeMs = inquiryStartTime ? Date.now() - inquiryStartTime : null;
        console.log('[ProactiveInquiry] Answer submitted:', currentInquiry.id, answer);

        if (inquiryRecordId) {
            try {
                await respondToInquiry(inquiryRecordId, answer);
            } catch (error) {
                console.warn('[ProactiveInquiry] Failed to save response:', error);
            }
        }

        // Update history with answer
        const history = getStoredHistory();
        const updated = history.map(h =>
            h.id === (inquiryRecordId || currentInquiry.id)
                ? { ...h, answer, answeredAt: new Date().toISOString(), responseTimeMs }
                : h
        );
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));

        dismissInquiry();
        setLastInquiryTime(Date.now());

        // Auto-adjust engagement based on response patterns
        const patterns = getResponsePatternsFromHistory(updated);
        if (patterns.responseRate > 0.8) {
            adjustFrequency('high');
        } else if (patterns.responseRate < 0.3) {
            adjustFrequency('low');
        }
    }, [currentInquiry, inquiryRecordId, inquiryStartTime, dismissInquiry]);

    // Pause/Resume timer
    const pause = useCallback(() => {
        setIsPaused(true);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const resume = useCallback(() => {
        setIsPaused(false);
    }, []);

    // NEW: Get inquiry history
    const getInquiryHistory = useCallback((limit: number = 50): InquiryHistoryItem[] => {
        return getStoredHistory().slice(0, limit);
    }, []);

    // Helper to calculate patterns from history
    const getResponsePatternsFromHistory = (history: InquiryHistoryItem[]): ResponsePattern => {
        const total = history.length;
        const answered = history.filter(h => h.answer !== null).length;
        const dismissed = history.filter(h => h.dismissed).length;
        const responseTimes = history
            .filter(h => h.responseTimeMs !== null)
            .map(h => h.responseTimeMs!);

        const avgResponseTime = responseTimes.length > 0
            ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
            : 0;

        const responseRate = total > 0 ? answered / total : 0;

        let engLevel: 'high' | 'medium' | 'low' = 'medium';
        if (responseRate > 0.7) engLevel = 'high';
        else if (responseRate < 0.3) engLevel = 'low';

        // Find preferred topics from answered questions
        const topics = history
            .filter(h => h.answer !== null)
            .map(h => h.questionType);
        const topicCounts = topics.reduce((acc, t) => {
            acc[t] = (acc[t] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const preferredTopics = Object.entries(topicCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([topic]) => topic);

        return {
            totalInquiries: total,
            answeredCount: answered,
            dismissedCount: dismissed,
            responseRate,
            avgResponseTimeMs: avgResponseTime,
            preferredTopics,
            engagementLevel: engLevel,
        };
    };

    // NEW: Get response patterns
    const getResponsePatterns = useCallback((): ResponsePattern => {
        return getResponsePatternsFromHistory(getStoredHistory());
    }, []);

    // NEW: Clear history
    const clearHistory = useCallback(() => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(HISTORY_STORAGE_KEY);
        }
    }, []);

    // NEW: Adjust frequency based on engagement
    const adjustFrequency = useCallback((engagement: 'high' | 'medium' | 'low') => {
        setEngagementLevel(engagement);
        const newInterval = getIntervalForEngagement(engagement);
        setCurrentInterval(newInterval);
        saveEngagement(engagement);
        console.log(`[ProactiveInquiry] Adjusted frequency to ${engagement}: ${newInterval}ms`);
    }, []);

    // Ref for latest callback
    const checkCallbackRef = useRef(checkAndGenerateInquiry);

    useEffect(() => {
        checkCallbackRef.current = checkAndGenerateInquiry;
    }, [checkAndGenerateInquiry]);

    // Setup interval timer with adaptive frequency
    useEffect(() => {
        if (!enabled || isPaused) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            setNextInquiryIn(null);
            return;
        }

        const lastTime = getLastInquiryTime();
        const timeSinceLast = Date.now() - lastTime;
        const timeUntilNext = Math.max(0, currentInterval - timeSinceLast);

        setNextInquiryIn(timeUntilNext);

        if (timerRef.current) clearInterval(timerRef.current);

        const firstTrigger = setTimeout(() => {
            void checkCallbackRef.current();
            setNextInquiryIn(currentInterval);

            timerRef.current = setInterval(() => {
                void checkCallbackRef.current();
                setNextInquiryIn(currentInterval);
            }, currentInterval);
        }, timeUntilNext);

        return () => {
            clearTimeout(firstTrigger);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [enabled, isPaused, currentInterval]);

    return {
        // Current inquiry state
        currentInquiry,
        isInquiryVisible,
        dataGaps,

        // Core Actions
        showInquiry,
        dismissInquiry,
        submitAnswer,

        // Timer info
        nextInquiryIn,
        currentInterval,
        isPaused,
        pause,
        resume,

        // AI-generated questions
        generateAIQuestion,
        isGeneratingAI,

        // History & Analytics
        getInquiryHistory,
        getResponsePatterns,
        clearHistory,

        // Adaptive frequency
        adjustFrequency,
        engagementLevel,
    };
}

export type { InquiryQuestion, DataGap };
export default useProactiveInquiry;
