'use client';

import { useI18n } from '@/lib/i18n';
import PlanListWithActions from '@/components/PlanListWithActions';

interface PlansPageClientProps {
  initialPlans: any[];
}

export default function PlansPageClient({ initialPlans }: PlansPageClientProps) {
  const { t, language } = useI18n();

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0B3D2E]">
      {/* Navigation */}
      <nav className="sticky top-0 z-30 bg-[#FDFBF7]/90 backdrop-blur border-b border-[#E7E1D6]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/landing" className="flex items-center gap-3 group">
              <div className="w-8 h-8 bg-[#0B3D2E] rounded-lg flex items-center justify-center text-white group-hover:bg-[#0a3629] transition-colors">
                <span className="font-serif italic font-bold">P</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-wide leading-none">PLANS & PROTOCOLS</span>
                <span className="text-[10px] text-[#0B3D2E]/50 font-mono uppercase mt-0.5">ACTIVE REGIMEN</span>
              </div>
            </Link>

            <Link href="/assistant" className="text-sm font-medium text-[#0B3D2E]/60 hover:text-[#0B3D2E] transition-colors">
              Base Command
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-12 max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-serif font-medium text-[#0B3D2E] mb-4 tracking-tight">
            {t('plans.myHealthPlans')}
          </h1>
          <p className="text-lg text-[#0B3D2E]/70 leading-relaxed font-light">
            {t('plans.subtitle')}
          </p>
        </header>

        <PlanListWithActions initialPlans={initialPlans} />
      </main>
    </div>
  );
}
