import Link from 'next/link';
import { getServerLanguage } from '@/lib/i18n-server';
import { tr } from '@/lib/i18n-core';

export default async function MethodologyPage() {
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

      {/* 模型方法内容 */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#0B3D2E] mb-3">
            {tr(language, { zh: '解决思路', en: 'Methodology' })}
          </h1>
          <p className="text-sm text-[#0B3D2E]/70 mb-10">
            {tr(language, { zh: '这是 AntiAnxiety™ 的核心方法论。', en: "This is the core methodology of AntiAnxiety™." })}
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1: Agent */}
            <div className="rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-md">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B3D2E]/60 mb-2">
                Agent
              </div>
              <h3 className="text-xl font-medium text-[#0B3D2E] mb-4">
                {tr(language, { zh: '你的专属「健康代理」', en: 'Your Personal Health Agent' })}
              </h3>
              <p className="text-[#0B3D2E]/80 leading-relaxed text-sm mb-3">
                {tr(language, { zh: '这不是一个 AI 聊天机器人。', en: "This isn't a generic AI chatbot." })}
              </p>
              <p className="text-[#0B3D2E] font-semibold leading-relaxed text-sm mb-3">
                {tr(language, { zh: '它很冷静，因为它只遵循一条规则：「生理真相」。', en: 'It stays calm because it follows one rule: physiological truth.' })}
              </p>
              <p className="text-[#0B3D2E]/80 leading-relaxed text-sm mb-6">
                {tr(language, {
                  zh: '它不会说「加油！」。它会说：「你现在感到焦虑，意味着皮质醇已达峰值。5 分钟步行，是为了“代谢”压力激素。」',
                  en: 'It won’t say “You got this!”. It will say: “Your anxiety suggests cortisol is peaking. A 5‑minute walk helps metabolize stress hormones.”',
                })}
              </p>

              <Link
                href="/assistant"
                className="inline-flex items-center justify-center w-full rounded-md px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] shadow-md hover:shadow-lg transition-all"
              >
                {tr(language, { zh: '进入 AI 助理', en: 'Go to AI Assistant' })}
              </Link>

              <div className="mt-6 rounded-xl border border-[#E7E1D6] bg-[#FAF6EF] p-3">
                <div className="text-xs font-semibold text-[#0B3D2E] mb-1">
                  {tr(language, { zh: '皮质醇响应方程', en: 'Cortisol Response Equation' })}
                </div>
                <div className="font-mono text-sm text-[#0B3D2E] mb-1">
                  dC/dt = -λ·C(t) + I(t)
                </div>
                <p className="text-[11px] text-[#0B3D2E]/70">
                  {tr(language, {
                    zh: 'λ 控制焦虑激素的自然衰减；I(t) 代表 5 分钟步行等最小干预，用来把峰值皮质醇拉回基线。',
                    en: 'λ models natural decay of stress hormones; I(t) is a minimal intervention (e.g., a 5‑minute walk) that helps bring peak cortisol back to baseline.',
                  })}
                </p>
              </div>
            </div>

            {/* Card 2: Bayesian */}
            <div className="rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-md">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B3D2E]/60 mb-2">
                Bayesian
              </div>
              <h3 className="text-xl font-medium text-[#0B3D2E] mb-4">
                {tr(language, { zh: '「贝叶斯信念」循环', en: 'Bayesian Belief Loop' })}
              </h3>
              <p className="text-[#0B3D2E]/80 leading-relaxed text-sm mb-6">
                {tr(language, {
                  zh: '我们不为「打卡天数」焦虑，只关心「信念强度」。每次行动后，你会评估：这是否在起作用（确信度 1–10）。我们把它可视化为「信心曲线」。',
                  en: 'We don’t optimize for streaks. We optimize for belief strength. After each action, you rate confidence (1–10) that it’s working. We visualize it as a confidence curve.',
                })}
              </p>

              <div className="text-xs text-[#0B3D2E]/60 mb-4">
                参考：后验置信度随可验证信号更新（Bayes' theorem，
                <a
                  className="underline"
                  href="https://en.wikipedia.org/wiki/Bayes%27_theorem"
                  target="_blank"
                  rel="noreferrer"
                >
                  Wikipedia
                </a>
                ）
              </div>

              <div className="rounded-xl border border-[#E7E1D6] bg-[#FAF6EF] p-3 font-mono text-sm text-[#0B3D2E]">
                <div className="mb-1">P(H∣D) = [P(D∣H)·P(H)] / P(D)</div>
                <div className="text-[11px] text-[#0B3D2E]/70">
                  {tr(language, {
                    zh: '每次习惯完成都是新的 D：后验信念提高 → 曲线抬升；若错过记录，先验会自然衰减。',
                    en: 'Each completed habit is new D: posterior belief rises → the curve lifts. If you miss logs, priors decay naturally.',
                  })}
                </div>
              </div>
            </div>

            {/* Card 3: Minimum Dose */}
            <div className="rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-md">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B3D2E]/60 mb-2">
                Minimum Dose
              </div>
              <h3 className="text-xl font-medium text-[#0B3D2E] mb-4">
                {tr(language, { zh: '最低有效剂量', en: 'Minimum Effective Dose' })}
              </h3>
              <p className="text-[#0B3D2E]/80 leading-relaxed text-sm mb-6">
                {tr(language, {
                  zh: '你不需要每天锻炼 1 小时。你只需要在「线索」出现时，做一次「最低阻力」的反应（比如走 5 分钟）。我们帮你把这些微习惯固化成自动脚本。',
                  en: 'You don’t need 1 hour workouts daily. When a cue appears, execute the lowest-resistance response (e.g., a 5‑minute walk). We help you turn these micro-habits into automatic scripts.',
                })}
              </p>

              <div className="text-xs text-[#0B3D2E]/60 mb-4">
                参考：运动与奖赏/上瘾机制综述（
                <a
                  className="underline"
                  href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3181597/"
                  target="_blank"
                  rel="noreferrer"
                >
                  NCBI
                </a>
                ）
              </div>

              <div className="mt-4 rounded-xl border border-[#E7E1D6] bg-[#FAF6EF] p-3">
                <div className="font-mono text-sm text-[#0B3D2E] mb-1">
                  Δhabit = k · e<sup>−r</sup>
                </div>
                <p className="text-[11px] text-[#0B3D2E]/70">
                  {tr(language, {
                    zh: 'r 为阻力等级：阻力越低，增益越快（指数衰减）。每个微习惯都沿着最小阻力曲线被强化。',
                    en: 'r is resistance: lower resistance yields faster gains (exponential decay). Each micro-habit strengthens along the minimum-resistance curve.',
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/assistant"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium bg-[#0B3D2E] text-white rounded-lg hover:bg-[#0a3629] transition-colors"
            >
              {tr(language, { zh: '进入 AI 助理', en: 'Open AI Assistant' })}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
