'use client';

import { useI18n } from '@/lib/i18n';
import PlanListWithActions from '@/components/PlanListWithActions';

interface PlansPageClientProps {
  initialPlans: any[];
}

export default function PlansPageClient({ initialPlans }: PlansPageClientProps) {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-[#FAF6EF] dark:bg-neutral-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0B3D2E] dark:text-white mb-2">
            {t('plans.myHealthPlans')}
          </h1>
          <p className="text-[#0B3D2E]/60 dark:text-neutral-400">
            {t('plans.subtitle')}
          </p>
        </div>

        <PlanListWithActions initialPlans={initialPlans} />
      </div>
    </div>
  );
}
