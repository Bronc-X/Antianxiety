import { requireAuth } from '@/lib/auth-utils';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import PersonalizedFeed from '@/components/PersonalizedFeed';
import Link from 'next/link';
import UserProfileMenu from '@/components/UserProfileMenu';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * 个性化内容推荐页面
 * 基于用户健康画像的智能内容推荐
 */
export default async function FeedPage() {
  const { user } = await requireAuth();
  const supabase = await createServerSupabaseClient();

  // 获取用户资料
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

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
                  AntiAnxiety™
                </span>
              </Link>
            </div>
            <nav className="hidden md:flex items-center gap-4 text-sm">
              <Link
                href="/landing#how"
                className="text-[#0B3D2E]/80 hover:text-[#0B3D2E] transition-colors"
              >
                核心洞察
              </Link>
              <Link
                href="/landing#model"
                className="text-[#0B3D2E]/80 hover:text-[#0B3D2E] transition-colors"
              >
                模型方法
              </Link>
              <Link
                href="/landing#authority"
                className="text-[#0B3D2E]/80 hover:text-[#0B3D2E] transition-colors"
              >
                权威来源
              </Link>
              <Link
                href="/assistant"
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
              <UserProfileMenu
                user={user}
                profile={profile ? {
                  full_name: profile.full_name || null,
                  avatar_url: profile.avatar_url || null,
                } : null}
              />
            </nav>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0B3D2E] mb-2">
            个性化内容推荐
          </h1>
          <p className="text-[#0B3D2E]/70">
            基于您的健康画像，为您精选最相关的健康资讯
          </p>
        </div>

        {/* 个性化内容推荐 */}
        <PersonalizedFeed limit={20} />
      </main>
    </div>
  );
}
