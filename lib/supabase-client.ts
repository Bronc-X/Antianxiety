'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * 创建客户端 Supabase 客户端
 * 用于在客户端组件中使用
 * 
 * 注意：如果环境变量未设置，会使用占位符值，允许构建过程继续
 * 
 * @returns {ReturnType<typeof createClientComponentClient>} 客户端 Supabase 客户端实例
 */
export function createClientSupabaseClient() {
  // 在构建时，如果环境变量未设置，使用占位符值
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
  
  return createClientComponentClient({
    supabaseUrl,
    supabaseKey,
  } as any);
}

