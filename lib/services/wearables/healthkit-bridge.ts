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
        // 在开发环境或非iOS环境下，允许使用模拟数据进行演示
        if (process.env.NODE_ENV === 'development' || Capacitor.getPlatform() === 'web') {
            return true;
        }

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
        // 模拟授权
        if (process.env.NODE_ENV === 'development' || Capacitor.getPlatform() === 'web') {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟延迟
            return true;
        }

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
        dataTypes: HealthDataType[] = ['sleep', 'hrv', 'heart_rate', 'steps', 'active_calories']
    ): Promise<NormalizedHealthData[]> {
        // 模拟数据生成
        if (process.env.NODE_ENV === 'development' || Capacitor.getPlatform() === 'web') {
            return this.generateMockData(startDate, endDate, dataTypes);
        }

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

        if (dataTypes.includes('steps')) {
            const stepData = await this.fetchStepsData(plugin, startDate, endDate);
            results.push(...stepData);
        }

        if (dataTypes.includes('active_calories')) {
            const calorieData = await this.fetchActiveEnergyData(plugin, startDate, endDate);
            results.push(...calorieData);
        }

        return results;
    }

    private generateMockData(startDate: Date, endDate: Date, dataTypes: HealthDataType[]): NormalizedHealthData[] {
        const results: NormalizedHealthData[] = [];
        const now = new Date();
        const baseTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24小时前

        if (dataTypes.includes('sleep')) {
            const sleepDuration = 7.5 * 60; // 7.5小时
            results.push({
                source: 'healthkit',
                dataType: 'sleep',
                recordedAt: now,
                value: sleepDuration,
                quality: 'good',
                metadata: { sleepType: 'asleep' }
            });
        }

        if (dataTypes.includes('hrv')) {
            // 生成几个 HRV 样本
            for (let i = 0; i < 5; i++) {
                const time = new Date(baseTime.getTime() + i * 4 * 60 * 60 * 1000);
                const hrv = 45 + Math.random() * 20; // 45-65ms
                results.push({
                    source: 'healthkit',
                    dataType: 'hrv',
                    recordedAt: time,
                    value: Math.round(hrv),
                    quality: this.getHRVQuality(hrv)
                });
            }
        }

        if (dataTypes.includes('heart_rate')) {
            const hr = 60 + Math.random() * 10;
            results.push({
                source: 'healthkit',
                dataType: 'heart_rate',
                recordedAt: now,
                value: Math.round(hr),
                quality: 'good'
            });
        }

        if (dataTypes.includes('steps')) {
            const steps = 5000 + Math.random() * 5000;
            results.push({
                source: 'healthkit',
                dataType: 'steps',
                recordedAt: now,
                value: Math.round(steps)
            });
        }

        if (dataTypes.includes('active_calories')) {
            const cals = 300 + Math.random() * 200;
            results.push({
                source: 'healthkit',
                dataType: 'active_calories',
                recordedAt: now,
                value: Math.round(cals)
            });
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

        return result.samples
            .filter((sample: HealthKitSleepSample) => sample.value === 'asleep')
            .map((sample: HealthKitSleepSample) => {
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

    private async fetchStepsData(
        plugin: HealthKitPlugin,
        startDate: Date,
        endDate: Date
    ): Promise<NormalizedHealthData[]> {
        const result = await plugin.queryQuantitySamples({
            sampleType: 'HKQuantityTypeIdentifierStepCount',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            unit: 'count',
        });

        return result.samples.map((sample: HealthKitQuantitySample) => ({
            source: 'healthkit' as WearableProvider,
            dataType: 'steps' as HealthDataType,
            recordedAt: new Date(sample.startDate),
            value: sample.quantity,
            rawData: sample,
        }));
    }

    private async fetchActiveEnergyData(
        plugin: HealthKitPlugin,
        startDate: Date,
        endDate: Date
    ): Promise<NormalizedHealthData[]> {
        const result = await plugin.queryQuantitySamples({
            sampleType: 'HKQuantityTypeIdentifierActiveEnergyBurned',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            unit: 'kcal',
        });

        return result.samples.map((sample: HealthKitQuantitySample) => ({
            source: 'healthkit' as WearableProvider,
            dataType: 'active_calories' as HealthDataType,
            recordedAt: new Date(sample.startDate),
            value: sample.quantity,
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
        // 使用 try-catch 处理模块不存在的情况（服务端构建时）
        try {

            const mod = require('@followathletics/capacitor-healthkit');
            const HealthKit = mod.CapacitorHealthkit;
            this.plugin = HealthKit;
            return this.plugin;
        } catch {
            // 在服务端或模块不存在时返回一个空的mock
            throw new Error('HealthKit plugin is only available on iOS devices');
        }
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
