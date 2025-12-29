'use client';

/**
 * Subdomain Detection Utilities
 * 
 * Detects which language version the user is on:
 * - zh.antianxiety.app -> Chinese version (WeChat login)
 * - en.antianxiety.app -> English version (GitHub/X/Reddit/Phone/Email login)
 */

export type AppRegion = 'zh' | 'en';

/**
 * Get the current app region based on hostname
 * Works on both client and server side
 */
export function getAppRegion(hostname?: string): AppRegion {
    const host = hostname || (typeof window !== 'undefined' ? window.location.hostname : '');

    // 1. Subdomain Check (Highest Priority)
    // If the user explicitly visits zh.antianxiety.app, they want Chinese.
    if (host.startsWith('zh.') || host.includes('zh.localhost')) {
        return 'zh';
    }
    if (host.startsWith('en.') || host.includes('en.localhost')) {
        return 'en';
    }

    // 2. Client-side: Check cookie (User Preference)
    if (typeof document !== 'undefined') {
        const match = document.cookie.match(new RegExp('(?:^|; )NEXT_LOCALE=([^;]*)'));
        const cookieVal = match ? decodeURIComponent(match[1]) : null;
        if (cookieVal === 'zh' || cookieVal === 'en') return cookieVal;
    }

    // 3. Default: check browser language
    if (typeof navigator !== 'undefined') {
        const lang = navigator.language.toLowerCase();
        return lang.startsWith('zh') ? 'zh' : 'en';
    }

    // 4. Server-side / Fallback
    return 'en';
}

/**
 * Check if current region is Chinese version
 */
export function isChineseVersion(hostname?: string): boolean {
    return getAppRegion(hostname) === 'zh';
}

/**
 * Check if current region is English version
 */
export function isEnglishVersion(hostname?: string): boolean {
    return getAppRegion(hostname) === 'en';
}

/**
 * React hook to get current app region
 * Re-renders when hostname changes (useful for dev tools)
 */
import { useState, useEffect } from 'react';

export function useAppRegion(): AppRegion {
    const [region, setRegion] = useState<AppRegion>('en');

    useEffect(() => {
        setRegion(getAppRegion());
    }, []);

    return region;
}

/**
 * Get available auth providers for the current region
 */
export interface AuthProvider {
    id: string;
    name: string;
    nameZh: string;
    icon: string;
    enabled: boolean;
}

export function getAuthProviders(region: AppRegion): AuthProvider[] {
    if (region === 'zh') {
        return [
            { id: 'wechat', name: 'WeChat', nameZh: '微信', icon: 'wechat', enabled: true },
        ];
    }

    // English version
    return [
        { id: 'email', name: 'Email', nameZh: '邮箱', icon: 'mail', enabled: true },
        { id: 'github', name: 'GitHub', nameZh: 'GitHub', icon: 'github', enabled: true },
        { id: 'twitter', name: 'X (Twitter)', nameZh: 'X (推特)', icon: 'twitter', enabled: true },
        { id: 'reddit', name: 'Reddit', nameZh: 'Reddit', icon: 'reddit', enabled: true },
        { id: 'phone', name: 'Phone', nameZh: '手机号', icon: 'phone', enabled: true },
    ];
}
