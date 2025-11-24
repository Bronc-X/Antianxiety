import Link from 'next/link';
import { motion } from 'framer-motion';

export default function InsightsPage() {
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

      {/* 核心洞察内容 */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#0B3D2E] leading-tight mb-4">
            <span className="block">健康产业是"噪音"。</span>
            <span className="block">生理信号是"真相"。</span>
          </h1>
          
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {/* 认知负荷 */}
            <div className="rounded-2xl border border-[#E7E1D6] bg-white/90 backdrop-blur p-6 shadow-md">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B3D2E]/60 mb-2">
                Cognitive Load
              </div>
              <h3 className="text-xl font-medium text-[#0B3D2E] mb-4">
                "认知负荷"已满。
              </h3>
              <div className="text-[#0B3D2E]/80 space-y-3 leading-relaxed text-sm">
                <p>你知道有氧和力量训练；你懂得区分优质的蛋白质、脂肪和碳水。你明白要保证充足的睡眠。</p>
                <p>但身体仍然像一个失控的"黑匣子"。</p>
                <p>你发现，只是更努力地去坚持这些"规则"，并不是最终的答案。</p>
              </div>
            </div>

            {/* 打卡游戏 */}
            <div className="rounded-2xl border border-[#E7E1D6] bg-white/90 backdrop-blur p-6 shadow-md">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B3D2E]/60 mb-2">
                Habit Streaks
              </div>
              <h3 className="text-xl font-medium text-[#0B3D2E] mb-4">
                打卡游戏好玩吗？
              </h3>
              <p className="text-[#0B3D2E]/80 leading-relaxed text-sm">
                许多健康App依赖"羞耻感"和"强制打卡"。功能越来越多，认知负荷越来越重，却不触及"根本原因"。你的身体并没有崩溃，它只是在诚实地对压力做出反应。
              </p>
            </div>

            {/* 信号 */}
            <div className="rounded-2xl border border-[#E7E1D6] bg-white/90 backdrop-blur p-6 shadow-md">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B3D2E]/60 mb-2">
                The Signal
              </div>
              <h3 className="text-xl font-medium text-[#0B3D2E] mb-4">
                信号：接受生理真相。
              </h3>
              <p className="text-[#0B3D2E]/80 leading-relaxed text-sm">
                我们承认新陈代谢的不可逆趋势，但可以选择"反应"。先解决"焦虑"（领先指标），自然改善"身体机能"（滞后指标）。不对抗真相，与真相和解。
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/landing"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium bg-[#0B3D2E] text-white rounded-lg hover:bg-[#0a3629] transition-colors"
            >
              开始使用
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
