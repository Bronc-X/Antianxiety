import { getServerSession } from '@/lib/auth-utils';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import MarketingNav from '@/components/MarketingNav';
import LandingContent from '@/components/LandingContent';
import Link from 'next/link';
import UserProfileMenu from '@/components/UserProfileMenu';

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
    const serverSession = await getServerSession();
    if (serverSession) {
      session = {
        user: {
          ...serverSession.user,
          id: serverSession.user.id,
        } as SessionUser,
      };
    }
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
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single<ProfileRecord>()
          .then(({ data, error }) => (!error && data ? data : null)),
        new Promise<ProfileRecord | null>((resolve) => setTimeout(() => resolve(null), 3000)),
      ]);

      const dailyLogsPromise = Promise.race<DailyWellnessLog[]>([
        supabase
          .from('daily_wellness_logs')
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
              .from('habits')
              .select('id')
              .eq('user_id', session.user.id)
              .then(({ data }) => (data || []) as HabitSummary[]),
            new Promise<HabitSummary[]>((resolve) => setTimeout(() => resolve([]), 2000)),
          ]);

          if (habitsResult.length > 0) {
            const habitIds = habitsResult.map((habit) => habit.id);
            const habitLogsResult = await Promise.race<HabitLog[]>([
              supabase
                .from('habit_completions')
                .select('*')
                .in('habit_id', habitIds)
                .order('completed_at', { ascending: true })
                .then(({ data }) => (data || []) as HabitLog[]),
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
  // 转换profile类型以匹配LandingContent期望的类型
  const landingProfile = profile ? {
    daily_checkin_time: typeof (profile as ProfileRecord).daily_checkin_time === 'string' 
      ? (profile as ProfileRecord).daily_checkin_time as string 
      : null,
    full_name: typeof (profile as ProfileRecord).full_name === 'string' 
      ? (profile as ProfileRecord).full_name as string 
      : null,
  } : null;

  // 转换habitLogs类型以匹配LandingContent期望的类型
  const landingHabitLogs = habitLogs.map((log) => ({
    id: log.habit_id,
    habit_id: log.habit_id,
    completed_at: log.completed_at,
    belief_score_snapshot: 0, // 默认值，如果需要可以从数据库获取
  }));

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* 导航栏 */}
      <nav className="sticky top-0 z-30 bg-[#FAF6EF]/90 backdrop-blur border-b border-[#E7E1D6]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/landing" className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#0B3D2E]" />
                <span className="text-sm font-semibold tracking-wide text-[#0B3D2E]">
                  No More anxious™
                </span>
              </Link>
            </div>
            <nav className="hidden md:flex items-center gap-4 text-sm">
              <a 
                href="#how" 
                className="text-[#0B3D2E]/80 hover:text-[#0B3D2E] transition-colors cursor-pointer"
              >
                核心洞察
              </a>
              <a 
                href="#model" 
                className="text-[#0B3D2E]/80 hover:text-[#0B3D2E] transition-colors cursor-pointer"
              >
                模型方法
              </a>
              <a 
                href="#authority" 
                className="text-[#0B3D2E]/80 hover:text-[#0B3D2E] transition-colors cursor-pointer"
              >
                权威来源
              </a>
              <Link
                href="/inspiration"
                className="text-[#0B3D2E]/80 hover:text-[#0B3D2E] transition-colors"
              >
                分析报告
              </Link>
              <Link
                href="/plans"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] text-white rounded-lg hover:shadow-lg transition-all"
              >
                <span>📋</span>
                <span>AI计划表</span>
              </Link>
              {session?.user && (
                <UserProfileMenu 
                  user={session.user} 
                  profile={profile ? {
                    full_name: typeof (profile as ProfileRecord).full_name === 'string' 
                      ? (profile as ProfileRecord).full_name as string 
                      : null,
                    avatar_url: typeof (profile as ProfileRecord).avatar_url === 'string' 
                      ? (profile as ProfileRecord).avatar_url as string 
                      : null,
                  } : null}
                />
              )}
            </nav>
          </div>
        </div>
      </nav>

      <LandingContent 
        user={session?.user || null} 
        profile={landingProfile} 
        habitLogs={landingHabitLogs} 
        dailyLogs={dailyLogs} 
      />
    </div>
  );
}
