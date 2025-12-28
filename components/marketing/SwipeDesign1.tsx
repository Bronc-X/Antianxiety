"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const SwipeDesign1 = () => {
    const [calm, setCalm] = useState(false);

    return (
        <div className="relative w-[390px] h-[844px] bg-[#050505] text-white overflow-hidden font-sans border border-gray-800 flex flex-col">
            {/* Noise Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />

            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col h-full p-6 justify-between">

                {/* Top Section: Branding & Status */}
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span className="text-sm font-bold tracking-tight">AntiAnxiety™</span>
                        </div>
                        <span className="text-[10px] tracking-[0.2em] font-bold mt-2 uppercase text-gray-400">Bionic-X Series</span>
                    </div>

                    <div className="text-right">
                        <div className="text-[10px] uppercase tracking-widest text-gray-500">System Status</div>
                        <div className={`text-xs font-mono mt-1 ${calm ? 'text-emerald-400' : 'text-red-500'} transition-colors`}>
                            {calm ? '● OPTIMAL FLOW' : '● SYMPATHETIC OVERDRIVE'}
                        </div>
                    </div>
                </div>

                {/* Middle Section: Visualization */}
                <div
                    className="flex-1 flex flex-col justify-center relative my-4 group cursor-pointer"
                    onMouseEnter={() => setCalm(true)}
                    onMouseLeave={() => setCalm(false)}
                    onClick={() => setCalm(!calm)}
                >
                    <div className="absolute top-0 right-0 text-[9px] font-mono text-gray-600 border border-gray-800 px-2 py-1 rounded">
                        LIVE BIOMETRIC FEED
                    </div>

                    {/* Dynamic Graph */}
                    <div className="h-48 w-full relative">
                        <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                            <path
                                d={calm
                                    ? "M0,50 Q40,45 80,50 T160,50 T240,50 T320,50"
                                    : "M0,50 L20,20 L40,80 L60,30 L80,70 L100,20 L120,60 L140,10 L160,80 L180,40 L200,70 L220,10"
                                }
                                fill="none"
                                stroke={calm ? "#10b981" : "#ef4444"}
                                strokeWidth="2"
                                className="transition-all duration-700 ease-out"
                            />
                            {/* Echo lines */}
                            <path
                                d={calm ? "M0,50 Q40,45 80,50 T160,50 T240,50 T320,50" : "M0,50 L220,10"}
                                fill="none"
                                stroke={calm ? "#10b981" : "#ef4444"}
                                strokeWidth="10"
                                className="opacity-20 blur-md transition-all duration-700"
                            />
                        </svg>
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-5xl font-light tracking-tighter leading-[0.9] mt-8 mix-blend-screen">
                        THE <br />
                        INVISIBLE <br />
                        <span className={`${calm ? 'text-emerald-400' : 'text-gray-500'} transition-colors duration-500`}>WAR</span>
                    </h1>

                    <p className="mt-6 text-sm text-gray-400 font-light leading-relaxed max-w-[80%]">
                        Anxiety is data. <br />
                        Don't suppress it. <span className="text-white border-b border-white/20 pb-0.5">Calibrate it.</span>
                    </p>
                </div>

                {/* Bottom Section: CTA & QR */}
                <div className="flex justify-between items-end border-t border-gray-800 pt-6">
                    <div className="space-y-2">
                        <div className="text-[40px] leading-none font-bold tracking-tighter">98<span className="text-lg text-gray-500">%</span></div>
                        <div className="text-[10px] uppercase text-gray-500 tracking-wider">Recovery Rate</div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        <div className="bg-white p-1 rounded-sm w-16 h-16">
                            <div className="w-full h-full bg-black flex items-center justify-center">
                                {/* Mock QR */}
                                <div className="w-full h-full bg-white p-0.5 grid grid-cols-4 gap-0.5">
                                    {Array.from({ length: 16 }).map((_, i) => (
                                        <div key={i} className={`bg-black ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-0'}`} />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="text-[9px] text-gray-500 uppercase tracking-widest">Scan to Begin</div>
                    </div>
                </div>

            </div>
        </div>
    );
};
