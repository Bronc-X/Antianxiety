import { requireAuth } from '@/lib/auth-utils';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import OnboardingForm from '@/components/OnboardingForm';

export const runtime = 'edge';
// 标记为动态路由，因为使用了 cookies
export const dynamic = 'force-dynamic';

/**
 * Onboarding 页面
 * 新用户注册后需要填写的信息
 */
export default async function OnboardingPage() {
  // 要求用户必须登录
  const { user } = await requireAuth();
  const supabase = await createServerSupabaseClient();

  // 获取用户资料
  let profile = null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('获取用户资料时出错:', error);
    } else {
      profile = data;
    }
  } catch (error) {
    console.error('获取用户资料时出错:', error);
  }

  // 如果用户已经完成了 onboarding（primary_concern 不为空），重定向到 dashboard
  if (profile?.primary_concern) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-[#E7E1D6] bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold text-[#0B3D2E]">欢迎加入 No More anxious™</h1>
            <p className="mt-2 text-sm text-[#0B3D2E]/80">
              请填写以下信息，帮助我们为您提供个性化的健康习惯建议
            </p>
          </div>

          <OnboardingForm initialData={profile} />
        </div>
      </div>
    </div>
  );
}

