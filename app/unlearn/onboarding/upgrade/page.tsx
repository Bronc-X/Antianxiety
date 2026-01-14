'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, Zap, Brain, Activity, Watch, Sun, Check, Crown, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';

/**
 * 升级页面（营销漏斗中的关键转化页）
 * 用户完成问卷后必经此页面，展示核心服务功能
 * 目标：让用户了解平台价值，引导开通会员
 */
export default function UpgradePage() {
  const { language } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSkipping, setIsSkipping] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'enterprise'>('pro');
  const [returnPath, setReturnPath] = useState('/unlearn/onboarding/profile');

  useEffect(() => {
    const from = searchParams.get('from');
    const returnTo = searchParams.get('returnTo');

    if (returnTo) {
      const timer = setTimeout(() => setReturnPath(returnTo), 0);
      return () => clearTimeout(timer);
    } else if (from === 'landing' || from === 'menu') {
      const timer = setTimeout(() => setReturnPath('/unlearn'), 0);
      return () => clearTimeout(timer);
    } else if (from === 'settings') {
      const timer = setTimeout(() => setReturnPath('/unlearn/settings'), 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleSubscribe = (plan: string) => {
    console.log('✅ 用户选择订阅:', plan);
    // TODO: 接入支付系统
    alert(language === 'en' ? `Subscribing to ${plan} plan...` : `正在开通${plan === 'pro' ? '专业版' : '企业版'}...`);
  };

  const handleSkip = () => {
    setIsSkipping(true);
    console.log('✅ 用户跳过升级，返回:', returnPath);
    router.push(returnPath);
  };

  const features = [
    {
      id: 'bio_memory',
      icon: Brain,
      title: language === 'en' ? 'Full Bio-Memory' : '全周期记忆',
      desc: language === 'en'
        ? 'Unlock 1-year trend analysis. See patterns you never knew existed in your health data.'
        : '解锁 1 年数据趋势分析。发现你从未注意到的健康数据规律。',
      color: "from-purple-500 to-indigo-600",
    },
    {
      id: 'bayesian',
      icon: Activity,
      title: language === 'en' ? 'Bayesian Engine' : '贝叶斯引擎',
      desc: language === 'en'
        ? 'Active intervention with dynamic plans. Not a vague search—precise medical hypotheses based on probability.'
        : '主动干预，动态调整计划。不再是模糊搜索，而是基于概率的精准医疗假设。',
      color: "from-emerald-500 to-teal-600",
    },
    {
      id: 'deep_rag',
      icon: Zap,
      title: language === 'en' ? 'Deep RAG' : '深度 RAG',
      desc: language === 'en'
        ? 'Access Nature/Lancet-level literature. Get answers backed by the world\'s top medical research.'
        : 'Nature/Lancet 级文献库调用。获取世界顶级医学研究支持的答案。',
      color: "from-blue-500 to-cyan-600",
    },
    {
      id: 'digital_twin',
      icon: Sun,
      title: language === 'en' ? 'Digital Twin Report' : '数字孪生报告',
      desc: language === 'en'
        ? 'Annual deep PDF health analysis. Your personal bio-model, visualized and explained.'
        : '年度深度 PDF 体检报告。你的个人生物模型，可视化呈现。',
      color: "from-amber-500 to-orange-600",
    },
    {
      id: 'inner_circle',
      icon: Watch,
      title: language === 'en' ? 'Inner Circle' : '核心社区',
      desc: language === 'en'
        ? 'Direct founder access + DAO voting rights. Shape the future of health optimization together.'
        : '创始人直连 + DAO 功能投票权。共同塑造健康优化的未来。',
      color: "from-pink-500 to-rose-600",
    },
  ];

  const plans = [
    {
      id: 'free',
      name: language === 'en' ? 'Free' : 'Free',
      price: '¥0',
      priceEn: '$0',
      period: '',
      desc: language === 'en' ? 'A minimal daily status mirror to build data habits' : '极简的每日状态镜子，建立数据习惯',
      features: [
        language === 'en' ? 'Daily Snapshot: HRV & cortisol status (today only)' : '每日快照：当日 HRV、皮质醇状态评分',
        language === 'en' ? 'Hardware Sync: Apple Health / Oura integration' : '硬件同步：Apple Health / Oura 数据接入',
        language === 'en' ? '7-Day Memory: Review past week only' : '7 天短期记忆：仅回顾过去一周数据',
        language === 'en' ? 'Basic RAG: Limited daily AI queries' : '基础 RAG：每日有限 AI 问询额度',
      ],
      cta: language === 'en' ? 'Start Free' : '免费开始',
      popular: false,
      color: 'border-[#9CAF88]',
      tierColor: '#9CAF88',
    },
    {
      id: 'pro',
      name: language === 'en' ? 'Pro' : 'Pro',
      price: '¥19',
      priceEn: '$9',
      period: language === 'en' ? '/mo' : '/月',
      desc: language === 'en' ? 'For those who optimize life through data' : '为想通过数据优化生活的精英打造',
      features: [
        language === 'en' ? '✦ Everything in Free' : '✦ 包含 Free 全部权益',
        language === 'en' ? 'Full Bio-Memory: 1-year trend analysis' : '全周期记忆：解锁 1 年数据趋势分析',
        language === 'en' ? 'Bayesian Engine: Active intervention & dynamic plans' : '贝叶斯引擎：主动干预，动态调整计划',
        language === 'en' ? 'Deep RAG: Nature/Lancet-level literature access' : '深度 RAG：Nature/Lancet 级文献库调用',
        language === 'en' ? 'Verified Bio-Hacker black badge' : 'Verified Bio-Hacker 黑色徽章',
        language === 'en' ? 'Priority support + OTA updates' : '优先客服 + OTA 更新优先推送',
      ],
      cta: language === 'en' ? 'Subscribe Now' : '立即订阅',
      popular: true,
      color: 'border-[#D4AF37] ring-2 ring-[#D4AF37]/20',
      tierColor: '#D4AF37',
    },
    {
      id: 'founding',
      name: language === 'en' ? 'Founding' : 'Founding',
      price: '¥499',
      priceEn: '$199',
      originalPrice: language === 'en' ? '$499' : '¥999',
      period: language === 'en' ? 'One-time · Lifetime' : '一次性 · 终身',
      desc: language === 'en' ? 'Limited to 500 seats for early co-creators' : '限量 500 席，为早期共建用户保留',
      features: [
        language === 'en' ? '✦ All Pro benefits · Lifetime' : '✦ 包含 Pro 全部权益 · 终身有效',
        language === 'en' ? 'Annual Digital Twin Report: Deep PDF analysis' : '年度数字孪生报告：深度 PDF 体检报告',
        language === 'en' ? 'Inner Circle: Core community + founder access' : 'Inner Circle：核心社区 + 创始人直连',
        language === 'en' ? 'OG Badge: Golden "Since 2025" glow' : 'OG 元老徽章："Since 2025" 金色发光',
        language === 'en' ? 'Beta Access: AI therapy & experimental features' : 'Beta 功能优先体验（AI 心理咨询等）',
      ],
      cta: language === 'en' ? 'Claim Your Seat' : '锁定席位',
      popular: false,
      color: 'border-[#C4A77D]',
      tierColor: '#C4A77D',
      badge: language === 'en' ? '500 Only' : '限量 500',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF6EF] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-white p-6 md:p-12 relative overflow-hidden font-serif">

      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-72 h-72 bg-[#D4AF37] rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#9CAF88] rounded-full filter blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">

        {/* 主标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 backdrop-blur-sm border border-[#D4AF37]/20 rounded-full mb-6">
            <Crown className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-sm font-medium text-[#D4AF37] italic tracking-wide">
              {language === 'en' ? 'Unlock Full Potential' : '解锁全部潜能'}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-serif font-medium leading-tight mb-4 italic tracking-tight">
            {language === 'en' ? 'Choose Your Plan' : '选择适合你的方案'}
          </h1>

          <p className="text-lg text-[#1A1A1A]/70 dark:text-white/70 max-w-2xl mx-auto italic">
            {language === 'en'
              ? 'Start free, upgrade when you\'re ready for more.'
              : '免费开始，随时升级获取更多功能。'
            }
          </p>
        </motion.div>

        {/* 功能亮点 - 展开式布局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-6 bg-white/60 dark:bg-[#2C2C2C]/60 backdrop-blur-sm rounded-2xl border border-[#1A1A1A]/10 dark:border-white/10 hover:shadow-lg transition-all ${idx === 0 ? 'md:col-span-2' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 font-serif">{feature.title}</h3>
                  <p className="text-sm text-[#1A1A1A]/70 dark:text-white/70 leading-relaxed italic">{feature.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 💰 会员定价卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              whileHover={{ y: -5 }}
              onClick={() => setSelectedPlan(plan.id as 'free' | 'pro' | 'enterprise')}
              className={`relative p-6 rounded-2xl bg-white dark:bg-[#2C2C2C] border-2 transition-all duration-300 hover:shadow-xl flex flex-col h-full cursor-pointer ${selectedPlan === plan.id
                  ? `ring-4 ring-offset-2 ring-offset-[#FAF6EF] dark:ring-offset-[#1A1A1A] ${plan.id === 'pro' ? 'ring-[#D4AF37]/60' : plan.id === 'founding' ? 'ring-[#C4A77D]/60' : 'ring-[#9CAF88]/60'}`
                  : ''
                } ${plan.color}`}
              style={{
                boxShadow: selectedPlan === plan.id
                  ? `0 0 60px ${plan.tierColor}50, 0 0 30px ${plan.tierColor}30`
                  : plan.popular
                    ? '0 0 40px rgba(212, 175, 55, 0.4)'
                    : 'none',
                borderTopWidth: !plan.popular ? '3px' : undefined,
                borderTopColor: !plan.popular ? plan.tierColor : undefined
              }}
            >
              {/* Selected indicator */}
              {selectedPlan === plan.id && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg z-10">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
              )}

              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-white text-xs font-bold rounded-full shadow-lg">
                  {language === 'en' ? '🔥 POPULAR' : '🔥 推荐'}
                </div>
              )}

              {/* Limited badge for founding */}
              {plan.badge && (
                <div className="absolute -top-3 right-6 px-4 py-1 text-xs font-bold" style={{ backgroundColor: plan.tierColor, color: '#0B3D2E' }}>
                  {plan.badge}
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2 font-serif italic">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-2">
                  {plan.originalPrice && (
                    <span className="text-lg line-through text-[#1A1A1A]/40 dark:text-white/40">
                      {plan.originalPrice}
                    </span>
                  )}
                  <span className="text-4xl font-bold font-serif italic">{language === 'en' ? plan.priceEn : plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-[#1A1A1A]/60 dark:text-white/60">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-[#1A1A1A]/60 dark:text-white/60 mt-2 font-serif italic">{plan.desc}</p>
              </div>

              <ul className="space-y-3 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm font-serif">
                    {!feature.startsWith('✦') && (
                      <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: plan.tierColor }} />
                    )}
                    <span className={feature.startsWith('✦') ? 'font-medium' : ''}>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (plan.id === 'free') {
                    handleSkip();
                  } else {
                    handleSubscribe(plan.id);
                  }
                }}
                disabled={isSkipping}
                className={`w-full py-3 rounded-xl font-semibold transition-all mt-6 font-serif ${selectedPlan === plan.id
                    ? 'scale-105 shadow-lg'
                    : ''
                  } ${plan.popular
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-white hover:shadow-lg hover:scale-105'
                    : plan.id === 'free'
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      : 'bg-[#0B3D2E] text-white hover:bg-[#0a3427]'
                  } disabled:opacity-50`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </motion.div>

        {/* 信任标识 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 text-sm text-[#1A1A1A]/50 dark:text-white/50">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="italic">{language === 'en' ? 'SSL Encrypted' : 'SSL 加密'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span className="italic">{language === 'en' ? 'Cancel Anytime' : '随时取消'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="italic">{language === 'en' ? '7-Day Trial' : '7天免费试用'}</span>
            </div>
          </div>
        </motion.div>

        {/* 跳过继续 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <button
            onClick={handleSkip}
            disabled={isSkipping}
            className="text-sm text-[#1A1A1A]/50 dark:text-white/50 hover:text-[#1A1A1A] dark:hover:text-white underline transition-colors disabled:opacity-50 italic"
          >
            {isSkipping
              ? (language === 'en' ? 'Loading...' : '加载中...')
              : (language === 'en' ? 'Continue with Free Plan →' : '继续使用免费版 →')
            }
          </button>
        </motion.div>
      </div>
    </div>
  );
}

