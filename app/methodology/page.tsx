import Link from 'next/link';
import { getServerLanguage } from '@/lib/i18n-server';
import { tr } from '@/lib/i18n-core';
import { ArrowRight, Brain, Activity, TrendingUp } from 'lucide-react';

export default async function MethodologyPage() {
  const language = await getServerLanguage();

  const cards = [
    {
      id: 'agent',
      title: tr(language, { zh: '生理真相代理', en: 'Physiological Truth Agent' }),
      subtitle: tr(language, { zh: '你的专属健康代理', en: 'Your Personal Health Agent' }),
      description: tr(language, {
        zh: '它很冷静，因为它只遵循一条规则：「生理真相」。它不会说空洞的鼓励，只会基于皮质醇方程给出科学建议。',
        en: 'It stays calm because it follows one rule: physiological truth. No empty encouragement, just scientific advice based on the cortisol equation.'
      }),
      gradient: 'from-[#FF9A9E] to-[#FECFEF]', // Warm Pink/Peach
      icon: <Brain className="w-8 h-8 text-white" />,
      equation: 'dC/dt = -λ·C(t) + I(t)',
      equationNote: tr(language, { zh: '皮质醇响应模型', en: 'Cortisol Response Model' })
    },
    {
      id: 'bayesian',
      title: tr(language, { zh: '贝叶斯信念循环', en: 'Bayesian Belief Loop' }),
      subtitle: tr(language, { zh: '数据驱动的信心', en: 'Data-Driven Confidence' }),
      description: tr(language, {
        zh: '我们不优化打卡天数，只优化信念强度。每次行动都是新的证据，通过贝叶斯定理更新你的抗焦虑信心曲线。',
        en: 'We optimize belief strength, not streaks. Every action is new evidence, updating your anti-anxiety confidence curve via Bayes theorem.'
      }),
      gradient: 'from-[#a18cd1] to-[#fbc2eb]', // Purple/Lavender
      icon: <TrendingUp className="w-8 h-8 text-white" />,
      equation: 'P(H|D) = [P(D|H)·P(H)] / P(D)',
      equationNote: tr(language, { zh: '信念更新定理', en: 'Belief Update Theorem' })
    },
    {
      id: 'dose',
      title: tr(language, { zh: '最低有效剂量', en: 'Minimum Effective Dose' }),
      subtitle: tr(language, { zh: '微习惯脚本', en: 'Micro-Habit Scripts' }),
      description: tr(language, {
        zh: '无需每天1小时。在焦虑线索出现时，执行一次「最低阻力」反应（如5分钟步行），利用多巴胺回路重塑大脑。',
        en: 'No hour-long grinds. When cues appear, execute a "minimum resistance" response (e.g., 5min walk) to rewire dopamine circuits.'
      }),
      gradient: 'from-[#84fab0] to-[#8fd3f4]', // Mint/Teal
      icon: <Activity className="w-8 h-8 text-white" />,
      equation: 'Δhabit = k · e⁻ʳ',
      equationNote: tr(language, { zh: '习惯强化公式', en: 'Habit Strength Formula' })
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Navigation */}
      <nav className="sticky top-0 z-30 bg-[#FDFBF7]/80 backdrop-blur-md border-b border-black/5">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-20 items-center justify-between">
            <Link href="/landing" className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
              <div className="h-3 w-3 rounded-full bg-[#0B3D2E]" />
              <span className="text-sm font-bold tracking-widest text-[#0B3D2E] uppercase">
                AntiAnxiety™
              </span>
            </Link>
            <Link
              href="/landing"
              className="group flex items-center gap-2 text-sm font-medium text-[#0B3D2E] transition-colors"
            >
              <span>{tr(language, { zh: '返回', en: 'Back' })}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-20">
        {/* Header Section */}
        <div className="max-w-3xl mb-24">
          <h1 className="text-5xl sm:text-7xl font-bold text-[#0B3D2E] mb-8 tracking-tight leading-[1.1]">
            {tr(language, { zh: '科学的方法论', en: 'The Science.' })}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0B3D2E] to-[#9CAF88]">
              {tr(language, { zh: '不是鸡汤。', en: 'Not Magic.' })}
            </span>
          </h1>
          <p className="text-xl text-[#0B3D2E]/60 max-w-2xl leading-relaxed">
            {tr(language, {
              zh: 'AntiAnxiety™ 建立在三个核心支柱之上：生理反馈、贝叶斯概率论和行为心理学。',
              en: 'AntiAnxiety™ is built on three core pillars: Physiological Feedback, Bayesian Probability, and Behavioral Psychology.'
            })}
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          {cards.map((card) => (
            <div
              key={card.id}
              className="group relative h-full bg-white rounded-[2rem] overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-2 border border-[#EBE5da]"
            >
              {/* Render specific illustration based on card.id */}
              <div
                className="relative group-hover:scale-[1.02] transition-transform duration-700 ease-out"
              >
                {/* Header Image Container */}
                <div className={`h-48 w-full relative overflow-hidden flex items-center justify-center ${card.id === 'agent' ? 'bg-[#E8F3E8]' :
                    card.id === 'bayesian' ? 'bg-[#FFF8E7]' : 'bg-[#F2EFE9]'
                  }`}>

                  <div className="absolute inset-0 opacity-20 bg-[url('/assets/noise.png')] mix-blend-overlay" />

                  {/* 3D Illustration */}
                  <div className="relative z-10 w-full h-full p-6 flex items-center justify-center">
                    {card.id === 'agent' && (
                      <img src="/assets/illustrations/agent.png" alt="Physiological Agent" className="w-auto h-full object-contain drop-shadow-2xl opacity-90 group-hover:scale-110 transition-transform duration-700" />
                    )}
                    {card.id === 'bayesian' && (
                      <img src="/assets/illustrations/bayesian.png" alt="Bayesian Loop" className="w-auto h-full object-contain drop-shadow-2xl opacity-90 group-hover:rotate-180 transition-transform duration-[2s] ease-in-out" />
                    )}
                    {card.id === 'minimum_dose' && (
                      <img src="/assets/illustrations/minimum_dose.png" alt="Minimum Dose" className="w-auto h-full object-contain drop-shadow-2xl opacity-90 group-hover:translate-y-[-5px] transition-transform duration-700" />
                    )}
                  </div>

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F6] via-transparent to-transparent opacity-60" />
                </div>

                {/* Icon Badge */}
                <div className="absolute bottom-4 left-6 bg-white/40 backdrop-blur-md border border-white/40 p-2.5 rounded-xl shadow-lg z-20">
                  {card.icon}
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="text-xs font-bold tracking-widest text-[#0B3D2E]/40 uppercase mb-3">
                  {card.title}
                </div>
                <h3 className="text-2xl font-bold text-[#0B3D2E] mb-4 group-hover:text-[#2A9D8F] transition-colors">
                  {card.subtitle}
                </h3>
                <p className="text-[#0B3D2E]/70 leading-relaxed mb-8">
                  {card.description}
                </p>

                {/* Equation Footer */}
                <div className="mt-auto bg-[#FAF9F6] rounded-xl p-4 border border-[#EBE5da]">
                  <div className="font-mono text-sm text-[#0B3D2E] mb-1 font-medium">
                    {card.equation}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-[#0B3D2E]/40 font-semibold">
                    {card.equationNote}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="relative rounded-[2.5rem] bg-[#0B3D2E] overflow-hidden px-8 py-20 text-center">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-full opacity-30">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#9CAF88] rounded-full blur-[100px] -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#4A7C59] rounded-full blur-[100px] -ml-32 -mb-32" />
          </div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              {tr(language, { zh: '准备好开始你的实验了吗？', en: 'Ready to start your experiment?' })}
            </h2>
            <p className="text-[#9CAF88] text-lg mb-10">
              {tr(language, {
                zh: '这不是治疗，这是一场关于你大脑的科学实验。让我们开始收集数据。',
                en: 'This is not therapy. It is a scientific experiment on your brain. Let\'s gather data.'
              })}
            </p>
            <Link
              href="/assistant"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-[#0B3D2E] rounded-full font-bold text-lg hover:bg-[#F0FDF4] transition-all hover:scale-105 shadow-xl"
            >
              <span>{tr(language, { zh: '唤醒代理', en: 'Awaken Agent' })}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
