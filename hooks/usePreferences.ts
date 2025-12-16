'use client';

/**
 * usePreferences Hook - Capacitor Preferences storage
 * Requirements: 5.2
 * 
 * Provides key-value storage with JSON serialization support
 */

import { useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';

export interface UsePreferencesReturn {
  /**
   * Get a value from preferences
   * @param key - The key to retrieve
   * @returns The stored value or null if not found
   */
  get: (key: string) => Promise<string | null>;
  /**
   * Set a value in preferences
   * @param key - The key to store
   * @param value - The value to store
   */
  set: (key: string, value: string) => Promise<void>;
  /**
   * Remove a value from preferences
   * @param key - The key to remove
   */
  remove: (key: string) => Promise<void>;
  /**
   * Clear all preferences
   */
  clear: () => Promise<void>;
  /**
   * Get all keys in preferences
   */
  keys: () => Promise<string[]>;
  /**
   * Get a JSON-parsed value from preferences
   * @param key - The key to retrieve
   * @returns The parsed value or null if not found
   */
  getJSON: <T>(key: string) => Promise<T | null>;
  /**
   * Set a JSON-stringified value in preferences
   * @param key - The key to store
   * @param value - The value to store (will be JSON stringified)
   */
  setJSON: <T>(key: string, value: T) => Promise<void>;
}

/**
 * Custom hook for Capacitor Preferences storage
 * Provides get/set methods with JSON serialization support
 */
export function usePreferences(): UsePreferencesReturn {
  const get = useCallback(async (key: string): Promise<string | null> => {
    try {
      const { value } = await Preferences.get({ key });
      return value;
    } catch (error) {
      console.warn('Preferences get failed:', error);
      return null;
    }
  }, []);

  const set = useCallback(async (key: string, value: string): Promise<void> => {
    try {
      await Preferences.set({ key, value });
    } catch (error) {
      console.warn('Preferences set failed:', error);
    }
  }, []);

  const remove = useCallback(async (key: string): Promise<void> => {
    try {
      await Preferences.remove({ key });
    } catch (error) {
      console.warn('Preferences remove failed:', error);
    }
  }, []);

  const clear = useCallback(async (): Promise<void> => {
    try {
      await Preferences.clear();
    } catch (error) {
      console.warn('Preferences clear failed:', error);
    }
  }, []);

  const keys = useCallback(async (): Promise<string[]> => {
    try {
      const { keys: allKeys } = await Preferences.keys();
      return allKeys;
    } catch (error) {
      console.warn('Preferences keys failed:', error);
      return [];
    }
  }, []);

  const getJSON = useCallback(async <T>(key: string): Promise<T | null> => {
    try {
      const { value } = await Preferences.get({ key });
      if (value === null) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.warn('Preferences getJSON failed:', error);
      return null;
    }
  }, []);

  const setJSON = useCallback(async <T>(key: string, value: T): Promise<void> => {
    try {
      await Preferences.set({ key, value: JSON.stringify(value) });
    } catch (error) {
      console.warn('Preferences setJSON failed:', error);
    }
  }, []);

  return {
    get,
    set,
    remove,
    clear,
    keys,
    getJSON,
    setJSON,
  };
}

export default usePreferences;
