import { getServerSession } from '@/lib/auth-utils';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import MarketingNav from '@/components/MarketingNav';
import LandingContent from '@/components/LandingContent';
import Link from 'next/link';
import UserProfileMenu from '@/components/UserProfileMenu';
import { determineUserMode, getRecommendedTask, getLatestDailyLog } from '@/lib/health-logic';
import { EnrichedDailyLog } from '@/types/logic';

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

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  // 初始化默认值
  let session: LandingSession = null;
  let profile: ProfileRecord | null = null;
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

  // 简化数据获取 - 新布局只需要 profile 和最新 1 条 dailyLog
  if (session?.user) {
    try {
      const supabase = await createServerSupabaseClient();

      // 并行获取 profile 和最新 dailyLog（1秒超时）
      const [profileResult, dailyLogsResult] = await Promise.allSettled([
        Promise.race<ProfileRecord | null>([
          supabase
            .from('profiles')
            .select('full_name, primary_concern, metabolic_profile, ai_persona_context')
            .eq('id', session.user.id)
            .single<ProfileRecord>()
            .then(({ data, error }) => (!error && data ? data : null)),
          new Promise<ProfileRecord | null>((resolve) => setTimeout(() => resolve(null), 1000)),
        ]),
        Promise.race<DailyWellnessLog[]>([
          supabase
            .from('daily_wellness_logs')
            .select('log_date, sleep_hours, sleep_duration_minutes, stress_level, hrv, exercise_duration_minutes')
            .eq('user_id', session.user.id)
            .order('log_date', { ascending: false })
            .limit(1)
            .then(({ data, error }) => (!error && data ? data : [])),
          new Promise<DailyWellnessLog[]>((resolve) => setTimeout(() => resolve([]), 1000)),
        ]),
      ]);

      if (profileResult.status === 'fulfilled') {
        profile = profileResult.value;
      }
      if (dailyLogsResult.status === 'fulfilled') {
        dailyLogs = Array.isArray(dailyLogsResult.value) ? dailyLogsResult.value : [];
      }
    } catch (error) {
      console.error('数据获取失败:', error);
    }
  }

  // 确保返回页面，即使数据获取失败
  // 转换profile类型以匹配LandingContent期望的类型
  const landingProfile = profile ? {
    full_name: typeof (profile as ProfileRecord).full_name === 'string' 
      ? (profile as ProfileRecord).full_name as string 
      : null,
  } : null;

  // 计算用户状态和推荐任务
  const latestLog = getLatestDailyLog(dailyLogs as EnrichedDailyLog[]);
  const userState = determineUserMode(latestLog);
  
  // 获取 primary_concern 和 metabolic_profile，处理 profile 可能为 null 的情况
  const primaryConcern = profile ? (profile as any).primary_concern : null;
  const metabolicProfile = profile ? (profile as any).metabolic_profile : null;
  const recommendedTask = getRecommendedTask(userState.mode, primaryConcern, metabolicProfile);

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
              <Link 
                href="/insights" 
                className="text-[#0B3D2E]/80 hover:text-[#0B3D2E] transition-colors"
              >
                核心洞察
              </Link>
              <Link 
                href="/methodology" 
                className="text-[#0B3D2E]/80 hover:text-[#0B3D2E] transition-colors"
              >
                模型方法
              </Link>
              <Link 
                href="/sources" 
                className="text-[#0B3D2E]/80 hover:text-[#0B3D2E] transition-colors"
              >
                权威来源
              </Link>
              <Link
                href="/assistant"
                className="text-[#0B3D2E]/80 hover:text-[#0B3D2E] transition-colors"
              >
                AI 助理
              </Link>
              <Link
                href="/plans"
                className="text-[#0B3D2E]/80 hover:text-[#0B3D2E] transition-colors"
              >
                计划表
              </Link>
              <Link
                href="/pricing"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] text-white rounded-lg hover:shadow-lg transition-all"
              >
                <span>升级 Pro</span>
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
        habitLogs={[]} 
        dailyLogs={[]} 
        userState={userState}
        recommendedTask={recommendedTask}
      />
    </div>
  );
}
