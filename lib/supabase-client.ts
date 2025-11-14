'use client';

import { createClient } from '@supabase/supabase-js';

/**
 * 创建客户端 Supabase 客户端
 * 用于在客户端组件中使用
 * 
 * 注意：如果环境变量未设置，会使用占位符值，允许构建过程继续
 * 运行时环境变量会从 window 或 process.env 中获取
 * 
 * @returns Supabase 客户端实例
 */
export function createClientSupabaseClient() {
  // 在构建时和运行时都安全地获取环境变量
  const supabaseUrl = 
    typeof window !== 'undefined' 
      ? (window as any).__NEXT_PUBLIC_SUPABASE_URL__ || process.env.NEXT_PUBLIC_SUPABASE_URL
      : process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  const supabaseKey = 
    typeof window !== 'undefined'
      ? (window as any).__NEXT_PUBLIC_SUPABASE_ANON_KEY__ || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 如果环境变量未设置，使用占位符值（允许构建继续）
  const url = supabaseUrl || 'https://placeholder.supabase.co';
  const key = supabaseKey || 'placeholder-key';
  
  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

