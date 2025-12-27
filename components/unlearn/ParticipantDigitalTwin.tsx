'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { Settings, User, ChevronLeft, ChevronRight } from 'lucide-react';

// Animated number for table cells
function AnimatedValue({ value, delay = 0 }: { value: string; delay?: number }) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShow(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <motion.span
            initial={{ opacity: 0, y: 5 }}
            animate={show ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.3 }}
        >
            {value}
        </motion.span>
    );
}

// Assessment metrics data
const metrics = [
    { name: 'Anxiety Score', baseline: 4, month3: '3.8 ± 0.9', month6: '4.0 ± 0.8', month9: '3.9 ± 0.8', month12: '3.9 ± 0.9', month15: '4.0 ± 1.0' },
    { name: 'Sleep Quality', baseline: 0, month3: '0.3 ± 0.5', month6: '0.5 ± 0.7', month9: '0.7 ± 0.7', month12: '0.8 ± 0.8', month15: '1.0 ± 0.9' },
    { name: 'Stress Resilience', baseline: 1, month3: '0.8 ± 0.7', month6: '0.9 ± 0.8', month9: '0.9 ± 0.8', month12: '0.8 ± 0.8', month15: '0.8 ± 0.8' },
    { name: 'Mood Stability', baseline: 4, month3: '1.5 ± 0.9', month6: '1.5 ± 0.8', month9: '1.5 ± 1.0', month12: '1.4 ± 1.0', month15: '1.6 ± 1.2' },
    { name: 'Energy Level', baseline: 0, month3: '1.2 ± 0.9', month6: '1.2 ± 1.0', month9: '1.5 ± 1.0', month12: '1.4 ± 0.9', month15: '1.6 ± 0.9' },
    { name: 'HRV Score', baseline: 9, month3: '8.8 ± 0.5', month6: '8.7 ± 0.5', month9: '8.8 ± 0.8', month12: '8.3 ± 0.4', month15: '8.5 ± 0.8' },
    { name: 'Cognitive Focus', baseline: 3, month3: '3.1 ± 1.5', month6: '3.2 ± 0.8', month9: '3.4 ± 1.4', month12: '3.3 ± 1.6', month15: '3.6 ± 1.4' },
    { name: 'Physical Activity', baseline: 3, month3: '3.0 ± 0.9', month6: '3.0 ± 1.2', month9: '3.3 ± 1.3', month12: '3.0 ± 1.3', month15: '3.4 ± 1.4' },
];

interface ParticipantInfo {
    name: string;
    age: number;
    gender: string;
    diagnosis: string;
    weight: string;
    height: string;
    history: string[];
}

const participant: ParticipantInfo = {
    name: 'Sarah Mitchell',
    age: 34,
    gender: 'Female',
    diagnosis: 'GAD',
    weight: '62.3 kg',
    height: '168 cm',
    history: ['No hypertension', 'No diabetes'],
};

export default function ParticipantDigitalTwin() {
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: true, margin: '-100px' });
    const [timeOffset, setTimeOffset] = useState(0);

    const timeLabels = ['Time (weeks)', 'Baseline', '3', '6', '9', '12', '15'];

    return (
        <section
            ref={containerRef}
            className="relative py-24"
            style={{ backgroundColor: '#0B3D2E' }}
        >
            <div className="max-w-[1400px] mx-auto px-6">
                <div className="grid lg:grid-cols-[300px_1fr] gap-12 items-start">
                    {/* Left Column - Labels */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.6 }}
                        className="space-y-6"
                    >
                        <div
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium"
                            style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}
                        >
                            <span className="w-2 h-2 bg-[#D4AF37]" />
                            DIGITAL TWIN TECHNOLOGY
                        </div>

                        <div className="space-y-3">
                            {['Predicted longitudinal outcomes', 'Time since baseline visit', 'Participant\'s baseline data'].map((label, i) => (
                                <motion.div
                                    key={label}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                                    transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                                    className="px-4 py-3 text-sm text-white/80"
                                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                >
                                    {label}
                                </motion.div>
                            ))}
                        </div>

                        <div
                            className="px-4 py-3 text-sm font-medium"
                            style={{ backgroundColor: 'rgba(212, 175, 55, 0.2)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}
                        >
                            Endpoints
                        </div>

                        <div className="pt-8">
                            <h2
                                className="text-white font-bold leading-[1.1] mb-4"
                                style={{ fontSize: 'clamp(24px, 3vw, 36px)' }}
                            >
                                Personalized ML models trained on your data
                            </h2>
                            <p className="text-white/60 text-sm leading-relaxed">
                                Your digital twin continuously learns from your inputs to provide increasingly accurate predictions.
                            </p>
                        </div>
                    </motion.div>

                    {/* Right Column - Data Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="overflow-hidden"
                        style={{
                            backgroundColor: 'rgba(11, 61, 46, 0.9)',
                            border: '1px solid rgba(212, 175, 55, 0.2)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                        }}
                    >
                        {/* Header */}
                        <div
                            className="flex items-center justify-between px-6 py-4"
                            style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.15)' }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 bg-[#D4AF37] flex items-center justify-center">
                                    <span className="text-[#0B3D2E] font-bold text-sm">A</span>
                                </div>
                                <span className="text-white text-sm">
                                    Participant&apos;s Digital Twin in <span className="text-[#D4AF37]">Anxiety Recovery</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-white/50 hover:text-white transition-colors">
                                    <Settings className="w-4 h-4" />
                                </button>
                                <button className="p-2 text-white/50 hover:text-white transition-colors">
                                    <User className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Participant Info */}
                        <div className="flex items-start gap-6 px-6 py-4" style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.1)' }}>
                            {/* Avatar */}
                            <div className="relative w-16 h-16 overflow-hidden flex-shrink-0">
                                <div
                                    className="absolute inset-0 flex items-center justify-center text-2xl font-bold"
                                    style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #B8960C 100%)', color: '#0B3D2E' }}
                                >
                                    SM
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-3 gap-x-8 gap-y-2 text-sm flex-1">
                                <div>
                                    <span className="text-white/50">Age: </span>
                                    <span className="text-white">{participant.age}</span>
                                </div>
                                <div>
                                    <span className="text-white/50">Diagnosis: </span>
                                    <span className="text-white">{participant.diagnosis}</span>
                                </div>
                                <div>
                                    <span className="text-white/50">History: </span>
                                    <span className="text-white">{participant.history[0]}</span>
                                </div>
                                <div>
                                    <span className="text-white/50">Sex: </span>
                                    <span className="text-white">{participant.gender}</span>
                                </div>
                                <div>
                                    <span className="text-white/50">Weight: </span>
                                    <span className="text-white">{participant.weight}</span>
                                </div>
                                <div>
                                    <span className="text-white/50">History: </span>
                                    <span className="text-white">{participant.history[1]}</span>
                                </div>
                                <div>
                                    <span className="text-white/50">Height: </span>
                                    <span className="text-white">{participant.height}</span>
                                </div>
                            </div>
                        </div>

                        {/* Time Slider */}
                        <div className="px-6 py-3 flex items-center gap-4" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                            <button
                                onClick={() => setTimeOffset(Math.max(0, timeOffset - 1))}
                                className="p-1 text-white/50 hover:text-white transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="flex-1 flex justify-between text-xs text-white/60">
                                {timeLabels.map((label, i) => (
                                    <span key={label} className={i === 0 ? 'text-white/40' : ''}>{label}</span>
                                ))}
                            </div>
                            <button
                                onClick={() => setTimeOffset(timeOffset + 1)}
                                className="p-1 text-white/50 hover:text-white transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Data Table with animated values */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)' }}>
                                        <th className="px-4 py-3 text-left text-white/60 font-medium">Metric</th>
                                        <th className="px-4 py-3 text-center text-white/60 font-medium">Baseline</th>
                                        <th className="px-4 py-3 text-center text-white/60 font-medium">3 weeks</th>
                                        <th className="px-4 py-3 text-center text-white/60 font-medium">6 weeks</th>
                                        <th className="px-4 py-3 text-center text-white/60 font-medium">9 weeks</th>
                                        <th className="px-4 py-3 text-center text-white/60 font-medium">12 weeks</th>
                                        <th className="px-4 py-3 text-center text-white/60 font-medium">15 weeks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {metrics.map((metric, i) => (
                                        <motion.tr
                                            key={metric.name}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={isInView ? { opacity: 1, x: 0 } : {}}
                                            transition={{ duration: 0.4, delay: 0.5 + i * 0.05 }}
                                            className="border-b border-white/5"
                                            style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}
                                        >
                                            <td className="px-4 py-3 text-white/80">{metric.name}</td>
                                            <td className="px-4 py-3 text-center text-[#D4AF37]">
                                                <AnimatedValue value={String(metric.baseline)} delay={500 + i * 50} />
                                            </td>
                                            <td className="px-4 py-3 text-center text-white/60">
                                                <AnimatedValue value={metric.month3} delay={600 + i * 50} />
                                            </td>
                                            <td className="px-4 py-3 text-center text-white/60">
                                                <AnimatedValue value={metric.month6} delay={700 + i * 50} />
                                            </td>
                                            <td className="px-4 py-3 text-center text-white/60">
                                                <AnimatedValue value={metric.month9} delay={800 + i * 50} />
                                            </td>
                                            <td className="px-4 py-3 text-center text-white/60">
                                                <AnimatedValue value={metric.month12} delay={900 + i * 50} />
                                            </td>
                                            <td className="px-4 py-3 text-center text-white/60">
                                                <AnimatedValue value={metric.month15} delay={1000 + i * 50} />
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
