import { requireAuth } from '@/lib/auth-utils';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { findMatchingRule } from '@/lib/agentUtils';
import { autoGroupData } from '@/lib/chartUtils';
import LogoutButton from '@/components/LogoutButton';
import HabitForm from '@/components/HabitForm';
import HabitList from '@/components/HabitList';
// 使用动态导入减少 bundle 大小
import { HabitCompletionChart, BeliefScoreChart } from '@/components/LazyCharts';
import PersonalizedFeed from '@/components/PersonalizedFeed';
import AnimateOnView from '@/components/AnimateOnView';

export const runtime = 'edge';
// 标记为动态路由，因为使用了 cookies
export const dynamic = 'force-dynamic';

/**
 * 仪表板页面（受保护的路由）
 * 只有登录用户才能访问
 */
export default async function DashboardPage() {
  // 要求用户必须登录，未登录会自动重定向到 /login
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

  // 如果用户还没有完成 onboarding（primary_concern 为空），重定向到 onboarding 页面
  if (!profile?.primary_concern) {
    redirect('/onboarding');
  }

  // 查找匹配的推荐规则
  let matchedRule = null;
  try {
    matchedRule = await findMatchingRule({
      primary_concern: profile.primary_concern,
      activity_level: profile.activity_level,
      circadian_rhythm: profile.circadian_rhythm,
    });
  } catch (error) {
    console.error('查找推荐规则时出错:', error);
  }

  // 获取用户的习惯列表
  let habits = [];
  try {
    const { data, error } = await supabase
      .from('user_habits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取用户习惯时出错:', error);
    } else {
      habits = data || [];
    }
  } catch (error) {
    console.error('获取用户习惯时出错:', error);
  }

  // 获取用户的习惯完成记录（用于图表）
  let habitLogs = [];
  let chartData = {
    completionData: [] as { period: string; completions: number }[],
    beliefData: [] as { period: string; averageScore: number }[],
  };

  try {
    // 获取所有习惯的 ID
    const habitIds = habits.map((habit: { id: number }) => habit.id);

    if (habitIds.length > 0) {
      const { data, error } = await supabase
        .from('habit_log')
        .select('*')
        .in('habit_id', habitIds)
        .order('completed_at', { ascending: true });

      if (error) {
        // 检查是否有标准的错误信息字段
        const hasStandardErrorInfo =
          (error.code && typeof error.code === 'string' && error.code.trim() !== '') ||
          (error.message && typeof error.message === 'string' && error.message.trim() !== '');

        // 检查错误对象是否有任何有意义的属性值（使用类型安全的方式）
        const errorObj = error as unknown as Record<string, unknown>;
        const errorKeys = Object.keys(errorObj).filter(
          (key) => errorObj[key] !== undefined && errorObj[key] !== null && errorObj[key] !== ''
        );

        // 只有在有实际错误信息时才记录
        if (hasStandardErrorInfo || errorKeys.length > 0) {
          console.error('获取习惯完成记录时出错:', {
            code: error.code || 'N/A',
            message: error.message || 'N/A',
            details: error.details || 'N/A',
            hint: error.hint || 'N/A',
            errorKeys: errorKeys,
            fullError: JSON.stringify(error),
          });
        }
        // 如果错误对象是空的或没有有效信息，静默忽略
        // 这可能表示表不存在或没有权限，但不会影响页面正常显示
      }

      // 无论是否有错误，都尝试处理数据（如果有的话）
      if (data && Array.isArray(data)) {
        habitLogs = data;
        // 处理图表数据
        if (habitLogs.length > 0) {
          chartData = autoGroupData(habitLogs);
        }
      } else if (!error) {
        // 如果没有错误也没有数据，说明确实没有记录
        habitLogs = [];
      }
    }
  } catch (error) {
    // 捕获其他类型的错误（例如网络错误、解析错误等）
    console.error('获取习惯完成记录时发生异常:', error);
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* 导航栏 */}
      <nav className="border-b border-[#E7E1D6] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-[#0B3D2E]">No More anxious™</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#0B3D2E]/70">{user.email}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* 欢迎信息 */}
          <AnimateOnView>
            <div className="rounded-lg border border-[#E7E1D6] bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold text-[#0B3D2E]">欢迎回来</h2>
              <p className="mt-2 text-[#0B3D2E]/80">
              {profile?.username
                ? `你好，${profile.username}！`
                : '开始建立您的健康习惯之旅'}
            </p>
          </div>
          </AnimateOnView>

          {/* 专属代理建议 */}
          {matchedRule && (
            <AnimateOnView>
              <div className="rounded-lg border border-[#0B3D2E]/20 bg-[#0B3D2E]/5 p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-[#0B3D2E] mb-4">
                您的专属代理建议
              </h3>
                <p className="text-base leading-7 text-[#0B3D2E]/90 whitespace-pre-line">
                {matchedRule.recommendation_long}
              </p>
            </div>
            </AnimateOnView>
          )}

          {/* 用户资料信息 */}
          {profile && (
            <AnimateOnView>
              <div className="rounded-lg border border-[#E7E1D6] bg-white p-6 shadow-sm">
                <h3 className="text-lg font-medium text-[#0B3D2E]">您的资料</h3>
              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <dt className="text-sm font-medium text-[#0B3D2E]/70">用户名</dt>
                    <dd className="mt-1 text-sm text-[#0B3D2E]">{profile.username || '未设置'}</dd>
                </div>
                {profile.age && (
                  <div>
                      <dt className="text-sm font-medium text-[#0B3D2E]/70">年龄</dt>
                      <dd className="mt-1 text-sm text-[#0B3D2E]">{profile.age} 岁</dd>
                  </div>
                )}
                {profile.primary_concern && (
                  <div>
                      <dt className="text-sm font-medium text-[#0B3D2E]/70">主要关注</dt>
                      <dd className="mt-1 text-sm text-[#0B3D2E]">{profile.primary_concern}</dd>
                  </div>
                )}
                {profile.activity_level && (
                  <div>
                      <dt className="text-sm font-medium text-[#0B3D2E]/70">活动水平</dt>
                      <dd className="mt-1 text-sm text-[#0B3D2E]">{profile.activity_level}</dd>
                  </div>
                )}
                {profile.circadian_rhythm && (
                  <div>
                      <dt className="text-sm font-medium text-[#0B3D2E]/70">昼夜节律</dt>
                      <dd className="mt-1 text-sm text-[#0B3D2E]">{profile.circadian_rhythm}</dd>
                  </div>
                )}
              </dl>
            </div>
            </AnimateOnView>
          )}

          {/* 图表板块 */}
          {(chartData.completionData.length > 0 || chartData.beliefData.length > 0) && (
            <AnimateOnView>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {chartData.completionData.length > 0 && (
                <HabitCompletionChart data={chartData.completionData} />
              )}
              {chartData.beliefData.length > 0 && (
                <BeliefScoreChart data={chartData.beliefData} />
              )}
            </div>
            </AnimateOnView>
          )}

          {/* 习惯板块 */}
          <AnimateOnView>
          <div className="space-y-4">
            <HabitForm />
            <HabitList habits={habits} userId={user.id} />
          </div>
          </AnimateOnView>

          {/* 个性化信息流板块 */}
          <AnimateOnView>
          <PersonalizedFeed limit={10} />
          </AnimateOnView>
        </div>
      </main>
    </div>
  );
}

