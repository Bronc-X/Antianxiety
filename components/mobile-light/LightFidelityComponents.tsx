'use client';

import { motion } from 'framer-motion';
import { Home, Calendar, User } from 'lucide-react';

// ----------------------------------------------------------------------------
// 1. Calorie Arc (Dashed Semi-Circle)
// ----------------------------------------------------------------------------
export function CalorieArc({ remaining = 1232, total = 2500, consumed = 2300 }: { remaining?: number, total?: number, consumed?: number }) {
    return (
        <div className="relative flex flex-col items-center justify-center py-6">
            <div className="w-[280px] h-[140px] relative overflow-hidden">
                <svg viewBox="0 0 300 150" className="w-full h-full">
                    <defs>
                        <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#00E0FF" />
                            <stop offset="100%" stopColor="#00FF94" />
                        </linearGradient>
                    </defs>

                    {/* Base Arc Track */}
                    <path
                        d="M 30 150 A 120 120 0 0 1 270 150"
                        fill="none"
                        stroke="#F0F0F0"
                        strokeWidth="20"
                        strokeLinecap="round"
                        strokeDasharray="4 6" // Dashed effect
                    />

                    {/* Active Arc (Gradient) */}
                    <motion.path
                        initial={{ strokeDashoffset: 380 }}
                        animate={{ strokeDashoffset: 380 - (380 * (consumed / total)) }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        d="M 30 150 A 120 120 0 0 1 270 150"
                        fill="none"
                        stroke="url(#arcGradient)"
                        strokeWidth="20"
                        strokeLinecap="round"
                        strokeDasharray="380" // Full semi-circle length approx
                        // strokeDashoffset controlled by animation
                        style={{ strokeDasharray: '4 6' }} // Apply dash to active too
                    />
                </svg>

                {/* Inner Content */}
                <div className="absolute bottom-0 left-0 right-0 text-center flex flex-col items-center justify-end h-full pb-4">
                    <span className="text-4xl font-bold text-[#1A1A1A]">{remaining}</span>
                    <span className="text-xs text-gray-400 font-medium mt-1">calories remaining</span>
                </div>
            </div>

            <div className="flex justify-between w-full px-8 mt-4 text-[10px] font-medium text-gray-400">
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00FF94]"></span>
                    Consumed {consumed}kcal
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00E0FF]"></span>
                    Base {total}kcal
                </div>
            </div>
        </div>
    );
}


// ----------------------------------------------------------------------------
// 2. Macro Rings (Group of 3)
// ----------------------------------------------------------------------------
export function MacroRings() {
    return (
        <div className="flex justify-between items-center px-4">
            <div className="flex flex-col items-start gap-1">
                <span className="text-gray-400 text-xs font-medium mb-2">Macros Breakdown</span>
                <div className="flex gap-8">
                    <div className="flex flex-col">
                        <span className="text-gray-400 text-[10px]">Carbs</span>
                        <span className="text-[#00FF94] text-lg font-bold">200g</span>
                        <span className="text-gray-300 text-[10px]">40%</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-400 text-[10px]">Protein</span>
                        <span className="text-[#FFAA00] text-lg font-bold">90g</span>
                        <span className="text-gray-300 text-[10px]">40%</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-400 text-[10px]">Fat</span>
                        <span className="text-[#00E0FF] text-lg font-bold">40g</span>
                        <span className="text-gray-300 text-[10px]">40%</span>
                    </div>
                </div>
            </div>

            {/* Concentric Rings Visual */}
            <div className="relative w-24 h-24 flex items-center justify-center ml-auto">
                {/* 3 Rings stacked */}
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#F5F5F7" strokeWidth="6" />
                    <circle cx="50" cy="50" r="30" fill="none" stroke="#F5F5F7" strokeWidth="6" />
                    <circle cx="50" cy="50" r="20" fill="none" stroke="#F5F5F7" strokeWidth="6" />

                    <motion.circle
                        initial={{ pathLength: 0 }} animate={{ pathLength: 0.4 }}
                        cx="50" cy="50" r="40" fill="none" stroke="#00FF94" strokeWidth="6" strokeLinecap="round"
                    />
                    <motion.circle
                        initial={{ pathLength: 0 }} animate={{ pathLength: 0.6 }}
                        cx="50" cy="50" r="30" fill="none" stroke="#FFAA00" strokeWidth="6" strokeLinecap="round"
                    />
                    <motion.circle
                        initial={{ pathLength: 0 }} animate={{ pathLength: 0.3 }}
                        cx="50" cy="50" r="20" fill="none" stroke="#00E0FF" strokeWidth="6" strokeLinecap="round"
                    />
                </svg>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------------
// 3. Barcode Chart (Active Calories)
// ----------------------------------------------------------------------------
export function BarcodeChart() {
    return (
        <div className="flex items-end justify-between h-12 w-full gap-[2px]">
            {Array.from({ length: 40 }).map((_, i) => {
                const height = 20 + ((i * 37) % 80);
                const active = i < 25; // simple logic
                return (
                    <div
                        key={i}
                        className={`w-full rounded-sm transition-all duration-500 ${active ? 'bg-[#FF3B30]' : 'bg-[#F2F2F7]'}`}
                        style={{ height: `${active ? height : 20}%` }}
                    />
                )
            })}
            <div className="absolute right-6 flex items-center gap-1 bg-white shadow-sm border border-gray-100 rounded-full px-2 py-1">
                <span className="text-[10px]">🔥</span>
                <span className="text-xs font-bold text-[#1A1A1A]">560</span>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------------
// 4. Glass Dock (Bottom Nav)
// ----------------------------------------------------------------------------
export function GlassDock() {
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-2 p-1.5 bg-white/60 backdrop-blur-xl rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.5)]">
                <div className="flex flex-col items-center justify-center w-16 h-12 rounded-[20px] bg-[#1A1A1A] text-white shadow-lg">
                    <Home className="w-5 h-5 mb-[1px]" />
                    <span className="text-[8px] font-medium">Home</span>
                </div>
                <div className="flex flex-col items-center justify-center w-16 h-12 rounded-[20px] text-gray-400 hover:bg-white hover:text-black transition-colors">
                    <Calendar className="w-5 h-5 mb-[1px]" />
                    <span className="text-[8px] font-medium">Food diary</span>
                </div>
                <div className="flex flex-col items-center justify-center w-16 h-12 rounded-[20px] text-gray-400 hover:bg-white hover:text-black transition-colors">
                    <User className="w-5 h-5 mb-[1px]" />
                    <span className="text-[8px] font-medium">Profile</span>
                </div>
            </div>
        </div>
    );
}
