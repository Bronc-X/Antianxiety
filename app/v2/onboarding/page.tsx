/**
 * V2 Onboarding Page
 * 
 * 重定向到现有 onboarding 流程
 * 现有实现: /app/onboarding/ (ClinicalOnboarding with GAD-7 + PHQ-9 + ISI)
 */

import { redirect } from 'next/navigation';

export default function V2OnboardingPage() {
    redirect('/onboarding');
}
