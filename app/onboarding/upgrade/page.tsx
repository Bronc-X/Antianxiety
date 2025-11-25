'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, Zap, Brain, TrendingUp, Lock, X } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * 升级页面（营销漏斗中的关键转化页）
 * 用户完成问卷后必经此页面，提供 Pro 订阅选项
 * 目标：最大化转化率，但不强制订阅
 */
export default function UpgradePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSkipping, setIsSkipping] = useState(false);
  const [returnPath, setReturnPath] = useState('/onboarding/profile');

  useEffect(() => {
    // 检查来源：如果有 from 参数或 returnTo 参数，使用它
    const from = searchParams.get('from');
    const returnTo = searchParams.get('returnTo');
    
    if (returnTo) {
      setReturnPath(returnTo);
    } else if (from === 'landing' || from === 'menu') {
      // 从landing页或菜单进入，返回landing
      setReturnPath('/landing');
    } else if (from === 'settings') {
      // 从设置页面进入，返回设置页面
      setReturnPath('/settings');
    }
    // 否则保持默认的 /onboarding/profile（onboarding流程）
  }, [searchParams]);

  const handleSubscribe = () => {
    // TODO: 集成支付系统（Stripe/Paddle）
    console.log('🚀 用户点击订阅按钮');
    // 暂时跳转到返回路径
    router.push(returnPath);
  };

  const handleSkip = () => {
    setIsSkipping(true);
    console.log('⏭️ 用户跳过升级，返回:', returnPath);
    router.push(returnPath);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B3D2E] via-[#0B3D2E] to-[#1a5c47] text-[#FFFBF0] flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-amber-400 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-400 rounded-full filter blur-3xl animate-pulse delay-1000" />
      </div>

      {/* 关闭/跳过按钮 - 非常小且不显眼 */}
      <button
        onClick={handleSkip}
        disabled={isSkipping}
        className="absolute top-6 right-6 p-2 text-[#FFFBF0]/40 hover:text-[#FFFBF0]/70 transition-colors z-20 group"
        aria-label="跳过升级"
      >
        <X className="w-5 h-5" />
        <span className="absolute top-full right-0 mt-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          继续使用免费版
        </span>
      </button>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        
        {/* 主标题 */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 backdrop-blur-sm border border-amber-400/30 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-200">限时优惠</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-serif font-medium leading-tight mb-4">
            解锁你的完整<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">
              代谢健康潜力
            </span>
          </h1>
          
          <p className="text-lg text-[#FFFBF0]/70 max-w-2xl mx-auto">
            我们已经分析了你的代谢档案。升级至 <span className="font-semibold text-amber-300">Pro</span> 解锁 AI 个性化方案、实时健康追踪和专属食物推荐。
          </p>
        </div>

        {/* Pro功能卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 max-w-3xl mx-auto">
          <FeatureCard
            icon={<Brain className="w-6 h-6" />}
            title="AI 健康代理"
            description="基于你的代谢档案，AI 每日生成个性化微习惯"
            badge="Pro"
          />
          <FeatureCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="实时健康雷达图"
            description="可视化你的 6 维代谢指标，追踪每周变化"
            badge="Pro"
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="抗衰食材推荐"
            description="基于 Nature Aging 2024 研究的 20+ 分子级食物清单"
            badge="Pro"
          />
          <FeatureCard
            icon={<Lock className="w-6 h-6" />}
            title="深度分析报告"
            description="解锁完整的生理机制解读和干预策略"
            badge="Pro"
          />
        </div>

        {/* 定价 */}
        <div className="bg-[#FFFBF0]/10 backdrop-blur-md border border-[#FFFBF0]/20 rounded-3xl p-8 mb-8 max-w-md mx-auto">
          <div className="mb-4">
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-5xl font-bold text-amber-300">¥0</span>
              <span className="text-[#FFFBF0]/60 line-through">¥99</span>
            </div>
            <p className="text-sm text-[#FFFBF0]/70">
              前 <span className="font-semibold text-amber-300">3 天免费试用</span>，随时取消
            </p>
          </div>
          
          <div className="space-y-2 text-sm text-left text-[#FFFBF0]/80 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
              <span>3天后自动续订：¥99/月</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
              <span>无缝集成健康数据</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
              <span>无限制 AI 对话次数</span>
            </div>
          </div>

          {/* 主要CTA按钮 */}
          <button
            onClick={handleSubscribe}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-lg font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 mb-3"
          >
            开始 3 天免费试用 →
          </button>

          <p className="text-xs text-[#FFFBF0]/50">
            试用期内可随时取消，不会扣费
          </p>
        </div>

        {/* 次要CTA - 跳过按钮（更小更不显眼） */}
        <button
          onClick={handleSkip}
          disabled={isSkipping}
          className="text-sm text-[#FFFBF0]/50 hover:text-[#FFFBF0]/80 underline transition-colors disabled:opacity-50"
        >
          {isSkipping ? '正在继续...' : '暂时跳过，使用免费版'}
        </button>

        {/* 信任徽章 */}
        <div className="mt-10 flex items-center justify-center gap-6 text-xs text-[#FFFBF0]/40">
          <span>🔒 安全支付</span>
          <span>|</span>
          <span>✅ 随时取消</span>
          <span>|</span>
          <span>📧 邮件确认</span>
        </div>
      </div>
    </div>
  );
}

// 功能卡片子组件
function FeatureCard({ 
  icon, 
  title, 
  description, 
  badge 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  badge?: string;
}) {
  return (
    <div className="bg-[#FFFBF0]/5 backdrop-blur-sm border border-[#FFFBF0]/10 rounded-2xl p-5 text-left hover:bg-[#FFFBF0]/10 transition-colors relative group">
      {badge && (
        <div className="absolute top-3 right-3 px-2 py-0.5 bg-amber-500/30 border border-amber-400/50 rounded-full text-xs font-medium text-amber-200">
          {badge}
        </div>
      )}
      <div className="w-12 h-12 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-xl flex items-center justify-center text-amber-300 mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-semibold text-[#FFFBF0] mb-2">{title}</h3>
      <p className="text-sm text-[#FFFBF0]/60 leading-relaxed">{description}</p>
    </div>
  );
}
