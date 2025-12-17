import { Tweet } from 'react-tweet';
import 'react-tweet/theme.css';
import { requireAuth } from '@/lib/auth-utils';
import LogoutButton from '@/components/LogoutButton';
import { getServerLanguage } from '@/lib/i18n-server';
import { tr } from '@/lib/i18n-core';

// 硬编码的推文 ID 列表
const TWEET_IDS = [
  '1986977228165689658', // Svwang1
  '1979696074978983954', // Svwang1
  '1987810985558913191', // xYsfknBXPT6M0jo
  '1987741929027813696', // xYsfknBXPT6M0jo
];

export const runtime = 'edge';
// 标记为动态路由，因为使用了 cookies
export const dynamic = 'force-dynamic';

/**
 * 灵感页面
 * 显示来自健康与习惯养成领域的专业见解
 */
export default async function InspirationPage() {
  // 要求用户必须登录
  const { user } = await requireAuth();
  const language = await getServerLanguage();

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* 导航栏 */}
      <nav className="sticky top-0 z-30 border-b border-[#E7E1D6] bg-[#FAF6EF]/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/landing" className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#0B3D2E]" />
                <span className="text-sm font-semibold tracking-wide text-[#0B3D2E]">
                  AntiAnxiety™
                </span>
              </a>
              <span className="text-sm text-gray-500">/</span>
              <span className="text-sm text-gray-600">{tr(language, { zh: '灵感', en: 'Inspiration' })}</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/landing"
                className="text-sm text-[#0B3D2E]/80 hover:text-[#0B3D2E] transition-colors"
              >
                {tr(language, { zh: '返回主页', en: 'Back to Home' })}
              </a>
              <span className="text-sm text-gray-600">{user.email}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">
            {tr(language, { zh: '灵感板块', en: 'Inspiration' })}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {tr(language, { zh: '来自健康与习惯养成领域的专业见解', en: 'Professional insights on health and habit formation.' })}
          </p>
        </div>

        {/* 推文列表 */}
        <div className="space-y-6">
          {TWEET_IDS.map((tweetId) => (
            <div
              key={tweetId}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <Tweet id={tweetId} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
