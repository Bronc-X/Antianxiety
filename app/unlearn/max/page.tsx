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
    <div className="flex flex-col h-screen bg-[#FAF6EF] dark:bg-neutral-950 animate-pulse">
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] text-white safe-area-inset-top">
        <div className="w-9 h-9 rounded-full bg-white/10" />
        <div className="text-center">
          <div className="h-4 w-16 bg-white/20 rounded mx-auto" />
          <div className="mt-2 h-3 w-28 bg-white/10 rounded mx-auto" />
        </div>
        <div className="w-9" />
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="max-w-[80%] h-16 bg-white rounded-2xl border border-[#E7E1D6]" />
        <div className="max-w-[70%] h-12 bg-[#0B3D2E]/10 rounded-2xl border border-[#E7E1D6] ml-auto" />
        <div className="max-w-[75%] h-14 bg-white rounded-2xl border border-[#E7E1D6]" />
      </div>
      <div className="flex-shrink-0 border-t border-[#E7E1D6] dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3 safe-area-inset-bottom">
        <div className="flex items-end gap-2">
          <div className="flex-1 h-12 bg-[#F5F1EA] dark:bg-neutral-800 rounded-2xl" />
          <div className="w-12 h-12 rounded-full bg-[#0B3D2E]" />
        </div>
      </div>
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
      loadHistory(7).catch(() => {});
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
      <MaxPageClient
        initialProfile={profile as AIAssistantProfile | null}
        dailyLogs={dailyLogs}
      />
      {error && (
        <p className="fixed bottom-6 left-1/2 -translate-x-1/2 text-sm text-red-600 bg-white/90 px-4 py-2 rounded-full border border-red-200 shadow-sm">
          {error}
        </p>
      )}
    </div>
  );
}
