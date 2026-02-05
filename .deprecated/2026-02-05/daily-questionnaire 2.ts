'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { toSerializable, dateToISO } from '@/lib/dto-utils';
import type { ActionResult } from '@/types/architecture';

export interface DailyQuestionnaireResponse {
  id: number;
  response_date: string;
  created_at: string;
  responses: Record<string, number>;
  questions: string[];
}

export interface SaveDailyQuestionnaireInput {
  responses: Record<string, number>;
  questions: string[];
  responseDate?: string;
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export async function getDailyQuestionnaireResponse(
  responseDate: string = getTodayDate()
): Promise<ActionResult<DailyQuestionnaireResponse | null>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: '请先登录' };
    }

    const { data, error } = await supabase
      .from('daily_questionnaire_responses')
      .select('id, response_date, created_at, responses, questions')
      .eq('user_id', user.id)
      .eq('response_date', responseDate)
      .order('created_at', { ascending: false })
      .limit(1)
      .returns<DailyQuestionnaireResponse[]>();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: true, data: null };
    }

    const record = data[0];
    return toSerializable({
      success: true,
      data: {
        id: record.id,
        response_date: record.response_date,
        created_at: dateToISO(record.created_at) || new Date().toISOString(),
        responses: record.responses || {},
        questions: record.questions || [],
      },
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load questionnaire',
    };
  }
}

export async function saveDailyQuestionnaireResponse(
  input: SaveDailyQuestionnaireInput
): Promise<ActionResult<DailyQuestionnaireResponse>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: '请先登录' };
    }

    const responseDate = input.responseDate || getTodayDate();

    const { data, error } = await supabase
      .from('daily_questionnaire_responses')
      .upsert(
        {
          user_id: user.id,
          response_date: responseDate,
          responses: input.responses,
          questions: input.questions,
        },
        { onConflict: 'user_id,response_date' }
      )
      .select('id, response_date, created_at, responses, questions')
      .single<DailyQuestionnaireResponse>();

    if (error || !data) {
      return { success: false, error: error?.message || '保存问卷失败' };
    }

    return toSerializable({
      success: true,
      data: {
        id: data.id,
        response_date: data.response_date,
        created_at: dateToISO(data.created_at) || new Date().toISOString(),
        responses: data.responses || {},
        questions: data.questions || [],
      },
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '保存问卷失败',
    };
  }
}
