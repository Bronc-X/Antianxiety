import Link from 'next/link';

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* 简洁导航 */}
      <nav className="sticky top-0 z-30 bg-[#FAF6EF]/90 backdrop-blur border-b border-[#E7E1D6]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/landing" className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#0B3D2E]" />
              <span className="text-sm font-semibold tracking-wide text-[#0B3D2E]">
                No More anxious™
              </span>
            </Link>
            <Link
              href="/landing"
              className="text-sm text-[#0B3D2E]/80 hover:text-[#0B3D2E] transition-colors"
            >
              ← 返回主页
            </Link>
          </div>
        </div>
      </nav>

      {/* 模型方法内容 */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#0B3D2E] mb-3">
            解决思路
          </h1>
          <p className="text-sm text-[#0B3D2E]/70 mb-10">
            这是 No More anxious™ 的核心方法论。
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1: Agent */}
            <div className="rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-md">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B3D2E]/60 mb-2">
                Agent
              </div>
              <h3 className="text-xl font-medium text-[#0B3D2E] mb-4">
                您的专属"健康代理"
              </h3>
              <p className="text-[#0B3D2E]/80 leading-relaxed text-sm mb-3">
                这不是一个AI聊天机器人。
              </p>
              <p className="text-[#0B3D2E] font-semibold leading-relaxed text-sm mb-3">
                它冷血，因为它只会基于唯一的规则："生理真相"。
              </p>
              <p className="text-[#0B3D2E]/80 leading-relaxed text-sm mb-6">
                它不会说"加油！"。它会说："你现在感到焦虑，意味着你的皮质醇已达峰值。一个5分钟的步行是为了 '代谢' 你的压力激素。"
              </p>

              <Link
                href="/assistant"
                className="inline-flex items-center justify-center w-full rounded-md px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] shadow-md hover:shadow-lg transition-all"
              >
                点击进入你的 AI 助理
              </Link>

              <div className="mt-6 rounded-xl border border-[#E7E1D6] bg-[#FAF6EF] p-3">
                <div className="text-xs font-semibold text-[#0B3D2E] mb-1">
                  皮质醇响应方程
                </div>
                <div className="font-mono text-sm text-[#0B3D2E] mb-1">
                  dC/dt = -λ·C(t) + I(t)
                </div>
                <p className="text-[11px] text-[#0B3D2E]/70">
                  λ 控制焦虑激素的自然衰减，输入 I(t) 代表 5 分钟步行等最小干预，帮助把峰值皮质醇拉回基线。
                </p>
              </div>
            </div>

            {/* Card 2: Bayesian */}
            <div className="rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-md">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B3D2E]/60 mb-2">
                Bayesian
              </div>
              <h3 className="text-xl font-medium text-[#0B3D2E] mb-4">
                "贝叶斯信念"循环
              </h3>
              <p className="text-[#0B3D2E]/80 leading-relaxed text-sm mb-6">
                我们从来不为"打卡天数"而焦虑。我们只关心"信念强度"。每次行动后，你将评估："这在起作用的确信度(1-10)"。我们帮你可视化"信心曲线"。
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
                  每次习惯完成即是新的 D，后验信念提高 → 曲线抬升；若错过记录，先验自动衰减。
                </div>
              </div>
            </div>

            {/* Card 3: Minimum Dose */}
            <div className="rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-md">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B3D2E]/60 mb-2">
                Minimum Dose
              </div>
              <h3 className="text-xl font-medium text-[#0B3D2E] mb-4">
                最低有效剂量
              </h3>
              <p className="text-[#0B3D2E]/80 leading-relaxed text-sm mb-6">
                你不需要每天锻炼1小时，那太累了。你只需要在"线索"出现时，执行"最低阻力"的"反应"（如步行5分钟）。我们帮你识别并建立这些"微习惯"，直到它们成为"自动脚本"。
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
                  r 为阻力等级，阻力越低，增益越快（指数衰减）；每个微习惯都沿着这条最小阻力曲线被强化。
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/assistant"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium bg-[#0B3D2E] text-white rounded-lg hover:bg-[#0a3629] transition-colors"
            >
              进入 AI 助理
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
