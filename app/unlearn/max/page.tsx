'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MaxPageClient from './MaxPageClient';
import { useAuth } from '@/hooks/domain/useAuth';
import { useProfile } from '@/hooks/domain/useProfile';
import { useCalibrationLog } from '@/hooks/domain/useCalibrationLog';
import type { DailyLog } from '@/lib/active-inquiry';
import type { AIAssistantProfile } from '@/types/assistant';

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
  const { user, isLoading: authLoading, error: authError, isAuthenticated } = useAuth();
  const { profile, isLoading: profileLoading, error: profileError } = useProfile();
  const { history, isLoading: logLoading, error: logError, loadHistory } = useCalibrationLog();

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

  const dailyLogs: DailyLog[] = useMemo(() => {
    return (history || []).map(entry => ({
      id: entry.id,
      user_id: entry.user_id,
      sleep_hours: entry.sleep_duration_minutes != null ? entry.sleep_duration_minutes / 60 : null,
      hrv: null,
      stress_level: entry.stress_level ?? null,
      exercise_duration_minutes: null,
      created_at: entry.created_at,
    }));
  }, [history]);

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
