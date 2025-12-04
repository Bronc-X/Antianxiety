'use client';

/**
 * useNetwork Hook - Capacitor Network status
 * Requirements: 5.3
 * 
 * Monitors network status changes and returns online/offline state
 */

import { useState, useEffect, useCallback } from 'react';
import { Network, ConnectionStatus, ConnectionType } from '@capacitor/network';

export interface NetworkStatus {
  /**
   * Whether the device is connected to the network
   */
  isOnline: boolean;
  /**
   * The type of network connection
   */
  connectionType: ConnectionType;
}

export interface UseNetworkReturn extends NetworkStatus {
  /**
   * Manually refresh the network status
   */
  refresh: () => Promise<void>;
}

/**
 * Custom hook for monitoring Capacitor Network status
 * Listens for network status changes and returns current state
 */
export function useNetwork(): UseNetworkReturn {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: true,
    connectionType: 'unknown' as ConnectionType,
  });

  const updateStatus = useCallback((connectionStatus: ConnectionStatus) => {
    setStatus({
      isOnline: connectionStatus.connected,
      connectionType: connectionStatus.connectionType,
    });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const currentStatus = await Network.getStatus();
      updateStatus(currentStatus);
    } catch (error) {
      console.warn('Network status refresh failed:', error);
    }
  }, [updateStatus]);

  useEffect(() => {
    // Get initial status
    Network.getStatus()
      .then(updateStatus)
      .catch((error) => {
        console.warn('Failed to get initial network status:', error);
      });

    // Listen for status changes
    const listener = Network.addListener('networkStatusChange', updateStatus);

    return () => {
      listener.then((handle) => handle.remove()).catch(console.warn);
    };
  }, [updateStatus]);

  return {
    ...status,
    refresh,
  };
}

export type { ConnectionType };
export default useNetwork;
