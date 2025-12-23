/**
 * Apple HealthKit Bridge
 * iOS HealthKit数据桥接（通过Capacitor插件）
 * 
 * 注意：HealthKit没有云端API，需要通过iOS原生代码在设备端采集数据，
 * 然后通过API上传到后端。此文件提供客户端采集逻辑。
 * 
 * 依赖：@followathletics/capacitor-healthkit
 */

import type {
    WearableProvider,
    HealthDataType,
    NormalizedHealthData,
    DataQuality,
} from '@/types/wearable';
import { Capacitor } from '@capacitor/core';

// ============================================================================
// HealthKit权限配置
// ============================================================================

export const HEALTHKIT_PERMISSIONS = {
    read: [
        'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
        'HKQuantityTypeIdentifierRestingHeartRate',
        'HKQuantityTypeIdentifierStepCount',
        'HKQuantityTypeIdentifierActiveEnergyBurned',
        'HKCategoryTypeIdentifierSleepAnalysis',
    ],
    write: [], // 我们只读取，不写入
};

// ============================================================================
// HealthKit桥接器
// ============================================================================

export class HealthKitBridge {
    provider: WearableProvider = 'healthkit';

    private plugin: HealthKitPlugin | null = null;

    /**
     * 检查HealthKit是否可用（仅iOS）
     */
    async isAvailable(): Promise<boolean> {
        if (Capacitor.getPlatform() !== 'ios') {
            return false;
        }

        try {
            const plugin = await this.getPlugin();
            const result = await plugin.isAvailable();
            return result.available;
        } catch {
            return false;
        }
    }

    /**
     * 请求HealthKit权限
     */
    async requestAuthorization(): Promise<boolean> {
        try {
            const plugin = await this.getPlugin();
            await plugin.requestAuthorization({
                read: HEALTHKIT_PERMISSIONS.read,
                write: HEALTHKIT_PERMISSIONS.write,
            });
            return true;
        } catch (error) {
            console.error('HealthKit authorization failed:', error);
            return false;
        }
    }

    /**
     * 获取健康数据
     */
    async fetchData(
        startDate: Date,
        endDate: Date,
        dataTypes: HealthDataType[] = ['sleep', 'hrv', 'heart_rate']
    ): Promise<NormalizedHealthData[]> {
        const results: NormalizedHealthData[] = [];
        const plugin = await this.getPlugin();

        if (dataTypes.includes('sleep')) {
            const sleepData = await this.fetchSleepData(plugin, startDate, endDate);
            results.push(...sleepData);
        }

        if (dataTypes.includes('hrv')) {
            const hrvData = await this.fetchHRVData(plugin, startDate, endDate);
            results.push(...hrvData);
        }

        if (dataTypes.includes('heart_rate')) {
            const hrData = await this.fetchHeartRateData(plugin, startDate, endDate);
            results.push(...hrData);
        }

        return results;
    }

    // ============================================================================
    // 数据获取方法
    // ============================================================================

    private async fetchSleepData(
        plugin: HealthKitPlugin,
        startDate: Date,
        endDate: Date
    ): Promise<NormalizedHealthData[]> {
        const result = await plugin.querySleep({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        });

        return result.samples.map((sample: HealthKitSleepSample) => {
            const durationMinutes = (new Date(sample.endDate).getTime() -
                new Date(sample.startDate).getTime()) / 60000;

            return {
                source: 'healthkit' as WearableProvider,
                dataType: 'sleep' as HealthDataType,
                recordedAt: new Date(sample.startDate),
                value: durationMinutes,
                quality: this.getSleepQuality(durationMinutes),
                metadata: {
                    sleepType: sample.value, // 'asleep', 'inbed', 'awake'
                    startTime: sample.startDate,
                    endTime: sample.endDate,
                },
                rawData: sample,
            };
        });
    }

    private async fetchHRVData(
        plugin: HealthKitPlugin,
        startDate: Date,
        endDate: Date
    ): Promise<NormalizedHealthData[]> {
        const result = await plugin.queryQuantitySamples({
            sampleType: 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            unit: 'ms',
        });

        return result.samples.map((sample: HealthKitQuantitySample) => ({
            source: 'healthkit' as WearableProvider,
            dataType: 'hrv' as HealthDataType,
            recordedAt: new Date(sample.startDate),
            value: sample.quantity,
            quality: this.getHRVQuality(sample.quantity),
            rawData: sample,
        }));
    }

    private async fetchHeartRateData(
        plugin: HealthKitPlugin,
        startDate: Date,
        endDate: Date
    ): Promise<NormalizedHealthData[]> {
        const result = await plugin.queryQuantitySamples({
            sampleType: 'HKQuantityTypeIdentifierRestingHeartRate',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            unit: 'count/min',
        });

        return result.samples.map((sample: HealthKitQuantitySample) => ({
            source: 'healthkit' as WearableProvider,
            dataType: 'heart_rate' as HealthDataType,
            recordedAt: new Date(sample.startDate),
            value: sample.quantity,
            quality: this.getRestingHRQuality(sample.quantity),
            rawData: sample,
        }));
    }

    // ============================================================================
    // 辅助方法
    // ============================================================================

    private async getPlugin(): Promise<HealthKitPlugin> {
        if (this.plugin) {
            return this.plugin;
        }

        // 动态导入Capacitor HealthKit插件
        const { CapacitorHealthkit } = await import('@followathletics/capacitor-healthkit');
        const HealthKit = CapacitorHealthkit;
        this.plugin = HealthKit;
        return this.plugin;
    }

    private getSleepQuality(minutes: number): DataQuality {
        if (minutes >= 420 && minutes <= 540) return 'excellent'; // 7-9小时
        if (minutes >= 360) return 'good'; // 6小时+
        if (minutes >= 300) return 'fair'; // 5小时+
        return 'poor';
    }

    private getHRVQuality(ms: number): DataQuality {
        if (ms >= 60) return 'excellent';
        if (ms >= 40) return 'good';
        if (ms >= 25) return 'fair';
        return 'poor';
    }

    private getRestingHRQuality(bpm: number): DataQuality {
        if (bpm <= 55) return 'excellent';
        if (bpm <= 65) return 'good';
        if (bpm <= 75) return 'fair';
        return 'poor';
    }
}

// ============================================================================
// 类型定义（来自HealthKit插件）
// ============================================================================

interface HealthKitPlugin {
    isAvailable(): Promise<{ available: boolean }>;
    requestAuthorization(options: {
        read: string[];
        write: string[];
    }): Promise<void>;
    querySleep(options: {
        startDate: string;
        endDate: string;
    }): Promise<{ samples: HealthKitSleepSample[] }>;
    queryQuantitySamples(options: {
        sampleType: string;
        startDate: string;
        endDate: string;
        unit: string;
    }): Promise<{ samples: HealthKitQuantitySample[] }>;
}

interface HealthKitSleepSample {
    startDate: string;
    endDate: string;
    value: string; // 'asleep' | 'inbed' | 'awake'
    sourceBundle: string;
}

interface HealthKitQuantitySample {
    startDate: string;
    endDate: string;
    quantity: number;
    sourceBundle: string;
}

// 导出单例
export const healthKitBridge = new HealthKitBridge();
