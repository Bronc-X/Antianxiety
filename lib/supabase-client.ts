'use client';

import { createClient } from '@supabase/supabase-js';

/**
 * 创建客户端 Supabase 客户端
 * 用于在客户端组件中使用
 * 
 * 注意：如果环境变量未设置，会使用有效的占位符值，允许构建过程继续
 * 运行时环境变量会从 process.env 中获取（Next.js 会自动注入）
 * 
 * @returns Supabase 客户端实例
 */
export function createClientSupabaseClient() {
  // 获取环境变量，如果未设置则使用有效的占位符值
  // 使用有效的 JWT token 格式作为占位符，避免 Supabase 验证错误
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

