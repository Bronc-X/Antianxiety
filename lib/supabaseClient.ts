import { createClient } from '@supabase/supabase-js';

// 从环境变量中获取 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * 创建并导出 Supabase 客户端实例
 * 此客户端配置为在 Next.js App Router 环境中工作
 * 
 * 注意：如果环境变量未设置，将使用空字符串创建客户端
 * 这允许构建过程继续，但运行时功能将不可用
 * 
 * @returns {ReturnType<typeof createClient>} Supabase 客户端实例
 */
export const supabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      // 在 Next.js App Router 中，使用持久化存储来保持会话
      persistSession: true,
      // 自动刷新 token
      autoRefreshToken: true,
      // 检测会话变化
      detectSessionInUrl: true,
    },
  }
);

