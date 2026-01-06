'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import {
  LayoutDashboard,
  Sparkles,
  Target,
  FileText
} from 'lucide-react';

/**
 * App 移动端底部导航栏
 * 
 * 四个主要入口：
 * 1. 仪表盘 - Dashboard
 * 2. Max - AI 助理
 * 3. 计划 - Plans
 * 4. 设置 - Settings
 */

interface NavItem {
  id: string;
  labelEn: string;
  labelZh: string;
  icon: React.ReactNode;
  href?: string;
  activeRoutes?: string[];
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    labelEn: 'Dashboard',
    labelZh: '仪表盘',
    icon: <LayoutDashboard className="w-5 h-5" />,
    href: '/unlearn',
    activeRoutes: ['/unlearn'],
  },
  {
    id: 'max',
    labelEn: 'Max',
    labelZh: 'Max',
    icon: <Sparkles className="w-5 h-5" />,
    href: '/unlearn/max',
    activeRoutes: ['/unlearn/max'],
  },
  {
    id: 'plans',
    labelEn: 'Plans',
    labelZh: '计划',
    icon: <Target className="w-5 h-5" />,
    href: '/unlearn/plans',
    activeRoutes: ['/unlearn/plans'],
  },
  {
    id: 'whitepaper',
    labelEn: 'Whitepaper',
    labelZh: '白皮书',
    icon: <FileText className="w-5 h-5" />,
    href: '/agent-whitepaper-preview',
    activeRoutes: ['/agent-whitepaper-preview'],
  },
];

export default function AppBottomNav() {
  const pathname = usePathname();
  const { language } = useI18n();

  const isActive = (item: NavItem) => {
    if (!item.activeRoutes) return false;
    // 特殊处理 dashboard - 只有精确匹配才激活
    if (item.id === 'dashboard') {
      return pathname === '/unlearn' || pathname === '/unlearn/';
    }
    return item.activeRoutes.some(route => pathname?.startsWith(route));
  };

  const handleClick = (item: NavItem, active: boolean) => {
    if (!active) {
      import('@/lib/haptics').then(({ triggerHaptic }) => triggerHaptic.selection());
    }
  };

  return (
    <>
      {/* Spacer to prevent content from being hidden behind nav */}
      <div className="h-20 md:hidden" />

      {/* Bottom Navigation - Only visible on mobile */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[9999] md:hidden"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          backgroundColor: '#FAF6EF',
        }}
      >
        {/* Top border */}
        <div className="absolute top-0 left-0 right-0 h-px bg-[#1A1A1A]/10" />

        {/* Nav Container */}
        <div className="flex justify-around items-center px-2 py-2">
          {navItems.map((item) => {
            const active = isActive(item);
            const label = language === 'en' ? item.labelEn : item.labelZh;

            // Regular navigation link
            return (
              <Link
                key={item.id}
                href={item.href || '/unlearn'}
                onClick={() => handleClick(item, active)}
                className="relative flex-1 flex flex-col items-center justify-center py-1"
              >
                {/* Active Background */}
                {active && (
                  <motion.div
                    layoutId="appNavActive"
                    className="absolute inset-x-2 inset-y-0 bg-[#0B3D2E]/10 rounded-lg"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <motion.div
                  animate={{
                    scale: active ? 1.05 : 1,
                  }}
                  className={`relative z-10 transition-colors ${active
                    ? 'text-[#0B3D2E]'
                    : 'text-[#1A1A1A]/40'
                    }`}
                  whileTap={{ scale: 0.9 }}
                >
                  {item.icon}
                </motion.div>

                {/* Label */}
                <span
                  className={`text-[10px] font-medium mt-1 transition-colors ${active
                    ? 'text-[#0B3D2E]'
                    : 'text-[#1A1A1A]/40'
                    }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
