'use client';

import { motion, useMotionValue, useSpring, useTransform, animate, PanInfo } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
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
    Home,
    Search,
    Menu,
    Bell
} from 'lucide-react';

// ----------------------------------------------------------------------------
// 1. Light Mode Elastic Header
// ----------------------------------------------------------------------------
function ElasticHeaderLight() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 375, height: 300 });
    const dragY = useMotionValue(0);
    const stretch = useSpring(dragY, { stiffness: 400, damping: 15, mass: 1 });

    // Light Mode Gradient
    const pathD = useTransform(stretch, (y) => {
        const h = dimensions.height;
        const controlY = h + Math.max(0, y * 1.5);
        return `M 0 0 L ${dimensions.width} 0 L ${dimensions.width} ${h} Q ${dimensions.width / 2} ${controlY} 0 ${h} Z`;
    });

    const contentY = useTransform(stretch, (y) => y * 0.3);

    useEffect(() => {
        if (containerRef.current) {
            setDimensions({
                width: containerRef.current.offsetWidth,
                height: 280
            });
        }
    }, []);

    const handlePan = (_: any, info: PanInfo) => {
        if (info.offset.y > 0) dragY.set(info.offset.y);
    };

    const handlePanEnd = () => {
        animate(dragY, 0, { type: "spring", stiffness: 400, damping: 15 });
    };

    return (
        <div ref={containerRef} className="relative w-full h-[280px] overflow-hidden select-none touch-none z-30">
            <svg
                className="absolute top-0 left-0 w-full h-[600px] pointer-events-none drop-shadow-sm"
                viewBox={`0 0 ${dimensions.width} 600`}
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient id="headerGradientLight" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FFFFFF" />
                        <stop offset="100%" stopColor="#F5F5F7" />
                    </linearGradient>
                </defs>
                <motion.path
                    d={pathD}
                    fill="url(#headerGradientLight)"
                    className="drop-shadow-xl"
                />
            </svg>

            <motion.div
                className="absolute inset-0 z-50 cursor-grab active:cursor-grabbing"
                onPan={handlePan}
                onPanEnd={handlePanEnd}
                style={{ touchAction: "none" }}
            />

            {/* Bio-Orb Light */}
            <motion.div
                className="absolute z-40 pointer-events-none flex items-center justify-center p-4"
                style={{
                    top: 0, left: 0, right: 0,
                    y: useTransform(dragY, (y) => y + dimensions.height - 40),
                    opacity: useTransform(dragY, [0, 50], [0, 1]),
                    scale: useTransform(dragY, [0, 150], [0.5, 1.2])
                }}
            >
                <div className="w-12 h-12 relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-[#000] rounded-full blur-xl opacity-10" />
                    <div className="w-full h-full bg-white/80 rounded-full border border-black/5 flex items-center justify-center shadow-lg">
                        <div className="w-4 h-4 bg-black rounded-full" />
                    </div>
                </div>
            </motion.div>

            <motion.div
                className="relative z-10 p-6 pt-16 flex flex-col h-full pointer-events-none text-black"
                style={{ y: contentY }}
            >
                <div className="flex justify-between items-start mb-4">
                    <button className="p-2 bg-white rounded-full shadow-sm border border-gray-100">
                        <Menu className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="flex gap-3">
                        <button className="p-2 bg-white rounded-full shadow-sm border border-gray-100 relative">
                            <Bell className="w-5 h-5 text-gray-600" />
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-white shadow-sm">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                        </div>
                    </div>
                </div>

                <h1 className="text-3xl font-serif text-[#1A1A1A] mb-1">Thursday</h1>
                <p className="text-gray-500 text-sm font-medium">October 24, 2025</p>

                {/* Search Pill */}
                <div className="mt-6 w-full bg-white h-12 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 flex items-center px-4 gap-3">
                    <Search className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-400 text-sm">Search for plans, food...</span>
                </div>
            </motion.div>
        </div>
    );
}

// ----------------------------------------------------------------------------
// 2. Light Mode Components
// ----------------------------------------------------------------------------

function StressChartLight() {
    return (
        <div className="w-full h-[180px] relative mt-4">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-full h-[1px] bg-gray-50/50 border-t border-dashed border-gray-200" />)}
            </div>
            <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="lineScrollLight" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FF9F0A" />
                        <stop offset="50%" stopColor="#FF375F" />
                        <stop offset="100%" stopColor="#0A84FF" />
                    </linearGradient>
                </defs>
                <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5 }}
                    d="M0,80 C20,70 40,90 60,60 C80,30 100,50 120,80 C140,110 160,100 180,120 C200,140 220,130 240,150 C260,170 280,140 300,120"
                    fill="none"
                    stroke="url(#lineScrollLight)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="drop-shadow-md"
                />
            </svg>
            <div className="absolute bottom-2 left-2 text-[10px] text-gray-400 font-mono">06:00</div>
            <div className="absolute bottom-2 right-2 text-[10px] text-gray-400 font-mono">18:00</div>
        </div>
    );
}

function MealCardLight() {
    return (
        <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100/50">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-serif text-xl text-[#1A1A1A]">Daily 3-Meal Plan</h3>
                    <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full mt-1 inline-block">On Track</span>
                </div>
                <span className="text-xs text-gray-400 font-mono">Lunch in 2h</span>
            </div>

            <div className="flex items-center justify-between relative mb-8">
                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gray-100 -z-0" />

                <div className="flex flex-col items-center gap-2 relative z-10 bg-white px-2">
                    <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-xl relative shadow-sm">
                        🥐
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                            <Check className="w-2 h-2 text-white" strokeWidth={4} />
                        </div>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">9:00</span>
                </div>

                <div className="flex flex-col items-center gap-2 relative z-10 bg-white px-2">
                    <div className="w-14 h-14 rounded-full bg-white border-2 border-orange-400/30 flex items-center justify-center text-2xl shadow-[0_4px_12px_rgba(255,160,0,0.15)]">
                        🥘
                    </div>
                    <span className="text-xs text-black font-bold">13:00</span>
                </div>

                <div className="flex flex-col items-center gap-2 relative z-10 bg-white px-2">
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-xl opacity-40 grayscale">
                        🥗
                    </div>
                    <span className="text-xs text-gray-300">18:00</span>
                </div>
            </div>

            <div className="flex gap-2">
                {['Mo - Fr', '3 meals', '2 adults'].map((tag) => (
                    <span key={tag} className="px-3 py-1.5 rounded-full bg-gray-50 text-gray-500 text-[10px] font-medium border border-gray-100">
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    );
}

function CapsuleNavLight() {
    return (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 p-1.5 rounded-full flex items-center gap-1 shadow-[0_8px_30px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.02)]">
            <button className="w-12 h-12 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center shadow-lg">
                <Home className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 rounded-full text-gray-400 hover:bg-gray-50 hover:text-black flex items-center justify-center transition-colors">
                <Zap className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 rounded-full text-gray-400 hover:bg-gray-50 hover:text-black flex items-center justify-center transition-colors">
                <User className="w-5 h-5" />
            </button>
        </div>
    );
}

// ----------------------------------------------------------------------------
// 3. Unified Page
// ----------------------------------------------------------------------------

export default function UnifiedSoftLight() {
    return (
        <div className="min-h-screen bg-[#FAFAFA] pb-32 font-sans relative">
            <ElasticHeaderLight />

            <div className="relative z-20 px-6 -mt-16 flex flex-col gap-6">

                {/* Card 1: Stress (Soft & Clean) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100/50"
                >
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="text-[#1A1A1A] text-lg font-serif">Stress Balance</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                <span className="text-xs text-blue-500 font-medium tracking-wide">OPTIMAL ZONE</span>
                            </div>
                        </div>
                        <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    <StressChartLight />
                </motion.div>

                {/* Card 2: Meal Plan */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <MealCardLight />
                </motion.div>

                {/* Interactive Elements / Toggle */}
                <div className="flex justify-center">
                    <div className="bg-white rounded-full p-1 flex shadow-sm border border-gray-100">
                        <button className="px-6 py-2 rounded-full bg-[#1A1A1A] text-white text-sm font-medium shadow-md">Today</button>
                        <button className="px-6 py-2 rounded-full text-gray-400 text-sm font-medium hover:text-black">Week</button>
                    </div>
                </div>

            </div>

            {/* Bottom Nav */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
                <CapsuleNavLight />
            </div>
        </div>
    );
}
