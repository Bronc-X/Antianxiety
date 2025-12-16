'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MotionButton } from '@/components/motion/MotionButton';
import { ClipboardList, ChevronRight, Check, Sparkles } from 'lucide-react';
import { createClientSupabaseClient } from '@/lib/supabase-client';

// 问题池 - 每天随机选择 5-7 个问题
const QUESTION_POOL = [
  // 睡眠相关
  { id: 'sleep_quality', category: 'sleep', question: '昨晚睡眠质量如何？', type: 'scale', options: ['很差', '较差', '一般', '较好', '很好'] },
  { id: 'wake_feeling', category: 'sleep', question: '今早醒来时感觉如何？', type: 'scale', options: ['疲惫', '昏沉', '一般', '清醒', '精力充沛'] },
  { id: 'dream_recall', category: 'sleep', question: '昨晚做梦了吗？', type: 'choice', options: ['没有', '有但记不清', '记得一些', '记得很清楚'] },
  
  // 能量相关
  { id: 'morning_energy', category: 'energy', question: '现在的精力水平？', type: 'scale', options: ['很低', '较低', '一般', '较高', '很高'] },
  { id: 'afternoon_dip', category: 'energy', question: '昨天下午有感到困倦吗？', type: 'choice', options: ['没有', '轻微', '明显', '非常困'] },
  { id: 'caffeine_need', category: 'energy', question: '今天需要咖啡因提神吗？', type: 'choice', options: ['不需要', '可能需要', '肯定需要', '已经喝了'] },
  
  // 压力/情绪相关
  { id: 'stress_level', category: 'stress', question: '当前压力感受？', type: 'scale', options: ['很轻松', '较轻松', '一般', '有压力', '压力很大'] },
  { id: 'anxiety_feeling', category: 'stress', question: '有焦虑或担忧的感觉吗？', type: 'choice', options: ['完全没有', '偶尔有', '经常有', '持续存在'] },
  { id: 'mood_state', category: 'stress', question: '今天的心情如何？', type: 'scale', options: ['很低落', '有点低', '平静', '愉快', '非常好'] },
  
  // 身体感受
  { id: 'body_tension', category: 'body', question: '身体有紧绷或酸痛感吗？', type: 'choice', options: ['没有', '轻微', '明显', '严重'] },
  { id: 'digestion', category: 'body', question: '消化系统感觉如何？', type: 'choice', options: ['不舒服', '一般', '正常', '很好'] },
  { id: 'headache', category: 'body', question: '有头痛或头晕吗？', type: 'choice', options: ['没有', '轻微', '中等', '严重'] },
  
  // 行为/习惯
  { id: 'exercise_yesterday', category: 'behavior', question: '昨天有运动吗？', type: 'choice', options: ['没有', '轻度活动', '中等运动', '高强度'] },
  { id: 'screen_time', category: 'behavior', question: '昨晚睡前看屏幕了吗？', type: 'choice', options: ['没有', '少于30分钟', '30-60分钟', '超过1小时'] },
  { id: 'water_intake', category: 'behavior', question: '昨天喝水量如何？', type: 'choice', options: ['很少', '不够', '适中', '充足'] },
  
  // 认知/专注
  { id: 'focus_ability', category: 'cognitive', question: '现在能集中注意力吗？', type: 'scale', options: ['很难', '较难', '一般', '较好', '很好'] },
  { id: 'brain_fog', category: 'cognitive', question: '有脑雾感吗？', type: 'choice', options: ['没有', '轻微', '明显', '严重'] },
  { id: 'motivation', category: 'cognitive', question: '今天的动力如何？', type: 'scale', options: ['很低', '较低', '一般', '较高', '很高'] },
];

interface DailyQuestionnaireProps {
  userId?: string;
  onComplete?: (answers: Record<string, number>) => void;
}

// 根据日期生成当天的问题（确保每天问题不同但可复现）
function getTodayQuestions(date: Date = new Date()): typeof QUESTION_POOL {
  const dateStr = date.toISOString().split('T')[0];
  const seed = dateStr.split('-').reduce((acc, num) => acc + parseInt(num), 0);
  
  // 使用种子打乱问题顺序
  const shuffled = [...QUESTION_POOL].sort((a, b) => {
    const hashA = (seed * a.id.length) % 100;
    const hashB = (seed * b.id.length) % 100;
    return hashA - hashB;
  });
  
  // 确保每个类别至少有一个问题
  const categories = ['sleep', 'energy', 'stress', 'body', 'behavior', 'cognitive'];
  const selected: typeof QUESTION_POOL = [];
  
  categories.forEach(cat => {
    const catQuestions = shuffled.filter(q => q.category === cat);
    if (catQuestions.length > 0) {
      selected.push(catQuestions[0]);
    }
  });
  
  // 补充到 7 个问题
  const remaining = shuffled.filter(q => !selected.includes(q));
  while (selected.length < 7 && remaining.length > 0) {
    selected.push(remaining.shift()!);
  }
  
  return selected;
}

export default function DailyQuestionnaire({ userId, onComplete }: DailyQuestionnaireProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const todayQuestions = getTodayQuestions();
  const currentQuestion = todayQuestions[currentIndex];
  const progress = (Object.keys(answers).length / todayQuestions.length) * 100;

  // 检查今天是否已完成问卷 - 优先从数据库检查
  useEffect(() => {
    const checkTodayCompletion = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // 先检查 localStorage（快速响应）
      const completedDate = localStorage.getItem('nma_questionnaire_date');
      if (completedDate === today) {
        setIsCompleted(true);
        setIsLoading(false);
        return;
      }
      
      // 如果有 userId，从数据库检查（确保跨设备同步）
      if (userId) {
        try {
          const supabase = createClientSupabaseClient();
          const { data, error } = await supabase
            .from('daily_questionnaire_responses')
            .select('id, created_at')
            .eq('user_id', userId)
            .gte('created_at', `${today}T00:00:00`)
            .lt('created_at', `${today}T23:59:59`)
            .limit(1);
          
          if (!error && data && data.length > 0) {
            // 数据库有今日记录，同步到 localStorage
            localStorage.setItem('nma_questionnaire_date', today);
            setIsCompleted(true);
          }
        } catch (err) {
          console.error('检查问卷状态失败:', err);
        }
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
      // 保存到数据库
      if (userId) {
        const supabase = createClientSupabaseClient();
        await supabase.from('daily_questionnaire_responses').insert({
          user_id: userId,
          responses: answers,
          questions: todayQuestions.map(q => q.id),
          created_at: new Date().toISOString(),
        });
      }
      
      // 标记今天已完成
      localStorage.setItem('nma_questionnaire_date', new Date().toISOString().split('T')[0]);
      setIsCompleted(true);
      onComplete?.(answers);

      // 后台刷新：让 AI 方案与内容推荐跟随问卷状态更新
      fetch('/api/user/refresh', { method: 'POST' }).catch(() => {});
      
    } catch (error) {
      console.error('保存问卷失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 加载状态
  if (isLoading) {
    return (
      <Card className="shadow-sm bg-[#FFFDF8] border-[#E7E1D6]">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center animate-pulse">
              <ClipboardList className="w-5 h-5 text-[#9CA3AF]" />
            </div>
            <div className="space-y-1">
              <div className="h-4 w-24 bg-[#E5E7EB] rounded animate-pulse" />
              <div className="h-3 w-32 bg-[#F3F4F6] rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 已完成状态
  if (isCompleted) {
    return (
      <Card className="shadow-sm bg-[#FFFDF8] border-[#E7E1D6]">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#9CAF88]/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-[#0B3D2E]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#0B3D2E]">今日问卷已完成</p>
              <p className="text-xs text-[#0B3D2E]/70">AI 正在分析你的数据...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 收起状态
  if (!isExpanded) {
    return (
      <Card 
        className="shadow-sm bg-[#FFFDF8] cursor-pointer hover:shadow-md transition-all border-amber-100"
        onClick={() => setIsExpanded(true)}
      >
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#1F2937]">每日状态问卷</p>
                <p className="text-xs text-[#6B7280]">7 个问题 · 约 1 分钟</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#9CA3AF]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // 展开状态 - 问卷进行中
  return (
    <Card className="shadow-md bg-[#FFFDF8] border-amber-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-amber-600 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            每日状态问卷
          </span>
          <span className="text-xs text-[#6B7280]">
            {currentIndex + 1} / {todayQuestions.length}
          </span>
        </CardTitle>
        {/* 进度条 */}
        <div className="h-1 bg-[#E5E7EB] rounded-full overflow-hidden mt-2">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-base font-medium text-[#1F2937] mb-4">
              {currentQuestion.question}
            </p>
            
            <div className="space-y-2">
              {currentQuestion.options.map((option, index) => {
                const isSelected = answers[currentQuestion.id] === index;
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    className={`w-full py-3 px-4 rounded-xl text-sm font-medium transition-all text-left ${
                      isSelected
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

        {/* 提交按钮 */}
        {Object.keys(answers).length === todayQuestions.length && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-3 bg-[#0B3D2E] hover:bg-[#0a3629] text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                '提交中...'
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  完成问卷，生成 AI 洞察
                </span>
              )}
            </button>
          </motion.div>
        )}

        {/* 收起按钮 */}
        <button
          onClick={() => setIsExpanded(false)}
          className="w-full mt-3 text-xs text-[#9CA3AF] hover:text-[#6B7280]"
        >
          稍后再填
        </button>
      </CardContent>
    </Card>
  );
}
