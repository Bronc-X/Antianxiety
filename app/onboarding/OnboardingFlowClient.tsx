'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AdaptiveOnboardingFlow from '@/components/AdaptiveOnboardingFlow';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import { tr, useI18n } from '@/lib/i18n';
import type { OnboardingResult } from '@/types/adaptive-interaction';

interface OnboardingFlowClientProps {
  userId: string;
}

export default function OnboardingFlowClient({ userId }: OnboardingFlowClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { language } = useI18n();

  const handleComplete = async (result: OnboardingResult) => {
    setIsSubmitting(true);

    try {
      const supabase = createClientSupabaseClient();
      
      // 1. Save metabolic profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          metabolic_profile: result.metabolicProfile,
        }, {
          onConflict: 'id',
          ignoreDuplicates: false,
        });

      if (profileError) {
        console.error('保存代谢档案失败:', profileError);
        throw profileError;
      }

      // 2. Save Phase Goals
      for (const goal of result.recommendedGoals) {
        const { error: goalError } = await supabase
          .from('phase_goals')
          .upsert({
            id: goal.id,
            user_id: userId,
            goal_type: goal.goal_type,
            priority: goal.priority,
            title: goal.title,
            rationale: goal.rationale,
            citations: goal.citations,
            is_ai_recommended: true,
            user_modified: goal.user_modified || false,
          }, {
            onConflict: 'user_id,priority',
          });

        if (goalError) {
          console.error('保存目标失败:', goalError);
        }
      }

      // 3. Save onboarding answers
      let sequenceOrder = 0;
      for (const [questionId, answerValue] of Object.entries(result.answers)) {
        await supabase
          .from('onboarding_answers')
          .insert({
            user_id: userId,
            question_id: questionId,
            question_type: sequenceOrder < 3 ? 'template' : 'decision_tree',
            question_text: questionId,
            answer_value: answerValue,
            sequence_order: sequenceOrder++,
          });
      }

      // 4. Navigate to upgrade page
      console.log('✅ 自适应问卷保存成功，引导至升级页面');
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

  return <AdaptiveOnboardingFlow onComplete={handleComplete} />;
}
