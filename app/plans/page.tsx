import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import Link from 'next/link';
import UserProfileMenu from '@/components/UserProfileMenu';
import PlanListWithActions from '@/components/PlanListWithActions';

export const runtime = 'edge';
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

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* GlobalNav已在layout中渲染，移除重复导航栏 */}
      
      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0B3D2E] mb-2">
            我的健康方案
          </h1>
          <p className="text-[#0B3D2E]/60">
            查看和管理您的个性化健康计划，每日记录执行情况
          </p>
        </div>

        {/* 计划表组件 */}
        <PlanListWithActions initialPlans={plans} />
      </div>
    </div>
  );
}
