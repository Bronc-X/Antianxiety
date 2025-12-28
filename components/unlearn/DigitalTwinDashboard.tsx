'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { Settings, User } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// Mock patient data
const patients = [
    { id: 1, name: 'Sarah M.', age: 34, status: 'active' },
    { id: 2, name: 'James L.', age: 42, status: 'active' },
    { id: 3, name: 'Maria G.', age: 28, status: 'active' },
    { id: 4, name: 'Robert K.', age: 51, status: 'active' },
    { id: 5, name: 'Emily R.', age: 39, status: 'active' },
    { id: 6, name: 'Michael T.', age: 45, status: 'active' },
    { id: 7, name: 'Lisa W.', age: 33, status: 'active' },
    { id: 8, name: 'David H.', age: 48, status: 'active' },
];

// Chart data points
const chartData = [
    { month: '3m', prediction: 0.5, actual: 0.3 },
    { month: '6m', prediction: 0.9, actual: 0.8 },
    { month: '9m', prediction: 0.8, actual: 0.9 },
    { month: '12m', prediction: 1.8, actual: 1.5 },
    { month: '15m', prediction: 2.8, actual: 2.5 },
    { month: '18m', prediction: 3.0, actual: 2.8 },
    { month: '21m', prediction: 3.5, actual: 3.2 },
    { month: '24m', prediction: 3.8, actual: 3.5 },
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
    const [selectedPatient, setSelectedPatient] = useState(patients[0]);
    const [animationComplete, setAnimationComplete] = useState(false);
    const monthLabel = (month: string) => (language === 'en' ? month : month.replace('m', '个月'));

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
                </motion.div>

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

                    {/* Patient Avatars */}
                    <div className="px-6 py-4">
                        <div className="flex flex-wrap gap-3">
                            {patients.map((patient, i) => (
                                <motion.button
                                    key={patient.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                    transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
                                    onClick={() => setSelectedPatient(patient)}
                                    className={`
                    relative w-12 h-12 overflow-hidden
                    transition-all duration-300
                    ${selectedPatient.id === patient.id
                                            ? 'ring-2 ring-[#D4AF37] ring-offset-2 ring-offset-[#0B3D2E]'
                                            : 'opacity-60 hover:opacity-100'
                                        }
                  `}
                                    style={{
                                        background: `linear-gradient(135deg, #D4AF37 0%, #B8960C 100%)`,
                                    }}
                                >
                                    <div className="absolute inset-0 flex items-center justify-center text-[#0B3D2E] font-medium text-sm">
                                        {patient.name.split(' ')[0][0]}{patient.name.split(' ')[1]?.[0] || ''}
                                    </div>
                                </motion.button>
                            ))}
                            <div className="w-12 h-12 border border-dashed border-white/20 flex items-center justify-center text-white/30 text-xl">
                                +
                            </div>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="px-6 py-6">
                        <div
                            className="p-6"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                        >
                            <h3 className="text-white font-medium mb-6">
                                {language === 'en'
                                    ? 'Digital Twin Prediction vs. Actual Outcomes'
                                    : '数字孪生预测 vs. 实际结果'}
                            </h3>

                            {/* Animated SVG Chart */}
                            <div className="relative h-[200px]">
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
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10"
                                >
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-[#D4AF37]">
                                            <AnimatedNumber value={94} />%
                                        </div>
                                        <div className="text-xs text-white/50 mt-1">
                                            {language === 'en' ? 'Prediction Accuracy' : '预测准确率'}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-white">
                                            <AnimatedNumber value={47} />%
                                        </div>
                                        <div className="text-xs text-white/50 mt-1">
                                            {language === 'en' ? 'Improvement Rate' : '改善幅度'}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-[#D4AF37]">
                                            <AnimatedNumber value={12} />
                                        </div>
                                        <div className="text-xs text-white/50 mt-1">
                                            {language === 'en' ? 'Days to Results' : '平均见效天数'}
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
