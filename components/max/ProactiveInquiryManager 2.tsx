'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import ProactiveInquiryModal from './ProactiveInquiryModal';
import { useProactiveInquiry } from '@/hooks/domain/useProactiveInquiry';
import { useI18n } from '@/lib/i18n';

export default function ProactiveInquiryManager() {
    const { language } = useI18n();
    const pathname = usePathname();
    
    // Use the domain hook (The Bridge)
    const {
        currentInquiry,
        isInquiryVisible,
        submitAnswer,
        dismissInquiry,
        pause,
        resume,
    } = useProactiveInquiry({}, language === 'en' ? 'en' : 'zh');

    // Pause inquiries on specific pages (e.g. login, onboarding)
    useEffect(() => {
        const sensitivePages = [
            '/login',
            '/signup',
            '/onboarding',
            '/auth',
            '/unlearn/login',
            '/unlearn/signup',
            '/unlearn/onboarding',
            '/unlearn/update-password',
        ];
        const isSensitive = sensitivePages.some(p => pathname?.includes(p));

        if (isSensitive) {
            pause();
        } else {
            resume();
        }
    }, [pathname, pause, resume]);

    if (!currentInquiry) return null;

    return (
        <ProactiveInquiryModal
            inquiry={currentInquiry}
            isVisible={isInquiryVisible}
            onAnswer={submitAnswer}
            onDismiss={dismissInquiry}
        />
    );
}
