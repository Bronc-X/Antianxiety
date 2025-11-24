'use client';

import { useState } from 'react';
import { UserStateAnalysis, RecommendedTask } from '@/types/logic';
import { CheckCircle2, Battery, Moon, Activity, Wind, TrendingUp, Info, Footprints, Dumbbell, Sun } from 'lucide-react';

// 定义 Props (合并旧的和新的)
interface LandingContentProps {
  user: any;
  profile: any;
  habitLogs: any[];
  dailyLogs: any[];
  // 新增
  userState: UserStateAnalysis;
  recommendedTask: RecommendedTask;
}

export default function LandingContent({ 
  user, 
  profile, 
  userState, 
  recommendedTask 
}: LandingContentProps) {
  
  const [taskCompleted, setTaskCompleted] = useState(false);

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
        
        <div 
          onClick={() => setTaskCompleted(!taskCompleted)}
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
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px] rounded-[2rem]">
              <span className="text-xl font-bold text-[#0B3D2E] bg-white px-6 py-2 rounded-full shadow-lg border border-[#E7E1D6]">
                今日核心已达成，你很棒！🎉
              </span>
            </div>
          )}
        </div>

        {/* 次要任务折叠区 (不再显示列表，只给一个安心的提示) */}
        <div className="mt-4 text-center">
          <p className="text-xs text-[#0B3D2E]/40">
            其他的补剂与日常打卡已自动收纳，无需焦虑。
          </p>
        </div>
      </section>

      {/* SECTION 3: 长期趋势 (Long-term Insight) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-3xl p-6 hover-lift transition-organic">
          <div className="flex items-center gap-2 mb-2 text-[#0B3D2E]/60 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>本周高光</span>
          </div>
          <p className="text-lg font-medium text-[#0B3D2E]">
            你的<span className="text-emerald-700">深度睡眠时间</span>比上周提升了 12%。
          </p>
        </div>
        
        <div className="glass-card rounded-3xl p-6 hover-lift transition-organic">
          <div className="flex items-center gap-2 mb-2 text-[#0B3D2E]/60 text-sm">
            <Activity className="w-4 h-4" />
            <span>优化建议</span>
          </div>
          <p className="text-lg font-medium text-[#0B3D2E]">
            早上的皮质醇觉醒反应不错，建议继续保持<span className="text-emerald-700">光照摄入</span>。
          </p>
        </div>
      </section>
      
      </main>
    </>
  );
}
