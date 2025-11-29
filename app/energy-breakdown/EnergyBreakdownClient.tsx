'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Moon, Activity, Brain, Heart, CheckCircle2, Info, TrendingUp } from 'lucide-react';
import { calculateEnergyLevel, convertLogToEnergyInput, getEnergyLabel, EnergyBreakdown } from '@/lib/energy-calculator';
import Link from 'next/link';

interface EnergyBreakdownClientProps {
  latestLog: any | null;
}

export default function EnergyBreakdownClient({ latestLog }: EnergyBreakdownClientProps) {
  const energyData = useMemo(() => {
    const input = convertLogToEnergyInput(latestLog);
    const breakdown = calculateEnergyLevel(input);
    const label = getEnergyLabel(breakdown.totalScore);
    return { breakdown, label, hasData: latestLog !== null };
  }, [latestLog]);

  const { breakdown, label, hasData } = energyData;

  // 因素图标映射
  const factorIcons = {
    sleep: <Moon className="w-5 h-5" />,
    exercise: <Activity className="w-5 h-5" />,
    stress: <Brain className="w-5 h-5" />,
    recovery: <Heart className="w-5 h-5" />,
    habits: <CheckCircle2 className="w-5 h-5" />,
  };

  // 因素名称映射
  const factorNames = {
    sleep: '睡眠质量',
    exercise: '运动状态',
    stress: '压力水平',
    recovery: '恢复能力',
    habits: '习惯完成',
  };

  // 获取分数对应的颜色
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50';
    if (score >= 60) return 'text-[#0B3D2E] bg-[#F2F7F5]';
    if (score >= 40) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  // 获取进度条颜色
  const getBarColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-[#0B3D2E]';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* 总分卡片 */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-8 text-center"
      >
        <div className="mb-4">
          <span className="text-6xl font-bold text-[#0B3D2E]">
            {breakdown.totalScore}
          </span>
          <span className="text-2xl text-[#0B3D2E]/60 ml-1">%</span>
        </div>
        
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getScoreColor(breakdown.totalScore)}`}>
          <TrendingUp className="w-4 h-4" />
          <span className="font-medium">{label.label}</span>
        </div>

        {!hasData && (
          <div className="mt-4 p-4 bg-amber-50 rounded-2xl">
            <div className="flex items-start gap-2 text-amber-800">
              <Info className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="text-left">
                <p className="font-medium">暂无健康数据</p>
                <p className="text-sm mt-1">
                  当前显示的是默认值。
                  <Link href="/assistant?panel=daily" className="underline ml-1">
                    记录今日数据
                  </Link>
                  后可查看真实能量值。
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.section>

      {/* 计算方法说明 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-3xl p-6"
      >
        <h2 className="text-lg font-semibold text-[#0B3D2E] mb-3">计算方法</h2>
        <p className="text-sm text-[#0B3D2E]/70 leading-relaxed">
          能量值基于您的睡眠、运动、压力、恢复能力和习惯完成情况综合计算。
          每个因素都有不同的权重，反映其对整体健康状态的影响程度。
        </p>
        <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs">
          <div className="p-2 bg-[#F2F7F5] rounded-lg">
            <div className="font-bold text-[#0B3D2E]">30%</div>
            <div className="text-[#0B3D2E]/60">睡眠</div>
          </div>
          <div className="p-2 bg-[#F2F7F5] rounded-lg">
            <div className="font-bold text-[#0B3D2E]">20%</div>
            <div className="text-[#0B3D2E]/60">运动</div>
          </div>
          <div className="p-2 bg-[#F2F7F5] rounded-lg">
            <div className="font-bold text-[#0B3D2E]">20%</div>
            <div className="text-[#0B3D2E]/60">压力</div>
          </div>
          <div className="p-2 bg-[#F2F7F5] rounded-lg">
            <div className="font-bold text-[#0B3D2E]">15%</div>
            <div className="text-[#0B3D2E]/60">恢复</div>
          </div>
          <div className="p-2 bg-[#F2F7F5] rounded-lg">
            <div className="font-bold text-[#0B3D2E]">15%</div>
            <div className="text-[#0B3D2E]/60">习惯</div>
          </div>
        </div>
      </motion.section>

      {/* 各因素详情 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <h2 className="text-lg font-semibold text-[#0B3D2E] px-2">各项指标详情</h2>
        
        {(Object.keys(breakdown.factors) as Array<keyof typeof breakdown.factors>).map((key, index) => {
          const factor = breakdown.factors[key];
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="glass-card rounded-2xl p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${getScoreColor(factor.score)}`}>
                    {factorIcons[key]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0B3D2E]">{factorNames[key]}</h3>
                    <p className="text-xs text-[#0B3D2E]/50">权重 {Math.round(factor.weight * 100)}%</p>
                  </div>
                </div>
                <div className={`text-2xl font-bold ${factor.score >= 60 ? 'text-[#0B3D2E]' : factor.score >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                  {factor.score}
                </div>
              </div>
              
              {/* 进度条 */}
              <div className="h-2 bg-[#E7E1D6] rounded-full overflow-hidden mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${factor.score}%` }}
                  transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
                  className={`h-full rounded-full ${getBarColor(factor.score)}`}
                />
              </div>
              
              {/* 描述 */}
              <p className="text-sm text-[#0B3D2E]/70">{factor.description}</p>
            </motion.div>
          );
        })}
      </motion.section>

      {/* 改善建议 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="glass-card rounded-3xl p-6"
      >
        <h2 className="text-lg font-semibold text-[#0B3D2E] mb-4">改善建议</h2>
        <div className="space-y-3">
          {breakdown.totalScore < 80 && (
            <>
              {breakdown.factors.sleep.score < 70 && (
                <div className="flex items-start gap-3 p-3 bg-[#F2F7F5] rounded-xl">
                  <Moon className="w-5 h-5 text-[#0B3D2E] mt-0.5" />
                  <div>
                    <p className="font-medium text-[#0B3D2E]">优化睡眠</p>
                    <p className="text-sm text-[#0B3D2E]/70">尝试保持 7-8 小时的睡眠时长，睡前避免蓝光暴露</p>
                  </div>
                </div>
              )}
              {breakdown.factors.exercise.score < 70 && (
                <div className="flex items-start gap-3 p-3 bg-[#F2F7F5] rounded-xl">
                  <Activity className="w-5 h-5 text-[#0B3D2E] mt-0.5" />
                  <div>
                    <p className="font-medium text-[#0B3D2E]">增加运动</p>
                    <p className="text-sm text-[#0B3D2E]/70">每天 30-60 分钟的中等强度运动可显著提升能量</p>
                  </div>
                </div>
              )}
              {breakdown.factors.stress.score < 70 && (
                <div className="flex items-start gap-3 p-3 bg-[#F2F7F5] rounded-xl">
                  <Brain className="w-5 h-5 text-[#0B3D2E] mt-0.5" />
                  <div>
                    <p className="font-medium text-[#0B3D2E]">管理压力</p>
                    <p className="text-sm text-[#0B3D2E]/70">尝试冥想、深呼吸或户外散步来缓解压力</p>
                  </div>
                </div>
              )}
            </>
          )}
          {breakdown.totalScore >= 80 && (
            <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-medium text-emerald-800">状态极佳！</p>
                <p className="text-sm text-emerald-700">继续保持当前的健康习惯，你做得很棒！</p>
              </div>
            </div>
          )}
        </div>
      </motion.section>

      {/* 记录数据按钮 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="pt-4"
      >
        <Link
          href="/assistant?panel=daily"
          className="block w-full py-4 bg-[#0B3D2E] text-white text-center rounded-2xl font-semibold hover:bg-[#0B3D2E]/90 transition-colors"
        >
          记录今日数据
        </Link>
      </motion.div>
    </main>
  );
}
