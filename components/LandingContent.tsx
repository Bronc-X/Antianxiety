'use client';

import { useState, useEffect, Suspense, lazy } from 'react';
import Link from 'next/link';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { SymptomAssessmentCard, BayesianCycleCard, DailyCalibrationCard } from '@/components/FeatureCards';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useI18n } from '@/lib/i18n';


// 懒加载重型组件 - 显著提升首屏渲染速度
const WisdomCarousel = lazy(() => import('@/components/WisdomCarousel'));
const InfiniteNewsFeed = lazy(() => import('@/components/InfiniteNewsFeed'));
const ActiveInquiryBanner = lazy(() => import('@/components/ActiveInquiryBanner'));
const NewUserGuide = lazy(() => import('@/components/NewUserGuide'));
const DigitalTwinCards = lazy(() => import('@/components/DigitalTwinCards'));


// 轻量级加载占位符
function LoadingPlaceholder({ height = 'h-32' }: { height?: string }) {
  return (
    <div className={`${height} flex items-center justify-center bg-white/50 rounded-xl border border-[#E7E1D6]/50`}>
      <Loader2 className="w-5 h-5 text-[#9CAF88] animate-spin" />
    </div>
  );
}

interface LandingUser {
  id?: string | null;
}

interface DailyLog {
  sleep_duration_minutes?: number | string | null;
  sleep_hours?: number | string | null;
  hrv?: number | string | null;
  stress_level?: number | string | null;
}

interface LandingContentProps {
  user: LandingUser | null;
  profile?: Record<string, unknown> | null;
  userState?: Record<string, unknown> | null;
  recommendedTask?: Record<string, unknown> | null;
  dailyLogs: DailyLog[];
  habitLogs?: Array<Record<string, unknown>>;
}

export default function LandingContent({ user, dailyLogs }: LandingContentProps) {
  const { t, language } = useI18n();
  const [showAnomalyCard, setShowAnomalyCard] = useState(false);
  const [showInquiry, setShowInquiry] = useState(true);
  const [anomalyQuestion, setAnomalyQuestion] = useState('');

  // --- Scroll-Driven Storytelling (Phase 2) ---
  const { scrollY } = useScroll();

  // Hero Text Fade Out & Scale Down
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.95]);
  const heroY = useTransform(scrollY, [0, 300], [0, 50]);

  // Background Parallax
  const gridY = useTransform(scrollY, [0, 500], [0, 100]);

  const latestLog = dailyLogs?.[0];
  const previousLog = dailyLogs?.[1];

  useEffect(() => {
    if (latestLog?.hrv && previousLog?.hrv) {
      const hrvDrop = (previousLog.hrv - latestLog.hrv) / previousLog.hrv;
      if (hrvDrop > 0.15) {
        const timer = setTimeout(() => {
          setShowAnomalyCard(true);
          setAnomalyQuestion(language === 'en'
            ? `Your HRV dropped by ${Math.round(hrvDrop * 100)}%. Did any of these happen last night?`
            : `你的 HRV 下降了 ${Math.round(hrvDrop * 100)}%。昨晚是否有以下情况？`);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [latestLog, previousLog, language]);

  const handleAnomalyAnswer = (trigger: string) => { console.log('Anomaly:', trigger); setShowAnomalyCard(false); };
  const anomalyLabels = language === 'en' ? ['🍷 Alcohol', '🍜 Late Dinner', '😰 High Stress', 'None'] : ['🍷 饮酒', '🍜 晚餐过晚', '😰 压力大', '都没有'];

  return (
    <div className="min-h-screen bg-[#F9F8F6] dark:bg-neutral-950 p-0 transition-colors relative overflow-x-hidden">
      {/* AI 主动问询 Banner - 固定在最上层，独立于其他内容 */}
      {user?.id && showInquiry && (
        <Suspense fallback={null}>
          <ActiveInquiryBanner
            userId={user.id}
            onDismiss={() => setShowInquiry(false)}
            onRespond={(response) => {
              console.log('[AI Inquiry] User response:', response);
              setShowInquiry(false);
            }}
          />
        </Suspense>
      )}

      {/* New User Onboarding Guide - Shows once for first-time users */}
      <Suspense fallback={null}>
        <NewUserGuide userId={user?.id} />
      </Suspense>

      {/* Fixed Grid Lines (Visible Grid System) - Parallax Effect */}
      <motion.div style={{ y: gridY }} className="hidden md:flex fixed inset-0 pointer-events-none z-0 justify-between px-8 md:px-16 max-w-[1600px] mx-auto">
        <div className="bg-grid-lines w-full h-full absolute inset-0 mix-blend-multiply opacity-[0.4]" />
        <div className="hidden md:block w-px h-full bg-[#1A1A1A] opacity-[0.03]" />
        <div className="hidden md:block w-px h-full bg-[#1A1A1A] opacity-[0.03]" />
        <div className="hidden md:block w-px h-full bg-[#1A1A1A] opacity-[0.03]" />
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 md:px-16 pb-24 md:pb-32">
        {/* Luxury Hero Section - Scrollytelling */}
        <motion.header
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="py-20 md:py-32 grid grid-cols-1 md:grid-cols-12 gap-12 relative"
        >
          <div className="md:col-start-2 md:col-span-10 lg:col-span-9">
            <h1 className="font-heading text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-normal leading-[1.1] sm:leading-[0.95] tracking-tight mb-8 sm:mb-12 text-[#1A1A1A] dark:text-white">
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
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      // 滚动到统一校准组件
                      document.getElementById('daily-calibration')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="btn-luxury h-14 px-12 min-w-[160px]"
                  >
                    <span className="text-lg whitespace-nowrap">{t('landing.startCalibration') || 'Start Calibration'}</span>
                  </motion.button>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Wisdom Carousel */}
        <div className="mb-16 relative z-10 max-w-5xl mx-auto">
          <Suspense fallback={<LoadingPlaceholder height="h-24" />}>
            <div className="glass-panel p-1 border-[#1A1A1A]/10 dark:border-white/10">
              <WisdomCarousel autoPlay={true} interval={8000} />
            </div>
          </Suspense>
        </div>

        {/* Digital Twin Entry Cards */}
        {user && (
          <div className="mb-16 relative z-10 max-w-5xl mx-auto">
            <Suspense fallback={<LoadingPlaceholder height="h-32" />}>
              <DigitalTwinCards />
            </Suspense>
          </div>
        )}

        {/* Max AI Introduction Card */}
        <div className="mb-24 relative z-10 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-panel p-8 border-[#1A1A1A]/10 dark:border-white/10 bg-gradient-to-r from-[#9CAF88]/5 to-[#D4AF37]/5"
          >
            <div className="flex items-center gap-6">
              {/* Max Avatar */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#9CAF88] to-[#7a9268] flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-bold text-white">M</span>
                </div>
              </div>

              {/* Max Description */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-[#1A1A1A] dark:text-white mb-2">
                  {language === 'en' ? 'Meet Max, Your AI Health Companion' : '认识 Max，你的 AI 健康助手'}
                </h3>
                <p className="text-sm text-[#1A1A1A]/70 dark:text-white/70 leading-relaxed">
                  {language === 'en'
                    ? 'Max is your personal AI assistant that monitors your health data 24/7. It proactively reaches out when it detects anomalies, providing evidence-based insights and actionable recommendations tailored just for you.'
                    : 'Max 是你的私人 AI 健康助手，全天候监测你的健康数据。当检测到异常时，它会主动与你联系，提供基于循证医学的洞察和量身定制的建议。'}
                </p>
              </div>

              {/* Chat Button */}
              <div className="flex-shrink-0">
                <Link href="/assistant">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-[#0B3D2E] dark:bg-[#9CAF88] text-white dark:text-[#1A1A1A] rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                  >
                    {language === 'en' ? 'Chat with Max' : '开始对话'}
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
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

        {/* Tool Cards (New Mango Style) - 包含每日校准作为第三张卡片 */}
        <section className="max-w-6xl mx-auto mt-24 relative z-20 border-t border-[#1A1A1A]/10 pt-12">
          <div className="mb-12">
            <h3 className="font-heading text-3xl md:text-4xl text-[#1A1A1A] dark:text-white">
              {language === 'en' ? <>Health <span className="italic text-[#D4AF37]">Tools</span></> : <>健康<span className="italic text-[#D4AF37]">工具</span></>}
            </h3>
          </div>
          <div className="flex flex-row gap-4 justify-center items-stretch">
            {/* 每日校准卡片 */}
            <Link href="/daily-calibration" className="block flex-1 min-w-0 h-[400px] max-w-[340px]">
              <DailyCalibrationCard />
            </Link>
            {/* 症状评估卡片 */}
            <Link href="/assessment" className="block flex-1 min-w-0 h-[400px] max-w-[340px]">
              <SymptomAssessmentCard />
            </Link>
            {/* 认知天平卡片 */}
            <Link href="/bayesian" className="block flex-1 min-w-0 h-[400px] max-w-[340px]">
              <BayesianCycleCard />
            </Link>
          </div>
        </section>

        {/* Infinite News Feed (Luxury Style) */}
        <div className="max-w-6xl mx-auto mt-24 relative z-10 border-t border-[#1A1A1A]/10 pt-12">
          <div className="glass-panel p-0 overflow-hidden h-[500px] md:h-[700px] border-none shadow-none bg-transparent">
            <Suspense fallback={<LoadingPlaceholder height="h-[500px] md:h-[600px]" />}>
              <InfiniteNewsFeed language={language} variant="calm" userId={user?.id} />
            </Suspense>
          </div>
        </div>

        {/* 旧的 DailyCheckin 已被 UnifiedDailyCalibration 替代 */}

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
