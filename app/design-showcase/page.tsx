'use client';

import React, { useState } from 'react';
import CardStack from '@/components/motion/CardStack';
import MatrixText from '@/components/motion/MatrixText';
import TypewriterText from '@/components/motion/TypewriterText';
import ScanlineOverlay from '@/components/motion/ScanlineOverlay';
import Link from 'next/link';

export default function DesignShowcasePage() {
    const [activeTab, setActiveTab] = useState<'cards' | 'matrix' | 'typewriter' | 'scanline'>('cards');

    const cardItems = [
        { id: 1, content: <h3 className="text-xl font-bold text-[#0B3D2E]">Card One</h3>, color: 'bg-white' },
        { id: 2, content: <h3 className="text-xl font-bold text-[#0B3D2E]">Card Two</h3>, color: 'bg-[#FAF6EF]' },
        { id: 3, content: <h3 className="text-xl font-bold text-[#0B3D2E]">Card Three</h3>, color: 'bg-[#E7E1D6]' },
        { id: 4, content: <h3 className="text-xl font-bold text-[#0B3D2E]">Card Four</h3>, color: 'bg-white' },
    ];

    return (
        <div className="min-h-screen bg-[#FDFBF7] p-8 md:p-12 font-sans text-[#0B3D2E] relative overflow-hidden">
            {/* Show scanline overlay only when selected */}
            {activeTab === 'scanline' && <ScanlineOverlay opacity={0.1} />}

            <div className="relative z-10 max-w-4xl mx-auto">
                <header className="mb-12 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-[#0B3D2E] mb-2">Design Showcase</h1>
                        <p className="text-sm font-mono text-[#0B3D2E]/60 uppercase tracking-wider">Animation Component Gallery</p>
                    </div>
                    <Link href="/" className="px-4 py-2 rounded-lg border border-[#E7E1D6] hover:bg-[#E7E1D6]/20 transition-colors text-sm font-medium">
                        Return Home
                    </Link>
                </header>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-12">
                    {[
                        { id: 'cards', label: 'Card Stack' },
                        { id: 'matrix', label: 'Matrix Text' },
                        { id: 'typewriter', label: 'Typewriter' },
                        { id: 'scanline', label: 'Scanline' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === tab.id
                                    ? 'bg-[#0B3D2E] text-white shadow-md'
                                    : 'bg-white border border-[#E7E1D6] text-[#0B3D2E]/70 hover:border-[#0B3D2E]/50'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Demo Area */}
                <div className="bg-white border border-[#E7E1D6] rounded-3xl p-8 md:p-16 min-h-[400px] flex items-center justify-center relative shadow-sm">

                    {activeTab === 'cards' && (
                        <div className="text-center">
                            <div className="mb-8 text-sm text-gray-500">Drag cards horizontally to dismiss</div>
                            <CardStack items={cardItems} />
                        </div>
                    )}

                    {activeTab === 'matrix' && (
                        <div className="text-center max-w-lg">
                            <div className="mb-8 text-xs font-mono uppercase text-green-600">Decryption Protocol Initiated</div>
                            <h2 className="text-3xl md:text-5xl font-mono font-bold text-[#0B3D2E] mb-4">
                                <MatrixText text="SYSTEM_CORRUPTION_DETECTED" className="text-green-700" speed={50} />
                            </h2>
                            <p className="font-mono text-sm text-[#0B3D2E]/60">
                                <MatrixText text="Analyzing neural pathways for anomalies..." speed={30} />
                            </p>
                        </div>
                    )}

                    {activeTab === 'typewriter' && (
                        <div className="max-w-2xl text-left">
                            <TypewriterText
                                text="Your anxiety is not a defect. It is a biological signal. By understanding the mechanism, we can rewrite the response."
                                className="text-2xl md:text-3xl font-serif leading-relaxed text-[#0B3D2E]"
                            />
                            <div className="mt-6 p-4 bg-[#FAF6EF] rounded-lg border-l-4 border-[#0B3D2E]">
                                <TypewriterText
                                    text="> System Status: Operational. Cognitive Load: 45%. Ready for input."
                                    className="font-mono text-sm text-[#0B3D2E]/80"
                                    delay={1.5}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'scanline' && (
                        <div className="text-center z-20">
                            <h2 className="text-4xl font-black text-[#0B3D2E] mb-4 tracking-tighter">RETRO_FILTER_ACTIVE</h2>
                            <p className="text-[#0B3D2E]/70 max-w-md mx-auto">
                                The scanline effect is applied to the ENTIRE page background. Notice the subtle moving line and grain texture overlaid on the screen.
                            </p>
                            <div className="mt-8 px-6 py-3 bg-[#0B3D2E] text-white font-mono text-xs inline-block">
                                CRT_EMULATION_MODE
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
