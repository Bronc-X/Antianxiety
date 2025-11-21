'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Session } from '@supabase/supabase-js';

/**
 * 创建客户端 Supabase 客户端
 * 用于在客户端组件中使用
 * 使用 @supabase/auth-helpers-nextjs 确保 session 同步到 cookies
 * 
 * @returns Supabase 客户端实例
 */
export function createClientSupabaseClient() {
  const supabase = createClientComponentClient();

  if (typeof window !== 'undefined') {
    supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        await syncSessionWithServer(event, session);
      } catch (error) {
        console.error('同步 session 失败:', error);
      }
    });
  }

  return supabase;
}

async function syncSessionWithServer(event: string, session: Session | null) {
  await fetch('/auth/callback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ event, session }),
  });
}

