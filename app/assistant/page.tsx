import { requireAuth } from '@/lib/auth-utils';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getServerLanguage } from '@/lib/i18n-server';
import { tr } from '@/lib/i18n-core';
import { redirect } from 'next/navigation';
import UnifiedDailyCalibration from '@/components/UnifiedDailyCalibration';
import Link from 'next/link';
import AssistantPageClient from './AssistantPageClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ProfileRecord {
  id: string;
  ai_profile_completed?: boolean;
  ai_analysis_result?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export default async function AssistantPage({
  searchParams
}: {
  searchParams?: Promise<{ edit?: string, panel?: string }>
}) {
  const params = await searchParams;
  const language = await getServerLanguage();
  const { user } = await requireAuth();
  const supabase = await createServerSupabaseClient();

  // 如果是 panel=daily，显示每日状态记录面板
  if (params?.panel === 'daily') {
    // 获取用户资料
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    return (
      <div className="min-h-screen bg-[#FAF6EF]">
        <nav className="border-b border-[#E7E1D6] bg-[#FAF6EF]/90 backdrop-blur sticky top-0 z-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="h-14 flex items-center justify-between">
              <Link href="/unlearn/app" className="text-sm text-[#0B3D2E] hover:text-[#0B3D2E]/80">{tr(language, { zh: '返回主页', en: 'Back to Home' })}</Link>
              <h1 className="text-lg font-semibold text-[#0B3D2E]">{tr(language, { zh: '记录今日状态', en: "Log Today's State" })}</h1>
              <div className="w-16"></div>
            </div>
          </div>
        </nav>
        <UnifiedDailyCalibration
          userId={user.id}
          userName={profileData?.full_name}
        />
      </div>
    );
  }

  // 获取用户资料
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<ProfileRecord>();

  // 如果profile不存在，重定向到问卷
  if (profileError || !profile) {
    console.error('Profile不存在，重定向到问卷:', profileError);
    redirect('/onboarding');
  }

  // 如果用户未完成资料收集，显示表单
  if (!profile || !profile.ai_profile_completed) {
    return (
      <AssistantPageClient
        userId={user.id}
        profile={profile}
        showForm={true}
        showAnalysis={false}
      />
    );
  }

  // 如果已完成资料收集但还没有 AI 分析结果，触发分析（在服务端执行）
  if (!profile.ai_analysis_result) {
    // 异步触发分析：不要 await 动态 import，避免阻塞页面渲染（首屏会非常慢）
    void import('@/lib/aiAnalysis')
      .then(({ analyzeUserProfileAndSave }) => analyzeUserProfileAndSave(profile))
      .catch((error) => {
        console.error('AI 分析失败:', error);
      });
  }

  return (
    <AssistantPageClient
      userId={user.id}
      profile={profile}
      showForm={false}
      showAnalysis={true}
      isEdit={!!params?.edit}
    />
  );
}
