'use client';

import React from 'react';
import Image from 'next/image';

export default function PosterPage() {
    return (
        <div className="min-h-screen flex flex-col items-center relative overflow-hidden font-sans bg-white z-[100]">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#E0F7FA] via-[#80DEEA] to-[#4DD0E1] z-0" />

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-md mx-auto flex flex-col h-full min-h-screen px-6 py-8">

                {/* Header / Logo */}
                <div className="flex justify-between items-center w-full mb-12">
                    <div className="flex items-center gap-2">
                        {/* Simple Logo Placeholder - matching the blue orb style */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-200 shadow-inner flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full bg-white/30 backdrop-blur-sm" />
                        </div>
                        <span className="font-serif italic font-bold text-xl text-black tracking-tight">
                            AntiAnxiety<span className="text-[10px] align-top relative -top-1 ml-0.5">TM</span>
                        </span>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col justify-center mb-12">

                    <h1 className="text-black font-semibold text-5xl leading-tight mb-8 tracking-tighter">
                        <span className="italic block" style={{ fontFamily: 'var(--font-heading), serif' }}>拒绝内卷,</span>
                        <span className="block mt-2" style={{ fontFamily: 'var(--font-heading), serif' }}>科学 <span className="relative">「躺平」<span className="absolute -bottom-1 left-0 w-full h-1 bg-black/10 rounded-full"></span></span> .</span>
                    </h1>

                    <div className="space-y-6 text-[#1A1A1A]/80 font-serif leading-relaxed text-lg">
                        <p>
                            融合
                            <span className="border-b border-dashed border-black/30 pb-0.5 mx-1">计算神经科学</span>、
                            <span className="border-b border-dashed border-black/30 pb-0.5 mx-1">贝叶斯推断</span>
                            和
                            <span className="border-b border-dashed border-black/30 pb-0.5 mx-1">迷走神经信号</span>.
                            从根源量化「焦虑」.
                        </p>

                        <p className="text-xl italic font-medium">
                            你负责愉悦的情绪,
                            <span className="border-b-2 border-dotted border-[#F59E0B] mx-1 font-bold">Max</span>
                            负责繁琐的系统.
                        </p>
                    </div>
                </div>

                {/* Footer / QR Code */}
                <div className="mt-auto w-full flex flex-col items-center gap-4 pb-8">
                    <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/30">
                        <img
                            src="/poster-qr.png"
                            alt="Scan QR Code"
                            className="w-32 h-32 mix-blend-multiply opacity-90"
                        />
                    </div>
                    <div className="flex flex-col items-center gap-1 text-[#013324] text-xs font-medium tracking-widest uppercase opacity-70">
                        <p>长按扫描</p>
                        <p>接受cookie-打开二维码</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
