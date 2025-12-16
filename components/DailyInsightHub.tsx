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

  return (
    <div className="w-full">
      <div className="relative">
        <div className="glass-panel overflow-hidden rounded-2xl relative border-glow">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />

          {/* 标签栏 - Sliding Pill Design */}
          <div className="relative z-20 px-4 pt-4">
            <div className="flex gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-xl backdrop-blur-sm relative">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all relative z-10 ${isActive
                      ? 'text-[#0B3D2E] dark:text-white'
                      : 'text-[#0B3D2E]/70 dark:text-neutral-400 hover:text-[#0B3D2E] dark:hover:text-white'
                      }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-lg shadow-sm z-[-1]"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    {tab.icon}
                    <span>{language === 'en' ? tab.labelEn : tab.labelZh}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 内容区 */}
          <CardContent className="pt-4 relative z-20" style={{ minHeight: CONTENT_MIN_HEIGHT }}>
            <AnimatePresence mode="wait">
              {activeTab === 'today' && (
                <motion.div
                  key="today"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <InsightPanel
                    todayTask={todayTask}
                    insight={insight}
                    isLoading={isLoading}
                    questionnaireCompleted={questionnaireCompleted}
                    onStartCalibration={onStartCalibration}
                    questionnaireSummary={questionnaireSummary}
                    onGoToQuestionnaire={handleGoToQuestionnaire}
                  />
                </motion.div>
              )}
              {activeTab === 'questionnaire' && (
                <motion.div
                  key="questionnaire"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <QuestionnairePanel userId={userId} onComplete={handleQuestionnaireComplete} />
                </motion.div>
              )}
              {activeTab === 'plan' && (
                <motion.div
                  key="plan"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <PlanPanel stressLevel={stressLevel} energyLevel={energyLevel} />
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          <div className="h-1 bg-gradient-to-r from-emerald-500/20 via-amber-500/20 to-emerald-500/20" />
        </div>
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

// 今日洞察面板
function InsightPanel({
  todayTask,
  insight,
  isLoading,
  questionnaireCompleted,
  onStartCalibration,
  questionnaireSummary,
  onGoToQuestionnaire
}: {
  todayTask?: { mode: 'low_energy' | 'balanced' | 'normal' | 'challenge'; description: string; descriptionEn?: string } | null;
  insight?: string | null;
  isLoading?: boolean;
  questionnaireCompleted?: boolean;
  onStartCalibration?: () => void;
  questionnaireSummary?: QuestionnaireSummary;
  onGoToQuestionnaire?: () => void;
}) {
  const { language } = useI18n();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: CONTENT_MIN_HEIGHT - 40 }}>
        <BrainLoader />
        <p className="text-sm text-[#0B3D2E]/60 mt-3">
          {language === 'en' ? 'AI is analyzing your data...' : 'AI 正在分析你的数据...'}
        </p>
      </div>
    );
  }

  if (!todayTask) {
    return (
      <div className="flex flex-col items-center justify-center text-center" style={{ minHeight: CONTENT_MIN_HEIGHT - 40 }}>
        <motion.div
          className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-[#9CAF88]/30 to-[#C4A77D]/20 flex items-center justify-center"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Brain className="w-8 h-8 text-[#9CAF88]" />
        </motion.div>
        <p className="text-base font-medium text-[#0B3D2E]">
          {language === 'en' ? 'Complete daily calibration' : '完成每日校准'}
        </p>
        <p className="text-sm text-[#0B3D2E]/60 mt-1">
          {language === 'en' ? 'Get personalized insights based on your state' : '获取基于你状态的个性化洞察'}
        </p>
        {onStartCalibration && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStartCalibration}
            className="mt-5 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#9CAF88] to-[#7A9A6A] text-white text-sm font-medium shadow-lg shadow-[#9CAF88]/25"
          >
            {language === 'en' ? 'Start Calibration' : '开始校准'}
          </motion.button>
        )}
      </div>
    );
  }

  // 生成问卷总结文案
  const summaryText = questionnaireSummary ? generateQuestionnaireSummaryText(questionnaireSummary, language) : '';

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <motion.div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${todayTask.mode === 'low_energy'
            ? 'bg-gradient-to-br from-indigo-100 to-purple-100'
            : 'bg-gradient-to-br from-[#9CAF88]/30 to-[#C4A77D]/20'
            }`}
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          {todayTask.mode === 'low_energy'
            ? <Moon className="w-6 h-6 text-indigo-600" />
            : <Brain className="w-6 h-6 text-[#9CAF88]" />
          }
        </motion.div>
        <div className="flex-1 pt-1">
          <p className="text-sm text-[#0B3D2E] leading-relaxed">{language === 'en' && todayTask.descriptionEn ? todayTask.descriptionEn : todayTask.description}</p>
          {insight && (
            <p className="text-sm text-[#0B3D2E]/70 mt-3 pt-3 border-t border-[#E7E1D6]/50">{insight}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-[#E7E1D6]/30">
        <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${todayTask.mode === 'low_energy'
          ? 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700'
          : 'bg-gradient-to-r from-[#9CAF88]/20 to-[#C4A77D]/20 text-[#0B3D2E]'
          }`}>
          {todayTask.mode === 'low_energy'
            ? (language === 'en' ? '🌙 Recovery Mode' : '🌙 恢复模式')
            : (language === 'en' ? '⚡ Balanced Mode' : '⚡ 平衡模式')
          }
        </span>
        <span className="text-xs text-[#0B3D2E]/40">•</span>
        <span className="text-xs text-[#0B3D2E]/50">
          {language === 'en' ? 'Based on calibration' : '基于今日校准'}
        </span>
      </div>

      {/* 问卷已完成：显示总结 */}
      {questionnaireCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 rounded-xl bg-gradient-to-r from-[#9CAF88]/10 to-[#C4A77D]/10 border border-[#9CAF88]/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#9CAF88]" />
            <span className="text-xs text-[#0B3D2E] font-medium">
              {language === 'en' ? '✓ Daily check-in completed' : '✓ 今日问诊已完成'}
            </span>
          </div>
          {summaryText && (
            <p className="text-xs text-[#0B3D2E]/70 leading-relaxed pl-6">
              {summaryText}
            </p>
          )}
        </motion.div>
      )}

      {/* 问卷未完成：提示去做问卷 */}
      {!questionnaireCompleted && (
        <motion.button
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onGoToQuestionnaire}
          className="w-full p-3 rounded-xl bg-amber-50 border border-amber-100 hover:border-amber-200 transition-colors text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#0B3D2E]">
                {language === 'en' ? 'Complete daily check-in' : '完成每日问诊'}
              </p>
              <p className="text-xs text-[#0B3D2E]/60">
                {language === 'en' ? 'Get deeper AI insights' : '获取更精准的 AI 洞察'}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400 group-hover:text-amber-500 transition-colors" />
          </div>
        </motion.button>
      )}
    </div>
  );
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
    } catch (error) { console.error(error); }
    finally { setIsSubmitting(false); }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: CONTENT_MIN_HEIGHT - 60 }}>
        <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center animate-pulse">
          <ClipboardList className="w-5 h-5 text-[#9CA3AF]" />
        </div>
        <p className="text-sm text-[#0B3D2E]/60 mt-3">{language === 'en' ? 'Loading...' : '加载中...'}</p>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center text-center" style={{ minHeight: CONTENT_MIN_HEIGHT - 60 }}>
        <div className="w-16 h-16 rounded-full bg-[#9CAF88]/20 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-[#0B3D2E]" />
        </div>
        <p className="text-base font-medium text-[#0B3D2E]">{language === 'en' ? 'Check-in Complete' : '今日问卷已完成'}</p>
        <p className="text-sm text-[#0B3D2E]/60 mt-1">{language === 'en' ? 'AI is analyzing your data...' : 'AI 正在分析你的数据...'}</p>
      </div>
    );
  }

  return (
    <div>
      {/* 进度条 */}
      <div className="h-1 bg-[#E5E7EB] rounded-full overflow-hidden mb-4">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-400 to-orange-400"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <div className="flex justify-between text-xs text-[#6B7280] mb-4">
        <span>{language === 'en' ? 'Daily Check-in' : '每日状态问卷'}</span>
        <span>{currentIndex + 1} / {todayQuestions.length}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-base font-medium text-[#1F2937] mb-4">
            {language === 'en' ? currentQuestion.questionEn : currentQuestion.question}
          </p>
          <div className="space-y-2">
            {(language === 'en' ? currentQuestion.optionsEn : currentQuestion.options).map((option, index) => {
              const isSelected = answers[currentQuestion.id] === index;
              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-medium transition-all text-left ${isSelected
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-[#F9FAFB] text-[#374151] hover:bg-amber-50 border border-[#E5E7EB]'
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-3 bg-[#0B3D2E] hover:bg-[#0a3629] text-white rounded-xl font-medium transition-colors disabled:opacity-50"
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

const DEFAULT_TASKS: Omit<Task, 'completed'>[] = [
  { id: 'nsdr', title: '午间 15 分钟 NSDR 休息', titleEn: '15-min NSDR Rest', duration: '15 分钟', durationSeconds: 15 * 60, iconName: 'clock', category: 'rest', description: '非睡眠深度休息，快速恢复精力', descriptionEn: 'Non-sleep deep rest for quick recovery' } as any,
  { id: 'sleep', title: '今晚提前 30 分钟入睡', titleEn: 'Sleep 30 min earlier', duration: '30 分钟', durationSeconds: 5 * 60, iconName: 'moon', category: 'sleep', description: '优化睡眠周期，提升恢复质量', descriptionEn: 'Optimize sleep cycle' } as any,
  { id: 'breath', title: '5 分钟盒式呼吸', titleEn: '5-min Box Breathing', duration: '5 分钟', durationSeconds: 5 * 60, iconName: 'wind', category: 'breath', description: '4-4-4-4 呼吸法，激活副交感神经', descriptionEn: '4-4-4-4 breathing technique' } as any,
  { id: 'stretch', title: '轻度拉伸 10 分钟', titleEn: '10-min Light Stretch', duration: '10 分钟', durationSeconds: 10 * 60, iconName: 'dumbbell', category: 'movement', description: '释放肌肉紧张，促进血液循环', descriptionEn: 'Release muscle tension' } as any,
];

function PlanPanel({ stressLevel = 5, energyLevel = 5 }: { stressLevel?: number; energyLevel?: number }) {
  const { language } = useI18n();
  const [tasks, setTasks] = useState<(Task & { titleEn?: string; descriptionEn?: string })[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const savedTasks = localStorage.getItem(`nma_daily_tasks_${today}`);
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      const initialTasks = DEFAULT_TASKS.map(t => ({ ...t, completed: false }));
      setTasks(initialTasks as any);
      localStorage.setItem(`nma_daily_tasks_${today}`, JSON.stringify(initialTasks));
    }
  }, []);

  const saveTasks = (newTasks: Task[]) => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`nma_daily_tasks_${today}`, JSON.stringify(newTasks));
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
    <div>
      {/* 进度条 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[#6B7280]">{language === 'en' ? 'Daily Plan' : '今日调节计划'}</span>
        <span className="text-xs text-[#6B7280]">{completedCount}/{tasks.length} {language === 'en' ? 'done' : '已完成'}</span>
      </div>
      <div className="h-1 bg-[#E5E7EB] rounded-full overflow-hidden mb-4">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-400 to-teal-400"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* 状态提示 */}
      <p className="text-sm text-[#0B3D2E]/70 mb-4">
        {completedCount === tasks.length
          ? (language === 'en' ? '🎉 All tasks completed!' : '🎉 今日计划已完成！')
          : energyLevel >= 7
            ? (language === 'en' ? 'Good state, keep the rhythm' : '状态良好，保持节奏')
            : energyLevel >= 4
              ? (language === 'en' ? 'System stable, ready to go' : '系统稳定，准备生成计划')
              : (language === 'en' ? 'Low energy, rest first' : '能量偏低，建议优先休息')}
      </p>

      {/* 任务列表 */}
      <div className="space-y-2">
        {tasks.slice(0, 3).map(task => (
          <motion.div
            key={task.id}
            layout
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${task.completed
              ? 'bg-emerald-50/50 border-emerald-100'
              : 'bg-white border-gray-100 hover:border-gray-200'
              }`}
          >
            <button
              onClick={() => handleComplete(task.id)}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-emerald-400'
                }`}
            >
              {task.completed && <Check className="w-3.5 h-3.5 text-white" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`p-1 rounded-md ${categoryColors[task.category]}`}>
                  {ICON_MAP[task.iconName]}
                </span>
                <span className={`text-sm font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                  {language === 'en' ? (task as any).titleEn || task.title : task.title}
                </span>
              </div>
            </div>
            {!task.completed && (
              <button onClick={() => handleStart(task)} className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100">
                <ChevronRight className="w-4 h-4 text-gray-400" />
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
