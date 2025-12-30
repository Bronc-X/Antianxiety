'use client';

/**
 * Bayesian Dashboard Page
 * 
 * 贝叶斯信念循环的主页面
 * 使用 ReframingRitual 组件进行认知重构
 * 
 * @module app/bayesian/page
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import useSWR from 'swr';
import BayesianRitualModal from '@/components/bayesian/ritual/BayesianRitualModal';
import { AnxietyCurve } from '@/components/bayesian/AnxietyCurve';
import { CognitiveDistortionAnimation } from '@/components/bayesian/CognitiveDistortionAnimation';
import { PassiveNudge } from '@/components/bayesian/PassiveNudge';
import { HealthDashboardWidget } from '@/components/bayesian/HealthDashboardWidget';
import { useBayesianNudge } from '@/hooks/useBayesianNudge';
import { BeliefOutput } from '@/types/max';
import { MotionButton } from '@/components/motion/MotionButton';
import { Brain, TrendingDown, Activity, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

// ============================================
// Helper Components
// ============================================

function Counter({ value, className }: { value: number, className?: string }) {
  const spring = useSpring(0, { bounce: 0, duration: 2000 });
  const display = useTransform(spring, (current) => Math.round(current));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span className={className}>{display}</motion.span>;
}

// ============================================
// Fetcher
// ============================================

const fetcher = (url: string) => fetch(url).then(res => res.json());

// ============================================
// Component
// ============================================

export default function BayesianDashboardPage() {
  const { t, language } = useI18n();
  const [showRitual, setShowRitual] = useState(false);
  const [lastResult, setLastResult] = useState<BeliefOutput | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Passive nudge hook
  const { nudgeState, dismissNudge } = useBayesianNudge();

  // 确保页面加载时滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch history data
  const { data: historyData, mutate: refreshHistory } = useSWR(
    `/api/bayesian/history?timeRange=${timeRange}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  // Get latest belief for display
  const latestBelief = historyData?.data?.points?.[historyData.data.points.length - 1];

  // 模拟 HRV 数据
  const mockHrvData = {
    rmssd: 52,
    sdnn: 48,
    lf_hf_ratio: 1.15,
    timestamp: new Date().toISOString()
  };

  const currentScore = latestBelief?.posterior_score || lastResult?.posterior || 50;
  // Calculate trend: positive means anxiety reduced (good), negative means increased (bad)
  // If we have previous points, compare with previous. If not, use generic.
  // Actually, let's keep the existing logic: prior - posterior = reduction.
  const trend = latestBelief ? (latestBelief.prior_score - latestBelief.posterior_score) : (lastResult ? lastResult.prior - lastResult.posterior : 0);

  const handleStartRitual = useCallback(() => {
    setShowRitual(true);
  }, []);

  const handleRitualComplete = useCallback((result: BeliefOutput) => {
    setLastResult(result);
    setShowRitual(false);
    refreshHistory();
  }, [refreshHistory]);

  const handleRitualCancel = useCallback(() => {
    setShowRitual(false);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF6EF] dark:bg-neutral-950 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FAF6EF]/90 dark:bg-neutral-950/90 backdrop-blur-xl border-b border-[#E7E1D6] dark:border-neutral-800">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/unlearn/app" className="text-[#0B3D2E]/60 dark:text-neutral-400 hover:text-[#0B3D2E] dark:hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-medium text-[#0B3D2E] dark:text-white">{t('bayesian.title')}</h1>
              <p className="text-xs text-[#0B3D2E]/40 dark:text-neutral-500">{t('bayesian.subtitle')}</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#9CAF88]/10 dark:bg-emerald-900/30 flex items-center justify-center">
            <Brain className="w-5 h-5 text-[#9CAF88] dark:text-emerald-400" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto px-4 py-8 space-y-8">

        {/* Hero Card - Current State */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-white dark:bg-neutral-900 rounded-[2rem] p-8 shadow-[0_20px_40px_rgba(11,61,46,0.05)] border border-[#E7E1D6] dark:border-neutral-800 relative overflow-hidden">
            {/* Background Decoration - Breathing */}
            <motion.div
              className="absolute top-0 right-0 w-32 h-32 bg-[#9CAF88]/10 rounded-full blur-[60px] -mr-10 -mt-10"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-10">
                <div>
                  <p className="text-[#0B3D2E]/60 dark:text-neutral-400 text-sm font-medium tracking-wide uppercase mb-2">{t('bayesian.currentAnxiety')}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-serif text-[#0B3D2E] dark:text-white tracking-tight">
                      <Counter value={currentScore} />
                    </span>
                    <span className="text-xl text-[#0B3D2E]/40 dark:text-neutral-500 font-medium">%</span>
                  </div>
                </div>

                {/* Trend Badge */}
                {(latestBelief || lastResult) && (
                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#E7E1D6]/30 border border-[#E7E1D6] backdrop-blur-sm">
                    <TrendingDown className="w-4 h-4 text-[#5A7A4A]" />
                    <span className="text-sm font-semibold text-[#5A7A4A]">
                      {trend}%
                    </span>
                  </div>
                )}
              </div>

              {/* Cognitive Balance Visual (Animated) */}
              <div className="mb-8">
                <CognitiveDistortionAnimation
                  prior={latestBelief?.prior_score || lastResult?.prior || 70}
                  posterior={latestBelief?.posterior_score || lastResult?.posterior || 50}
                />
              </div>

              {/* CTA Button */}
              <MotionButton
                onClick={handleStartRitual}
                whileHover={{ y: -2, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-5 rounded-2xl bg-[#0B3D2E] text-white font-medium text-lg shadow-xl shadow-[#0B3D2E]/10 transition-all"
              >
                <div className="flex items-center justify-center gap-3">
                  <Brain className="w-5 h-5 opacity-80" />
                  <span>{t('bayesian.startCalibration')}</span>
                </div>
              </MotionButton>
            </div>
          </div>
        </motion.section>

        {/* Stats Grid */}
        {historyData?.data?.summary && (
          <motion.section
            className="grid grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {[
              { label: t('bayesian.avgPrior'), value: historyData.data.summary.average_prior, color: 'text-[#8B6914]' },
              { label: t('bayesian.avgPosterior'), value: historyData.data.summary.average_posterior, color: 'text-[#5A7A4A]' },
              { label: t('bayesian.avgReduction'), value: historyData.data.summary.average_reduction, color: 'text-[#0B3D2E]' }
            ].map((stat, i) => (
              <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl p-5 text-center shadow-sm border border-[#E7E1D6] dark:border-neutral-800">
                <p className="text-[#0B3D2E]/40 text-[10px] font-medium uppercase tracking-wider mb-2">{stat.label}</p>
                <div className={`text-xl font-light ${stat.color} flex justify-center`}>
                  {/* Prefix with - for reduction if specifically reduction stat. The value is likely positive number representing reduction amount */}
                  {i === 2 && '-'}<Counter value={stat.value} />%
                </div>
              </div>
            ))}
          </motion.section>
        )}

        {/* Charts & Other Widgets */}
        <div className="space-y-6">
          <motion.section
            className="bg-white dark:bg-neutral-900 rounded-[2rem] p-6 shadow-sm border border-[#E7E1D6] dark:border-neutral-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6 pl-2">
              <div className="w-8 h-8 rounded-full bg-[#E7E1D6]/30 flex items-center justify-center">
                <Activity className="w-4 h-4 text-[#0B3D2E]" />
              </div>
              <h2 className="text-[#0B3D2E] font-medium">{t('bayesian.anxietyTrend')}</h2>
            </div>
            <AnxietyCurve
              data={historyData?.data?.points || []}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          </motion.section>

          <HealthDashboardWidget />
        </div>

        {/* Info Section */}
        <div className="text-center pt-8 pb-12">
          <p className="text-[#0B3D2E]/40 text-xs max-w-xs mx-auto leading-relaxed">
            {t('bayesian.explanation')}
          </p>
        </div>
      </main>

      {/* Ritual Modal */}
      <AnimatePresence>
        {showRitual && (
          <BayesianRitualModal
            onComplete={handleRitualComplete}
            onCancel={handleRitualCancel}
            mockHrv={true}
          />
        )}
      </AnimatePresence>

      {/* Passive Nudge */}
      {nudgeState && (
        <PassiveNudge
          actionType={nudgeState.actionType}
          correction={nudgeState.correction}
          onComplete={dismissNudge}
        />
      )}
    </div>
  );
}
