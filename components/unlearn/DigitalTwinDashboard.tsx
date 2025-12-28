'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { Settings, User } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import LogoTicker from './LogoTicker';

// 5 users with different chart data and stats
const users = [
    {
        id: 1,
        name: 'A.W.',
        chartData: [
            { month: '3m', prediction: 0.5, actual: 0.3 },
            { month: '6m', prediction: 0.9, actual: 0.8 },
            { month: '9m', prediction: 1.5, actual: 1.4 },
            { month: '12m', prediction: 2.2, actual: 2.0 },
            { month: '15m', prediction: 2.8, actual: 2.6 },
            { month: '18m', prediction: 3.2, actual: 3.0 },
            { month: '21m', prediction: 3.6, actual: 3.4 },
            { month: '24m', prediction: 3.9, actual: 3.7 },
        ],
        stats: { accuracy: 94, improvement: 47, days: 12 },
    },
    {
        id: 2,
        name: 'B.L.',
        chartData: [
            { month: '3m', prediction: 0.8, actual: 0.6 },
            { month: '6m', prediction: 1.2, actual: 1.0 },
            { month: '9m', prediction: 1.8, actual: 1.9 },
            { month: '12m', prediction: 2.5, actual: 2.3 },
            { month: '15m', prediction: 3.0, actual: 2.8 },
            { month: '18m', prediction: 3.4, actual: 3.5 },
            { month: '21m', prediction: 3.7, actual: 3.6 },
            { month: '24m', prediction: 3.9, actual: 3.8 },
        ],
        stats: { accuracy: 91, improvement: 52, days: 10 },
    },
    {
        id: 3,
        name: 'C.Z.',
        chartData: [
            { month: '3m', prediction: 0.3, actual: 0.4 },
            { month: '6m', prediction: 0.7, actual: 0.6 },
            { month: '9m', prediction: 1.2, actual: 1.1 },
            { month: '12m', prediction: 1.8, actual: 1.6 },
            { month: '15m', prediction: 2.4, actual: 2.2 },
            { month: '18m', prediction: 2.9, actual: 2.7 },
            { month: '21m', prediction: 3.3, actual: 3.1 },
            { month: '24m', prediction: 3.6, actual: 3.4 },
        ],
        stats: { accuracy: 89, improvement: 41, days: 15 },
    },
    {
        id: 4,
        name: 'D.C.',
        chartData: [
            { month: '3m', prediction: 0.6, actual: 0.5 },
            { month: '6m', prediction: 1.1, actual: 1.2 },
            { month: '9m', prediction: 1.6, actual: 1.5 },
            { month: '12m', prediction: 2.3, actual: 2.4 },
            { month: '15m', prediction: 2.9, actual: 2.7 },
            { month: '18m', prediction: 3.3, actual: 3.2 },
            { month: '21m', prediction: 3.6, actual: 3.5 },
            { month: '24m', prediction: 3.8, actual: 3.7 },
        ],
        stats: { accuracy: 96, improvement: 55, days: 8 },
    },
    {
        id: 5,
        name: 'E.L.',
        chartData: [
            { month: '3m', prediction: 0.4, actual: 0.3 },
            { month: '6m', prediction: 0.8, actual: 0.9 },
            { month: '9m', prediction: 1.4, actual: 1.3 },
            { month: '12m', prediction: 2.0, actual: 1.8 },
            { month: '15m', prediction: 2.6, actual: 2.5 },
            { month: '18m', prediction: 3.1, actual: 2.9 },
            { month: '21m', prediction: 3.5, actual: 3.3 },
            { month: '24m', prediction: 3.8, actual: 3.6 },
        ],
        stats: { accuracy: 92, improvement: 44, days: 14 },
    },
];

// Animated number component
function AnimatedNumber({ value, duration = 1 }: { value: number; duration?: number }) {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (v) => Math.round(v * 10) / 10);
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const controls = animate(count, value, {
            duration,
            ease: 'easeOut',
        });

        const unsubscribe = rounded.on('change', (v) => setDisplayValue(v));

        return () => {
            controls.stop();
            unsubscribe();
        };
    }, [value, count, rounded, duration]);

    return <>{displayValue}</>;
}

export default function DigitalTwinDashboard() {
    const { language } = useI18n();
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: true, margin: '-100px' });
    const [selectedUser, setSelectedUser] = useState(users[0]);
    const [animationComplete, setAnimationComplete] = useState(false);
    const monthLabel = (month: string) => (language === 'en' ? month : month.replace('m', '个月'));

    const chartData = selectedUser.chartData;

    useEffect(() => {
        if (isInView) {
            const timer = setTimeout(() => setAnimationComplete(true), 500);
            return () => clearTimeout(timer);
        }
    }, [isInView]);

    return (
        <section
            ref={containerRef}
            className="relative py-24"
            style={{ backgroundColor: '#0B3D2E' }}
        >
            <div className="max-w-[1280px] mx-auto px-6">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="mb-12"
                >
                    <p className="text-sm uppercase tracking-widest font-medium mb-4 text-[#D4AF37]">
                        {language === 'en' ? 'Digital Twin Technology' : '数字孪生技术'}
                    </p>
                    <h2
                        className="text-white font-bold leading-[1.1] tracking-[-0.02em] mb-4"
                        style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}
                    >
                        {language === 'en' ? 'Predict outcomes before they happen' : '在结果发生前完成预测'}
                    </h2>
                    <p className="text-white/60 text-sm md:text-base max-w-2xl leading-relaxed font-serif">
                        {language === 'en' 
                            ? 'We query peer-reviewed journals via Semantic Scholar API, filter noise through relevance scoring, and use AI to adapt recommendations to your unique physiological patterns.'
                            : '通过 Semantic Scholar API 检索同行评审期刊，基于相关性评分过滤噪音，AI 根据你独特的生理模式自适应调整健康计划。'}
                    </p>
                </motion.div>

                {/* Logo Ticker - Research Sources */}
                <div className="mb-12 -mx-6">
                    <LogoTicker />
                </div>

                {/* Dashboard Card */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="overflow-hidden"
                    style={{
                        backgroundColor: 'rgba(11, 61, 46, 0.8)',
                        border: '1px solid rgba(212, 175, 55, 0.2)',
                    }}
                >
                    {/* Dashboard Header */}
                    <div
                        className="flex items-center justify-between px-6 py-4"
                        style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.15)' }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#D4AF37] flex items-center justify-center">
                                <span className="text-[#0B3D2E] font-bold text-sm">A</span>
                            </div>
                            <span className="text-white font-medium">
                                {language === 'en' ? 'Anxiety Recovery Program' : '焦虑恢复计划'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-white/50 hover:text-white transition-colors">
                                <Settings className="w-5 h-5" />
                            </button>
                            <button className="p-2 text-white/50 hover:text-white transition-colors">
                                <User className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* User Selector */}
                    <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.15)' }}>
                        <p className="text-xs text-white/40 mb-3 font-serif">
                            {language === 'en' ? 'Select participant to view data:' : '选择参与者查看数据：'}
                        </p>
                        <div className="flex gap-3">
                            {users.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => setSelectedUser(user)}
                                    className={`px-4 py-2 text-sm font-serif transition-all ${
                                        selectedUser.id === user.id
                                            ? 'bg-[#D4AF37] text-[#0B3D2E]'
                                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    {user.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="px-6 py-6">
                        <div
                            className="p-6"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                        >
                            <h3 className="text-white font-medium mb-6 font-serif">
                                {language === 'en'
                                    ? 'Digital Twin Prediction vs. Actual Outcomes'
                                    : '数字孪生预测 vs. 实际结果'}
                            </h3>

                            {/* Animated SVG Chart */}
                            <div className="relative h-[200px] ml-10">
                                {/* Y-axis labels */}
                                <div className="absolute -left-10 top-0 bottom-6 flex flex-col justify-between text-xs text-white/40">
                                    <span>4.0</span>
                                    <span>3.0</span>
                                    <span>2.0</span>
                                    <span>1.0</span>
                                    <span>0</span>
                                </div>
                                
                                <svg
                                    viewBox="0 0 400 150"
                                    className="w-full h-full"
                                    preserveAspectRatio="none"
                                >
                                    {/* Grid lines with subtle animation */}
                                    {[0, 1, 2, 3, 4, 5].map((i) => (
                                        <motion.line
                                            key={i}
                                            initial={{ opacity: 0 }}
                                            animate={isInView ? { opacity: 1 } : {}}
                                            transition={{ duration: 0.3, delay: 0.1 * i }}
                                            x1="0"
                                            y1={i * 30}
                                            x2="400"
                                            y2={i * 30}
                                            stroke="rgba(255,255,255,0.1)"
                                            strokeWidth="1"
                                        />
                                    ))}

                                    {/* Prediction line (gold) with draw animation */}
                                    <motion.path
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
                                        transition={{ duration: 2, delay: 0.5, ease: 'easeOut' }}
                                        d={`M ${chartData.map((d, i) =>
                                            `${(i / (chartData.length - 1)) * 380 + 10},${130 - d.prediction * 30}`
                                        ).join(' L ')}`}
                                        fill="none"
                                        stroke="#D4AF37"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />

                                    {/* Actual line (white) with draw animation */}
                                    <motion.path
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
                                        transition={{ duration: 2, delay: 0.7, ease: 'easeOut' }}
                                        d={`M ${chartData.map((d, i) =>
                                            `${(i / (chartData.length - 1)) * 380 + 10},${130 - d.actual * 30}`
                                        ).join(' L ')}`}
                                        fill="none"
                                        stroke="rgba(255,255,255,0.6)"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />

                                    {/* Data points - Prediction with pop animation */}
                                    {chartData.map((d, i) => (
                                        <motion.circle
                                            key={`pred-${i}`}
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={isInView ? { scale: 1, opacity: 1 } : {}}
                                            transition={{
                                                duration: 0.4,
                                                delay: 1.5 + i * 0.1,
                                                type: 'spring',
                                                stiffness: 200
                                            }}
                                            cx={(i / (chartData.length - 1)) * 380 + 10}
                                            cy={130 - d.prediction * 30}
                                            r="5"
                                            fill="#D4AF37"
                                        />
                                    ))}

                                    {/* Data points - Actual with pop animation */}
                                    {chartData.map((d, i) => (
                                        <motion.circle
                                            key={`actual-${i}`}
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={isInView ? { scale: 1, opacity: 1 } : {}}
                                            transition={{
                                                duration: 0.4,
                                                delay: 1.7 + i * 0.1,
                                                type: 'spring',
                                                stiffness: 200
                                            }}
                                            cx={(i / (chartData.length - 1)) * 380 + 10}
                                            cy={130 - d.actual * 30}
                                            r="5"
                                            fill="rgba(255,255,255,0.8)"
                                        />
                                    ))}
                                </svg>

                                {/* X-axis labels */}
                                <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-white/40">
                                    {chartData.map((d) => (
                                        <span key={d.month}>{monthLabel(d.month)}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="flex items-center gap-6 mt-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-[#D4AF37]" />
                                    <span className="text-sm text-white/60">
                                        {language === 'en' ? 'Digital Twin Prediction' : '数字孪生预测'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-white/60" />
                                    <span className="text-sm text-white/60">
                                        {language === 'en' ? 'Actual Outcomes' : '实际结果'}
                                    </span>
                                </div>
                            </div>

                            {/* Animated Stats */}
                            {animationComplete && (
                                <motion.div
                                    key={selectedUser.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10"
                                >
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-[#D4AF37]">
                                            <AnimatedNumber value={selectedUser.stats.accuracy} />%
                                        </div>
                                        <div className="text-xs text-white/50 mt-1 font-serif">
                                            {language === 'en' ? 'Prediction Accuracy' : '预测准确率'}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-white">
                                            <AnimatedNumber value={selectedUser.stats.improvement} />%
                                        </div>
                                        <div className="text-xs text-white/50 mt-1 font-serif">
                                            {language === 'en' ? 'Improvement Rate' : '改善幅度'}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-[#D4AF37]">
                                            <AnimatedNumber value={selectedUser.stats.days} />
                                        </div>
                                        <div className="text-xs text-white/50 mt-1 font-serif">
                                            {language === 'en' ? 'Days to Results' : '见效天数'}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
