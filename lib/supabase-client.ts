'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * 创建客户端 Supabase 客户端
 * 用于在客户端组件中使用
 * 使用 @supabase/auth-helpers-nextjs 确保 session 同步到 cookies
 * 
 * @returns Supabase 客户端实例
 */
export function createClientSupabaseClient() {
  // createClientComponentClient 会自动处理 cookies 同步
  // 在客户端组件中，它会自动将 session 写入 cookies，服务器端可以读取
  return createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  });
}

