'use client';

import React, { useEffect, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { PrivacyScreen } from '@capacitor-community/privacy-screen';
import { triggerHaptic } from '@/lib/haptics';
import { Lock } from 'lucide-react';
import { MotionButton } from '@/components/motion/MotionButton';

/**
 * BiometricGate
 * 
 * Protects private screens with biometric auth (iOS) and enables privacy screen blur.
 */
type BiometryType = 'face' | 'touch' | 'none' | 'unknown';

interface BiometricAuthPlugin {
    isAvailable(): Promise<{ available: boolean; biometryType?: BiometryType; error?: string | null }>;
    authenticate(options: { reason?: string }): Promise<{ success: boolean }>;
    cancel(): Promise<void>;
}

const BiometricAuth = registerPlugin<BiometricAuthPlugin>('BiometricAuth');

export function BiometricGate({
    children,
    enabled = true,
}: {
    children: React.ReactNode;
    enabled?: boolean;
}) {
    const [isLocked, setIsLocked] = useState(false);
    const [hasBiometrics, setHasBiometrics] = useState(false);
    const [shouldPrompt, setShouldPrompt] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [biometryType, setBiometryType] = useState<BiometryType>('unknown');
    const isNative = Capacitor.isNativePlatform();
    const isIos = Capacitor.getPlatform() === 'ios';
    const canUseBiometrics = enabled && isNative && isIos;

    useEffect(() => {
        if (!isNative) return;
        const updatePrivacy = async () => {
            try {
                if (enabled) {
                    await PrivacyScreen.enable();
                } else {
                    await PrivacyScreen.disable();
                }
            } catch (e) {
                console.warn('PrivacyScreen not supported', e);
            }
        };
        void updatePrivacy();
    }, [enabled, isNative]);

    useEffect(() => {
        if (!canUseBiometrics) return;
        let cancelled = false;

        const setup = async () => {
            try {
                const availability = await BiometricAuth.isAvailable();
                if (cancelled) return;
                const available = Boolean(availability?.available);
                setBiometryType(availability?.biometryType ?? 'unknown');
                if (available) {
                    setHasBiometrics(true);
                    setIsLocked(true);
                    setShouldPrompt(true);
                } else {
                    setHasBiometrics(false);
                    setIsLocked(false);
                }
            } catch (error) {
                console.warn('Biometric availability check failed', error);
                setHasBiometrics(false);
                setIsLocked(false);
            }
        };

        setup();
        return () => {
            cancelled = true;
        };
    }, [canUseBiometrics]);

    useEffect(() => {
        if (!canUseBiometrics || !hasBiometrics) return;
        const handleVisibility = () => {
            if (document.hidden) {
                setIsLocked(true);
                return;
            }
            if (isLocked) {
                setShouldPrompt(true);
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [canUseBiometrics, hasBiometrics, isLocked]);

    useEffect(() => {
        if (!shouldPrompt || !hasBiometrics) return;
        let cancelled = false;

        const run = async () => {
            setAuthError(null);
            try {
                await BiometricAuth.authenticate({ reason: 'Unlock AntiAnxiety' });
                if (cancelled) return;
                setIsLocked(false);
                await triggerHaptic.success();
            } catch (error) {
                if (cancelled) return;
                const message = error instanceof Error ? error.message : 'Authentication failed';
                setAuthError(message);
                setIsLocked(true);
                await triggerHaptic.error();
            } finally {
                if (!cancelled) {
                    setShouldPrompt(false);
                }
            }
        };

        void run();
        return () => {
            cancelled = true;
        };
    }, [hasBiometrics, shouldPrompt]);

    const unlock = async () => {
        await triggerHaptic.medium();
        setShouldPrompt(true);
    };

    if (!enabled || !isNative || !hasBiometrics) {
        return <>{children}</>;
    }

    if (isLocked) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-md p-6">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Lock className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Locked</h2>
                <p className="text-muted-foreground mb-8 text-center max-w-xs">
                    {biometryType === 'face' ? 'Use Face ID to continue.' : 'Use Touch ID to continue.'}
                </p>
                {authError && (
                    <p className="text-sm text-red-500 mb-4 text-center max-w-xs">
                        {authError}
                    </p>
                )}
                <MotionButton onClick={unlock} className="w-full max-w-xs h-12">
                    Unlock
                </MotionButton>
            </div>
        );
    }

    return <>{children}</>;
}
