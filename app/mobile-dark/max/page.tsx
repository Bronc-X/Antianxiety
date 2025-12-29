'use client';

import { MobileMaxChat } from '@/components/mobile-dark/MobileMaxChat';
import DarkBottomNav from '@/components/mobile-dark/DarkBottomNav';

export default function DarkMaxPage() {
    return (
        <div className="h-screen bg-black flex flex-col">
            <header className="px-6 pt-14 pb-2 border-b border-[#111111] bg-black z-10">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#007AFF] animate-pulse" />
                    <h1 className="text-sm font-mono font-bold text-white tracking-widest uppercase">
                        MAX_AI
                    </h1>
                </div>
            </header>

            <div className="flex-1 relative overflow-hidden">
                <MobileMaxChat />
            </div>

            <DarkBottomNav />
        </div>
    );
}
