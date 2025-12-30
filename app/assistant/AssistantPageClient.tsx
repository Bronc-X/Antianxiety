'use client';

import { useI18n } from '@/lib/i18n';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, Target, ArrowRight } from 'lucide-react';
import HealthProfileForm from '@/components/HealthProfileForm';
import AIAnalysisDisplay from '@/components/AIAnalysisDisplay';
import DashboardPlans from '@/components/DashboardPlans';
import UnifiedDailyCalibration from '@/components/UnifiedDailyCalibration';

interface AssistantPageClientProps {
  userId: string;
  profile: any;
  showForm: boolean;
  showAnalysis: boolean;
  isEdit?: boolean;
}

export default function AssistantPageClient({
  userId,
  profile,
  showForm,
  showAnalysis,
  isEdit
}: AssistantPageClientProps) {
  const { t, language } = useI18n();

  // Helper for generating dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('assistant.greeting.morning');
    if (hour < 18) return t('assistant.greeting.afternoon');
    return t('assistant.greeting.evening');
  };

  const todayStr = new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  // State: Force show form if required
  if (showForm && !profile?.ai_profile_completed) {
    // ... existing onboarding render ...
    return (
      <div className="min-h-screen bg-[#FAF6EF] dark:bg-neutral-950 transition-colors relative overflow-hidden">
        {/* Background Aura */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-60">
          <div className="absolute -top-[10%] left-[10%] w-[60%] h-[60%] bg-emerald-100/30 dark:bg-emerald-500/10 rounded-full blur-[120px] animate-blob" />
          <div className="absolute top-[20%] right-[10%] w-[50%] h-[50%] bg-amber-100/30 dark:bg-amber-500/10 rounded-full blur-[100px] animate-blob animation-delay-4000" />
        </div>

        {/* Floating Navigation Dock */}
        <nav className="sticky top-4 z-10 mx-auto max-w-5xl px-4 text-center">
          <div className="glass-panel inline-flex items-center justify-between rounded-full px-8 py-3 shadow-lg shadow-black/5 dark:shadow-black/20 backdrop-blur-xl border-white/40 dark:border-white/10 mx-auto">
            <Link href="/unlearn/app" className="flex items-center gap-2 group">
              <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm animate-pulse" />
              <span className="text-sm font-bold tracking-wide text-[#0B3D2E] dark:text-white">
                AntiAnxiety™
              </span>
            </Link>
          </div>
        </nav>
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 mt-4">
          <div className="mb-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 to-amber-50 dark:from-emerald-900/20 dark:to-amber-900/20 rounded-full mb-6 border border-white/50 dark:border-white/10 shadow-sm"
            >
              <Sparkles className="w-6 h-6 text-[#0B3D2E] dark:text-emerald-400" />
            </motion.div>
            <h1 className="text-3xl font-black text-[#0B3D2E] dark:text-white mb-3 tracking-tight">{t('assistant.welcome')}</h1>
            <p className="text-[#0B3D2E]/70 dark:text-neutral-400 max-w-md mx-auto leading-relaxed font-medium">
              {t('assistant.completeProfile')}
            </p>
          </div>
          <div className="glass-panel p-8 border-glow rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-transparent rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            <HealthProfileForm userId={userId} />
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View (Main)
  return (
    <div className="min-h-screen bg-[#FAF6EF] dark:bg-neutral-950 text-[#0B3D2E] dark:text-white relative overflow-hidden transition-colors">
      {/* Background Aura */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-60">
        <div className="absolute top-[10%] left-[20%] w-[60%] h-[60%] bg-emerald-100/30 dark:bg-emerald-500/10 rounded-full blur-[120px] animate-blob" />
        <div className="absolute top-[40%] right-[20%] w-[50%] h-[50%] bg-amber-100/30 dark:bg-amber-500/10 rounded-full blur-[100px] animate-blob animation-delay-4000" />
      </div>

      {/* Floating Navigation Dock */}
      <nav className="sticky top-4 z-10 mx-auto max-w-5xl px-4 mb-8">
        <div className="glass-panel rounded-full px-6 py-3 flex items-center justify-between shadow-lg shadow-black/5 dark:shadow-black/20 backdrop-blur-xl border-white/40 dark:border-white/10">
          <Link href="/unlearn/app" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-[#0B3D2E] to-[#1a5f4a] dark:from-emerald-600 dark:to-teal-700 rounded-full flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Target className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-widest text-[#0B3D2E] dark:text-white leading-none">{t('assistant.commandCenter')}</span>
              <div className="flex items-center gap-1.5 text-[10px] text-[#0B3D2E]/60 dark:text-neutral-400 font-mono uppercase mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span>{t('assistant.protocolActive')}</span>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/unlearn/app" className="text-sm font-medium text-[#0B3D2E]/70 dark:text-neutral-300 hover:text-[#0B3D2E] dark:hover:text-white transition-colors">
              {t('assistant.backToHome')}
            </Link>
            <div className="w-px h-4 bg-[#0B3D2E]/10 dark:bg-white/10" />
            <div className="text-sm font-bold text-[#0B3D2E] dark:text-white">{profile?.full_name || 'User'}</div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">

        {/* Header Section */}
        <header className="mb-10 px-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
          >
            <div>
              <div className="flex items-center gap-2 text-[#0B3D2E]/60 dark:text-neutral-400 text-sm font-medium mb-2 pl-1">
                <Calendar className="w-4 h-4" />
                <span>{todayStr}</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#0B3D2E] dark:text-white leading-tight">
                {getGreeting()}, <span className="text-gradient-gold">{profile?.full_name?.split(' ')[0] || ''}</span>.
              </h1>
            </div>

            {/* Focus of the Day Widget */}
            <div className="glass-panel rounded-2xl px-6 py-4 flex items-center gap-5 max-w-md w-full md:w-auto border-glow relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FAF6EF] to-white dark:from-neutral-800 dark:to-neutral-900 border border-white/50 dark:border-white/5 flex items-center justify-center flex-shrink-0 shadow-sm relative z-10">
                <Target className="w-6 h-6 text-[#9CAF88]" />
              </div>
              <div className="relative z-10">
                <div className="text-[10px] uppercase tracking-widest text-[#0B3D2E]/50 dark:text-neutral-400 font-bold mb-0.5">{t('assistant.focusDay')}</div>
                <div className="text-sm font-bold text-[#0B3D2E] dark:text-white">
                  {t('assistant.consistency')}
                </div>
              </div>
            </div>
          </motion.div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Action & Inputs (7 cols) */}
          <div className="lg:col-span-7 space-y-8">

            {/* Daily Check In */}
            <section>
              <UnifiedDailyCalibration
                userId={userId}
                userName={profile?.full_name}
              />
            </section>

            {/* Analysis Report (If Available) */}
            {(showAnalysis && profile?.ai_analysis_result) && (
              <section>
                <AIAnalysisDisplay
                  analysis={profile.ai_analysis_result}
                  plan={profile.ai_recommendation_plan}
                />
              </section>
            )}
          </div>

          {/* Right Column: Status & Plans (5 cols) */}
          <div className="lg:col-span-5 space-y-8">

            {/* Plans Widget */}
            <section>
              <DashboardPlans userId={userId} />
            </section>

            {/* Quick Settings Access */}
            <section className="bg-white border border-[#E7E1D6] rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[#0B3D2E] mb-4 uppercase tracking-wide opacity-60">{t('assistant.system')}</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => window.location.href = '/assistant?edit=true'}
                  className="p-3 bg-[#FAF6EF] rounded-xl text-sm font-medium text-[#0B3D2E] hover:bg-[#E7E1D6]/50 transition-colors text-left"
                >
                  {t('assistant.editProfile')}
                </button>
                <button
                  onClick={() => window.location.href = '/settings'}
                  className="p-3 bg-[#FAF6EF] rounded-xl text-sm font-medium text-[#0B3D2E] hover:bg-[#E7E1D6]/50 transition-colors text-left"
                >
                  {t('assistant.settings')}
                </button>
              </div>
            </section>

          </div>

        </div>

      </main>
    </div>
  );
}
