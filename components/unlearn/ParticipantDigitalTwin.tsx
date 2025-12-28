'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Settings, User, ChevronLeft, ChevronRight, TrendingUp, Clock, Database, BarChart3 } from 'lucide-react';
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

type ViewType = 'prediction' | 'timeline' | 'baseline' | 'endpoints';

export default function ParticipantDigitalTwin() {
    const { language } = useI18n();
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: true, margin: '-100px' });
    const [timeOffset, setTimeOffset] = useState(0);
    const [activeView, setActiveView] = useState<ViewType>('prediction');

    const viewOptions = language === 'en'
        ? [
            { id: 'prediction' as ViewType, label: 'Predicted longitudinal outcomes', icon: TrendingUp },
            { id: 'timeline' as ViewType, label: 'Time since baseline visit', icon: Clock },
            { id: 'baseline' as ViewType, label: 'Participant\'s baseline data', icon: Database },
            { id: 'endpoints' as ViewType, label: 'Metric Endpoints', icon: BarChart3 },
        ]
        : [
            { id: 'prediction' as ViewType, label: '纵向结果预测', icon: TrendingUp },
            { id: 'timeline' as ViewType, label: '基线后的时间', icon: Clock },
            { id: 'baseline' as ViewType, label: '参与者基线数据', icon: Database },
            { id: 'endpoints' as ViewType, label: '指标终点', icon: BarChart3 },
        ];

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
        ]
        : [
            { name: '焦虑评分', baseline: 4, month3: '3.8 ± 0.9', month6: '4.0 ± 0.8', month9: '3.9 ± 0.8', month12: '3.9 ± 0.9', month15: '4.0 ± 1.0' },
            { name: '睡眠质量', baseline: 0, month3: '0.3 ± 0.5', month6: '0.5 ± 0.7', month9: '0.7 ± 0.7', month12: '0.8 ± 0.8', month15: '1.0 ± 0.9' },
            { name: '压力韧性', baseline: 1, month3: '0.8 ± 0.7', month6: '0.9 ± 0.8', month9: '0.9 ± 0.8', month12: '0.8 ± 0.8', month15: '0.8 ± 0.8' },
            { name: '情绪稳定度', baseline: 4, month3: '1.5 ± 0.9', month6: '1.5 ± 0.8', month9: '1.5 ± 1.0', month12: '1.4 ± 1.0', month15: '1.6 ± 1.2' },
            { name: '能量水平', baseline: 0, month3: '1.2 ± 0.9', month6: '1.2 ± 1.0', month9: '1.5 ± 1.0', month12: '1.4 ± 0.9', month15: '1.6 ± 0.9' },
            { name: 'HRV 分数', baseline: 9, month3: '8.8 ± 0.5', month6: '8.7 ± 0.5', month9: '8.8 ± 0.8', month12: '8.3 ± 0.4', month15: '8.5 ± 0.8' },
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

    // Timeline milestones data
    const timelineMilestones = language === 'en'
        ? [
            { week: 0, event: 'Baseline Assessment', status: 'completed', detail: 'Initial GAD-7: 14, PHQ-9: 12' },
            { week: 3, event: 'First Check-in', status: 'completed', detail: 'Started breathing exercises' },
            { week: 6, event: 'Mid-point Review', status: 'completed', detail: 'GAD-7 improved to 11' },
            { week: 9, event: 'Intervention Adjustment', status: 'current', detail: 'Added sleep optimization' },
            { week: 12, event: 'Progress Evaluation', status: 'upcoming', detail: 'Scheduled assessment' },
            { week: 15, event: 'Final Assessment', status: 'upcoming', detail: 'End of program review' },
        ]
        : [
            { week: 0, event: '基线评估', status: 'completed', detail: '初始 GAD-7: 14, PHQ-9: 12' },
            { week: 3, event: '首次回访', status: 'completed', detail: '开始呼吸练习' },
            { week: 6, event: '中期回顾', status: 'completed', detail: 'GAD-7 改善至 11' },
            { week: 9, event: '干预调整', status: 'current', detail: '增加睡眠优化' },
            { week: 12, event: '进展评估', status: 'upcoming', detail: '计划中的评估' },
            { week: 15, event: '最终评估', status: 'upcoming', detail: '项目结束回顾' },
        ];

    // Baseline detailed data
    const baselineData = language === 'en'
        ? {
            assessments: [
                { name: 'GAD-7 Score', value: '14', interpretation: 'Moderate anxiety' },
                { name: 'PHQ-9 Score', value: '12', interpretation: 'Moderate depression' },
                { name: 'PSS-10 Score', value: '24', interpretation: 'Moderate stress' },
                { name: 'PSQI Score', value: '9', interpretation: 'Poor sleep quality' },
            ],
            vitals: [
                { name: 'Resting HRV', value: '42 ms', trend: 'below average' },
                { name: 'Avg Sleep Duration', value: '5.8 hrs', trend: 'below target' },
                { name: 'Daily Steps', value: '4,200', trend: 'below target' },
                { name: 'Resting Heart Rate', value: '78 bpm', trend: 'normal' },
            ],
        }
        : {
            assessments: [
                { name: 'GAD-7 评分', value: '14', interpretation: '中度焦虑' },
                { name: 'PHQ-9 评分', value: '12', interpretation: '中度抑郁' },
                { name: 'PSS-10 评分', value: '24', interpretation: '中度压力' },
                { name: 'PSQI 评分', value: '9', interpretation: '睡眠质量差' },
            ],
            vitals: [
                { name: '静息 HRV', value: '42 ms', trend: '低于平均' },
                { name: '平均睡眠时长', value: '5.8 小时', trend: '低于目标' },
                { name: '每日步数', value: '4,200', trend: '低于目标' },
                { name: '静息心率', value: '78 bpm', trend: '正常' },
            ],
        };

    return (
        <section
            ref={containerRef}
            className="relative py-24"
            style={{ backgroundColor: '#0B3D2E' }}
        >
            <div className="max-w-[1400px] mx-auto px-6">
                <div className="grid lg:grid-cols-[300px_1fr] gap-12 items-start">
                    {/* Left Column - Interactive Navigation */}
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

                        {/* Interactive View Buttons */}
                        <div className="space-y-2">
                            {viewOptions.map((option, i) => (
                                <motion.button
                                    key={option.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                                    transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                                    onClick={() => setActiveView(option.id)}
                                    className={`w-full px-4 py-3 text-sm text-left flex items-center gap-3 transition-all duration-300 cursor-pointer ${
                                        activeView === option.id
                                            ? 'bg-[#D4AF37]/20 border-l-2 border-[#D4AF37] text-[#D4AF37]'
                                            : 'bg-white/5 border-l-2 border-transparent text-white/70 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    <option.icon className={`w-4 h-4 ${activeView === option.id ? 'text-[#D4AF37]' : 'text-white/50'}`} />
                                    {option.label}
                                </motion.button>
                            ))}
                        </div>

                        <div className="pt-8">
                            <h2 className="text-white font-bold leading-[1.1] mb-4" style={{ fontSize: 'clamp(24px, 3vw, 36px)' }}>
                                {language === 'en' ? 'Personalized ML models trained on your data' : '基于你数据训练的个性化模型'}
                            </h2>
                            <p className="text-white/60 text-sm leading-relaxed">
                                {language === 'en'
                                    ? 'Your digital twin continuously learns from your inputs to provide increasingly accurate predictions.'
                                    : '数字孪生将持续学习你的输入，给出更精准的预测。'}
                            </p>
                        </div>
                    </motion.div>

                    {/* Right Column - Dynamic Content Panel */}
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
                        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.15)' }}>
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

                        {/* Animated Content Area */}
                        <AnimatePresence mode="wait">
                            {activeView === 'prediction' && (
                                <motion.div
                                    key="prediction"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {/* Participant Info */}
                                    <div className="flex items-start gap-6 px-6 py-4" style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.1)' }}>
                                        <div className="relative w-16 h-16 overflow-hidden flex-shrink-0">
                                            <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #B8960C 100%)', color: '#0B3D2E' }}>
                                                {initials}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-x-8 gap-y-2 text-sm flex-1">
                                            <div><span className="text-white/50">{language === 'en' ? 'Age: ' : '年龄：'}</span><span className="text-white">{displayedParticipant.age}</span></div>
                                            <div><span className="text-white/50">{language === 'en' ? 'Diagnosis: ' : '诊断：'}</span><span className="text-white">{displayedParticipant.diagnosis}</span></div>
                                            <div><span className="text-white/50">{language === 'en' ? 'History: ' : '病史：'}</span><span className="text-white">{displayedParticipant.history[0]}</span></div>
                                            <div><span className="text-white/50">{language === 'en' ? 'Sex: ' : '性别：'}</span><span className="text-white">{displayedParticipant.gender}</span></div>
                                            <div><span className="text-white/50">{language === 'en' ? 'Weight: ' : '体重：'}</span><span className="text-white">{displayedParticipant.weight}</span></div>
                                            <div><span className="text-white/50">{language === 'en' ? 'Height: ' : '身高：'}</span><span className="text-white">{displayedParticipant.height}</span></div>
                                        </div>
                                    </div>

                                    {/* Time Slider */}
                                    <div className="px-6 py-3 flex items-center gap-4" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                        <button onClick={() => setTimeOffset(Math.max(0, timeOffset - 1))} disabled={timeOffset === 0} className="p-1 text-white/50 hover:text-white transition-colors disabled:opacity-30">
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <div className="flex-1 flex justify-between text-xs text-white/60">
                                            {timeLabels.map((label, i) => (
                                                <span key={label} className={`${i === 0 ? 'text-white/40' : ''} ${i === activeColumn ? 'text-[#D4AF37]' : ''}`}>{label}</span>
                                            ))}
                                        </div>
                                        <button onClick={() => setTimeOffset(Math.min(maxOffset, timeOffset + 1))} disabled={timeOffset >= maxOffset} className="p-1 text-white/50 hover:text-white transition-colors disabled:opacity-30">
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Data Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)' }}>
                                                    <th className="px-4 py-3 text-left text-white/60 font-medium">{language === 'en' ? 'Metric' : '指标'}</th>
                                                    <th className="px-4 py-3 text-center text-white/60 font-medium">{language === 'en' ? 'Baseline' : '基线'}</th>
                                                    <th className="px-4 py-3 text-center text-white/60 font-medium">{language === 'en' ? '3 wk' : '3周'}</th>
                                                    <th className="px-4 py-3 text-center text-white/60 font-medium">{language === 'en' ? '6 wk' : '6周'}</th>
                                                    <th className="px-4 py-3 text-center text-white/60 font-medium">{language === 'en' ? '9 wk' : '9周'}</th>
                                                    <th className="px-4 py-3 text-center text-white/60 font-medium">{language === 'en' ? '12 wk' : '12周'}</th>
                                                    <th className="px-4 py-3 text-center text-white/60 font-medium">{language === 'en' ? '15 wk' : '15周'}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {metrics.map((metric, i) => (
                                                    <tr key={metric.name} className="border-b border-white/5" style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                                                        <td className="px-4 py-3 text-white/80">{metric.name}</td>
                                                        <td className="px-4 py-3 text-center text-[#D4AF37]"><AnimatedValue value={String(metric.baseline)} delay={100 + i * 50} /></td>
                                                        <td className="px-4 py-3 text-center text-white/60"><AnimatedValue value={metric.month3} delay={150 + i * 50} /></td>
                                                        <td className="px-4 py-3 text-center text-white/60"><AnimatedValue value={metric.month6} delay={200 + i * 50} /></td>
                                                        <td className="px-4 py-3 text-center text-white/60"><AnimatedValue value={metric.month9} delay={250 + i * 50} /></td>
                                                        <td className="px-4 py-3 text-center text-white/60"><AnimatedValue value={metric.month12} delay={300 + i * 50} /></td>
                                                        <td className="px-4 py-3 text-center text-white/60"><AnimatedValue value={metric.month15} delay={350 + i * 50} /></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            )}

                            {activeView === 'timeline' && (
                                <motion.div
                                    key="timeline"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="p-6"
                                >
                                    <h3 className="text-white font-semibold mb-6">{language === 'en' ? 'Treatment Timeline' : '治疗时间线'}</h3>
                                    <div className="relative">
                                        {/* Timeline line */}
                                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10" />
                                        
                                        <div className="space-y-6">
                                            {timelineMilestones.map((milestone, i) => (
                                                <motion.div
                                                    key={milestone.week}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className="relative pl-12"
                                                >
                                                    {/* Dot */}
                                                    <div className={`absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                        milestone.status === 'completed' ? 'bg-[#D4AF37] border-[#D4AF37]' :
                                                        milestone.status === 'current' ? 'bg-[#0B3D2E] border-[#D4AF37] animate-pulse' :
                                                        'bg-[#0B3D2E] border-white/30'
                                                    }`}>
                                                        {milestone.status === 'completed' && (
                                                            <svg className="w-3 h-3 text-[#0B3D2E]" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    
                                                    <div className={`p-4 ${milestone.status === 'current' ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/30' : 'bg-white/5'}`}>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-white font-medium">{milestone.event}</span>
                                                            <span className="text-[#D4AF37] text-sm">{language === 'en' ? `Week ${milestone.week}` : `第 ${milestone.week} 周`}</span>
                                                        </div>
                                                        <p className="text-white/60 text-sm">{milestone.detail}</p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeView === 'baseline' && (
                                <motion.div
                                    key="baseline"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="p-6"
                                >
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Assessments */}
                                        <div>
                                            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                                <div className="w-2 h-2 bg-[#D4AF37]" />
                                                {language === 'en' ? 'Clinical Assessments' : '临床评估'}
                                            </h3>
                                            <div className="space-y-3">
                                                {baselineData.assessments.map((item, i) => (
                                                    <motion.div
                                                        key={item.name}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.1 }}
                                                        className="p-4 bg-white/5 border border-white/10"
                                                    >
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="text-white/70 text-sm">{item.name}</span>
                                                            <span className="text-[#D4AF37] font-bold text-lg">{item.value}</span>
                                                        </div>
                                                        <span className="text-white/50 text-xs">{item.interpretation}</span>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Vitals */}
                                        <div>
                                            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                                <div className="w-2 h-2 bg-[#D4AF37]" />
                                                {language === 'en' ? 'Biometric Vitals' : '生物指标'}
                                            </h3>
                                            <div className="space-y-3">
                                                {baselineData.vitals.map((item, i) => (
                                                    <motion.div
                                                        key={item.name}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.1 + 0.2 }}
                                                        className="p-4 bg-white/5 border border-white/10"
                                                    >
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="text-white/70 text-sm">{item.name}</span>
                                                            <span className="text-white font-bold">{item.value}</span>
                                                        </div>
                                                        <span className={`text-xs ${item.trend === 'normal' ? 'text-green-400' : 'text-amber-400'}`}>{item.trend}</span>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeView === 'endpoints' && (
                                <motion.div
                                    key="endpoints"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="p-6"
                                >
                                    <h3 className="text-white font-semibold mb-6">{language === 'en' ? 'Metric Endpoints Over Time' : '指标终点变化趋势'}</h3>
                                    
                                    {/* Chart Grid */}
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Anxiety Score Chart */}
                                        <div className="bg-white/5 border border-white/10 p-4">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-white/80 text-sm">{language === 'en' ? 'Anxiety Score' : '焦虑评分'}</span>
                                                <span className="text-[#D4AF37] text-xs">↓ 15%</span>
                                            </div>
                                            <div className="h-32 flex items-end gap-2">
                                                {[14, 12, 11, 10, 9, 8].map((val, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${(val / 14) * 100}%` }}
                                                        transition={{ delay: i * 0.1, duration: 0.5 }}
                                                        className="flex-1 bg-gradient-to-t from-[#D4AF37] to-[#D4AF37]/50 rounded-t"
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex justify-between mt-2 text-xs text-white/40">
                                                <span>{language === 'en' ? 'Baseline' : '基线'}</span>
                                                <span>{language === 'en' ? '15 wk' : '15周'}</span>
                                            </div>
                                        </div>

                                        {/* Sleep Quality Chart */}
                                        <div className="bg-white/5 border border-white/10 p-4">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-white/80 text-sm">{language === 'en' ? 'Sleep Quality' : '睡眠质量'}</span>
                                                <span className="text-green-400 text-xs">↑ 40%</span>
                                            </div>
                                            <div className="h-32 flex items-end gap-2">
                                                {[3, 4, 5, 6, 7, 8].map((val, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${(val / 10) * 100}%` }}
                                                        transition={{ delay: i * 0.1 + 0.3, duration: 0.5 }}
                                                        className="flex-1 bg-gradient-to-t from-green-500 to-green-500/50 rounded-t"
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex justify-between mt-2 text-xs text-white/40">
                                                <span>{language === 'en' ? 'Baseline' : '基线'}</span>
                                                <span>{language === 'en' ? '15 wk' : '15周'}</span>
                                            </div>
                                        </div>

                                        {/* HRV Score Chart */}
                                        <div className="bg-white/5 border border-white/10 p-4">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-white/80 text-sm">{language === 'en' ? 'HRV Score' : 'HRV 分数'}</span>
                                                <span className="text-green-400 text-xs">↑ 25%</span>
                                            </div>
                                            <div className="h-32 flex items-end gap-2">
                                                {[42, 48, 52, 55, 58, 62].map((val, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${(val / 70) * 100}%` }}
                                                        transition={{ delay: i * 0.1 + 0.6, duration: 0.5 }}
                                                        className="flex-1 bg-gradient-to-t from-blue-500 to-blue-500/50 rounded-t"
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex justify-between mt-2 text-xs text-white/40">
                                                <span>{language === 'en' ? 'Baseline' : '基线'}</span>
                                                <span>{language === 'en' ? '15 wk' : '15周'}</span>
                                            </div>
                                        </div>

                                        {/* Energy Level Chart */}
                                        <div className="bg-white/5 border border-white/10 p-4">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-white/80 text-sm">{language === 'en' ? 'Energy Level' : '能量水平'}</span>
                                                <span className="text-green-400 text-xs">↑ 35%</span>
                                            </div>
                                            <div className="h-32 flex items-end gap-2">
                                                {[4, 5, 5.5, 6, 6.5, 7].map((val, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${(val / 10) * 100}%` }}
                                                        transition={{ delay: i * 0.1 + 0.9, duration: 0.5 }}
                                                        className="flex-1 bg-gradient-to-t from-amber-500 to-amber-500/50 rounded-t"
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex justify-between mt-2 text-xs text-white/40">
                                                <span>{language === 'en' ? 'Baseline' : '基线'}</span>
                                                <span>{language === 'en' ? '15 wk' : '15周'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Summary Stats */}
                                    <div className="mt-6 grid grid-cols-3 gap-4">
                                        {(language === 'en' ? [
                                            { label: 'Overall Improvement', value: '47%', color: 'text-[#D4AF37]' },
                                            { label: 'Days to First Result', value: '12', color: 'text-white' },
                                            { label: 'Consistency Score', value: '94%', color: 'text-green-400' },
                                        ] : [
                                            { label: '整体改善', value: '47%', color: 'text-[#D4AF37]' },
                                            { label: '首次见效天数', value: '12', color: 'text-white' },
                                            { label: '一致性评分', value: '94%', color: 'text-green-400' },
                                        ]).map((stat, i) => (
                                            <motion.div
                                                key={stat.label}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 1.2 + i * 0.1 }}
                                                className="text-center p-4 bg-white/5"
                                            >
                                                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                                                <div className="text-xs text-white/50 mt-1">{stat.label}</div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
