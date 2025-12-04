'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Brain, 
  Flame, 
  Moon, 
  Zap
} from 'lucide-react';
import ProAntiAgingFoods from '@/components/ProAntiAgingFoods';


interface AnalysisClientViewProps {
  profile: {
    height: number;
    weight: number;
    age: number;
    gender: string;
  };
}





export default function AnalysisClientView({ profile }: AnalysisClientViewProps) {
  const [isGenerating, setIsGenerating] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 模拟生成进度
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setIsGenerating(false), 300);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(timer);
  }, []);

  // 呼吸生成动画
  if (isGenerating) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center">
        <div className="text-center space-y-8">
          {/* 呼吸圆圈 */}
          <div className="relative w-32 h-32 mx-auto">
            <div 
              className="absolute inset-0 rounded-full bg-[#0B3D2E] opacity-20"
              style={{
                animation: 'breathe 2s ease-in-out infinite',
              }}
            />
            <div 
              className="absolute inset-4 rounded-full bg-[#0B3D2E] opacity-40"
              style={{
                animation: 'breathe 2s ease-in-out infinite 0.3s',
              }}
            />
            <div 
              className="absolute inset-8 rounded-full bg-[#0B3D2E] opacity-60"
              style={{
                animation: 'breathe 2s ease-in-out infinite 0.6s',
              }}
            />
            <div className="absolute inset-12 rounded-full bg-[#0B3D2E] flex items-center justify-center">
              <Brain className="w-8 h-8 text-[#FFFBF0]" />
            </div>
          </div>

          {/* 生成文本 */}
          <div className="space-y-2">
            <p className="text-lg font-medium text-[#0B3D2E]">
              AI 正在分析你的代谢指纹...
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-[#0B3D2E]/60">
              <span>{progress}%</span>
              <div className="w-32 h-1 bg-[#E7E1D6] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#0B3D2E] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes breathe {
            0%, 100% { transform: scale(1); opacity: 0.2; }
            50% { transform: scale(1.3); opacity: 0.4; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF] p-6 md:p-12 font-sans text-[#0B3D2E]">
      
      {/* Header: 不叫"分析报告"，叫"解码" */}
      <header className="max-w-4xl mx-auto mb-10">
        <div className="flex items-center gap-3 mb-2 opacity-60">
          <Activity className="w-5 h-5" />
          <span className="text-sm font-medium tracking-wider uppercase">AI Metabolic Decoder</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-medium leading-tight">
          Broncin，你的代谢指纹显示<br />
          本周处于 <span className="text-amber-600 border-b-2 border-amber-200">"压力恢复期"</span>
        </h1>
      </header>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SECTION 1: 左侧核心洞察 (2/3 宽度) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 详细指标翻译列表 (Translation Layer) */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium opacity-80 px-2">身体信号翻译</h3>
            
            {/* 卡片 1: 睡眠 (问题点) */}
            <MetricTranslationCard 
              icon={<Moon className="w-5 h-5 text-amber-600" />}
              title="睡眠恢复力"
              status="需关注"
              statusColor="bg-amber-100 text-amber-800"
              feeling="你可能感觉：早起脑雾，像没睡醒，下午渴望甜食。"
              science="深睡阶段占比不足 15%，生长激素分泌受阻。"
            />

            {/* 卡片 2: 线粒体 (正常) */}
            <MetricTranslationCard 
              icon={<Zap className="w-5 h-5 text-emerald-600" />}
              title="线粒体效能"
              status="运转良好"
              statusColor="bg-emerald-100 text-emerald-800"
              feeling="你可能感觉：运动时耐力不错，没有胸闷感。"
              science="ATP 合成效率处于基准线以上。"
            />

             {/* 卡片 3: 炎症 (强项) */}
             <MetricTranslationCard 
              icon={<Flame className="w-5 h-5 text-blue-600" />}
              title="系统抗炎力"
              status="优秀"
              statusColor="bg-blue-100 text-blue-800"
              feeling="你可能感觉：关节无酸痛，皮肤状态稳定。"
              science="CRP 指标推测维持低位，免疫屏障稳固。"
            />
          </div>
        </div>

        {/* SECTION 2: 右侧行动栈 (1/3 宽度) - 替代原来的 Grid */}
        <div className="space-y-6">
          
          {/* 🔄 7天代谢重置训练营 */}
          <div className="bg-[#0B3D2E] text-[#FFFBF0] p-6 rounded-[2rem] relative overflow-hidden">
            <Brain className="w-12 h-12 text-white/10 absolute top-4 right-4" />
            <h3 className="text-lg font-medium mb-4 relative z-10">🔄 7天代谢重置训练营</h3>
            <p className="text-white/80 text-sm leading-relaxed relative z-10 mb-6">
              基于您的身体状态分析，7天集中训练帮您从"高强度消耗"模式转换到"深层恢复"模式。
            </p>
            <div className="space-y-3 relative z-10">
              <StrategyItem text="📅 生物钟调节训练：延迟进食至10:00（间歇性禁食）" />
              <StrategyItem text="🌙 深度睡眠训练：睡前1小时镁元素补充" />
              <StrategyItem text="🏃 有氧基础重建：暂停高强度，专注Zone 2训练" />
            </div>
          </div>

          {/* 知识胶囊 (Knowledge Pill) */}
          <div className="bg-white p-6 rounded-[2rem] border border-[#E7E1D6]">
            <h4 className="text-sm font-bold uppercase tracking-wider opacity-50 mb-3">Did you know?</h4>
            <p className="text-sm font-medium mb-2">为什么要关注"皮质醇觉醒"？</p>
            <p className="text-xs text-[#0B3D2E]/60 leading-relaxed">
              如果你醒来后 30 分钟内没有感到清醒，说明皮质醇启动失败。这通常是昨晚蓝光暴露过多导致的。
            </p>
          </div>
        </div>

      </div>

      {/* SECTION 3: AI甄选抗衰食材 (使用 ProAntiAgingFoods 组件) */}
      <div className="max-w-4xl mx-auto mt-12">
        <ProAntiAgingFoods />
      </div>

    </div>
  );
}

// 子组件：指标翻译卡片
function MetricTranslationCard({ icon, title, status, statusColor, feeling, science }: any) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E7E1D6] flex items-start gap-4 hover:shadow-md transition-shadow cursor-default">
      <div className="p-3 bg-[#FAF6EF] rounded-xl shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium text-[#0B3D2E]">{title}</h4>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${statusColor}`}>
            {status}
          </span>
        </div>
        {/* 核心：感受描述 */}
        <p className="text-sm text-[#0B3D2E] mb-2">
          <span className="opacity-60">体感映射：</span>{feeling}
        </p>
        {/* 科学解释 (小字) */}
        <p className="text-xs text-[#0B3D2E]/40 border-t border-[#E7E1D6] pt-2 mt-2">
          {science}
        </p>
      </div>
    </div>
  );
}

// 子组件：策略项
function StrategyItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm">
      <div className="w-4 h-4 rounded-full border border-white/40 flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100" />
      </div>
      <span className="text-sm font-medium text-white/90">{text}</span>
    </div>
  );
}
