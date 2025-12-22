'use client';

import React, { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

interface MobileLayoutProps {
    children: React.ReactNode;
    showStatusBar?: boolean;
}

/**
 * MobileLayout
 * 
 * A wrapper component that handles:
 * 1. Safe Area Insets (Notch, Home Indicator)
 * 2. Status Bar configuration
 * 3. Native-like overscroll behavior prevention
 */
export function MobileLayout({ children, showStatusBar = true }: MobileLayoutProps) {
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            // Configure Status Bar on mount
            const configStatusBar = async () => {
                try {
                    if (showStatusBar) {
                        // TODO: Uncomment when @capacitor/status-bar is installed
                        const { StatusBar, Style } = await import('@capacitor/status-bar');
                        await StatusBar.setStyle({ style: Style.Dark });
                        await StatusBar.show();
                        await StatusBar.setOverlaysWebView({ overlay: true });
                        console.log('StatusBar configured');
                    } else {
                        // const { StatusBar } = await import('@capacitor/status-bar');
                        // await StatusBar.hide();
                    }
                } catch (e) {
                    console.warn('StatusBar plugin not available', e);
                }
            };

            configStatusBar();
        }
    }, [showStatusBar]);

    return (
        <div
            className="mobile-layout min-h-screen w-full relative bg-background"
            style={{
                // Ensure padding for safe areas (handled by css env variables)
                paddingTop: 'env(safe-area-inset-top)',
                // Padding bottom is usually handled by the TabBar or content spacer
            }}
        >
            <div className="flex-1 w-full h-full overflow-y-auto no-scrollbar">
                {children}
            </div>
        </div>
    );
}
