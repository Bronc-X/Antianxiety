'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BrainLoader } from '@/components/lottie/BrainLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, ExternalLink, Sparkles, AlertTriangle, Moon, Activity, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MotionButton } from '@/components/motion/MotionButton';
import { DailyTasksCard } from '@/components/DailyTasksCard';
import { ConsensusMeter, ConsensusIndicator } from '@/components/ConsensusMeter';
import { WisdomCarousel } from '@/components/WisdomCarousel';
import { DailyInsightHub } from '@/components/DailyInsightHub';
import { DailyCheckin } from '@/components/DailyCheckin';
import { CalibrationInput, GeneratedTask } from '@/lib/calibration-service';
import AnimatedSection from '@/components/AnimatedSection';
import XFeed from '@/components/XFeed';
import { useI18n } from '@/lib/i18n';

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
        const msg = language === 'en' 
          ? `Your HRV dropped by ${Math.round(hrvDrop * 100)}%. Did any of these happen last night?`
          : `你的 HRV 下降了 ${Math.round(hrvDrop * 100)}%。昨晚是否有以下情况？`;
        setAnomalyQuestion(msg);
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
      if (savedTask) { try { setTodayTask(JSON.parse(savedTask)); } catch (e) { console.error(e); } }
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
    <div className="min-h-screen bg-[#FAF6EF] p-4 pb-24 md:pb-4">
      <header className="mb-8 pt-4">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="display-text text-4xl md:text-5xl font-black text-[#0a0a0a] tracking-tight">
          {t('landing.hello')}<motion.span className="text-[#9CAF88] cursor-pointer inline-block relative" whileHover={{ scale: 1.05, color: '#0B3D2E' }} whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
            {profile?.full_name || profile?.username || t('landing.friend')}
            <span className="absolute -top-3 -right-10 px-2.5 py-1 text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-md shadow-md tracking-wider">
              PRO
            </span>
          </motion.span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="subtitle text-lg text-gray-600 mt-2">
          {t('landing.findBalance')}
        </motion.p>
      </header>

      <div className="max-w-4xl mx-auto mb-4"><WisdomCarousel autoPlay={true} interval={8000} /></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        <AnimatePresence>
          {showAnomalyCard && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="md:col-span-2">
              <Card className="bg-amber-50 border-amber-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />{t('landing.changeDetected')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-amber-800 mb-3">{anomalyQuestion}</p>
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

        {/* 整合卡片 - 三个标签：今日、问诊、计划 */}
        <div className="md:col-span-2">
          <DailyInsightHub
            todayTask={todayTask}
            insight={insight}
            isLoading={isLoading}
            questionnaireCompleted={!!latestLog}
            onStartCalibration={() => setShowCalibrationSheet(true)}
            userId={user?.id}
            onQuestionnaireComplete={() => { setIsLoading(true); setTimeout(() => setIsLoading(false), 1000); }}
            stressLevel={biometrics.stress ?? 5}
            energyLevel={biometrics.sleep && biometrics.sleep > 6 ? 6 : 4}
          />
        </div>
      </div>

      {/* 下方：工具和真相（保持原来的大小） */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto mt-4">
        {/* 工具卡片 */}
        <Card className="shadow-xl bg-gradient-to-br from-[#FFFDF8] to-[#FAF6EF] border-[#E7E1D6]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[#0B3D2E] flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {language === 'en' ? 'Tools' : '工具'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/assessment">
              <motion.div whileHover={{ scale: 1.02, x: 4 }} whileTap={{ scale: 0.98 }}
                className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shadow-sm">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#0B3D2E]">{language === 'en' ? 'Symptom Assessment' : '症状评估'}</p>
                    <p className="text-xs text-[#0B3D2E]/60">{language === 'en' ? 'AI Health Consult' : 'AI 健康问诊'}</p>
                  </div>
                </div>
              </motion.div>
            </Link>
            <Link href="/bayesian">
              <motion.div whileHover={{ scale: 1.02, x: 4 }} whileTap={{ scale: 0.98 }}
                className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shadow-sm">
                    <Brain className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#0B3D2E]">{language === 'en' ? 'Cognitive Scale' : '认知天平'}</p>
                    <p className="text-xs text-[#0B3D2E]/60">{language === 'en' ? 'Bayesian Loop' : '贝叶斯循环'}</p>
                  </div>
                </div>
              </motion.div>
            </Link>
          </CardContent>
        </Card>

        {/* 真相卡片 */}
        <Card className="shadow-xl bg-gradient-to-br from-[#FFFDF8] to-[#FAF6EF] border-[#E7E1D6]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[#0B3D2E] flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {language === 'en' ? 'Truth' : '真相'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ConsensusMeter percentage={89} metaAnalysisCount={12} />
            <motion.div className="p-4 rounded-xl bg-[#FAF6EF] border border-[#E7E1D6]">
              <p className="text-sm text-[#0B3D2E] leading-relaxed">
                <span className="font-semibold text-[#9CAF88]">{language === 'en' ? 'Core Truth: ' : '核心真相：'}</span>
                {language === 'en' 
                  ? 'Muscle loss after 30 is not inevitable aging, but a result of reduced activity.'
                  : '30岁后的肌肉流失不是必然的衰老，而是活动减少的结果。'}
              </p>
            </motion.div>
            <motion.a href="https://pubmed.ncbi.nlm.nih.gov/3385520/" target="_blank" rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-white border border-[#E7E1D6] hover:border-[#9CAF88]/50 transition-colors group">
              <span className="text-lg">📄</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#0B3D2E] group-hover:text-[#9CAF88] transition-colors line-clamp-2">
                  Lexell et al. (1988) - What is the cause of the ageing atrophy?
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <ConsensusIndicator percentage={92} />
                  <span className="text-[10px] text-[#0B3D2E]/50 font-medium">J Neurol Sci</span>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#0B3D2E]/30 group-hover:text-[#9CAF88] transition-colors flex-shrink-0 mt-0.5" />
            </motion.a>
          </CardContent>
        </Card>
      </div>

      <DailyCheckin open={showCalibrationSheet} onOpenChange={setShowCalibrationSheet} onComplete={handleCalibrationComplete}
        weeklyRecords={dailyLogs?.map(log => ({ sleep_hours: log.sleep_hours || 7, stress_level: log.stress_level > 6 ? 'high' : log.stress_level > 3 ? 'medium' : 'low', exercise_intention: 'moderate' as const, timestamp: log.created_at })) || []} />

      <section id="how" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 scroll-mt-20">
        <AnimatedSection inView variant="fadeUp">
          <div className="mb-4"><span className="badge-modern">{t('landing.coreIdea')}</span></div>
          <h2 className="display-text text-3xl sm:text-5xl md:text-6xl font-black text-[#0a0a0a] leading-[0.95] tracking-tight">
            <span className="block">{t('landing.noiseTitle').split('"')[0]}<span className="text-gradient-accent">&quot;{language === 'en' ? 'noise' : '噪音'}&quot;</span>{language === 'en' ? '.' : '。'}</span>
            <span className="block mt-2">{t('landing.truthTitle').split('"')[0]}<span className="text-gradient">&quot;{language === 'en' ? 'truth' : '真相'}&quot;</span>{language === 'en' ? '.' : '。'}</span>
          </h2>
          <div className="mt-6 grid md:grid-cols-3 gap-4 items-stretch">
            <div className="group rounded-2xl p-[1px] bg-gradient-to-br from-[#E7E1D6] to-transparent h-full">
              <motion.div whileHover={{ scale: 1.04, translateY: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="relative rounded-2xl border border-[#E7E1D6] bg-white/90 backdrop-blur p-6 shadow-md transition-all group-hover:shadow-lg h-full flex flex-col overflow-hidden">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B3D2E]/60">{t('landing.cognitiveLoad')}</div>
                <div className="mt-1 text-xl font-medium text-[#0B3D2E]">{t('landing.cognitiveLoadTitle')}</div>
                <div className="mt-3 text-[#0B3D2E]/80 space-y-4 leading-relaxed">
                  <p className="mb-3">{t('landing.cognitiveLoadP1')}</p>
                  <p className="mb-3">{t('landing.cognitiveLoadP2')}</p>
                  <p>{t('landing.cognitiveLoadP3')}</p>
                </div>
              </motion.div>
            </div>
            <div className="group rounded-2xl p-[1px] bg-gradient-to-br from-[#E7E1D6] to-transparent h-full">
              <motion.div whileHover={{ scale: 1.04, translateY: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="relative rounded-2xl border border-[#E7E1D6] bg-white/90 backdrop-blur p-6 shadow-md transition-all group-hover:shadow-lg h-full flex flex-col overflow-hidden">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B3D2E]/60">{t('landing.habitStreaks')}</div>
                <div className="mt-1 text-xl font-medium text-[#0B3D2E]">{t('landing.habitStreaksTitle')}</div>
                <p className="mt-3 text-[#0B3D2E]/80 leading-relaxed mb-4">{t('landing.habitStreaksP1')}</p>
              </motion.div>
            </div>
            <div className="group rounded-2xl p-[1px] bg-gradient-to-br from-[#E7E1D6] to-transparent h-full">
              <motion.div whileHover={{ scale: 1.04, translateY: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="relative rounded-2xl border border-[#E7E1D6] bg-white/90 backdrop-blur p-6 shadow-md transition-all group-hover:shadow-lg h-full flex flex-col overflow-hidden">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B3D2E]/60">{t('landing.theSignal')}</div>
                <div className="mt-1 text-xl font-medium text-[#0B3D2E]">{t('landing.theSignalTitle')}</div>
                <p className="mt-3 text-[#0B3D2E]/80 leading-relaxed">{t('landing.theSignalP1')}</p>
              </motion.div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      <section id="model" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 scroll-mt-20">
        <AnimatedSection inView variant="fadeUp">
          <div className="rounded-3xl border border-[#E7E1D6] bg-[#FFFDF8] p-8 md:p-12">
            <span className="badge-modern mb-4">{t('landing.methodology')}</span>
            <h2 className="display-text text-3xl sm:text-4xl md:text-5xl font-black text-[#0a0a0a] tracking-tight">{t('landing.solutionTitle')}</h2>
            <p className="subtitle mt-3 text-lg text-gray-600">{t('landing.solutionSubtitle')}</p>
            <div className="mt-6 grid md:grid-cols-3 gap-4 items-stretch">
              <motion.div whileHover={{ scale: 1.06, translateY: -2 }} transition={{ duration: 0.22, ease: 'easeOut' }} className="relative rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-md hover:shadow-lg overflow-hidden">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B3D2E]/60">{t('landing.agent')}</div>
                <h3 className="mt-1 text-xl font-medium text-[#0B3D2E]">{t('landing.agentTitle')}</h3>
                <p className="mt-3 text-[#0B3D2E]/80 leading-relaxed mb-3">{t('landing.agentP1')}</p>
                <p className="mt-2 text-[#0B3D2E] font-semibold leading-relaxed mb-3">{t('landing.agentP2')}</p>
                <p className="mt-2 text-[#0B3D2E]/80 leading-relaxed">{t('landing.agentP3')}</p>
                <motion.div className="mt-6 rounded-xl border border-[#E7E1D6] bg-[#FAF6EF] p-3" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 4, repeat: Infinity }}>
                  <div className="text-xs font-semibold text-[#0B3D2E]">{t('landing.cortisolEquation')}</div>
                  <div className="mt-1 font-mono text-sm text-[#0B3D2E]">dC/dt = -λ·C(t) + I(t)</div>
                  <p className="mt-1 text-[11px] text-[#0B3D2E]/70">{t('landing.cortisolDesc')}</p>
                </motion.div>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02, translateY: -1 }} transition={{ duration: 0.22, ease: 'easeOut' }} className="relative rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-md hover:shadow-lg overflow-hidden h-full flex flex-col">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B3D2E]/60">{t('landing.bayesian')}</div>
                <h3 className="mt-1 text-xl font-medium text-[#0B3D2E]">{t('landing.bayesianTitle')}</h3>
                <p className="mt-3 text-[#0B3D2E]/80 leading-relaxed">{t('landing.bayesianP1')}</p>
                <div className="mt-auto pt-4 text-xs text-[#0B3D2E]/60">{t('landing.bayesianRef')}</div>
                <motion.div className="mt-4 rounded-xl border border-[#E7E1D6] bg-[#FAF6EF] p-3 font-mono text-sm text-[#0B3D2E]" animate={{ scale: [1, 1.02, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 5, repeat: Infinity }}>
                  <div>P(H∣D) = [P(D∣H)·P(H)] / P(D)</div>
                  <div className="mt-1 text-[11px] text-[#0B3D2E]/70">{t('landing.bayesianFormula')}</div>
                </motion.div>
              </motion.div>
              <motion.div whileHover={{ scale: 1.06, translateY: -2 }} transition={{ duration: 0.22, ease: 'easeOut' }} className="relative rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-md hover:shadow-lg overflow-hidden h-full flex flex-col">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B3D2E]/60">{t('landing.minimumDose')}</div>
                <h3 className="mt-1 text-xl font-medium text-[#0B3D2E]">{t('landing.minimumDoseTitle')}</h3>
                <p className="mt-3 text-[#0B3D2E]/80">{t('landing.minimumDoseP1')}</p>
                <div className="mt-auto pt-4">
                  <motion.svg viewBox="0 0 140 80" className="w-full h-20">
                    <motion.path d="M5 70 C35 60 55 45 70 40 C95 32 115 20 135 15" fill="none" stroke="#0B3D2E" strokeWidth="3" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }} />
                  </motion.svg>
                  <div className="mt-1 font-mono text-xs text-[#0B3D2E]">Δhabit = k · e<sup>−r</sup></div>
                </div>
              </motion.div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      <section id="authority" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6 scroll-mt-20">
        <AnimatedSection inView variant="fadeUp" className="rounded-3xl border border-[#E7E1D6] bg-white p-8 md:p-12">
          <span className="badge-modern mb-4">{t('landing.curatedContent')}</span>
          <h2 className="display-text text-3xl sm:text-4xl md:text-5xl font-black text-[#0a0a0a] tracking-tight">{t('landing.noNoiseFeed')}</h2>
          <p className="subtitle mt-4 text-lg text-gray-600 max-w-3xl">{t('landing.feedDesc')}</p>
          <div className="mt-4"><XFeed variant="bare" compact columns={2} limit={4} /></div>
          <div className="mt-4 rounded-md border border-[#E7E1D6] bg-[#FFFDF8] p-4">
            <div className="text-xs text-[#0B3D2E]/60">{t('landing.refReading')}</div>
            <div className="mt-2 text-sm text-[#0B3D2E]/90">{t('landing.cholesterolRef')}</div>
            <a className="mt-2 inline-block text-xs text-[#0B3D2E] underline" href="https://www.healthline.com/health/cholesterol-can-it-be-too-low" target="_blank" rel="noreferrer">Healthline: Can My Cholesterol Be Too Low?</a>
          </div>
        </AnimatedSection>
      </section>
    </div>
  );
}
