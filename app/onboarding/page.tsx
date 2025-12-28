import { requireAuth } from '@/lib/auth-utils';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import OnboardingFlowClient from './OnboardingFlowClient';

// 使用 Node.js runtime 避免 Edge Function 大小限制
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Onboarding 页面 - 沉浸式代谢焦虑问卷
 * 新用户注册后需要完成的诊断流程
 */
export default async function OnboardingPage() {
  // 要求用户必须登录
  const { user } = await requireAuth();
  const supabase = await createServerSupabaseClient();

  // 获取用户资料（如果不存在也没关系，问卷会创建）
  const { data: profile } = await supabase
    .from('profiles')
    .select('metabolic_profile')
    .eq('id', user.id)
    .maybeSingle(); // 使用maybeSingle()，不存在时返回null而不报错

  // 如果用户已经完成了 onboarding（metabolic_profile 不为空），重定向到主页
  if (profile?.metabolic_profile && Object.keys(profile.metabolic_profile).length > 0) {
    console.log('用户已完成问卷，重定向到 /unlearn/app');
    redirect('/unlearn/app');
  }

  console.log('用户进入问卷页面');
  return <OnboardingFlowClient userId={user.id} />;
}

