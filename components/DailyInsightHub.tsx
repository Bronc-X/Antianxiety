'use client';

import { useState, useRef, MouseEvent, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Brain, Moon, Sparkles, Activity, ExternalLink, ChevronRight, Shield, ClipboardList, Check, Zap, Clock, Wind, Dumbbell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// ConsensusMeter removed - we don't show fake consensus data
import { BrainLoader } from '@/components/lottie/BrainLoader';
import { useI18n } from '@/lib/i18n';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import { TaskSessionModal } from './TaskSessionModal';

type TabType = 'today' | 'questionnaire' | 'plan';
type IconName = 'clock' | 'moon' | 'wind' | 'dumbbell' | 'sparkles';
type TaskType = 'nsdr' | 'sleep' | 'breath' | 'stretch';

interface Task {
  id: string;
  title: string;
  duration: string;
  durationSeconds: number;
  iconName: IconName;
  category: 'rest' | 'sleep' | 'breath' | 'movement' | 'system';
  completed: boolean;
  description?: string;
}

// 问卷数据摘要类型
interface QuestionnaireSummary {
  sleepQuality?: number; // 0-4
  energyLevel?: number;  // 0-4
  stressLevel?: number;  // 0-4
  moodState?: number;    // 0-4
  focusAbility?: number; // 0-4
}

interface DailyInsightHubProps {
  todayTask?: {
    mode: 'low_energy' | 'balanced' | 'normal' | 'challenge';
    description: string;
    descriptionEn?: string;
  } | null;
  insight?: string | null;
  isLoading?: boolean;
  questionnaireCompleted?: boolean;
  onStartCalibration?: () => void;
  userId?: string;
  onQuestionnaireComplete?: () => void;
  stressLevel?: number;
  energyLevel?: number;
  onHintHover?: (hovering: boolean) => void;
}

// 固定内容区高度
const CONTENT_MIN_HEIGHT = 280;

// 抽卡效果 Hook
function useCardTilt() {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 500, damping: 50 });
  const mouseYSpring = useSpring(y, { stiffness: 500, damping: 50 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['12deg', '-12deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-12deg', '12deg']);

  const sheenX = useTransform(mouseXSpring, [-0.5, 0.5], ['0%', '100%']);
  const sheenY = useTransform(mouseYSpring, [-0.5, 0.5], ['0%', '100%']);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / rect.width - 0.5);
    y.set(mouseY / rect.height - 0.5);
  };

  const handleMouseLeave = () => { x.set(0); y.set(0); };

  return { ref, rotateX, rotateY, sheenX, sheenY, handleMouseMove, handleMouseLeave };
}

// 标签配置
const TABS: { id: TabType; labelEn: string; labelZh: string; icon: React.ReactNode }[] = [
  { id: 'today', labelEn: 'Today', labelZh: '今日', icon: <Brain className="w-4 h-4" /> },
  { id: 'questionnaire', labelEn: 'Check-in', labelZh: '问诊', icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'plan', labelEn: 'Plan', labelZh: '计划', icon: <Zap className="w-4 h-4" /> },
];

export function DailyInsightHub({
  todayTask,
  insight,
  isLoading = false,
  questionnaireCompleted: questionnaireCompletedProp = false,
  onStartCalibration,
  userId,
  onQuestionnaireComplete,
  stressLevel = 5,
  energyLevel = 5,
  onHintHover,
}: DailyInsightHubProps) {
  const { language } = useI18n();
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [questionnaireSummary, setQuestionnaireSummary] = useState<QuestionnaireSummary | undefined>();
  // 内部维护问诊完成状态，不依赖外部 prop
  const [questionnaireCompleted, setQuestionnaireCompleted] = useState(questionnaireCompletedProp);

  // 检查今日问诊是否已完成（从 localStorage 和数据库）
  useEffect(() => {
    const checkQuestionnaireCompletion = async () => {
      const today = new Date().toISOString().split('T')[0];

      // 先检查 localStorage
      const completedDate = localStorage.getItem('nma_questionnaire_date');
      if (completedDate === today) {
        setQuestionnaireCompleted(true);
        return;
      }

      // 从数据库检查
      if (userId) {
        try {
          const supabase = createClientSupabaseClient();
          const { data } = await supabase
            .from('daily_questionnaire_responses')
            .select('id')
            .eq('user_id', userId)
            .gte('created_at', `${today}T00:00:00`)
            .lt('created_at', `${today}T23:59:59`)
            .limit(1);

          if (data && data.length > 0) {
            localStorage.setItem('nma_questionnaire_date', today);
            setQuestionnaireCompleted(true);
          } else {
            setQuestionnaireCompleted(false);
          }
        } catch (err) {
          console.error('检查问诊状态失败:', err);
        }
      }
    };

    checkQuestionnaireCompletion();
  }, [userId]);

  // 获取今日问卷数据用于总结
  useEffect(() => {
    const fetchQuestionnaireSummary = async () => {
      if (!questionnaireCompleted) {
        setQuestionnaireSummary(undefined);
        return;
      }

      // 先尝试从 localStorage 获取
      const today = new Date().toISOString().split('T')[0];
      const cachedData = localStorage.getItem(`nma_questionnaire_summary_${today}`);
      if (cachedData) {
        try {
          setQuestionnaireSummary(JSON.parse(cachedData));
          return;
        } catch { }
      }

      // 从数据库获取
      if (userId) {
        try {
          const supabase = createClientSupabaseClient();
          const { data } = await supabase
            .from('daily_questionnaire_responses')
            .select('responses')
            .eq('user_id', userId)
            .gte('created_at', `${today}T00:00:00`)
            .lt('created_at', `${today}T23:59:59`)
            .order('created_at', { ascending: false })
            .limit(1);

          if (data && data.length > 0 && data[0].responses) {
            const responses = data[0].responses as Record<string, number>;
            const summary: QuestionnaireSummary = {
              sleepQuality: responses.sleep_quality,
              energyLevel: responses.morning_energy,
              stressLevel: responses.stress_level,
              moodState: responses.mood_state,
              focusAbility: responses.focus_ability,
            };
            setQuestionnaireSummary(summary);
            localStorage.setItem(`nma_questionnaire_summary_${today}`, JSON.stringify(summary));
          }
        } catch (err) {
          console.error('获取问卷数据失败:', err);
        }
      }
    };

    fetchQuestionnaireSummary();
  }, [questionnaireCompleted, userId]);

  // 切换到问卷 tab
  const handleGoToQuestionnaire = () => {
    setActiveTab('questionnaire');
  };

  // 问卷完成后的回调
  const handleQuestionnaireComplete = () => {
    setQuestionnaireCompleted(true);
    // 重新获取问卷摘要
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('nma_questionnaire_date', today);
    onQuestionnaireComplete?.();
  };

  const isLowEnergy = todayTask?.mode === 'low_energy';

  // 标签配置 - 墨绿、绿、湖绿三色系
  const tabConfig = [
    { id: 'today' as TabType, labelEn: 'Today', labelZh: '今日', icon: <Brain className="w-4 h-4" />, color: 'from-[#0B3D2E] to-[#1A5D45]', bgActive: 'bg-[#0B3D2E]' }, // 墨绿
    { id: 'questionnaire' as TabType, labelEn: 'Check-in', labelZh: '问诊', icon: <ClipboardList className="w-4 h-4" />, color: 'from-[#2E7D5A] to-[#4A9F7A]', bgActive: 'bg-[#2E7D5A]' }, // 绿
    { id: 'plan' as TabType, labelEn: 'Plan', labelZh: '计划', icon: <Zap className="w-4 h-4" />, color: 'from-[#5AAFA8] to-[#7ECEC8]', bgActive: 'bg-[#5AAFA8]' }, // 湖绿
  ];

  const activeConfig = tabConfig.find(t => t.id === activeTab) || tabConfig[0];

  return (
    <div className="w-full h-full">
      {/* 卡片式标签容器 - 固定高度匹配 FeatureCards */}
      <div className="relative h-full flex flex-col">
        {/* 顶部标签缺口 */}
        <div className="flex gap-1 mb-[-1px] relative z-10">
          {tabConfig.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2.5 rounded-t-xl flex items-center gap-2 transition-all duration-300 ${isActive
                    ? `${tab.bgActive} text-white shadow-lg`
                    : 'bg-white/60 text-gray-500 hover:bg-white/80 hover:text-gray-700'
                  }`}
                style={{
                  boxShadow: isActive ? '0 -4px 12px -2px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {tab.icon}
                <span className="text-xs font-bold uppercase tracking-wider">
                  {language === 'en' ? tab.labelEn : tab.labelZh}
                </span>
                {tab.id === 'questionnaire' && questionnaireCompleted && (
                  <Check className="w-3 h-3" />
                )}
              </button>
            );
          })}
        </div>

        {/* 主卡片 - flex-1 填充剩余高度 */}
        <div className="relative flex-1 rounded-[24px] rounded-tl-none overflow-hidden shadow-[0_12px_32px_-8px_rgba(0,0,0,0.12)]">
          {/* 全屏背景渐变 */}
          <div className={`absolute inset-0 bg-gradient-to-b ${activeConfig.color}`}>
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-4 -left-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />

            {/* 中央图标区 */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-60 h-60">
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <motion.div
                  key={activeTab}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center rotate-45"
                >
                  {activeTab === 'today' && (isLowEnergy ? <Moon className="w-10 h-10 text-[#0B3D2E] -rotate-45" /> : <Brain className="w-10 h-10 text-[#0B3D2E] -rotate-45" />)}
                  {activeTab === 'questionnaire' && <ClipboardList className="w-10 h-10 text-[#2E7D5A] -rotate-45" />}
                  {activeTab === 'plan' && <Zap className="w-10 h-10 text-[#5AAFA8] -rotate-45" />}
                </motion.div>
              </div>
              <motion.div
                className="absolute top-4 right-10 w-4 h-4 bg-white/25 rounded-full"
                animate={{ y: [-3, 3, -3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>

            {/* Badge */}
            <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/15 backdrop-blur-md rounded-full">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                {activeTab === 'today' && (language === 'en' ? 'AI Insight' : '今日洞察')}
                {activeTab === 'questionnaire' && (language === 'en' ? 'Daily Check-in' : '每日问诊')}
                {activeTab === 'plan' && (language === 'en' ? 'Daily Plan' : '今日计划')}
              </span>
            </div>
          </div>

          {/* 底部内容覆盖层 */}
          <div className={`absolute bottom-0 left-0 w-full p-4 pb-20 pt-16 bg-gradient-to-t ${activeTab === 'today' ? 'from-[#0B3D2E] via-[#0B3D2E]/90' :
              activeTab === 'questionnaire' ? 'from-[#2E7D5A] via-[#2E7D5A]/90' :
                'from-[#5AAFA8] via-[#5AAFA8]/90'
            } to-transparent text-white`}>
            <AnimatePresence mode="wait">
              {activeTab === 'today' && (
                <motion.div
                  key="today"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  <InsightPanelContent
                    todayTask={todayTask}
                    insight={insight}
                    isLoading={isLoading}
                    questionnaireCompleted={questionnaireCompleted}
                    questionnaireSummary={questionnaireSummary}
                    onGoToQuestionnaire={handleGoToQuestionnaire}
                    onHintHover={onHintHover}
                    language={language}
                  />
                </motion.div>
              )}
              {activeTab === 'questionnaire' && (
                <motion.div
                  key="questionnaire"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  <QuestionnairePanel userId={userId} onComplete={handleQuestionnaireComplete} />
                </motion.div>
              )}
              {activeTab === 'plan' && (
                <motion.div
                  key="plan"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  <PlanPanel stressLevel={stressLevel} energyLevel={energyLevel} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 固定底部按钮 - 仅在 today tab 显示 */}
          {activeTab === 'today' && !questionnaireCompleted && (
            <button
              onClick={handleGoToQuestionnaire}
              className="absolute bottom-5 left-5 right-5 py-3 bg-white text-[#0B3D2E] rounded-2xl font-bold text-sm shadow-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 z-20"
            >
              <ClipboardList className="w-4 h-4" />
              {language === 'en' ? 'Complete Check-in' : '完成问诊'}
            </button>
          )}
          {activeTab === 'today' && questionnaireCompleted && (
            <div className="absolute bottom-5 left-5 right-5 py-3 bg-white/20 text-white rounded-2xl font-medium text-sm flex items-center justify-center gap-2 z-20 backdrop-blur-sm">
              <Check className="w-4 h-4" />
              {language === 'en' ? 'All Set' : '状态已同步'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 今日洞察内容（不含顶部视觉区）
function InsightPanelContent({
  todayTask,
  insight,
  isLoading,
  questionnaireCompleted,
  questionnaireSummary,
  onGoToQuestionnaire,
  onHintHover,
  language
}: {
  todayTask?: { mode: 'low_energy' | 'balanced' | 'normal' | 'challenge'; description: string; descriptionEn?: string } | null;
  insight?: string | null;
  isLoading?: boolean;
  questionnaireCompleted?: boolean;
  questionnaireSummary?: QuestionnaireSummary;
  onGoToQuestionnaire?: () => void;
  onHintHover?: (hovering: boolean) => void;
  language: string;
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <BrainLoader />
        <p className="text-sm text-gray-500 mt-3">
          {language === 'en' ? 'AI analyzing...' : 'AI 分析中...'}
        </p>
      </div>
    );
  }

  if (!todayTask) {
    return (
      <div
        className="text-center py-6"
        onMouseEnter={() => onHintHover?.(true)}
        onMouseLeave={() => onHintHover?.(false)}
      >
        <p className="text-base font-medium text-gray-900">
          {language === 'en' ? 'Complete calibration' : '完成每日校准'}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {language === 'en' ? 'Click "Start Calibration" above' : '点击上方「开始校准」'}
        </p>
        <motion.div
          className="mt-3 text-[#D4AF37] flex justify-center"
          animate={{ y: [-2, 2, -2] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <svg className="w-5 h-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </div>
    );
  }

  const summaryText = questionnaireSummary ? generateQuestionnaireSummaryText(questionnaireSummary, language) : '';
  const isLowEnergy = todayTask.mode === 'low_energy';

  return (
    <div className="relative h-full space-y-3">
      {/* 标题和模式 */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-3xl font-bold leading-none mb-2">{language === 'en' ? 'Daily Plan' : '今日计划'}</h3>
          <p className="text-white/80 text-xs font-medium max-w-[200px]">
            {language === 'en' && todayTask.descriptionEn ? todayTask.descriptionEn : todayTask.description}
          </p>
        </div>
      </div>

      {/* 标签 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
          <span className="text-[10px] font-bold">
            {isLowEnergy ? '🌙' : '⚡'} {isLowEnergy
              ? (language === 'en' ? 'Recovery' : '恢复')
              : (language === 'en' ? 'Balanced' : '平衡')
            }
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
          <span className="text-[10px] font-bold">{language === 'en' ? 'Calibrated' : '已校准'}</span>
        </div>
        {questionnaireCompleted && (
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
            <Check className="w-3 h-3" />
            <span className="text-[10px] font-bold">{language === 'en' ? 'Done' : '已问诊'}</span>
          </div>
        )}
      </div>
    </div>
  );
}


// 生成问卷总结文案
function generateQuestionnaireSummaryText(summary: QuestionnaireSummary, language: string): string {
  const parts: string[] = [];

  // 睡眠质量
  if (summary.sleepQuality !== undefined) {
    const sleepLabels = language === 'en'
      ? ['poor sleep', 'light sleep', 'average sleep', 'good sleep', 'excellent sleep']
      : ['睡眠较浅', '睡眠一般', '睡眠尚可', '睡眠良好', '睡眠充足'];
    parts.push(sleepLabels[summary.sleepQuality]);
  }

  // 能量水平
  if (summary.energyLevel !== undefined) {
    const energyLabels = language === 'en'
      ? ['low energy', 'moderate energy', 'stable energy', 'good energy', 'high energy']
      : ['能量偏低', '能量一般', '能量稳定', '能量良好', '能量充沛'];
    parts.push(energyLabels[summary.energyLevel]);
  }

  // 压力水平（反向，0=轻松，4=压力大）
  if (summary.stressLevel !== undefined) {
    const stressLabels = language === 'en'
      ? ['very relaxed', 'relaxed', 'balanced', 'some tension', 'high tension']
      : ['非常放松', '较为放松', '状态平衡', '略有紧张', '压力较大'];
    parts.push(stressLabels[summary.stressLevel]);
  }

  if (parts.length === 0) return '';

  const connector = language === 'en' ? ', ' : '、';
  const prefix = language === 'en' ? 'Today: ' : '今日状态：';
  return prefix + parts.join(connector);
}



// 健康工具面板
function ToolsPanel() {
  const { language } = useI18n();

  const tools = [
    {
      href: '/assessment',
      icon: Sparkles,
      title: language === 'en' ? 'Symptom Assessment' : '症状评估',
      subtitle: language === 'en' ? 'AI Health Consult' : 'AI 健康问诊',
      gradient: 'from-emerald-50 to-teal-50',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-100'
    },
    {
      href: '/bayesian',
      icon: Brain,
      title: language === 'en' ? 'Cognitive Scale' : '认知天平',
      subtitle: language === 'en' ? 'Bayesian Loop' : '贝叶斯循环',
      gradient: 'from-indigo-50 to-purple-50',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      borderColor: 'border-indigo-100'
    }
  ];

  return (
    <div className="space-y-3 flex flex-col justify-center" style={{ minHeight: CONTENT_MIN_HEIGHT - 40 }}>
      {tools.map((tool, index) => {
        const Icon = tool.icon;
        return (
          <Link key={tool.href} href={tool.href}>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-xl bg-gradient-to-br ${tool.gradient} border ${tool.borderColor} cursor-pointer group`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${tool.iconBg} flex items-center justify-center shadow-sm`}>
                  <Icon className={`w-5 h-5 ${tool.iconColor}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#0B3D2E]">{tool.title}</p>
                  <p className="text-xs text-[#0B3D2E]/60">{tool.subtitle}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#0B3D2E]/30 group-hover:text-[#0B3D2E]/60 transition-colors" />
              </div>
            </motion.div>
          </Link>
        );
      })}
    </div>
  );
}


// TruthPanel removed - fake consensus data was not acceptable
// Only verified research citations should be shown

// ============ 问卷面板 ============
const QUESTION_POOL = [
  { id: 'sleep_quality', category: 'sleep', question: '昨晚睡眠质量如何？', questionEn: 'How was your sleep quality?', type: 'scale', options: ['很差', '较差', '一般', '较好', '很好'], optionsEn: ['Very Poor', 'Poor', 'Average', 'Good', 'Excellent'] },
  { id: 'wake_feeling', category: 'sleep', question: '今早醒来时感觉如何？', questionEn: 'How did you feel when you woke up?', type: 'scale', options: ['疲惫', '昏沉', '一般', '清醒', '精力充沛'], optionsEn: ['Exhausted', 'Groggy', 'Average', 'Alert', 'Energized'] },
  { id: 'morning_energy', category: 'energy', question: '现在的精力水平？', questionEn: 'Current energy level?', type: 'scale', options: ['很低', '较低', '一般', '较高', '很高'], optionsEn: ['Very Low', 'Low', 'Average', 'High', 'Very High'] },
  { id: 'stress_level', category: 'stress', question: '当前压力感受？', questionEn: 'Current stress level?', type: 'scale', options: ['很轻松', '较轻松', '一般', '有压力', '压力很大'], optionsEn: ['Very Relaxed', 'Relaxed', 'Average', 'Stressed', 'Very Stressed'] },
  { id: 'mood_state', category: 'stress', question: '今天的心情如何？', questionEn: 'How is your mood today?', type: 'scale', options: ['很低落', '有点低', '平静', '愉快', '非常好'], optionsEn: ['Very Low', 'A Bit Low', 'Calm', 'Happy', 'Great'] },
  { id: 'focus_ability', category: 'cognitive', question: '现在能集中注意力吗？', questionEn: 'Can you focus right now?', type: 'scale', options: ['很难', '较难', '一般', '较好', '很好'], optionsEn: ['Very Hard', 'Hard', 'Average', 'Good', 'Very Good'] },
];

function getTodayQuestions(date: Date = new Date()) {
  const dateStr = date.toISOString().split('T')[0];
  const seed = dateStr.split('-').reduce((acc, num) => acc + parseInt(num), 0);
  const shuffled = [...QUESTION_POOL].sort((a, b) => {
    const hashA = (seed * a.id.length) % 100;
    const hashB = (seed * b.id.length) % 100;
    return hashA - hashB;
  });
  return shuffled.slice(0, 5);
}

function QuestionnairePanel({ userId, onComplete }: { userId?: string; onComplete?: () => void }) {
  const { language } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const todayQuestions = getTodayQuestions();
  const currentQuestion = todayQuestions[currentIndex];
  const progress = (Object.keys(answers).length / todayQuestions.length) * 100;

  useEffect(() => {
    const checkTodayCompletion = async () => {
      const today = new Date().toISOString().split('T')[0];
      const completedDate = localStorage.getItem('nma_questionnaire_date');
      if (completedDate === today) {
        setIsCompleted(true);
        setIsLoading(false);
        return;
      }
      if (userId) {
        try {
          const supabase = createClientSupabaseClient();
          const { data } = await supabase
            .from('daily_questionnaire_responses')
            .select('id')
            .eq('user_id', userId)
            .gte('created_at', `${today}T00:00:00`)
            .lt('created_at', `${today}T23:59:59`)
            .limit(1);
          if (data && data.length > 0) {
            localStorage.setItem('nma_questionnaire_date', today);
            setIsCompleted(true);
          }
        } catch (err) { console.error(err); }
      }
      setIsLoading(false);
    };
    checkTodayCompletion();
  }, [userId]);

  const handleAnswer = (value: number) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);
    if (currentIndex < todayQuestions.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < todayQuestions.length) return;
    setIsSubmitting(true);
    try {
      if (userId) {
        const supabase = createClientSupabaseClient();
        await supabase.from('daily_questionnaire_responses').insert({
          user_id: userId,
          responses: answers,
          questions: todayQuestions.map(q => q.id),
          created_at: new Date().toISOString(),
        });
      }
      localStorage.setItem('nma_questionnaire_date', new Date().toISOString().split('T')[0]);
      setIsCompleted(true);
      onComplete?.();

      // 后台刷新：让 AI 方案与内容推荐跟随问卷状态更新
      fetch('/api/user/refresh', { method: 'POST' }).catch(() => { });
      fetch('/api/user/profile-sync', { method: 'POST' }).catch(() => { });
    } catch (error) { console.error(error); }
    finally { setIsSubmitting(false); }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
          <ClipboardList className="w-5 h-5 text-white" />
        </div>
        <p className="text-sm text-white/60 mt-3">{language === 'en' ? 'Loading...' : '加载中...'}</p>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-full">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-white" />
        </div>
        <p className="text-base font-medium text-white">{language === 'en' ? 'Check-in Complete' : '今日问卷已完成'}</p>
        <p className="text-sm text-white/60 mt-1">{language === 'en' ? 'AI is analyzing your data...' : 'AI 正在分析你的数据...'}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 标题区 */}
      <div className="mb-4">
        <h3 className="text-3xl font-bold leading-none mb-2">{language === 'en' ? 'Check-in' : '每日问诊'}</h3>
        <p className="text-white/80 text-xs font-medium">
          {language === 'en' ? currentQuestion.questionEn : currentQuestion.question}
        </p>
      </div>

      {/* 进度标签 */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
          <span className="text-[10px] font-bold">{currentIndex + 1} / {todayQuestions.length}</span>
        </div>
        <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col"
        >
          <div className="flex-1 flex flex-col gap-2">
            {(language === 'en' ? currentQuestion.optionsEn : currentQuestion.options).map((option, index) => {
              const isSelected = answers[currentQuestion.id] === index;
              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-medium transition-all text-left flex items-center ${isSelected
                    ? 'bg-white text-[#2E7D5A] shadow-lg'
                    : 'bg-white/90 text-gray-700 hover:bg-white'
                    }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {Object.keys(answers).length === todayQuestions.length && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-3 bg-white hover:bg-gray-50 text-[#2E7D5A] rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (language === 'en' ? 'Submitting...' : '提交中...') : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                {language === 'en' ? 'Complete & Generate Insights' : '完成问卷，生成 AI 洞察'}
              </span>
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ============ 计划面板 ============
const ICON_MAP: Record<IconName, React.ReactNode> = {
  clock: <Clock className="w-4 h-4" />,
  moon: <Moon className="w-4 h-4" />,
  wind: <Wind className="w-4 h-4" />,
  dumbbell: <Dumbbell className="w-4 h-4" />,
  sparkles: <Sparkles className="w-4 h-4" />
};

// 任务库 - 根据状态智能选择
const TASK_LIBRARY: Record<string, Omit<Task, 'completed' | 'id'> & { id: string; titleEn?: string; descriptionEn?: string; priority: { lowEnergy: number; highStress: number; balanced: number } }> = {
  // 休息类
  nsdr: { id: 'nsdr', title: 'NSDR 深度休息 15 分钟', titleEn: '15-min NSDR Rest', duration: '15 分钟', durationSeconds: 15 * 60, iconName: 'clock', category: 'rest', description: '非睡眠深度休息，快速恢复精力', descriptionEn: 'Non-sleep deep rest', priority: { lowEnergy: 10, highStress: 6, balanced: 4 } },
  nap: { id: 'nap', title: '午间小憩 20 分钟', titleEn: '20-min Power Nap', duration: '20 分钟', durationSeconds: 20 * 60, iconName: 'moon', category: 'rest', description: '短暂休息恢复认知功能', descriptionEn: 'Short rest for cognitive recovery', priority: { lowEnergy: 9, highStress: 3, balanced: 2 } },
  // 睡眠类
  sleepEarly: { id: 'sleepEarly', title: '今晚提前 30 分钟入睡', titleEn: 'Sleep 30 min earlier', duration: '30 分钟', durationSeconds: 5 * 60, iconName: 'moon', category: 'sleep', description: '优化睡眠周期', descriptionEn: 'Optimize sleep cycle', priority: { lowEnergy: 8, highStress: 5, balanced: 3 } },
  sleepHygiene: { id: 'sleepHygiene', title: '睡前 1 小时远离屏幕', titleEn: '1hr screen-free before bed', duration: '60 分钟', durationSeconds: 60 * 60, iconName: 'moon', category: 'sleep', description: '减少蓝光干扰褪黑素', descriptionEn: 'Reduce blue light interference', priority: { lowEnergy: 7, highStress: 4, balanced: 5 } },
  // 呼吸类
  boxBreath: { id: 'boxBreath', title: '盒式呼吸 5 分钟', titleEn: '5-min Box Breathing', duration: '5 分钟', durationSeconds: 5 * 60, iconName: 'wind', category: 'breath', description: '4-4-4-4 激活副交感神经', descriptionEn: '4-4-4-4 parasympathetic activation', priority: { lowEnergy: 5, highStress: 10, balanced: 6 } },
  calmBreath: { id: 'calmBreath', title: '478 呼吸法 3 分钟', titleEn: '3-min 4-7-8 Breathing', duration: '3 分钟', durationSeconds: 3 * 60, iconName: 'wind', category: 'breath', description: '快速平复焦虑情绪', descriptionEn: 'Quick anxiety relief', priority: { lowEnergy: 4, highStress: 9, balanced: 3 } },
  // 运动类
  stretch: { id: 'stretch', title: '轻度拉伸 10 分钟', titleEn: '10-min Light Stretch', duration: '10 分钟', durationSeconds: 10 * 60, iconName: 'dumbbell', category: 'movement', description: '释放肌肉紧张', descriptionEn: 'Release muscle tension', priority: { lowEnergy: 3, highStress: 7, balanced: 8 } },
  walk: { id: 'walk', title: '户外散步 15 分钟', titleEn: '15-min Outdoor Walk', duration: '15 分钟', durationSeconds: 15 * 60, iconName: 'dumbbell', category: 'movement', description: '阳光与运动双重调节', descriptionEn: 'Sunlight + movement regulation', priority: { lowEnergy: 2, highStress: 8, balanced: 9 } },
  exercise: { id: 'exercise', title: '中等强度运动 30 分钟', titleEn: '30-min Moderate Exercise', duration: '30 分钟', durationSeconds: 30 * 60, iconName: 'dumbbell', category: 'movement', description: '提升内啡肽水平', descriptionEn: 'Boost endorphin levels', priority: { lowEnergy: 1, highStress: 2, balanced: 10 } },
};

// 根据用户状态智能生成任务
function generateSmartTasks(stressLevel: number, energyLevel: number): (Task & { titleEn?: string; descriptionEn?: string })[] {
  const allTasks = Object.values(TASK_LIBRARY);

  // 根据状态计算每个任务的得分
  const scoredTasks = allTasks.map(task => {
    let score = 0;

    // 低能量状态（energyLevel < 4）：优先休息和睡眠
    if (energyLevel < 4) {
      score = task.priority.lowEnergy;
    }
    // 高压力状态（stressLevel > 6）：优先呼吸和轻度运动
    else if (stressLevel > 6) {
      score = task.priority.highStress;
    }
    // 平衡状态：优先运动和维持
    else {
      score = task.priority.balanced;
    }

    return { ...task, score };
  });

  // 按得分排序，取前 4 个
  const topTasks = scoredTasks
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ score, priority, ...task }) => ({ ...task, completed: false }));

  return topTasks as (Task & { titleEn?: string; descriptionEn?: string })[];
}

function PlanPanel({ stressLevel = 5, energyLevel = 5 }: { stressLevel?: number; energyLevel?: number }) {
  const { language } = useI18n();
  const [tasks, setTasks] = useState<(Task & { titleEn?: string; descriptionEn?: string })[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `nma_daily_tasks_${today}_${stressLevel}_${energyLevel}`;
    const savedTasks = localStorage.getItem(cacheKey);

    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      // 根据用户状态智能生成任务
      const smartTasks = generateSmartTasks(stressLevel, energyLevel);
      setTasks(smartTasks);
      localStorage.setItem(cacheKey, JSON.stringify(smartTasks));
    }
  }, [stressLevel, energyLevel]);

  const saveTasks = (newTasks: Task[]) => {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `nma_daily_tasks_${today}_${stressLevel}_${energyLevel}`;
    localStorage.setItem(cacheKey, JSON.stringify(newTasks));
    setTasks(newTasks as any);
  };

  const handleComplete = (taskId: string) => {
    const newTasks = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    saveTasks(newTasks);
  };

  const handleStart = (task: Task) => {
    setActiveTask(task);
    setShowModal(true);
  };

  const handleSessionComplete = () => {
    if (activeTask) handleComplete(activeTask.id);
    setShowModal(false);
    setActiveTask(null);
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const categoryColors: Record<string, string> = {
    rest: 'bg-blue-50 text-blue-600',
    sleep: 'bg-indigo-50 text-indigo-600',
    breath: 'bg-teal-50 text-teal-600',
    movement: 'bg-orange-50 text-orange-600',
    system: 'bg-gray-50 text-gray-600'
  };

  return (
    <div className="h-full flex flex-col">
      {/* 标题区 */}
      <div className="mb-4">
        <h3 className="text-3xl font-bold leading-none mb-2">{language === 'en' ? 'Daily Plan' : '今日计划'}</h3>
        <p className="text-white/80 text-xs font-medium">
          {completedCount === tasks.length
            ? (language === 'en' ? '🎉 All tasks completed!' : '🎉 今日计划已完成！')
            : energyLevel >= 7
              ? (language === 'en' ? 'Good state, keep the rhythm' : '状态良好，保持节奏')
              : energyLevel >= 4
                ? (language === 'en' ? 'System stable, ready to go' : '系统稳定，准备生成计划')
                : (language === 'en' ? 'Low energy, rest first' : '能量偏低，建议优先休息')}
        </p>
      </div>

      {/* 进度标签 */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
          <span className="text-[10px] font-bold">{completedCount}/{tasks.length} {language === 'en' ? 'done' : '已完成'}</span>
        </div>
        <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* 任务列表 */}
      <div className="flex-1 flex flex-col gap-2">
        {tasks.map(task => (
          <motion.div
            key={task.id}
            layout
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all ${task.completed
              ? 'bg-white/20 backdrop-blur-sm'
              : 'bg-white/90 backdrop-blur-sm'
              }`}
          >
            <button
              onClick={() => handleComplete(task.id)}
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${task.completed ? 'bg-white border-white' : 'border-white/50 hover:border-white'
                }`}
            >
              {task.completed && <Check className="w-3 h-3 text-[#5AAFA8]" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`p-0.5 rounded ${task.completed ? 'bg-white/20 text-white' : categoryColors[task.category]}`}>
                  {ICON_MAP[task.iconName]}
                </span>
                <span className={`text-xs font-medium truncate ${task.completed ? 'text-white/60 line-through' : 'text-gray-800'}`}>
                  {language === 'en' ? (task as any).titleEn || task.title : task.title}
                </span>
              </div>
            </div>
            {!task.completed && (
              <button onClick={() => handleStart(task)} className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 flex-shrink-0">
                <ChevronRight className="w-3 h-3 text-gray-500" />
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {activeTask && (
        <TaskSessionModal
          isOpen={showModal}
          onClose={() => { setShowModal(false); setActiveTask(null); }}
          onComplete={handleSessionComplete}
          taskType={activeTask.id as TaskType}
          taskTitle={activeTask.title}
          duration={activeTask.durationSeconds}
        />
      )}
    </div>
  );
}

export default DailyInsightHub;
