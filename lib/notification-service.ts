/**
 * Local Notification Service for Daily Calibration
 * Uses @capacitor/local-notifications for mobile push
 */

import { Capacitor } from '@capacitor/core';

// Dynamic import for Capacitor plugins (only on native)
let LocalNotifications: any = null;

async function getLocalNotifications() {
  if (LocalNotifications) return LocalNotifications;
  if (Capacitor.isNativePlatform()) {
    const localNotificationsModule = await import('@capacitor/local-notifications');
    LocalNotifications = localNotificationsModule.LocalNotifications;
  }
  return LocalNotifications;
}

export const CALIBRATION_NOTIFICATION_ID = 1001;

export interface NotificationConfig {
  checkinTime: string; // "HH:mm" format
  enabled: boolean;
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const LN = await getLocalNotifications();
  if (!LN) return false;

  try {
    const result = await LN.requestPermissions();
    return result.display === 'granted';
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
}

/**
 * Schedule daily calibration notification
 */
export async function scheduleDailyCalibration(config: NotificationConfig): Promise<boolean> {
  const LN = await getLocalNotifications();
  if (!LN) {
    console.log('Local notifications not available (web platform)');
    return false;
  }

  try {
    // Cancel existing notification first
    await cancelDailyCalibration();

    if (!config.enabled) {
      return true;
    }

    const [hours, minutes] = config.checkinTime.split(':').map(Number);

    // Schedule recurring daily notification
    await LN.schedule({
      notifications: [
        {
          id: CALIBRATION_NOTIFICATION_ID,
          title: '⚡ Bio-Voltage 校准',
          body: '该校准今日电压了',
          schedule: {
            on: {
              hour: hours,
              minute: minutes,
            },
            repeats: true,
            allowWhileIdle: true,
          },
          sound: 'default',
          smallIcon: 'ic_stat_icon_config_sample',
          iconColor: '#0B3D2E',
          actionTypeId: 'OPEN_CALIBRATION',
        },
      ],
    });

    console.log(`Daily calibration scheduled for ${config.checkinTime}`);
    return true;
  } catch (error) {
    console.error('Failed to schedule notification:', error);
    return false;
  }
}

/**
 * Cancel daily calibration notification
 */
export async function cancelDailyCalibration(): Promise<void> {
  const LN = await getLocalNotifications();
  if (!LN) return;

  try {
    await LN.cancel({ notifications: [{ id: CALIBRATION_NOTIFICATION_ID }] });
  } catch (error) {
    console.error('Failed to cancel notification:', error);
  }
}

/**
 * Check if notifications are enabled
 */
export async function checkNotificationStatus(): Promise<boolean> {
  const LN = await getLocalNotifications();
  if (!LN) return false;

  try {
    const result = await LN.checkPermissions();
    return result.display === 'granted';
  } catch (error) {
    return false;
  }
}

/**
 * Register notification action handlers
 */
export async function registerNotificationHandlers(
  onCalibrationOpen: () => void
): Promise<void> {
  const LN = await getLocalNotifications();
  if (!LN) return;

  try {
    // Register action types
    await LN.registerActionTypes({
      types: [
        {
          id: 'OPEN_CALIBRATION',
          actions: [
            {
              id: 'open',
              title: '开始校准',
            },
            {
              id: 'dismiss',
              title: '稍后',
              destructive: true,
            },
          ],
        },
      ],
    });

    // Listen for notification actions
    LN.addListener('localNotificationActionPerformed', (notification: any) => {
      if (notification.notification.id === CALIBRATION_NOTIFICATION_ID) {
        if (notification.actionId === 'open' || notification.actionId === 'tap') {
          onCalibrationOpen();
        }
      }
    });
  } catch (error) {
    console.error('Failed to register notification handlers:', error);
  }
}
