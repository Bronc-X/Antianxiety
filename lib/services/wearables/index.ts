/**
 * Wearable Services Index
 * 穿戴设备服务统一入口
 */

export * from './fitbit-connector';
export * from './oura-connector';
export * from './healthkit-bridge';
export * from './data-normalizer';

import type { WearableConnector, WearableProvider } from '@/types/wearable';
import { fitbitConnector } from './fitbit-connector';
import { ouraConnector } from './oura-connector';
import { healthKitBridge } from './healthkit-bridge';

/**
 * 获取指定提供商的连接器
 */
export function getConnector(provider: WearableProvider): WearableConnector | null {
    switch (provider) {
        case 'fitbit':
            return fitbitConnector;
        case 'oura':
            return ouraConnector;
        case 'health_connect':
            // TODO: 通过Capacitor插件桥接
            console.warn('Health Connect connector not implemented yet');
            return null;
        case 'healthkit':
            // HealthKit uses client-side bridge on iOS
            // Use healthKitBridge directly for iOS platform
            return null;
        default:
            return null;
    }
}

/**
 * 获取所有可用的连接器列表
 */
export function getAvailableProviders(): WearableProvider[] {
    const providers: WearableProvider[] = [];

    if (process.env.FITBIT_CLIENT_ID) {
        providers.push('fitbit');
    }

    if (process.env.OURA_CLIENT_ID) {
        providers.push('oura');
    }

    // Health Connect在Android平台可用
    // HealthKit在iOS平台可用
    // 这些在运行时根据平台检测

    return providers;
}
