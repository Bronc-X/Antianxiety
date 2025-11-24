import { requireAuth } from '@/lib/auth-utils';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import OnboardingFlowClient from './OnboardingFlowClient';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * Onboarding 页面 - 沉浸式代谢焦虑问卷
 * 新用户注册后需要完成的诊断流程
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

  // 如果用户已经完成了 onboarding（metabolic_profile 不为空），重定向到主页
  if (profile?.metabolic_profile) {
    redirect('/landing');
  }

  return <OnboardingFlowClient userId={user.id} />;
}

