import { createServerSupabaseClient } from './supabase-server';
import { redirect } from 'next/navigation';

/**
 * 获取当前用户会话
 * 如果用户未登录，返回 null
 * 
 * @returns {Promise<{ user: any; session: any } | null>} 用户会话信息或 null
 */
export async function getServerSession() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return user && session ? { user, session } : null;
  } catch (error) {
    console.error('获取会话时出错:', error);
    return null;
  }
}

/**
 * 要求用户必须登录
 * 如果用户未登录，重定向到登录页面
 * 
 * @returns {Promise<{ user: any; session: any }>} 用户会话信息
 */
export async function requireAuth() {
  const session = await getServerSession();

  if (!session) {
    redirect('/unlearn/login');
  }

  return session;
}

