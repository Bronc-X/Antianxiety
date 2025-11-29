'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generatePlanName, type PersonalizedPlanName } from '@/lib/plan-naming';

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

// 从内容中提取关注点
function extractConcernFromContent(content: any, title: string): string {
  const text = typeof content === 'string' ? content : JSON.stringify(content) + title;
  const keywords: Record<string, string> = {
    '减重': 'weight_loss', '减脂': 'fat_loss', '燃脂': 'fat_loss', '瘦身': 'weight_loss',
    '压力': 'stress_management', '焦虑': 'stress_management', '放松': 'stress_management',
    '睡眠': 'sleep_improvement', '失眠': 'sleep_improvement', '安眠': 'sleep_improvement',
    '能量': 'energy_boost', '精力': 'energy_boost', '疲劳': 'energy_boost', '活力': 'energy_boost',
    '增肌': 'muscle_gain', '肌肉': 'muscle_gain', '力量': 'strength',
  };
  for (const [keyword, concern] of Object.entries(keywords)) {
    if (text.includes(keyword)) return concern;
  }
  return 'general';
}

// 生成模拟日程表
function generateSchedule(plan: Plan): ScheduleDay[] {
  const planType = plan.plan_type || 'general';
  const scheduleTemplates: Record<string, ScheduleDay[]> = {
    exercise: [
      { day: 1, title: '热身启动日', items: [
        { time: '07:00', activity: '晨起空腹喝水 300ml', type: 'habit', completed: false },
        { time: '07:30', activity: '轻度拉伸 10分钟', type: 'exercise', completed: false },
        { time: '12:00', activity: '午餐：高蛋白低碳水', type: 'meal', completed: false },
        { time: '18:00', activity: 'Zone 2 有氧运动 30分钟', type: 'exercise', completed: false },
      ]},
      { day: 2, title: '核心激活日', items: [
        { time: '07:00', activity: '晨起空腹喝水 300ml', type: 'habit', completed: false },
        { time: '07:30', activity: '核心训练 15分钟', type: 'exercise', completed: false },
        { time: '12:00', activity: '午餐：均衡营养餐', type: 'meal', completed: false },
        { time: '18:00', activity: '快走或慢跑 25分钟', type: 'exercise', completed: false },
      ]},
    ],
    sleep: [
      { day: 1, title: '睡眠重置日', items: [
        { time: '21:00', activity: '关闭电子设备蓝光', type: 'habit', completed: false },
        { time: '21:30', activity: '温水泡脚 15分钟', type: 'wellness', completed: false },
        { time: '22:00', activity: '深呼吸放松练习', type: 'wellness', completed: false },
        { time: '22:30', activity: '准时入睡', type: 'habit', completed: false },
      ]},
    ],
    diet: [
      { day: 1, title: '饮食调整日', items: [
        { time: '07:30', activity: '早餐：鸡蛋+全麦面包+牛奶', type: 'meal', completed: false },
        { time: '10:00', activity: '加餐：坚果一小把', type: 'meal', completed: false },
        { time: '12:00', activity: '午餐：瘦肉+蔬菜+糙米', type: 'meal', completed: false },
        { time: '18:00', activity: '晚餐：清淡蛋白+大量蔬菜', type: 'meal', completed: false },
      ]},
    ],
  };

  // 默认通用日程
  const defaultSchedule: ScheduleDay[] = [
    { day: 1, title: '启动日', items: [
      { time: '07:00', activity: '晨起喝水 300ml，唤醒身体', type: 'habit', completed: false },
      { time: '07:30', activity: '轻度活动 10分钟', type: 'exercise', completed: false },
      { time: '12:00', activity: '均衡午餐，细嚼慢咽', type: 'meal', completed: false },
      { time: '15:00', activity: '下午茶时间，补充能量', type: 'wellness', completed: false },
      { time: '18:00', activity: '傍晚散步 20分钟', type: 'exercise', completed: false },
      { time: '22:00', activity: '放下手机，准备入睡', type: 'habit', completed: false },
    ]},
    { day: 2, title: '巩固日', items: [
      { time: '07:00', activity: '晨起喝水 + 简单拉伸', type: 'habit', completed: false },
      { time: '08:00', activity: '营养早餐，蛋白质优先', type: 'meal', completed: false },
      { time: '12:00', activity: '午餐后站立 10分钟', type: 'habit', completed: false },
      { time: '18:00', activity: '运动时间 30分钟', type: 'exercise', completed: false },
      { time: '21:00', activity: '睡前放松，深呼吸练习', type: 'wellness', completed: false },
    ]},
    { day: 3, title: '进阶日', items: [
      { time: '06:30', activity: '早起，享受晨光', type: 'habit', completed: false },
      { time: '07:00', activity: '晨间运动 20分钟', type: 'exercise', completed: false },
      { time: '12:00', activity: '健康午餐，控制碳水', type: 'meal', completed: false },
      { time: '15:00', activity: '工作间隙，起身活动', type: 'habit', completed: false },
      { time: '19:00', activity: '晚餐清淡，早点吃完', type: 'meal', completed: false },
      { time: '22:00', activity: '准时入睡，保证7小时', type: 'habit', completed: false },
    ]},
  ];

  return scheduleTemplates[planType] || defaultSchedule;
}

interface ScheduleItem {
  time: string;
  activity: string;
  type: 'exercise' | 'meal' | 'habit' | 'wellness';
  completed: boolean;
}

interface ScheduleDay {
  day: number;
  title: string;
  items: ScheduleItem[];
}

export default function PlanListWithActions({ initialPlans, onPlanDeleted }: PlanListWithActionsProps) {
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [expandedPlanIds, setExpandedPlanIds] = useState<Set<string>>(new Set());
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [scheduleCompletions, setScheduleCompletions] = useState<Record<string, Record<string, boolean>>>({});

  // 为每个计划生成个性化名称
  const personalizedNames = useMemo<Record<string, PersonalizedPlanName>>(() => {
    const names: Record<string, PersonalizedPlanName> = {};
    plans.forEach((plan, index) => {
      const concern = extractConcernFromContent(plan.content, plan.title);
      names[plan.id] = generatePlanName({
        primaryConcern: concern,
        difficulty: plan.difficulty?.toString(),
        planIndex: index,
      });
    });
    return names;
  }, [plans]);

  const toggleExpand = (planId: string) => {
    setExpandedPlanIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(planId)) newSet.delete(planId);
      else newSet.add(planId);
      return newSet;
    });
  };

  const toggleScheduleItem = (planId: string, itemKey: string) => {
    setScheduleCompletions(prev => ({
      ...prev,
      [planId]: { ...prev[planId], [itemKey]: !prev[planId]?.[itemKey] }
    }));
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('确定要删除这个方案吗？')) return;
    try {
      setDeletingPlanId(planId);
      const response = await fetch(`/api/plans/${planId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('删除失败');
      setPlans(prev => prev.filter(p => p.id !== planId));
      onPlanDeleted?.();
    } catch (error) {
      console.error('删除方案失败:', error);
      alert('删除失败，请重试');
    } finally {
      setDeletingPlanId(null);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, { icon: string; color: string }> = {
      exercise: { icon: '🏃', color: 'bg-blue-100 text-blue-700' },
      meal: { icon: '🥗', color: 'bg-green-100 text-green-700' },
      habit: { icon: '✨', color: 'bg-purple-100 text-purple-700' },
      wellness: { icon: '🧘', color: 'bg-pink-100 text-pink-700' },
    };
    return icons[type] || { icon: '📋', color: 'bg-gray-100 text-gray-700' };
  };

  if (plans.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-lg font-semibold text-[#0B3D2E] mb-2">还没有计划</h3>
        <p className="text-sm text-[#0B3D2E]/60">与AI助理对话，让它为你生成个性化的健康方案</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {plans.map((plan) => {
          const isExpanded = expandedPlanIds.has(plan.id);
          const isDeleting = deletingPlanId === plan.id;
          const personalizedName = personalizedNames[plan.id];
          const schedule = generateSchedule(plan);
          
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
              <div className="p-4 cursor-pointer hover:bg-[#FAF6EF] transition-colors" onClick={() => toggleExpand(plan.id)}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#0B3D2E]/10 to-[#0B3D2E]/5 flex items-center justify-center text-2xl">
                    {personalizedName?.emoji || '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-[#0B3D2E]">{personalizedName?.title || plan.title}</h3>
                      {plan.difficulty && <span className="text-xs">{'⭐'.repeat(plan.difficulty || 3)}</span>}
                    </div>
                    {personalizedName?.subtitle && (
                      <p className="text-xs text-[#0B3D2E]/60 mb-1">{personalizedName.subtitle}</p>
                    )}
                    {!isExpanded && plan.content?.description && (
                      <p className="text-sm text-[#0B3D2E]/70 line-clamp-2">
                        {typeof plan.content.description === 'string' ? plan.content.description : ''}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-[#0B3D2E]/60 mt-2">
                      <span>创建于 {new Date(plan.created_at).toLocaleDateString('zh-CN')}</span>
                      {plan.status === 'active' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          进行中
                        </span>
                      )}
                    </div>
                  </div>
                  <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }} className="text-[#0B3D2E]/60">▼</motion.div>
                </div>
              </div>

              {/* 展开内容 - 详细日程表 */}
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
                      {/* 方案描述 */}
                      {plan.content?.description && (
                        <div className="mb-4 p-3 bg-white rounded-lg border border-[#E7E1D6]">
                          <h4 className="text-sm font-semibold text-[#0B3D2E] mb-2">📝 方案概述</h4>
                          <p className="text-sm text-[#0B3D2E]/80 whitespace-pre-wrap">
                            {typeof plan.content.description === 'string' ? plan.content.description : JSON.stringify(plan.content, null, 2)}
                          </p>
                        </div>
                      )}

                      {/* 详细日程表 */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-[#0B3D2E] mb-3">📅 每日日程表</h4>
                        <div className="space-y-4">
                          {schedule.map((day) => (
                            <div key={day.day} className="bg-white rounded-lg border border-[#E7E1D6] overflow-hidden">
                              <div className="px-3 py-2 bg-gradient-to-r from-[#0B3D2E]/5 to-transparent border-b border-[#E7E1D6]">
                                <span className="text-sm font-medium text-[#0B3D2E]">Day {day.day}: {day.title}</span>
                              </div>
                              <div className="p-3 space-y-2">
                                {day.items.map((item, idx) => {
                                  const itemKey = `${day.day}-${idx}`;
                                  const isCompleted = scheduleCompletions[plan.id]?.[itemKey] || false;
                                  const typeInfo = getTypeIcon(item.type);
                                  return (
                                    <div
                                      key={idx}
                                      onClick={() => toggleScheduleItem(plan.id, itemKey)}
                                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                                        isCompleted ? 'bg-green-50 opacity-60' : 'hover:bg-[#FAF6EF]'
                                      }`}
                                    >
                                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                        isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300'
                                      }`}>
                                        {isCompleted && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>}
                                      </div>
                                      <span className="text-xs font-mono text-[#0B3D2E]/60 w-12">{item.time}</span>
                                      <span className={`text-lg ${typeInfo.color} w-6 h-6 rounded flex items-center justify-center text-sm`}>{typeInfo.icon}</span>
                                      <span className={`text-sm flex-1 ${isCompleted ? 'line-through text-[#0B3D2E]/40' : 'text-[#0B3D2E]'}`}>{item.activity}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex gap-2 pt-2 border-t border-[#E7E1D6]">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(plan.id); }}
                          disabled={isDeleting}
                          className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
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
