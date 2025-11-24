'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';

const XFeed = dynamic(() => import('@/components/XFeed'), {
  loading: () => <div className="text-center py-8 text-[#0B3D2E]/60">加载中...</div>,
  ssr: false,
});

export default function SourcesPage() {
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

      {/* 权威来源内容 */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#0B3D2E] mb-4">
            一个没有"噪音"的信息流。
          </h1>
          
          <p className="text-[#0B3D2E]/80 leading-relaxed mb-2">
            我们从 X、顶级权威健康研报、Reddit 热议组等为您精选了该领域最顶尖的生理学家、神经科学家和表现专家的核心见解。
            没有励志名言，没有低效"技巧"，只有可执行的数据和第一性原理。
          </p>
          
          <p className="text-[#0B3D2E]/60 text-xs mb-10">
            (The internet is 99% noise and 1% signal. We've done the filtering for you. We curate core insights from top physiologists, neuroscientists, and performance experts on X (formerly Twitter). No motivational quotes, no inefficient 'hacks.' Just actionable data and first principles.)
          </p>

          {/* X Feed */}
          <div className="rounded-xl border border-[#E7E1D6] bg-white p-6 mb-8">
            <XFeed variant="bare" compact columns={2} limit={6} />
          </div>

          {/* 参考阅读 */}
          <div className="rounded-xl border border-[#E7E1D6] bg-[#FFFDF8] p-6">
            <div className="text-xs text-[#0B3D2E]/60 mb-2">参考阅读</div>
            <div className="text-sm text-[#0B3D2E]/90 mb-3">
              胆固醇过低与心理健康风险的相关性综述（英文）
            </div>
            <a
              className="inline-block text-xs text-[#0B3D2E] underline hover:text-[#0B3D2E]/80 transition-colors"
              href="https://www.healthline.com/health/cholesterol-can-it-be-too-low"
              target="_blank"
              rel="noreferrer"
            >
              Healthline：Can My Cholesterol Be Too Low?
            </a>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/landing"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium bg-[#0B3D2E] text-white rounded-lg hover:bg-[#0a3629] transition-colors"
            >
              返回主页
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
