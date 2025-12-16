import PricingPlans from '@/components/PricingPlans';
import AnimatedSection from '@/components/AnimatedSection';
import { getServerLanguage } from '@/lib/i18n-server';
import { tr } from '@/lib/i18n-core';

export default async function PricingPage() {
  const language = await getServerLanguage();
  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* Hero 区域 */}
      <AnimatedSection variant="fadeUp" className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-[#0B3D2E] mb-6">
            {tr(language, { zh: '科学对抗焦虑，理性接受变化', en: 'Fight Anxiety with Science. Accept Change with Clarity.' })}
          </h1>
          <p className="text-xl text-[#0B3D2E]/70 mb-8">
            {tr(language, { zh: '基于第一性原理的 AI 辅助健康管理平台', en: 'An AI-assisted health platform built on first principles.' })}
            <br />
            {tr(language, { zh: '让进入退行性年龄的用户真正接受生理变化', en: 'Helping you accept physiological change—without shame or noise.' })}
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-[#0B3D2E]/60">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{tr(language, { zh: '冷峻理性的 AI 助手', en: 'A calm, rational AI assistant' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{tr(language, { zh: '贝叶斯信念循环', en: 'Bayesian belief loop' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{tr(language, { zh: '个性化信息推送', en: 'Personalized signal feed' })}</span>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* 定价方案 */}
      <PricingPlans />

      {/* FAQ 区域 */}
      <AnimatedSection variant="fadeUp" className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0B3D2E] mb-8 text-center">
            {tr(language, { zh: '常见问题', en: 'FAQ' })}
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-[#E7E1D6]">
              <h3 className="text-lg font-semibold text-[#0B3D2E] mb-2">
                {tr(language, { zh: '先行永久版和 Pro 版有什么区别？', en: "What's the difference between Lifetime and Pro?" })}
              </h3>
              <p className="text-[#0B3D2E]/70">
                {tr(language, {
                  zh: '先行永久版是一次性付费 ¥299，永久享受所有 Pro 功能，无需续费。Pro 版是月度订阅 ¥99/月，功能相同但需要持续付费。先行永久版适合早期支持者，限时提供。',
                  en: 'Lifetime is a one-time payment that unlocks Pro features forever. Pro is a monthly subscription with the same features, billed continuously. Lifetime is a limited-time offer for early supporters.',
                })}
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-[#E7E1D6]">
              <h3 className="text-lg font-semibold text-[#0B3D2E] mb-2">
                {tr(language, { zh: 'Free 版有哪些限制？', en: 'What are the limitations of Free?' })}
              </h3>
              <p className="text-[#0B3D2E]/70">
                {tr(language, {
                  zh: 'Free 版提供基础功能，包括数据记录、习惯打卡、基础图表等。但不包含 AI 个性化建议、贝叶斯信念循环完整功能、个性化信息推送等高级功能。',
                  en: 'Free includes basic tracking and simple charts, but excludes full AI personalization, the complete Bayesian loop, and advanced signal feed features.',
                })}
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-[#E7E1D6]">
              <h3 className="text-lg font-semibold text-[#0B3D2E] mb-2">
                {tr(language, { zh: '可以随时取消订阅吗？', en: 'Can I cancel anytime?' })}
              </h3>
              <p className="text-[#0B3D2E]/70">
                {tr(language, {
                  zh: '可以。Pro 版支持随时取消，取消后仍可使用至当前计费周期结束。所有方案均支持 7 天无理由退款。',
                  en: 'Yes. You can cancel Pro anytime and keep access until the end of your billing period. All plans include a 7‑day refund window.',
                })}
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-[#E7E1D6]">
              <h3 className="text-lg font-semibold text-[#0B3D2E] mb-2">
                {tr(language, { zh: '数据安全如何保障？', en: 'How do you protect data?' })}
              </h3>
              <p className="text-[#0B3D2E]/70">
                {tr(language, {
                  zh: '所有数据均加密存储，符合 GDPR 标准。我们不会分享你的个人数据给第三方。你可以随时导出或删除数据。',
                  en: 'All data is stored with encryption and aligned with GDPR. We don’t share your personal data with third parties. You can export or delete your data anytime.',
                })}
              </p>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
