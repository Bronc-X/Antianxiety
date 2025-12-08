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
    label: '今日',
    icon: <CalendarDays className="w-5 h-5" />,
    href: '/landing',
    activeRoutes: ['/landing', '/plans', '/'],
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
    label: '科学',
    icon: <FlaskConical className="w-5 h-5" />,
    href: '/bayesian',
    activeRoutes: ['/bayesian', '/analysis', '/feed', '/content'],
  },
  {
    id: 'profile',
    label: '我的',
    icon: <User className="w-5 h-5" />,
    href: '/settings',
    activeRoutes: ['/settings', '/upgrade', '/profile'],
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  
  // 在这些页面隐藏底部导航
  const hideNavPages = ['/login', '/signup', '/onboarding', '/auth'];
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
      {/* 占位元素，防止内容被导航栏遮挡 */}
      <div className="h-20 md:hidden" />
      
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* 背景模糊效果 */}
      <div className="absolute inset-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-t border-neutral-200/50 dark:border-neutral-800/50" />
      
      {/* 安全区域适配 - 四等分布局 */}
      <div className="relative grid grid-cols-4 pt-2 pb-safe">
        {navItems.map((item) => {
          const active = isActive(item);
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className="relative flex flex-col items-center justify-center py-1"
            >
              {/* 激活状态背景 */}
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              
              {/* 图标 */}
              <motion.div
                className={`relative z-10 p-1.5 rounded-lg transition-colors ${
                  active 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
                whileTap={{ scale: 0.9 }}
              >
                {item.icon}
              </motion.div>
              
              {/* 标签 */}
              <span
                className={`relative z-10 text-[10px] font-medium mt-0.5 transition-colors ${
                  active 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
    </>
  );
}
