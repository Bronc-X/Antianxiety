import { getServerSession } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';

// 标记为动态路由，因为使用了 cookies
export const dynamic = 'force-dynamic';

/**
 * 主页面
 * 根据用户登录状态重定向到相应页面
 */
export default async function Home() {
  const session = await getServerSession();

  // 如果用户已登录，重定向到 landing 页面
  if (session) {
    redirect('/landing');
  }

  // 如果用户未登录，重定向到登录页面
  redirect('/login');
}
