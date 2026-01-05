'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { UnlearnNav } from '@/components/unlearn';
import { useI18n } from '@/lib/i18n';
import AppBottomNav from '@/components/unlearn/AppBottomNav';
import { useAuth } from '@/hooks/domain/useAuth';

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
                            ]
                            : [
                                { label: '仪表盘', href: '/unlearn' },
                                { label: '计划', href: '/unlearn/plans' },
                                { label: '科学', href: '/unlearn/insights' },
                            ]}
                        isAppNav={true}
                    />
                </div>
            )}

            {/* Mobile Header - Simple title */}
            {!hideChrome && (
                <div className="md:hidden px-4 py-3 border-b border-[#1A1A1A]/5">
                    <h1 className="text-lg font-semibold text-[#1A1A1A]">
                        {language === 'en' ? 'No More Anxious' : '不再焦虑'}
                    </h1>
                </div>
            )}

            {children}

            {/* Mobile Bottom Navigation */}
            {!hideChrome && <AppBottomNav />}
        </div>
    );
}
