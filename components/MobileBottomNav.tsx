'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  FlaskConical,
  User,
  Sparkles
} from 'lucide-react';

/**
 * 移动端底部导航栏
 * 
 * 四个主要入口：
 * 1. 今日 - 今日记录、今日计划、我的计划
 * 2. Max - AI 助理
 * 3. 科学 - 研究动态、动态身体报告、认知天平
 * 4. 我的 - 个人设置、升级
 */

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  activeRoutes: string[];
}

const navItems: NavItem[] = [
  {
    id: 'today',
    label: 'Today',
    icon: <CalendarDays className="w-5 h-5" />,
    href: '/unlearn/app',
    activeRoutes: ['/unlearn/app', '/plans', '/'],
  },
  {
    id: 'max',
    label: 'Max',
    icon: <Sparkles className="w-5 h-5" />,
    href: '/max',
    activeRoutes: ['/max', '/assistant', '/chat'],
  },
  {
    id: 'science',
    label: 'Science',
    icon: <FlaskConical className="w-5 h-5" />,
    href: '/bayesian',
    activeRoutes: ['/bayesian', '/analysis', '/feed', '/content'],
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: <User className="w-5 h-5" />,
    href: '/settings',
    activeRoutes: ['/settings', '/upgrade', '/profile'],
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  // 在这些页面隐藏底部导航
  const hideNavPages = ['/login', '/signup', '/onboarding', '/auth', '/welcome', '/beta', '/unlearn'];
  const shouldHideNav = hideNavPages.some(page => pathname?.startsWith(page));

  if (shouldHideNav) {
    return null;
  }

  const isActive = (item: NavItem) => {
    return item.activeRoutes.some(route => {
      if (route === '/') return pathname === '/';
      return pathname?.startsWith(route);
    });
  };

  return (
    <>
      <div className="h-24 md:hidden" />

      <nav className="fixed bottom-6 left-4 right-4 z-50 md:hidden">
        {/* Floating Glass Dock Container */}
        <div className="relative bg-white/90 dark:bg-black/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/5">
          <div className="flex justify-between items-center px-2 py-3">
            {navItems.map((item) => {
              const active = isActive(item);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => {
                    if (!active) {
                      import('@/lib/haptics').then(({ triggerHaptic }) => triggerHaptic.selection());
                    }
                  }}
                  className="relative flex-1 flex flex-col items-center justify-center min-w-0"
                >
                  {/* Active Indicator (Glow behind) */}
                  {active && (
                    <motion.div
                      layoutId="activeTabGlow"
                      className="absolute w-12 h-12 bg-emerald-500/10 dark:bg-emerald-400/20 rounded-full blur-md"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}

                  {/* Icon Container */}
                  <div className="relative p-2">
                    <motion.div
                      animate={{
                        scale: active ? 1.1 : 1,
                        y: active ? -2 : 0,
                        color: active ? 'var(--color-emerald-600)' : 'var(--color-neutral-400)'
                      }}
                      // Tailwind colors need to be resolved or used as classes logic below checks this
                      className={`relative z-10 transition-colors ${active
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-neutral-400 dark:text-neutral-500'
                        }`}
                      whileTap={{ scale: 0.8 }}
                    >
                      {item.icon}
                    </motion.div>

                    {/* Active Dot (Small indicator below icon) */}
                    {active && (
                      <motion.div
                        layoutId="activeTabDot"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-600 dark:bg-emerald-400 rounded-full"
                      />
                    )}
                  </div>

                  {/* Label - Hidden in compact dock or shown? Let's show it very small or hide for cleanliness. 
                      "Floating Dock" usually is icon only. But users might need labels.
                      Let's hide labels for the 'cool' look like Arc Search, or update to show only on active?
                      Code below keeps labels but makes them tiny.
                  */}
                  <span
                    className={`text-[9px] font-medium transition-all duration-300 ${active
                      ? 'text-emerald-600 dark:text-emerald-400 opacity-100 translate-y-0'
                      : 'text-neutral-400 dark:text-neutral-500 opacity-0 -translate-y-2 hidden'
                      }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
