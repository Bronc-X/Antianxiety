'use client';

/**
 * Bayesian Dashboard Page
 * 
 * 贝叶斯信念循环的主页面
 * 使用 ReframingRitual 组件进行认知重构
 * 
 * @module app/bayesian/page
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import { ReframingRitual } from '@/components/max/ReframingRitual';
import { AnxietyCurve } from '@/components/bayesian/AnxietyCurve';
import { PassiveNudge } from '@/components/bayesian/PassiveNudge';
import { HealthDashboardWidget } from '@/components/bayesian/HealthDashboardWidget';
import { useBayesianNudge } from '@/hooks/useBayesianNudge';
import { BeliefOutput } from '@/types/max';
import { MotionButton } from '@/components/motion/MotionButton';
import { Brain, TrendingDown, Activity, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

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
            <Link href="/landing" className="text-[#0B3D2E]/60 dark:text-neutral-400 hover:text-[#0B3D2E] dark:hover:text-white">
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
      <main className="max-w-md mx-auto px-4 py-6">
        
        {/* Hero Card - 最新状态 */}
        <motion.section 
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-[#FFFDF8] dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-[#E7E1D6] dark:border-neutral-800">
            {/* 当前状态 */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[#0B3D2E]/60 dark:text-neutral-400 text-xs mb-1">{t('bayesian.currentAnxiety')}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-light text-[#0B3D2E] dark:text-white">
                    {latestBelief?.posterior_score || lastResult?.posterior || 50}
                  </span>
                  <span className="text-lg text-[#0B3D2E]/50 dark:text-neutral-500">%</span>
                </div>
              </div>
              
              {/* 降低指示 */}
              {(latestBelief || lastResult) && (
                <motion.div 
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#9CAF88]/15 dark:bg-emerald-900/30"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                >
                  <TrendingDown className="w-4 h-4 text-[#5A7A4A] dark:text-emerald-400" />
                  <span className="text-sm text-[#5A7A4A] dark:text-emerald-400 font-medium">
                    ↓{latestBelief ? (latestBelief.prior_score - latestBelief.posterior_score) : (lastResult ? lastResult.prior - lastResult.posterior : 0)}%
                  </span>
                </motion.div>
              )}
            </div>

            {/* 视觉天平 - 水平布局避免遮挡 */}
            <div className="flex items-center justify-between gap-4 mb-6 py-4">
              {/* 左侧 - 恐惧 */}
              <div className="flex-1 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#C4A77D]/10 dark:bg-amber-900/20 border border-[#C4A77D]/30 dark:border-amber-700/30 flex flex-col items-center justify-center">
                  <span className="text-xl font-medium text-[#8B6914] dark:text-amber-400">
                    {latestBelief?.prior_score || lastResult?.prior || 70}%
                  </span>
                </div>
                <span className="text-xs text-[#0B3D2E]/60 dark:text-neutral-400 mt-2 block">{t('bayesian.fear')}</span>
              </div>
              
              {/* 中间箭头 */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-[2px] bg-gradient-to-r from-[#C4A77D] dark:from-amber-600 to-[#E7E1D6] dark:to-neutral-600" />
                <span className="text-[#0B3D2E]/40 dark:text-neutral-500">→</span>
                <div className="w-8 h-[2px] bg-gradient-to-r from-[#E7E1D6] dark:from-neutral-600 to-[#9CAF88] dark:to-emerald-500" />
              </div>
              
              {/* 右侧 - 真相 */}
              <div className="flex-1 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#9CAF88]/10 dark:bg-emerald-900/20 border border-[#9CAF88]/30 dark:border-emerald-700/30 flex flex-col items-center justify-center">
                  <span className="text-xl font-medium text-[#5A7A4A] dark:text-emerald-400">
                    {latestBelief?.posterior_score || lastResult?.posterior || 50}%
                  </span>
                </div>
                <span className="text-xs text-[#0B3D2E]/60 dark:text-neutral-400 mt-2 block">{t('bayesian.truth')}</span>
              </div>
            </div>

            {/* 开始按钮 */}
            <MotionButton
              onClick={handleStartRitual}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0B3D2E] to-[#1a5a45] 
                text-[#FAF6EF] font-medium shadow-lg shadow-[#0B3D2E]/20"
            >
              <span className="mr-2">🧠</span>
              {t('bayesian.startCalibration')}
            </MotionButton>
          </div>
        </motion.section>

        {/* 统计卡片 */}
        {historyData?.data?.summary && (
          <motion.section 
            className="grid grid-cols-3 gap-3 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-[#FFFDF8] dark:bg-neutral-900 rounded-2xl p-4 text-center border border-[#E7E1D6] dark:border-neutral-800">
              <p className="text-[#0B3D2E]/50 dark:text-neutral-500 text-[10px] mb-1">{t('bayesian.avgPrior')}</p>
              <p className="text-[#8B6914] dark:text-amber-400 text-xl font-light">
                {historyData.data.summary.average_prior}%
              </p>
            </div>
            <div className="bg-[#FFFDF8] dark:bg-neutral-900 rounded-2xl p-4 text-center border border-[#E7E1D6] dark:border-neutral-800">
              <p className="text-[#0B3D2E]/50 dark:text-neutral-500 text-[10px] mb-1">{t('bayesian.avgPosterior')}</p>
              <p className="text-[#5A7A4A] dark:text-emerald-400 text-xl font-light">
                {historyData.data.summary.average_posterior}%
              </p>
            </div>
            <div className="bg-[#FFFDF8] dark:bg-neutral-900 rounded-2xl p-4 text-center border border-[#E7E1D6] dark:border-neutral-800">
              <p className="text-[#0B3D2E]/50 dark:text-neutral-500 text-[10px] mb-1">{t('bayesian.avgReduction')}</p>
              <p className="text-[#0B3D2E] dark:text-white text-xl font-light">
                {historyData.data.summary.average_reduction}%
              </p>
            </div>
          </motion.section>
        )}

        {/* 焦虑趋势 */}
        <motion.section 
          className="bg-[#FFFDF8] dark:bg-neutral-900 rounded-2xl p-5 mb-6 border border-[#E7E1D6] dark:border-neutral-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#5A7A4A] dark:text-emerald-400" />
              <h2 className="text-sm font-medium text-[#0B3D2E] dark:text-white">{t('bayesian.anxietyTrend')}</h2>
            </div>
          </div>
          <AnxietyCurve
            data={historyData?.data?.points || []}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
        </motion.section>

        {/* 趋势指示 */}
        {historyData?.data?.summary?.trend && (
          <motion.section 
            className="text-center mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-[#0B3D2E]/60 text-sm">
              {historyData.data.summary.trend === 'improving' && (
                <span className="text-[#9CAF88]">📈 {t('bayesian.improving')}</span>
              )}
              {historyData.data.summary.trend === 'stable' && (
                <span className="text-[#0B3D2E]/60">📊 {t('bayesian.stable')}</span>
              )}
              {historyData.data.summary.trend === 'worsening' && (
                <span className="text-[#C4A77D]">💪 {t('bayesian.worsening')}</span>
              )}
            </p>
          </motion.section>
        )}

        {/* 健康仪表盘 Widget */}
        <motion.section 
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <HealthDashboardWidget />
        </motion.section>

        {/* 科学说明 */}
        <motion.section 
          className="bg-[#9CAF88]/5 dark:bg-emerald-900/10 rounded-2xl p-5 border border-[#9CAF88]/10 dark:border-emerald-800/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-sm font-medium text-[#0B3D2E] dark:text-white mb-2">{t('bayesian.whatIs')}</h3>
          <p className="text-xs text-[#0B3D2E]/60 dark:text-neutral-400 leading-relaxed">
            {t('bayesian.explanation')}
          </p>
        </motion.section>
      </main>

      {/* Ritual Modal */}
      <AnimatePresence>
        {showRitual && (
          <motion.div
            className="fixed inset-0 z-50 bg-[#0A0A0A]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="min-h-screen flex items-center justify-center p-4">
              <ReframingRitual
                onComplete={handleRitualComplete}
                onCancel={handleRitualCancel}
                hrvData={mockHrvData}
              />
            </div>
          </motion.div>
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
