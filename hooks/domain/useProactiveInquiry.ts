'use client';

/**
 * useProactiveInquiry Domain Hook
 * 
 * 管理 Max AI 主动问询功能（40分钟间隔）
 * 
 * 核心功能：
 * 1. 定时检查数据缺口
 * 2. 生成个性化问询问题
 * 3. 触发问询弹窗
 * 4. 记录用户回答
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

const INQUIRY_INTERVAL_MS = 40 * 60 * 1000; // 40 minutes
const QUIET_HOURS_START = 22; // 10 PM
const QUIET_HOURS_END = 8; // 8 AM
const STORAGE_KEY = 'proactive_inquiry_last_time';

// ============================================
// Types
// ============================================

export interface UseProactiveInquiryReturn {
    // Current inquiry state
    currentInquiry: InquiryQuestion | null;
    isInquiryVisible: boolean;

    // Data gaps
    dataGaps: DataGap[];

    // Actions
    showInquiry: () => void;
    dismissInquiry: () => void;
    submitAnswer: (answer: string) => Promise<void>;

    // Timer info
    nextInquiryIn: number | null; // ms until next inquiry
    isPaused: boolean;
    pause: () => void;
    resume: () => void;
}

// ============================================
// Helper Functions
// ============================================

function isQuietHours(): boolean {
    const hour = new Date().getHours();
    return hour >= QUIET_HOURS_START || hour < QUIET_HOURS_END;
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

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    // Check for data gaps and generate inquiry
    const checkAndGenerateInquiry = useCallback(async () => {
        // Don't trigger during quiet hours
        if (isQuietHours()) {
            console.log('[ProactiveInquiry] Quiet hours, skipping');
            return false;
        }

        // Identify data gaps
        const gaps = identifyDataGaps(recentData, 24); // 24 hour staleness threshold
        setDataGaps(gaps);

        if (gaps.length === 0) {
            console.log('[ProactiveInquiry] No data gaps found');
            return false;
        }

        // Generate inquiry question
        const question = generateInquiryQuestion(gaps, [], language);
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
        setLastInquiryTime(Date.now());

        console.log('[ProactiveInquiry] Generated inquiry:', question.id);
        return true;
    }, [recentData, language]);

    // Show inquiry manually
    const showInquiry = useCallback(() => {
        void checkAndGenerateInquiry();
    }, [checkAndGenerateInquiry]);

    // Dismiss inquiry
    const dismissInquiry = useCallback(() => {
        setIsInquiryVisible(false);
        setInquiryRecordId(null);
        // Don't clear currentInquiry immediately for animation
        setTimeout(() => setCurrentInquiry(null), 300);
    }, []);

    // Submit answer
    const submitAnswer = useCallback(async (answer: string) => {
        if (!currentInquiry) return;

        console.log('[ProactiveInquiry] Answer submitted:', currentInquiry.id, answer);

        if (inquiryRecordId) {
            try {
                await respondToInquiry(inquiryRecordId, answer);
            } catch (error) {
                console.warn('[ProactiveInquiry] Failed to save response:', error);
            }
        }

        dismissInquiry();
        setLastInquiryTime(Date.now());
    }, [currentInquiry, inquiryRecordId, dismissInquiry]);

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

    // Use a ref to hold the latest callback to avoid resetting the timer when data changes
    const checkCallbackRef = useRef(checkAndGenerateInquiry);

    // Update ref on render
    useEffect(() => {
        checkCallbackRef.current = checkAndGenerateInquiry;
    }, [checkAndGenerateInquiry]);

    // Setup interval timer
    useEffect(() => {
        if (!enabled || isPaused) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
                countdownRef.current = null;
            }
            setNextInquiryIn(null);
            return;
        }

        // Calculate time until next inquiry
        const lastTime = getLastInquiryTime();
        const timeSinceLast = Date.now() - lastTime;
        const timeUntilNext = Math.max(0, INQUIRY_INTERVAL_MS - timeSinceLast);

        // Set initial countdown
        setNextInquiryIn(timeUntilNext);

        // Clear existing timers
        if (timerRef.current) clearInterval(timerRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);

        // First trigger after remaining time
        const firstTrigger = setTimeout(() => {
            // Call the ref
            void checkCallbackRef.current();

            // Then set up regular interval
            timerRef.current = setInterval(() => {
                void checkCallbackRef.current();
            }, INQUIRY_INTERVAL_MS);
        }, timeUntilNext);

        // Update countdown every second
        countdownRef.current = setInterval(() => {
            setNextInquiryIn(prev => {
                if (prev === null) return INQUIRY_INTERVAL_MS;
                const newValue = prev - 1000;
                // If we hit 0, we don't reset here (the main timer handles the trigger)
                // We just wrap around or hold at 0
                return newValue <= 0 ? INQUIRY_INTERVAL_MS : newValue;
            });
        }, 1000);

        return () => {
            clearTimeout(firstTrigger);
            if (timerRef.current) clearInterval(timerRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, [enabled, isPaused]); // Removed checkAndGenerateInquiry dependency

    return {
        currentInquiry,
        isInquiryVisible,
        dataGaps,
        showInquiry,
        dismissInquiry,
        submitAnswer,
        nextInquiryIn,
        isPaused,
        pause,
        resume,
    };
}

export type { InquiryQuestion, DataGap };
