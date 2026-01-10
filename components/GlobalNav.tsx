'use client';

import { usePathname } from 'next/navigation';
import MarketingNav from './MarketingNav';
import { useAuth } from '@/hooks/domain/useAuth';
import { useProfile } from '@/hooks/domain/useProfile';

/**
 * Global Navigation Wrapper
 * Client Component that handles pathname detection and user data fetching
 * Displayed on all pages except login/signup/onboarding
 */
export default function GlobalNav() {
  const pathname = usePathname();
  const { user, isLoading: authLoading, error: authError } = useAuth();
  const { profile, isLoading: profileLoading, error: profileError } = useProfile();

  // Hide nav on auth pages and marketing pages (which have their own nav)
  const hideNavPages = ['/login', '/signup', '/onboarding', '/auth', '/welcome', '/beta', '/brutalist', '/unlearn', '/mobile', '/native', '/unlearn/app', '/e', '/poster'];
  const shouldHideNav = hideNavPages.some(page => pathname?.startsWith(page));

  if (shouldHideNav || pathname === '/') {
    return null;
  }

  const isLoading = authLoading || (!!user && profileLoading);
  const errorMessage = authError || (user ? profileError : null);

  return (
    <div className={isLoading ? 'animate-pulse' : ''}>
      <MarketingNav user={user} profile={profile} />
      {errorMessage && (
        <div className="mt-2 text-center text-sm text-red-600">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
