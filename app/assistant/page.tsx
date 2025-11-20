import { requireAuth } from '@/lib/auth-utils';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import AIAssistantProfileForm from '@/components/AIAssistantProfileForm';
import SettingsPanel from '@/components/SettingsPanel';
import Link from 'next/link';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface ProfileRecord {
  id: string;
  ai_profile_completed?: boolean;
  ai_analysis_result?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export default async function AssistantPage() {
  const { user } = await requireAuth();
  const supabase = await createServerSupabaseClient();

  // 获取用户资料
  let profile: ProfileRecord | null = null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single<ProfileRecord>();

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

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <nav className="border-b border-[#E7E1D6] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-14 flex items-center justify-between">
            <Link href="/landing" className="text-sm text-[#0B3D2E] hover:text-[#0B3D2E]/80">返回主页</Link>
          </div>
        </div>
      </nav>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <SettingsPanel initialProfile={profile} />
      </div>
    </div>
  );
}

