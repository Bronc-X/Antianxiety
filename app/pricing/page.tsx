import PricingPlans from '@/components/PricingPlans';
import AnimatedSection from '@/components/AnimatedSection';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* Hero 区域 */}
      <AnimatedSection variant="fadeUp" className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-[#0B3D2E] mb-6">
            科学对抗焦虑，理性接受变化
          </h1>
          <p className="text-xl text-[#0B3D2E]/70 mb-8">
            基于第一性原理的 AI 辅助健康管理平台
            <br />
            让进入退行性年龄的用户真正接受生理变化
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
              <span>冷峻理性的 AI 助手</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>贝叶斯信念循环</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>个性化信息推送</span>
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
            常见问题
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-[#E7E1D6]">
              <h3 className="text-lg font-semibold text-[#0B3D2E] mb-2">
                先行永久版和 Pro 版有什么区别？
              </h3>
              <p className="text-[#0B3D2E]/70">
                先行永久版是一次性付费 ¥299，永久享受所有 Pro 功能，无需续费。
                Pro 版是月度订阅 ¥99/月，功能相同但需要持续付费。先行永久版适合早期支持者，限时提供。
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-[#E7E1D6]">
              <h3 className="text-lg font-semibold text-[#0B3D2E] mb-2">
                Free 版有哪些限制？
              </h3>
              <p className="text-[#0B3D2E]/70">
                Free 版提供基础功能，包括数据记录、习惯打卡、基础图表等。
                但不包含 AI 个性化建议、贝叶斯信念循环完整功能、个性化信息推送等高级功能。
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-[#E7E1D6]">
              <h3 className="text-lg font-semibold text-[#0B3D2E] mb-2">
                可以随时取消订阅吗？
              </h3>
              <p className="text-[#0B3D2E]/70">
                可以。Pro 版支持随时取消，取消后仍可使用至当前计费周期结束。
                所有方案均支持 7 天无理由退款。
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-[#E7E1D6]">
              <h3 className="text-lg font-semibold text-[#0B3D2E] mb-2">
                数据安全如何保障？
              </h3>
              <p className="text-[#0B3D2E]/70">
                所有数据均加密存储，符合 GDPR 标准。我们不会分享您的个人数据给第三方。
                您可以随时导出或删除您的数据。
              </p>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}

