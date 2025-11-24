'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import OnboardingFlow from '@/components/OnboardingFlow';
import { mapAnswersToProfile, generatePersonaContext } from '@/lib/questions';
import { createClientSupabaseClient } from '@/lib/supabase-client';

interface OnboardingFlowClientProps {
  userId: string;
}

export default function OnboardingFlowClient({ userId }: OnboardingFlowClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async (answers: Record<string, string>) => {
    setIsSubmitting(true);

    try {
      // 1. 将答案映射为代谢档案
      const metabolicProfile = mapAnswersToProfile(answers);
      
      // 2. 生成AI人格上下文
      const personaContext = generatePersonaContext(metabolicProfile);

      // 3. 保存到 Supabase
      const supabase = createClientSupabaseClient();
      const { error } = await supabase
        .from('profiles')
        .update({
          metabolic_profile: metabolicProfile,
          ai_persona_context: personaContext,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('保存问卷结果失败:', error);
        alert('保存失败，请重试');
        setIsSubmitting(false);
        return;
      }

      // 4. 跳转到升级页面（新营销漏斗）
      console.log('✅ 问卷保存成功，引导至升级页面');
      router.push('/onboarding/upgrade');
      router.refresh();
    } catch (error) {
      console.error('处理问卷结果时出错:', error);
      alert('处理失败，请重试');
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center">
        <p className="text-[#0B3D2E] text-lg">正在保存...</p>
      </div>
    );
  }

  return <OnboardingFlow onComplete={handleComplete} />;
}
