import Link from 'next/link';
import Image from 'next/image';
import AnimatedSection from '@/components/AnimatedSection';

export const metadata = {
  title: 'Roadshow · No More anxious',
  description: '带外路演展示页，用于快速说明产品价值与演示路径。',
};

const flows = [
  {
    title: '入门与画像',
    description: '注册 / 登录 / 设置中心，收集身高体重、睡眠压力偏好，塑造 AI 画像。',
    steps: [
      '微信 / X / GitHub 第三方登录',
      'AI 性格选择：严格教练 / 温和朋友 / 科学极客',
      '数据安全提示与账号绑定',
    ],
  },
  {
    title: '核心仪表盘',
    description: 'Landing + 每日唯一核心任务，Supabase Realtime 实时刷新，保持单核行动。',
    steps: [
      '今日核心任务卡片 + 5 分钟完成度',
      '智能状态感知：数据积累中提示',
      '信念分数写入 → 触发贝叶斯曲线',
    ],
  },
  {
    title: '价值与转化',
    description: 'AI 代谢解码 + 升级页，展示科学依据、专属分子库，触发 Pro 升级。',
    steps: [
      '代谢雷达图 + 指标解释',
      '高效能人士 7 天精力复活方案',
      'Pro 解锁专属分子库 + 3 天试用 CTA',
    ],
  },
];

const proofPoints = [
  {
    label: 'AI 闭环',
    value: '单核心任务 + 信念分数 → AI 方案迭代',
    detail: '每天只给 1 个任务，完成后写入 habit_completions，下一天的方案自动收敛。',
  },
  {
    label: '科学背书',
    value: '代谢类型 + HRV + 压力恢复模型',
    detail: '使用 calculate_belief_curve_score() 等 SQL 函数，配合 HRV/压力逻辑，提供动态解释。',
  },
  {
    label: '商业化路径',
    value: 'Pro 升级入口已可用',
    detail: '升级页、分子库试用、账户绑定组件已上线，支持试用→订阅的闭环对话。',
  },
];

const screenshotColumns = [
  {
    title: 'Onboarding & 设置',
    tag: 'STEP 01',
    hint: '放置注册、登录、设置截图',
    preview: '/roadshow/col1.png',
    files: [
      'screencapture-localhost-3000-signup-2025-11-25-15_06_01.png',
      'screencapture-localhost-3000-login-2025-11-25-15_05_47.png',
      'screencapture-localhost-3000-settings-2025-11-25-15_05_11.png',
      'screencapture-localhost-3000-settings-2025-11-25-15_05_18.png',
    ],
  },
  {
    title: '核心仪表盘',
    tag: 'STEP 02',
    hint: '放置 Landing / Dashboard',
    preview: '/roadshow/col2.png',
    files: ['screencapture-localhost-3000-landing-2025-11-25-15_04_14.png'],
  },
  {
    title: '价值与升级',
    tag: 'STEP 03',
    hint: '放置分析、升级页截图',
    preview: '/roadshow/col3.png',
    files: [
      'screencapture-localhost-3000-analysis-2025-11-25-15_04_35.png',
      'screencapture-localhost-3000-onboarding-upgrade-2025-11-25-15_04_53.png',
    ],
  },
];

const galleryShots = [
  { title: '注册', src: '/roadshow/screencapture-localhost-3000-signup-2025-11-25-15_06_01.png' },
  { title: '登录', src: '/roadshow/screencapture-localhost-3000-login-2025-11-25-15_05_47.png' },
  { title: '设置 · 身体指标', src: '/roadshow/screencapture-localhost-3000-settings-2025-11-25-15_05_11.png' },
  { title: '设置 · AI 策略', src: '/roadshow/screencapture-localhost-3000-settings-2025-11-25-15_05_18.png' },
  { title: '设置 · 账号与会员', src: '/roadshow/screencapture-localhost-3000-settings-2025-11-25-15_05_25.png' },
  { title: '核心仪表盘', src: '/roadshow/screencapture-localhost-3000-landing-2025-11-25-15_04_14.png' },
  { title: 'AI 分析报告', src: '/roadshow/screencapture-localhost-3000-analysis-2025-11-25-15_04_35.png' },
  { title: '升级页', src: '/roadshow/screencapture-localhost-3000-onboarding-upgrade-2025-11-25-15_04_53.png' },
];

export default function RoadshowPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FAF6EF] text-[#0B3D2E]">
      <div className="breathing-background" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 lg:px-8 lg:pt-16">
        <AnimatedSection
          variant="fadeIn"
          className="mb-10 rounded-3xl bg-gradient-to-br from-[#0B3D2E] via-[#0F5138] to-[#0B3D2E] p-8 shadow-soft-lg text-white"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]">
                <span className="h-2 w-2 rounded-full bg-[#F5B301]" />
                Out-of-band Roadshow
              </div>
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                解锁「唯一核心任务」的 AI 代谢助手
              </h1>
              <p className="max-w-3xl text-base text-white/80">
                本页用于带外路演，5 分钟讲清楚：谁在用、为什么需要、演示顺序、商业化路径。
                截图可替换 /public/roadshow 下的预览占位。
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-white/25 px-3 py-1">Supabase Realtime</span>
                <span className="rounded-full border border-white/25 px-3 py-1">AI 方案闭环</span>
                <span className="rounded-full border border-white/25 px-3 py-1">Pro 试用转化</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl bg-white/5 p-5 shadow-soft">
              <div className="text-sm text-white/70">演示路径</div>
              <div className="space-y-2 text-base">
                <div>1) 注册 / 登录 / 设置</div>
                <div>2) Landing 核心任务 + 状态提示</div>
                <div>3) AI 分析报告 + 升级 CTA</div>
              </div>
              <a
                href="/roadshow/nomoreanxious_ui_matrix.png"
                download
                className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#0B3D2E] transition hover:bg-[#F5B301] hover:text-[#0B3D2E]"
              >
                下载截图矩阵 (放置后可用)
              </a>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection inView className="grid gap-4 rounded-3xl border border-[#E7E1D6] bg-white/80 p-6 shadow-soft backdrop-blur">
          <div className="grid gap-4 md:grid-cols-3">
            {proofPoints.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-[#E7E1D6] bg-white/80 p-5 shadow-soft hover-lift transition-organic"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#55695F]">
                  {item.label}
                </div>
                <div className="mt-2 text-lg font-semibold text-[#0B3D2E]">{item.value}</div>
                <p className="mt-2 text-sm text-[#405244]">{item.detail}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection inView className="mt-10 space-y-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#55695F]">演示顺序</p>
            <h2 className="text-2xl font-semibold text-[#0B3D2E]">3 步展示产品价值</h2>
            <p className="text-sm text-[#405244]">
              在现场或录屏演示时，按以下节奏走一遍，让观众在 3 分钟内理解入口、主线任务、升级点。
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {flows.map((flow) => (
              <div
                key={flow.title}
                className="relative overflow-hidden rounded-3xl border border-[#D4CBB8] bg-gradient-to-b from-[#EDE6D8] to-[#E0D7C5] p-5 shadow-soft-lg"
              >
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#F5B301]/10 blur-3xl" />
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-[#0B3D2E]">{flow.title}</h3>
                  <span className="rounded-full bg-[#0B3D2E] px-3 py-1 text-xs font-semibold text-white">
                    {flow.steps.length} Key Notes
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#405244]">{flow.description}</p>
                <ul className="mt-4 space-y-2 text-sm text-[#2F4135]">
                  {flow.steps.map((step) => (
                    <li key={step} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#0B3D2E]" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection inView className="mt-12 space-y-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#55695F]">
              截图墙（替换 /public/roadshow 下的占位）
            </p>
            <h2 className="text-2xl font-semibold text-[#0B3D2E]">实际界面 & 升级漏斗</h2>
            <p className="text-sm text-[#405244]">
              使用本地 Python 脚本合成 `nomoreanxious_ui_matrix.png`，或直接把以下文件放进 public/roadshow。
              没有截图时会显示有纹理的留白版面，不会阻塞演示。
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {screenshotColumns.map((col) => (
              <div
                key={col.title}
                className="flex flex-col gap-3 rounded-3xl border border-[#D4CBB8] bg-gradient-to-b from-[#F3EDE0] to-[#E6DCC8] p-4 shadow-soft-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#55695F]">{col.tag}</p>
                    <h3 className="text-lg font-semibold text-[#0B3D2E]">{col.title}</h3>
                    <p className="text-xs text-[#405244]">{col.hint}</p>
                  </div>
                  <span className="rounded-full bg-[#0B3D2E] px-3 py-1 text-xs font-semibold text-white">
                    {col.files.length} Shots
                  </span>
                </div>

                <div className="relative aspect-[3/5] overflow-hidden rounded-2xl border border-[#CBBEAA] bg-[radial-gradient(circle_at_20%_20%,rgba(11,61,46,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(245,179,1,0.08),transparent_30%)]">
                  <Image
                    src={col.preview}
                    alt={col.title}
                    fill
                    sizes="(min-width: 1024px) 400px, 100vw"
                    className="object-cover"
                    priority={col.tag === 'STEP 02'}
                    unoptimized
                  />
                  <div className="absolute inset-x-4 bottom-4 rounded-xl bg-white/80 px-3 py-2 text-xs text-[#304436] shadow-soft">
                    <div className="font-semibold text-[#0B3D2E]">文件名建议</div>
                    <ul className="mt-1 space-y-1">
                      {col.files.map((file) => (
                        <li key={file} className="truncate">
                          {file}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection inView className="mt-10 space-y-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#55695F]">
              全景界面墙
            </p>
            <h2 className="text-2xl font-semibold text-[#0B3D2E]">所有关键界面一屏展示</h2>
            <p className="text-sm text-[#405244]">
              适合现场路演时全屏播放或滚动浏览，每张图都来自 /public/roadshow。需要替换时直接覆盖同名文件即可。
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galleryShots.map((shot) => (
              <div
                key={shot.src}
                className="group overflow-hidden rounded-2xl border border-[#D4CBB8] bg-white/90 shadow-soft hover-lift transition-organic"
              >
                <div className="relative aspect-[4/5] w-full">
                  <Image
                    src={shot.src}
                    alt={shot.title}
                    fill
                    sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.02]"
                    unoptimized
                  />
                </div>
                <div className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="font-semibold text-[#0B3D2E]">{shot.title}</span>
                  <span className="rounded-full bg-[#0B3D2E]/10 px-2 py-1 text-xs font-semibold text-[#0B3D2E]">
                    Live UI
                  </span>
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection inView className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-[#D4CBB8] bg-[#0B3D2E] p-6 text-white shadow-soft-lg">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
              会议速讲
            </div>
            <h3 className="mt-3 text-2xl font-semibold">30 秒说明稿</h3>
            <p className="mt-2 text-sm text-white/80">
              “No More anxious 面向 30-45 岁高知用户。我们每天只推 1 个核心任务，把信念分数写入 Supabase，驱动贝叶斯曲线和个性化方案。
              已集成登录 / 设置 / 仪表盘 / 升级页，可现场演示，从 AI 方案闭环到 Pro 转化。”
            </p>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-[#F5B301]" />
                <span>现场操作：/signup → /landing → /analysis → /onboarding/upgrade</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-[#F5B301]" />
                <span>无网备份：下载截图矩阵，或直接展示下方纹理卡片</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#D4CBB8] bg-white/85 p-6 shadow-soft-lg backdrop-blur">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#55695F]">资产包</div>
            <h3 className="mt-2 text-xl font-semibold text-[#0B3D2E]">路演现场需要的东西</h3>
            <ul className="mt-3 space-y-2 text-sm text-[#405244]">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#0B3D2E]" />
                <span>
                  将截图放入 <code className="rounded bg-[#F3EDE0] px-2 py-1 text-xs text-[#0B3D2E]">public/roadshow</code>，文件名保持上表，按钮即可下载。
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#0B3D2E]" />
                <span>若无截图，页面会显示留白纹理，仍可照稿讲解，不阻塞流程。</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#0B3D2E]" />
                <span>需要联网演示时，直接访问 <code className="rounded bg-[#F3EDE0] px-2 py-1 text-xs text-[#0B3D2E]">/roadshow</code>，全屏展示。</span>
              </li>
            </ul>
            <div className="mt-4 flex gap-3">
              <Link
                href="/landing"
                className="inline-flex flex-1 items-center justify-center rounded-lg bg-[#0B3D2E] px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-[#0a3629]"
              >
                跳转实时演示
              </Link>
              <a
                href="/roadshow/nomoreanxious_ui_matrix.png"
                download
                className="inline-flex flex-1 items-center justify-center rounded-lg border border-[#0B3D2E] px-4 py-2 text-sm font-semibold text-[#0B3D2E] transition hover:bg-[#0B3D2E] hover:text-white"
              >
                下载截图矩阵
              </a>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
