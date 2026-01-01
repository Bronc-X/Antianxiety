'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/domain/useAuth';

interface UserProfileMenuProps {
  user: {
    id: string;
    email?: string;
  };
  profile?: {
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
}

export default function UserProfileMenu({ user, profile }: UserProfileMenuProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { signOut, isSigningOut, error: authError } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleLogout = async () => {
    const success = await signOut('/login');
    if (success) {
      setIsOpen(false);
    }
  };

  const displayName = profile?.full_name || user.email?.split('@')[0] || t('userMenu.defaultUser');
  const avatarUrl = profile?.avatar_url || '';

  const getInitials = () => {
    if (displayName) {
      return displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={`flex items-center gap-2 rounded-full border border-[#E7E1D6] dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 hover:bg-[#FAF6EF] dark:hover:bg-neutral-700 transition-colors ${isSigningOut ? 'animate-pulse' : ''}`}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            className="h-8 w-8 rounded-full object-cover"
            width={32}
            height={32}
            unoptimized
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0B3D2E] dark:bg-emerald-600 text-xs font-medium text-white">
            {getInitials()}
          </div>
        )}
        <span className="hidden md:block text-sm text-[#0B3D2E] dark:text-white">
          {displayName}
        </span>
        <svg
          className={`h-4 w-4 text-[#0B3D2E] dark:text-white transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-64 rounded-lg border border-[#E7E1D6] dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg z-50"
          >
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-[#E7E1D6] dark:border-neutral-700">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                    alt={displayName}
                      className="h-12 w-12 rounded-full object-cover"
                      width={48}
                      height={48}
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0B3D2E] dark:bg-emerald-600 text-sm font-medium text-white">
                      {getInitials()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate flex items-center gap-1.5 text-[#0B3D2E] dark:text-white">
                      <span>{displayName || t('userMenu.noName')}</span>
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded shadow-sm flex-shrink-0">
                        PRO
                      </span>
                    </div>
                    <div className="text-xs truncate text-[#0B3D2E]/60 dark:text-neutral-400">{user.email}</div>
                  </div>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  className="w-full rounded-md border border-[#E7E1D6] dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-[#0B3D2E] dark:text-white hover:bg-[#FAF6EF] dark:hover:bg-neutral-700 transition-colors text-left block"
                >
                  ⚙️ {t('userMenu.settings')}
                </Link>
              <Link
                href="/onboarding/upgrade?from=menu"
                onClick={() => setIsOpen(false)}
                className="w-full rounded-md border border-[#0B3D2E] dark:border-emerald-600 bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] dark:from-emerald-600 dark:via-emerald-700 dark:to-emerald-800 px-3 py-2 text-sm text-white hover:shadow-md transition-all text-left block font-medium"
                >
                🚀 {t('userMenu.upgrade')}
              </Link>
                <button
                  onClick={handleLogout}
                  type="button"
                  className="w-full rounded-md border border-red-200 dark:border-red-800 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-left"
                >
                  {isSigningOut ? t('common.loading') : t('userMenu.logout')}
                </button>
                {authError && (
                  <p className="text-sm text-red-600">{authError}</p>
                )}
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

