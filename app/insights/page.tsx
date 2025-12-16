import Link from 'next/link';
import { getServerLanguage } from '@/lib/i18n-server';
import { tr } from '@/lib/i18n-core';
import AIAnalysisDisplay from '@/components/AIAnalysisDisplay';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function InsightsPage() {
  const language = await getServerLanguage();
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  // Placeholder data if no real analysis exists to show the UI structure
  const placeholderAnalysis = {
    confidence_score: 85,
    metabolic_rate_estimate: 'medium',
    sleep_quality: 'good',
    cortisol_pattern: 'elevated',
    recovery_capacity: 'medium',
    stress_resilience: 'low',
    inflammation_risk: 'low',
    energy_stability: 'stable',
    cardiovascular_health: 'good'
  };

  const placeholderPlan = {
    micro_habits: []
  };

  const analysis = profile?.ai_analysis_result || placeholderAnalysis;
  const plan = profile?.ai_recommendation_plan || placeholderPlan;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0B3D2E]">
      {/* Navigation */}
      <nav className="sticky top-0 z-30 bg-[#FDFBF7]/90 backdrop-blur border-b border-[#E7E1D6]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/landing" className="flex items-center gap-3 group">
              <div className="w-8 h-8 bg-[#0B3D2E] rounded-lg flex items-center justify-center text-white group-hover:bg-[#0a3629] transition-colors">
                <span className="font-serif italic font-bold">I</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-wide leading-none">INSIGHTS & BIOMETRICS</span>
                <span className="text-[10px] text-[#0B3D2E]/50 font-mono uppercase mt-0.5">MEDICAL GRADE ANALYSIS</span>
              </div>
            </Link>

            <Link href="/assistant" className="text-sm font-medium text-[#0B3D2E]/60 hover:text-[#0B3D2E] transition-colors">
              Base Command
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Report Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">

        {/* Executive Summary Section */}
        <section className="mb-12 grid md:grid-cols-2 gap-8 items-center border-b border-[#E7E1D6] pb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B3D2E]/5 border border-[#0B3D2E]/10 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#0B3D2E] animate-pulse"></span>
              <span className="text-xs font-mono font-medium text-[#0B3D2E]/80 uppercase tracking-wider">
                {tr(language, { zh: '生理系统状态：监测中', en: 'SYSTEM STATUS: MONITORING' })}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-serif font-medium text-[#0B3D2E] mb-6 tracking-tight leading-[1.1]">
              {tr(language, { zh: '从噪音中提取信号。', en: 'Extracting Signal from Noise.' })}
            </h1>

            <div className="prose prose-lg text-[#0B3D2E]/70">
              <p className="font-serif italic text-lg opacity-80">
                {tr(language, {
                  zh: '“健康产业充斥着噪音。我们只关注生理真相。你的焦虑不是性格缺陷，而是皮质醇失调的生理反应。”',
                  en: '"The health industry is full of noise. We focus on physiological truth. Your anxiety is not a character flaw, but a physiological response to cortisol dysregulation."'
                })}
              </p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-white rounded-xl border border-[#E7E1D6] shadow-sm">
              <div className="text-xs font-mono uppercase tracking-widest text-[#0B3D2E]/40 mb-2">Cognitive Load</div>
              <div className="text-3xl font-bold text-[#0B3D2E]">High</div>
              <div className="text-xs text-[#0B3D2E]/60 mt-1">Mental resource depletion</div>
            </div>
            <div className="p-6 bg-white rounded-xl border border-[#E7E1D6] shadow-sm">
              <div className="text-xs font-mono uppercase tracking-widest text-[#0B3D2E]/40 mb-2">Physiological Resilience</div>
              <div className="text-3xl font-bold text-[#9CAF88]">Fair</div>
              <div className="text-xs text-[#0B3D2E]/60 mt-1">Recovery capacity moderate</div>
            </div>
            <div className="col-span-2 p-6 bg-[#0B3D2E] rounded-xl border border-[#0B3D2E] shadow-sm text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="text-xs font-mono uppercase tracking-widest text-white/40 mb-2">Primary Directive</div>
                <div className="text-2xl font-serif font-medium text-white mb-1">
                  {tr(language, { zh: '接受真相，重获掌控。', en: 'Accept Truth. Regain Control.' })}
                </div>
                <div className="text-xs text-white/60">
                  {tr(language, { zh: '减少内耗，专注生理修复。', en: 'Reduce internal friction. Focus on physiological repair.' })}
                </div>
              </div>
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
            </div>
          </div>
        </section>

        {/* Detailed Report Component */}
        <section>
          <h2 className="text-xl font-bold text-[#0B3D2E] mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#0B3D2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            {tr(language, { zh: '完整生理分析报告', en: 'Full Physiological Analysis Report' })}
          </h2>
          <AIAnalysisDisplay analysis={analysis} plan={plan} />
        </section>

      </main>
    </div>
  );
}
