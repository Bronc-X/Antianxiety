import { requireAuth } from '@/lib/auth-utils';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import AIAssistantProfileForm from '@/components/AIAssistantProfileForm';
import AIAssistantChat from '@/components/AIAssistantChat';
import DailyCheckInPanel from '@/components/DailyCheckInPanel';
import ProfileSettingsPanel from '@/components/ProfileSettingsPanel';
import ReminderPreferencesPanel from '@/components/ReminderPreferencesPanel';
import { analyzeUserProfile } from '@/lib/aiAnalysis';
import Link from 'next/link';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * AI 助理页面
 * 如果用户未完成资料收集，显示资料收集表单
 * 如果已完成，显示 AI 助理聊天界面
 */
type AssistantPageSearchParams = {
  [key: string]: string | string[] | undefined;
};

type AssistantPageProps = {
  searchParams?: Promise<AssistantPageSearchParams>;
};

export default async function AssistantPage({ searchParams }: AssistantPageProps) {
  const resolvedSearchParams = (await searchParams) ?? undefined;
  const { user } = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const isAnalyzing = ((resolvedSearchParams?.analyzing as string | undefined) ?? undefined) === 'true';

  // 获取用户资料
  let profile = null;
  let dailyLogs: any[] = [];

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('获取用户资料时出错:', error);
      // 如果查询出错，可能是表不存在或用户资料不存在，创建默认资料
      profile = {
        id: user.id,
        ai_profile_completed: false,
      };
    } else {
      profile = data;
    }
  } catch (error) {
    console.error('获取用户资料时出错:', error);
    // 出错时创建默认资料
    profile = {
      id: user.id,
      ai_profile_completed: false,
    };
  }

  // 获取近期每日记录
  try {
    const { data: wellnessLogs, error: wellnessError } = await supabase
      .from('daily_wellness_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('log_date', { ascending: false })
      .limit(14);

    if (!wellnessError && wellnessLogs) {
      dailyLogs = wellnessLogs;
    }
  } catch (error) {
    console.error('获取每日记录时出错:', error);
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
            <AIAssistantProfileForm />
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

  // 根据panel参数显示不同内容
  // 处理 searchParams 可能是数组的情况
  const panelParam = resolvedSearchParams?.panel;
  const panel = Array.isArray(panelParam) ? panelParam[0] : (panelParam as string | undefined);

  // 显示 AI 助理聊天界面
  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <nav className="border-b border-[#E7E1D6] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-14 flex items-center justify-between">
            <Link href="/landing" className="text-sm text-[#0B3D2E] hover:text-[#0B3D2E]/80">返回主页</Link>
          </div>
        </div>
      </nav>
      {isAnalyzing && (
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="rounded-md border border-[#0B3D2E]/20 bg-[#0B3D2E]/5 px-3 py-2 text-sm text-[#0B3D2E]">
            正在分析你的资料，请稍候… 你可以点击"返回主页"。
          </div>
        </div>
      )}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {panel === 'daily' ? (
          <DailyCheckInPanel initialProfile={profile || { id: user.id }} initialLogs={dailyLogs} />
        ) : panel === 'profile' ? (
          <ProfileSettingsPanel initialProfile={profile || { id: user.id }} />
        ) : panel === 'reminders' ? (
          <ReminderPreferencesPanel initialProfile={profile || { id: user.id }} />
        ) : (
          <>
            <DailyCheckInPanel initialProfile={profile || { id: user.id }} initialLogs={dailyLogs} />
            <AIAssistantChat initialProfile={profile || { id: user.id }} />
          </>
        )}
      </div>
    </div>
  );
}

