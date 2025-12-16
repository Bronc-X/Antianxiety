'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * 创建客户端 Supabase 客户端
 * 用于在客户端组件中使用
 * 使用 @supabase/ssr 确保正确的 cookie 处理
 * 
 * @returns Supabase 客户端实例
 */
export function createClientSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}


// Alias for backward compatibility
export const createClient = createClientSupabaseClient;
