import { getServerSession } from '@/lib/auth-utils';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import LandingContent from '@/components/LandingContent';
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

  // 简化数据获取 - 需要 profile、最新 dailyLog 和 active plans
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

  // ========================================
  // CRITICAL: 强制性问卷检查
  // 如果用户已登录但未完成问卷，立即重定向
  // ========================================
  if (session?.user && profile) {
    const metabolicProfile = (profile as any).metabolic_profile;
    
    // 检查是否完成问卷：metabolic_profile必须存在且非空
    if (!metabolicProfile || typeof metabolicProfile !== 'object' || Object.keys(metabolicProfile).length === 0) {
      console.log('用户未完成问卷，重定向到 /onboarding');
      redirect('/onboarding');
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
