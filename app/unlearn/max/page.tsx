'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MaxPageClient from './MaxPageClient';
import { useAuth } from '@/hooks/domain/useAuth';
import { useProfile } from '@/hooks/domain/useProfile';
import { useCalibrationLog } from '@/hooks/domain/useCalibrationLog';

function MaxSkeleton() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#134e3f] text-white">
      Loading Max...
    </div>
  );
}

/**
 * Max AI 助理页面
 * 
 * 这是移动端底部导航 "Max" 入口的目标页面
 * 提供全屏 AI 对话体验
 */
export default function MaxPage() {
  const router = useRouter();
  const { isLoading: authLoading, error: authError, isAuthenticated } = useAuth();
  const { isLoading: profileLoading, error: profileError } = useProfile();
  const { isLoading: logLoading, error: logError, loadHistory } = useCalibrationLog();

  const isLoading = authLoading || profileLoading || logLoading;
  const error = authError || profileError || logError;

  useEffect(() => {
    if (isAuthenticated) {
      loadHistory(7).catch(() => { });
    }
  }, [isAuthenticated, loadHistory]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/unlearn/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (!isAuthenticated && !authLoading) {
    return null;
  }

  if (isLoading) {
    return <MaxSkeleton />;
  }

  return (
    <div className="relative">
      <MaxPageClient />
      {error && (
        <p className="fixed bottom-6 left-1/2 -translate-x-1/2 text-sm text-red-600 bg-white/90 px-4 py-2 rounded-full border border-red-200 shadow-sm">
          {error}
        </p>
      )}
    </div>
  );
}
