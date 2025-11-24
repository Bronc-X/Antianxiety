import { requireAuth } from '@/lib/auth-utils';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import HealthProfileForm from '@/components/HealthProfileForm';
import AIAnalysisDisplay from '@/components/AIAnalysisDisplay';
import DailyCheckInPanel from '@/components/DailyCheckInPanel';
import Link from 'next/link';

export const runtime = 'edge';
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
  const { user } = await requireAuth();
  const supabase = await createServerSupabaseClient();

  // 如果是 panel=daily，显示每日状态记录面板
  if (params?.panel === 'daily') {
    // 获取用户资料和日志
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, daily_checkin_time, sleep_hours, stress_level')
      .eq('id', user.id)
      .single();

    const { data: logsData } = await supabase
      .from('daily_wellness_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('log_date', { ascending: false })
      .limit(30);

    return (
      <div className="min-h-screen bg-[#FAF6EF]">
        <nav className="border-b border-[#E7E1D6] bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="h-14 flex items-center justify-between">
              <Link href="/landing" className="text-sm text-[#0B3D2E] hover:text-[#0B3D2E]/80">返回主页</Link>
              <h1 className="text-lg font-semibold text-[#0B3D2E]">记录今日状态</h1>
              <div className="w-16"></div>
            </div>
          </div>
        </nav>
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <DailyCheckInPanel 
            initialProfile={profileData || { id: user.id }}
            initialLogs={logsData || []}
          />
        </div>
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
      <div className="min-h-screen bg-[#FAF6EF]">
        <nav className="border-b border-[#E7E1D6] bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="h-14 flex items-center justify-between">
              <Link href="/landing" className="text-sm text-[#0B3D2E] hover:text-[#0B3D2E]/80">返回主页</Link>
            </div>
          </div>
        </nav>
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-[#E7E1D6] bg-white p-8 shadow-sm">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-semibold text-[#0B3D2E]">欢迎使用 AI 助理</h1>
              <p className="mt-2 text-sm text-[#0B3D2E]/80">
                请先完成资料收集，以便我们为您提供个性化的健康建议
              </p>
            </div>
            <HealthProfileForm userId={user.id} />
          </div>
        </div>
      </div>
    );
  }

  // 如果已完成资料收集但还没有 AI 分析结果，触发分析（在服务端执行）
  if (!profile.ai_analysis_result) {
    const { analyzeUserProfileAndSave } = await import('@/lib/aiAnalysis');
    // 异步执行分析，不阻塞页面渲染
    analyzeUserProfileAndSave(profile).catch((error) => {
      console.error('AI 分析失败:', error);
    });
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <nav className="border-b border-[#E7E1D6] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-14 flex items-center justify-between">
            <Link href="/landing" className="text-sm text-[#0B3D2E] hover:text-[#0B3D2E]/80">返回主页</Link>
            <h1 className="text-lg font-semibold text-[#0B3D2E]">
              {profile.ai_analysis_result && !params?.edit ? 'AI 健康分析报告' : '健康参数设置'}
            </h1>
            <div className="w-16"></div>
          </div>
        </div>
      </nav>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {profile.ai_analysis_result && profile.ai_recommendation_plan && !params?.edit ? (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-semibold text-[#0B3D2E]">AI 健康分析报告</h1>
              <p className="mt-2 text-sm text-[#0B3D2E]/80">基于您的健康数据生成的个性化建议</p>
            </div>
            <AIAnalysisDisplay 
              analysis={profile.ai_analysis_result as never}
              plan={profile.ai_recommendation_plan as never}
            />
          </>
        ) : (
          <div className="rounded-lg border border-[#E7E1D6] bg-white p-8 shadow-sm">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-semibold text-[#0B3D2E]">个性化健康参数设置</h1>
              <p className="mt-2 text-sm text-[#0B3D2E]/80">
                您的数据将被严格保密，仅用于 AI 为您提供个性化健康建议
              </p>
            </div>
            <HealthProfileForm 
              userId={user.id} 
              initialData={profile as {
                gender?: string | null;
                birth_date?: string | null;
                height_cm?: number | null;
                weight_kg?: number | null;
                activity_level?: string | null;
                body_fat_percentage?: number | null;
                primary_goal?: string | null;
                target_weight_kg?: number | null;
                weekly_goal_rate?: string | null;
              }} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

