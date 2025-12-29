'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import {
    LayoutGrid,
    Calendar,
    User,
    Zap,
    Check,
    Croissant,
    UtensilsCrossed,
    Salad,
    ChevronRight,
    Clock,
    Home
} from 'lucide-react';
import { ElasticHeader } from '@/components/mobile-dark/ElasticHeader';

// ----------------------------------------------------------------------------
// 1. Interactions Components
// ----------------------------------------------------------------------------

function SegmentedToggle() {
    const [selected, setSelected] = useState('todo');
    return (
        <div className="bg-black rounded-full p-1 flex relative w-[240px] border border-[#333]">
            {/* Active Slider Background */}
            <motion.div
                layoutId="toggleHighlight"
                className="absolute top-1 bottom-1 bg-[#333] rounded-full"
                initial={false}
                animate={{
                    left: selected === 'todo' ? 4 : '50%',
                    width: 'calc(50% - 4px)'
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            <button
                onClick={() => setSelected('todo')}
                className={`relative z-10 flex-1 py-2 text-sm font-medium transition-colors ${selected === 'todo' ? 'text-white' : 'text-[#666]'}`}
            >
                To do
            </button>
            <button
                onClick={() => setSelected('done')}
                className={`relative z-10 flex-1 py-2 text-sm font-medium transition-colors ${selected === 'done' ? 'text-white' : 'text-[#666]'}`}
            >
                Completed
            </button>
        </div>
    );
}

function CustomCheckbox({ label, checked }: { label: string, checked?: boolean }) {
    const [isChecked, setIsChecked] = useState(checked || false);
    return (
        <div
            onClick={() => setIsChecked(!isChecked)}
            className="flex items-center gap-3 cursor-pointer group"
        >
            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-[#00FF94] border-[#00FF94]' : 'border-[#333] bg-[#111]'}`}>
                {isChecked && <Check className="w-4 h-4 text-black" strokeWidth={3} />}
            </div>
            <span className={`text-sm ${isChecked ? 'text-[#888] line-through' : 'text-white'}`}>{label}</span>
        </div>
    );
}

function DateStripper() {
    const days = [
        { d: 'Mon', n: 8 },
        { d: 'Tue', n: 9 },
        { d: 'Wed', n: 10, active: true },
        { d: 'Thu', n: 11 },
        { d: 'Fri', n: 12 },
    ];
    return (
        <div className="flex justify-between items-center bg-[#111] p-2 rounded-[24px]">
            {days.map((day, i) => (
                <div key={i} className={`flex flex-col items-center justify-center w-12 h-16 rounded-[20px] gap-1 transition-all ${day.active ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-[#666]'}`}>
                    <span className="text-[10px] font-medium opacity-60">{day.d}</span>
                    <span className="text-lg font-bold">{day.n}</span>
                </div>
            ))}
        </div>
    );
}

// ----------------------------------------------------------------------------
// 2. Data Viz Components
// ----------------------------------------------------------------------------

function StressLineChart() {
    // Simulated SVG Path for the chart
    return (
        <div className="w-full h-[180px] relative">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-full h-[1px] bg-[#222] border-t border-dashed border-[#333]" />)}
            </div>

            {/* The Gradient Line */}
            <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="lineScroll" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FFAA00" />  {/* High Stress (Orange) */}
                        <stop offset="50%" stopColor="#FF4400" />
                        <stop offset="100%" stopColor="#00A2FF" /> {/* Low Stress (Blue) */}
                    </linearGradient>
                </defs>
                <path
                    d="M0,80 C20,70 40,90 60,60 C80,30 100,50 120,80 C140,110 160,100 180,120 C200,140 220,130 240,150 C260,170 280,140 300,120"
                    fill="none"
                    stroke="url(#lineScroll)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
                />
            </svg>

            <div className="absolute bottom-2 left-2 text-[10px] text-[#666]">06:30 AM</div>
            <div className="absolute bottom-2 right-2 text-[10px] text-[#666]">07:30 AM</div>
        </div>
    );
}

// ----------------------------------------------------------------------------
// 3. Content Components (Meal Card)
// ----------------------------------------------------------------------------

function MealCard() {
    return (
        <div className="bg-[#1A1A1A] rounded-[32px] p-6 text-white font-sans">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif text-xl">Daily 3-Meal Plan</h3>
                <span className="text-xs text-[#666] font-mono">Lunch in 2h 32m</span>
            </div>

            {/* Timeline */}
            <div className="flex items-center justify-between relative mb-8">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#333] -z-0" />

                {/* Item 1 */}
                <div className="flex flex-col items-center gap-2 relative z-10 bg-[#1A1A1A] px-2">
                    <div className="w-12 h-12 rounded-full bg-[#222] flex items-center justify-center text-xl relative">
                        🥐
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#00FF94] rounded-full border-2 border-[#1A1A1A] flex items-center justify-center">
                            <Check className="w-2 h-2 text-black" strokeWidth={4} />
                        </div>
                    </div>
                    <span className="text-xs text-[#666]">9:00</span>
                </div>

                {/* Item 2 */}
                <div className="flex flex-col items-center gap-2 relative z-10 bg-[#1A1A1A] px-2">
                    <div className="w-12 h-12 rounded-full bg-[#222] border-2 border-[#FFAA00] flex items-center justify-center text-xl shadow-[0_0_15px_rgba(255,170,0,0.3)]">
                        🥘
                    </div>
                    <span className="text-xs text-white font-bold">13:00</span>
                </div>

                {/* Item 3 */}
                <div className="flex flex-col items-center gap-2 relative z-10 bg-[#1A1A1A] px-2">
                    <div className="w-12 h-12 rounded-full bg-[#222] flex items-center justify-center text-xl opacity-50">
                        🥗
                    </div>
                    <span className="text-xs text-[#666]">18:00</span>
                </div>
            </div>

            {/* Meta Tags */}
            <div className="flex gap-2 flex-wrap">
                <div className="px-3 py-1.5 rounded-full bg-[#222] text-[#888] text-[10px] flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    Mo - Fr
                </div>
                <div className="px-3 py-1.5 rounded-full bg-[#222] text-[#888] text-[10px] flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    3 meals daily
                </div>
                <div className="px-3 py-1.5 rounded-full bg-[#222] text-[#888] text-[10px] flex items-center gap-1.5">
                    <User className="w-3 h-3" />
                    for 2 adults
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------------
// 4. Floating Capsule Nav
// ----------------------------------------------------------------------------

function FloatingCapsuleNav() {
    return (
        <div className="bg-[#141414]/90 backdrop-blur-xl border border-white/5 p-1.5 rounded-full flex items-center gap-1 shadow-2xl">
            <button className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]">
                <Home className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 rounded-full text-[#666] hover:text-white flex items-center justify-center transition-colors">
                <Zap className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 rounded-full text-[#666] hover:text-white flex items-center justify-center transition-colors">
                <User className="w-5 h-5" />
            </button>
        </div>
    );
}


// ----------------------------------------------------------------------------
// Main Experiment Page
// ----------------------------------------------------------------------------

export default function SoftUIGallery() {
    return (
        <div className="min-h-screen bg-black pb-32">
            {/* Header with Elastic Pull inherited/reused or just simple title for gallery */}
            <div className="p-8 pt-12">
                <h1 className="text-3xl font-serif text-white mb-2">Soft Gallery</h1>
                <p className="text-[#666]">Experimental Sandbox</p>
            </div>

            <div className="px-6 space-y-12">

                {/* Section 1: Soft Card & Chart */}
                <section>
                    <h2 className="text-[#444] text-xs font-mono uppercase tracking-widest mb-4">01. SOFT CARD & VIZ</h2>
                    <div className="bg-[#111] rounded-[32px] p-6 border border-[#222]">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-white text-lg font-medium">Stress Level</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    <span className="text-xs text-[#00A2FF] font-mono">MANAGEABLE</span>
                                </div>
                            </div>
                            <button className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-[#666]">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                        <StressLineChart />
                    </div>
                </section>

                {/* Section 2: Interactions */}
                <section>
                    <h2 className="text-[#444] text-xs font-mono uppercase tracking-widest mb-4">02. INTERACTIONS</h2>
                    <div className="space-y-6">
                        <DateStripper />
                        <SegmentedToggle />
                        <div className="space-y-3">
                            <CustomCheckbox label="Morning workout" checked={true} />
                            <CustomCheckbox label="Drink water" />
                            <CustomCheckbox label="Evening walk" />
                        </div>
                    </div>
                </section>

                {/* Section 3: Meal Card */}
                <section>
                    <h2 className="text-[#444] text-xs font-mono uppercase tracking-widest mb-4">03. CONTENT CARD</h2>
                    <MealCard />
                </section>

                {/* Section 4: Nav */}
                <section className="flex flex-col items-center">
                    <h2 className="text-[#444] text-xs font-mono uppercase tracking-widest mb-4">04. CAPSULE NAV</h2>
                    <FloatingCapsuleNav />
                </section>

            </div>
        </div>
    );
}
