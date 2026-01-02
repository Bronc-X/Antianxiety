'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Settings, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Clock, Database, BarChart3, RefreshCw, AlertCircle, Loader2, X, Bell, Shield, Zap, LogIn, Heart, Lightbulb, Target, AlertTriangle, Moon, Activity, Smile, Brain, CheckCircle, Info, ChevronDown } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useDigitalTwinCurve, getDataQualityStatus } from '@/hooks/domain/useDigitalTwinCurve';
import { useAskMaxExplain } from '@/hooks/domain/useAskMaxExplain';
import { useAuth } from '@/hooks/domain/useAuth';
import { useProfile } from '@/hooks/domain/useProfile';
import type { DigitalTwinCurveOutput, CurveTimepoint, TimelineMilestone, ScaleBaselineItem } from '@/types/digital-twin-curve';
import { getRecommendations, type HealthRecommendation } from '@/lib/health-recommendations';
import MaxAvatar from '@/components/max/MaxAvatar';
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';

// ============================================
// Design Tokens (from DesktopDigitalTwin)
// ============================================

const COLORS = {
    anxiety: '#ef4444',
    sleep: '#8b5cf6',
    stress: '#f59e0b',
    mood: '#10b981',
    energy: '#3b82f6',
    hrv: '#ec4899',
};

const METRIC_ICONS = {
    anxietyScore: TrendingDown,
    sleepQuality: Moon,
    stressResilience: Zap,
    moodStability: Smile,
    energyLevel: Activity,
    hrvScore: Heart,
};

const METRIC_LABELS = {
    anxietyScore: 'Anxiety Score',
    sleepQuality: 'Sleep Quality',
    stressResilience: 'Stress Resilience',
    moodStability: 'Mood Stability',
    energyLevel: 'Energy Level',
    hrvScore: 'HRV Index',
};

const METRIC_LABELS_CN = {
    anxietyScore: '焦虑评分',
    sleepQuality: '睡眠质量',
    stressResilience: '抗压韧性',
    moodStability: '情绪稳定',
    energyLevel: '能量水平',
    hrvScore: 'HRV 代理',
};

// ============================================
// Types
// ============================================

type ViewType = 'prediction' | 'progress' | 'advice';

interface ApiResponse {
    status?: 'collecting_data' | 'no_analysis';
    collectionStatus?: DataCollectionStatus;
    message?: string;
    dashboardData?: DashboardData;
    adaptivePlan?: AdaptivePlan;
    isStale?: boolean;
    lastAnalyzed?: string;
    error?: string;
}

// ============================================
// Not Logged In State Component
// ============================================

function NotLoggedInState({ language }: { language: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 flex items-center justify-center mb-4">
                <LogIn className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <h3 className="text-white font-semibold mb-2">
                {language === 'en' ? 'Sign in to view your Digital Twin' : '登录后查看你的数字孪生'}
            </h3>
            <p className="text-white/60 text-sm text-center mb-6 max-w-md">
                {language === 'en'
                    ? 'Your personalized health insights are waiting for you.'
                    : '你的个性化健康洞察正在等待你。'}
            </p>
        </div>
    );
}

// ============================================
// Animated Components
// ============================================

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

// ============================================
// Loading State Component
// ============================================

function LoadingState({ language }: { language: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mb-4" />
            <p className="text-white/70 text-sm">
                {language === 'en' ? 'Loading your digital twin...' : '正在加载你的数字孪生...'}
            </p>
        </div>
    );
}

// ============================================
// Data Collection State Component
// ============================================

function DataCollectionState({
    status,
    language
}: {
    status: DataCollectionStatus;
    language: string;
}) {
    const calibrationDays = status.calibrationDays ?? status.calibrationCount ?? 0;
    const estimatedAccuracy = Math.min(95, Math.max(60, 60 + calibrationDays * 5));
    const dateSummary = status.firstCalibrationDate && status.lastCalibrationDate
        ? (status.firstCalibrationDate === status.lastCalibrationDate
            ? status.lastCalibrationDate
            : `${status.firstCalibrationDate} - ${status.lastCalibrationDate}`)
        : status.lastCalibrationDate || status.firstCalibrationDate || '';

    return (
        <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-20 h-20 rounded-full bg-[#D4AF37]/20 flex items-center justify-center mb-6">
                <Database className="w-10 h-10 text-[#D4AF37]" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">
                {language === 'en' ? 'Your AI prediction is ready' : '你的 AI 预测已生成'}
            </h3>
            <p className="text-white/60 text-sm text-center mb-6 max-w-md">
                {language === 'en'
                    ? 'Daily calibration quickly improves accuracy. We estimate 6 consecutive check-ins will push accuracy above 90%.'
                    : '每日校准会快速提升准确性，预估连续 6 天的校准互动将达到 90% 以上。'}
            </p>

            {/* Progress Bar */}
            <div className="w-full max-w-xs mb-4">
                <div className="flex justify-between text-xs text-white/50 mb-2">
                    <span>{language === 'en' ? 'Prediction accuracy' : '预测准确性'}</span>
                    <span>{estimatedAccuracy}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${estimatedAccuracy}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-[#D4AF37] to-[#B8960C]"
                    />
                </div>
            </div>

            {/* Collection Details */}
            <div className="grid grid-cols-2 gap-4 text-center mt-4">
                <div className="p-3 bg-white/5 rounded">
                    <div className="text-[#D4AF37] font-bold">{estimatedAccuracy}%</div>
                    <div className="text-white/50 text-xs">{language === 'en' ? 'Current accuracy' : '当前准确性'}</div>
                </div>
                <div className="p-3 bg-white/5 rounded">
                    <div className="font-bold text-green-400">90%+</div>
                    <div className="text-white/50 text-xs">{language === 'en' ? 'After 6 check-ins' : '连续 6 天校准后'}</div>
                </div>
            </div>

            <div className="mt-4 text-xs text-white/50">
                <span>
                    {language === 'en' ? `Calibrated ${calibrationDays} days` : `已校准 ${calibrationDays} 天`}
                </span>
                {dateSummary && (
                    <span>
                        {language === 'en' ? ` · Last ${dateSummary}` : ` · 最近 ${dateSummary}`}
                    </span>
                )}
            </div>
        </div>
    );
}

// ============================================
// Error State Component
// ============================================

function ErrorState({
    message,
    onRetry,
    language
}: {
    message: string;
    onRetry: () => void;
    language: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">
                {language === 'en' ? 'Something went wrong' : '出现了一些问题'}
            </h3>
            <p className="text-white/60 text-sm text-center mb-6">{message}</p>
            <button
                onClick={onRetry}
                className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-[#0B3D2E] font-medium text-sm hover:bg-[#B8960C] transition-colors"
            >
                <RefreshCw className="w-4 h-4" />
                {language === 'en' ? 'Try Again' : '重试'}
            </button>
        </div>
    );
}

// ============================================
// No Analysis State Component
// ============================================

function NoAnalysisState({
    onTriggerAnalysis,
    isAnalyzing,
    language
}: {
    onTriggerAnalysis: () => void;
    isAnalyzing: boolean;
    language: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-20 h-20 rounded-full bg-[#D4AF37]/20 flex items-center justify-center mb-6">
                <TrendingUp className="w-10 h-10 text-[#D4AF37]" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">
                {language === 'en' ? 'Ready for Analysis' : '准备好进行分析'}
            </h3>
            <p className="text-white/60 text-sm text-center mb-6 max-w-md">
                {language === 'en'
                    ? 'Your data has been collected. Generate your first AI-powered health analysis.'
                    : '你的数据已收集完成。生成你的首次 AI 健康分析。'}
            </p>
            <button
                onClick={onTriggerAnalysis}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-[#0B3D2E] font-medium hover:bg-[#B8960C] transition-colors disabled:opacity-50"
            >
                {isAnalyzing ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {language === 'en' ? 'Analyzing...' : '分析中...'}
                    </>
                ) : (
                    <>
                        <TrendingUp className="w-4 h-4" />
                        {language === 'en' ? 'Generate Analysis' : '生成分析'}
                    </>
                )}
            </button>
        </div>
    );
}

// ============================================
// Main Component
// ============================================

export default function ParticipantDigitalTwin() {
    const { language } = useI18n();
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: true, margin: '-100px' });

    // Use Digital Twin Curve Hook
    const {
        curveData,
        isLoading: loadingCurve,
        error: curveError,
        generateCurve,
        refreshCurve,
    } = useDigitalTwinCurve();

    // Auth and Profile hooks
    const { isAuthenticated } = useAuth();
    const { profile } = useProfile();

    // Local UI state
    const [timeOffset, setTimeOffset] = useState(0);
    const [activeView, setActiveView] = useState<ViewType>('prediction');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [medicalConsent, setMedicalConsent] = useState(false);
    const [analysisFrequency, setAnalysisFrequency] = useState<'auto' | 'daily' | 'weekly'>('auto');
    const [notifications, setNotifications] = useState(true);

    // NEW: Selected metrics for curve chart
    const [selectedMetrics, setSelectedMetrics] = useState<(keyof typeof METRIC_LABELS)[]>([
        'anxietyScore',
        'sleepQuality',
        'moodStability',
    ]);

    // Handle metric toggle
    const handleMetricToggle = useCallback((metric: keyof typeof METRIC_LABELS) => {
        setSelectedMetrics(prev =>
            prev.includes(metric)
                ? prev.filter(m => m !== metric)
                : [...prev, metric]
        );
    }, []);

    // Toast for no data hint - with position
    const [hintPosition, setHintPosition] = useState<{ x: number; y: number } | null>(null);

    // Load data on mount
    useEffect(() => {
        if (isAuthenticated) {
            generateCurve();
        }
    }, [isAuthenticated, generateCurve]);

    // Listen for calibration to refresh
    useEffect(() => {
        const handleCalibration = () => {
            refreshCurve();
        };
        window.addEventListener('daily-calibration:completed', handleCalibration);
        return () => {
            window.removeEventListener('daily-calibration:completed', handleCalibration);
        };
    }, [refreshCurve]);

    // Derive state
    const loading = loadingCurve;
    const error = curveError;
    const notLoggedIn = !isAuthenticated;
    const hasData = !!curveData;

    // Trigger analysis / regenerate
    const triggerAnalysis = useCallback(async () => {
        setIsAnalyzing(true);
        try {
            await generateCurve('improving');
        } catch (err) {
            console.error(err);
        } finally {
            setIsAnalyzing(false);
        }
    }, [generateCurve]);

    // View options - updated labels
    const viewOptions = language === 'en'
        ? [
            { id: 'prediction' as ViewType, label: '15-Week Curves', icon: TrendingUp },
            { id: 'progress' as ViewType, label: 'Progress & Baseline', icon: Clock },
            { id: 'advice' as ViewType, label: 'Health Advice', icon: Heart },
        ]
        : [
            { id: 'prediction' as ViewType, label: '15周预测曲线', icon: TrendingUp },
            { id: 'progress' as ViewType, label: '进度 & 基线', icon: Clock },
            { id: 'advice' as ViewType, label: '健康建议', icon: Heart },
        ];

    const timeLabels = language === 'en'
        ? ['Time (weeks)', 'Baseline', '3', '6', '9', '12', '15']
        : ['时间（周）', '基线', '3', '6', '9', '12', '15'];

    const maxOffset = timeLabels.length - 2;

    // Extract data from curveData
    const rawTimepoints = curveData?.A_predictedLongitudinalOutcomes?.timepoints || [];
    const timepoints = rawTimepoints.map((tp: any) => ({
        ...tp,
        metrics: Object.fromEntries(
            Object.entries(tp.metrics || {}).map(([k, v]: [string, any]) => {
                const rawVal = typeof v === 'object' && v !== null ? (v.value ?? v.score ?? v) : v;
                const numVal = typeof rawVal === 'number' ? rawVal : Number(rawVal);
                return [
                    k,
                    {
                        ... (typeof v === 'object' ? v : {}),
                        value: isNaN(numVal) ? 0 : numVal,
                        confidence: v?.confidence || 'medium'
                    }
                ];
            })
        )
    }));
    const milestones = curveData?.B_timeSinceBaselineVisit?.milestones || [];
    const baselineScales = (curveData?.C_participantBaselineData?.scales || []).map((s: any) => ({
        ...s,
        value: typeof s.value === 'object' && s.value !== null ? s.value.score : s.value
    }));
    const baselineVitals = curveData?.C_participantBaselineData?.vitals || {};
    const charts = curveData?.D_metricEndpoints?.charts;
    const rawSummaryStats = curveData?.D_metricEndpoints?.summaryStats;
    const summaryStats = rawSummaryStats ? {
        overallImprovement: typeof rawSummaryStats.overallImprovement === 'object' ? (rawSummaryStats.overallImprovement as any).value : rawSummaryStats.overallImprovement,
        daysToFirstResult: typeof rawSummaryStats.daysToFirstResult === 'object' ? (rawSummaryStats.daysToFirstResult as any).value : rawSummaryStats.daysToFirstResult,
        consistencyScore: typeof rawSummaryStats.consistencyScore === 'object' ? (rawSummaryStats.consistencyScore as any).value : rawSummaryStats.consistencyScore,
    } : undefined;

    // Derive participant info from profile
    const displayName = profile?.display_name || profile?.nickname || 'User';
    const initials = displayName.charAt(0).toUpperCase();

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
                                    onClick={(e) => {
                                        if (!hasData) {
                                            // Use clientX/clientY for fixed positioning near click
                                            setHintPosition({ x: e.clientX + 15, y: e.clientY });
                                            setTimeout(() => setHintPosition(null), 2000);
                                            return;
                                        }
                                        setActiveView(option.id);
                                    }}
                                    className={`w-full px-4 py-3 text-sm text-left flex items-center gap-3 transition-all duration-300 cursor-pointer ${activeView === option.id
                                        ? 'bg-[#D4AF37]/20 border-l-2 border-[#D4AF37]'
                                        : 'bg-white/5 border-l-2 border-transparent hover:bg-white/10'
                                        } ${!hasData ? 'opacity-70' : ''}`}
                                >
                                    <option.icon className={`w-4 h-4 ${activeView === option.id ? 'text-[#D4AF37]' : 'text-white/50'}`} />
                                    <span className={activeView === option.id ? 'text-[#D4AF37]' : 'text-white'}>
                                        {option.label}
                                    </span>
                                </motion.button>
                            ))}
                        </div>

                        {/* No Data Hint - fixed position near click */}
                        <AnimatePresence>
                            {hintPosition && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="fixed z-[100] px-3 py-2 bg-[#0B3D2E] border border-[#D4AF37]/50 text-white text-xs rounded shadow-lg whitespace-nowrap pointer-events-none"
                                    style={{
                                        left: hintPosition.x,
                                        top: hintPosition.y,
                                        transform: 'translateY(-50%)'
                                    }}
                                >
                                    {language === 'en'
                                        ? 'Ready for analysis'
                                        : '随时可以生成分析'}
                                </motion.div>
                            )}
                        </AnimatePresence>

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

                        {/* Refresh Button (when data exists) */}
                        {hasData && (
                            <button
                                onClick={triggerAnalysis}
                                disabled={isAnalyzing}
                                className="flex items-center gap-2 text-sm text-white/60 hover:text-[#D4AF37] transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                                {isAnalyzing
                                    ? (language === 'en' ? 'Analyzing...' : '分析中...')
                                    : (language === 'en' ? 'Refresh analysis' : '刷新分析')}
                            </button>
                        )}
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
                                    <span className="text-[#0B3D2E] font-bold text-sm">{initials.charAt(0)}</span>
                                </div>
                                <span className="text-white text-sm">
                                    {language === 'en'
                                        ? <>Participant&apos;s Digital Twin in <span className="text-[#D4AF37]">Anxiety Recovery</span></>
                                        : <>参与者数字孪生：<span className="text-[#D4AF37]">焦虑恢复</span></>}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowSettings(true)}
                                    className="p-2 text-white/50 hover:text-white transition-colors"
                                >
                                    <Settings className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        {loading ? (
                            <LoadingState language={language} />
                        ) : notLoggedIn ? (
                            <NotLoggedInState language={language} />
                        ) : error ? (
                            <ErrorState message={error} onRetry={() => generateCurve()} language={language} />
                        ) : !hasData ? (
                            <NoAnalysisState
                                onTriggerAnalysis={triggerAnalysis}
                                isAnalyzing={isAnalyzing}
                                language={language}
                            />
                        ) : (
                            <AnimatePresence mode="wait">
                                {/* Data Quality Banner - shown for all views when data exists */}
                                {curveData && <DataQualityBanner curveData={curveData} language={language} />}

                                {activeView === 'prediction' && (
                                    <motion.div
                                        key="prediction"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="p-6 space-y-6"
                                    >
                                        {/* NEW: Recharts Curve Chart */}
                                        <RechartsCurveChart
                                            timepoints={timepoints}
                                            selectedMetrics={selectedMetrics}
                                            onMetricToggle={handleMetricToggle}
                                            language={language}
                                        />

                                        {/* Methodology Section */}
                                        <MethodologySection language={language} />
                                    </motion.div>
                                )}

                                {activeView === 'progress' && (
                                    <motion.div
                                        key="progress"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="p-6 space-y-6"
                                    >
                                        {/* Timeline Progress */}
                                        <ProgressTimeline
                                            milestones={milestones}
                                            currentWeek={curveData?.meta?.currentWeek ?? 0}
                                            language={language}
                                        />

                                        {/* Baseline Assessment */}
                                        <CurveBaselineView
                                            scales={baselineScales}
                                            vitals={baselineVitals}
                                            language={language}
                                        />
                                    </motion.div>
                                )}

                                {activeView === 'advice' && (
                                    <motion.div
                                        key="advice"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="p-6 space-y-6"
                                    >
                                        {/* Summary Stats at top */}
                                        <CurveEndpointsView
                                            charts={charts}
                                            summaryStats={summaryStats}
                                            language={language}
                                        />

                                        {/* Health Recommendations */}
                                        <CurveHealthRecommendationView
                                            scales={baselineScales}
                                            timepoints={timepoints}
                                            summaryStats={summaryStats}
                                            language={language}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Settings Modal */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowSettings(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md mx-4 p-6 rounded-lg"
                            style={{ backgroundColor: '#0B3D2E', border: '1px solid rgba(212, 175, 55, 0.3)' }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-white font-semibold text-lg">
                                    {language === 'en' ? 'Digital Twin Settings' : '数字孪生设置'}
                                </h3>
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="p-1 text-white/50 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Settings Options */}
                            <div className="space-y-6">
                                {/* Analysis Frequency */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Zap className="w-4 h-4 text-[#D4AF37]" />
                                        <span className="text-white text-sm font-medium">
                                            {language === 'en' ? 'Analysis Frequency' : '分析频率'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { value: 'auto', label: language === 'en' ? 'Auto' : '自动' },
                                            { value: 'daily', label: language === 'en' ? 'Daily' : '每日' },
                                            { value: 'weekly', label: language === 'en' ? 'Weekly' : '每周' },
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => setAnalysisFrequency(option.value as typeof analysisFrequency)}
                                                className={`py-2 px-3 text-sm rounded transition-colors ${analysisFrequency === option.value
                                                    ? 'bg-[#D4AF37] text-[#0B3D2E] font-medium'
                                                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-white/40 text-xs mt-2">
                                        {language === 'en'
                                            ? 'Auto: Analyzes after each daily calibration'
                                            : '自动：每次完成每日校准后分析'}
                                    </p>
                                </div>

                                {/* Medical History Consent */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Shield className="w-4 h-4 text-[#D4AF37]" />
                                        <span className="text-white text-sm font-medium">
                                            {language === 'en' ? 'Privacy Settings' : '隐私设置'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setMedicalConsent(!medicalConsent)}
                                        className="w-full flex items-center justify-between p-3 bg-white/5 rounded hover:bg-white/10 transition-colors"
                                    >
                                        <div className="text-left">
                                            <div className="text-white text-sm">
                                                {language === 'en' ? 'Share Medical History' : '分享医疗历史'}
                                            </div>
                                            <div className="text-white/40 text-xs">
                                                {language === 'en'
                                                    ? 'Include detailed health data in analysis'
                                                    : '在分析中包含详细健康数据'}
                                            </div>
                                        </div>
                                        <div className={`w-10 h-6 rounded-full transition-colors ${medicalConsent ? 'bg-[#D4AF37]' : 'bg-white/20'}`}>
                                            <motion.div
                                                animate={{ x: medicalConsent ? 16 : 2 }}
                                                className="w-5 h-5 mt-0.5 bg-white rounded-full shadow"
                                            />
                                        </div>
                                    </button>
                                </div>

                                {/* Notifications */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Bell className="w-4 h-4 text-[#D4AF37]" />
                                        <span className="text-white text-sm font-medium">
                                            {language === 'en' ? 'Notifications' : '通知'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setNotifications(!notifications)}
                                        className="w-full flex items-center justify-between p-3 bg-white/5 rounded hover:bg-white/10 transition-colors"
                                    >
                                        <div className="text-left">
                                            <div className="text-white text-sm">
                                                {language === 'en' ? 'Analysis Updates' : '分析更新'}
                                            </div>
                                            <div className="text-white/40 text-xs">
                                                {language === 'en'
                                                    ? 'Get notified when new insights are ready'
                                                    : '新洞察准备好时通知我'}
                                            </div>
                                        </div>
                                        <div className={`w-10 h-6 rounded-full transition-colors ${notifications ? 'bg-[#D4AF37]' : 'bg-white/20'}`}>
                                            <motion.div
                                                animate={{ x: notifications ? 16 : 2 }}
                                                className="w-5 h-5 mt-0.5 bg-white rounded-full shadow"
                                            />
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Save Button */}
                            <button
                                onClick={() => setShowSettings(false)}
                                className="w-full mt-6 py-3 bg-[#D4AF37] text-[#0B3D2E] font-medium rounded hover:bg-[#B8960C] transition-colors"
                            >
                                {language === 'en' ? 'Save Settings' : '保存设置'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}


// ============================================
// Prediction View Component
// ============================================

function PredictionView({
    participant,
    metrics,
    timeLabels,
    timeOffset,
    setTimeOffset,
    maxOffset,
    initials,
    language,
}: {
    participant: DashboardData['participant'];
    metrics: DashboardData['predictionTable']['metrics'];
    timeLabels: string[];
    timeOffset: number;
    setTimeOffset: (offset: number) => void;
    maxOffset: number;
    initials: string;
    language: string;
}) {
    const activeColumn = Math.min(1 + timeOffset, timeLabels.length - 1);

    // Localize participant info
    const displayedParticipant = language === 'en'
        ? participant
        : {
            ...participant,
            gender: participant.gender === 'Female' ? '女' : participant.gender === 'Male' ? '男' : participant.gender,
            diagnosis: participant.diagnosis === 'GAD' ? '广泛性焦虑' : participant.diagnosis,
        };

    return (
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
                    {displayedParticipant.age && (
                        <div><span className="text-white/50">{language === 'en' ? 'Age: ' : '年龄：'}</span><span className="text-white">{displayedParticipant.age}</span></div>
                    )}
                    <div><span className="text-white/50">{language === 'en' ? 'Diagnosis: ' : '诊断：'}</span><span className="text-white">{displayedParticipant.diagnosis}</span></div>
                    {displayedParticipant.gender && (
                        <div><span className="text-white/50">{language === 'en' ? 'Sex: ' : '性别：'}</span><span className="text-white">{displayedParticipant.gender}</span></div>
                    )}
                    <div><span className="text-white/50">{language === 'en' ? 'Since: ' : '注册：'}</span><span className="text-white">{new Date(displayedParticipant.registrationDate).toLocaleDateString()}</span></div>
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
                                <td className="px-4 py-3 text-center text-white/60"><AnimatedValue value={metric.predictions['3'] || '—'} delay={150 + i * 50} /></td>
                                <td className="px-4 py-3 text-center text-white/60"><AnimatedValue value={metric.predictions['6'] || '—'} delay={200 + i * 50} /></td>
                                <td className="px-4 py-3 text-center text-white/60"><AnimatedValue value={metric.predictions['9'] || '—'} delay={250 + i * 50} /></td>
                                <td className="px-4 py-3 text-center text-white/60"><AnimatedValue value={metric.predictions['12'] || '—'} delay={300 + i * 50} /></td>
                                <td className="px-4 py-3 text-center text-white/60"><AnimatedValue value={metric.predictions['15'] || '—'} delay={350 + i * 50} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}

// ============================================
// Timeline View Component
// ============================================

function TimelineView({
    timeline,
    language,
}: {
    timeline: TreatmentMilestone[];
    language: string;
}) {
    return (
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
                    {timeline.map((milestone, i) => (
                        <motion.div
                            key={milestone.week}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="relative pl-12"
                        >
                            {/* Dot */}
                            <div className={`absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${milestone.status === 'completed' ? 'bg-[#D4AF37] border-[#D4AF37]' :
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
                                {milestone.actualScore !== undefined && (
                                    <p className="text-[#D4AF37] text-xs mt-1">
                                        {language === 'en' ? `Score: ${milestone.actualScore}` : `评分: ${milestone.actualScore}`}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

// ============================================
// Baseline View Component
// ============================================

function BaselineView({
    assessments,
    vitals,
    language,
}: {
    assessments: DashboardData['baselineData']['assessments'];
    vitals: DashboardData['baselineData']['vitals'];
    language: string;
}) {
    return (
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
                        {assessments.map((item, i) => (
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
                        {vitals.map((item, i) => (
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
                                <span className={`text-xs ${item.trend === 'normal' || item.trend === 'at_target' ? 'text-green-400' :
                                    item.trend === 'above_target' ? 'text-blue-400' : 'text-amber-400'
                                    }`}>
                                    {language === 'en'
                                        ? item.trend.replace('_', ' ')
                                        : item.trend === 'normal' ? '正常'
                                            : item.trend === 'at_target' ? '达标'
                                                : item.trend === 'above_target' ? '高于目标'
                                                    : '低于目标'}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================
// Endpoints View Component
// ============================================

function EndpointsView({
    charts,
    summaryStats,
    language,
}: {
    charts?: DashboardData['charts'];
    summaryStats?: DashboardData['summaryStats'];
    language: string;
}) {
    // Default chart data if not provided
    const anxietyTrend = charts?.anxietyTrend || [14, 12, 11, 10, 9, 8];
    const sleepTrend = charts?.sleepTrend || [3, 4, 5, 6, 7, 8];
    const hrvTrend = charts?.hrvTrend || [42, 48, 52, 55, 58, 62];
    const energyTrend = charts?.energyTrend || [4, 5, 5.5, 6, 6.5, 7];

    // Calculate improvements
    const anxietyImprovement = anxietyTrend.length > 1
        ? Math.round((1 - anxietyTrend[anxietyTrend.length - 1] / anxietyTrend[0]) * 100)
        : 0;
    const sleepImprovement = sleepTrend.length > 1
        ? Math.round((sleepTrend[sleepTrend.length - 1] / sleepTrend[0] - 1) * 100)
        : 0;
    const hrvImprovement = hrvTrend.length > 1
        ? Math.round((hrvTrend[hrvTrend.length - 1] / hrvTrend[0] - 1) * 100)
        : 0;
    const energyImprovement = energyTrend.length > 1
        ? Math.round((energyTrend[energyTrend.length - 1] / energyTrend[0] - 1) * 100)
        : 0;

    return (
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
                        <span className={`text-xs ${anxietyImprovement > 0 ? 'text-[#D4AF37]' : 'text-white/50'}`}>
                            {anxietyImprovement > 0 ? `↓ ${anxietyImprovement}%` : '—'}
                        </span>
                    </div>
                    <div className="h-32 flex items-end gap-2">
                        {anxietyTrend.map((val, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${(val / Math.max(...anxietyTrend)) * 100}%` }}
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
                        <span className={`text-xs ${sleepImprovement > 0 ? 'text-green-400' : 'text-white/50'}`}>
                            {sleepImprovement > 0 ? `↑ ${sleepImprovement}%` : '—'}
                        </span>
                    </div>
                    <div className="h-32 flex items-end gap-2">
                        {sleepTrend.map((val, i) => (
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
                        <span className={`text-xs ${hrvImprovement > 0 ? 'text-green-400' : 'text-white/50'}`}>
                            {hrvImprovement > 0 ? `↑ ${hrvImprovement}%` : '—'}
                        </span>
                    </div>
                    <div className="h-32 flex items-end gap-2">
                        {hrvTrend.map((val, i) => (
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
                        <span className={`text-xs ${energyImprovement > 0 ? 'text-green-400' : 'text-white/50'}`}>
                            {energyImprovement > 0 ? `↑ ${energyImprovement}%` : '—'}
                        </span>
                    </div>
                    <div className="h-32 flex items-end gap-2">
                        {energyTrend.map((val, i) => (
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
                    { label: 'Overall Improvement', value: summaryStats?.overallImprovement || '—', color: 'text-[#D4AF37]' },
                    { label: 'Days to First Result', value: summaryStats?.daysToFirstResult?.toString() || '—', color: 'text-white' },
                    { label: 'Consistency Score', value: summaryStats?.consistencyScore || '—', color: 'text-green-400' },
                ] : [
                    { label: '整体改善', value: summaryStats?.overallImprovement || '—', color: 'text-[#D4AF37]' },
                    { label: '首次见效天数', value: summaryStats?.daysToFirstResult?.toString() || '—', color: 'text-white' },
                    { label: '一致性评分', value: summaryStats?.consistencyScore || '—', color: 'text-green-400' },
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
    );
}

// ============================================
// Health Recommendation View Component
// ============================================

interface HealthRecommendationViewProps {
    assessments: DashboardData['baselineData']['assessments'];
    metrics: DashboardData['predictionTable']['metrics'];
    summaryStats?: DashboardData['summaryStats'];
    language: string;
}

function HealthRecommendationView({
    assessments,
    metrics,
    summaryStats,
    language,
}: HealthRecommendationViewProps) {
    // Derive focus areas from assessments
    const focusAreas = assessments
        .filter(a => {
            const val = typeof a.value === 'number' ? a.value : parseInt(a.value as string, 10);
            // High severity: GAD-7 >= 10, PHQ-9 >= 10, ISI >= 15, PSS-10 >= 20
            if (a.name.includes('GAD') || a.name.includes('焦虑')) return val >= 10;
            if (a.name.includes('PHQ') || a.name.includes('抑郁')) return val >= 10;
            if (a.name.includes('ISI') || a.name.includes('失眠')) return val >= 15;
            if (a.name.includes('PSS') || a.name.includes('压力')) return val >= 20;
            return false;
        })
        .map(a => ({
            name: a.name,
            value: a.value,
            interpretation: a.interpretation,
        }));

    // Generate recommendations based on focus areas
    const generateRecommendations = () => {
        const recs: { icon: typeof Lightbulb; title: string; description: string; science: string }[] = [];

        const hasAnxiety = assessments.some(a =>
            (a.name.includes('GAD') || a.name.includes('焦虑')) &&
            (typeof a.value === 'number' ? a.value : parseInt(a.value as string, 10)) >= 10
        );
        const hasDepression = assessments.some(a =>
            (a.name.includes('PHQ') || a.name.includes('抑郁')) &&
            (typeof a.value === 'number' ? a.value : parseInt(a.value as string, 10)) >= 10
        );
        const hasInsomnia = assessments.some(a =>
            (a.name.includes('ISI') || a.name.includes('失眠')) &&
            (typeof a.value === 'number' ? a.value : parseInt(a.value as string, 10)) >= 15
        );
        const hasStress = assessments.some(a =>
            (a.name.includes('PSS') || a.name.includes('压力')) &&
            (typeof a.value === 'number' ? a.value : parseInt(a.value as string, 10)) >= 20
        );

        if (hasAnxiety) {
            recs.push({
                icon: Lightbulb,
                title: language === 'en' ? 'Practice Breathing Exercises' : '练习呼吸训练',
                description: language === 'en'
                    ? '4-7-8 breathing technique: Inhale 4s, hold 7s, exhale 8s. Practice 2-3 times daily.'
                    : '4-7-8 呼吸法：吸气4秒，屏息7秒，呼气8秒。每天练习2-3次。',
                science: language === 'en'
                    ? 'Activates parasympathetic nervous system, reducing cortisol by 20-30%.'
                    : '激活副交感神经系统，降低皮质醇20-30%。',
            });
        }

        if (hasDepression) {
            recs.push({
                icon: Target,
                title: language === 'en' ? 'Behavioral Activation' : '行为激活',
                description: language === 'en'
                    ? 'Schedule one enjoyable activity daily, even 10 minutes. Start small and build momentum.'
                    : '每天安排一项愉悦活动，哪怕只有10分钟。从小事开始，逐步建立动力。',
                science: language === 'en'
                    ? 'Core CBT technique shown to improve mood in 60% of patients within 4 weeks.'
                    : 'CBT 核心技术，60%患者4周内情绪改善。',
            });
        }

        if (hasInsomnia) {
            recs.push({
                icon: Clock,
                title: language === 'en' ? 'Sleep Hygiene' : '睡眠卫生',
                description: language === 'en'
                    ? 'No screens 1 hour before bed. Keep bedroom cool (18-20°C) and dark.'
                    : '睡前1小时不看屏幕。卧室保持凉爽(18-20°C)和黑暗。',
                science: language === 'en'
                    ? 'Blue light suppresses melatonin production by up to 50%.'
                    : '蓝光抑制褪黑素分泌达50%。',
            });
        }

        if (hasStress) {
            recs.push({
                icon: Zap,
                title: language === 'en' ? 'Stress Management' : '压力管理',
                description: language === 'en'
                    ? 'Take 3 micro-breaks per hour: stand, stretch, look away from screen for 20 seconds.'
                    : '每小时3次微休息：站起来、拉伸、看向远处20秒。',
                science: language === 'en'
                    ? 'Reduces cumulative stress response and prevents burnout.'
                    : '减少累积压力反应，预防倦怠。',
            });
        }

        // Always add general wellness
        recs.push({
            icon: Heart,
            title: language === 'en' ? 'Daily Calibration' : '每日校准',
            description: language === 'en'
                ? 'Complete your daily check-in to improve prediction accuracy and track progress.'
                : '完成每日打卡，提高预测准确度并追踪进展。',
            science: language === 'en'
                ? 'Consistent self-monitoring increases treatment adherence by 40%.'
                : '持续自我监测使治疗依从性提高40%。',
        });

        return recs;
    };

    const recommendations = generateRecommendations();

    // Expected progress from metrics
    const anxietyMetric = metrics.find(m => m.name.includes('Anxiety') || m.name.includes('焦虑'));
    const moodMetric = metrics.find(m => m.name.includes('Mood') || m.name.includes('情绪'));

    return (
        <motion.div
            key="recommendation"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="p-6"
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-full flex items-center justify-center">
                    <Heart className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                    <h3 className="text-white font-semibold">
                        {language === 'en' ? 'Personalized Health Recommendation' : '个性化健康建议'}
                    </h3>
                    <p className="text-white/50 text-sm">
                        {language === 'en' ? 'Based on your baseline and progress' : '基于你的基线数据和进展'}
                    </p>
                </div>
            </div>

            {/* Focus Areas */}
            {focusAreas.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Target className="w-4 h-4 text-[#D4AF37]" />
                        <span className="text-white text-sm font-medium">
                            {language === 'en' ? 'Current Focus Areas' : '当前关注重点'}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {focusAreas.map((area, i) => (
                            <motion.div
                                key={area.name}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * i }}
                                className="p-3 bg-red-500/10 border border-red-500/20 rounded"
                            >
                                <div className="text-white text-sm font-medium">{area.name}</div>
                                <div className="text-red-400 text-xs">{area.interpretation}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Expected Progress */}
            {(anxietyMetric || moodMetric) && (
                <div className="mb-6 p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
                        <span className="text-white text-sm font-medium">
                            {language === 'en' ? 'Expected 15-Week Progress' : '预期15周进展'}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        {anxietyMetric && (
                            <div>
                                <span className="text-white/50">{anxietyMetric.name}: </span>
                                <span className="text-[#D4AF37]">{anxietyMetric.baseline}</span>
                                <span className="text-white/30"> → </span>
                                <span className="text-green-400">{anxietyMetric.predictions['15'] || '—'}</span>
                            </div>
                        )}
                        {moodMetric && (
                            <div>
                                <span className="text-white/50">{moodMetric.name}: </span>
                                <span className="text-[#D4AF37]">{moodMetric.baseline}</span>
                                <span className="text-white/30"> → </span>
                                <span className="text-green-400">{moodMetric.predictions['15'] || '—'}</span>
                            </div>
                        )}
                    </div>
                    <p className="text-white/40 text-xs mt-2 italic">
                        {language === 'en'
                            ? '💡 Based on exponential recovery model (CBT standard 12-16 weeks)'
                            : '💡 基于指数恢复模型（CBT标准疗程12-16周）'}
                    </p>
                </div>
            )}

            {/* Recommendations */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-white text-sm font-medium">
                        {language === 'en' ? 'Actionable Recommendations' : '可行建议'}
                    </span>
                </div>
                {recommendations.map((rec, i) => (
                    <motion.div
                        key={rec.title}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 * i }}
                        className="p-4 bg-white/5 border-l-2 border-[#D4AF37] hover:bg-white/10 transition-colors"
                    >
                        <div className="flex items-start gap-3">
                            <rec.icon className="w-5 h-5 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <div className="text-white font-medium text-sm">{rec.title}</div>
                                <div className="text-white/70 text-sm mt-1">{rec.description}</div>
                                <div className="text-white/40 text-xs mt-2 italic flex items-center gap-1">
                                    <span>📊</span> {rec.science}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Warning/Notes */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded"
            >
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <div className="text-amber-300 font-medium text-sm">
                            {language === 'en' ? 'Important Note' : '重要提示'}
                        </div>
                        <div className="text-amber-200/70 text-sm mt-1">
                            {language === 'en'
                                ? 'These recommendations are AI-generated based on your data. For clinical concerns, please consult a healthcare professional.'
                                : '这些建议由AI基于你的数据生成。如有临床问题，请咨询专业医疗人员。'}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ============================================
// NEW: Curve-based View Components (using useDigitalTwinCurve)
// ============================================

// Curve Prediction View
function CurvePredictionView({
    timepoints,
    timeLabels,
    timeOffset,
    setTimeOffset,
    maxOffset,
    initials,
    displayName,
    language,
}: {
    timepoints: CurveTimepoint[];
    timeLabels: string[];
    timeOffset: number;
    setTimeOffset: (offset: number) => void;
    maxOffset: number;
    initials: string;
    displayName: string;
    language: string;
}) {
    const metricKeys = ['anxietyScore', 'sleepQuality', 'stressResilience', 'moodStability', 'energyLevel', 'hrvScore'] as const;
    const metricLabels = language === 'en'
        ? { anxietyScore: 'Anxiety', sleepQuality: 'Sleep', stressResilience: 'Resilience', moodStability: 'Mood', energyLevel: 'Energy', hrvScore: 'HRV' }
        : { anxietyScore: '焦虑', sleepQuality: '睡眠', stressResilience: '韧性', moodStability: '情绪', energyLevel: '能量', hrvScore: 'HRV' };

    return (
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
                <div className="flex items-center gap-4 text-sm">
                    <span className="text-white/50">{language === 'en' ? 'Name: ' : '姓名：'}</span>
                    <span className="text-white">{displayName}</span>
                </div>
            </div>

            {/* Time Slider */}
            <div className="px-6 py-3 flex items-center gap-4" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <button onClick={() => setTimeOffset(Math.max(0, timeOffset - 1))} disabled={timeOffset === 0} className="p-1 text-white/50 hover:text-white transition-colors disabled:opacity-30">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex-1 flex justify-between text-xs text-white/60">
                    {timeLabels.map((label, i) => (
                        <span key={label} className={`${i === 0 ? 'text-white/40' : ''} ${i === Math.min(1 + timeOffset, timeLabels.length - 1) ? 'text-[#D4AF37]' : ''}`}>{label}</span>
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
                            {timepoints.map(tp => (
                                <th key={tp.week} className="px-4 py-3 text-center text-white/60 font-medium">
                                    {tp.week === 0 ? (language === 'en' ? 'Baseline' : '基线') : `${tp.week}${language === 'en' ? ' wk' : '周'}`}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {metricKeys.map((key, i) => (
                            <tr key={key} className="border-b border-white/5" style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                                <td className="px-4 py-3 text-white/80">{metricLabels[key]}</td>
                                {timepoints.map((tp, idx) => (
                                    <td key={tp.week} className={`px-4 py-3 text-center ${idx === 0 ? 'text-[#D4AF37]' : 'text-white/60'}`}>
                                        {tp.metrics?.[key]?.value?.toFixed(0) ?? '—'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}

// Curve Timeline View
function CurveTimelineView({
    milestones,
    language,
}: {
    milestones: TimelineMilestone[];
    language: string;
}) {
    return (
        <motion.div
            key="timeline"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="p-6"
        >
            <h3 className="text-white font-semibold mb-4">
                {language === 'en' ? 'Recovery Timeline' : '恢复时间线'}
            </h3>
            <div className="space-y-4">
                {milestones.map((m, i) => (
                    <motion.div
                        key={m.week}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className={`flex items-start gap-4 p-4 rounded ${m.status === 'current' ? 'bg-[#D4AF37]/20 border border-[#D4AF37]/30' :
                            m.status === 'completed' ? 'bg-green-500/10' : 'bg-white/5'
                            }`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${m.status === 'current' ? 'bg-[#D4AF37] text-[#0B3D2E]' :
                            m.status === 'completed' ? 'bg-green-500/30 text-green-400' : 'bg-white/10 text-white/50'
                            }`}>
                            {m.week}
                        </div>
                        <div className="flex-1">
                            <div className="text-white font-medium">{m.event}</div>
                            <div className="text-white/50 text-sm">{m.detail}</div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

// Curve Baseline View
function CurveBaselineView({
    scales,
    vitals,
    language,
}: {
    scales: ScaleBaselineItem[];
    vitals: { restingHeartRate?: number; bloodPressure?: string; bmi?: number };
    language: string;
}) {
    const getSeverityColor = (name: string, value: number | null) => {
        if (value === null) return 'text-white/50';
        if (name === 'GAD-7' && value >= 10) return 'text-red-400';
        if (name === 'PHQ-9' && value >= 10) return 'text-red-400';
        if (name === 'ISI' && value >= 15) return 'text-red-400';
        if (name === 'PSS-10' && value >= 20) return 'text-amber-400';
        return 'text-green-400';
    };

    return (
        <motion.div
            key="baseline"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="p-6"
        >
            <h3 className="text-white font-semibold mb-4">
                {language === 'en' ? 'Baseline Assessment Scales' : '基线评估量表'}
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
                {scales.map((s, i) => (
                    <motion.div
                        key={s.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="p-4 bg-white/5 rounded"
                    >
                        <div className="text-white/50 text-xs mb-1">{s.name}</div>
                        <div className={`text-2xl font-bold ${getSeverityColor(s.name, s.value)}`}>
                            {s.value ?? '—'}
                        </div>
                        <div className="text-white/40 text-xs mt-1">{s.interpretation}</div>
                    </motion.div>
                ))}
            </div>

            {(vitals.restingHeartRate || vitals.bloodPressure || vitals.bmi) && (
                <>
                    <h4 className="text-white/70 text-sm mb-3">{language === 'en' ? 'Vitals' : '生理指标'}</h4>
                    <div className="grid grid-cols-3 gap-3">
                        {vitals.restingHeartRate && (
                            <div className="p-3 bg-white/5 rounded text-center">
                                <div className="text-white text-lg font-semibold">{vitals.restingHeartRate}</div>
                                <div className="text-white/40 text-xs">{language === 'en' ? 'Heart Rate' : '心率'}</div>
                            </div>
                        )}
                        {vitals.bloodPressure && (
                            <div className="p-3 bg-white/5 rounded text-center">
                                <div className="text-white text-lg font-semibold">{vitals.bloodPressure}</div>
                                <div className="text-white/40 text-xs">{language === 'en' ? 'Blood Pressure' : '血压'}</div>
                            </div>
                        )}
                        {vitals.bmi && (
                            <div className="p-3 bg-white/5 rounded text-center">
                                <div className="text-white text-lg font-semibold">{vitals.bmi}</div>
                                <div className="text-white/40 text-xs">BMI</div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </motion.div>
    );
}

// Curve Endpoints View
function CurveEndpointsView({
    charts,
    summaryStats,
    language,
}: {
    charts?: { anxietyTrend?: { points: { week: number; value: number }[] } };
    summaryStats?: { overallImprovement?: string; daysToFirstResult?: number; consistencyScore?: string };
    language: string;
}) {
    return (
        <motion.div
            key="endpoints"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="p-6"
        >
            <h3 className="text-white font-semibold mb-4">
                {language === 'en' ? 'Summary Statistics' : '统计摘要'}
            </h3>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-white/5 rounded">
                    <div className="text-2xl font-bold text-[#D4AF37]">{summaryStats?.overallImprovement || '—'}</div>
                    <div className="text-xs text-white/50 mt-1">{language === 'en' ? 'Overall Improvement' : '整体改善'}</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded">
                    <div className="text-2xl font-bold text-white">{summaryStats?.daysToFirstResult?.toString() || '—'}</div>
                    <div className="text-xs text-white/50 mt-1">{language === 'en' ? 'Days to First Result' : '首次见效天数'}</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded">
                    <div className="text-2xl font-bold text-green-400">{summaryStats?.consistencyScore || '—'}</div>
                    <div className="text-xs text-white/50 mt-1">{language === 'en' ? 'Consistency Score' : '一致性评分'}</div>
                </div>
            </div>

            {/* Simple Chart Representation */}
            {charts?.anxietyTrend && (
                <div className="p-4 bg-white/5 rounded">
                    <div className="text-white/60 text-sm mb-2">{language === 'en' ? 'Anxiety Trend' : '焦虑趋势'}</div>
                    <div className="flex items-end justify-between h-20 gap-1">
                        {charts.anxietyTrend.points.map((p, i) => (
                            <div key={p.week} className="flex-1 flex flex-col items-center">
                                <div
                                    className="w-full bg-[#D4AF37]/50 rounded-t"
                                    style={{ height: `${p.value}%` }}
                                />
                                <div className="text-xs text-white/40 mt-1">{p.week === 0 ? '0' : p.week}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}

// Curve Health Recommendation View
function CurveHealthRecommendationView({
    scales,
    timepoints,
    summaryStats,
    language,
}: {
    scales: ScaleBaselineItem[];
    timepoints: CurveTimepoint[];
    summaryStats?: { overallImprovement?: string };
    language: string;
}) {
    // Use Ask Max hook for recommendation explanations
    const { isLoading, isExpanded, getExplanation, askMax } = useAskMaxExplain();

    // Severity grading helper
    const getSeverity = (scaleName: string, value: number): 'mild' | 'moderate' | 'severe' | 'normal' => {
        if (scaleName === 'GAD-7') {
            if (value >= 15) return 'severe';
            if (value >= 10) return 'moderate';
            if (value >= 5) return 'mild';
        } else if (scaleName === 'PHQ-9') {
            if (value >= 20) return 'severe';
            if (value >= 10) return 'moderate';
            if (value >= 5) return 'mild';
        } else if (scaleName === 'ISI') {
            if (value >= 22) return 'severe';
            if (value >= 15) return 'moderate';
            if (value >= 8) return 'mild';
        } else if (scaleName === 'PSS-10') {
            if (value >= 27) return 'severe';
            if (value >= 14) return 'moderate';
        }
        return 'normal';
    };

    // Get severity color
    const severityColors = {
        severe: { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400', label: language === 'en' ? 'Severe' : '重度' },
        moderate: { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-400', label: language === 'en' ? 'Moderate' : '中度' },
        mild: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-400', label: language === 'en' ? 'Mild' : '轻度' },
        normal: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-400', label: language === 'en' ? 'Normal' : '正常' },
    };

    // Analyze trend from timepoints (week 0 vs week 15)
    const week0 = timepoints.find(t => t.week === 0);
    const week15 = timepoints.find(t => t.week === 15);
    const anxietyTrend = week0 && week15
        ? (week0.metrics?.anxietyScore?.value ?? 0) - (week15.metrics?.anxietyScore?.value ?? 0)
        : 0;
    const trendDirection = anxietyTrend > 10 ? 'improving' : anxietyTrend < -5 ? 'worsening' : 'stable';

    // Derive focus areas with severity
    const focusAreas = scales.filter(s => s.value && getSeverity(s.name, s.value) !== 'normal').map(s => ({
        ...s,
        severity: getSeverity(s.name, s.value ?? 0),
    }));

    // Helper to map icon string to component
    const iconMap: Record<string, typeof Lightbulb> = {
        breathing: Activity,
        activity: Target,
        sleep: Moon,
        mindfulness: Brain,
        exercise: TrendingUp,
        social: Heart,
        nutrition: Smile,
        tracking: BarChart3,
        alert: AlertCircle,
    };

    // Generate personalized recommendations from database
    const recs: { icon: typeof Lightbulb; title: string; description: string; science: string; priority: 'high' | 'medium' | 'low' }[] = [];

    // GAD-7 based recommendations
    const gad7 = scales.find(s => s.name === 'GAD-7');
    if (gad7?.value) {
        const severity = getSeverity('GAD-7', gad7.value);
        if (severity !== 'normal') {
            const dbRecs = getRecommendations('anxiety', severity, 2);
            dbRecs.forEach(r => recs.push({
                icon: iconMap[r.icon] || Lightbulb,
                title: language === 'en' ? r.title.en : r.title.cn,
                description: language === 'en' ? r.description.en : r.description.cn,
                science: language === 'en' ? r.science.en : r.science.cn,
                priority: r.priority,
            }));
        }
    }

    // PHQ-9 based recommendations  
    const phq9 = scales.find(s => s.name === 'PHQ-9');
    if (phq9?.value) {
        const severity = getSeverity('PHQ-9', phq9.value);
        if (severity !== 'normal') {
            const dbRecs = getRecommendations('depression', severity, 2);
            dbRecs.forEach(r => recs.push({
                icon: iconMap[r.icon] || Target,
                title: language === 'en' ? r.title.en : r.title.cn,
                description: language === 'en' ? r.description.en : r.description.cn,
                science: language === 'en' ? r.science.en : r.science.cn,
                priority: r.priority,
            }));
        }
    }

    // ISI (sleep) based recommendations
    const isi = scales.find(s => s.name === 'ISI');
    if (isi?.value) {
        const severity = getSeverity('ISI', isi.value);
        if (severity !== 'normal') {
            const dbRecs = getRecommendations('sleep', severity, 1);
            dbRecs.forEach(r => recs.push({
                icon: iconMap[r.icon] || Moon,
                title: language === 'en' ? r.title.en : r.title.cn,
                description: language === 'en' ? r.description.en : r.description.cn,
                science: language === 'en' ? r.science.en : r.science.cn,
                priority: r.priority,
            }));
        }
    }

    // PSS-10 (stress) based recommendations
    const pss = scales.find(s => s.name === 'PSS-10');
    if (pss?.value) {
        const severity = getSeverity('PSS-10', pss.value);
        if (severity !== 'normal') {
            const dbRecs = getRecommendations('stress', severity, 1);
            dbRecs.forEach(r => recs.push({
                icon: iconMap[r.icon] || Activity,
                title: language === 'en' ? r.title.en : r.title.cn,
                description: language === 'en' ? r.description.en : r.description.cn,
                science: language === 'en' ? r.science.en : r.science.cn,
                priority: r.priority,
            }));
        }
    }

    // Trend-based recommendations
    if (trendDirection === 'improving') {
        recs.push({
            icon: TrendingUp,
            title: language === 'en' ? 'Maintain Your Momentum' : '保持势头',
            description: language === 'en'
                ? 'Your curve shows improvement! Continue current practices and stay consistent.'
                : '你的曲线显示改善！继续当前方法，保持一致性。',
            science: language === 'en'
                ? 'Consistency is key: 80% who maintain habits see sustained improvement.'
                : '一致性是关键：80%坚持习惯者持续改善。',
            priority: 'low',
        });
    } else if (trendDirection === 'worsening') {
        recs.push({
            icon: AlertTriangle,
            title: language === 'en' ? 'Adjust Your Approach' : '调整方法',
            description: language === 'en'
                ? 'Curve trending up. Consider increasing intervention intensity or trying new techniques.'
                : '曲线上升趋势。考虑增加干预强度或尝试新技术。',
            science: language === 'en'
                ? 'Adaptive treatment: Adjusting approach improves outcomes by 25%.'
                : '适应性治疗：调整方案使效果提高25%。',
            priority: 'high',
        });
    }

    // Always add daily calibration from general
    const generalRec = getRecommendations('general', 'mild', 1)[0];
    if (generalRec) {
        recs.push({
            icon: iconMap[generalRec.icon] || Heart,
            title: language === 'en' ? generalRec.title.en : generalRec.title.cn,
            description: language === 'en' ? generalRec.description.en : generalRec.description.cn,
            science: language === 'en' ? generalRec.science.en : generalRec.science.cn,
            priority: generalRec.priority,
        });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return (
        <motion.div
            key="recommendation-curve"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="p-6"
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-full flex items-center justify-center">
                    <Heart className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                    <h3 className="text-white font-semibold">
                        {language === 'en' ? 'Health Advice' : '健康建议'}
                    </h3>
                    <p className="text-white/50 text-sm">
                        {language === 'en' ? 'Based on your curve data' : '基于你的曲线数据'}
                    </p>
                </div>
            </div>

            {/* Focus Areas */}
            {focusAreas.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Target className="w-4 h-4 text-[#D4AF37]" />
                        <span className="text-white text-sm font-medium">
                            {language === 'en' ? 'Focus Areas' : '关注重点'}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {focusAreas.map(s => {
                            const colors = severityColors[s.severity];
                            return (
                                <div key={s.name} className={`p-3 ${colors.bg} border ${colors.border} rounded`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-white text-sm font-medium">{s.name}: {s.value}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                                            {colors.label}
                                        </span>
                                    </div>
                                    <div className={`${colors.text} text-xs`}>{s.interpretation}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Expected Progress */}
            {week0 && week15 && (
                <div className="mb-6 p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
                        <span className="text-white text-sm font-medium">
                            {language === 'en' ? '15-Week Predicted Progress' : '15周预期进展'}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-white/50">{language === 'en' ? 'Anxiety' : '焦虑'}: </span>
                            <span className="text-[#D4AF37]">{week0.metrics?.anxietyScore?.value?.toFixed(0) ?? '—'}</span>
                            <span className="text-white/30"> → </span>
                            <span className="text-green-400">{week15.metrics?.anxietyScore?.value?.toFixed(0) ?? '—'}</span>
                        </div>
                        <div>
                            <span className="text-white/50">{language === 'en' ? 'Mood' : '情绪'}: </span>
                            <span className="text-[#D4AF37]">{week0.metrics?.moodStability?.value?.toFixed(0) ?? '—'}</span>
                            <span className="text-white/30"> → </span>
                            <span className="text-green-400">{week15.metrics?.moodStability?.value?.toFixed(0) ?? '—'}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Recommendations */}
            <div className="space-y-3">
                {recs.map((rec, i) => {
                    const recId = `rec-${i}-${rec.title.slice(0, 10)}`;
                    const expanded = isExpanded(recId);
                    const loading = isLoading(recId);
                    const explanation = getExplanation(recId);

                    return (
                        <motion.div
                            key={rec.title}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 * i }}
                            className="p-4 bg-white/5 border-l-2 border-[#D4AF37] rounded-r"
                        >
                            <div className="flex items-start gap-3">
                                <rec.icon className="w-5 h-5 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <div className="text-white font-medium text-sm">{rec.title}</div>
                                    <div className="text-white/70 text-sm mt-1">{rec.description}</div>
                                    <div className="text-white/40 text-xs mt-2 italic">📊 {rec.science}</div>

                                    {/* Ask Max Button */}
                                    <button
                                        onClick={() => askMax({ recId, title: rec.title, description: rec.description, science: rec.science, language: language === 'en' ? 'en' : 'zh' })}
                                        className="mt-3 flex items-center gap-2 px-3 py-1.5 text-xs bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/40 rounded-full text-[#D4AF37] transition-colors"
                                    >
                                        {loading ? (
                                            <>
                                                <MaxAvatar state="thinking" size={18} />
                                                <span className="animate-pulse">{language === 'en' ? 'Max is thinking...' : 'Max思考中...'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <MaxAvatar state="idle" size={16} />
                                                {language === 'en' ? 'Hard to understand? Let Max explain' : '难理解?让Max展开说说'}
                                            </>
                                        )}
                                    </button>

                                    {/* Max's Explanation */}
                                    <AnimatePresence>
                                        {expanded && explanation && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="mt-3 p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded"
                                            >
                                                <div className="flex items-start gap-2">
                                                    <Brain className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <div className="text-[#D4AF37] text-xs font-medium mb-1">
                                                            {language === 'en' ? 'Max says:' : 'Max 说：'}
                                                        </div>
                                                        <div className="text-white/80 text-sm leading-relaxed">
                                                            {explanation}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Warning */}
            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <div className="text-amber-300 font-medium text-sm">
                            {language === 'en' ? 'Important Note' : '重要提示'}
                        </div>
                        <div className="text-amber-200/70 text-sm mt-1">
                            {language === 'en'
                                ? 'AI-generated advice. For clinical concerns, consult a healthcare professional.'
                                : '由AI生成。如有临床问题，请咨询专业医疗人员。'}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================
// NEW: Recharts Curve Chart (from DesktopDigitalTwin)
// ============================================

interface RechartsCurveChartProps {
    timepoints: CurveTimepoint[];
    selectedMetrics: (keyof typeof METRIC_LABELS)[];
    onMetricToggle: (metric: keyof typeof METRIC_LABELS) => void;
    language: string;
}

function RechartsCurveChart({ timepoints, selectedMetrics, onMetricToggle, language }: RechartsCurveChartProps) {
    const chartData = useMemo(() => {
        return timepoints.map(tp => ({
            week: language === 'en' ? `Week ${tp.week}` : `第${tp.week}周`,
            ...Object.fromEntries(
                Object.entries(tp.metrics).map(([key, val]) => [key, val?.value ?? 0])
            ),
        }));
    }, [timepoints, language]);

    const allMetrics = Object.keys(METRIC_LABELS) as (keyof typeof METRIC_LABELS)[];
    const labels = language === 'en' ? METRIC_LABELS : METRIC_LABELS_CN;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6"
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-white font-semibold">
                    {language === 'en' ? 'Prediction Curves' : '预测曲线'}
                </h3>
            </div>

            {/* Metric Toggle Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
                {allMetrics.map(metric => {
                    const colorKey = metric.replace('Score', '').replace('Quality', '').replace('Resilience', '')
                        .replace('Stability', '').replace('Level', '').toLowerCase() as keyof typeof COLORS;
                    const color = COLORS[colorKey] || '#D4AF37';
                    const isSelected = selectedMetrics.includes(metric);

                    return (
                        <button
                            key={metric}
                            onClick={() => onMetricToggle(metric)}
                            className={`px-3 py-1.5 text-xs rounded-full border transition-all ${isSelected
                                ? 'border-transparent text-white'
                                : 'border-white/20 text-white/60 hover:border-white/40'
                                }`}
                            style={isSelected ? { backgroundColor: color } : {}}
                        >
                            {labels[metric]}
                        </button>
                    );
                })}
            </div>

            {/* Chart */}
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            {selectedMetrics.map(metric => {
                                const colorKey = metric.replace('Score', '').replace('Quality', '').replace('Resilience', '')
                                    .replace('Stability', '').replace('Level', '').toLowerCase() as keyof typeof COLORS;
                                const color = COLORS[colorKey] || '#D4AF37';
                                return (
                                    <linearGradient key={metric} id={`gradient-unlearn-${metric}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                                    </linearGradient>
                                );
                            })}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="week"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                        />
                        <YAxis
                            domain={[0, 100]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(11, 61, 46, 0.95)',
                                border: '1px solid rgba(212,175,55,0.3)',
                                borderRadius: '8px',
                                backdropFilter: 'blur(10px)',
                            }}
                            labelStyle={{ color: '#D4AF37' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        {selectedMetrics.map(metric => {
                            const colorKey = metric.replace('Score', '').replace('Quality', '').replace('Resilience', '')
                                .replace('Stability', '').replace('Level', '').toLowerCase() as keyof typeof COLORS;
                            const color = COLORS[colorKey] || '#D4AF37';
                            return (
                                <Area
                                    key={metric}
                                    type="monotone"
                                    dataKey={metric}
                                    name={labels[metric]}
                                    stroke={color}
                                    strokeWidth={2}
                                    fill={`url(#gradient-unlearn-${metric})`}
                                />
                            );
                        })}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}

// ============================================
// NEW: Progress Timeline (from DesktopDigitalTwin)
// ============================================

interface ProgressTimelineProps {
    milestones: TimelineMilestone[];
    currentWeek: number | null;
    language: string;
}

function ProgressTimeline({ milestones, currentWeek, language }: ProgressTimelineProps) {
    const progressPercent = Math.min(((currentWeek || 0) / 15) * 100, 100);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6"
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-white font-semibold">
                    {language === 'en' ? 'Progress Timeline' : '进度时间线'}
                </h3>
            </div>

            {/* Progress Bar */}
            <div className="relative mb-8">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-2 bg-gradient-to-r from-[#D4AF37] to-emerald-500 rounded-full"
                    />
                </div>

                {/* Milestone Dots */}
                <div className="absolute top-0 left-0 right-0 flex justify-between" style={{ marginTop: '-3px' }}>
                    {milestones.map((milestone) => (
                        <motion.div
                            key={milestone.week}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: milestone.week * 0.05 }}
                            className={`w-4 h-4 rounded-full flex items-center justify-center z-10 ${milestone.status === 'completed' ? 'bg-emerald-500' :
                                milestone.status === 'current' ? 'bg-[#D4AF37] ring-4 ring-[#D4AF37]/30' :
                                    'bg-white/20'
                                }`}
                        >
                            {milestone.status === 'completed' && (
                                <CheckCircle className="w-2.5 h-2.5 text-white" />
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Milestone Labels */}
            <div className="flex justify-between text-xs text-white/50 mb-6">
                {milestones.map((milestone) => (
                    <div key={milestone.week} className="text-center" style={{ width: '60px' }}>
                        <p className="font-medium">{language === 'en' ? `W${milestone.week}` : `${milestone.week}周`}</p>
                    </div>
                ))}
            </div>

            {/* Current Milestone Info */}
            {milestones.find(m => m.status === 'current') && (() => {
                const currentMilestone = milestones.find(m => m.status === 'current')!;
                // Translate milestone if we have a translation
                const translations: Record<string, { event: { en: string; cn: string }; detail: { en: string; cn: string } }> = {
                    'Week-0 baseline': {
                        event: { en: 'Week 0 - Baseline Assessment', cn: '第0周 - 基线评估' },
                        detail: { en: 'Initial measurements and calibration', cn: '初始测量和校准' },
                    },
                    'Week-3 review': {
                        event: { en: 'Week 3 - Early Review', cn: '第3周 - 早期评估' },
                        detail: { en: 'Recalibrate based on 14-day trend', cn: '基于14天趋势重新校准' },
                    },
                    'Week-6 midpoint': {
                        event: { en: 'Week 6 - Midpoint Check', cn: '第6周 - 中期检查' },
                        detail: { en: 'Assess progress and adjust intervention', cn: '评估进展并调整干预' },
                    },
                    'Week-9 milestone': {
                        event: { en: 'Week 9 - Progress Milestone', cn: '第9周 - 进度里程碑' },
                        detail: { en: 'Review treatment response', cn: '审查治疗反应' },
                    },
                    'Week-12 evaluation': {
                        event: { en: 'Week 12 - Comprehensive Evaluation', cn: '第12周 - 综合评估' },
                        detail: { en: 'Full reassessment of all metrics', cn: '所有指标全面重新评估' },
                    },
                    'Week-15 completion': {
                        event: { en: 'Week 15 - Program Completion', cn: '第15周 - 项目完成' },
                        detail: { en: 'Final assessment and next steps', cn: '最终评估和后续步骤' },
                    },
                };
                const eventKey = currentMilestone.event || '';
                const translation = translations[eventKey];
                const displayEvent = translation
                    ? (language === 'en' ? translation.event.en : translation.event.cn)
                    : currentMilestone.event;
                const displayDetail = translation
                    ? (language === 'en' ? translation.detail.en : translation.detail.cn)
                    : currentMilestone.detail;

                return (
                    <div className="p-4 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                        <p className="text-[#D4AF37] font-medium">
                            {displayEvent}
                        </p>
                        <p className="text-white/60 text-sm mt-1">
                            {displayDetail}
                        </p>
                    </div>
                );
            })()}
        </motion.div>
    );
}

// ============================================
// NEW: Data Quality Banner
// ============================================

interface DataQualityBannerProps {
    curveData: DigitalTwinCurveOutput;
    language: string;
}

function DataQualityBanner({ curveData, language }: DataQualityBannerProps) {
    const { isGood, warnings } = getDataQualityStatus(curveData);

    if (isGood) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-6"
        >
            <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="font-medium text-amber-300">
                        {language === 'en' ? 'Data Quality Notice' : '数据质量提示'}
                    </p>
                    <ul className="text-sm text-amber-200/70 mt-1 space-y-0.5">
                        {warnings.slice(0, 3).map((w, i) => (
                            <li key={i}>• {w}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================
// NEW: Methodology Section
// ============================================

const METHODOLOGY_DATA = {
    dataSource: {
        en: [
            { metric: 'Anxiety Score', source: 'GAD-7 Scale + Daily Stress Calibration', realData: true, formula: '(GAD-7/21)×100' },
            { metric: 'Sleep Quality', source: 'ISI Scale + Daily Sleep Rating', realData: true, formula: '70%×Scale + 30%×Daily' },
            { metric: 'Mood Stability', source: 'PHQ-9 Scale + Daily Mood', realData: true, formula: '100-(PHQ-9/27)×100' },
            { metric: 'Stress Resilience', source: 'PSS-10 Scale + Daily Stress', realData: true, formula: '100-(PSS-10/40)×100' },
            { metric: 'Energy Level', source: 'Daily Energy Calibration', realData: true, formula: 'Daily Avg × 10' },
            { metric: 'HRV Index', source: '⚠️ Inferred (No Wearable)', realData: false, formula: '0.3×Sleep + 0.3×(100-Anxiety) + 0.4×Energy' },
        ],
        cn: [
            { metric: '焦虑评分', source: 'GAD-7量表 + 每日压力校准', realData: true, formula: '(GAD-7/21)×100' },
            { metric: '睡眠质量', source: 'ISI量表 + 每日睡眠评分', realData: true, formula: '70%×量表分 + 30%×日均评分' },
            { metric: '情绪稳定', source: 'PHQ-9量表 + 每日心情', realData: true, formula: '100-(PHQ-9/27)×100' },
            { metric: '抗压韧性', source: 'PSS-10量表 + 每日压力', realData: true, formula: '100-(PSS-10/40)×100' },
            { metric: '能量水平', source: '每日能量校准', realData: true, formula: '日均能量×10' },
            { metric: 'HRV指数', source: '⚠️ 推断值（无可穿戴设备）', realData: false, formula: '0.3×睡眠 + 0.3×(100-焦虑) + 0.4×能量' },
        ],
    },
    predictionModel: {
        en: {
            name: 'Exponential Decay Recovery Model',
            formula: 'y(t) = Target + (Current - Target) × e^(-k×t)',
            description: 'Simulates gradual psychological recovery process',
        },
        cn: {
            name: '指数衰减恢复模型',
            formula: 'y(t) = 目标值 + (当前值 - 目标值) × e^(-k×t)',
            description: '模拟心理干预的渐进恢复过程',
        },
    },
};

interface MethodologySectionProps {
    language: string;
}

function MethodologySection({ language }: MethodologySectionProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-sm border border-[#D4AF37]/20 rounded-lg overflow-hidden"
        >
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-[#D4AF37]" />
                    <span className="text-white font-medium">
                        {language === 'en' ? 'Methodology & Scientific Basis' : '计算方法 & 科学依据'}
                    </span>
                </div>
                <ChevronDown className={`w-5 h-5 text-white/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 space-y-4"
                    >
                        {/* Data Sources */}
                        <div>
                            <h4 className="text-white/80 font-medium mb-2">📊 {language === 'en' ? 'Data Sources' : '数据来源'}</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-white/50">
                                            <th className="pb-2">{language === 'en' ? 'Metric' : '指标'}</th>
                                            <th className="pb-2">{language === 'en' ? 'Source' : '来源'}</th>
                                            <th className="pb-2">{language === 'en' ? 'Formula' : '公式'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {(language === 'en' ? METHODOLOGY_DATA.dataSource.en : METHODOLOGY_DATA.dataSource.cn).map((item) => (
                                            <tr key={item.metric} className={item.realData ? '' : 'bg-amber-500/5'}>
                                                <td className="py-2 text-white">
                                                    {item.metric}
                                                    {!item.realData && <span className="ml-1 text-xs text-amber-400">⚠️</span>}
                                                </td>
                                                <td className="py-2 text-white/70">{item.source}</td>
                                                <td className="py-2 font-mono text-xs text-white/50">{item.formula}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Prediction Model */}
                        <div className="p-3 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                            <p className="text-[#D4AF37] font-medium mb-2">📈 {language === 'en' ? METHODOLOGY_DATA.predictionModel.en.name : METHODOLOGY_DATA.predictionModel.cn.name}</p>
                            <p className="font-mono text-sm text-white/80 bg-black/20 p-2 rounded">{language === 'en' ? METHODOLOGY_DATA.predictionModel.en.formula : METHODOLOGY_DATA.predictionModel.cn.formula}</p>
                            <p className="text-white/60 text-sm mt-2">{language === 'en' ? METHODOLOGY_DATA.predictionModel.en.description : METHODOLOGY_DATA.predictionModel.cn.description}</p>
                        </div>

                        {/* Disclaimer */}
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <p className="text-sm text-amber-200">
                                ⚠️ {language === 'en'
                                    ? 'All predictions are statistical models for reference only. HRV index is inferred (requires wearable device for real data).'
                                    : '所有预测基于统计模型，仅供参考。HRV指数为推断值（需接入可穿戴设备获取真实数据）。'}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

