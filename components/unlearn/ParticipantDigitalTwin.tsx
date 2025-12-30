'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Settings, ChevronLeft, ChevronRight, TrendingUp, Clock, Database, BarChart3, RefreshCw, AlertCircle, Loader2, X, Bell, Shield, Zap, LogIn } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useDashboard } from '@/hooks/domain/useDashboard';
import { useAuth } from '@/hooks/domain/useAuth';
import type { DashboardData, AdaptivePlan, DataCollectionStatus, TreatmentMilestone } from '@/types/digital-twin';

// ============================================
// Types
// ============================================

type ViewType = 'prediction' | 'timeline' | 'baseline' | 'endpoints';

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
                {language === 'en' ? 'Building Your Digital Twin' : '正在构建你的数字孪生'}
            </h3>
            <p className="text-white/60 text-sm text-center mb-6 max-w-md">
                {status.message}
            </p>

            {/* Progress Bar */}
            <div className="w-full max-w-xs mb-4">
                <div className="flex justify-between text-xs text-white/50 mb-2">
                    <span>{language === 'en' ? 'Progress' : '进度'}</span>
                    <span>{status.progress}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${status.progress}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-[#D4AF37] to-[#B8960C]"
                    />
                </div>
            </div>

            {/* Collection Details */}
            <div className="grid grid-cols-2 gap-4 text-center mt-4">
                <div className="p-3 bg-white/5 rounded">
                    <div className="text-[#D4AF37] font-bold">{status.calibrationCount}/{status.requiredCalibrations}</div>
                    <div className="text-white/50 text-xs">{language === 'en' ? 'Daily Check-ins' : '每日校准'}</div>
                </div>
                <div className="p-3 bg-white/5 rounded">
                    <div className={`font-bold ${status.hasBaseline ? 'text-green-400' : 'text-white/50'}`}>
                        {status.hasBaseline ? '✓' : '—'}
                    </div>
                    <div className="text-white/50 text-xs">{language === 'en' ? 'Baseline Assessment' : '基线评估'}</div>
                </div>
            </div>

            <div className="mt-4 text-xs text-white/50">
                <span>
                    {language === 'en' ? `Collected ${calibrationDays} days` : `已记录 ${calibrationDays} 天`}
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
    // Use Domain Hook (The Bridge)
    const {
        digitalTwin,
        loadingDigitalTwin,
        loadDigitalTwin,
        isOffline,
        error: dashboardError
    } = useDashboard();

    // Auth check using useAuth
    const { isAuthenticated } = useAuth();

    // Local UI state
    const [timeOffset, setTimeOffset] = useState(0);
    const [activeView, setActiveView] = useState<ViewType>('prediction');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [medicalConsent, setMedicalConsent] = useState(false);
    const [analysisFrequency, setAnalysisFrequency] = useState<'auto' | 'daily' | 'weekly'>('auto');
    const [notifications, setNotifications] = useState(true);

    // Toast for no data hint - with position
    const [hintPosition, setHintPosition] = useState<{ x: number; y: number } | null>(null);

    // Load data on mount
    useEffect(() => {
        loadDigitalTwin();
    }, [loadDigitalTwin]);

    // Listen for calibration to refresh
    useEffect(() => {
        const handleCalibration = () => {
            loadDigitalTwin();
        };
        window.addEventListener('daily-calibration:completed', handleCalibration);
        return () => {
            window.removeEventListener('daily-calibration:completed', handleCalibration);
        };
    }, [loadDigitalTwin]);

    // Derive state from digitalTwin data
    // TypeScript safe casting or checks
    const dt = digitalTwin as any;
    const dashboardData: DashboardData | null = dt?.dashboardData || null;
    const collectionStatus: DataCollectionStatus | null = dt?.collectionStatus || (dt?.status === 'collecting_data' ? dt : null);
    const needsAnalysis = dt?.status === 'no_analysis';
    const isStale = dt?.isStale || false;
    const loading = loadingDigitalTwin;
    const error = dashboardError;
    const notLoggedIn = !isAuthenticated;

    // Trigger analysis
    const triggerAnalysis = useCallback(async () => {
        setIsAnalyzing(true);

        try {
            const response = await fetch('/api/digital-twin/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ forceRefresh: true }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Analysis failed');
            }

            // Refresh dashboard after analysis
            await loadDigitalTwin();
        } catch (err) {
            console.error(err);
        } finally {
            setIsAnalyzing(false);
        }
    }, [loadDigitalTwin]);



    // View options
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

    const maxOffset = timeLabels.length - 2;

    // Extract data from dashboard
    const participant = dashboardData?.participant;
    const metrics = dashboardData?.predictionTable?.metrics || [];
    const timeline = dashboardData?.timeline || [];
    const baselineAssessments = dashboardData?.baselineData?.assessments || [];
    const baselineVitals = dashboardData?.baselineData?.vitals || [];
    const charts = dashboardData?.charts;
    const summaryStats = dashboardData?.summaryStats;

    const initials = participant?.initials || 'U';

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
                                        if (!dashboardData) {
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
                                        } ${!dashboardData ? 'opacity-70' : ''}`}
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
                        {dashboardData && (
                            <button
                                onClick={triggerAnalysis}
                                disabled={isAnalyzing}
                                className="flex items-center gap-2 text-sm text-white/60 hover:text-[#D4AF37] transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                                {isStale
                                    ? (language === 'en' ? 'Update available' : '有更新可用')
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
                            <ErrorState message={error} onRetry={() => loadDigitalTwin()} language={language} />
                        ) : collectionStatus ? (
                            <DataCollectionState status={collectionStatus} language={language} />
                        ) : needsAnalysis ? (
                            <NoAnalysisState
                                onTriggerAnalysis={triggerAnalysis}
                                isAnalyzing={isAnalyzing}
                                language={language}
                            />
                        ) : dashboardData ? (
                            <AnimatePresence mode="wait">
                                {activeView === 'prediction' && (
                                    <PredictionView
                                        participant={participant!}
                                        metrics={metrics}
                                        timeLabels={timeLabels}
                                        timeOffset={timeOffset}
                                        setTimeOffset={setTimeOffset}
                                        maxOffset={maxOffset}
                                        initials={initials}
                                        language={language}
                                    />
                                )}

                                {activeView === 'timeline' && (
                                    <TimelineView timeline={timeline} language={language} />
                                )}

                                {activeView === 'baseline' && (
                                    <BaselineView
                                        assessments={baselineAssessments}
                                        vitals={baselineVitals}
                                        language={language}
                                    />
                                )}

                                {activeView === 'endpoints' && (
                                    <EndpointsView
                                        charts={charts}
                                        summaryStats={summaryStats}
                                        language={language}
                                    />
                                )}
                            </AnimatePresence>
                        ) : null}
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
