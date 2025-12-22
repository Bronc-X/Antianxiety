'use client';

import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PrivacyScreen } from '@capacitor-community/privacy-screen';
import { triggerHaptic } from '@/lib/haptics';
import { Lock } from 'lucide-react';
import { MotionButton } from '@/components/motion/MotionButton';

/**
 * BiometricGate
 * 
 * Protects children content with a biometric lock (if available) or privacy screen.
 * For now, this is a visual gate that simulates the privacy protection.
 * In a real implementation, you would use @capacitor-community/native-biometric
 */
export function BiometricGate({ children }: { children: React.ReactNode }) {
    const [isLocked, setIsLocked] = useState(false); // Default to unlocked for now to avoid blocking dev
    const [isNative] = useState(() => Capacitor.isNativePlatform());

    useEffect(() => {
        if (isNative) {
            // Enable privacy screen (blur in multitasker)
            const enablePrivacy = async () => {
                try {
                    await PrivacyScreen.enable();
                } catch (e) {
                    console.warn('PrivacyScreen not supported', e);
                }
            };
            enablePrivacy();
        }
    }, [isNative]);

    const unlock = async () => {
        triggerHaptic.medium();
        setIsLocked(false);
        triggerHaptic.success();
    };

    if (isLocked) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-md p-6">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Lock className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Locked</h2>
                <p className="text-muted-foreground mb-8 text-center max-w-xs">
                    Use Touch ID or Face ID to access your journal.
                </p>
                <MotionButton onClick={unlock} className="w-full max-w-xs h-12">
                    Unlock
                </MotionButton>
            </div>
        );
    }

    return <>{children}</>;
}
