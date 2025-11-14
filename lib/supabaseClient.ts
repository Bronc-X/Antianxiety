import { createClient } from '@supabase/supabase-js';

// 从环境变量中获取 Supabase 配置
// 在构建时，如果环境变量未设置，使用有效的占位符值
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder';

/**
 * 创建并导出 Supabase 客户端实例
 * 此客户端配置为在 Next.js App Router 环境中工作
 * 
 * 注意：如果环境变量未设置，将使用占位符值创建客户端
 * 这允许构建过程继续，运行时环境变量会覆盖占位符值
 * 
 * @returns {ReturnType<typeof createClient>} Supabase 客户端实例
 */
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 在 Next.js App Router 中，使用持久化存储来保持会话
    persistSession: true,
    // 自动刷新 token
    autoRefreshToken: true,
    // 检测会话变化
    detectSessionInUrl: true,
  },
});

