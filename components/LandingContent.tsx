'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BrainLoader } from '@/components/lottie/BrainLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { 
  Brain,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  Moon,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MotionButton } from '@/components/motion/MotionButton';
import { DailyTasksCard } from '@/components/DailyTasksCard';
import { ConsensusMeter, ConsensusIndicator } from '@/components/ConsensusMeter';
import { WisdomCarousel } from '@/components/WisdomCarousel';
import { DailyCheckin } from '@/components/DailyCheckin';
import { CalibrationInput, GeneratedTask } from '@/lib/calibration-service';
import AnimatedSection from '@/components/AnimatedSection';
import XFeed from '@/components/XFeed';
import DailyQuestionnaire from '@/components/DailyQuestionnaire';

interface LandingContentProps {
  user: any;
  profile: any;
  userState: any;
  recommendedTask: any;
  dailyLogs: any[];
  habitLogs: any[];
}



export default function LandingContent({
  user,
  profile,
  dailyLogs
}: LandingContentProps) {
  // Insight State
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  
  // Anomaly Detection State
  const [showAnomalyCard, setShowAnomalyCard] = useState(false);
  const [anomalyQuestion, setAnomalyQuestion] = useState('');
  
  // Daily Calibration State
  const [showCalibrationSheet, setShowCalibrationSheet] = useState(false);
  const [todayTask, setTodayTask] = useState<GeneratedTask | null>(null);

  // Real Biometrics from dailyLogs
  const latestLog = dailyLogs?.[0];
  const previousLog = dailyLogs?.[1];
  const biometrics = {
    sleep: latestLog?.sleep_hours,
    hrv: latestLog?.hrv,
    stress: latestLog?.stress_level,
  };
  const hasData = biometrics.sleep !== undefined || biometrics.hrv !== undefined;

  // Detect HRV Anomaly (>15% drop)
  useEffect(() => {
    if (latestLog?.hrv && previousLog?.hrv) {
      const hrvDrop = (previousLog.hrv - latestLog.hrv) / previousLog.hrv;
      if (hrvDrop > 0.15) {
        setShowAnomalyCard(true);
        setAnomalyQuestion(`你的 HRV 下降了 ${Math.round(hrvDrop * 100)}%。昨晚是否有以下情况？`);
      }
    }
  }, [latestLog, previousLog]);

  // Check if Daily Calibration needed (every day)
  useEffect(() => {
    if (!user) return;
    
    const today = new Date().toDateString();
    const lastCalibration = localStorage.getItem('nma_daily_calibration');
    
    // Show calibration sheet if not done today
    if (lastCalibration !== today) {
      const timer = setTimeout(() => {
        setShowCalibrationSheet(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Handle calibration complete
  const handleCalibrationComplete = (result: { input: CalibrationInput; task: GeneratedTask }) => {
    setTodayTask(result.task);
    // 保存任务到 localStorage
    localStorage.setItem('nma_today_task', JSON.stringify(result.task));
    console.log('Calibration complete:', result);
  };
  
  // 页面加载时恢复今日任务
  useEffect(() => {
    const today = new Date().toDateString();
    const lastCalibration = localStorage.getItem('nma_daily_calibration');
    
    // 如果今天已完成校准，恢复任务
    if (lastCalibration === today) {
      const savedTask = localStorage.getItem('nma_today_task');
      if (savedTask) {
        try {
          setTodayTask(JSON.parse(savedTask));
        } catch (e) {
          console.error('Failed to parse saved task:', e);
        }
      }
    }
  }, []);

  // Generate Insight (Real AI Data Only)
  useEffect(() => {
    if (!hasData) {
      setIsLoading(false);
      return;
    }

    const generateInsight = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/insight/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sleep_hours: biometrics.sleep,
            hrv: biometrics.hrv,
            stress_level: biometrics.stress,
          })
        });

        if (response.ok) {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let text = '';
          while (reader) {
            const { done, value } = await reader.read();
            if (done) break;
            text += decoder.decode(value, { stream: true });
          }
          setInsight(text || null);
        }
      } catch (err) {
        console.error('Insight generation failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    generateInsight();
  }, [hasData, biometrics.sleep, biometrics.hrv, biometrics.stress]);



  const handleAnomalyAnswer = (trigger: string) => {
    console.log('Anomaly trigger:', trigger);
    setShowAnomalyCard(false);
  };



  return (
    <div className="min-h-screen bg-[#FAF6EF] p-4 pb-24 md:pb-4">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          你好，{profile?.full_name || profile?.nickname || '朋友'}
        </h1>
        <p className="text-gray-500">让我们找到今天的平衡。</p>
      </header>

      {/* Wisdom Carousel */}
      <div className="max-w-4xl mx-auto mb-4">
        <WisdomCarousel autoPlay={true} interval={8000} />
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        
        {/* Anomaly Card (Conditional) */}
        <AnimatePresence>
          {showAnomalyCard && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:col-span-2"
            >
              <Card className="bg-amber-50 border-amber-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    检测到变化
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-amber-800 mb-3">{anomalyQuestion}</p>
                  <div className="flex flex-wrap gap-2">
                    {['🍷 饮酒', '🍜 晚餐过晚', '😰 压力大', '都没有'].map((label, i) => (
                      <MotionButton
                        key={i}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAnomalyAnswer(['alcohol', 'late_meal', 'stress', 'none'][i])}
                        className="text-xs"
                      >
                        {label}
                      </MotionButton>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI 个性化洞察卡片 - 基于校准数据生成 */}
        {todayTask && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2"
          >
            <Card className={`shadow-sm ${
              todayTask.mode === 'low_energy'
                ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100'
                : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100'
            }`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {todayTask.mode === 'low_energy' ? (
                    <>
                      <Moon className="w-4 h-4 text-indigo-500" />
                      <span className="text-indigo-600">身体信号解读</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-600">今日身体洞察</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {todayTask.mode === 'low_energy' 
                    ? `你的身体正在发出休息信号。${todayTask.description} 这是身体自我保护的智慧表现，不是懈怠。`
                    : `根据你的生物数据分析：${todayTask.description} 你的身体正处于良好的调节状态。`
                  }
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-full ${
                    todayTask.mode === 'low_energy' 
                      ? 'bg-indigo-100 text-indigo-600' 
                      : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {todayTask.mode === 'low_energy' ? '恢复模式' : '平衡模式'}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">基于今日校准数据</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* AI Insight Card */}
        <Card className="md:col-span-2 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-sm border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600 flex items-center gap-2">
              <Brain className="w-4 h-4" /> 
              每日洞察
              <Sparkles className="w-3 h-3 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <BrainLoader />
            ) : insight ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600/70">
                  <span className="px-2 py-0.5 bg-emerald-100 rounded-full">认知重构</span>
                  <span>•</span>
                  <span>基于你的生物数据生成</span>
                </div>
              </motion.div>
            ) : (
              <div className="py-4 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-sm text-gray-500">记录你的第一条数据，解锁个性化洞察</p>
                <MotionButton 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => setShowCalibrationSheet(true)}
                  hapticFeedback
                >
                  开始记录
                </MotionButton>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Questionnaire Card */}
        <DailyQuestionnaire 
          userId={user?.id}
          onComplete={(answers) => {
            console.log('问卷完成:', answers);
            // 触发 AI 重新分析
            setIsLoading(true);
            setTimeout(() => setIsLoading(false), 1000);
          }}
        />

        {/* Quick Actions - Assessment & Bayesian */}
        <Card className="md:col-span-2 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              健康工具
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {/* Assessment Entry */}
              <Link href="/assessment">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-emerald-700">症状评估</p>
                      <p className="text-xs text-emerald-600/70">AI 驱动的健康问诊</p>
                    </div>
                  </div>
                </motion.div>
              </Link>

              {/* Bayesian Entry */}
              <Link href="/bayesian">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-indigo-700">认知天平</p>
                      <p className="text-xs text-indigo-600/70">贝叶斯信念循环</p>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Daily Tasks Card - 整合生物电压调节和任务计划 */}
        <DailyTasksCard 
          stressLevel={biometrics.stress ?? 5}
          energyLevel={biometrics.sleep && biometrics.sleep > 6 ? 6 : 4}
          onTaskStart={(task) => {
            console.log('开始任务:', task);
            // 可以打开详细指导弹窗
          }}
          onTaskComplete={(taskId) => {
            console.log('完成任务:', taskId);
          }}
        />



        {/* Scientific Consensus Card */}
        <Card className="md:col-span-2 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              科学共识
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <ConsensusMeter percentage={72} metaAnalysisCount={8} />
              <div className="space-y-2">
                <a
                  href="https://pubmed.ncbi.nlm.nih.gov/32668052/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 group"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-blue-500 text-sm">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-blue-600 group-hover:underline line-clamp-1">
                      Sleep and HRV: A Systematic Review
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <ConsensusIndicator percentage={85} />
                      <span className="text-[10px] text-gray-400">PubMed</span>
                    </div>
                  </div>
                  <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-500" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Calibration Dialog */}
      <DailyCheckin
        open={showCalibrationSheet}
        onOpenChange={setShowCalibrationSheet}
        onComplete={handleCalibrationComplete}
        weeklyRecords={dailyLogs?.map(log => ({
          sleep_hours: log.sleep_hours || 7,
          stress_level: log.stress_level > 6 ? 'high' : log.stress_level > 3 ? 'medium' : 'low',
          exercise_intention: 'moderate' as const,
          timestamp: log.created_at,
        })) || []}
      />

      {/* ========== 核心功能 Section (#how) ========== */}
      <section id="how" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 scroll-mt-20">
        <AnimatedSection inView variant="fadeUp">
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#0B3D2E] leading-tight">
            <span className="block">健康产业是&quot;噪音&quot;。</span>
            <span className="block">生理信号是&quot;真相&quot;。</span>
          </h2>
          <div className="mt-6 grid md:grid-cols-3 gap-4 items-stretch">
            {/* 认知负荷 */}
            <div className="group rounded-2xl p-[1px] bg-gradient-to-br from-[#E7E1D6] to-transparent h-full">
              <motion.div
                whileHover={{ scale: 1.04, translateY: -2 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="relative rounded-2xl border border-[#E7E1D6] bg-white/90 backdrop-blur p-6 shadow-md transition-all group-hover:shadow-lg h-full flex flex-col overflow-hidden"
              >
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B3D2E]/60">Cognitive Load</div>
                <div className="mt-1 text-xl font-medium text-[#0B3D2E]">&quot;认知负荷&quot;已满。</div>
                <div className="mt-3 text-[#0B3D2E]/80 space-y-4 leading-relaxed">
                  <p className="mb-3">你知道有氧和力量训练；你懂得区分优质的蛋白质、脂肪和碳水。你明白要保证充足的睡眠。</p>
                  <p className="mb-3">但身体仍然像一个失控的&quot;黑匣子&quot;。</p>
                  <p>你发现，只是更努力地去坚持这些&quot;规则&quot;，并不是最终的答案。</p>
                </div>
              </motion.div>
            </div>

            {/* 打卡游戏 */}
            <div className="group rounded-2xl p-[1px] bg-gradient-to-br from-[#E7E1D6] to-transparent h-full">
              <motion.div
                whileHover={{ scale: 1.04, translateY: -2 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="relative rounded-2xl border border-[#E7E1D6] bg-white/90 backdrop-blur p-6 shadow-md transition-all group-hover:shadow-lg h-full flex flex-col overflow-hidden"
              >
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B3D2E]/60">Habit Streaks</div>
                <div className="mt-1 text-xl font-medium text-[#0B3D2E]">打卡游戏好玩吗？</div>
                <p className="mt-3 text-[#0B3D2E]/80 leading-relaxed mb-4">
                  许多健康App依赖&quot;羞耻感&quot;和&quot;强制打卡&quot;。功能越来越多，认知负荷越来越重，却不触及&quot;根本原因&quot;。你的身体并没有崩溃，它只是在诚实地对压力做出反应。
                </p>
              </motion.div>
            </div>

            {/* 信号 */}
            <div className="group rounded-2xl p-[1px] bg-gradient-to-br from-[#E7E1D6] to-transparent h-full">
              <motion.div
                whileHover={{ scale: 1.04, translateY: -2 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="relative rounded-2xl border border-[#E7E1D6] bg-white/90 backdrop-blur p-6 shadow-md transition-all group-hover:shadow-lg h-full flex flex-col overflow-hidden"
              >
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B3D2E]/60">The Signal</div>
                <div className="mt-1 text-xl font-medium text-[#0B3D2E]">信号：接受生理真相。</div>
                <p className="mt-3 text-[#0B3D2E]/80 leading-relaxed">
                  我们承认新陈代谢的不可逆趋势，但可以选择&quot;反应&quot;。先解决&quot;焦虑&quot;（领先指标），自然改善&quot;身体机能&quot;（滞后指标）。不对抗真相，与真相和解。
                </p>
              </motion.div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ========== 科学模型 Section (#model) ========== */}
      <section id="model" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 scroll-mt-20">
        <AnimatedSection inView variant="fadeUp">
          <div className="rounded-2xl border border-[#E7E1D6] bg-[#FFFDF8] p-6">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#0B3D2E]">解决思路</h2>
            <p className="mt-2 text-sm text-[#0B3D2E]/70">这是 No More anxious™ 的核心方法论。</p>
            <div className="mt-6 grid md:grid-cols-3 gap-4 items-stretch">
              {/* Card 1: Agent */}
              <motion.div
                whileHover={{ scale: 1.06, translateY: -2 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="relative rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-md hover:shadow-lg overflow-hidden"
              >
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B3D2E]/60">Agent</div>
                <h3 className="mt-1 text-xl font-medium text-[#0B3D2E]">您的专属&quot;健康代理&quot;</h3>
                <p className="mt-3 text-[#0B3D2E]/80 leading-relaxed mb-3">这不是一个AI聊天机器人。</p>
                <p className="mt-2 text-[#0B3D2E] font-semibold leading-relaxed mb-3">它冷血，因为它只会基于唯一的规则：&quot;生理真相&quot;。</p>
                <p className="mt-2 text-[#0B3D2E]/80 leading-relaxed">
                  它不会说&quot;加油！&quot;。它会说：&quot;你现在感到焦虑，意味着你的皮质醇已达峰值。一个5分钟的步行是为了&nbsp;&apos;代谢&apos;&nbsp;你的压力激素。&quot;
                </p>
                <motion.div
                  className="mt-6 rounded-xl border border-[#E7E1D6] bg-[#FAF6EF] p-3"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <div className="text-xs font-semibold text-[#0B3D2E]">皮质醇响应方程</div>
                  <div className="mt-1 font-mono text-sm text-[#0B3D2E]">dC/dt = -λ·C(t) + I(t)</div>
                  <p className="mt-1 text-[11px] text-[#0B3D2E]/70">
                    λ 控制焦虑激素的自然衰减，输入 I(t) 代表 5 分钟步行等最小干预。
                  </p>
                </motion.div>
              </motion.div>

              {/* Card 2: Bayesian */}
              <motion.div
                whileHover={{ scale: 1.02, translateY: -1 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="relative rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-md hover:shadow-lg overflow-hidden h-full flex flex-col"
              >
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B3D2E]/60">Bayesian</div>
                <h3 className="mt-1 text-xl font-medium text-[#0B3D2E]">&quot;贝叶斯信念&quot;循环</h3>
                <p className="mt-3 text-[#0B3D2E]/80 leading-relaxed">
                  我们从来不为&quot;打卡天数&quot;而焦虑。我们只关心&quot;信念强度&quot;。每次行动后，你将评估：&quot;这在起作用的确信度(1-10)&quot;。我们帮你可视化&quot;信心曲线&quot;。
                </p>
                <div className="mt-auto pt-4 text-xs text-[#0B3D2E]/60">
                  参考：后验置信度随可验证信号更新（Bayes&apos; theorem）
                </div>
                <motion.div
                  className="mt-4 rounded-xl border border-[#E7E1D6] bg-[#FAF6EF] p-3 font-mono text-sm text-[#0B3D2E]"
                  animate={{ scale: [1, 1.02, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 5, repeat: Infinity }}
                >
                  <div>P(H∣D) = [P(D∣H)·P(H)] / P(D)</div>
                  <div className="mt-1 text-[11px] text-[#0B3D2E]/70">
                    每次习惯完成即是新的 D，后验信念提高 → 曲线抬升。
                  </div>
                </motion.div>
              </motion.div>

              {/* Card 3: Minimum Dose */}
              <motion.div
                whileHover={{ scale: 1.06, translateY: -2 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="relative rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-md hover:shadow-lg overflow-hidden h-full flex flex-col"
              >
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B3D2E]/60">Minimum Dose</div>
                <h3 className="mt-1 text-xl font-medium text-[#0B3D2E]">最低有效剂量</h3>
                <p className="mt-3 text-[#0B3D2E]/80">
                  你不需要每天锻炼1小时，那太累了。你只需要在&quot;线索&quot;出现时，执行&quot;最低阻力&quot;的&quot;反应&quot;（如步行5分钟）。我们帮你识别并建立这些&quot;微习惯&quot;。
                </p>
                <div className="mt-auto pt-4">
                  <motion.svg viewBox="0 0 140 80" className="w-full h-20">
                    <motion.path
                      d="M5 70 C35 60 55 45 70 40 C95 32 115 20 135 15"
                      fill="none"
                      stroke="#0B3D2E"
                      strokeWidth="3"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                    />
                  </motion.svg>
                  <div className="mt-1 font-mono text-xs text-[#0B3D2E]">
                    Δhabit = k · e<sup>−r</sup>
                  </div>
                  <p className="text-[11px] text-[#0B3D2E]/70">
                    r 为阻力等级，阻力越低，增益越快。
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ========== 权威洞察 Section (#authority) ========== */}
      <section id="authority" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6 scroll-mt-20">
        <AnimatedSection inView variant="fadeUp" className="rounded-xl border border-[#E7E1D6] bg-white p-6">
          <h2 className="text-2xl font-semibold text-[#0B3D2E]">一个没有&quot;噪音&quot;的信息流。</h2>
          <p className="mt-3 text-[#0B3D2E]/80">
            我们从 X、顶级权威健康研报、Reddit 热议组等为您精选了该领域最顶尖的生理学家、神经科学家和表现专家的核心见解。
            没有励志名言，没有低效&quot;技巧&quot;，只有可执行的数据和第一性原理。
          </p>
          <div className="mt-4">
            <XFeed variant="bare" compact columns={2} limit={4} />
          </div>
          <div className="mt-4 rounded-md border border-[#E7E1D6] bg-[#FFFDF8] p-4">
            <div className="text-xs text-[#0B3D2E]/60">参考阅读</div>
            <div className="mt-2 text-sm text-[#0B3D2E]/90">胆固醇过低与心理健康风险的相关性综述（英文）。</div>
            <a
              className="mt-2 inline-block text-xs text-[#0B3D2E] underline"
              href="https://www.healthline.com/health/cholesterol-can-it-be-too-low"
              target="_blank"
              rel="noreferrer"
            >
              Healthline：Can My Cholesterol Be Too Low?
            </a>
          </div>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E7E1D6] bg-[#FAF6EF] mt-16">
        <div className="mx-auto max-w-4xl px-4 py-6 text-xs text-[#0B3D2E]/70 flex gap-4">
          <span>© 2025 NMa</span>
          <Link href="/privacy" className="hover:text-[#0B3D2E]">隐私政策</Link>
          <Link href="/terms" className="hover:text-[#0B3D2E]">服务条款</Link>
        </div>
      </footer>
    </div>
  );
}
