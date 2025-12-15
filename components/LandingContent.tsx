'use client';

import { useState, useEffect, Suspense, lazy } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Sparkles, AlertTriangle, Activity, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MotionButton } from '@/components/motion/MotionButton';
import { CalibrationInput, GeneratedTask } from '@/lib/calibration-service';
import { useI18n } from '@/lib/i18n';

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

  useEffect(() => {
    if (!user) return;
    const today = new Date().toDateString();
    const lastCalibration = localStorage.getItem('nma_daily_calibration');
    if (lastCalibration !== today) {
      const timer = setTimeout(() => setShowCalibrationSheet(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleCalibrationComplete = (result: { input: CalibrationInput; task: GeneratedTask }) => {
    setTodayTask(result.task);
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
    <div className="min-h-screen bg-[#FAF6EF] dark:bg-neutral-950 p-4 pb-24 md:pb-4 transition-colors">
      <header className="mb-8 pt-4">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="display-text text-4xl md:text-5xl font-black text-[#0a0a0a] dark:text-white tracking-tight">
          {t('landing.hello')}<motion.span className="text-[#9CAF88] dark:text-white cursor-pointer inline-block relative" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
            {profile?.full_name || profile?.username || t('landing.friend')}
            <span className="absolute -top-3 -right-10 px-2.5 py-1 text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-md shadow-md tracking-wider">PRO</span>
          </motion.span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="subtitle text-lg text-gray-600 dark:text-neutral-400 mt-2">
          {t('landing.findBalance')}
        </motion.p>
      </header>

      {/* 金句轮播 - 懒加载 */}
      <div className="max-w-4xl mx-auto mb-4">
        <Suspense fallback={<LoadingPlaceholder height="h-24" />}>
          <WisdomCarousel autoPlay={true} interval={8000} />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        <AnimatePresence>
          {showAnomalyCard && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="md:col-span-2">
              <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />{t('landing.changeDetected')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">{anomalyQuestion}</p>
                  <div className="flex flex-wrap gap-2">
                    {anomalyLabels.map((label, i) => (
                      <MotionButton key={i} variant="outline" size="sm" onClick={() => handleAnomalyAnswer(['alcohol', 'late_meal', 'stress', 'none'][i])} className="text-xs">{label}</MotionButton>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 每日洞察中心 - 懒加载 */}
        <div className="md:col-span-2">
          <Suspense fallback={<LoadingPlaceholder height="h-64" />}>
            <DailyInsightHub todayTask={todayTask} insight={insight} isLoading={isLoading} questionnaireCompleted={!!latestLog}
              onStartCalibration={() => setShowCalibrationSheet(true)} userId={user?.id}
              onQuestionnaireComplete={() => { setIsLoading(true); setTimeout(() => setIsLoading(false), 1000); }}
              stressLevel={biometrics.stress ?? 5} energyLevel={biometrics.sleep && biometrics.sleep > 6 ? 6 : 4} />
          </Suspense>
        </div>
      </div>

      {/* 研究动态 - 懒加载 */}
      <div className="max-w-4xl mx-auto mt-4">
        <div className="rounded-xl border border-[#E7E1D6] dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg overflow-hidden h-[420px]">
          <Suspense fallback={<LoadingPlaceholder height="h-[420px]" />}>
            <InfiniteNewsFeed language={language} variant="calm" />
          </Suspense>
        </div>
      </div>

      {/* 工具卡片 */}
      <div className="max-w-4xl mx-auto mt-4">
        <div className="rounded-xl border border-[#E7E1D6] dark:border-neutral-800 bg-gradient-to-br from-[#FFFDF8] to-[#FAF6EF] dark:from-neutral-900 dark:to-neutral-950 shadow-xl p-4">
          <div className="text-base font-semibold text-[#0B3D2E] dark:text-white flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5" />
            {language === 'en' ? 'Health Tools' : '健康工具'}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/assessment" className="block">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="p-4 rounded-xl bg-gradient-to-br from-[#9CAF88] to-[#7A9A6A] cursor-pointer shadow-md flex items-center justify-center min-h-[120px]">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-2"><Sparkles className="w-6 h-6 text-white" /></div>
                  <p className="text-base font-semibold text-white">{language === 'en' ? 'Symptom Assessment' : '症状评估'}</p>
                  <p className="text-sm text-white/80 mt-1">{language === 'en' ? 'AI Health Consult' : 'AI 健康问诊'}</p>
                </div>
              </motion.div>
            </Link>
            <Link href="/bayesian" className="block">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="p-4 rounded-xl bg-gradient-to-br from-[#C4A77D] to-[#A68B5B] cursor-pointer shadow-md flex items-center justify-center min-h-[120px]">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-2"><Brain className="w-6 h-6 text-white" /></div>
                  <p className="text-base font-semibold text-white">{language === 'en' ? 'Cognitive Scale' : '认知天平'}</p>
                  <p className="text-sm text-white/80 mt-1">{language === 'en' ? 'Bayesian Loop' : '贝叶斯循环'}</p>
                </div>
              </motion.div>
            </Link>
          </div>
        </div>
      </div>

      {/* 每日签到 - 懒加载 */}
      <Suspense fallback={null}>
        <DailyCheckin open={showCalibrationSheet} onOpenChange={setShowCalibrationSheet} onComplete={handleCalibrationComplete}
          weeklyRecords={dailyLogs?.map(log => ({ sleep_hours: log.sleep_hours || 7, stress_level: log.stress_level > 6 ? 'high' : log.stress_level > 3 ? 'medium' : 'low', exercise_intention: 'moderate' as const, timestamp: log.created_at })) || []} />
      </Suspense>

      {/* 下方内容区 - 懒加载 */}
      <Suspense fallback={<LoadingPlaceholder height="h-48" />}>
        <section id="how" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 scroll-mt-20">
          <AnimatedSection inView variant="fadeUp">
            <div className="mb-4"><span className="badge-modern dark:bg-neutral-800 dark:text-white">{t('landing.coreIdea')}</span></div>
            <h2 className="display-text text-3xl sm:text-5xl md:text-6xl font-black text-[#0a0a0a] dark:text-white leading-[0.95] tracking-tight">
              <span className="block">{t('landing.noiseTitle').split('"')[0]}<span className="text-gradient-accent">&quot;{language === 'en' ? 'noise' : '噪音'}&quot;</span>{language === 'en' ? '.' : '。'}</span>
              <span className="block mt-2">{t('landing.truthTitle').split('"')[0]}<span className="text-gradient">&quot;{language === 'en' ? 'truth' : '真相'}&quot;</span>{language === 'en' ? '.' : '。'}</span>
            </h2>
            <div className="mt-6 grid md:grid-cols-3 gap-4 items-stretch">
              {['cognitiveLoad', 'habitStreaks', 'theSignal'].map((key) => (
                <div key={key} className="group rounded-2xl p-[1px] bg-gradient-to-br from-[#E7E1D6] dark:from-neutral-700 to-transparent h-full">
                  <motion.div whileHover={{ scale: 1.04, translateY: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="relative rounded-2xl border border-[#E7E1D6] dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur p-6 shadow-md transition-all group-hover:shadow-lg h-full flex flex-col overflow-hidden">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B3D2E]/60 dark:text-neutral-400">{t(`landing.${key}`)}</div>
                    <div className="mt-1 text-xl font-medium text-[#0B3D2E] dark:text-white">{t(`landing.${key}Title`)}</div>
                    <p className="mt-3 text-[#0B3D2E]/80 dark:text-neutral-300 leading-relaxed">{t(`landing.${key}P1`)}</p>
                  </motion.div>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </section>
      </Suspense>

      <Suspense fallback={<LoadingPlaceholder height="h-48" />}>
        <section id="model" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 scroll-mt-20">
          <AnimatedSection inView variant="fadeUp">
            <div className="rounded-3xl border border-[#E7E1D6] dark:border-neutral-800 bg-[#FFFDF8] dark:bg-neutral-900 p-8 md:p-12">
              <span className="badge-modern dark:bg-neutral-800 dark:text-white mb-4">{t('landing.methodology')}</span>
              <h2 className="display-text text-3xl sm:text-4xl md:text-5xl font-black text-[#0a0a0a] dark:text-white tracking-tight">{t('landing.solutionTitle')}</h2>
              <p className="subtitle mt-3 text-lg text-gray-600 dark:text-neutral-400">{t('landing.solutionSubtitle')}</p>
              <div className="mt-6 grid md:grid-cols-3 gap-4 items-stretch">
                {['agent', 'bayesian', 'minimumDose'].map((key) => (
                  <motion.div key={key} whileHover={{ scale: 1.02, translateY: -1 }} transition={{ duration: 0.22, ease: 'easeOut' }} className="relative rounded-2xl border border-[#E7E1D6] dark:border-neutral-800 bg-white dark:bg-neutral-800 p-6 shadow-md hover:shadow-lg overflow-hidden h-full flex flex-col">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B3D2E]/60 dark:text-neutral-400">{t(`landing.${key}`)}</div>
                    <h3 className="mt-1 text-xl font-semibold text-[#0B3D2E] dark:text-white">{t(`landing.${key}Title`)}</h3>
                    <p className="mt-3 text-[#0B3D2E]/80 dark:text-neutral-300 leading-relaxed">{t(`landing.${key}P1`)}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </section>
      </Suspense>

      <Suspense fallback={<LoadingPlaceholder height="h-48" />}>
        <section id="authority" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6 scroll-mt-20">
          <AnimatedSection inView variant="fadeUp" className="rounded-3xl border border-[#E7E1D6] dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 md:p-12">
            <span className="badge-modern dark:bg-neutral-800 dark:text-white mb-4">{t('landing.curatedContent')}</span>
            <h2 className="display-text text-3xl sm:text-4xl md:text-5xl font-black text-[#0a0a0a] dark:text-white tracking-tight">{t('landing.noNoiseFeed')}</h2>
            <p className="subtitle mt-4 text-lg text-gray-600 dark:text-neutral-400 max-w-3xl">{t('landing.feedDesc')}</p>
            <div className="mt-6">
              <Suspense fallback={<LoadingPlaceholder height="h-48" />}>
                <JournalShowcase language={language as 'en' | 'zh'} columns={2} limit={4} />
              </Suspense>
            </div>
            <div className="mt-4 rounded-md border border-[#E7E1D6] dark:border-neutral-700 bg-[#FFFDF8] dark:bg-neutral-800 p-4">
              <div className="text-xs text-[#0B3D2E]/60 dark:text-neutral-400">{t('landing.refReading')}</div>
              <div className="mt-2 text-sm text-[#0B3D2E]/90 dark:text-neutral-200">{t('landing.cholesterolRef')}</div>
              <a className="mt-2 inline-block text-xs text-[#0B3D2E] dark:text-white underline" href="https://www.healthline.com/health/cholesterol-can-it-be-too-low" target="_blank" rel="noreferrer">Healthline: Can My Cholesterol Be Too Low?</a>
            </div>
          </AnimatedSection>
        </section>
      </Suspense>
    </div>
  );
}
