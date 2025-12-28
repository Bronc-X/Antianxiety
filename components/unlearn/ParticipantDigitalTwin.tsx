'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { Settings, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

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
    const { language } = useI18n();
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: true, margin: '-100px' });
    const [timeOffset, setTimeOffset] = useState(0);

    const timeLabels = language === 'en'
        ? ['Time (weeks)', 'Baseline', '3', '6', '9', '12', '15']
        : ['时间（周）', '基线', '3', '6', '9', '12', '15'];

    const metrics = language === 'en'
        ? [
            { name: 'Anxiety Score', baseline: 4, month3: '3.8 ± 0.9', month6: '4.0 ± 0.8', month9: '3.9 ± 0.8', month12: '3.9 ± 0.9', month15: '4.0 ± 1.0' },
            { name: 'Sleep Quality', baseline: 0, month3: '0.3 ± 0.5', month6: '0.5 ± 0.7', month9: '0.7 ± 0.7', month12: '0.8 ± 0.8', month15: '1.0 ± 0.9' },
            { name: 'Stress Resilience', baseline: 1, month3: '0.8 ± 0.7', month6: '0.9 ± 0.8', month9: '0.9 ± 0.8', month12: '0.8 ± 0.8', month15: '0.8 ± 0.8' },
            { name: 'Mood Stability', baseline: 4, month3: '1.5 ± 0.9', month6: '1.5 ± 0.8', month9: '1.5 ± 1.0', month12: '1.4 ± 1.0', month15: '1.6 ± 1.2' },
            { name: 'Energy Level', baseline: 0, month3: '1.2 ± 0.9', month6: '1.2 ± 1.0', month9: '1.5 ± 1.0', month12: '1.4 ± 0.9', month15: '1.6 ± 0.9' },
            { name: 'HRV Score', baseline: 9, month3: '8.8 ± 0.5', month6: '8.7 ± 0.5', month9: '8.8 ± 0.8', month12: '8.3 ± 0.4', month15: '8.5 ± 0.8' },
            { name: 'Cognitive Focus', baseline: 3, month3: '3.1 ± 1.5', month6: '3.2 ± 0.8', month9: '3.4 ± 1.4', month12: '3.3 ± 1.6', month15: '3.6 ± 1.4' },
            { name: 'Physical Activity', baseline: 3, month3: '3.0 ± 0.9', month6: '3.0 ± 1.2', month9: '3.3 ± 1.3', month12: '3.0 ± 1.3', month15: '3.4 ± 1.4' },
        ]
        : [
            { name: '焦虑评分', baseline: 4, month3: '3.8 ± 0.9', month6: '4.0 ± 0.8', month9: '3.9 ± 0.8', month12: '3.9 ± 0.9', month15: '4.0 ± 1.0' },
            { name: '睡眠质量', baseline: 0, month3: '0.3 ± 0.5', month6: '0.5 ± 0.7', month9: '0.7 ± 0.7', month12: '0.8 ± 0.8', month15: '1.0 ± 0.9' },
            { name: '压力韧性', baseline: 1, month3: '0.8 ± 0.7', month6: '0.9 ± 0.8', month9: '0.9 ± 0.8', month12: '0.8 ± 0.8', month15: '0.8 ± 0.8' },
            { name: '情绪稳定度', baseline: 4, month3: '1.5 ± 0.9', month6: '1.5 ± 0.8', month9: '1.5 ± 1.0', month12: '1.4 ± 1.0', month15: '1.6 ± 1.2' },
            { name: '能量水平', baseline: 0, month3: '1.2 ± 0.9', month6: '1.2 ± 1.0', month9: '1.5 ± 1.0', month12: '1.4 ± 0.9', month15: '1.6 ± 0.9' },
            { name: 'HRV 分数', baseline: 9, month3: '8.8 ± 0.5', month6: '8.7 ± 0.5', month9: '8.8 ± 0.8', month12: '8.3 ± 0.4', month15: '8.5 ± 0.8' },
            { name: '专注度', baseline: 3, month3: '3.1 ± 1.5', month6: '3.2 ± 0.8', month9: '3.4 ± 1.4', month12: '3.3 ± 1.6', month15: '3.6 ± 1.4' },
            { name: '身体活动', baseline: 3, month3: '3.0 ± 0.9', month6: '3.0 ± 1.2', month9: '3.3 ± 1.3', month12: '3.0 ± 1.3', month15: '3.4 ± 1.4' },
        ];

    const displayedParticipant = language === 'en'
        ? participant
        : {
            ...participant,
            name: '莎拉·米切尔',
            gender: '女',
            diagnosis: '广泛性焦虑',
            weight: '62.3 公斤',
            height: '168 厘米',
            history: ['无高血压', '无糖尿病'],
        };
    const initials = displayedParticipant.name
        .split(' ')
        .map(part => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    const maxOffset = timeLabels.length - 2;
    const activeColumn = Math.min(1 + timeOffset, timeLabels.length - 1);

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
                            {language === 'en' ? 'DIGITAL TWIN TECHNOLOGY' : '数字孪生技术'}
                        </div>

                        <div className="space-y-3">
                            {(language === 'en'
                                ? ['Predicted longitudinal outcomes', 'Time since baseline visit', 'Participant\'s baseline data']
                                : ['纵向结果预测', '基线后的时间', '参与者基线数据']
                            ).map((label, i) => (
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
                            {language === 'en' ? 'Endpoints' : '指标终点'}
                        </div>

                        <div className="pt-8">
                            <h2
                            className="text-white font-bold leading-[1.1] mb-4"
                            style={{ fontSize: 'clamp(24px, 3vw, 36px)' }}
                        >
                            {language === 'en' ? 'Personalized ML models trained on your data' : '基于你数据训练的个性化模型'}
                        </h2>
                        <p className="text-white/60 text-sm leading-relaxed">
                            {language === 'en'
                                ? 'Your digital twin continuously learns from your inputs to provide increasingly accurate predictions.'
                                : '数字孪生将持续学习你的输入，给出更精准的预测。'}
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
                                    {language === 'en'
                                        ? <>Participant&apos;s Digital Twin in <span className="text-[#D4AF37]">Anxiety Recovery</span></>
                                        : <>参与者数字孪生：<span className="text-[#D4AF37]">焦虑恢复</span></>}
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
                                    {initials}
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-3 gap-x-8 gap-y-2 text-sm flex-1">
                                <div>
                                    <span className="text-white/50">{language === 'en' ? 'Age: ' : '年龄：'}</span>
                                    <span className="text-white">{displayedParticipant.age}</span>
                                </div>
                                <div>
                                    <span className="text-white/50">{language === 'en' ? 'Diagnosis: ' : '诊断：'}</span>
                                    <span className="text-white">{displayedParticipant.diagnosis}</span>
                                </div>
                                <div>
                                    <span className="text-white/50">{language === 'en' ? 'History: ' : '病史：'}</span>
                                    <span className="text-white">{displayedParticipant.history[0]}</span>
                                </div>
                                <div>
                                    <span className="text-white/50">{language === 'en' ? 'Sex: ' : '性别：'}</span>
                                    <span className="text-white">{displayedParticipant.gender}</span>
                                </div>
                                <div>
                                    <span className="text-white/50">{language === 'en' ? 'Weight: ' : '体重：'}</span>
                                    <span className="text-white">{displayedParticipant.weight}</span>
                                </div>
                                <div>
                                    <span className="text-white/50">{language === 'en' ? 'History: ' : '病史：'}</span>
                                    <span className="text-white">{displayedParticipant.history[1]}</span>
                                </div>
                                <div>
                                    <span className="text-white/50">{language === 'en' ? 'Height: ' : '身高：'}</span>
                                    <span className="text-white">{displayedParticipant.height}</span>
                                </div>
                            </div>
                        </div>

                        {/* Time Slider */}
                        <div className="px-6 py-3 flex items-center gap-4" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                            <button
                                onClick={() => setTimeOffset(Math.max(0, timeOffset - 1))}
                                disabled={timeOffset === 0}
                                className="p-1 text-white/50 hover:text-white transition-colors disabled:opacity-30"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="flex-1 flex justify-between text-xs text-white/60">
                                {timeLabels.map((label, i) => (
                                    <span
                                        key={label}
                                        className={`${i === 0 ? 'text-white/40' : ''} ${i === activeColumn ? 'text-[#D4AF37]' : ''}`}
                                    >
                                        {label}
                                    </span>
                                ))}
                            </div>
                            <button
                                onClick={() => setTimeOffset(Math.min(maxOffset, timeOffset + 1))}
                                disabled={timeOffset >= maxOffset}
                                className="p-1 text-white/50 hover:text-white transition-colors disabled:opacity-30"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Data Table with animated values */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)' }}>
                                        <th className="px-4 py-3 text-left text-white/60 font-medium">{language === 'en' ? 'Metric' : '指标'}</th>
                                        <th className={`px-4 py-3 text-center text-white/60 font-medium ${activeColumn === 1 ? 'text-[#D4AF37]' : ''}`}>{language === 'en' ? 'Baseline' : '基线'}</th>
                                        <th className={`px-4 py-3 text-center text-white/60 font-medium ${activeColumn === 2 ? 'text-[#D4AF37]' : ''}`}>{language === 'en' ? '3 weeks' : '3 周'}</th>
                                        <th className={`px-4 py-3 text-center text-white/60 font-medium ${activeColumn === 3 ? 'text-[#D4AF37]' : ''}`}>{language === 'en' ? '6 weeks' : '6 周'}</th>
                                        <th className={`px-4 py-3 text-center text-white/60 font-medium ${activeColumn === 4 ? 'text-[#D4AF37]' : ''}`}>{language === 'en' ? '9 weeks' : '9 周'}</th>
                                        <th className={`px-4 py-3 text-center text-white/60 font-medium ${activeColumn === 5 ? 'text-[#D4AF37]' : ''}`}>{language === 'en' ? '12 weeks' : '12 周'}</th>
                                        <th className={`px-4 py-3 text-center text-white/60 font-medium ${activeColumn === 6 ? 'text-[#D4AF37]' : ''}`}>{language === 'en' ? '15 weeks' : '15 周'}</th>
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
                                            <td className={`px-4 py-3 text-center text-[#D4AF37] ${activeColumn === 1 ? 'bg-white/5' : ''}`}>
                                                <AnimatedValue value={String(metric.baseline)} delay={500 + i * 50} />
                                            </td>
                                            <td className={`px-4 py-3 text-center text-white/60 ${activeColumn === 2 ? 'bg-white/5' : ''}`}>
                                                <AnimatedValue value={metric.month3} delay={600 + i * 50} />
                                            </td>
                                            <td className={`px-4 py-3 text-center text-white/60 ${activeColumn === 3 ? 'bg-white/5' : ''}`}>
                                                <AnimatedValue value={metric.month6} delay={700 + i * 50} />
                                            </td>
                                            <td className={`px-4 py-3 text-center text-white/60 ${activeColumn === 4 ? 'bg-white/5' : ''}`}>
                                                <AnimatedValue value={metric.month9} delay={800 + i * 50} />
                                            </td>
                                            <td className={`px-4 py-3 text-center text-white/60 ${activeColumn === 5 ? 'bg-white/5' : ''}`}>
                                                <AnimatedValue value={metric.month12} delay={900 + i * 50} />
                                            </td>
                                            <td className={`px-4 py-3 text-center text-white/60 ${activeColumn === 6 ? 'bg-white/5' : ''}`}>
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
