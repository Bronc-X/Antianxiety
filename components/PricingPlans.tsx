'use client';

import { useState } from 'react';
import Link from 'next/link';

interface PricingPlan {
  name: string;
  price: string;
  priceNote?: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaLink: string;
  highlighted?: boolean;
  badge?: string;
}

const pricingPlans: PricingPlan[] = [
  {
    name: 'Free版',
    price: '¥0',
    description: '有限 AI 助理使用次数',
    features: [
      '每日状态速记（睡眠/压力/情绪 3 项）',
      '7 日历史回顾',
      'Web 端访问',
      '公开社区内容浏览',
    ],
    ctaText: '免费使用',
    ctaLink: '/signup',
  },
  {
    name: '先行版',
    price: '¥99',
    priceNote: '一次性 · 永久使用',
    description: '为早期支持者保留的终身版本，所有月付版功能永久解锁',
    features: [
      'Pro 全部权益',
      '深度生理信号分析（皮质醇 / 节律）',
      '个性化信息推送（相关性 > 4.5/5）',
      'AI助理极速记忆系统 ',
      '智能提醒（最小阻力习惯）',
      '专家级数据分析与洞察',
      'Beta 功能优先体验',
      '专属 Onboarding 支持',
    ],
    ctaText: '锁定先行版',
    ctaLink: '/pricing?plan=lifetime',
    highlighted: true,
    badge: '限时',
  },
  {
    name: 'Pro版',
    price: '¥15/月',
    description: '按月订阅，随时取消，持续获得AI助理的陪伴',
    features: [
      'Free 权益全部开放',
      'AI 助理对话 + 贝叶斯信念曲线',
      '智能提醒（最小阻力习惯）',
      '个性化信息推送',
      '深度生理信号分析（节律）',
      '数据分析与洞察',
      '优先客服支持',
    ],
    ctaText: '立即订阅',
    ctaLink: '/pricing?plan=pro',
  },
];

export default function PricingPlans() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  return (
    <div className="bg-[#FAF6EF] py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-[#0B3D2E] mb-4">
            选择适合您的方案
          </h2>
          <p className="text-lg text-[#0B3D2E]/70 max-w-2xl mx-auto">
            基于第一性原理的科学方法，帮助您真正接受生理变化，对抗焦虑
          </p>
        </div>

        {/* 定价卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl border-2 bg-white p-8 shadow-lg transition-all hover:shadow-xl ${
                plan.highlighted
                  ? 'border-[#0B3D2E] scale-105'
                  : 'border-[#E7E1D6]'
              }`}
            >
              {/* 推荐标签 */}
              {plan.badge && (
                <div className="absolute -top-4 right-6">
                  <span className="bg-[#0B3D2E] text-white px-4 py-1 rounded-full text-sm font-semibold">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* 方案名称 */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-[#0B3D2E] mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[#0B3D2E]">
                    {plan.price}
                  </span>
                  {plan.priceNote && (
                    <span className="text-sm text-[#0B3D2E]/60">
                      {plan.priceNote}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#0B3D2E]/70 mt-2">
                  {plan.description}
                </p>
              </div>

              {/* 功能列表 */}
              <ul className="space-y-4 mb-8 min-h-[400px]">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-[#0B3D2E] mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm text-[#0B3D2E]/80">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA 按钮 */}
              <Link
                href={plan.ctaLink}
                onClick={() => setSelectedPlan(plan.name)}
                className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-all ${
                  plan.highlighted
                    ? 'bg-[#0B3D2E] text-white hover:bg-[#0a3427] shadow-md'
                    : 'bg-[#FAF6EF] text-[#0B3D2E] border-2 border-[#0B3D2E] hover:bg-[#0B3D2E] hover:text-white'
                }`}
              >
                {plan.ctaText}
              </Link>
            </div>
          ))}
        </div>

        {/* 底部说明 */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[#0B3D2E]/60 mb-4">
            💡 <strong>先行永久版说明：</strong>
            限时提供，适合早期支持者。购买后永久享受所有 Pro 功能，无需续费。
          </p>
          <p className="text-sm text-[#0B3D2E]/60">
             数据安全加密存储 | 符合 GDPR 标准 | 隐私政策
          </p>
        </div>
      </div>
    </div>
  );
}

