import { registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

export interface DeepLinkPlugin {
  getLaunchUrl(): Promise<{ url?: string }>;
  addListener(
    eventName: 'urlOpen',
    listenerFunc: (event: { url: string }) => void
  ): Promise<PluginListenerHandle>;
}

export const DeepLink = registerPlugin<DeepLinkPlugin>('DeepLink');
