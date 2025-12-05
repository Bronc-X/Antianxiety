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
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FAF6EF]/90 backdrop-blur-xl border-b border-[#E7E1D6]">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/landing" className="text-[#0B3D2E]/60 hover:text-[#0B3D2E]">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-medium text-[#0B3D2E]">{t('bayesian.title')}</h1>
              <p className="text-xs text-[#0B3D2E]/40">{t('bayesian.subtitle')}</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#9CAF88]/10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-[#9CAF88]" />
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
          <div className="bg-[#FFFDF8] rounded-3xl p-6 shadow-sm border border-[#E7E1D6]">
            {/* 当前状态 */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[#0B3D2E]/60 text-xs mb-1">当前焦虑水平</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-light text-[#0B3D2E]">
                    {latestBelief?.posterior_score || lastResult?.posterior || 50}
                  </span>
                  <span className="text-lg text-[#0B3D2E]/50">%</span>
                </div>
              </div>
              
              {/* 降低指示 */}
              {(latestBelief || lastResult) && (
                <motion.div 
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#9CAF88]/15"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                >
                  <TrendingDown className="w-4 h-4 text-[#5A7A4A]" />
                  <span className="text-sm text-[#5A7A4A] font-medium">
                    ↓{latestBelief ? (latestBelief.prior_score - latestBelief.posterior_score) : (lastResult ? lastResult.prior - lastResult.posterior : 0)}%
                  </span>
                </motion.div>
              )}
            </div>

            {/* 视觉天平 - 水平布局避免遮挡 */}
            <div className="flex items-center justify-between gap-4 mb-6 py-4">
              {/* 左侧 - 恐惧 */}
              <div className="flex-1 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#C4A77D]/10 border border-[#C4A77D]/30 flex flex-col items-center justify-center">
                  <span className="text-xl font-medium text-[#8B6914]">
                    {latestBelief?.prior_score || lastResult?.prior || 70}%
                  </span>
                </div>
                <span className="text-xs text-[#0B3D2E]/60 mt-2 block">恐惧</span>
              </div>
              
              {/* 中间箭头 */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-[2px] bg-gradient-to-r from-[#C4A77D] to-[#E7E1D6]" />
                <span className="text-[#0B3D2E]/40">→</span>
                <div className="w-8 h-[2px] bg-gradient-to-r from-[#E7E1D6] to-[#9CAF88]" />
              </div>
              
              {/* 右侧 - 真相 */}
              <div className="flex-1 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#9CAF88]/10 border border-[#9CAF88]/30 flex flex-col items-center justify-center">
                  <span className="text-xl font-medium text-[#5A7A4A]">
                    {latestBelief?.posterior_score || lastResult?.posterior || 50}%
                  </span>
                </div>
                <span className="text-xs text-[#0B3D2E]/60 mt-2 block">真相</span>
              </div>
            </div>

            {/* 开始按钮 */}
            <MotionButton
              onClick={handleStartRitual}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0B3D2E] to-[#1a5a45] 
                text-[#FAF6EF] font-medium shadow-lg shadow-[#0B3D2E]/20"
            >
              <span className="mr-2">🧠</span>
              开始认知校准
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
            <div className="bg-[#FFFDF8] rounded-2xl p-4 text-center border border-[#E7E1D6]">
              <p className="text-[#0B3D2E]/50 text-[10px] mb-1">平均先验</p>
              <p className="text-[#8B6914] text-xl font-light">
                {historyData.data.summary.average_prior}%
              </p>
            </div>
            <div className="bg-[#FFFDF8] rounded-2xl p-4 text-center border border-[#E7E1D6]">
              <p className="text-[#0B3D2E]/50 text-[10px] mb-1">平均后验</p>
              <p className="text-[#5A7A4A] text-xl font-light">
                {historyData.data.summary.average_posterior}%
              </p>
            </div>
            <div className="bg-[#FFFDF8] rounded-2xl p-4 text-center border border-[#E7E1D6]">
              <p className="text-[#0B3D2E]/50 text-[10px] mb-1">平均降低</p>
              <p className="text-[#0B3D2E] text-xl font-light">
                {historyData.data.summary.average_reduction}%
              </p>
            </div>
          </motion.section>
        )}

        {/* 焦虑趋势 */}
        <motion.section 
          className="bg-[#FFFDF8] rounded-2xl p-5 mb-6 border border-[#E7E1D6]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#5A7A4A]" />
              <h2 className="text-sm font-medium text-[#0B3D2E]">焦虑趋势</h2>
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
                <span className="text-[#9CAF88]">📈 你的焦虑正在改善</span>
              )}
              {historyData.data.summary.trend === 'stable' && (
                <span className="text-[#0B3D2E]/60">📊 你的焦虑保持稳定</span>
              )}
              {historyData.data.summary.trend === 'worsening' && (
                <span className="text-[#C4A77D]">💪 继续收集证据，你会好起来的</span>
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
          className="bg-[#9CAF88]/5 rounded-2xl p-5 border border-[#9CAF88]/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-sm font-medium text-[#0B3D2E] mb-2">什么是认知天平？</h3>
          <p className="text-xs text-[#0B3D2E]/60 leading-relaxed">
            认知天平基于贝叶斯定理，用你的生理数据（HRV）和科学研究来校准主观恐惧。
            焦虑往往会放大我们对风险的感知，而数学真相能帮你看清实际概率。
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
