'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/domain/useAuth';

/**
 * 登出按钮组件
 * 处理用户登出操作
 */
export default function LogoutButton() {
  const router = useRouter();
  const { signOut, isSigningOut, error: authError, clearError } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  // 处理登出
  const handleLogout = async () => {
    setErrorMessage(null);
    try {
      const success = await signOut('/unlearn/login');
      if (!success) {
        setErrorMessage(authError || '登出失败，请稍后重试');
        return;
      }

      // 登出成功，重定向到登录页面
      router.refresh();
    } catch (error) {
      console.error('登出时出错:', error);
      setErrorMessage('登出时发生错误，请稍后重试');
    }
  };

  return (
    <>
      <button
        onClick={handleLogout}
        disabled={isSigningOut}
        className={`rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${isSigningOut ? 'animate-pulse' : ''}`}
      >
        {isSigningOut ? '登出中...' : '登出'}
      </button>
      {errorMessage && (
        <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
      )}
    </>
  );
}

