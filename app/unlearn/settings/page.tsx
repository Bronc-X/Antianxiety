'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SettingsClient from '../../settings/SettingsClient';
import { useAuth } from '@/hooks/domain/useAuth';
import { useProfile } from '@/hooks/domain/useProfile';

function SettingsSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAF6EF] dark:bg-neutral-950 transition-colors animate-pulse">
      <div className="border-b border-[#E7E1D6] dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="h-6 w-40 rounded bg-[#E7E1D6] dark:bg-neutral-800" />
          <div className="mt-3 h-4 w-64 rounded bg-[#E7E1D6] dark:bg-neutral-800" />
        </div>
      </div>
      <div className="border-b border-[#E7E1D6] dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 py-4">
            <div className="h-4 w-20 rounded bg-[#E7E1D6] dark:bg-neutral-800" />
            <div className="h-4 w-20 rounded bg-[#E7E1D6] dark:bg-neutral-800" />
            <div className="h-4 w-20 rounded bg-[#E7E1D6] dark:bg-neutral-800" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6">
          <div className="h-24 rounded-xl border border-[#E7E1D6] dark:border-neutral-800 bg-white dark:bg-neutral-900" />
          <div className="h-24 rounded-xl border border-[#E7E1D6] dark:border-neutral-800 bg-white dark:bg-neutral-900" />
          <div className="h-24 rounded-xl border border-[#E7E1D6] dark:border-neutral-800 bg-white dark:bg-neutral-900" />
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, error: authError } = useAuth();
  const { profile, isLoading: profileLoading, error: profileError } = useProfile();

  const isLoading = authLoading || profileLoading;
  const error = authError || profileError;

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/unlearn');
    }
  }, [authLoading, user, router]);

  if (!user && !authLoading) {
    return null;
  }

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] dark:bg-neutral-950 transition-colors flex flex-col">
        <div className="flex-1" />
        {error && (
          <p className="mb-6 text-center text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <SettingsClient user={user} profile={profile} />
      {error && (
        <p className="mt-6 text-center text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
