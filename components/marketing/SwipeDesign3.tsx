"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const SwipeDesign3 = () => {
    const [reveal, setReveal] = useState(false);

    return (
        <div className="relative w-[390px] h-[844px] bg-slate-50 text-slate-900 overflow-hidden font-sans border flex flex-col">

            {/* Prismatic Border effect */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400" />

            {/* Content Container */}
            <div className="relative z-10 p-8 h-full flex flex-col">

                {/* Minimal Nav */}
                <div className="flex justify-between items-end mb-12">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-sm font-bold tracking-tight text-slate-900">AntiAnxiety™</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">V.2.0.24</span>
                </div>

                {/* Core Message Area - Glass Card */}
                <div
                    className="relative bg-white/40 backdrop-blur-xl border border-white/60 p-8 rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden cursor-ne-resize group"
                    onClick={() => setReveal(!reveal)}
                    style={{ minHeight: '400px' }}
                >
                    {/* Holographic Mesh Gradient Background */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-[60px] opacity-60 animate-pulse" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-[60px] opacity-60 animate-pulse" style={{ animationDelay: '1s' }} />

                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                                <span className="text-2xl">🧠</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-4xl font-bold leading-none tracking-tight">
                                Clear <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Cognition.</span>
                            </h2>

                            <div className="relative">
                                <p className={`text-sm font-medium leading-relaxed transition-all duration-700 ${reveal ? 'blur-0 opacity-100' : 'blur-sm opacity-60'}`}>
                                    {reveal
                                        ? "The average person has 60,000 thoughts a day. 90% are repetitive. We filter the noise."
                                        : "The average person has 60,000 thoughts a day... [Tap to clarify]"}
                                </p>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-200/50 mt-8 flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-slate-500">Protocol:</span>
                            <span className="text-[10px] font-mono bg-slate-200 px-2 py-0.5 rounded">Neuro-Adaptive</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Area: Big Stats & QR */}
                <div className="mt-auto pt-10">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <div className="text-4xl font-black mb-1">11<span className="text-lg font-normal text-slate-400">min</span></div>
                            <div className="text-[10px] uppercase font-bold text-slate-400 max-w-[80px] leading-tight">Minimum Effective Dose</div>
                        </div>
                        <div className="flex justify-end">
                            <div className="w-20 h-20 bg-slate-900 text-white p-2 rounded-xl flex flex-col items-center justify-center gap-1 shadow-2xl">
                                <div className="text-[8px] uppercase tracking-widest">Get App</div>
                                {/* Mock QR White */}
                                <div className="w-8 h-8 bg-white grid grid-cols-4 gap-0.5 p-0.5">
                                    {Array.from({ length: 16 }).map((_, i) => (
                                        <div key={i} className={`bg-slate-900 ${i % 3 !== 0 ? 'opacity-100' : 'opacity-0'}`} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
