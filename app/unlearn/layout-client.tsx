'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { UnlearnNav } from '@/components/unlearn';
import { useI18n } from '@/lib/i18n';
import AppBottomNav from '@/components/unlearn/AppBottomNav';
import { useAuth } from '@/hooks/domain/useAuth';
import { BiometricGate } from '@/components/auth/BiometricGate';

export default function UnlearnAppLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    const { language } = useI18n();
    const pathname = usePathname();
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    // Determine if we are on the Marketing Page (/unlearn/app or /e)
    const isMarketingPage = pathname === '/unlearn/app' || pathname === '/e' || pathname === '/e/';
    const hideChrome = pathname?.startsWith('/unlearn/login')
        || pathname?.startsWith('/unlearn/signup')
        || pathname?.startsWith('/unlearn/onboarding')
        || pathname?.startsWith('/unlearn/update-password')
        || pathname?.startsWith('/unlearn/max')
        || isMarketingPage;
    const isPublicPage = isMarketingPage || pathname?.startsWith('/auth');
    const isAuthPage = hideChrome || isPublicPage;

    useEffect(() => {
        if (!authLoading && !user && !isAuthPage) {
            router.replace('/unlearn/login');
        }
    }, [authLoading, isAuthPage, router, user]);

    if (!isAuthPage && (!user || authLoading)) {
        return null;
    }

    return (
        <BiometricGate enabled={!isAuthPage}>
            <div className="min-h-screen pb-safe" style={{ backgroundColor: isMarketingPage ? 'transparent' : '#FAF6EF' }}>
                {/* App Navigation - Desktop only */}
                {!hideChrome && (
                    <div className="hidden md:block">
                        <UnlearnNav
                            links={language === 'en'
                                ? [
                                    { label: 'Dashboard', href: '/unlearn' },
                                    { label: 'Plans', href: '/unlearn/plans' },
                                    { label: 'Science', href: '/unlearn/insights' },
                                    { label: 'Whitepaper', href: '/agent-whitepaper-preview' },
                                ]
                                : [
                                    { label: '仪表盘', href: '/unlearn' },
                                    { label: '计划', href: '/unlearn/plans' },
                                    { label: '科学', href: '/unlearn/insights' },
                                    { label: '白皮书', href: '/agent-whitepaper-preview' },
                                ]}
                            isAppNav={true}
                        />
                    </div>
                )}

                {/* Mobile Header - Logo branding + Settings */}
                {!hideChrome && (
                    <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[#1A1A1A]/5">
                        <h1 className="text-lg font-bold italic text-[#1A1A1A] tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                            AntiAnxiety<sup className="text-[8px] font-normal not-italic opacity-60">™</sup>
                        </h1>
                        <button
                            onClick={() => router.push('/unlearn/settings')}
                            className="p-2 text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors"
                            aria-label="Settings"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l-.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        </button>
                    </div>
                )}

                {children}

                {/* Mobile Bottom Navigation */}
                {!hideChrome && <AppBottomNav />}
            </div>
        </BiometricGate>
    );
}
