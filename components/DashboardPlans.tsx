'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';

interface Plan {
  id: string;
  title: string;
  content: any;
  plan_type: string;
  difficulty: number;
  status: string;
  created_at: string;
}

interface DashboardPlansProps {
  userId?: string;
}

export default function DashboardPlans({ }: DashboardPlansProps) {
  const { t, language } = useI18n();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate] = useState(new Date());
  const [completingPlanId, setCompletingPlanId] = useState<string | null>(null);

  // 加载计划列表
  useEffect(() => {
    loadPlans();

    // 每30秒自动刷新一次
    const interval = setInterval(() => {
      loadPlans();
    }, 30000);

    // 监听全局事件，当保存新计划时自动刷新
    const handlePlanSaved = (event: Event) => {
      console.log('🔔 DashboardPlans: 收到 planSaved 事件，刷新计划列表');
      loadPlans();
    };

    window.addEventListener('planSaved', handlePlanSaved);

    return () => {
      clearInterval(interval);
      window.removeEventListener('planSaved', handlePlanSaved);
    };
  }, []);

  const loadPlans = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/plans/list?status=active&limit=20');

      const result = await response.json();

      if (result.success) {
        const plansList = result.data?.plans || [];
        setPlans(plansList);
      } else {
        console.error('❌ 加载计划失败:', result.error);
        setPlans([]);
      }
    } catch (error) {
      console.error('❌ 加载计划失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 记录计划完成情况
  const handleCompletePlan = async (planId: string) => {
    try {
      setCompletingPlanId(planId);

      const response = await fetch('/api/plans/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          status: 'completed',
          completionDate: new Date().toISOString().split('T')[0],
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '记录失败');
      }

      console.log('✅ 计划完成记录成功');

    } catch (error) {
      console.error('❌ 记录完成失败:', error);
      alert(t('settings.saveFail'));
    } finally {
      setCompletingPlanId(null);
    }
  };

  // 格式化日期为iOS风格
  const formatDate = (date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
      return t('dashboard.plans.today');
    }

    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  // 获取计划类型图标
  const getPlanTypeIcon = (type: string) => {
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

  // 获取难度星级
  const getDifficultyStars = (difficulty: number) => {
    return '⭐'.repeat(difficulty || 3);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-[#E7E1D6] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-[#E7E1D6] p-8 text-center">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-lg font-semibold text-[#0B3D2E] mb-2">
          {t('dashboard.plans.emptyTitle')}
        </h3>
        <p className="text-sm text-[#0B3D2E]/60 mb-4">
          {t('dashboard.plans.emptyDesc')}
        </p>
        <button
          onClick={() => {/* 打开AI助理 */ }}
          className="px-6 py-2 bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] text-white rounded-lg hover:shadow-lg transition-all"
        >
          {t('dashboard.plans.startChat')}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E7E1D6] overflow-hidden">
      {/* 头部 - Scientific Premium 风格 */}
      <div className="bg-white/50 backdrop-blur-sm border-b border-[#E7E1D6] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0B3D2E]">{t('dashboard.plans.title')}</h2>
            <p className="text-xs text-[#0B3D2E]/60 mt-0.5 font-mono uppercase tracking-wider">
              {formatDate(selectedDate)}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-baseline gap-1 justify-end">
              <span className="text-2xl font-bold text-[#0B3D2E]">{plans.length}</span>
              <span className="text-xs text-[#0B3D2E]/40 font-bold uppercase">{t('dashboard.plans.activeCount')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 计划列表 */}
      <div className="divide-y divide-[#E7E1D6]">
        <AnimatePresence>
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 hover:bg-[#FAF6EF] transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-4">
                {/* 类型图标 */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#0B3D2E]/10 flex items-center justify-center text-2xl">
                  {getPlanTypeIcon(plan.plan_type)}
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[#0B3D2E] truncate">
                      {plan.title}
                    </h3>
                    {plan.difficulty && (
                      <span className="text-xs">
                        {getDifficultyStars(plan.difficulty)}
                      </span>
                    )}
                  </div>

                  {/* 方案描述 */}
                  {plan.content?.description && (
                    <p className="text-sm text-[#0B3D2E]/70 line-clamp-2 mb-2">
                      {typeof plan.content.description === 'string'
                        ? plan.content.description.substring(0, 100) + (plan.content.description.length > 100 ? '...' : '')
                        : ''}
                    </p>
                  )}

                  {/* 底部信息 */}
                  <div className="flex items-center gap-4 text-xs text-[#0B3D2E]/60">
                    <span>
                      {t('dashboard.plans.created')} {new Date(plan.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN', { month: 'short', day: 'numeric' })}
                    </span>
                    {plan.status === 'active' && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                        {t('dashboard.plans.status.active')}
                      </span>
                    )}
                  </div>
                </div>

                {/* 勾选按钮 */}
                <div className="flex-shrink-0">
                  <button
                    className="w-8 h-8 rounded-full border-2 border-[#0B3D2E] hover:bg-[#0B3D2E] hover:text-white transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={completingPlanId === plan.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCompletePlan(plan.id);
                    }}
                  >
                    {completingPlanId === plan.id ? (
                      <span className="text-lg animate-spin">○</span>
                    ) : (
                      <span className="text-lg">✓</span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 底部操作 */}
      <div className="px-6 py-4 bg-[#FAF6EF] border-t border-[#E7E1D6]">
        <button
          onClick={loadPlans}
          className="w-full py-2 text-sm text-[#0B3D2E] hover:text-[#0B3D2E]/80 transition-colors"
        >
          {t('dashboard.plans.refresh')}
        </button>
      </div>
    </div>
  );
}
