'use client';

import { useI18n } from '@/lib/i18n';
import Link from 'next/link';
import HealthProfileForm from '@/components/HealthProfileForm';
import AIAnalysisDisplay from '@/components/AIAnalysisDisplay';

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
  const { t } = useI18n();

  if (showForm && !profile?.ai_profile_completed) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] dark:bg-neutral-950 transition-colors">
        <nav className="border-b border-[#E7E1D6] dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="h-14 flex items-center justify-between">
              <Link href="/landing" className="text-sm text-[#0B3D2E] dark:text-white hover:text-[#0B3D2E]/80 dark:hover:text-neutral-300">{t('assistant.backToHome')}</Link>
            </div>
          </div>
        </nav>
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-[#E7E1D6] dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 shadow-sm">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-semibold text-[#0B3D2E] dark:text-white">{t('assistant.welcome')}</h1>
              <p className="mt-2 text-sm text-[#0B3D2E]/80 dark:text-neutral-400">
                {t('assistant.completeProfile')}
              </p>
            </div>
            <HealthProfileForm userId={userId} />
          </div>
        </div>
      </div>
    );
  }

  if (showAnalysis && profile?.ai_analysis_result && profile?.ai_recommendation_plan && !isEdit) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] dark:bg-neutral-950 transition-colors">
        <nav className="border-b border-[#E7E1D6] dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="h-14 flex items-center justify-between">
              <Link href="/landing" className="text-sm text-[#0B3D2E] dark:text-white hover:text-[#0B3D2E]/80 dark:hover:text-neutral-300">{t('assistant.backToHome')}</Link>
              <h1 className="text-lg font-semibold text-[#0B3D2E] dark:text-white">{t('assistant.aiHealthReport')}</h1>
              <div className="w-16"></div>
            </div>
          </div>
        </nav>
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-semibold text-[#0B3D2E] dark:text-white">{t('assistant.aiHealthReport')}</h1>
            <p className="mt-2 text-sm text-[#0B3D2E]/80 dark:text-neutral-400">{t('assistant.basedOnData')}</p>
          </div>
          <AIAnalysisDisplay 
            analysis={profile.ai_analysis_result as never}
            plan={profile.ai_recommendation_plan as never}
          />
        </div>
      </div>
    );
  }

  // Default: show settings form
  return (
    <div className="min-h-screen bg-[#FAF6EF] dark:bg-neutral-950 transition-colors">
      <nav className="border-b border-[#E7E1D6] dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-14 flex items-center justify-between">
            <Link href="/landing" className="text-sm text-[#0B3D2E] dark:text-white hover:text-[#0B3D2E]/80 dark:hover:text-neutral-300">{t('assistant.backToHome')}</Link>
            <h1 className="text-lg font-semibold text-[#0B3D2E] dark:text-white">{t('assistant.healthSettings')}</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </nav>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-[#E7E1D6] dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold text-[#0B3D2E] dark:text-white">{t('assistant.personalizedSettings')}</h1>
            <p className="mt-2 text-sm text-[#0B3D2E]/80 dark:text-neutral-400">
              {t('assistant.dataPrivacy')}
            </p>
          </div>
          <HealthProfileForm 
            userId={userId} 
            initialData={profile as any} 
          />
        </div>
      </div>
    </div>
  );
}
