import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * 创建服务器端 Supabase 客户端
 * 用于在服务器组件中使用
 * 
 * @returns {ReturnType<typeof createServerComponentClient>} 服务器端 Supabase 客户端实例
 */
export async function createServerSupabaseClient() {
  // 在 Next.js 16 中，cookies() 返回 Promise，需要先 await
  const cookieStore = await cookies();
  
  return createServerComponentClient(
    {
      // 传递一个返回已解析的 cookieStore 的函数
      // 使用类型断言以兼容 Next.js 16 的异步 cookies
      cookies: () => cookieStore as any,
    } as any,
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    }
  );
}

