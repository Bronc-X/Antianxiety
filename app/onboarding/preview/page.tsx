'use client';

import OnboardingFlow from '@/components/OnboardingFlow';
import { tr, useI18n } from '@/lib/i18n';

/**
 * 问卷预览页面 - 无需登录
 * 仅用于查看问卷效果，不保存数据
 */
export default function OnboardingPreviewPage() {
  const { language } = useI18n();
  const handleComplete = (answers: Record<string, string>) => {
    console.log('问卷答案（预览模式，不保存）:', answers);
    alert(
      tr(language, {
        zh: '预览模式：问卷完成！\n\n实际使用时会保存数据并跳转到主页。',
        en: 'Preview mode: completed!\n\nIn real use, data will be saved and you will be redirected to home.',
      })
    );
  };

  return <OnboardingFlow onComplete={handleComplete} />;
}
