import { getServerSession } from '@/lib/auth-utils';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import MarketingNav from '@/components/MarketingNav';
import LandingContent from '@/components/LandingContent';

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const session = await getServerSession();
  let profile: any = null;
  let habitLogs: any[] = [];
  let dailyLogs: any[] = [];
  const withTimeout = async <T,>(p: PromiseLike<T>, ms = 2000, fallback: T): Promise<T> => {
    return await Promise.race<T>([
      Promise.resolve(p),
      new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
    ]);
  };

  if (session?.user) {
    const supabase = await createServerSupabaseClient();

    // 并行获取数据，并添加超时兜底，防止阻塞渲染
    try {
      const profilePromise = withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => (!error && data ? data : null)),
        2000,
        null
      );

      const dailyLogsPromise = withTimeout(
        supabase
          .from('daily_wellness_logs')
          .select('*')
          .eq('user_id', session.user.id)
          .order('log_date', { ascending: false })
          .limit(14)
          .then(({ data, error }) => (!error && data ? data : [])),
        2000,
        []
      );

      // 先并行拿到 profile 和 dailyLogs
      const [profileResult, dailyLogsResult] = await Promise.all([profilePromise, dailyLogsPromise]);
      profile = profileResult;
      dailyLogs = dailyLogsResult;

      // 如果拿到了 profile，再尝试拉取习惯及记录（加超时）
      if (profile) {
        const habits = await withTimeout(
          supabase
            .from('user_habits')
            .select('id')
            .eq('user_id', session.user.id)
            .then(({ data }) => data || []),
          1500,
          []
        );

        if (habits && habits.length > 0) {
          const habitIds = habits.map((h: any) => h.id);
          habitLogs = await withTimeout(
            supabase
              .from('habit_log')
              .select('*')
              .in('habit_id', habitIds)
              .order('completed_at', { ascending: true })
              .then(({ data }) => data || []),
            1500,
            []
          );
        }
      }
    } catch (error) {
      console.error('Landing 数据加载并行流程出错:', error);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <MarketingNav user={session?.user || null} profile={profile} />
      <LandingContent user={session?.user || null} profile={profile} habitLogs={habitLogs} dailyLogs={dailyLogs} />
    </div>
  );
}
