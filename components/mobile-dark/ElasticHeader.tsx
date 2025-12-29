'use client';

import { motion, useMotionValue, useSpring, useTransform, animate, PanInfo } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { Search } from 'lucide-react';

export function ElasticHeader() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 375, height: 300 });

    // Drag state
    const dragY = useMotionValue(0);
    // Spring physics for the "stretch" effect
    const stretch = useSpring(dragY, { stiffness: 400, damping: 15, mass: 1 });

    // Derived path for SVG
    const pathD = useTransform(stretch, (y) => {
        // Base height of the header
        const h = dimensions.height;
        // The curve control point is y * factor (amplifying the pull slightly or keeping it 1:1)
        const controlY = h + Math.max(0, y * 1.5);

        // M 0 0 (Top Left)
        // L width 0 (Top Right)
        // L width h (Bottom Right Start)
        // Q width/2 controlY (Curve Control Point)
        // 0 h (Bottom Left End)
        // Z (Close)
        return `M 0 0 L ${dimensions.width} 0 L ${dimensions.width} ${h} Q ${dimensions.width / 2} ${controlY} 0 ${h} Z`;
    });

    // Content transformation - Move content down slightly when pulling, but less than the curve
    const contentY = useTransform(stretch, (y) => y * 0.3);
    const contentScale = useTransform(stretch, [0, 200], [1, 1.05]);

    useEffect(() => {
        if (containerRef.current) {
            setDimensions({
                width: containerRef.current.offsetWidth,
                height: 300 // Fixed base height for the header
            });
        }

        // Resize observer to handle window resize
        const observer = new ResizeObserver((entries) => {
            if (entries[0]) {
                setDimensions(prev => ({ ...prev, width: entries[0].contentRect.width }));
            }
        });

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const handlePan = (_: any, info: PanInfo) => {
        // Only allow pulling down (positive y)
        if (info.offset.y > 0) {
            dragY.set(info.offset.y);
        }
    };

    const handlePanEnd = () => {
        // Snap back to 0
        animate(dragY, 0, { type: "spring", stiffness: 400, damping: 15 });
    };

    return (
        <div ref={containerRef} className="relative w-full h-[400px] overflow-hidden select-none touch-none">
            {/* The Elastic Shape */}
            <svg
                className="absolute top-0 left-0 w-full h-[600px] pointer-events-none drop-shadow-2xl"
                viewBox={`0 0 ${dimensions.width} 600`}
                preserveAspectRatio="none" // Important for resizing
            >
                <defs>
                    <linearGradient id="headerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#1A1A1A" />
                        <stop offset="100%" stopColor="#0A0A0A" />
                    </linearGradient>
                    {/* Adding a subtle texture/noise filter if possible, or just gradient */}
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="15" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                <motion.path
                    d={pathD}
                    fill="url(#headerGradient)"
                    filter="url(#glow)"
                />

                {/* 3D Lighting / Specular Highlight on the curve */}
                {/* We can construct a secondary path for the highlight */}
                {/* For simplicity, let's keep it clean first */}
            </svg>

            {/* Draggable Area Overlay */}
            <motion.div
                className="absolute inset-0 z-50 cursor-grab active:cursor-grabbing"
                onPan={handlePan}
                onPanEnd={handlePanEnd}
                style={{ touchAction: "none" }}
            />

            {/* Header Content */}
            <motion.div
                className="relative z-10 p-8 pt-16 flex flex-col items-center justify-start h-full pointer-events-none"
                style={{ y: contentY, scale: contentScale }}
            >
                <div className="w-16 h-16 rounded-full bg-[#222222] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.5)] flex items-center justify-center mb-6">
                    <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                        alt="User"
                        className="w-12 h-12 rounded-full opacity-80"
                    />
                </div>

                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Popular Food</h1>
                <div className="flex items-center gap-2 text-[#666666] text-sm">
                    <span>New York</span>
                    <span className="w-1 h-1 rounded-full bg-[#666]" />
                    <span>Cloudy</span>
                </div>

                {/* Search Bar Placeholder */}
                <div className="mt-8 w-full max-w-[280px] h-12 bg-[#111] rounded-full flex items-center px-4 gap-3 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.5)]">
                    <Search className="w-5 h-5 text-[#444]" />
                    <span className="text-[#444] text-sm">Find your meal...</span>
                </div>
            </motion.div>
        </div>
    );
}
