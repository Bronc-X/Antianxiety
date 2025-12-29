'use client';

import { ElasticHeader } from '@/components/mobile-dark/ElasticHeader';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ElasticPullExperiment() {
    return (
        <div className="min-h-screen bg-black">
            {/* Back button */}
            <div className="fixed top-6 left-6 z-[100]">
                <Link href="/mobile-dark" className="flex items-center justify-center w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
            </div>

            <ElasticHeader />

            <div className="px-6 py-8 grid grid-cols-2 gap-4">
                {/* Dummy Content Cards to fill the space below */}
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-[4/5] bg-[#111] rounded-3xl p-4 flex flex-col justify-end relative overflow-hidden">
                        <div className="absolute inset-x-4 top-4 h-32 bg-[#1A1A1A] rounded-2xl mb-4" />
                        <div className="w-12 h-4 bg-[#222] rounded-full mb-2" />
                        <div className="w-20 h-4 bg-[#222] rounded-full" />
                    </div>
                ))}
            </div>

            <div className="px-6 pb-20 text-center">
                <p className="text-[#333] text-sm font-mono">
                    Pull down on the header area above<br />to test the elastic physics.
                </p>
            </div>
        </div>
    );
}
