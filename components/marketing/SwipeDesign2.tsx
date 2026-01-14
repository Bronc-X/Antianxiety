"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const SwipeDesign2 = () => {
    const [active, setActive] = useState(false);

    return (
        <div className="relative w-[390px] h-[844px] bg-[#EBE9E4] text-[#1c1c1c] overflow-hidden font-serif flex flex-col">

            {/* Texture */}
            <div className="absolute inset-0 z-0 bg-orange-50 mix-blend-multiply opacity-50" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-[#253828] to-transparent opacity-10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10 flex flex-col h-full p-8">

                {/* Editorial Header */}
                <div className="w-full flex justify-between items-center border-b border-[#1c1c1c]/10 pb-4 mb-8">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-sm font-bold tracking-tight text-[#1c1c1c]">AntiAnxiety™</span>
                        <span className="text-xl font-bold tracking-tighter ml-2">VOL. 01</span>
                    </div>
                    <span className="font-sans text-[10px] uppercase tracking-widest bg-[#1c1c1c] text-[#EBE9E4] px-2 py-1 rounded-full">Biological Rhythm</span>
                </div>

                {/* Circular Graphic */}
                <div className="relative flex-1 flex flex-col items-center">
                    <div
                        className="w-64 h-64 rounded-full border border-[#1c1c1c]/10 flex items-center justify-center relative cursor-pointer"
                        onClick={() => setActive(!active)}
                    >
                        {/* Rotating Text Ring */}
                        <div className={`absolute inset-0 rounded-full border border-dashed border-[#1c1c1c]/20 transition-transform duration-[20s] linear ${active ? 'animate-spin' : ''}`} />

                        {/* Inner Circle */}
                        <motion.div
                            className="w-48 h-48 rounded-full bg-[#253828] flex items-center justify-center overflow-hidden relative shadow-2xl"
                            animate={{ scale: active ? 0.95 : 1 }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#1a2e1d] to-[#4a6b4f]" />
                            <span className="relative z-10 text-[#EBE9E4] italic text-2xl font-light">
                                {active ? "Exhale" : "Inhale"}
                            </span>
                        </motion.div>

                        {/* Floating Tags */}
                        <div className="absolute -right-4 top-10 bg-white shadow-lg px-3 py-1 rounded-full text-[10px] font-sans uppercase tracking-widest">
                            Cortisol
                        </div>
                        <div className="absolute -left-4 bottom-10 bg-white shadow-lg px-3 py-1 rounded-full text-[10px] font-sans uppercase tracking-widest">
                            Melatonin
                        </div>
                    </div>

                    {/* Big Headline */}
                    <div className="mt-12 text-center relative">
                        <h2 className="text-5xl italic leading-[0.9] mb-4">
                            Natural <br />
                            <span className="not-italic font-bold">Intelligence</span>
                        </h2>
                        <p className="font-sans text-xs leading-relaxed text-gray-600 max-w-[240px] mx-auto">
                            Your body is a clock that&apos;s been ticking for millions of years. Stop trying to rewind it.
                        </p>
                    </div>
                </div>

                {/* Footer Card */}
                <div className="mt-auto bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="font-sans text-[10px] uppercase text-gray-400 tracking-widest">Early Access</span>
                        <span className="font-bold text-lg">Join the beta</span>
                    </div>

                    <div className="w-10 h-10 bg-[#253828] rounded-lg p-1">
                        {/* Mini QR */}
                        <div className="w-full h-full bg-white grid grid-cols-3 gap-0.5 p-0.5">
                            {Array.from({ length: 9 }).map((_, i) => (
                                <div key={i} className={`bg-[#253828]`} />
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
