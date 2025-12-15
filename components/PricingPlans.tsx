'use client';

import Link from 'next/link';
import { tr, useI18n } from '@/lib/i18n';

type LocalizedText = { zh: string; en: string; 'zh-TW'?: string };

interface PricingPlan {
  name: LocalizedText;
  price: LocalizedText;
  priceNote?: LocalizedText;
  description: LocalizedText;
  features: LocalizedText[];
  ctaText: LocalizedText;
  ctaLink: string;
  highlighted?: boolean;
  badge?: LocalizedText;
}

const pricingPlans: PricingPlan[] = [
  {
    name: { zh: 'Free 版', en: 'Free' },
    price: { zh: '¥0', en: '$0' },
    description: { zh: '有限 AI 助理使用次数', en: 'Limited AI assistant usage' },
    features: [
      { zh: '每日状态速记（睡眠/压力/情绪 3 项）', en: 'Daily quick log (sleep / stress / mood)' },
      { zh: '7 日历史回顾', en: '7-day history review' },
      { zh: 'Web 端访问', en: 'Web access' },
      { zh: '公开社区内容浏览', en: 'Browse public community content' },
    ],
    ctaText: { zh: '免费使用', en: 'Start Free' },
    ctaLink: '/signup',
  },
  {
    name: { zh: '先行版', en: 'Early Access' },
    price: { zh: '¥99', en: '$99' },
    priceNote: { zh: '一次性 · 永久使用', en: 'One-time · Lifetime' },
    description: {
      zh: '为早期支持者保留的终身版本，所有月付版功能永久解锁',
      en: 'A lifetime version for early supporters. Unlocks all Pro features forever.',
    },
    features: [
      { zh: 'Pro 全部权益', en: 'All Pro benefits' },
      { zh: '深度生理信号分析（皮质醇 / 节律）', en: 'Deep physiological analysis (cortisol / rhythm)' },
      { zh: '个性化信息推送（相关性 > 4.5/5）', en: 'Personalized feed (relevance > 4.5/5)' },
      { zh: 'AI 助理极速记忆系统', en: 'Fast AI memory system' },
      { zh: '智能提醒（最小阻力习惯）', en: 'Smart nudges (minimum-resistance habits)' },
      { zh: '专家级数据分析与洞察', en: 'Expert-level insights' },
      { zh: 'Beta 功能优先体验', en: 'Priority access to beta features' },
      { zh: '专属 Onboarding 支持', en: 'Dedicated onboarding support' },
    ],
    ctaText: { zh: '锁定先行版', en: 'Get Lifetime' },
    ctaLink: '/pricing?plan=lifetime',
    highlighted: true,
    badge: { zh: '限时', en: 'Limited' },
  },
  {
    name: { zh: 'Pro 版', en: 'Pro' },
    price: { zh: '¥15/月', en: '$15/mo' },
    description: { zh: '按月订阅，随时取消，持续获得 AI 助理的陪伴', en: 'Monthly subscription. Cancel anytime.' },
    features: [
      { zh: 'Free 权益全部开放', en: 'Everything in Free' },
      { zh: 'AI 助理对话 + 贝叶斯信念曲线', en: 'AI chat + Bayesian confidence curve' },
      { zh: '智能提醒（最小阻力习惯）', en: 'Smart nudges (minimum-resistance habits)' },
      { zh: '个性化信息推送', en: 'Personalized feed' },
      { zh: '深度生理信号分析（节律）', en: 'Deep physiology analysis (rhythm)' },
      { zh: '数据分析与洞察', en: 'Insights & analytics' },
      { zh: '优先客服支持', en: 'Priority support' },
    ],
    ctaText: { zh: '立即订阅', en: 'Subscribe' },
    ctaLink: '/pricing?plan=pro',
  },
];

export default function PricingPlans() {
  const { language } = useI18n();

  return (
    <div className="bg-[#FAF6EF] py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-[#0B3D2E] mb-4">
            {tr(language, { zh: '选择适合你的方案', en: 'Choose Your Plan' })}
          </h2>
          <p className="text-lg text-[#0B3D2E]/70 max-w-2xl mx-auto">
            {tr(language, {
              zh: '基于第一性原理的科学方法，帮助你真正接受生理变化，对抗焦虑',
              en: 'First-principles, evidence-based guidance to accept physiological change and reduce anxiety.',
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl border-2 bg-white p-8 shadow-lg transition-all hover:shadow-xl ${
                plan.highlighted ? 'border-[#0B3D2E] scale-105' : 'border-[#E7E1D6]'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 right-6">
                  <span className="bg-[#0B3D2E] text-white px-4 py-1 rounded-full text-sm font-semibold">
                    {tr(language, plan.badge)}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-[#0B3D2E] mb-2">
                  {tr(language, plan.name)}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[#0B3D2E]">
                    {tr(language, plan.price)}
                  </span>
                  {plan.priceNote && (
                    <span className="text-sm text-[#0B3D2E]/60">
                      {tr(language, plan.priceNote)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#0B3D2E]/70 mt-2">
                  {tr(language, plan.description)}
                </p>
              </div>

              <ul className="space-y-4 mb-8 min-h-[400px]">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-[#0B3D2E] mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-[#0B3D2E]/80">{tr(language, feature)}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaLink}
                className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-all ${
                  plan.highlighted
                    ? 'bg-[#0B3D2E] text-white hover:bg-[#0a3427] shadow-md'
                    : 'bg-[#FAF6EF] text-[#0B3D2E] border-2 border-[#0B3D2E] hover:bg-[#0B3D2E] hover:text-white'
                }`}
              >
                {tr(language, plan.ctaText)}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-[#0B3D2E]/60 mb-4">
            💡 <strong>{tr(language, { zh: '先行永久版说明：', en: 'Lifetime plan:' })}</strong>
            {tr(language, {
              zh: '限时提供，适合早期支持者。购买后永久享受所有 Pro 功能，无需续费。',
              en: 'Limited-time offer for early supporters. Pay once and keep all Pro features forever.',
            })}
          </p>
          <p className="text-sm text-[#0B3D2E]/60">
            {tr(language, {
              zh: '数据安全加密存储 | 符合 GDPR 标准 | 隐私政策',
              en: 'Encrypted data storage | GDPR-aligned | Privacy first',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
