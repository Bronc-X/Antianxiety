'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Check, Sparkles, Eye, Zap, Crown } from 'lucide-react';
import { tr, useI18n } from '@/lib/i18n';

type LocalizedText = { zh: string; en: string; 'zh-TW'?: string };

interface PricingPlan {
  name: LocalizedText;
  subtitle: LocalizedText;
  price: LocalizedText;
  priceNote?: LocalizedText;
  description: LocalizedText;
  features: { text: LocalizedText; highlight?: boolean }[];
  ctaText: LocalizedText;
  ctaLink: string;
  highlighted?: boolean;
  badge?: LocalizedText;
  icon: React.ReactNode;
  tierColor: string;
}

const pricingPlans: PricingPlan[] = [
  {
    name: { zh: 'Free', en: 'Free' },
    subtitle: { zh: 'The Observer · 观察者', en: 'The Observer' },
    price: { zh: '¥0', en: '$0' },
    description: { 
      zh: '极简的每日状态镜子，建立数据习惯', 
      en: 'A minimal daily status mirror to build data habits' 
    },
    icon: <Eye className="w-6 h-6" />,
    tierColor: '#9CAF88',
    features: [
      { text: { zh: '每日快照：当日 HRV、皮质醇状态评分', en: 'Daily Snapshot: HRV & cortisol status (today only)' } },
      { text: { zh: '硬件同步：Apple Health / Oura 数据接入', en: 'Hardware Sync: Apple Health / Oura integration' } },
      { text: { zh: '7 天短期记忆：仅回顾过去一周数据', en: '7-Day Memory: Review past week only' } },
      { text: { zh: '基础 RAG：每日有限 AI 问询额度', en: 'Basic RAG: Limited daily AI queries' } },
      { text: { zh: '无身份标识', en: 'No badge' } },
    ],
    ctaText: { zh: '免费开始', en: 'Start Free' },
    ctaLink: '/signup',
  },
  {
    name: { zh: 'Pro', en: 'Pro' },
    subtitle: { zh: 'The Optimizer · 优化者', en: 'The Optimizer' },
    price: { zh: '¥29', en: '$4.99' },
    priceNote: { zh: '/月', en: '/mo' },
    description: { 
      zh: '为想通过数据优化生活的精英打造', 
      en: 'For those who optimize life through data' 
    },
    icon: <Zap className="w-6 h-6" />,
    tierColor: '#D4AF37',
    highlighted: true,
    badge: { zh: '推荐', en: 'Popular' },
    features: [
      { text: { zh: '✦ 包含 Free 全部权益', en: '✦ Everything in Free' }, highlight: true },
      { text: { zh: '全周期记忆：解锁 1 年数据趋势分析', en: 'Full Bio-Memory: 1-year trend analysis' } },
      { text: { zh: '贝叶斯引擎：主动干预，动态调整计划', en: 'Bayesian Engine: Active intervention & dynamic plans' } },
      { text: { zh: '深度 RAG：Nature/Lancet 级文献库调用', en: 'Deep RAG: Nature/Lancet-level literature access' } },
      { text: { zh: 'Verified Bio-Hacker 黑色徽章', en: 'Verified Bio-Hacker black badge' } },
      { text: { zh: '优先客服 + OTA 更新优先推送', en: 'Priority support + OTA updates' } },
    ],
    ctaText: { zh: '立即订阅', en: 'Subscribe Now' },
    ctaLink: '/pricing?plan=pro',
  },
  {
    name: { zh: 'Founding', en: 'Founding' },
    subtitle: { zh: 'The Stoic · 斯多葛先行者', en: 'The Stoic' },
    price: { zh: '¥499', en: '$69' },
    priceNote: { zh: '一次性 · 终身', en: 'One-time · Lifetime' },
    description: { 
      zh: '限量 500 席，为早期信仰者保留', 
      en: 'Limited to 500 seats for early believers' 
    },
    icon: <Crown className="w-6 h-6" />,
    tierColor: '#C4A77D',
    badge: { zh: '限量 500', en: '500 Only' },
    features: [
      { text: { zh: '✦ 包含 Pro 全部权益 · 终身有效', en: '✦ All Pro benefits · Lifetime' }, highlight: true },
      { text: { zh: '年度数字孪生报告：深度 PDF 体检报告', en: 'Annual Digital Twin Report: Deep PDF analysis' } },
      { text: { zh: 'Inner Circle：核心社区 + 创始人直连', en: 'Inner Circle: Core community + founder access' } },
      { text: { zh: 'OG 元老徽章："Since 2025" 金色发光', en: 'OG Badge: Golden "Since 2025" glow' } },
      { text: { zh: 'Beta 功能优先体验（AI 心理咨询等）', en: 'Beta Access: AI therapy & experimental features' } },
      { text: { zh: 'DAO 功能投票权 + 产品共创', en: 'DAO voting rights + product co-creation' } },
    ],
    ctaText: { zh: '锁定席位', en: 'Claim Your Seat' },
    ctaLink: '/pricing?plan=founding',
  },
];

export default function PricingPlans() {
  const { language } = useI18n();
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    alert(language === 'en' ? 'Payment integration coming soon!' : '支付功能即将上线！');
    setIsProcessing(false);
    setSelectedPlan(null);
  };

  return (
    <div className="bg-[#0B3D2E] py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-widest font-medium mb-4 text-[#D4AF37] font-serif">
            {tr(language, { zh: '会员体系', en: 'Membership' })}
          </p>
          <h2 
            className="font-bold text-white leading-[1.1] tracking-[-0.02em] mb-4 font-serif"
            style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}
          >
            {tr(language, { zh: '选择你的身份', en: 'Choose Your Identity' })}
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto font-serif">
            {tr(language, {
              zh: '从观察者到优化者，再到先行者。每一步都是对自我认知的升级。',
              en: 'From Observer to Optimizer to Stoic. Each step is an upgrade in self-awareness.',
            })}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-8 transition-all duration-300 ${
                plan.highlighted 
                  ? 'bg-[#FAF6EF] scale-105 shadow-2xl' 
                  : 'bg-white/5 border border-white/10 hover:border-[#D4AF37]/30'
              }`}
              style={{ 
                borderTop: `3px solid ${plan.tierColor}`,
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 right-6">
                  <span 
                    className="px-4 py-1 text-xs font-bold tracking-wide"
                    style={{ 
                      backgroundColor: plan.tierColor,
                      color: plan.highlighted ? '#0B3D2E' : '#FAF6EF'
                    }}
                  >
                    {tr(language, plan.badge)}
                  </span>
                </div>
              )}

              {/* Icon & Name */}
              <div className="mb-6">
                <div 
                  className="w-12 h-12 flex items-center justify-center mb-4"
                  style={{ 
                    backgroundColor: plan.highlighted ? plan.tierColor : 'rgba(255,255,255,0.1)',
                    color: plan.highlighted ? '#0B3D2E' : plan.tierColor
                  }}
                >
                  {plan.icon}
                </div>
                <h3 
                  className={`text-2xl font-bold mb-1 font-serif ${
                    plan.highlighted ? 'text-[#0B3D2E]' : 'text-white'
                  }`}
                >
                  {tr(language, plan.name)}
                </h3>
                <p 
                  className={`text-sm font-serif ${
                    plan.highlighted ? 'text-[#0B3D2E]/60' : 'text-white/40'
                  }`}
                >
                  {tr(language, plan.subtitle)}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span 
                    className={`text-4xl font-bold font-serif ${
                      plan.highlighted ? 'text-[#0B3D2E]' : 'text-white'
                    }`}
                  >
                    {tr(language, plan.price)}
                  </span>
                  {plan.priceNote && (
                    <span 
                      className={`text-sm ${
                        plan.highlighted ? 'text-[#0B3D2E]/60' : 'text-white/40'
                      }`}
                    >
                      {tr(language, plan.priceNote)}
                    </span>
                  )}
                </div>
                <p 
                  className={`text-sm mt-2 font-serif ${
                    plan.highlighted ? 'text-[#0B3D2E]/70' : 'text-white/50'
                  }`}
                >
                  {tr(language, plan.description)}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 min-h-[220px]">
                {plan.features.map((feature, featureIndex) => (
                  <li 
                    key={featureIndex} 
                    className={`flex items-start gap-3 text-sm font-serif ${
                      feature.highlight 
                        ? (plan.highlighted ? 'text-[#0B3D2E] font-medium' : 'text-[#D4AF37] font-medium')
                        : (plan.highlighted ? 'text-[#0B3D2E]/70' : 'text-white/60')
                    }`}
                  >
                    {!feature.highlight && (
                      <Check 
                        className="w-4 h-4 mt-0.5 flex-shrink-0" 
                        style={{ color: plan.tierColor }}
                      />
                    )}
                    <span className={feature.highlight ? 'ml-0' : ''}>
                      {tr(language, feature.text)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {plan.ctaLink === '/signup' ? (
                <Link
                  href={plan.ctaLink}
                  className={`block w-full text-center py-3 px-6 font-semibold transition-all font-serif ${
                    plan.highlighted
                      ? 'bg-[#0B3D2E] text-white hover:bg-[#0a3427]'
                      : 'border border-white/20 text-white hover:bg-white/10'
                  }`}
                >
                  {tr(language, plan.ctaText)}
                </Link>
              ) : (
                <button
                  onClick={() => setSelectedPlan(plan)}
                  className={`block w-full text-center py-3 px-6 font-semibold transition-all font-serif ${
                    plan.highlighted
                      ? 'bg-[#0B3D2E] text-white hover:bg-[#0a3427]'
                      : 'border border-white/20 text-white hover:bg-white/10'
                  }`}
                >
                  {tr(language, plan.ctaText)}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Footer Notes */}
        <div className="mt-16 text-center space-y-4">
          <div className="flex items-center justify-center gap-8 text-sm text-white/40 font-serif">
            <span>🔒 {tr(language, { zh: '端到端加密', en: 'End-to-end encrypted' })}</span>
            <span>📋 {tr(language, { zh: 'GDPR 合规', en: 'GDPR compliant' })}</span>
            <span>🚫 {tr(language, { zh: '数据绝不出售', en: 'Data never sold' })}</span>
          </div>
          <p className="text-xs text-white/30 font-serif">
            {tr(language, {
              zh: 'Founding Member 席位售罄后将不再开放，届时仅提供 Pro 月付方案',
              en: 'Founding Member seats will not reopen once sold out. Only Pro monthly will remain.',
            })}
          </p>
        </div>
      </div>

      {/* Subscription Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#FAF6EF] max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div 
              className="flex items-center justify-between p-6"
              style={{ borderBottom: `2px solid ${selectedPlan.tierColor}` }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 flex items-center justify-center"
                  style={{ backgroundColor: selectedPlan.tierColor, color: '#0B3D2E' }}
                >
                  {selectedPlan.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0B3D2E] font-serif">
                    {tr(language, selectedPlan.name)}
                  </h3>
                  <p className="text-sm text-[#0B3D2E]/60 font-serif">
                    {tr(language, selectedPlan.subtitle)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="p-2 hover:bg-[#0B3D2E]/10 transition-colors"
              >
                <X className="w-5 h-5 text-[#0B3D2E]/60" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Price Summary */}
              <div className="bg-[#0B3D2E] p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-white/60 font-serif">
                    {tr(language, { zh: '订阅费用', en: 'Subscription' })}
                  </span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-white font-serif">
                      {tr(language, selectedPlan.price)}
                    </span>
                    {selectedPlan.priceNote && (
                      <span className="text-white/60 text-sm font-serif">
                        {tr(language, selectedPlan.priceNote)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h4 className="font-semibold text-[#0B3D2E] mb-3 font-serif">
                  {tr(language, { zh: '会员权益', en: 'Benefits' })}
                </h4>
                <ul className="space-y-2">
                  {selectedPlan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-[#0B3D2E]/80 font-serif">
                      <Check className="w-4 h-4" style={{ color: selectedPlan.tierColor }} />
                      {tr(language, feature.text)}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Payment Methods */}
              <div className="mb-6">
                <h4 className="font-semibold text-[#0B3D2E] mb-3 font-serif">
                  {tr(language, { zh: '支付方式', en: 'Payment' })}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-4 border border-[#0B3D2E]/20 text-center hover:border-[#0B3D2E] transition-colors">
                    <span className="text-2xl">💳</span>
                    <p className="text-sm text-[#0B3D2E] mt-1 font-serif">
                      {tr(language, { zh: '信用卡', en: 'Card' })}
                    </p>
                  </button>
                  <button className="p-4 border border-[#0B3D2E]/20 text-center hover:border-[#0B3D2E] transition-colors">
                    <span className="text-2xl">📱</span>
                    <p className="text-sm text-[#0B3D2E] mt-1 font-serif">
                      {tr(language, { zh: '支付宝/微信', en: 'Alipay/WeChat' })}
                    </p>
                  </button>
                </div>
              </div>

              {/* Subscribe Button */}
              <button
                onClick={handleSubscribe}
                disabled={isProcessing}
                className="w-full py-4 bg-[#0B3D2E] text-white font-semibold hover:bg-[#0a3427] transition-colors disabled:opacity-50 font-serif"
              >
                {isProcessing
                  ? tr(language, { zh: '处理中...', en: 'Processing...' })
                  : tr(language, { zh: '确认订阅', en: 'Confirm' })}
              </button>

              <p className="text-xs text-[#0B3D2E]/50 mt-4 text-center font-serif">
                {tr(language, {
                  zh: '点击确认即表示同意服务条款和隐私政策',
                  en: 'By confirming, you agree to our Terms and Privacy Policy',
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
