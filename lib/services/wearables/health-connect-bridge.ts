'use client';

import { Capacitor, registerPlugin } from '@capacitor/core';
import type { WearableProvider } from '@/types/wearable';

export type HealthPermission =
    | 'READ_STEPS'
    | 'READ_ACTIVE_CALORIES'
    | 'READ_RESTING_HEART_RATE'
    | 'READ_SLEEP'
    | 'READ_HRV';

export type LatestDataType =
    | 'steps'
    | 'active-calories'
    | 'resting-heart-rate'
    | 'sleep'
    | 'sleep-rem'
    | 'hrv';

interface QueryLatestSampleResponse {
    value?: number;
    timestamp: number;
    endTimestamp?: number;
    unit: string;
    metadata?: Record<string, unknown>;
}

interface HealthPlugin {
    isHealthAvailable(): Promise<{ available: boolean }>;
    requestHealthPermissions(options: { permissions: HealthPermission[] }): Promise<{ permissions: Record<string, boolean>[] }>;
    checkHealthPermissions(options: { permissions: HealthPermission[] }): Promise<{ permissions: Record<string, boolean>[] }>;
    queryLatestSample(options: { dataType: LatestDataType }): Promise<QueryLatestSampleResponse>;
    openHealthConnectSettings(): Promise<void>;
}

const HealthPlugin = registerPlugin<HealthPlugin>('HealthPlugin');

const REQUIRED_PERMISSIONS: HealthPermission[] = [
    'READ_SLEEP',
    'READ_HRV',
    'READ_STEPS',
    'READ_ACTIVE_CALORIES',
    'READ_RESTING_HEART_RATE',
];

export interface HealthConnectSnapshot {
    hrv?: number;
    resting_heart_rate?: number;
    sleep_minutes?: number;
    rem_sleep_minutes?: number;
    steps?: number;
    active_calories?: number;
    recorded_at?: string;
}

export class HealthConnectBridge {
    provider: WearableProvider = 'health_connect';

    async isAvailable(): Promise<boolean> {
        // 模拟环境支持
        if (process.env.NODE_ENV === 'development' || Capacitor.getPlatform() === 'web') {
            return true;
        }

        if (Capacitor.getPlatform() !== 'android') {
            return false;
        }

        try {
            const result = await HealthPlugin.isHealthAvailable();
            return Boolean(result?.available);
        } catch {
            return false;
        }
    }

    async requestAuthorization(): Promise<boolean> {
        // 模拟授权
        if (process.env.NODE_ENV === 'development' || Capacitor.getPlatform() === 'web') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return true;
        }

        try {
            await HealthPlugin.requestHealthPermissions({ permissions: REQUIRED_PERMISSIONS });
            return true;
        } catch (error) {
            console.error('Health Connect authorization failed:', error);
            return false;
        }
    }

    async fetchLatestSnapshot(): Promise<HealthConnectSnapshot> {
        // 模拟数据
        if (process.env.NODE_ENV === 'development' || Capacitor.getPlatform() === 'web') {
            return {
                hrv: 55 + Math.random() * 10,
                resting_heart_rate: 62 + Math.random() * 5,
                sleep_minutes: 450, // 7.5 hours
                rem_sleep_minutes: 90,
                steps: 7500 + Math.round(Math.random() * 2000),
                active_calories: 400 + Math.round(Math.random() * 100),
                recorded_at: new Date().toISOString(),
            };
        }

        const snapshot: HealthConnectSnapshot = {};
        let latestTimestamp = 0;

        const queries: Array<{ type: LatestDataType; key: keyof HealthConnectSnapshot }> = [
            { type: 'hrv', key: 'hrv' },
            { type: 'sleep', key: 'sleep_minutes' },
            { type: 'sleep-rem', key: 'rem_sleep_minutes' },
            { type: 'steps', key: 'steps' },
            { type: 'active-calories', key: 'active_calories' },
            { type: 'resting-heart-rate', key: 'resting_heart_rate' },
        ];

        const results = await Promise.allSettled(
            queries.map((query) => HealthPlugin.queryLatestSample({ dataType: query.type }))
        );

        results.forEach((result, index) => {
            if (result.status !== 'fulfilled') return;
            const data = result.value;
            if (typeof data?.value !== 'number') return;

            const key = queries[index].key;
            snapshot[key] = data.value;

            if (typeof data.timestamp === 'number') {
                latestTimestamp = Math.max(latestTimestamp, data.timestamp);
            }
        });

        if (latestTimestamp > 0) {
            snapshot.recorded_at = new Date(latestTimestamp).toISOString();
        }

        return snapshot;
    }

    async openSettings(): Promise<void> {
        try {
            await HealthPlugin.openHealthConnectSettings();
        } catch (error) {
            console.error('Failed to open Health Connect settings:', error);
        }
    }
}

export const healthConnectBridge = new HealthConnectBridge();
