import Link from 'next/link';
import { motion } from 'framer-motion';
import { getServerLanguage } from '@/lib/i18n-server';
import { tr } from '@/lib/i18n-core';

export default async function InsightsPage() {
  const language = await getServerLanguage();
  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* 简洁导航 */}
      <nav className="sticky top-0 z-30 bg-[#FAF6EF]/90 backdrop-blur border-b border-[#E7E1D6]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/landing" className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#0B3D2E]" />
              <span className="text-sm font-semibold tracking-wide text-[#0B3D2E]">
                AntiAnxiety™
              </span>
            </Link>
            <Link
              href="/landing"
              className="text-sm text-[#0B3D2E]/80 hover:text-[#0B3D2E] transition-colors"
            >
              {tr(language, { zh: '← 返回主页', en: '← Back to Home' })}
            </Link>
          </div>
        </div>
      </nav>

      {/* 核心洞察内容 */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#0B3D2E] leading-tight mb-4">
            <span className="block">
              {tr(language, { zh: '健康产业是「噪音」。', en: 'The health industry is “noise”.' })}
            </span>
            <span className="block">
              {tr(language, { zh: '生理信号是「真相」。', en: 'Physiological signals are “truth”.' })}
            </span>
          </h1>

          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {/* 认知负荷 */}
            <div className="rounded-2xl border border-[#E7E1D6] bg-white/90 backdrop-blur p-6 shadow-md">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B3D2E]/60 mb-2">
                Cognitive Load
              </div>
              <h3 className="text-xl font-medium text-[#0B3D2E] mb-4">
                {tr(language, { zh: '「认知负荷」已满。', en: 'Cognitive load is maxed out.' })}
              </h3>
              <div className="text-[#0B3D2E]/80 space-y-3 leading-relaxed text-sm">
                <p>
                  {tr(language, {
                    zh: '你知道有氧和力量训练；你懂得区分优质的蛋白质、脂肪和碳水；你也明白要保证充足睡眠。',
                    en: 'You know cardio and strength training. You can tell protein from fat and carbs. You know sleep matters.',
                  })}
                </p>
                <p>
                  {tr(language, { zh: '但身体仍像一个失控的「黑匣子」。', en: 'Yet your body still feels like a runaway black box.' })}
                </p>
                <p>
                  {tr(language, {
                    zh: '你发现：只是更努力地去坚持这些「规则」，并不是最终答案。',
                    en: 'And you’ve learned: trying harder to follow rules is not the answer.',
                  })}
                </p>
              </div>
            </div>

            {/* 打卡游戏 */}
            <div className="rounded-2xl border border-[#E7E1D6] bg-white/90 backdrop-blur p-6 shadow-md">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B3D2E]/60 mb-2">
                Habit Streaks
              </div>
              <h3 className="text-xl font-medium text-[#0B3D2E] mb-4">
                {tr(language, { zh: '打卡游戏好玩吗？', en: 'Are streak games helping?' })}
              </h3>
              <p className="text-[#0B3D2E]/80 leading-relaxed text-sm">
                {tr(language, {
                  zh: '许多健康 App 依赖「羞耻感」和「强制打卡」。功能越堆越多，认知负荷越压越重，却不触及「根本原因」。你的身体并没有崩溃，它只是在诚实地对压力做出反应。',
                  en: 'Many health apps rely on shame and forced streaks. More features, more cognitive load—yet they miss the root cause. Your body isn’t broken; it’s responding honestly to stress.',
                })}
              </p>
            </div>

            {/* 信号 */}
            <div className="rounded-2xl border border-[#E7E1D6] bg-white/90 backdrop-blur p-6 shadow-md">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B3D2E]/60 mb-2">
                The Signal
              </div>
              <h3 className="text-xl font-medium text-[#0B3D2E] mb-4">
                {tr(language, { zh: '信号：接受生理真相。', en: 'The signal: accept physiological truth.' })}
              </h3>
              <p className="text-[#0B3D2E]/80 leading-relaxed text-sm">
                {tr(language, {
                  zh: '我们承认新陈代谢的不可逆趋势，但可以选择如何「反应」。先解决「焦虑」（领先指标），自然改善「身体机能」（滞后指标）。不对抗真相，与真相和解。',
                  en: 'We acknowledge metabolic decline, but we can choose our response. Reduce anxiety (a leading indicator), and physiology (a lagging indicator) improves naturally. Don’t fight truth—make peace with it.',
                })}
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/landing"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium bg-[#0B3D2E] text-white rounded-lg hover:bg-[#0a3629] transition-colors"
            >
              {tr(language, { zh: '开始使用', en: 'Get Started' })}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
