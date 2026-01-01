'use client';

import { motion } from 'framer-motion';

// 1. Tech Corner Bracket (Standard)
export function TechCorner({ position = 'top-left', className = '' }: { position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right', className?: string }) {
    const isTop = position.includes('top');
    const isLeft = position.includes('left');

    return (
        <div className={`absolute w-8 h-8 pointer-events-none opacity-50 ${isTop ? 'top-0' : 'bottom-0'} ${isLeft ? 'left-0' : 'right-0'} ${className}`}>
            {/* Horizontal Line */}
            <div className={`absolute w-full h-[1px] bg-[#D4AF37]/50 ${isTop ? 'top-0' : 'bottom-0'}`} />
            {/* Vertical Line */}
            <div className={`absolute h-full w-[1px] bg-[#D4AF37]/50 ${isLeft ? 'left-0' : 'right-0'}`} />
        </div>
    );
}

// 2. Animated Crosshair
export function TechCrosshair({ className = '' }: { className?: string }) {
    return (
        <div className={`absolute flex items-center justify-center w-4 h-4 opacity-40 pointer-events-none ${className}`}>
            <div className="w-full h-[1px] bg-[#D4AF37]" />
            <div className="h-full w-[1px] bg-[#D4AF37] absolute" />
        </div>
    );
}

// 3. Scrolling Data Stream (Matrix-like numbers)
export function DataStream({ direction = 'vertical', className = '' }: { direction?: 'vertical' | 'horizontal', className?: string }) {
    // Generate random hex codes
    const data = Array.from({ length: 20 }).map(() => Math.random().toString(16).substr(2, 4).toUpperCase());

    return (
        <div className={`flex gap-2 text-[10px] font-mono text-[#D4AF37]/20 pointer-events-none overflow-hidden ${direction === 'vertical' ? 'flex-col' : 'flex-row'} ${className}`}>
            {data.map((hex, i) => (
                <motion.span
                    key={i}
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                >
                    {hex}
                </motion.span>
            ))}
        </div>
    );
}

// 4. System Status Pulse Pill
export function SystemStatus({ label = 'SYSTEM ONLINE' }: { label?: string }) {
    return (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase">
                {label}
            </span>
        </div>
    );
}

// 5. Grid Background Layout
export function TechGrid() {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
            style={{
                backgroundImage: `
          linear-gradient(to right, #D4AF37 1px, transparent 1px),
          linear-gradient(to bottom, #D4AF37 1px, transparent 1px)
        `,
                backgroundSize: '40px 40px',
                maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)' // Fade out edges
            }}
        />
    );
}
