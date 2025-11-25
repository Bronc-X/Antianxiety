'use client';

import { useState } from 'react';
import { UserStateAnalysis, RecommendedTask } from '@/types/logic';
import { CheckCircle2, Battery, Moon, Activity, Wind, TrendingUp, Info, Footprints, Dumbbell, Sun, Droplets, BookOpen, Hourglass, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BreathingModal from './BreathingModal';
import DynamicHealthTips from './DynamicHealthTips';
import { analyzeHealthTrends, getTrendIcon, getTrendColor } from '@/lib/trend-analysis';
import { useRouter } from 'next/navigation';

// 定义 Props (合并旧的和新的)
interface LandingContentProps {
  user: any;
  profile: any;
  habitLogs: any[];
  dailyLogs: any[];
  // 新增
  userState: UserStateAnalysis;
  recommendedTask: RecommendedTask;
  plans?: any[]; // 用户计划
}

export default function LandingContent({ 
  user, 
  profile, 
  dailyLogs,
  habitLogs,
  userState, 
  recommendedTask,
  plans = []
}: LandingContentProps) {
  const router = useRouter();
  
  // 分析健康趋势
  const trendAnalysis = analyzeHealthTrends(dailyLogs || []);
  
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [showBreathingModal, setShowBreathingModal] = useState(false);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [showBonusHabits, setShowBonusHabits] = useState(false);
  const [completedBonusHabits, setCompletedBonusHabits] = useState<Set<number>>(new Set());

  // 额外习惯列表
  const bonusHabits = [
    { icon: <Droplets className="w-6 h-6" />, name: '喝水 500ml', duration: '2分钟' },
    { icon: <BookOpen className="w-6 h-6" />, name: '阅读 10 页', duration: '15分钟' },
  ];

  // 切换额外习惯完成状态
  const toggleBonusHabit = (index: number) => {
    setCompletedBonusHabits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // 图标映射
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Moon': return <Moon className="w-8 h-8 text-[#0B3D2E]" />;
      case 'Activity': return <Activity className="w-8 h-8 text-[#0B3D2E]" />;
      case 'Wind': return <Wind className="w-8 h-8 text-[#0B3D2E]" />;
      case 'Footprints': return <Footprints className="w-8 h-8 text-[#0B3D2E]" />;
      case 'Dumbbell': return <Dumbbell className="w-8 h-8 text-[#0B3D2E]" />;
      case 'Sun': return <Sun className="w-8 h-8 text-[#0B3D2E]" />;
      default: return <Activity className="w-8 h-8 text-[#0B3D2E]" />;
    }
  };

  return (
    <>
      {/* ORGANIC DESIGN: Breathing Background */}
      <div className="breathing-background" aria-hidden="true" />
      
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8 relative">
        
        {/* SECTION 1: 状态感知 (Permission to Rest) */}
        <section className="glass-card rounded-3xl p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-serif text-[#0B3D2E]">
              {profile?.full_name || user?.email?.split('@')[0] || 'Broncin'}, 早安
            </h1>
            <p className="text-[#0B3D2E]/70 mt-1 text-sm">
              今日天气适宜，你的身体处于 
              <span className={`font-bold ml-1 ${userState.color}`}>
                {userState.label}
              </span>
            </p>
          </div>
          
          {/* 身体电池可视化 */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${userState.color}`}>
                {userState.batteryLevel}% 能量值
              </span>
              <Battery className={`w-6 h-6 ${userState.color}`} />
            </div>
          </div>
        </div>

        {/* 状态洞察 (Insight) */}
        <div className={`mt-4 p-4 rounded-2xl text-sm leading-relaxed ${
          userState.mode === 'RECOVERY' ? 'bg-amber-50 text-amber-900' : 'bg-[#F2F7F5] text-[#0B3D2E]'
        }`}>
          <div className="flex gap-2">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{userState.insight}</p>
          </div>
          {/* 偷懒许可 */}
          {userState.permissionToRest && (
            <p className="mt-2 font-medium border-t border-amber-200/50 pt-2">
              💡 提示：检测到高负荷，今天允许暂停一切高强度打卡，安心休息。
            </p>
          )}
        </div>
      </section>

      {/* SECTION 2: 唯一核心任务 (The One Thing) - HERO CARD */}
      <section>
        <div className="flex items-center justify-between mb-3 px-2">
          <h2 className="text-[#0B3D2E] font-medium opacity-80 uppercase tracking-wider text-xs">
            Today's Core Mission
          </h2>
        </div>
        
        <AnimatePresence mode="wait">
          {!showBonusHabits ? (
            <motion.div
              key="main-task"
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => {
                console.log('🎯 点击任务卡片:', recommendedTask.taskName);
                // 如果是呼吸练习，打开模态框（多关键词匹配）
                const breathingKeywords = ['呼吸', 'breathing', 'Breathing', 'breath'];
                const isBreathingTask = breathingKeywords.some(keyword => 
                  recommendedTask.taskName?.toLowerCase().includes(keyword.toLowerCase())
                );
                
                if (isBreathingTask) {
                  console.log('✅ 检测到呼吸任务，打开模态框');
                  setShowBreathingModal(true);
                } else {
                  console.log('⚪ 普通任务，标记完成');
                  setTaskCompleted(!taskCompleted);
                }
              }}
              className={`
                relative group cursor-pointer transition-organic hover-lift overflow-hidden
                glass-card-strong rounded-[2rem] p-8 border-2
                ${taskCompleted ? 'border-[#0B3D2E] bg-[#F2F7F5]/80' : 'border-transparent hover:border-[#0B3D2E]/20'}
              `}
            >
          {/* ORGANIC DESIGN: Topographic Texture Watermark */}
          <div className="absolute inset-0 texture-topographic opacity-50 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-64 h-64 opacity-5 pointer-events-none">
            <Activity className="w-full h-full text-[#0B3D2E]" />
          </div>
          <div className="flex items-center gap-6">
            {/* 左侧大图标 */}
            <div className={`
              p-4 rounded-2xl transition-colors
              ${taskCompleted ? 'bg-[#0B3D2E] text-white' : 'bg-[#FAF6EF]'}
            `}>
              {taskCompleted ? <CheckCircle2 className="w-8 h-8" /> : getIcon(recommendedTask.icon)}
            </div>

            {/* 中间文字 */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className={`text-3xl font-bold transition-all ${taskCompleted ? 'text-[#0B3D2E] line-through opacity-50' : 'text-[#0B3D2E]'}`}>
                  {recommendedTask.taskName}
                </h3>
                <span className="text-sm font-normal px-3 py-1 bg-[#FAF6EF] rounded-full text-[#0B3D2E]/70 border border-[#E7E1D6]">
                  {recommendedTask.duration}
                </span>
              </div>
              
              {/* The "Why" Tag - 赋予意义 */}
              <p className={`text-sm mt-2 transition-opacity ${taskCompleted ? 'opacity-40' : 'text-[#0B3D2E]/60'}`}>
                <span className="font-semibold text-[#0B3D2E]/80">Why: </span> 
                {recommendedTask.reason}
              </p>
            </div>

            {/* 右侧 Checkbox 模拟 */}
            <div className={`
              w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all
              ${taskCompleted ? 'border-[#0B3D2E] bg-[#0B3D2E]' : 'border-[#E7E1D6] group-hover:border-[#0B3D2E]/50'}
            `}>
              {taskCompleted && <CheckCircle2 className="w-5 h-5 text-white" />}
            </div>
          </div>
          
          {/* 完成后的鼓励语 */}
          {taskCompleted && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px] rounded-[2rem]"
            >
              <div className="text-center space-y-4">
                <span className="text-xl font-bold text-[#0B3D2E] bg-white px-6 py-2 rounded-full shadow-lg border border-[#E7E1D6] inline-block">
                  今日核心已达成，你很棒！🎉
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowBonusHabits(true);
                  }}
                  className="text-sm text-[#0B3D2E]/70 hover:text-[#0B3D2E] underline"
                >
                  查看额外习惯 →
                </button>
              </div>
            </motion.div>
          )}
            </motion.div>
          ) : (
            <motion.div
              key="bonus-habits"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card-strong rounded-[2rem] p-8 border-2 border-emerald-500/30"
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-[#0B3D2E] mb-2">太棒了！核心任务完成</h3>
                <p className="text-[#0B3D2E]/60">选择一个额外习惯继续提升</p>
              </div>
              
              <div className="space-y-3">
                {bonusHabits.map((habit, idx) => {
                  const isCompleted = completedBonusHabits.has(idx);
                  return (
                    <motion.div
                      key={idx}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => toggleBonusHabit(idx)}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                        isCompleted 
                          ? 'bg-emerald-50 border-emerald-500 shadow-sm' 
                          : 'bg-white border-[#E7E1D6] hover:border-emerald-500/50 hover:shadow-md'
                      }`}
                    >
                      <div className={`p-3 rounded-lg transition-colors ${
                        isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {habit.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-semibold transition-all ${
                          isCompleted ? 'text-[#0B3D2E] line-through opacity-60' : 'text-[#0B3D2E]'
                        }`}>
                          {habit.name}
                        </h4>
                        <p className="text-sm text-[#0B3D2E]/60">{habit.duration}</p>
                      </div>
                      <motion.div
                        animate={{ scale: isCompleted ? 1 : 1 }}
                        transition={{ type: 'spring', stiffness: 500 }}
                      >
                        <CheckCircle2 className={`w-6 h-6 transition-colors ${
                          isCompleted ? 'text-emerald-600' : 'text-[#E7E1D6]'
                        }`} />
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>

              {/* 完成统计 */}
              {completedBonusHabits.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 text-center p-3 bg-emerald-50 rounded-xl"
                >
                  <p className="text-sm font-medium text-emerald-700">
                    🎉 已完成 {completedBonusHabits.size} / {bonusHabits.length} 个额外习惯！
                  </p>
                </motion.div>
              )}

              <button
                onClick={() => setShowBonusHabits(false)}
                className="mt-4 w-full text-center text-sm text-[#0B3D2E]/50 hover:text-[#0B3D2E] transition-colors"
              >
                返回主任务
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 次要任务折叠区 (不再显示列表，只给一个安心的提示) */}
        <div className="mt-4 text-center">
          <p className="text-xs text-[#0B3D2E]/40">
            其他的补剂与日常打卡已自动收纳，无需焦虑。
          </p>
        </div>
      </section>

      {/* SECTION 3: 长期趋势 (Long-term Insight) - 条件渲染 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 左卡片：智能趋势分析 */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className={`glass-card rounded-3xl p-6 hover-lift transition-organic ${
            !trendAnalysis.hasEnoughData ? 'cursor-pointer hover:bg-[#FAF6EF]' : ''
          }`}
          onClick={() => {
            if (!trendAnalysis.hasEnoughData) {
              router.push('/assistant');
            }
          }}
        >
          {trendAnalysis.hasEnoughData ? (
            <>
              <div className="flex items-center gap-2 mb-2 text-[#0B3D2E]/60 text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>趋势洞察 · {trendAnalysis.dataPoints}天数据</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{getTrendIcon(trendAnalysis.primary)}</span>
                <p className={`text-lg font-medium ${getTrendColor(trendAnalysis.primary)}`}>
                  {trendAnalysis.primary.description}
                </p>
              </div>
              <p className="text-sm text-[#0B3D2E]/70 leading-relaxed">
                {trendAnalysis.primary.insight}
              </p>
              {trendAnalysis.secondary && (
                <p className="text-xs text-[#0B3D2E]/60 mt-2">
                  另外，{trendAnalysis.secondary.description.toLowerCase()}
                </p>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2 text-[#0B3D2E]/60 text-sm">
                <Hourglass className="w-4 h-4" />
                <span>数据积累中</span>
              </div>
              <p className="text-lg font-medium text-[#0B3D2E]">
                记录<span className="text-emerald-700"> {Math.max(0, 3 - (dailyLogs?.length || 0))} 天</span>后即可查看智能趋势分析
              </p>
              <p className="text-sm text-[#0B3D2E]/70 mt-2">
                将为您分析睡眠、运动、压力和心情的变化趋势
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-[#0B3D2E]/60">
                <span>💡 点击卡片记录今日数据</span>
              </div>
            </>
          )}
        </motion.div>
        
        {/* 右卡片：动态健康贴士 */}
        <DynamicHealthTips 
          userProfile={profile}
          recentLogs={dailyLogs}
        />
      </section>

      {/* SECTION 4: 核心功能 */}
      <section id="how" className="glass-card rounded-3xl p-8 scroll-mt-20">
        <h2 className="text-2xl font-bold text-[#0B3D2E] mb-6">核心功能</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-[#F2F7F5] w-fit">
              <Activity className="w-6 h-6 text-[#0B3D2E]" />
            </div>
            <h3 className="font-semibold text-[#0B3D2E]">智能状态感知</h3>
            <p className="text-sm text-[#0B3D2E]/70">基于生理指标实时评估你的身体能量水平，给出个性化的休息建议</p>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-[#F2F7F5] w-fit">
              <CheckCircle2 className="w-6 h-6 text-[#0B3D2E]" />
            </div>
            <h3 className="font-semibold text-[#0B3D2E]">唯一核心任务</h3>
            <p className="text-sm text-[#0B3D2E]/70">每天只推荐一个最重要的健康任务，避免焦虑，专注当下</p>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-[#F2F7F5] w-fit">
              <TrendingUp className="w-6 h-6 text-[#0B3D2E]" />
            </div>
            <h3 className="font-semibold text-[#0B3D2E]">长期趋势洞察</h3>
            <p className="text-sm text-[#0B3D2E]/70">追踪你的健康数据变化，发现改善模式，持续优化生活方式</p>
          </div>
        </div>
      </section>

      {/* SECTION 5: 科学模型 */}
      <section id="model" className="glass-card rounded-3xl p-8 scroll-mt-20">
        <h2 className="text-2xl font-bold text-[#0B3D2E] mb-6">科学模型</h2>
        <div className="space-y-6">
          <div className="border-l-4 border-[#0B3D2E] pl-4">
            <h3 className="font-semibold text-[#0B3D2E] mb-2">代谢类型理论</h3>
            <p className="text-sm text-[#0B3D2E]/70">
              基于 William Wolcott 的代谢分型理论，识别你的独特代谢模式（快速、慢速或混合型），
              提供精准的营养和生活方式建议。
            </p>
          </div>
          <div className="border-l-4 border-[#0B3D2E] pl-4">
            <h3 className="font-semibold text-[#0B3D2E] mb-2">昼夜节律优化</h3>
            <p className="text-sm text-[#0B3D2E]/70">
              整合光照、进食时间和运动节奏，帮助你建立健康的昼夜节律，改善睡眠质量和精力水平。
            </p>
          </div>
          <div className="border-l-4 border-[#0B3D2E] pl-4">
            <h3 className="font-semibold text-[#0B3D2E] mb-2">压力恢复系统</h3>
            <p className="text-sm text-[#0B3D2E]/70">
              基于 HRV（心率变异性）和主观压力评估，动态调整恢复策略，避免过度训练和倦怠。
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 6: 权威洞察 */}
      <section id="authority" className="glass-card rounded-3xl p-8 scroll-mt-20">
        <h2 className="text-2xl font-bold text-[#0B3D2E] mb-6">权威洞察</h2>
        <div className="space-y-6">
          <div className="p-6 bg-[#F2F7F5] rounded-2xl">
            <p className="text-sm text-[#0B3D2E]/60 mb-2">来自 Andrew Huberman 教授</p>
            <p className="text-[#0B3D2E] italic leading-relaxed">
              "早晨的光照摄入是调节昼夜节律最强大的工具之一。在醒来后的 30-60 分钟内获得自然光照，
              可以显著改善睡眠质量、情绪和认知功能。"
            </p>
          </div>
          <div className="p-6 bg-[#F2F7F5] rounded-2xl">
            <p className="text-sm text-[#0B3D2E]/60 mb-2">来自功能医学研究</p>
            <p className="text-[#0B3D2E] italic leading-relaxed">
              "个体化营养的关键在于理解代谢类型。没有一种饮食方案适合所有人，
              只有找到适合自己代谢模式的营养策略，才能实现最佳健康状态。"
            </p>
          </div>
          <div className="p-6 bg-[#F2F7F5] rounded-2xl">
            <p className="text-sm text-[#0B3D2E]/60 mb-2">来自睡眠科学研究</p>
            <p className="text-[#0B3D2E] italic leading-relaxed">
              "深度睡眠和 REM 睡眠对身心恢复都至关重要。通过优化睡眠环境、管理压力和保持规律作息，
              可以提高睡眠质量，进而改善整体健康水平。"
            </p>
          </div>
        </div>
      </section>
      
      </main>

      {/* 呼吸模态框 */}
      <BreathingModal 
        isOpen={showBreathingModal}
        onClose={() => setShowBreathingModal(false)}
        onComplete={() => {
          setTaskCompleted(true);
          setShowBonusHabits(true);
        }}
      />

      {/* 信息抽屉 */}
      <AnimatePresence>
        {showInfoDrawer && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl shadow-2xl p-6 max-h-[70vh] overflow-y-auto"
          >
            <div className="max-w-2xl mx-auto">
              <button
                onClick={() => setShowInfoDrawer(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                ✕
              </button>
              
              <h3 className="text-2xl font-bold text-[#0B3D2E] mb-4">你的状态详情</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-[#0B3D2E]">恢复指数</span>
                    <span className="text-2xl font-bold text-emerald-700">80%</span>
                  </div>
                  <p className="text-sm text-[#0B3D2E]/70">基于你昨晚 7 小时的睡眠时长</p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-[#0B3D2E]">压力水平</span>
                    <span className="text-2xl font-bold text-blue-700">低</span>
                  </div>
                  <p className="text-sm text-[#0B3D2E]/70">HRV 显示你的自律神经平衡良好</p>
                </div>
                
                <div className="p-4 bg-amber-50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-[#0B3D2E]">趋势</span>
                    <span className="text-2xl font-bold text-amber-700">稳定</span>
                  </div>
                  <p className="text-sm text-[#0B3D2E]/70">过去 7 天表现持续向好</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
