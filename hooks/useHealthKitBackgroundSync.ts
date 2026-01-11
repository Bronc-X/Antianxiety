'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { healthKitBridge } from '@/lib/services/wearables/healthkit-bridge';
import { syncHealthKitData } from '@/lib/services/wearables/client-sync';

const LAST_SYNC_KEY = 'healthkit-background-last-sync';

function readLastSync(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(LAST_SYNC_KEY);
}

function writeLastSync(timestamp: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LAST_SYNC_KEY, timestamp);
}

export function useHealthKitBackgroundSync(options: { minIntervalMinutes?: number } = {}): void {
  const minIntervalMinutes = options.minIntervalMinutes ?? 120;

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'ios') return;

    let listener: { remove: () => void } | null = null;
    let cancelled = false;

    const shouldSync = (timestamp: string): boolean => {
      const lastSync = readLastSync();
      if (!lastSync) return true;
      const lastSyncTime = Date.parse(lastSync);
      if (Number.isNaN(lastSyncTime)) return true;
      const minIntervalMs = minIntervalMinutes * 60 * 1000;
      if (Date.now() - lastSyncTime < minIntervalMs) return false;
      const eventTime = Date.parse(timestamp);
      if (Number.isNaN(eventTime)) return true;
      return eventTime > lastSyncTime;
    };

    const handleSync = async (timestamp: string) => {
      if (!shouldSync(timestamp)) return;
      const result = await syncHealthKitData();
      if (result.success) {
        writeLastSync(timestamp);
        await healthKitBridge.clearBackgroundUpdate();
      }
    };

    const setup = async () => {
      const available = await healthKitBridge.isAvailable();
      if (!available || cancelled) return;
      const authorized = await healthKitBridge.requestAuthorization();
      if (!authorized || cancelled) return;

      await healthKitBridge.enableBackgroundDelivery();

      const lastUpdate = await healthKitBridge.getLastBackgroundUpdate();
      if (lastUpdate && !cancelled) {
        await handleSync(lastUpdate);
      }

      listener = await healthKitBridge.addBackgroundUpdateListener((event) => {
        if (event?.timestamp) {
          void handleSync(event.timestamp);
        }
      });
    };

    setup();

    return () => {
      cancelled = true;
      listener?.remove();
    };
  }, [minIntervalMinutes]);
}
