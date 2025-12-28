'use client';

import type { NormalizedHealthData } from '@/types/wearable';
import { healthKitBridge } from '@/lib/services/wearables/healthkit-bridge';
import { healthConnectBridge } from '@/lib/services/wearables/health-connect-bridge';
import { syncHardwareData, type HardwareSyncPayload } from '@/lib/services/wearables/hardware-sync';

export type SyncErrorCode = 'unavailable' | 'permission' | 'no_data' | 'sync_failed';

export interface SyncResult {
    success: boolean;
    error?: SyncErrorCode;
}

const DEFAULT_DAYS_BACK = 2;

function getLatestValue(records: NormalizedHealthData[]): number | null {
    const latest = records.reduce<NormalizedHealthData | null>((acc, record) => {
        if (!acc) return record;
        return record.recordedAt.getTime() > acc.recordedAt.getTime() ? record : acc;
    }, null);

    if (!latest || typeof latest.value !== 'number') return null;
    return latest.value;
}

function sumLatestByDate(records: NormalizedHealthData[]): { date: string; value: number } | null {
    const totals = new Map<string, number>();

    records.forEach((record) => {
        if (typeof record.value !== 'number') return;
        const dateKey = record.recordedAt.toISOString().split('T')[0];
        totals.set(dateKey, (totals.get(dateKey) ?? 0) + record.value);
    });

    if (totals.size === 0) return null;

    const latestDate = Array.from(totals.keys()).sort().pop();
    if (!latestDate) return null;

    return { date: latestDate, value: totals.get(latestDate) ?? 0 };
}

function getLatestTimestamp(records: NormalizedHealthData[]): number {
    return records.reduce((max, record) => Math.max(max, record.recordedAt.getTime()), 0);
}

export async function syncHealthKitData(daysBack: number = DEFAULT_DAYS_BACK): Promise<SyncResult> {
    const available = await healthKitBridge.isAvailable();
    if (!available) {
        return { success: false, error: 'unavailable' };
    }

    const authorized = await healthKitBridge.requestAuthorization();
    if (!authorized) {
        return { success: false, error: 'permission' };
    }

    try {
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - daysBack);

        const data = await healthKitBridge.fetchData(startDate, endDate, [
            'sleep',
            'hrv',
            'heart_rate',
            'steps',
            'active_calories',
        ]);

        if (!data.length) {
            return { success: false, error: 'no_data' };
        }

        const sleepRecords = data.filter((record) => record.dataType === 'sleep');
        const hrvRecords = data.filter((record) => record.dataType === 'hrv');
        const hrRecords = data.filter((record) => record.dataType === 'heart_rate');
        const stepRecords = data.filter((record) => record.dataType === 'steps');
        const calorieRecords = data.filter((record) => record.dataType === 'active_calories');

        const sleepSummary = sumLatestByDate(sleepRecords);
        const stepSummary = sumLatestByDate(stepRecords);
        const calorieSummary = sumLatestByDate(calorieRecords);

        const payload: HardwareSyncPayload = {
            hrv: getLatestValue(hrvRecords) ?? undefined,
            resting_heart_rate: getLatestValue(hrRecords) ?? undefined,
            sleep_minutes: typeof sleepSummary?.value === 'number' ? Math.round(sleepSummary.value) : undefined,
            steps: typeof stepSummary?.value === 'number' ? Math.round(stepSummary.value) : undefined,
            active_calories: typeof calorieSummary?.value === 'number' ? Math.round(calorieSummary.value) : undefined,
        };

        const latestTimestamp = getLatestTimestamp(data);
        if (latestTimestamp > 0) {
            payload.recorded_at = new Date(latestTimestamp).toISOString();
        }

        const hasPayload = Object.entries(payload).some(([key, value]) => key !== 'recorded_at' && value !== undefined);
        if (!hasPayload) {
            return { success: false, error: 'no_data' };
        }

        await syncHardwareData('healthkit', payload);
        return { success: true };
    } catch (error) {
        console.error('HealthKit sync failed:', error);
        return { success: false, error: 'sync_failed' };
    }
}

export async function syncHealthConnectData(): Promise<SyncResult> {
    const available = await healthConnectBridge.isAvailable();
    if (!available) {
        return { success: false, error: 'unavailable' };
    }

    const authorized = await healthConnectBridge.requestAuthorization();
    if (!authorized) {
        return { success: false, error: 'permission' };
    }

    try {
        const snapshot = await healthConnectBridge.fetchLatestSnapshot();
        const hasPayload = Object.entries(snapshot).some(([key, value]) => key !== 'recorded_at' && value !== undefined);

        if (!hasPayload) {
            return { success: false, error: 'no_data' };
        }

        await syncHardwareData('health_connect', snapshot);
        return { success: true };
    } catch (error) {
        console.error('Health Connect sync failed:', error);
        return { success: false, error: 'sync_failed' };
    }
}
