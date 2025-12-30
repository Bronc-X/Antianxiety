import { requireAuth } from '@/lib/auth-utils';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import Link from 'next/link';
import EnergyBreakdownClient from './EnergyBreakdownClient';
import { getServerLanguage } from '@/lib/i18n-server';
import { tr } from '@/lib/i18n-core';

export const dynamic = 'force-dynamic';

export default async function EnergyBreakdownPage() {
  const { user } = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const language = await getServerLanguage();

  // 获取最新的每日日志
  const { data: latestLog } = await supabase
    .from('daily_wellness_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('log_date', { ascending: false })
    .limit(1)
    .single();

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <nav className="border-b border-[#E7E1D6] bg-[#FAF6EF]/90 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-4">
          <div className="h-14 flex items-center justify-between">
            <Link
              href="/unlearn/app"
              className="text-sm text-[#0B3D2E] hover:text-[#0B3D2E]/80 flex items-center gap-1"
            >
              {tr(language, { zh: '← 返回主页', en: '← Back to Home' })}
            </Link>
            <h1 className="text-lg font-semibold text-[#0B3D2E]">
              {tr(language, { zh: '能量值详情', en: 'Energy Breakdown' })}
            </h1>
            <div className="w-16"></div>
          </div>
        </div>
      </nav>

      <EnergyBreakdownClient latestLog={latestLog} />
    </div>
  );
}
