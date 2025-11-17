import { getServerSession } from '@/lib/auth-utils';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import MarketingNav from '@/components/MarketingNav';
import LandingContent from '@/components/LandingContent';

interface SessionUser {
  id: string;
  [key: string]: unknown;
}

type LandingSession = {
  user: SessionUser;
} | null;

interface ProfileRecord {
  id: string;
  [key: string]: unknown;
}

interface DailyWellnessLog {
  id: string;
  user_id: string;
  log_date: string;
  [key: string]: unknown;
}

interface HabitSummary {
  id: number;
}

interface HabitLog {
  habit_id: number;
  completed_at: string;
  [key: string]: unknown;
}

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  // 初始化默认值
  let session: LandingSession = null;
  let profile: ProfileRecord | null = null;
  let habitLogs: HabitLog[] = [];
  let dailyLogs: DailyWellnessLog[] = [];

  // 获取 session，失败也不阻塞
  try {
    session = await getServerSession();
  } catch (error) {
    console.error('获取 session 失败:', error);
  }

  // 如果有 session，尝试获取数据，但设置严格的超时
  if (session?.user) {
    try {
      const supabase = await createServerSupabaseClient();

      // 使用 Promise.allSettled 确保即使一个失败也不阻塞
      const profilePromise = Promise.race<ProfileRecord | null>([
        supabase
          .from<ProfileRecord>('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => (!error && data ? data : null)),
        new Promise<ProfileRecord | null>((resolve) => setTimeout(() => resolve(null), 3000)),
      ]);

      const dailyLogsPromise = Promise.race<DailyWellnessLog[]>([
        supabase
          .from<DailyWellnessLog>('daily_wellness_logs')
          .select('*')
          .eq('user_id', session.user.id)
          .order('log_date', { ascending: false })
          .limit(14)
          .then(({ data, error }) => (!error && data ? data : [])),
        new Promise<DailyWellnessLog[]>((resolve) => setTimeout(() => resolve([]), 3000)),
      ]);

      const [profileResult, dailyLogsResult] = await Promise.allSettled([
        profilePromise,
        dailyLogsPromise,
      ]);

      if (profileResult.status === 'fulfilled') {
        profile = profileResult.value;
      }
      if (dailyLogsResult.status === 'fulfilled') {
        dailyLogs = Array.isArray(dailyLogsResult.value) ? dailyLogsResult.value : [];
      }

      // 如果获取到 profile，再尝试获取习惯数据（非阻塞）
      if (profile) {
        try {
          const habitsResult = await Promise.race<HabitSummary[]>([
            supabase
              .from<HabitSummary>('user_habits')
              .select('id')
              .eq('user_id', session.user.id)
              .then(({ data }) => data || []),
            new Promise<HabitSummary[]>((resolve) => setTimeout(() => resolve([]), 2000)),
          ]);

          if (habitsResult.length > 0) {
            const habitIds = habitsResult.map((habit) => habit.id);
            const habitLogsResult = await Promise.race<HabitLog[]>([
              supabase
                .from<HabitLog>('habit_log')
                .select('*')
                .in('habit_id', habitIds)
                .order('completed_at', { ascending: true })
                .then(({ data }) => data || []),
              new Promise<HabitLog[]>((resolve) => setTimeout(() => resolve([]), 2000)),
            ]);
            habitLogs = habitLogsResult;
          }
        } catch (error) {
          console.error('获取习惯数据失败:', error);
        }
      }
    } catch (error) {
      console.error('数据获取失败:', error);
      // 即使失败也继续渲染页面
    }
  }

  // 确保返回页面，即使数据获取失败
  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <MarketingNav user={session?.user || null} profile={profile} />
      <LandingContent 
        user={session?.user || null} 
        profile={profile} 
        habitLogs={habitLogs} 
        dailyLogs={dailyLogs} 
      />
    </div>
  );
}
