'use client';

import React from 'react';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MaxAvatarProps {
    className?: string;
    state?: 'boot' | 'idle' | 'thinking';
    size?: number;
}

export default function MaxAvatar({
    className,
    state = 'idle',
    size = 40
}: MaxAvatarProps) {

    // Animation Variants
    const containerVariants: Variants = {
        boot: {
            scale: [0, 1.1, 1],
            rotate: [-180, 10, 0],
            opacity: [0, 1, 1],
            filter: ["blur(10px)", "blur(0px)", "blur(0px)"],
            transition: { duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }
        },
        idle: {
            y: [0, -3, 0],
            transition: {
                duration: 6,
                ease: "easeInOut",
                repeat: Infinity
            }
        },
        thinking: {
            scale: [0.98, 1.02, 0.98],
            filter: "brightness(1.05)",
            boxShadow: "0 0 15px rgba(60, 160, 220, 0.3)",
            transition: {
                duration: 1.2,
                ease: "easeInOut",
                repeat: Infinity
            }
        }
    };

    const energyScanVariants: Variants = {
        idle: {
            opacity: 0.1,
            rotate: 360,
            transition: { duration: 10, ease: "linear", repeat: Infinity }
        },
        thinking: {
            opacity: 1,
            rotate: 360,
            scale: 1.5,
            transition: { duration: 1.5, ease: "linear", repeat: Infinity }
        }
    };

    const coreVariants: Variants = {
        idle: {
            opacity: 0,
        },
        thinking: {
            opacity: [0.3, 0.7, 0.3],
            scale: [0.8, 1.1, 0.8],
            transition: { duration: 0.2, repeat: Infinity, repeatType: "reverse" } // "alternate" in CSS maps to repeatType: "reverse"
        }
    };

    return (
        <div
            className={cn("relative flex items-center justify-center select-none rounded-full", className)}
            style={{ width: size, height: size }}
        >
            <motion.div
                className="relative w-full h-full rounded-full overflow-hidden bg-white shadow-md z-10 origin-center"
                initial={false}
                animate={state}
                variants={containerVariants}
            >
                {/* Internal Energy Scan */}
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] z-[2] mix-blend-overlay pointer-events-none"
                    style={{
                        background: 'conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0) 10%, rgba(0,190,255,0.4) 40%, rgba(255,255,255,0.8) 50%, rgba(0,190,255,0.4) 60%, rgba(255,255,255,0) 90%)'
                    }}
                    animate={state === 'boot' ? 'idle' : state} // Use idle animation for boot phase to avoid jumps
                    variants={energyScanVariants}
                />

                {/* Core Flicker */}
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full z-[3] mix-blend-overlay"
                    style={{
                        background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, transparent 70%)'
                    }}
                    animate={state === 'boot' ? 'idle' : state}
                    variants={coreVariants}
                />

                {/* Avatar Image */}
                <Image
                    src="/max-avatar.png"
                    alt="Max AI"
                    fill
                    sizes={`${size}px`}
                    className="object-cover relative z-[1]"
                    draggable={false}
                />
            </motion.div>
        </div>
    );
}
