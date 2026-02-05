'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { toSerializable } from '@/lib/dto-utils';
import type { ActionResult } from '@/types/architecture';

export interface WeeklyCalibrationInput {
  answers: Record<string, number>;
  evolutionAnswer: string;
  responseDate?: string;
}

export interface MonthlyCalibrationInput {
  scaleId: 'PSS10' | 'GAD7' | 'PHQ9';
  answers: Record<string, number>;
  totalScore: number;
  interpretation: string;
  responseDate?: string;
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export async function saveWeeklyCalibration(
  input: WeeklyCalibrationInput
): Promise<ActionResult<void>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: '请先登录' };
    }

    const now = new Date().toISOString();
    const responseDate = input.responseDate || getTodayDate();

    const records = Object.entries(input.answers).map(([questionId, answerValue]) => ({
      user_id: user.id,
      scale_id: 'PSS4',
      question_id: questionId,
      answer_value: answerValue,
      source: 'weekly',
      response_date: responseDate,
      created_at: now,
    }));

    records.push({
      user_id: user.id,
      scale_id: 'WEEKLY_EVO',
      question_id: 'weekly_evolution',
      answer_value: 0,
      answer_text: input.evolutionAnswer,
      source: 'weekly',
      response_date: responseDate,
      created_at: now,
    } as Record<string, unknown>);

    const { error: upsertError } = await supabase
      .from('user_scale_responses')
      .upsert(records, { onConflict: 'user_id,scale_id,question_id,response_date' });

    if (upsertError) {
      return { success: false, error: upsertError.message };
    }

    await supabase
      .from('profiles')
      .update({ last_weekly_calibration: now })
      .eq('id', user.id);

    return toSerializable({ success: true });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '每周复盘保存失败',
    };
  }
}

export async function saveMonthlyCalibration(
  input: MonthlyCalibrationInput
): Promise<ActionResult<void>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: '请先登录' };
    }

    const now = new Date().toISOString();
    const responseDate = input.responseDate || getTodayDate();

    const records = Object.entries(input.answers).map(([questionId, answerValue]) => ({
      user_id: user.id,
      scale_id: input.scaleId,
      question_id: questionId,
      answer_value: answerValue,
      source: 'monthly',
      response_date: responseDate,
      created_at: now,
    }));

    const { error: upsertError } = await supabase
      .from('user_scale_responses')
      .upsert(records, { onConflict: 'user_id,scale_id,question_id,response_date' });

    if (upsertError) {
      return { success: false, error: upsertError.message };
    }

    const { error: mergeError } = await supabase.rpc('merge_inferred_scores', {
      p_user_id: user.id,
      p_scale_id: input.scaleId,
      p_score: input.totalScore,
      p_interpretation: input.interpretation,
    });

    if (mergeError) {
      return { success: false, error: mergeError.message };
    }

    await supabase
      .from('profiles')
      .update({ last_monthly_calibration: now })
      .eq('id', user.id);

    return toSerializable({ success: true });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '月度评估保存失败',
    };
  }
}
