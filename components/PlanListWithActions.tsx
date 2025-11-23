'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Plan {
  id: string;
  title: string;
  content: any;
  plan_type: string;
  difficulty: number;
  status: string;
  created_at: string;
}

interface PlanListWithActionsProps {
  initialPlans: Plan[];
  onPlanDeleted?: () => void;
}

export default function PlanListWithActions({ initialPlans, onPlanDeleted }: PlanListWithActionsProps) {
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [expandedPlanIds, setExpandedPlanIds] = useState<Set<string>>(new Set());
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  const toggleExpand = (planId: string) => {
    setExpandedPlanIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(planId)) {
        newSet.delete(planId);
      } else {
        newSet.add(planId);
      }
      return newSet;
    });
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('确定要删除这个方案吗？')) {
      return;
    }

    try {
      setDeletingPlanId(planId);
      
      const response = await fetch(`/api/plans/${planId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('删除失败');
      }

      // 从列表中移除
      setPlans(prev => prev.filter(p => p.id !== planId));
      
      // 通知父组件
      onPlanDeleted?.();
      
    } catch (error) {
      console.error('删除方案失败:', error);
      alert('删除失败，请重试');
    } finally {
      setDeletingPlanId(null);
    }
  };

  const getPlanTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      exercise: '🏃',
      diet: '🥗',
      sleep: '😴',
      stress: '🧘',
      social: '👥',
      hobby: '🎨',
    };
    return icons[type] || '📋';
  };

  const getDifficultyStars = (difficulty: number) => {
    return '⭐'.repeat(difficulty || 3);
  };

  if (plans.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-lg font-semibold text-[#0B3D2E] mb-2">
          还没有计划
        </h3>
        <p className="text-sm text-[#0B3D2E]/60">
          与AI助理对话，让它为你生成个性化的健康方案
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {plans.map((plan) => {
          const isExpanded = expandedPlanIds.has(plan.id);
          const isDeleting = deletingPlanId === plan.id;
          
          return (
            <motion.div
              key={plan.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="bg-white rounded-xl border border-[#E7E1D6] overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* 头部 - 可点击展开 */}
              <div
                className="p-4 cursor-pointer hover:bg-[#FAF6EF] transition-colors"
                onClick={() => toggleExpand(plan.id)}
              >
                <div className="flex items-start gap-4">
                  {/* 类型图标 */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#0B3D2E]/10 flex items-center justify-center text-2xl">
                    {getPlanTypeIcon(plan.plan_type)}
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-[#0B3D2E]">
                        {plan.title}
                      </h3>
                      {plan.difficulty && (
                        <span className="text-xs">
                          {getDifficultyStars(plan.difficulty)}
                        </span>
                      )}
                    </div>
                    
                    {/* 简介 */}
                    {!isExpanded && plan.content?.description && (
                      <p className="text-sm text-[#0B3D2E]/70 line-clamp-2">
                        {typeof plan.content.description === 'string' 
                          ? plan.content.description 
                          : ''}
                      </p>
                    )}

                    {/* 底部信息 */}
                    <div className="flex items-center gap-4 text-xs text-[#0B3D2E]/60 mt-2">
                      <span>
                        创建于 {new Date(plan.created_at).toLocaleDateString('zh-CN')}
                      </span>
                      {plan.status === 'active' && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                          进行中
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 展开图标 */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-[#0B3D2E]/60"
                    >
                      ▼
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* 展开内容 */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-2 border-t border-[#E7E1D6] bg-[#FAF6EF]/50">
                      {/* 完整描述 */}
                      {plan.content?.description && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-[#0B3D2E] mb-2">方案详情</h4>
                          <p className="text-sm text-[#0B3D2E]/80 whitespace-pre-wrap">
                            {typeof plan.content.description === 'string' 
                              ? plan.content.description 
                              : JSON.stringify(plan.content, null, 2)}
                          </p>
                        </div>
                      )}

                      {/* 操作按钮 */}
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(plan.id);
                          }}
                          disabled={isDeleting}
                          className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isDeleting ? '删除中...' : '🗑️ 删除方案'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
