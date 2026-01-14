'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function PosterPage() {
    return (
        <div
            className="min-h-screen flex flex-col items-center relative overflow-hidden bg-[#f6f1e9] text-[#14110f] z-[100]"
            style={{ fontFamily: 'var(--font-heading), serif' }}
        >
            {/* Background Layers */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage:
                        'radial-gradient(900px 600px at 12% 8%, rgba(15, 47, 38, 0.16), transparent 60%), radial-gradient(800px 520px at 88% 14%, rgba(196, 160, 106, 0.22), transparent 60%), linear-gradient(160deg, #faf6ef 0%, #f2ece2 55%, #e7dccd 100%)',
                }}
            />
            <div className="absolute -top-40 -right-32 h-80 w-80 rounded-full bg-[#0f2f26]/10 blur-3xl z-0" />
            <div className="absolute -bottom-48 -left-32 h-[26rem] w-[26rem] rounded-full bg-[#c4a06a]/25 blur-3xl z-0" />
            <div className="absolute inset-6 border border-[#d9cbb6]/60 z-[1] pointer-events-none" />

            {/* Content Container */}
            <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="relative z-10 w-full max-w-md mx-auto flex flex-col h-full min-h-screen px-6 py-8"
            >

                {/* Header / Logo */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                    className="flex justify-between items-center w-full mb-12"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0f2f26] via-[#1b4a3b] to-[#c4a06a] shadow-[0_8px_18px_rgba(15,47,38,0.28)] flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full bg-white/20 backdrop-blur-sm border border-white/30" />
                        </div>
                        <span className="italic font-semibold text-xl tracking-tight">
                            AntiAnxiety<span className="text-[10px] align-top relative -top-1 ml-0.5">TM</span>
                        </span>
                    </div>
                </motion.div>

                {/* Main Content */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
                    className="flex-1 flex flex-col justify-center mb-12"
                >

                    <h1 className="text-[#0f1f1a] font-semibold text-5xl leading-tight mb-8 tracking-tight">
                        <span className="italic block">拒绝内卷,</span>
                        <span className="block mt-2">
                            科学 <span className="relative">「躺平」
                                <span className="absolute -bottom-1 left-0 w-full h-1 bg-[#c4a06a]/50 rounded-full"></span>
                            </span> .
                        </span>
                    </h1>

                    <div className="space-y-6 text-[#2b2520]/80 leading-relaxed text-lg">
                        <p>
                            融合
                            <span className="border-b border-dashed border-[#bda585]/70 pb-0.5 mx-1">计算神经科学</span>、
                            <span className="border-b border-dashed border-[#bda585]/70 pb-0.5 mx-1">贝叶斯推断</span>
                            和
                            <span className="border-b border-dashed border-[#bda585]/70 pb-0.5 mx-1">迷走神经信号</span>.
                            从根源量化「焦虑」.
                        </p>

                        <p className="text-xl italic font-medium text-[#1f1b16]">
                            你负责愉悦的情绪,
                            <span className="border-b-2 border-dotted border-[#c4a06a] mx-1 font-semibold">Max</span>
                            负责繁琐的系统.
                        </p>
                    </div>
                </motion.div>

                {/* Footer / QR Code */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
                    className="mt-auto w-full flex flex-col items-center gap-4 pb-8"
                >
                    <div className="bg-[#fbf8f2] p-4 rounded-2xl shadow-[0_18px_40px_rgba(20,17,15,0.18)] border border-[#e2d6c6]">
                        <div className="relative w-32 h-32">
                            <Image
                                src="/poster-qr.png"
                                alt="Scan QR Code"
                                fill
                                sizes="128px"
                                className="mix-blend-multiply opacity-90"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-1 text-[#3b332b] text-xs font-medium tracking-[0.3em] uppercase opacity-70">
                        <p>长按扫描</p>
                        <p>接受cookie-打开二维码</p>
                    </div>
                </motion.div>

            </motion.div>
        </div>
    );
}
