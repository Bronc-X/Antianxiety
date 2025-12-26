'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import MarketingNav from './MarketingNav';

/**
 * Global Navigation Wrapper
 * Client Component that handles pathname detection and user data fetching
 * Displayed on all pages except login/signup/onboarding
 */
export default function GlobalNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClientSupabaseClient();

  // Hide nav on auth pages and marketing pages (which have their own nav)
  const hideNavPages = ['/login', '/signup', '/onboarding', '/auth', '/welcome', '/beta', '/brutalist'];
  const shouldHideNav = hideNavPages.some(page => pathname?.startsWith(page));

  useEffect(() => {
    async function fetchUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
    }

    if (!shouldHideNav) {
      fetchUserData();
    }
  }, [pathname, shouldHideNav]);

  if (shouldHideNav) {
    return null;
  }

  return <MarketingNav user={user} profile={profile} />;
}
