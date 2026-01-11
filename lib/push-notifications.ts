'use client';

import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import {
  PushNotifications,
  type ActionPerformed,
  type PushNotificationSchema,
  type Token
} from '@capacitor/push-notifications';
import { Preferences } from '@capacitor/preferences';

const PUSH_ENABLED_KEY = 'push.enabled';
const PUSH_TOKEN_KEY = 'push.token';
const DEFAULT_PUSH_ENABLED = true;

export type PushPermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

const isIosNative = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

let listenersBound = false;
let listenerHandles: PluginListenerHandle[] = [];

export interface PushListenerOptions {
  onToken?: (token: string) => void;
  onNotification?: (notification: PushNotificationSchema) => void;
  onAction?: (action: ActionPerformed) => void;
  onError?: (message: string) => void;
}

async function ensurePermission(): Promise<PushPermissionState> {
  const status = await PushNotifications.checkPermissions();
  let permission = status.receive as PushPermissionState;

  if (permission === 'prompt') {
    const request = await PushNotifications.requestPermissions();
    permission = request.receive as PushPermissionState;
  }

  return permission;
}

async function disablePushNotifications(): Promise<void> {
  try {
    await PushNotifications.unregister();
  } catch (error) {
    console.warn('Push notification unregister failed:', error);
  }

  await Preferences.remove({ key: PUSH_TOKEN_KEY });
}

export async function initializePushNotifications(
  options: PushListenerOptions = {}
): Promise<() => void> {
  if (!isIosNative()) return () => {};
  if (listenersBound) return () => {};

  listenersBound = true;
  listenerHandles = [
    await PushNotifications.addListener('registration', async (token: Token) => {
      await Preferences.set({ key: PUSH_TOKEN_KEY, value: token.value });
      options.onToken?.(token.value);
    }),
    await PushNotifications.addListener('registrationError', (error) => {
      const message = error?.error ?? 'Push notification registration failed';
      options.onError?.(message);
    }),
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      options.onNotification?.(notification);
    }),
    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      options.onAction?.(action);
    })
  ];

  return async () => {
    const handles = listenerHandles.slice();
    listenerHandles = [];
    listenersBound = false;
    await Promise.all(handles.map((handle) => handle.remove()));
  };
}

export async function getPushEnabled(): Promise<boolean> {
  if (!isIosNative()) return false;
  const stored = await Preferences.get({ key: PUSH_ENABLED_KEY });
  if (stored.value === null) {
    return DEFAULT_PUSH_ENABLED;
  }
  return stored.value === 'true';
}

export async function setPushEnabled(enabled: boolean): Promise<PushPermissionState> {
  if (!isIosNative()) return 'unsupported';

  if (!enabled) {
    await Preferences.set({ key: PUSH_ENABLED_KEY, value: 'false' });
    await disablePushNotifications();
    return 'granted';
  }

  const permission = await ensurePermission();
  if (permission !== 'granted') {
    await Preferences.set({ key: PUSH_ENABLED_KEY, value: 'false' });
    return permission;
  }

  await Preferences.set({ key: PUSH_ENABLED_KEY, value: 'true' });
  await PushNotifications.register();
  return permission;
}

export async function getPushToken(): Promise<string | null> {
  if (!isIosNative()) return null;
  const stored = await Preferences.get({ key: PUSH_TOKEN_KEY });
  return stored.value ?? null;
}
