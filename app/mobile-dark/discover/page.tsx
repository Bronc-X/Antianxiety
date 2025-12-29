'use client';

import { useState } from 'react';
import DarkBottomNav from '@/components/mobile-dark/DarkBottomNav';
import { MobilePlansList } from '@/components/mobile-dark/MobilePlansList';

export default function DarkDiscoverPage() {
    const [activeTab, setActiveTab] = useState('feed');

    return (
        <div className="min-h-screen bg-black pb-32">
            <header className="px-6 pt-16 pb-4 border-b border-[#111111] sticky top-0 bg-black/80 backdrop-blur-md z-10">
                <h1 className="text-2xl font-bold text-white tracking-tight">Discover</h1>

                {/* Tabs */}
                <div className="flex items-center mt-6 border-b border-[#222222]">
                    <button
                        onClick={() => setActiveTab('feed')}
                        className={`flex-1 pb-3 text-[10px] font-mono uppercase tracking-widest transition-colors relative ${activeTab === 'feed' ? 'text-white' : 'text-[#666666]'
                            }`}
                    >
                        Intelligence Feed
                        {activeTab === 'feed' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#00FF94]" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('plans')}
                        className={`flex-1 pb-3 text-[10px] font-mono uppercase tracking-widest transition-colors relative ${activeTab === 'plans' ? 'text-white' : 'text-[#666666]'
                            }`}
                    >
                        Active Protocols
                        {activeTab === 'plans' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#007AFF]" />}
                    </button>
                </div>
            </header>

            <main className="px-5 pt-6">
                {activeTab === 'feed' ? (
                    <div className="space-y-4">
                        {/* Placeholder for Feed - Next Step could be porting InfiniteFeed logic */}
                        <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#1A1A1A]">
                            <span className="text-[10px] text-[#00FF94] font-mono uppercase mb-2 block">Latest Research</span>
                            <h3 className="text-white font-bold mb-1">Circadian Optimization</h3>
                            <p className="text-xs text-[#666666]">New study reveals timing of light exposure impacts cortisol...</p>
                        </div>
                        <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#1A1A1A]">
                            <span className="text-[10px] text-[#00FF94] font-mono uppercase mb-2 block">Bio-Hack</span>
                            <h3 className="text-white font-bold mb-1">Cold Thermogenesis</h3>
                            <p className="text-xs text-[#666666]">Protocol update: 3 mins at 10°C increases dopamine by 250%.</p>
                        </div>
                    </div>
                ) : (
                    <MobilePlansList />
                )}
            </main>

            <DarkBottomNav />
        </div>
    );
}
