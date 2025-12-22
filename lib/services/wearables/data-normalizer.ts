/**
 * Wearable Data Normalizer
 * 将不同穿戴设备的原始数据归一化为统一格式
 */

import type {
    WearableProvider,
    HealthDataType,
    DataQuality,
    NormalizedHealthData,
    FitbitSleepData,
    FitbitHRVData,
    OuraSleepData,
    OuraReadinessData,
} from '@/types/wearable';

// ============================================================================
// 归一化配置
// ============================================================================

interface NormalizationConfig {
    dataType: HealthDataType;
    // 不同质量等级的阈值
    thresholds: {
        excellent: { min: number; max: number };
        good: { min: number; max: number };
        fair: { min: number; max: number };
        poor: { min: number; max: number };
    };
}

const SLEEP_DURATION_CONFIG: NormalizationConfig = {
    dataType: 'sleep',
    thresholds: {
        excellent: { min: 420, max: 540 },  // 7-9小时
        good: { min: 360, max: 420 },       // 6-7小时
        fair: { min: 300, max: 360 },       // 5-6小时
        poor: { min: 0, max: 300 },         // <5小时
    },
};

const HRV_CONFIG: NormalizationConfig = {
    dataType: 'hrv',
    thresholds: {
        excellent: { min: 60, max: 200 },   // HRV > 60ms
        good: { min: 40, max: 60 },         // 40-60ms
        fair: { min: 25, max: 40 },         // 25-40ms
        poor: { min: 0, max: 25 },          // <25ms
    },
};

// ============================================================================
// 通用归一化函数
// ============================================================================

export function getQualityFromValue(
    value: number,
    config: NormalizationConfig
): DataQuality {
    const { thresholds } = config;

    if (value >= thresholds.excellent.min && value <= thresholds.excellent.max) {
        return 'excellent';
    }
    if (value >= thresholds.good.min && value < thresholds.good.max) {
        return 'good';
    }
    if (value >= thresholds.fair.min && value < thresholds.fair.max) {
        return 'fair';
    }
    return 'poor';
}

export function calculateScoreFromQuality(quality: DataQuality): number {
    switch (quality) {
        case 'excellent': return 90;
        case 'good': return 70;
        case 'fair': return 50;
        case 'poor': return 25;
    }
}

// ============================================================================
// Fitbit 数据归一化
// ============================================================================

export function normalizeFitbitSleep(raw: FitbitSleepData): NormalizedHealthData {
    const sleepMinutes = raw.minutesAsleep;
    const quality = getQualityFromValue(sleepMinutes, SLEEP_DURATION_CONFIG);

    return {
        source: 'fitbit',
        dataType: 'sleep',
        recordedAt: new Date(raw.dateOfSleep),
        value: sleepMinutes,
        score: raw.efficiency, // Fitbit提供的睡眠效率
        quality,
        metadata: {
            deepMinutes: raw.levels.summary.deep.minutes,
            lightMinutes: raw.levels.summary.light.minutes,
            remMinutes: raw.levels.summary.rem.minutes,
            wakeMinutes: raw.minutesAwake,
            startTime: raw.startTime,
            endTime: raw.endTime,
        },
        rawData: raw,
    };
}

export function normalizeFitbitHRV(raw: FitbitHRVData): NormalizedHealthData {
    const hrvValue = raw.value.dailyRmssd;
    const quality = getQualityFromValue(hrvValue, HRV_CONFIG);

    return {
        source: 'fitbit',
        dataType: 'hrv',
        recordedAt: new Date(raw.dateTime),
        value: hrvValue,
        score: calculateScoreFromQuality(quality),
        quality,
        metadata: {
            deepRmssd: raw.value.deepRmssd,
        },
        rawData: raw,
    };
}

// ============================================================================
// Oura 数据归一化
// ============================================================================

export function normalizeOuraSleep(raw: OuraSleepData): NormalizedHealthData {
    // Oura使用秒，转换为分钟
    const sleepMinutes = Math.round(raw.total_sleep_duration / 60);
    const quality = getQualityFromValue(sleepMinutes, SLEEP_DURATION_CONFIG);

    return {
        source: 'oura',
        dataType: 'sleep',
        recordedAt: new Date(raw.day),
        value: sleepMinutes,
        score: raw.score, // Oura提供的睡眠评分(0-100)
        quality,
        metadata: {
            deepMinutes: Math.round(raw.deep_sleep_duration / 60),
            lightMinutes: Math.round(raw.light_sleep_duration / 60),
            remMinutes: Math.round(raw.rem_sleep_duration / 60),
            contributors: raw.contributors,
        },
        rawData: raw,
    };
}

export function normalizeOuraReadiness(raw: OuraReadinessData): NormalizedHealthData {
    let quality: DataQuality = 'poor';
    if (raw.score >= 85) quality = 'excellent';
    else if (raw.score >= 70) quality = 'good';
    else if (raw.score >= 50) quality = 'fair';

    return {
        source: 'oura',
        dataType: 'readiness',
        recordedAt: new Date(raw.day),
        value: raw.score,
        score: raw.score,
        quality,
        metadata: {
            contributors: raw.contributors,
        },
        rawData: raw,
    };
}

// ============================================================================
// 批量归一化入口
// ============================================================================

export interface RawDataPackage {
    provider: WearableProvider;
    dataType: HealthDataType;
    data: unknown[];
}

export function normalizeHealthData(packages: RawDataPackage[]): NormalizedHealthData[] {
    const results: NormalizedHealthData[] = [];

    for (const pkg of packages) {
        for (const rawItem of pkg.data) {
            try {
                const normalized = normalizeSingleItem(pkg.provider, pkg.dataType, rawItem);
                if (normalized) {
                    results.push(normalized);
                }
            } catch (error) {
                console.error(`Failed to normalize ${pkg.provider}:${pkg.dataType}`, error);
            }
        }
    }

    return results;
}

function normalizeSingleItem(
    provider: WearableProvider,
    dataType: HealthDataType,
    raw: unknown
): NormalizedHealthData | null {
    switch (provider) {
        case 'fitbit':
            if (dataType === 'sleep') return normalizeFitbitSleep(raw as FitbitSleepData);
            if (dataType === 'hrv') return normalizeFitbitHRV(raw as FitbitHRVData);
            break;
        case 'oura':
            if (dataType === 'sleep') return normalizeOuraSleep(raw as OuraSleepData);
            if (dataType === 'readiness') return normalizeOuraReadiness(raw as OuraReadinessData);
            break;
    }

    console.warn(`No normalizer for ${provider}:${dataType}`);
    return null;
}
