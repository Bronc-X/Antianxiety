'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Battery, 
  Brain, 
  Flame, 
  Moon, 
  Zap, 
  ArrowRight, 
  Info,
  Sparkles,
  Lock,
  Apple,
  Fish,
  Egg
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer 
} from 'recharts';

interface AnalysisClientViewProps {
  profile: {
    height: number;
    weight: number;
    age: number;
    gender: string;
  };
}

// 模拟数据 - 实际接入你的 API
const mockData = [
  { subject: '代谢率', A: 65, fullMark: 100 },
  { subject: '睡眠恢复', A: 40, fullMark: 100 }, // 弱项
  { subject: '皮质醇', A: 55, fullMark: 100 },
  { subject: '线粒体', A: 70, fullMark: 100 },
  { subject: '抗炎力', A: 80, fullMark: 100 }, // 强项
  { subject: '心血管', A: 90, fullMark: 100 },
];

// 食物推荐数据（参考 Nature Aging 2024 研究）
const foodRecommendations = [
  {
    name: "姜黄素",
    englishName: "Curcumin",
    benefits: "抗炎、抗氧化，激活Nrf2通路",
    sources: ["姜黄根", "咖喱粉", "姜黄素补充剂"]
  },
  {
    name: "亚精胺",
    englishName: "Spermidine",
    benefits: "诱导自噬，改善线粒体功能，延长寿命",
    sources: ["小麦胚芽", "大豆", "发酵奶酪", "+2"]
  },
  {
    name: "白藜芦醇",
    englishName: "Resveratrol",
    benefits: "激活SIRT1（长寿基因），模拟热量限制",
    sources: ["红酒", "红葡萄", "蓝莓", "+2"]
  },
  {
    name: "Omega-3 (EPA/DHA)",
    englishName: "Omega-3 (EPA/DHA)",
    benefits: "抗炎、稳定细胞膜、神经保护",
    sources: ["深海鱼（三文鱼、鲭鱼）", "鱼油补充剂", "藻油", "+2"]
  },
  {
    name: "EGCG（绿茶多酚）",
    englishName: "EGCG (Green Tea)",
    benefits: "抗氧化，激活AMPK，抑制mTOR",
    sources: ["绿茶", "抹茶", "EGCG补充剂"]
  },
  {
    name: "NAD+前体",
    englishName: "NAD+ Precursors",
    benefits: "修复DNA，增强线粒体功能",
    sources: ["NMN补充剂", "烟酰胺核糖", "西兰花"]
  }
];

// 子组件：食物卡片（类似原界面）
function FoodCard({ food, index }: { food: any; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="bg-[#FAF6EF] rounded-2xl p-5 border border-[#E7E1D6] hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-medium text-[#0B3D2E] mb-1">{food.name}</h3>
          <p className="text-sm text-[#0B3D2E]/50">{food.englishName}</p>
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <ArrowRight 
            className={`w-5 h-5 text-[#0B3D2E]/40 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
          />
        </button>
      </div>

      {/* 功效描述 */}
      <div className="flex items-start gap-2 mb-4">
        <Zap className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-[#0B3D2E]/70 leading-relaxed">{food.benefits}</p>
      </div>

      {/* 食物来源标签 */}
      <div className="flex flex-wrap gap-2">
        {food.sources.map((source: string, idx: number) => (
          <span 
            key={idx}
            className="px-3 py-1.5 bg-white text-[#0B3D2E]/70 text-xs rounded-lg border border-[#E7E1D6]"
          >
            {source}
          </span>
        ))}
      </div>
    </div>
  );
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
        
        {/* SECTION 1: 左侧雷达图 + 核心洞察 (2/3 宽度) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 图表容器卡片 */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#E7E1D6] relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center gap-8">
              
              {/* 左边：图表 */}
              <div className="w-full md:w-1/2 h-[280px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={mockData}>
                    <PolarGrid stroke="#E7E1D6" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#0B3D2E', fontSize: 12, opacity: 0.6 }} />
                    <Radar
                      name="My Health"
                      dataKey="A"
                      stroke="#0B3D2E"
                      fill="#0B3D2E"
                      fillOpacity={0.15}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                {/* 居中显示的总结分 (虚化处理，不再强调分数) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-4xl font-serif opacity-10">B+</span>
                </div>
              </div>

              {/* 右边：图表解说 (Context) */}
              <div className="w-full md:w-1/2 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold tracking-wide border border-amber-100">
                  <Info className="w-3 h-3" />
                  重点关注：睡眠恢复
                </div>
                <h3 className="text-xl font-medium">短板效应明显</h3>
                <p className="text-[#0B3D2E]/70 text-sm leading-relaxed">
                  从图表看，你的雷达图左侧（睡眠与压力）出现了凹陷。这解释了你为什么虽然运动了（右侧指标良好），但依然感觉精力无法回充。
                </p>
                <div className="pt-2">
                  <button className="text-sm font-medium border-b border-[#0B3D2E] hover:opacity-70 transition-opacity flex items-center gap-1">
                    查看 AI 深度推演 <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

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

      {/* SECTION 3: AI甄选抗衰食材 (Pro Feature) */}
      <div className="max-w-4xl mx-auto mt-12">
        <div className="bg-white rounded-[2rem] p-8 border border-[#E7E1D6] relative overflow-hidden">
          {/* Pro 标签 */}
          <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-full text-xs font-bold shadow-sm z-20">
            <Sparkles className="w-3 h-3" />
            <span>PRO</span>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-medium text-[#0B3D2E] mb-2 flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-500" />
              🌿 21天逆龄食材训练手册
            </h2>
            <p className="text-sm text-[#0B3D2E]/60">
              基于Nature Aging 2024研究 - 21天系统性食材训练，重建身体年轻化机制
            </p>
          </div>

          {/* 学术背书卡片 */}
          <div className="mb-6 bg-[#FAF6EF] rounded-xl p-4 flex items-start gap-3 border border-[#E7E1D6]">
            <div className="p-2 bg-white rounded-lg">
              <Activity className="w-4 h-4 text-[#0B3D2E]" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#0B3D2E] mb-1">科学背书</h3>
              <p className="text-xs text-[#0B3D2E]/60 leading-relaxed">
                <span className="font-medium">Arora et al., 2024.</span> "AgeXtend: Artificial Intelligence for Discovery of Anti-Aging Molecules." <span className="italic">Nature Aging</span>, DOI: 10.1038/s43587-024-00763-4
              </p>
            </div>
          </div>

          {/* 食物卡片列表容器 - 带高级模糊遮罩 */}
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
              {foodRecommendations.map((food, index) => (
                <FoodCard key={index} food={food} index={index} />
              ))}
            </div>

            {/* 高级渐变遮罩层 - 点状底纹 + 模糊 */}
            <div className="absolute inset-0 pointer-events-none" style={{ top: '45%' }}>
              {/* 点状底纹层 */}
              <div 
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 2px 2px, rgba(11, 61, 46, 0.15) 1px, transparent 0)
                  `,
                  backgroundSize: '16px 16px',
                  maskImage: 'linear-gradient(to bottom, transparent, black 20%, black)',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%, black)'
                }}
              />
              {/* 渐变模糊层 */}
              <div 
                className="absolute inset-0 backdrop-blur-sm"
                style={{
                  background: 'linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.6) 30%, rgba(255, 255, 255, 0.9) 60%, white 80%)'
                }}
              />
            </div>

            {/* 升级 Pro CTA - 放在模糊区域 */}
            <div className="absolute inset-x-0 z-10" style={{ top: '50%' }}>
              <div className="p-6 bg-gradient-to-br from-amber-50/95 to-orange-50/95 backdrop-blur-md rounded-2xl border-2 border-amber-300 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 mx-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Lock className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#0B3D2E] mb-1">🌿 解锁完整21天食材训练</h3>
                    <p className="text-sm text-[#0B3D2E]/70">
                      升级至 Pro 获得 <span className="font-bold text-amber-600">20+</span> 种经科学验证的逆龄食材完整训练方案
                    </p>
                  </div>
                </div>
                <button className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-base font-semibold hover:shadow-2xl hover:scale-105 transition-all whitespace-nowrap shadow-lg">
                  升级 Pro →
                </button>
              </div>
            </div>
          </div>
        </div>
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
