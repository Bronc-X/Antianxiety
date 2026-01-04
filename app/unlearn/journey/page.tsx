'use client';

import OnboardingJourney from '@/components/OnboardingJourney';
import { useRouter } from 'next/navigation';

export default function JourneyDemoPage() {
    const router = useRouter();

    return (
        <OnboardingJourney
            onComplete={() => {
                alert('旅程完成！即将跳转到评估...');
                router.push('/unlearn/onboarding');
            }}
            onSkip={() => {
                router.push('/unlearn/onboarding');
            }}
        />
    );
}
