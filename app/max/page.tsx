import { requireAuth } from '@/lib/auth-utils';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import MaxPageClient from './MaxPageClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Max AI 助理页面
 * 
 * 这是移动端底部导航 "Max" 入口的目标页面
 * 提供全屏 AI 对话体验
 */
export default async function MaxPage() {
  const { user } = await requireAuth();
  const supabase = await createServerSupabaseClient();

  // 获取用户资料
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // 获取最近的日志数据
  const { data: dailyLogs } = await supabase
    .from('daily_wellness_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('log_date', { ascending: false })
    .limit(7);

  return (
    <MaxPageClient 
      initialProfile={profile}
      dailyLogs={dailyLogs || []}
    />
  );
}
