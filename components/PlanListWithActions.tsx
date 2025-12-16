'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generatePlanName, type PersonalizedPlanName } from '@/lib/plan-naming';
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
function generateSchedule(plan: Plan, language: 'zh' | 'en' = 'zh'): ScheduleDay[] {
  const planType = plan.plan_type || 'general';

  const scheduleTemplatesZh: Record<string, ScheduleDay[]> = {
    exercise: [
      {
        day: 1, title: '热身启动日', items: [
          { time: '07:00', activity: '晨起空腹喝水 300ml', type: 'habit', completed: false },
          { time: '07:30', activity: '轻度拉伸 10分钟', type: 'exercise', completed: false },
          { time: '12:00', activity: '午餐：高蛋白低碳水', type: 'meal', completed: false },
          { time: '18:00', activity: 'Zone 2 有氧运动 30分钟', type: 'exercise', completed: false },
        ]
      },
    ],
    sleep: [
      {
        day: 1, title: '睡眠重置日', items: [
          { time: '21:00', activity: '关闭电子设备蓝光', type: 'habit', completed: false },
          { time: '21:30', activity: '温水泡脚 15分钟', type: 'wellness', completed: false },
          { time: '22:00', activity: '深呼吸放松练习', type: 'wellness', completed: false },
          { time: '22:30', activity: '准时入睡', type: 'habit', completed: false },
        ]
      },
    ],
  };

  const scheduleTemplatesEn: Record<string, ScheduleDay[]> = {
    exercise: [
      {
        day: 1, title: 'Warm-up Day', items: [
          { time: '07:00', activity: 'Morning water 300ml on empty stomach', type: 'habit', completed: false },
          { time: '07:30', activity: 'Light stretching 10 min', type: 'exercise', completed: false },
          { time: '12:00', activity: 'Lunch: High protein, low carb', type: 'meal', completed: false },
          { time: '18:00', activity: 'Zone 2 cardio 30 min', type: 'exercise', completed: false },
        ]
      },
    ],
    sleep: [
      {
        day: 1, title: 'Sleep Reset Day', items: [
          { time: '21:00', activity: 'Turn off blue light devices', type: 'habit', completed: false },
          { time: '21:30', activity: 'Warm foot bath 15 min', type: 'wellness', completed: false },
          { time: '22:00', activity: 'Deep breathing relaxation', type: 'wellness', completed: false },
          { time: '22:30', activity: 'Sleep on time', type: 'habit', completed: false },
        ]
      },
    ],
  };

  const defaultScheduleZh: ScheduleDay[] = [
    {
      day: 1, title: '启动日', items: [
        { time: '07:00', activity: '晨起喝水 300ml，唤醒身体', type: 'habit', completed: false },
        { time: '07:30', activity: '轻度活动 10分钟', type: 'exercise', completed: false },
        { time: '12:00', activity: '均衡午餐，细嚼慢咽', type: 'meal', completed: false },
        { time: '18:00', activity: '傍晚散步 20分钟', type: 'exercise', completed: false },
        { time: '22:00', activity: '放下手机，准备入睡', type: 'habit', completed: false },
      ]
    },
    {
      day: 2, title: '巩固日', items: [
        { time: '07:00', activity: '晨起喝水 + 简单拉伸', type: 'habit', completed: false },
        { time: '08:00', activity: '营养早餐，蛋白质优先', type: 'meal', completed: false },
        { time: '18:00', activity: '运动时间 30分钟', type: 'exercise', completed: false },
        { time: '21:00', activity: '睡前放松，深呼吸练习', type: 'wellness', completed: false },
      ]
    },
  ];

  const defaultScheduleEn: ScheduleDay[] = [
    {
      day: 1, title: 'Launch Day', items: [
        { time: '07:00', activity: 'Morning water 300ml, wake up body', type: 'habit', completed: false },
        { time: '07:30', activity: 'Light activity 10 min', type: 'exercise', completed: false },
        { time: '12:00', activity: 'Balanced lunch, eat slowly', type: 'meal', completed: false },
        { time: '18:00', activity: 'Evening walk 20 min', type: 'exercise', completed: false },
        { time: '22:00', activity: 'Put down phone, prepare for sleep', type: 'habit', completed: false },
      ]
    },
    {
      day: 2, title: 'Consolidation Day', items: [
        { time: '07:00', activity: 'Morning water + light stretching', type: 'habit', completed: false },
        { time: '08:00', activity: 'Nutritious breakfast, protein first', type: 'meal', completed: false },
        { time: '18:00', activity: 'Exercise time 30 min', type: 'exercise', completed: false },
        { time: '21:00', activity: 'Pre-sleep relaxation, deep breathing', type: 'wellness', completed: false },
      ]
    },
  ];

  const scheduleTemplates = language === 'en' ? scheduleTemplatesEn : scheduleTemplatesZh;
  const defaultSchedule = language === 'en' ? defaultScheduleEn : defaultScheduleZh;

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
  const { t, language } = useI18n();
  const normalizedLanguage: 'zh' | 'en' = language === 'en' ? 'en' : 'zh';
  const locale = language === 'en' ? 'en-US' : language === 'zh-TW' ? 'zh-TW' : 'zh-CN';
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
        language: normalizedLanguage,
      });
    });
    return names;
  }, [plans, normalizedLanguage]);

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
    if (!confirm(t('plans.confirmDelete'))) return;
    try {
      setDeletingPlanId(planId);
      const response = await fetch(`/api/plans/${planId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(t('plans.deleteFailed'));
      setPlans(prev => prev.filter(p => p.id !== planId));
      onPlanDeleted?.();
    } catch (error) {
      console.error('Delete plan failed:', error);
      alert(t('plans.deleteFailedRetry'));
    } finally {
      setDeletingPlanId(null);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, { icon: string; color: string; border: string }> = {
      exercise: { icon: '🏃', color: 'bg-[#0B3D2E]/5 text-[#0B3D2E]', border: 'border-[#0B3D2E]/20' },
      meal: { icon: '🥗', color: 'bg-[#9CAF88]/10 text-[#5F7448]', border: 'border-[#9CAF88]/30' },
      habit: { icon: '✨', color: 'bg-amber-50 text-amber-900', border: 'border-amber-200' },
      wellness: { icon: '🧘', color: 'bg-blue-50 text-blue-900', border: 'border-blue-100' },
    };
    return icons[type] || { icon: '📋', color: 'bg-gray-50 text-gray-900', border: 'border-gray-200' };
  };

  if (plans.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-[#E7E1D6] rounded-xl bg-[#FAF6EF]/30">
        <div className="text-6xl mb-4 opacity-50">📋</div>
        <h3 className="text-lg font-bold text-[#0B3D2E] mb-2">{t('plans.noPlans')}</h3>
        <p className="text-sm text-[#0B3D2E]/60 max-w-sm mx-auto">{t('plans.noPlansHint')}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <AnimatePresence mode="popLayout">
        {plans.map((plan) => {
          const isExpanded = expandedPlanIds.has(plan.id);
          const isDeleting = deletingPlanId === plan.id;
          const personalizedName = personalizedNames[plan.id];
          const schedule = generateSchedule(plan, normalizedLanguage);

          return (
            <motion.div
              key={plan.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group bg-white rounded-xl border border-[#E7E1D6] hover:border-[#0B3D2E]/30 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
            >

              {/* Card Header - Clickable */}
              <div
                className="p-6 cursor-pointer hover:bg-[#FAF6EF]/30 transition-colors relative"
                onClick={() => toggleExpand(plan.id)}
              >
                <div className="flex items-start gap-5">
                  {/* Icon Box */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-[#FAF6EF] border border-[#E7E1D6] flex items-center justify-center text-2xl shadow-sm z-10">
                    {personalizedName?.emoji || '📋'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="text-xl font-serif font-bold text-[#0B3D2E] tracking-tight">
                        {personalizedName?.title || plan.title}
                      </h3>
                      {plan.status === 'active' && (
                        <span className="px-2 py-0.5 rounded-full bg-[#0B3D2E] text-white text-[10px] font-bold uppercase tracking-wider">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    {personalizedName?.subtitle && (
                      <p className="text-sm font-medium text-[#9CAF88] mb-2 uppercase tracking-wide text-[10px]">
                        {personalizedName.subtitle}
                      </p>
                    )}

                    {!isExpanded && (
                      <p className="text-sm text-[#0B3D2E]/60 line-clamp-2 max-w-2xl leading-relaxed">
                        {typeof plan.content.description === 'string' ? plan.content.description : ''}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs font-medium text-[#0B3D2E]/40 mt-3 pt-3 border-t border-[#E7E1D6]/50 w-full max-w-sm">
                      <div className="flex items-center gap-1">
                        <span>CREATED</span>
                        <span className="text-[#0B3D2E]">{new Date(plan.created_at).toLocaleDateString(locale)}</span>
                      </div>
                      <div className="w-px h-3 bg-[#E7E1D6]" />
                      <div className="flex items-center gap-1">
                        <span>DIFFICULTY</span>
                        <span className="text-[#0B3D2E]">{plan.difficulty || 3}/5</span>
                      </div>
                    </div>
                  </div>

                  {/* Expand Arrow */}
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-[#0B3D2E]/30 group-hover:text-[#0B3D2E] transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.div>
                </div>
              </div>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 pt-0 bg-[#FAF6EF]/30 border-t border-[#E7E1D6]">

                      {/* Description Section */}
                      {plan.content?.description && (
                        <div className="my-6 p-5 bg-white border border-[#E7E1D6] rounded-xl relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-[#0B3D2E]" />
                          <h4 className="flex items-center gap-2 text-xs font-bold text-[#0B3D2E]/40 uppercase tracking-widest mb-3">
                            <span className="w-2 h-2 rounded-full bg-[#0B3D2E]" />
                            Protocol Overview
                          </h4>
                          <p className="text-[#0B3D2E]/80 leading-relaxed font-serif text-lg">
                            {typeof plan.content.description === 'string' ? plan.content.description : JSON.stringify(plan.content, null, 2)}
                          </p>
                        </div>
                      )}

                      {/* Schedule Timeline */}
                      <div className="mb-8">
                        <h4 className="flex items-center gap-2 text-xs font-bold text-[#0B3D2E]/40 uppercase tracking-widest mb-4">
                          <span className="w-2 h-2 rounded-full bg-[#0B3D2E]" />
                          {t('plans.dailySchedule')}
                        </h4>

                        <div className="grid gap-4">
                          {schedule.map((day) => (
                            <div key={day.day} className="bg-white rounded-xl border border-[#E7E1D6] overflow-hidden">
                              <div className="px-4 py-3 bg-[#FAF6EF] border-b border-[#E7E1D6] flex justify-between items-center">
                                <span className="font-serif font-bold text-[#0B3D2E]">Day {day.day} — {day.title}</span>
                              </div>
                              <div className="p-2">
                                {day.items.map((item, idx) => {
                                  const itemKey = `${day.day}-${idx}`;
                                  const isCompleted = scheduleCompletions[plan.id]?.[itemKey] || false;
                                  const typeInfo = getTypeIcon(item.type);

                                  return (
                                    <div
                                      key={idx}
                                      onClick={() => toggleScheduleItem(plan.id, itemKey)}
                                      className={`
                                        group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all mb-1 last:mb-0
                                        ${isCompleted ? 'bg-[#0B3D2E]/5 opacity-60' : 'hover:bg-[#FAF6EF]'}
                                      `}
                                    >
                                      {/* Checkbox */}
                                      <div className={`
                                         flex-shrink-0 w-5 h-5 rounded border transition-all flex items-center justify-center
                                         ${isCompleted ? 'bg-[#0B3D2E] border-[#0B3D2E]' : 'border-[#E7E1D6] bg-white group-hover:border-[#0B3D2E]'}
                                      `}>
                                        {isCompleted && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                      </div>

                                      {/* Time & Icon */}
                                      <div className="flex flex-col items-center min-w-[3rem]">
                                        <span className="text-[10px] font-mono text-[#0B3D2E]/40 font-bold">{item.time}</span>
                                      </div>

                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${typeInfo.color} ${typeInfo.border} border`}>
                                        {typeInfo.icon}
                                      </div>

                                      {/* Text */}
                                      <span className={`text-sm font-medium ${isCompleted ? 'line-through text-[#0B3D2E]/40' : 'text-[#0B3D2E]'}`}>
                                        {item.activity}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end pt-4 border-t border-[#E7E1D6]">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(plan.id); }}
                          disabled={isDeleting}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-rose-700 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isDeleting ? (
                            <span className="animate-pulse">{t('plans.deleting')}</span>
                          ) : (
                            <>

                              <span>{t('plans.deletePlan')}</span>
                            </>
                          )}
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
