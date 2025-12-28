'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Settings, User, ChevronLeft, ChevronRight, TrendingUp, Clock, Database, BarChart3, Sparkles } from 'lucide-react';
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

interface UserData {
    name: string;
    age: number;
    gender: string;
    diagnosis: string;
    weight: string;
    height: string;
    history: string[];
    avatar?: string;
}

interface MetricData {
    name: string;
    baseline: number;
    week3: string;
    week6: string;
    week9: string;
    week12: string;
    week15: string;
}

interface TimelineMilestone {
    week: number;
    event: string;
    status: 'completed' | 'current' | 'upcoming';
    detail: string;
}

interface AssessmentItem {
    name: string;
    value: string;
    interpretation: string;
}

interface VitalItem {
    name: string;
    value: string;
    trend: string;
}

interface ChartData {
    label: string;
    values: number[];
    change: string;
    color: string;
}

type ViewType = 'prediction' | 'timeline' | 'baseline' | 'endpoints';

interface UserDigitalTwinDashboardProps {
    user?: UserData;
    metrics?: MetricData[];
    timeline?: TimelineMilestone[];
    assessments?: AssessmentItem[];
    vitals?: VitalItem[];
    charts?: ChartData[];
    showHeader?: boolean;
    className?: string;
}

// Default demo data
const defaultUser: UserData = {
    name: 'User',
    age: 30,
    gender: 'Not specified',
    diagnosis: 'Wellness tracking',
    weight: '--',
    height: '--',
    history: ['No data yet'],
};

export default function UserDigitalTwinDashboard({
    user,
    metrics,
    timeline,
    assessments,
    vitals,
    charts,
    showHeader = true,
    className = '',
}: UserDigitalTwinDashboardProps) {
    const { language } = useI18n();
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: true, margin: '-50px' });
    const [timeOffset, setTimeOffset] = useState(0);
    const [activeView, setActiveView] = useState<ViewType>('prediction');

    const viewOptions = language === 'en'
        ? [
            { id: 'prediction' as ViewType, label: 'Predicted outcomes', icon: TrendingUp },
            { id: 'timeline' as ViewType, label: 'Your journey', icon: Clock },
            { id: 'baseline' as ViewType, label: 'Baseline data', icon: Database },
            { id: 'endpoints' as ViewType, label: 'Progress charts', icon: BarChart3 },
        ]
        : [
            { id: 'prediction' as ViewType, label: '预测结果', icon: TrendingUp },
            { id: 'timeline' as ViewType, label: '你的旅程', icon: Clock },
            { id: 'baseline' as ViewType, label: '基线数据', icon: Database },
            { id: 'endpoints' as ViewType, label: '进度图表', icon: BarChart3 },
        ];

    const timeLabels = language === 'en'
        ? ['Time', 'Start', '3w', '6w', '9w', '12w', '15w']
        : ['时间', '开始', '3周', '6周', '9周', '12周', '15周'];

    // Use provided data or defaults
    const displayUser = user || defaultUser;
    const initials = displayUser.name
        .split(' ')
        .map(part => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const maxOffset = timeLabels.length - 2;
    const activeColumn = Math.min(1 + timeOffset, timeLabels.length - 1);

    // Default metrics if not provided
    const displayMetrics = metrics || (language === 'en'
        ? [
            { name: 'Anxiety Score', baseline: 0, week3: '--', week6: '--', week9: '--', week12: '--', week15: '--' },
            { name: 'Sleep Quality', baseline: 0, week3: '--', week6: '--', week9: '--', week12: '--', week15: '--' },
            { name: 'Stress Resilience', baseline: 0, week3: '--', week6: '--', week9: '--', week12: '--', week15: '--' },
            { name: 'Energy Level', baseline: 0, week3: '--', week6: '--', week9: '--', week12: '--', week15: '--' },
            { name: 'HRV Score', baseline: 0, week3: '--', week6: '--', week9: '--', week12: '--', week15: '--' },
        ]
        : [
            { name: '焦虑评分', baseline: 0, week3: '--', week6: '--', week9: '--', week12: '--', week15: '--' },
            { name: '睡眠质量', baseline: 0, week3: '--', week6: '--', week9: '--', week12: '--', week15: '--' },
            { name: '压力韧性', baseline: 0, week3: '--', week6: '--', week9: '--', week12: '--', week15: '--' },
            { name: '能量水平', baseline: 0, week3: '--', week6: '--', week9: '--', week12: '--', week15: '--' },
            { name: 'HRV 分数', baseline: 0, week3: '--', week6: '--', week9: '--', week12: '--', week15: '--' },
        ]);

    // Default timeline if not provided
    const displayTimeline = timeline || (language === 'en'
        ? [
            { week: 0, event: 'Start your journey', status: 'current' as const, detail: 'Complete your first assessment' },
            { week: 3, event: 'First milestone', status: 'upcoming' as const, detail: 'Review initial progress' },
            { week: 6, event: 'Mid-point check', status: 'upcoming' as const, detail: 'Adjust your plan' },
        ]
        : [
            { week: 0, event: '开始你的旅程', status: 'current' as const, detail: '完成首次评估' },
            { week: 3, event: '第一个里程碑', status: 'upcoming' as const, detail: '回顾初步进展' },
            { week: 6, event: '中期检查', status: 'upcoming' as const, detail: '调整你的计划' },
        ]);

    // Default assessments if not provided
    const displayAssessments = assessments || (language === 'en'
        ? [
            { name: 'GAD-7 Score', value: '--', interpretation: 'Complete assessment' },
            { name: 'PHQ-9 Score', value: '--', interpretation: 'Complete assessment' },
            { name: 'Sleep Score', value: '--', interpretation: 'Connect wearable' },
        ]
        : [
            { name: 'GAD-7 评分', value: '--', interpretation: '完成评估' },
            { name: 'PHQ-9 评分', value: '--', interpretation: '完成评估' },
            { name: '睡眠评分', value: '--', interpretation: '连接穿戴设备' },
        ]);

    // Default vitals if not provided
    const displayVitals = vitals || (language === 'en'
        ? [
            { name: 'Resting HRV', value: '--', trend: 'Connect device' },
            { name: 'Avg Sleep', value: '--', trend: 'Connect device' },
            { name: 'Daily Steps', value: '--', trend: 'Connect device' },
        ]
        : [
            { name: '静息 HRV', value: '--', trend: '连接设备' },
            { name: '平均睡眠', value: '--', trend: '连接设备' },
            { name: '每日步数', value: '--', trend: '连接设备' },
        ]);

    // Default charts if not provided
    const displayCharts = charts || [
        { label: language === 'en' ? 'Anxiety' : '焦虑', values: [0, 0, 0, 0, 0, 0], change: '--', color: 'from-[#D4AF37] to-[#D4AF37]/50' },
        { label: language === 'en' ? 'Sleep' : '睡眠', values: [0, 0, 0, 0, 0, 0], change: '--', color: 'from-green-500 to-green-500/50' },
        { label: language === 'en' ? 'HRV' : 'HRV', values: [0, 0, 0, 0, 0, 0], change: '--', color: 'from-blue-500 to-blue-500/50' },
        { label: language === 'en' ? 'Energy' : '能量', values: [0, 0, 0, 0, 0, 0], change: '--', color: 'from-amber-500 to-amber-500/50' },
    ];

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <div className="grid lg:grid-cols-[280px_1fr] gap-8 items-start">
                {/* Left Column - Navigation */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="space-y-4"
                >
                    {showHeader && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                            <Sparkles className="w-4 h-4" />
                            {language === 'en' ? 'YOUR DIGITAL TWIN' : '你的数字孪生'}
                        </div>
                    )}

                    {/* View Buttons */}
                    <div className="space-y-2">
                        {viewOptions.map((option, i) => (
                            <motion.button
                                key={option.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={isInView ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
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

                    {/* User Summary */}
                    <div className="pt-4 border-t border-white/10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#B8960C] flex items-center justify-center text-[#0B3D2E] font-bold">
                                {initials}
                            </div>
                            <div>
                                <div className="text-white font-medium text-sm">{displayUser.name}</div>
                                <div className="text-white/50 text-xs">{displayUser.diagnosis}</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Column - Content Panel */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="overflow-hidden bg-[#0B3D2E]/90 border border-[#D4AF37]/20 shadow-2xl"
                >
                    {/* Panel Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#D4AF37]/15">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#D4AF37] flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-[#0B3D2E]" />
                            </div>
                            <span className="text-white text-sm">
                                {language === 'en' ? 'Digital Twin Dashboard' : '数字孪生仪表盘'}
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

                    {/* Content Area */}
                    <AnimatePresence mode="wait">
                        {/* Prediction View */}
                        {activeView === 'prediction' && (
                            <motion.div
                                key="prediction"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* User Info Bar */}
                                <div className="flex items-center gap-6 px-6 py-4 border-b border-[#D4AF37]/10">
                                    <div className="w-14 h-14 bg-gradient-to-br from-[#D4AF37] to-[#B8960C] flex items-center justify-center text-xl font-bold text-[#0B3D2E]">
                                        {initials}
                                    </div>
                                    <div className="grid grid-cols-3 gap-x-8 gap-y-1 text-sm flex-1">
                                        <div><span className="text-white/50">{language === 'en' ? 'Age: ' : '年龄：'}</span><span className="text-white">{displayUser.age}</span></div>
                                        <div><span className="text-white/50">{language === 'en' ? 'Status: ' : '状态：'}</span><span className="text-white">{displayUser.diagnosis}</span></div>
                                        <div><span className="text-white/50">{language === 'en' ? 'Gender: ' : '性别：'}</span><span className="text-white">{displayUser.gender}</span></div>
                                    </div>
                                </div>

                                {/* Time Slider */}
                                <div className="px-6 py-3 flex items-center gap-4 bg-black/20">
                                    <button onClick={() => setTimeOffset(Math.max(0, timeOffset - 1))} disabled={timeOffset === 0} className="p-1 text-white/50 hover:text-white disabled:opacity-30">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <div className="flex-1 flex justify-between text-xs text-white/60">
                                        {timeLabels.map((label, i) => (
                                            <span key={label} className={`${i === activeColumn ? 'text-[#D4AF37]' : ''}`}>{label}</span>
                                        ))}
                                    </div>
                                    <button onClick={() => setTimeOffset(Math.min(maxOffset, timeOffset + 1))} disabled={timeOffset >= maxOffset} className="p-1 text-white/50 hover:text-white disabled:opacity-30">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Data Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-[#D4AF37]/10">
                                                <th className="px-4 py-3 text-left text-white/60 font-medium">{language === 'en' ? 'Metric' : '指标'}</th>
                                                <th className="px-4 py-3 text-center text-white/60 font-medium">{language === 'en' ? 'Start' : '开始'}</th>
                                                <th className="px-4 py-3 text-center text-white/60 font-medium">3w</th>
                                                <th className="px-4 py-3 text-center text-white/60 font-medium">6w</th>
                                                <th className="px-4 py-3 text-center text-white/60 font-medium">9w</th>
                                                <th className="px-4 py-3 text-center text-white/60 font-medium">12w</th>
                                                <th className="px-4 py-3 text-center text-white/60 font-medium">15w</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {displayMetrics.map((metric, i) => (
                                                <tr key={metric.name} className="border-b border-white/5" style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                                                    <td className="px-4 py-3 text-white/80">{metric.name}</td>
                                                    <td className="px-4 py-3 text-center text-[#D4AF37]"><AnimatedValue value={String(metric.baseline)} delay={100 + i * 30} /></td>
                                                    <td className="px-4 py-3 text-center text-white/60"><AnimatedValue value={metric.week3} delay={130 + i * 30} /></td>
                                                    <td className="px-4 py-3 text-center text-white/60"><AnimatedValue value={metric.week6} delay={160 + i * 30} /></td>
                                                    <td className="px-4 py-3 text-center text-white/60"><AnimatedValue value={metric.week9} delay={190 + i * 30} /></td>
                                                    <td className="px-4 py-3 text-center text-white/60"><AnimatedValue value={metric.week12} delay={220 + i * 30} /></td>
                                                    <td className="px-4 py-3 text-center text-white/60"><AnimatedValue value={metric.week15} delay={250 + i * 30} /></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {/* Timeline View */}
                        {activeView === 'timeline' && (
                            <motion.div
                                key="timeline"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="p-6"
                            >
                                <h3 className="text-white font-semibold mb-6">{language === 'en' ? 'Your Journey' : '你的旅程'}</h3>
                                <div className="relative">
                                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10" />
                                    <div className="space-y-6">
                                        {displayTimeline.map((milestone, i) => (
                                            <motion.div
                                                key={milestone.week}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="relative pl-12"
                                            >
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

                        {/* Baseline View */}
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
                                    <div>
                                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                            <div className="w-2 h-2 bg-[#D4AF37]" />
                                            {language === 'en' ? 'Assessments' : '评估'}
                                        </h3>
                                        <div className="space-y-3">
                                            {displayAssessments.map((item, i) => (
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
                                    <div>
                                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                            <div className="w-2 h-2 bg-[#D4AF37]" />
                                            {language === 'en' ? 'Vitals' : '生命体征'}
                                        </h3>
                                        <div className="space-y-3">
                                            {displayVitals.map((item, i) => (
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
                                                    <span className="text-xs text-white/50">{item.trend}</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Endpoints/Charts View */}
                        {activeView === 'endpoints' && (
                            <motion.div
                                key="endpoints"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="p-6"
                            >
                                <h3 className="text-white font-semibold mb-6">{language === 'en' ? 'Progress Over Time' : '进度变化'}</h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    {displayCharts.map((chart, chartIndex) => (
                                        <div key={chart.label} className="bg-white/5 border border-white/10 p-4">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-white/80 text-sm">{chart.label}</span>
                                                <span className={`text-xs ${chart.change.startsWith('↑') ? 'text-green-400' : chart.change.startsWith('↓') ? 'text-[#D4AF37]' : 'text-white/50'}`}>
                                                    {chart.change}
                                                </span>
                                            </div>
                                            <div className="h-32 flex items-end gap-2">
                                                {chart.values.map((val, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ height: 0 }}
                                                        animate={{ height: val > 0 ? `${Math.min((val / 100) * 100, 100)}%` : '4px' }}
                                                        transition={{ delay: chartIndex * 0.2 + i * 0.1, duration: 0.5 }}
                                                        className={`flex-1 bg-gradient-to-t ${chart.color} rounded-t`}
                                                        style={{ minHeight: '4px' }}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex justify-between mt-2 text-xs text-white/40">
                                                <span>{language === 'en' ? 'Start' : '开始'}</span>
                                                <span>{language === 'en' ? '15w' : '15周'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
