'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePlans } from '@/hooks/domain/usePlans';

interface PlanStats {
  todayPlans: {
    total: number;
    completed: number;
  };
  weeklyCompletion: number;
  avgStress: number;
  avgSleep: number;
  recentPlans: Array<{
    id: string;
    title: string;
    plan_type: string;
    difficulty: number;
  }>;
}

export default function PlanStatsPanel() {
  const [stats, setStats] = useState<PlanStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getStatsSummary } = usePlans();

  const loadStats = useCallback(async () => {
    try {
      const statsResult = await getStatsSummary(7);
      if (statsResult) {
        const summary = statsResult.summary || {};
        const plans = statsResult.plans || [];

        setStats({
          todayPlans: {
            total: plans.length,
            completed: summary.total_completions || 0,
          },
          weeklyCompletion: summary.completion_rate || 0,
          avgStress: 3.5, // TODO: 从用户数据获取
          avgSleep: 7.2, // TODO: 从用户数据获取
          recentPlans: plans.slice(0, 3),
        });
      }
    } catch (error) {
      console.error('❌ 加载统计数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getStatsSummary]);

  useEffect(() => {
    loadStats();
    
    // 每分钟刷新一次
    const interval = setInterval(() => {
      loadStats();
    }, 60000);
    
    // 监听全局事件，当保存新计划时自动刷新
    const handlePlanSaved = () => {
      console.log('🔔 PlanStatsPanel: 收到 planSaved 事件，刷新统计数据');
      loadStats();
    };
    
    window.addEventListener('planSaved', handlePlanSaved);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('planSaved', handlePlanSaved);
    };
  }, [loadStats]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'exercise':
        return '🏃';
      case 'diet':
        return '🥗';
      case 'sleep':
        return '😴';
      default:
        return '📋';
    }
  };

  const getStressColor = (stress: number) => {
    if (stress < 3) return 'text-green-600';
    if (stress < 4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSleepColor = (hours: number) => {
    if (hours >= 7) return 'text-green-600';
    if (hours >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-[#E7E1D6] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* 今日状态总览 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#0b3d2e] via-[#0a3427] to-[#06261c] rounded-2xl shadow-lg p-6 text-white"
      >
        <h3 className="text-lg font-semibold mb-4">📊 今日状态总览</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-sm text-white/70 mb-1">活跃计划</div>
            <div className="text-3xl font-bold">{stats.todayPlans.total}</div>
            <div className="text-xs text-white/60 mt-1">个方案</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-sm text-white/70 mb-1">今日完成</div>
            <div className="text-3xl font-bold">{stats.todayPlans.completed}</div>
            <div className="text-xs text-white/60 mt-1">次打卡</div>
          </div>
        </div>
      </motion.div>

      {/* 健康指标 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-[#E7E1D6] p-6"
      >
        <h3 className="text-lg font-semibold text-[#0B3D2E] mb-4">💚 健康指标</h3>
        <div className="space-y-4">
          {/* 七日完成率 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#0B3D2E]/70">七日完成率</span>
              <span className="text-lg font-bold text-[#0B3D2E]">
                {stats.weeklyCompletion.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-[#10B981] to-[#059669] h-2 rounded-full transition-all"
                style={{ width: `${stats.weeklyCompletion}%` }}
              />
            </div>
          </div>

          {/* 平均压力 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#0B3D2E]/70">平均压力</span>
              <span className={`text-lg font-bold ${getStressColor(stats.avgStress)}`}>
                {stats.avgStress.toFixed(1)}/5.0
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  stats.avgStress < 3
                    ? 'bg-green-500'
                    : stats.avgStress < 4
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${(stats.avgStress / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* 平均睡眠 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#0B3D2E]/70">平均睡眠</span>
              <span className={`text-lg font-bold ${getSleepColor(stats.avgSleep)}`}>
                {stats.avgSleep.toFixed(1)}h
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  stats.avgSleep >= 7
                    ? 'bg-green-500'
                    : stats.avgSleep >= 6
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${(stats.avgSleep / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* 计划表快览 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm border border-[#E7E1D6] p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#0B3D2E]">📋 计划表</h3>
          <Link
            href="/plans"
            className="text-sm text-[#0B3D2E]/60 hover:text-[#0B3D2E] transition-colors"
          >
            查看全部 →
          </Link>
        </div>

        {stats.recentPlans.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🎯</div>
            <p className="text-sm text-[#0B3D2E]/60">还没有计划</p>
            <p className="text-xs text-[#0B3D2E]/40 mt-1">与AI对话生成方案</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentPlans.map((plan) => (
              <div
                key={plan.id}
                className="flex items-center gap-3 p-3 bg-[#FAF6EF] rounded-lg hover:bg-[#F5F0E7] transition-colors"
              >
                <div className="text-2xl">{getTypeIcon(plan.plan_type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#0B3D2E] truncate">
                    {plan.title}
                  </div>
                  <div className="text-xs text-[#0B3D2E]/60 mt-0.5">
                    {'⭐'.repeat(plan.difficulty || 3)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* 快捷操作 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm border border-[#E7E1D6] p-6"
      >
        <h3 className="text-lg font-semibold text-[#0B3D2E] mb-4">⚡ 快捷操作</h3>
        <div className="space-y-2">
          <Link
            href="/plans"
            className="block w-full text-left px-4 py-3 bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] text-white rounded-lg hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-2">
              <span>📊</span>
              <span className="text-sm font-medium">查看完整计划表</span>
            </div>
          </Link>
          <button
            onClick={loadStats}
            className="block w-full text-left px-4 py-3 bg-[#FAF6EF] text-[#0B3D2E] rounded-lg hover:bg-[#F5F0E7] transition-colors"
          >
            <div className="flex items-center gap-2">
              <span>🔄</span>
              <span className="text-sm font-medium">刷新数据</span>
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
