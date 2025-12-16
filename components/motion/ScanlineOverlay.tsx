'use client';

import React from 'react';

interface ScanlineOverlayProps {
    opacity?: number;
}

export default function ScanlineOverlay({ opacity = 0.05 }: ScanlineOverlayProps) {
    return (
        <div
            className="pointer-events-none absolute inset-0 z-50 overflow-hidden h-full w-full"
            style={{ opacity }}
        >
            {/* Scanlines */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)",
                    backgroundSize: "100% 4px"
                }}
            />

            {/* Moving scan bar */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent w-full h-32 animate-scan" style={{ animationDuration: '3s', animationIterationCount: 'infinite', animationTimingFunction: 'linear' }} />

            <style jsx>{`
                @keyframes scan {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100vh); }
                }
                .animate-scan {
                    animation-name: scan;
                }
            `}</style>
        </div>
    );
}
