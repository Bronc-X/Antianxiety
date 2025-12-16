'use client';

import AdaptiveOnboardingFlow from '@/components/AdaptiveOnboardingFlow';
import { tr, useI18n } from '@/lib/i18n';
import type { OnboardingResult } from '@/types/adaptive-interaction';

/**
 * 问卷预览页面 - 无需登录
 * 仅用于查看问卷效果，不保存数据
 */
export default function OnboardingPreviewPage() {
  const { language } = useI18n();
  const handleComplete = (result: OnboardingResult) => {
    console.log('问卷结果（预览模式，不保存）:', result);
    alert(
      tr(language, {
        zh: `预览模式：问卷完成！\n\n推荐目标：${result.recommendedGoals.map(g => g.title).join(', ')}\n\n实际使用时会保存数据并跳转到主页。`,
        en: `Preview mode: completed!\n\nRecommended goals: ${result.recommendedGoals.map(g => g.title).join(', ')}\n\nIn real use, data will be saved and you will be redirected to home.`,
      })
    );
  };

  return <AdaptiveOnboardingFlow onComplete={handleComplete} />;
}
