'use client';

import { useState } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';

/**
 * 登出按钮组件
 * 处理用户登出操作
 */
export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientSupabaseClient();

  // 处理登出
  const handleLogout = async () => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('登出时出错:', error);
        alert('登出失败，请稍后重试');
        setIsLoading(false);
        return;
      }

      // 登出成功，重定向到登录页面
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('登出时出错:', error);
      alert('登出时发生错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isLoading ? '登出中...' : '登出'}
    </button>
  );
}

