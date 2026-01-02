/**
 * Digital Twin Curve Hook
 * 
 * React Hook for consuming Digital Twin curve data
 * 
 * @module hooks/domain/useDigitalTwinCurve
 */

'use client';

import { useState, useCallback } from 'react';
import type { DigitalTwinCurveOutput } from '@/types/digital-twin-curve';

// ============================================
// 类型定义
// ============================================

export interface UseDigitalTwinCurveReturn {
    /** 曲线数据 */
    curveData: DigitalTwinCurveOutput | null;
    /** 是否正在加载 */
    isLoading: boolean;
    /** 错误信息 */
    error: string | null;
    /** 生成曲线 */
    generateCurve: (conversationTrend?: 'improving' | 'stable' | 'declining') => Promise<void>;
    /** 刷新曲线（使用缓存如果可用） */
    refreshCurve: () => Promise<void>;
    /** 清除数据 */
    clearData: () => void;
}

export interface CurveApiResponse {
    success: boolean;
    data?: DigitalTwinCurveOutput;
    error?: string;
    status?: string;
    hasBaseline?: boolean;
    calibrationCount?: number;
}

// ============================================
// Hook 实现
// ============================================

export function useDigitalTwinCurve(): UseDigitalTwinCurveReturn {
    const [curveData, setCurveData] = useState<DigitalTwinCurveOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 检测 URL 是否包含 dev=true
    const isDevMode = typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('dev') === 'true';

    /**
     * 生成曲线（POST 请求，可指定对话趋势）
     */
    const generateCurve = useCallback(async (
        conversationTrend?: 'improving' | 'stable' | 'declining'
    ) => {
        setIsLoading(true);
        setError(null);

        try {
            // Dev mode uses GET with mock data
            if (isDevMode) {
                console.log('🧪 DEV MODE: Using mock curve generation');
                const response = await fetch('/api/digital-twin/curve?dev=true', {
                    method: 'GET',
                    credentials: 'include',
                });
                const result: CurveApiResponse = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.error || '生成曲线失败');
                }
                if (result.data) {
                    setCurveData(result.data);
                }
                return;
            }

            const response = await fetch('/api/digital-twin/curve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    conversationTrend: conversationTrend ?? null,
                }),
            });

            const result: CurveApiResponse = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || '生成曲线失败');
            }

            if (result.data) {
                setCurveData(result.data);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '未知错误';
            setError(errorMessage);
            console.error('❌ generateCurve error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [isDevMode]);

    /**
     * 刷新曲线（GET 请求，使用默认对话趋势）
     */
    const refreshCurve = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const url = isDevMode ? '/api/digital-twin/curve?dev=true' : '/api/digital-twin/curve';
            console.log(isDevMode ? '🧪 DEV MODE: Refreshing with mock data' : '🔄 Refreshing curve data');
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
            });

            const result: CurveApiResponse = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || '获取曲线失败');
            }

            if (result.data) {
                setCurveData(result.data);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '未知错误';
            setError(errorMessage);
            console.error('❌ refreshCurve error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [isDevMode]);

    /**
     * 清除数据
     */
    const clearData = useCallback(() => {
        setCurveData(null);
        setError(null);
    }, []);


    return {
        curveData,
        isLoading,
        error,
        generateCurve,
        refreshCurve,
        clearData,
    };
}

// ============================================
// 辅助函数
// ============================================

/**
 * 获取当前周索引（0-5）
 */
export function getCurrentWeekIndex(curveData: DigitalTwinCurveOutput): number {
    const currentWeek = curveData.meta.currentWeek;
    if (currentWeek === null) return 0;

    const weeks = [0, 3, 6, 9, 12, 15];
    for (let i = weeks.length - 1; i >= 0; i--) {
        if (currentWeek >= weeks[i]) return i;
    }
    return 0;
}

/**
 * 获取指定指标的所有预测值
 */
export function getMetricPredictions(
    curveData: DigitalTwinCurveOutput,
    metric: 'anxietyScore' | 'sleepQuality' | 'stressResilience' | 'moodStability' | 'energyLevel' | 'hrvScore'
): Array<{ week: number; value: number; confidence: string }> {
    return curveData.A_predictedLongitudinalOutcomes.timepoints.map(tp => ({
        week: tp.week,
        value: tp.metrics[metric].value,
        confidence: tp.metrics[metric].confidence,
    }));
}

/**
 * 获取当前里程碑
 */
export function getCurrentMilestone(curveData: DigitalTwinCurveOutput) {
    return curveData.B_timeSinceBaselineVisit.milestones.find(m => m.status === 'current');
}

/**
 * 获取下一个里程碑
 */
export function getNextMilestone(curveData: DigitalTwinCurveOutput) {
    const milestones = curveData.B_timeSinceBaselineVisit.milestones;
    const currentIndex = milestones.findIndex(m => m.status === 'current');
    if (currentIndex >= 0 && currentIndex < milestones.length - 1) {
        return milestones[currentIndex + 1];
    }
    return milestones.find(m => m.status === 'upcoming');
}

/**
 * 检查数据质量
 */
export function getDataQualityStatus(curveData: DigitalTwinCurveOutput): {
    isGood: boolean;
    warnings: string[];
} {
    const flags = curveData.meta.dataQualityFlags;
    const warnings: string[] = [];

    if (flags.baselineMissing.length > 0) {
        warnings.push(`缺少基线量表: ${flags.baselineMissing.join(', ')}`);
    }
    if (flags.dailyCalibrationSparse) {
        warnings.push('每日校准数据较少，建议持续记录');
    }
    if (flags.conversationTrendMissing) {
        warnings.push('对话趋势分析不可用');
    }
    if (flags.pss10Missing) {
        warnings.push('PSS-10 压力量表未填写');
    }

    return {
        isGood: warnings.length <= 1,
        warnings,
    };
}

export default useDigitalTwinCurve;
