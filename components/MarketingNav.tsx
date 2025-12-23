'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AnimatedSection from '@/components/AnimatedSection';
import UserProfileMenu from '@/components/UserProfileMenu';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18n';

import { motion } from 'framer-motion';

interface MarketingNavProps {
  user?: {
    id: string;
    email?: string;
  } | null;
  profile?: {
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
}

export default function MarketingNav({ user, profile }: MarketingNavProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (pathname !== '/landing') {
      e.preventDefault();
      window.location.href = `/landing${href}`;
      return;
    }

    e.preventDefault();
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <AnimatedSection inView variant="fadeIn" className="sticky top-0 z-30 bg-[#FAF6EF]/90 dark:bg-neutral-950/90 backdrop-blur border-b border-[#E7E1D6] dark:border-neutral-800 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/landing" className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#0B3D2E] dark:bg-white" />
              <span className="text-sm font-semibold tracking-wide text-[#0B3D2E] dark:text-white">
                AntiAnxiety™
              </span>
            </Link>
          </div>
          
          {user && (
            <nav className="hidden md:flex items-center gap-3 text-sm bg-black/5 dark:bg-white/5 p-1 rounded-full backdrop-blur-md">
              <LanguageSwitcher />
              <div className="flex items-center relative gap-3" onMouseLeave={() => setHoveredPath(null)}>
                {[
                  { href: '/welcome', label: t('nav.scienceInsight') },
                  { href: '/assistant', label: t('nav.assistant') },
                  { href: '/analysis', label: t('nav.analysis') },
                  { href: '/onboarding/upgrade?from=landing', label: t('nav.upgrade') },
                ].map((item) => {
                  const isActive = item.href === hoveredPath;

                  const linkClass = "relative px-6 py-2 rounded-full text-sm font-medium transition-colors z-10 duration-200 " +
                    (isActive ? "text-black dark:text-white" : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white");

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onMouseEnter={() => setHoveredPath(item.href)}
                      className={linkClass}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="nav-pill"
                          className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-full shadow-sm z-[-1]"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      {item.label}
                    </Link>
                  );
                })}
                <div className="ml-2 pl-2 border-l border-neutral-200 dark:border-neutral-800">
                  <UserProfileMenu user={user} profile={profile} />
                </div>
              </div>
            </nav>
          )}
        </div>
      </div>
    </AnimatedSection>
  );
}
