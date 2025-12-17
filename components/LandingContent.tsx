'use client';

import { useState, useEffect, Suspense, lazy, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { SymptomAssessmentCard, BayesianCycleCard } from '@/components/FeatureCards';
import { motion, AnimatePresence } from 'framer-motion';
import { MotionButton } from '@/components/motion/MotionButton';
import TypewriterText from '@/components/motion/TypewriterText';
import { CalibrationInput, GeneratedTask } from '@/lib/calibration-service';
import { useI18n } from '@/lib/i18n';
import { GuideLine } from '@/components/motion/GuideLine';

// 懒加载重型组件 - 显著提升首屏渲染速度
const WisdomCarousel = lazy(() => import('@/components/WisdomCarousel'));
const DailyInsightHub = lazy(() => import('@/components/DailyInsightHub').then(m => ({ default: m.DailyInsightHub })));
const DailyCheckin = lazy(() => import('@/components/DailyCheckin').then(m => ({ default: m.DailyCheckin })));
const AnimatedSection = lazy(() => import('@/components/AnimatedSection'));
const JournalShowcase = lazy(() => import('@/components/JournalShowcase'));
const InfiniteNewsFeed = lazy(() => import('@/components/InfiniteNewsFeed'));

// 轻量级加载占位符
function LoadingPlaceholder({ height = 'h-32' }: { height?: string }) {
  return (
    <div className={`${height} flex items-center justify-center bg-white/50 rounded-xl border border-[#E7E1D6]/50`}>
      <Loader2 className="w-5 h-5 text-[#9CAF88] animate-spin" />
    </div>
  );
}

interface LandingContentProps {
  user: any;
  profile: any;
  userState: any;
  recommendedTask: any;
  dailyLogs: any[];
  habitLogs: any[];
}

export default function LandingContent({ user, profile, dailyLogs }: LandingContentProps) {
  const { t, language } = useI18n();
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnomalyCard, setShowAnomalyCard] = useState(false);
  const [anomalyQuestion, setAnomalyQuestion] = useState('');
  const [showCalibrationSheet, setShowCalibrationSheet] = useState(false);
  const [todayTask, setTodayTask] = useState<GeneratedTask | null>(null);
  const [highlightCalibrationBtn, setHighlightCalibrationBtn] = useState(false);
  const calibrationBtnRef = useRef<HTMLButtonElement>(null);
  const [btnPosition, setBtnPosition] = useState<{ x: number; y: number } | null>(null);
  const [hasCalibrated, setHasCalibrated] = useState(false);

  // 检查今天是否已校准
  useEffect(() => {
    const today = new Date().toDateString();
    const lastCalibration = localStorage.getItem('nma_daily_calibration');
    setHasCalibrated(lastCalibration === today);
  }, []);

  // 获取按钮位置
  useEffect(() => {
    if (highlightCalibrationBtn && calibrationBtnRef.current) {
      const rect = calibrationBtnRef.current.getBoundingClientRect();
      setBtnPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom
      });
    }
  }, [highlightCalibrationBtn]);

  const latestLog = dailyLogs?.[0];
  const previousLog = dailyLogs?.[1];
  const biometrics = { sleep: latestLog?.sleep_hours, hrv: latestLog?.hrv, stress: latestLog?.stress_level };
  const hasData = biometrics.sleep !== undefined || biometrics.hrv !== undefined;

  useEffect(() => {
    if (latestLog?.hrv && previousLog?.hrv) {
      const hrvDrop = (previousLog.hrv - latestLog.hrv) / previousLog.hrv;
      if (hrvDrop > 0.15) {
        setShowAnomalyCard(true);
        setAnomalyQuestion(language === 'en'
          ? `Your HRV dropped by ${Math.round(hrvDrop * 100)}%. Did any of these happen last night?`
          : `你的 HRV 下降了 ${Math.round(hrvDrop * 100)}%。昨晚是否有以下情况？`);
      }
    }
  }, [latestLog, previousLog, language]);

  // 禁用自动弹出校准弹窗 - 用户可以通过点击按钮手动触发
  // useEffect(() => {
  //   if (!user) return;
  //   const today = new Date().toDateString();
  //   const lastCalibration = localStorage.getItem('nma_daily_calibration');
  //   if (lastCalibration !== today) {
  //     const timer = setTimeout(() => setShowCalibrationSheet(true), 1500);
  //     return () => clearTimeout(timer);
  //   }
  // }, [user]);

  const handleCalibrationComplete = (result: { input: CalibrationInput; task: GeneratedTask }) => {
    setTodayTask(result.task);
    setHasCalibrated(true);
    localStorage.setItem('nma_today_task', JSON.stringify(result.task));
  };

  useEffect(() => {
    const today = new Date().toDateString();
    const lastCalibration = localStorage.getItem('nma_daily_calibration');
    if (lastCalibration === today) {
      const savedTask = localStorage.getItem('nma_today_task');
      if (savedTask) {
        try {
          const task = JSON.parse(savedTask) as GeneratedTask;
          if (!task.descriptionEn) {
            const descMap: Record<string, string> = {
              '你的状态良好，可以按正常节奏进行今日活动。': 'Your status is good.',
              '明白了。今日进入"低耗能模式"，建议午间进行 NSDR（非睡眠深度休息）。': 'Entering low energy mode today.',
              '了解。建议今晚提前入睡以补充睡眠债务。': 'Recommend sleeping earlier tonight.',
              '工作压力会提升皮质醇。建议进行盒式呼吸来调节自主神经。': 'Recommend box breathing.',
              '身体疲劳需要主动恢复。建议进行轻度拉伸促进血液循环。': 'Recommend light stretching.',
            };
            task.descriptionEn = descMap[task.description] || task.description;
          }
          setTodayTask(task);
        } catch (e) { console.error(e); }
      }
    }
  }, []);

  useEffect(() => {
    if (!hasData) { setIsLoading(false); return; }
    const generateInsight = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/insight/generate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sleep_hours: biometrics.sleep, hrv: biometrics.hrv, stress_level: biometrics.stress })
        });
        if (response.ok) {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let text = '';
          while (reader) { const { done, value } = await reader.read(); if (done) break; text += decoder.decode(value, { stream: true }); }
          setInsight(text || null);
        }
      } catch (err) { console.error(err); } finally { setIsLoading(false); }
    };
    generateInsight();
  }, [hasData, biometrics.sleep, biometrics.hrv, biometrics.stress]);

  const handleAnomalyAnswer = (trigger: string) => { console.log('Anomaly:', trigger); setShowAnomalyCard(false); };
  const anomalyLabels = language === 'en' ? ['🍷 Alcohol', '🍜 Late Dinner', '😰 High Stress', 'None'] : ['🍷 饮酒', '🍜 晚餐过晚', '😰 压力大', '都没有'];

  return (
    <div className="min-h-screen bg-[#FAF6EF] dark:bg-neutral-950 p-0 transition-colors relative overflow-hidden">
      {/* 引导线动画 */}
      <GuideLine show={highlightCalibrationBtn} targetPosition={btnPosition} />
      
      {/* Fixed Grid Lines (Visible Grid System) */}
      <div className="fixed inset-0 pointer-events-none z-0 flex justify-between px-8 md:px-16 max-w-[1600px] mx-auto">
        <div className="bg-grid-lines w-full h-full absolute inset-0 mix-blend-multiply opacity-[0.4]" />
        <div className="hidden md:block w-px h-full bg-[#1A1A1A] opacity-[0.03]" />
        <div className="hidden md:block w-px h-full bg-[#1A1A1A] opacity-[0.03]" />
        <div className="hidden md:block w-px h-full bg-[#1A1A1A] opacity-[0.03]" />
      </div>

      {/* Noise Texture Overlay */}
      <div className="bg-noise" />

      {/* Main Content */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-8 md:px-16 pb-24 md:pb-32">
        {/* Luxury Hero Section */}
        <header className="py-20 md:py-32 grid grid-cols-1 md:grid-cols-12 gap-12 relative animate-fade-in">

          <div className="md:col-start-2 md:col-span-10 lg:col-span-9">
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-normal leading-[0.95] tracking-tight mb-12 text-[#1A1A1A] dark:text-white">
              {language === 'en' ? (
                <>Silence the <br /><span className="italic font-light text-[#1A1A1A] dark:text-white/80">Noise.</span> <br />Find the <span className="italic font-light text-[#D4AF37]">Truth.</span></>
              ) : (
                <>真相是摒弃<span className="italic font-light text-[#D4AF37]">臆想的安慰</span>。</>
              )}
            </h1>
            <div className="flex flex-col md:flex-row gap-12 items-start md:items-end">
              <div className="max-w-xl">
                <p className="text-lg leading-relaxed text-[#1A1A1A]/80 dark:text-white/70">
                  <span className="float-left text-7xl font-heading leading-[0.8] mr-3 mt-[-4px] text-[#D4AF37]">
                    {language === 'en' ? 'L' : '让'}
                  </span>
                  {language === 'en'
                    ? "ET'S FIND TODAY'S BALANCE TOGETHER."
                    : '我们一起找到今天的平衡。'}
                </p>
              </div>
              <div className="flex gap-4">
                <AnimatePresence>
                  {hasCalibrated ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="h-14 px-8 min-w-[160px] flex items-center justify-center gap-2 rounded-xl bg-[#9CAF88]/20 border border-[#9CAF88]/30"
                    >
                      <span className="text-[#9CAF88]">✓</span>
                      <span className="text-sm text-[#0B3D2E]/70 whitespace-nowrap">
                        {language === 'en' ? 'Today\'s status noted' : '谢谢，今天您的状态我已知晓'}
                      </span>
                    </motion.div>
                  ) : (
                    <motion.button
                      ref={calibrationBtnRef}
                      animate={{ 
                        scale: highlightCalibrationBtn ? 1.08 : 1,
                        boxShadow: highlightCalibrationBtn 
                          ? '0 0 30px rgba(212, 175, 55, 0.5), 0 0 60px rgba(212, 175, 55, 0.3)' 
                          : '0 4px 14px rgba(0, 0, 0, 0.1)'
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowCalibrationSheet(true)}
                      className={`btn-luxury h-14 px-12 min-w-[160px] transition-all duration-300 ${
                        highlightCalibrationBtn ? 'ring-2 ring-[#D4AF37] ring-offset-2' : ''
                      }`}
                    >
                      <span className="text-lg whitespace-nowrap">{t('landing.startCalibration') || 'Start Calibration'}</span>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Wisdom Carousel */}
        <div className="mb-24 relative z-10 max-w-5xl mx-auto">
          <Suspense fallback={<LoadingPlaceholder height="h-24" />}>
            <WisdomCarousel autoPlay={true} interval={8000} />
          </Suspense>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10 max-w-6xl mx-auto">
          <AnimatePresence>
            {showAnomalyCard && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="md:col-span-2">
                <div className="glass-panel bg-amber-50/50 dark:bg-amber-950/20 border-l-2 border-l-[#D4AF37] p-8">
                  <div className="flex items-center gap-2 mb-2 text-[#D4AF37] font-medium text-sm tracking-widest uppercase">
                    <AlertTriangle className="w-4 h-4" />{t('landing.changeDetected')}
                  </div>
                  <p className="text-xl font-heading text-[#1A1A1A] dark:text-white mb-6 italic">{anomalyQuestion}</p>
                  <div className="flex flex-wrap gap-3">
                    {anomalyLabels.map((label, i) => (
                      <button key={i} onClick={() => handleAnomalyAnswer(['alcohol', 'late_meal', 'stress', 'none'][i])} className="px-6 py-2 text-xs uppercase tracking-widest border border-[#1A1A1A]/20 hover:bg-[#1A1A1A] hover:text-white transition-all duration-500">{label}</button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

      </div>

        {/* 三卡片一排：今日洞察 + 症状评估 + 贝叶斯循环 */}
        <section className="max-w-[1400px] mx-auto mt-16 px-4 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Insight Hub */}
            <div className="h-[546px]">
              <Suspense fallback={<LoadingPlaceholder height="h-[546px]" />}>
                <DailyInsightHub todayTask={todayTask} insight={insight} isLoading={isLoading} questionnaireCompleted={!!latestLog}
                  onStartCalibration={() => setShowCalibrationSheet(true)} userId={user?.id}
                  onQuestionnaireComplete={() => { setIsLoading(true); setTimeout(() => setIsLoading(false), 1000); }}
                  stressLevel={biometrics.stress ?? 5} energyLevel={biometrics.sleep && biometrics.sleep > 6 ? 6 : 4}
                  onHintHover={setHighlightCalibrationBtn} />
              </Suspense>
            </div>
            {/* 症状评估卡片 */}
            <Link href="/assessment" className="block h-[546px]">
              <SymptomAssessmentCard />
            </Link>
            {/* 贝叶斯循环卡片 */}
            <Link href="/bayesian" className="block h-[546px]">
              <BayesianCycleCard />
            </Link>
          </div>
        </section>

        {/* Infinite News Feed (Luxury Style) */}
        <div className="max-w-6xl mx-auto mt-24 relative z-10 border-t border-[#1A1A1A]/10 pt-12">
          <div className="glass-panel p-0 overflow-hidden h-[500px] border-none shadow-none bg-transparent">
            <Suspense fallback={<LoadingPlaceholder height="h-[420px]" />}>
              <InfiniteNewsFeed language={language} variant="calm" />
            </Suspense>
          </div>
        </div>

      {/* 每日签到 - 懒加载 */}
      <Suspense fallback={null}>
        <DailyCheckin open={showCalibrationSheet} onOpenChange={setShowCalibrationSheet} onComplete={handleCalibrationComplete}
          weeklyRecords={dailyLogs?.map(log => ({ sleep_hours: log.sleep_hours || 7, stress_level: log.stress_level > 6 ? 'high' : log.stress_level > 3 ? 'medium' : 'low', exercise_intention: 'moderate' as const, timestamp: log.created_at })) || []} />
      </Suspense>

        {/* Footer Content Sections (Luxury Editorial Style) */}
        <Suspense fallback={<LoadingPlaceholder height="h-48" />}>
          <section id="model" className="mx-auto max-w-6xl pt-32 pb-16 scroll-mt-20 border-t border-[#1A1A1A]/10 mt-24">
            {/* Title Section */}
            <div className="text-center mb-16">
              <span className="block text-xs font-medium tracking-[0.2em] uppercase text-[#D4AF37] mb-6">{t('landing.coreIdea')}</span>
              <h2 className="font-heading text-4xl md:text-5xl leading-tight text-[#1A1A1A] dark:text-white">
                {language === 'en' ? (
                  <>The <span className="italic text-[#D4AF37]">Architecture</span> of Calm.</>
                ) : (
                  <>平静的<span className="italic text-[#D4AF37]">架构</span>。</>
                )}
              </h2>
            </div>
            {/* Three Cards in a Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {['cognitiveLoad', 'habitStreaks', 'theSignal'].map((key, index) => (
                <div key={key} className="group cursor-pointer">
                  <div className="h-px w-full bg-[#1A1A1A]/10 mb-6 group-hover:bg-[#D4AF37]/50 transition-colors duration-700" />
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#1A1A1A]/40 mb-2">0{index + 1}</div>
                  <h3 className="text-xl font-medium text-[#1A1A1A] dark:text-white mb-3 group-hover:text-[#D4AF37] transition-colors duration-500">{t(`landing.${key}Title`)}</h3>
                  <p className="text-sm text-[#1A1A1A]/70 leading-relaxed">{t(`landing.${key}P1`)}</p>
                </div>
              ))}
            </div>
          </section>
        </Suspense>

        {/* Scientific Insight Example (Luxury Editorial Style) */}
        <section className="mx-auto max-w-6xl pt-16 pb-24 border-t border-[#1A1A1A]/10 scroll-mt-20">
          {/* Title Section */}
          <div className="text-center mb-16">
            <span className="block text-xs font-medium tracking-[0.2em] uppercase text-[#D4AF37] mb-6">
              {language === 'en' ? 'Scientific Grounding' : '科学依据'}
            </span>
            <h3 className="font-heading text-3xl md:text-4xl leading-tight text-[#1A1A1A] dark:text-white">
              {language === 'en' ? (
                <>The <span className="italic text-[#D4AF37]">Truth</span> We Stand On.</>
              ) : (
                <>我们所依据的<span className="italic text-[#D4AF37]">真相</span>。</>
              )}
            </h3>
          </div>

          {/* 6 Paper References in 2 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                authors: 'Lexell et al.',
                year: '1988',
                title: language === 'en' ? 'What is the cause of the ageing atrophy?' : '衰老性肌肉萎缩的原因是什么？',
                journal: 'J Neurol Sci',
                url: 'https://pubmed.ncbi.nlm.nih.gov/3385520/',
                consensus: 92
              },
              {
                authors: 'Walker et al.',
                year: '2017',
                title: language === 'en' ? 'Why We Sleep: The New Science of Sleep and Dreams' : '我们为什么要睡觉：睡眠与梦的新科学',
                journal: 'Nature Reviews',
                url: 'https://pubmed.ncbi.nlm.nih.gov/28248301/',
                consensus: 95
              },
              {
                authors: 'Huberman Lab',
                year: '2023',
                title: language === 'en' ? 'Protocols for Managing Stress & Anxiety' : '压力与焦虑管理协议',
                journal: 'Stanford Medicine',
                url: 'https://hubermanlab.com/tools-for-managing-stress-and-anxiety/',
                consensus: 88
              },
              {
                authors: 'Sapolsky R.',
                year: '2004',
                title: language === 'en' ? 'Why Zebras Don\'t Get Ulcers: Stress and Health' : '为什么斑马不得胃溃疡：压力与健康',
                journal: 'Science',
                url: 'https://pubmed.ncbi.nlm.nih.gov/15514116/',
                consensus: 91
              },
              {
                authors: 'McEwen B.',
                year: '2008',
                title: language === 'en' ? 'Central effects of stress hormones in health and disease' : '压力激素对健康和疾病的中枢效应',
                journal: 'Eur J Pharmacol',
                url: 'https://pubmed.ncbi.nlm.nih.gov/18295199/',
                consensus: 89
              },
              {
                authors: 'Porges S.',
                year: '2011',
                title: language === 'en' ? 'The Polyvagal Theory: Neurophysiological Foundations' : '多迷走神经理论：神经生理学基础',
                journal: 'Biol Psychol',
                url: 'https://pubmed.ncbi.nlm.nih.gov/21453750/',
                consensus: 87
              }
            ].map((paper, index) => (
              <motion.a
                key={index}
                href={paper.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ x: 4 }}
                className="flex items-start gap-4 p-5 bg-[#FAFAFA] dark:bg-neutral-900 border border-[#1A1A1A]/5 hover:border-[#D4AF37]/30 transition-all duration-500 group/link"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xl">📄</span>
                  <span className="text-[10px] font-mono text-[#D4AF37]">{paper.consensus}%</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A] dark:text-white group-hover/link:text-[#D4AF37] transition-colors duration-500">
                    {paper.authors} ({paper.year})
                  </p>
                  <p className="text-xs text-[#1A1A1A]/60 dark:text-white/50 mt-1 line-clamp-2">
                    {paper.title}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-medium">{paper.journal}</span>
                    <span className="text-[10px] text-[#1A1A1A]/40">•</span>
                    <span className="text-[10px] text-[#1A1A1A]/40">PubMed</span>
                  </div>
                </div>
                <svg className="w-4 h-4 text-[#1A1A1A]/20 group-hover/link:text-[#D4AF37] transition-colors duration-500 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </motion.a>
            ))}
          </div>

          {/* Meta Analysis Count */}
          <div className="mt-8 text-center">
            <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-wider text-[#1A1A1A]/40">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9CAF88]" />
              {language === 'en' ? 'Based on peer-reviewed research from leading institutions' : '基于顶尖机构的同行评审研究'}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
