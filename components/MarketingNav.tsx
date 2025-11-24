'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AnimatedSection from '@/components/AnimatedSection';
import UserProfileMenu from '@/components/UserProfileMenu';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18n';

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
  
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // 如果不在landing页面，先跳转到landing页面
    if (pathname !== '/landing') {
      e.preventDefault();
      window.location.href = `/landing${href}`;
      return;
    }
    
    // 在landing页面，直接滚动到锚点
    e.preventDefault();
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 80; // 导航栏高度 + 一些间距
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <AnimatedSection inView variant="fadeIn" className="sticky top-0 z-30 bg-[#FAF6EF]/90 backdrop-blur border-b border-[#E7E1D6]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/landing" className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#0B3D2E]" />
            <span className="text-sm font-semibold tracking-wide text-[#0B3D2E]">
              No More anxious™
            </span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <LanguageSwitcher />
            
            {/* 已登录用户：显示功能导航 */}
            {user ? (
              <>
                <a 
                  href="#how" 
                  onClick={(e) => handleAnchorClick(e, '#how')}
                  className="text-[#0B3D2E]/80 hover:text-[#0B3D2E] transition-colors cursor-pointer"
                >
                  核心功能
                </a>
                <a 
                  href="#model" 
                  onClick={(e) => handleAnchorClick(e, '#model')}
                  className="text-[#0B3D2E]/80 hover:text-[#0B3D2E] transition-colors cursor-pointer"
                >
                  科学模型
                </a>
                <a 
                  href="#authority" 
                  onClick={(e) => handleAnchorClick(e, '#authority')}
                  className="text-[#0B3D2E]/80 hover:text-[#0B3D2E] transition-colors cursor-pointer"
                >
                  权威洞察
                </a>
                <Link
                  href="/analysis"
                  className="text-[#0B3D2E]/80 hover:text-[#0B3D2E] transition-colors"
                >
                  AI分析报告
                </Link>
                <Link
                  href="/plans"
                  className="text-[#0B3D2E]/80 hover:text-[#0B3D2E] transition-colors"
                >
                  我的计划
                </Link>
                <Link
                  href="/onboarding/upgrade?from=landing"
                  className="text-[#0B3D2E]/80 hover:text-[#0B3D2E] transition-colors"
                >
                  升级
                </Link>
                <UserProfileMenu user={user} profile={profile} />
              </>
            ) : (
              <>
                <Link href="/login" className="text-[#0B3D2E]/80 hover:text-[#0B3D2E] transition-colors">
                  {t('nav.login')}
                </Link>
                <a 
                  href="#cta"
                  onClick={(e) => handleAnchorClick(e, '#cta')}
                  className="inline-flex items-center rounded-md bg-[#0B3D2E] px-3 py-1.5 text-white hover:bg-[#0a3629] transition-colors cursor-pointer"
                >
                  {t('nav.early')}
                </a>
              </>
            )}
          </nav>
        </div>
      </div>
    </AnimatedSection>
  );
}


