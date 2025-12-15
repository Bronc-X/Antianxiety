'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import OnboardingFlow from '@/components/OnboardingFlow';
import { mapAnswersToProfile, generatePersonaContext } from '@/lib/questions';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import { tr, useI18n } from '@/lib/i18n';

interface OnboardingFlowClientProps {
  userId: string;
}

export default function OnboardingFlowClient({ userId }: OnboardingFlowClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { language } = useI18n();

  const handleComplete = async (answers: Record<string, string>) => {
    setIsSubmitting(true);

    try {
      // 1. 将答案映射为代谢档案
      const metabolicProfile = mapAnswersToProfile(answers);
      
      // 2. 生成AI人格上下文
      const personaContext = generatePersonaContext(metabolicProfile);

      // 3. 保存到 Supabase（使用upsert确保profile存在）
      const supabase = createClientSupabaseClient();
      
      // 只保存最小必需字段（metabolic_profile）
      // 其他字段在migration执行后再添加
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          metabolic_profile: metabolicProfile,
        }, {
          onConflict: 'id',
          ignoreDuplicates: false,
        });

      if (upsertError) {
        console.error('保存问卷结果失败:', upsertError);
        alert(
          language === 'en'
            ? `Save failed: ${upsertError.message || 'Please try again.'}`
            : `保存失败：${upsertError.message || '请重试'}`
        );
        setIsSubmitting(false);
        return;
      }

      // 4. 跳转到升级页面（新营销漏斗）
      console.log('✅ 问卷保存成功，引导至升级页面');
      router.push('/onboarding/upgrade');
      router.refresh();
    } catch (error) {
      console.error('处理问卷结果时出错:', error);
      alert(tr(language, { zh: '处理失败，请重试', en: 'Failed to process. Please try again.' }));
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center">
        <p className="text-[#0B3D2E] text-lg">{tr(language, { zh: '正在保存...', en: 'Saving...' })}</p>
      </div>
    );
  }

  return <OnboardingFlow onComplete={handleComplete} />;
}
