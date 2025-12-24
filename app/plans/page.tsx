import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import Link from 'next/link';
import UserProfileMenu from '@/components/UserProfileMenu';
import PlanListWithActions from '@/components/PlanListWithActions';
import PlansPageClient from './PlansPageClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 计划表页面 - 显示用户的所有健康方案
 */
export default async function PlansPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 获取用户的计划列表
  const { data: plansData } = await supabase
    .from('user_plans')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  const plans = plansData || [];

  // 获取用户资料
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return <PlansPageClient initialPlans={plans} />;
}
