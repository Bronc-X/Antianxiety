'use client';

import React from 'react';
import { motion, PanInfo } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { triggerHaptic } from '@/lib/haptics';

interface SwipeGoBackProps {
    children: React.ReactNode;
    disabled?: boolean;
}

const SWIPE_THRESHOLD = 100;

export function SwipeGoBack({ children, disabled = false }: SwipeGoBackProps) {
    const router = useRouter();

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (disabled) return;

        // Check if swipe started from the left edge (approx 30px)
        // Framer motion doesn't give start point easily in PanInfo, so we rely on offset
        // This is a simplified version. A robust version needs touch start tracking.
        // For now, checks if we dragged enough to the right
        if (info.offset.x > SWIPE_THRESHOLD && info.velocity.x > 0) {
            triggerHaptic.selection();
            router.back();
        }
    };

    return (
        <motion.div
            className="w-full h-full"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ right: 0.2, left: 0 }} // Only allow elastic drag to the right
            onDragEnd={handleDragEnd}
        >
            {children}
        </motion.div>
    );
}
