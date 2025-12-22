'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { triggerHaptic } from '@/lib/haptics';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
}

const PULL_THRESHOLD = 100;

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const y = useMotionValue(0);
    const pullProgress = useTransform(y, [0, PULL_THRESHOLD], [0, 100]);
    const rotate = useTransform(y, [0, PULL_THRESHOLD], [0, 360]);

    // Custom spring for the bounce back
    const bounceTransition = {
        type: "spring",
        damping: 20,
        stiffness: 300
    };

    const handlePanEnd = async (_: any, info: any) => {
        if (y.get() > PULL_THRESHOLD) {
            // Trigger refresh
            setIsRefreshing(true);
            triggerHaptic.medium(); // Haptic feedback on trigger

            // Snap to loading position
            // Using animate on the motion value directly
            // @ts-ignore - Framer Motion animate overload signature mismatch in linter
            animate(y, 60, bounceTransition);

            try {
                await onRefresh();
                triggerHaptic.success();
            } finally {
                setTimeout(() => {
                    setIsRefreshing(false);
                    // Bounce back
                    // @ts-ignore
                    animate(y, 0, bounceTransition);
                }, 500); // Minimum showing time
            }
        } else {
            // Bounce back if not pulled enough
            // @ts-ignore
            animate(y, 0, bounceTransition);
        }
    };

    const handlePan = (_: any, info: any) => {
        // Only pull if we are at the top of the scroll
        if (window.scrollY <= 0 && info.offset.y > 0 && !isRefreshing) {
            // Resistance effect
            const newY = info.offset.y * 0.4;
            y.set(newY);

            // Haptic tick when engaging
            if (newY > 10 && newY < 15) {
                // triggerHaptic.selection(); 
            }
        }
    };

    return (
        <div
            className="relative w-full min-h-screen"
            ref={containerRef}
        >
            <motion.div
                className="absolute top-0 left-0 w-full flex justify-center items-start pt-4 pointer-events-none z-10"
                style={{ opacity: useTransform(y, [0, 20], [0, 1]) }}
            >
                <div className="relative flex items-center justify-center w-10 h-10 bg-background/80 backdrop-blur rounded-full shadow-sm border">
                    <motion.div
                        style={{ rotate }}
                        className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full"
                        animate={isRefreshing ? { rotate: 360 } : { rotate: y.get() * 2 }}
                        transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: 'linear' } : undefined}
                    />
                </div>
            </motion.div>

            <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }} // We handle movement manually via onPan
                dragElastic={0} // Disable default elasticity
                onPan={handlePan}
                onPanEnd={handlePanEnd}
                style={{ y }}
                className="w-full relative touch-pan-y"
            >
                {children}
            </motion.div>
        </div>
    );
}
