'use client';

export type HardwareSyncSource = 'healthkit' | 'health_connect';

export interface HardwareSyncPayload {
    hrv?: number;
    resting_heart_rate?: number;
    sleep_score?: number;
    sleep_minutes?: number;
    deep_sleep_minutes?: number;
    rem_sleep_minutes?: number;
    light_sleep_minutes?: number;
    steps?: number;
    active_calories?: number;
    recorded_at?: string;
}

export async function syncHardwareData(
    source: HardwareSyncSource,
    data: HardwareSyncPayload
): Promise<{ success: boolean } | null> {
    const response = await fetch('/api/user/hardware-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, data }),
    });

    if (!response.ok) {
        throw new Error('Hardware sync failed');
    }

    return response.json();
}
