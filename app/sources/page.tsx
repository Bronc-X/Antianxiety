'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, ExternalLink, Quote } from 'lucide-react';
import { tr, useI18n } from '@/lib/i18n';
import JournalShowcase from '@/components/JournalShowcase';

const XFeed = dynamic(() => import('@/components/XFeed'), {
  loading: () => <div className="h-64 flex items-center justify-center text-[#0B3D2E]/40 text-sm">Loading feed...</div>,
  ssr: false,
});

export default function SourcesPage() {
  const { language } = useI18n();

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* Navigation */}
      <nav className="sticky top-0 z-30 bg-[#FAF6EF]/90 backdrop-blur border-b border-[#E7E1D6]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/unlearn/app" className="flex items-center gap-2 group">
              <ArrowLeft className="w-4 h-4 text-[#0B3D2E]/60 group-hover:text-[#0B3D2E] transition-colors" />
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#0B3D2E]" />
                <span className="text-sm font-semibold tracking-wide text-[#0B3D2E]">
                  AntiAnxiety™
                </span>
              </div>
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-6xl font-black text-[#0B3D2E] mb-6 tracking-tight leading-[1.1]">
              {tr(language, { zh: '噪音越少，', en: 'Less Noise.' })}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0B3D2E] to-[#9CAF88]">
                {tr(language, { zh: '真相越多。', en: 'More Signal.' })}
              </span>
            </h1>

            <p className="text-xl text-[#0B3D2E]/70 leading-relaxed max-w-2xl mb-8">
              {tr(language, {
                zh: '在充斥着营销号和伪科学的互联网中，我们为你过滤出 1% 的信号。只有经过同行评审的论文、核心生理学数据和领域专家的第一性原理。',
                en: 'In an internet full of marketing fluff and pseudoscience, we filter for the 1% signal. Only peer-reviewed papers, core physiological data, and first principles from domain experts.'
              })}
            </p>

            <div className="flex items-center gap-4 text-xs font-mono text-[#0B3D2E]/40 uppercase tracking-widest">
              <span>PROVEN ORIGINS</span>
              <span className="w-px h-3 bg-[#0B3D2E]/20" />
              <span>PEER REVIEWED</span>
              <span className="w-px h-3 bg-[#0B3D2E]/20" />
              <span>NO HACKS</span>
            </div>
          </motion.div>
        </div>

        {/* Two Column Layout */}
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16">

          {/* Column 1: Academic Papers */}
          <section>
            <div className="flex items-center gap-2 mb-6 text-[#0B3D2E]">
              <BookOpen className="w-5 h-5" />
              <h2 className="text-xl font-bold">
                {tr(language, { zh: '核心文献库', en: 'Core Literature' })}
              </h2>
            </div>

            <div className="space-y-6">
              <JournalShowcase language={language as 'en' | 'zh'} columns={2} limit={4} />

              <div className="p-4 rounded-xl bg-[#FFFDF8] border border-[#E7E1D6] mt-4">
                <p className="text-xs text-[#0B3D2E]/60 leading-relaxed">
                  {tr(language, {
                    zh: '* 所有文献均选自 Nature Neuroscience, JAMA Psychiatry 等顶级期刊，已经过 AntiAnxiety 科学团队二次验证。',
                    en: '* All literature is selected from top journals like Nature Neuroscience, JAMA Psychiatry, and verified by the AntiAnxiety science team.'
                  })}
                </p>
              </div>
            </div>
          </section>

          {/* Column 2: Expert Feed */}
          <section>
            <div className="flex items-center gap-2 mb-6 text-[#0B3D2E]">
              <Quote className="w-5 h-5" />
              <h2 className="text-xl font-bold">
                {tr(language, { zh: '专家信号流', en: 'Expert Signal Feed' })}
              </h2>
            </div>

            <div className="bg-white rounded-2xl border border-[#E7E1D6] p-1 shadow-sm">
              <div className="bg-[#FAF6EF]/30 rounded-xl p-4 sm:p-6">
                <XFeed variant="bare" compact columns={1} limit={4} />
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-24 text-center border-t border-[#E7E1D6] pt-12">
          <p className="text-[#0B3D2E]/40 text-sm mb-4">
            AntiAnxiety™ Research Division
          </p>
        </div>

      </main>
    </div>
  );
}
