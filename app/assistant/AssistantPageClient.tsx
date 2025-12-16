'use client';

import { useI18n } from '@/lib/i18n';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, Target, ArrowRight } from 'lucide-react';
import HealthProfileForm from '@/components/HealthProfileForm';
import AIAnalysisDisplay from '@/components/AIAnalysisDisplay';
import DashboardPlans from '@/components/DashboardPlans';
import DailyCheckInPanel from '@/components/DailyCheckInPanel';

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
    if (hour < 12) return language === 'en' ? 'Good Morning' : '早安';
    if (hour < 18) return language === 'en' ? 'Good Afternoon' : '下午好';
    return language === 'en' ? 'Good Evening' : '晚上好';
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
      <div className="min-h-screen bg-[#FAF6EF] dark:bg-neutral-950 transition-colors">
        <nav className="sticky top-0 z-30 bg-[#FAF6EF]/90 backdrop-blur border-b border-[#E7E1D6]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <Link href="/landing" className="flex items-center gap-2 group">
                <span className="h-2 w-2 rounded-full bg-[#0B3D2E]" />
                <span className="text-sm font-semibold tracking-wide text-[#0B3D2E]">
                  AntiAnxiety™
                </span>
              </Link>
            </div>
          </div>
        </nav>
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center justify-center p-3 bg-[#0B3D2E]/5 rounded-full mb-4"
            >
              <Sparkles className="w-6 h-6 text-[#0B3D2E]" />
            </motion.div>
            <h1 className="text-3xl font-bold text-[#0B3D2E] mb-3">{t('assistant.welcome')}</h1>
            <p className="text-[#0B3D2E]/70 max-w-md mx-auto leading-relaxed">
              {t('assistant.completeProfile')}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-[#E7E1D6] p-8 shadow-sm">
            <HealthProfileForm userId={userId} />
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View (Main)
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0B3D2E]">

      {/* Navigation */}
      <nav className="sticky top-0 z-30 bg-[#FDFBF7]/90 backdrop-blur border-b border-[#E7E1D6]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/landing" className="flex items-center gap-3 group">
              <div className="w-8 h-8 bg-[#0B3D2E] rounded-lg flex items-center justify-center text-white group-hover:bg-[#0a3629] transition-colors">
                <Target className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-wide leading-none">COMMAND CENTER</span>
                <div className="flex items-center gap-1 text-[10px] text-[#0B3D2E]/50 font-mono uppercase mt-0.5">
                  <span>PROTOCOL ACTIVE</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <Link href="/landing" className="text-sm font-medium text-[#0B3D2E]/60 hover:text-[#0B3D2E] transition-colors">
                {t('assistant.backToHome')}
              </Link>
              <div className="w-px h-4 bg-[#E7E1D6]" />
              <div className="text-sm font-medium text-[#0B3D2E]">{profile?.full_name || 'User'}</div>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">

        {/* Header Section */}
        <header className="mb-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 text-[#0B3D2E]/60 text-sm font-medium mb-1">
                <Calendar className="w-4 h-4" />
                <span>{todayStr}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0B3D2E]">
                {getGreeting()}, {profile?.full_name?.split(' ')[0] || ''}.
              </h1>
            </div>

            {/* Focus of the Day Widget */}
            <div className="bg-white border border-[#E7E1D6] rounded-xl px-5 py-3 shadow-sm flex items-center gap-4 max-w-md w-full md:w-auto">
              <div className="w-10 h-10 rounded-full bg-[#FAF6EF] flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-[#9CAF88]" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#0B3D2E]/40 font-bold">Focus of the Day</div>
                <div className="text-sm font-semibold text-[#0B3D2E]">
                  {language === 'en' ? 'Consistency over intensity.' : '坚持大于强度。'}
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
              <DailyCheckInPanel
                initialProfile={profile}
                initialLogs={[]} // Fetched inside standard component or check for empty
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
              <h3 className="text-sm font-bold text-[#0B3D2E] mb-4 uppercase tracking-wide opacity-60">System</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => window.location.href = '/assistant?edit=true'}
                  className="p-3 bg-[#FAF6EF] rounded-xl text-sm font-medium text-[#0B3D2E] hover:bg-[#E7E1D6]/50 transition-colors text-left"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => window.location.href = '/settings'}
                  className="p-3 bg-[#FAF6EF] rounded-xl text-sm font-medium text-[#0B3D2E] hover:bg-[#E7E1D6]/50 transition-colors text-left"
                >
                  Settings
                </button>
              </div>
            </section>

          </div>

        </div>

      </main>
    </div>
  );
}
