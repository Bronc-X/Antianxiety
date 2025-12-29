'use client';

import { motion } from 'framer-motion';
import { Zap, Activity, Heart, Wind } from 'lucide-react';

export default function AirStyleExperiment() {
    return (
        <div className="min-h-screen bg-[#111] p-6 flex flex-col items-center gap-8 justify-center overflow-hidden">
            <h1 className="text-white font-bold text-xl tracking-widest uppercase opacity-50">Experimental: Air/Pneumatic UI</h1>

            {/* 
               Basic Air Cushion Card 
               - Concept: Looks inflated, like a balloon or air cushion.
               - Key CSS: Multiple inset shadows for volume + specular highlight
            */}

            {/* Style 1: Vinyl/Latex Shine (Cyberpunk Air) */}
            <div className="relative w-full max-w-xs">
                <div className="absolute inset-0 bg-[#00FF94] blur-2xl opacity-20 rounded-full" />
                <motion.div
                    whileTap={{ scale: 0.95 }}
                    className="relative bg-[#1A1A1A] rounded-[30px] p-6 flex items-center gap-4 overflow-hidden"
                    style={{
                        boxShadow: `
                           inset 2px 2px 4px rgba(255,255,255,0.1), 
                           inset -4px -4px 10px rgba(0,0,0,0.5),
                           0 10px 20px rgba(0,0,0,0.3)
                        `
                    }}
                >
                    {/* The "Air" Highlight - Specular reflection simulating curved surface */}
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-[30px] pointer-events-none" />

                    <div className="w-12 h-12 rounded-full bg-[#00FF94] flex items-center justify-center text-black shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.2),inset_2px_2px_4px_rgba(255,255,255,0.4)]">
                        <Zap className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg">Bio-Voltage</h3>
                        <p className="text-[#00FF94] text-xs">98% CHARGED</p>
                    </div>
                </motion.div>
            </div>

            {/* Style 2: Matte Rubber (Soft Touch) */}
            <div className="w-full max-w-xs grid grid-cols-2 gap-4">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="aspect-square bg-[#222] rounded-[24px] flex flex-col items-center justify-center gap-2 relative"
                    style={{
                        boxShadow: `
                           inset 3px 3px 6px rgba(255,255,255,0.05),
                           inset -3px -3px 6px rgba(0,0,0,0.4),
                           5px 5px 10px rgba(0,0,0,0.3)
                        `
                    }}
                >
                    <Activity className="w-8 h-8 text-[#007AFF] drop-shadow-[0_0_5px_rgba(0,122,255,0.5)]" />
                    <span className="text-xs text-[#888] font-mono">RECOVERY</span>
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="aspect-square bg-[#222] rounded-[24px] flex flex-col items-center justify-center gap-2 relative"
                    style={{
                        boxShadow: `
                           inset 3px 3px 6px rgba(255,255,255,0.05),
                           inset -3px -3px 6px rgba(0,0,0,0.4),
                           5px 5px 10px rgba(0,0,0,0.3)
                        `
                    }}
                >
                    <Heart className="w-8 h-8 text-[#FF3B30] drop-shadow-[0_0_5px_rgba(255,59,48,0.5)]" />
                    <span className="text-xs text-[#888] font-mono">STRAIN</span>
                </motion.button>
            </div>

            {/* Style 3: Transparent Inflatable (Clear Plastic) */}
            <div className="w-full max-w-xs relative bg-black/50 p-6 rounded-[32px] overflow-hidden backdrop-blur-md border border-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]" />

                {/* Simulated specular highlights for 'bubble' effect */}
                <div className="absolute top-2 left-2 w-full h-full rounded-[28px] border-l border-t border-white/20 blur-[1px] opacity-70 pointer-events-none" />
                <div className="absolute bottom-2 right-2 w-full h-full rounded-[28px] border-r border-b border-black/40 blur-[2px] opacity-70 pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-[#00FF94]/20 flex items-center justify-center mb-4 border border-[#00FF94]/30 text-[#00FF94]"
                        style={{ boxShadow: 'inset 0 0 10px rgba(0,255,148,0.2)' }}
                    >
                        <Wind className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-1">Air Mode</h2>
                    <p className="text-white/40 text-sm text-center">Pneumatic interface concept.<br />Soft, tactile, responsive.</p>
                </div>
            </div>

        </div>
    );
}
