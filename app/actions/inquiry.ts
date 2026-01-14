'use server';

/**
 * Inquiry Server Actions (The Brain)
 *
 * Handles inquiry creation and response logging.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { toSerializable, dateToISO } from '@/lib/dto-utils';
import type { ActionResult } from '@/types/architecture';
import type {
  InquiryRecord,
  InquiryQuestionType,
  InquiryPriority,
  DeliveryMethod,
  InquiryPendingResponse,
  CuratedContent,
} from '@/types/adaptive-interaction';
import { refreshUserProfile, syncUserProfile } from '@/app/actions/user';
import {
  identifyDataGaps,
  generateInquiryQuestion,
  getInquiryOptionsForGap,
} from '@/lib/inquiry-engine';
import { getTopRecommendation } from '@/lib/feed-curation';

export interface InquiryInput {
  question_text: string;
  question_type: InquiryQuestionType;
  priority: InquiryPriority;
  data_gaps_addressed?: string[];
  delivery_method?: DeliveryMethod;
}

type InquiryRow = Omit<InquiryRecord, 'responded_at' | 'created_at'> & {
  responded_at?: string | null;
  created_at?: string | null;
};

function toInquiryRecord(row: InquiryRow): InquiryRecord {
  return {
    id: row.id,
    user_id: row.user_id,
    question_text: row.question_text,
    question_type: row.question_type,
    priority: row.priority,
    data_gaps_addressed: row.data_gaps_addressed || [],
    user_response: row.user_response || undefined,
    responded_at: dateToISO(row.responded_at) || undefined,
    delivery_method: row.delivery_method,
    created_at: dateToISO(row.created_at) || new Date().toISOString(),
  };
}

/**
 * Create a new inquiry history record.
 */
export async function createInquiry(input: InquiryInput): Promise<ActionResult<InquiryRecord>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Please sign in' };
    }

    if (!input.question_text || !input.question_type || !input.priority) {
      return { success: false, error: 'Missing required fields' };
    }

    const { data, error } = await supabase
      .from('inquiry_history')
      .insert({
        user_id: user.id,
        question_text: input.question_text,
        question_type: input.question_type,
        priority: input.priority,
        data_gaps_addressed: input.data_gaps_addressed || [],
        delivery_method: input.delivery_method || 'in_app',
      })
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || 'Failed to create inquiry' };
    }

    return toSerializable({ success: true, data: toInquiryRecord(data) });
  } catch (error) {
    console.error('[Inquiry Action] createInquiry error:', error);
    return { success: false, error: 'Failed to create inquiry' };
  }
}

/**
 * Record user response to an inquiry.
 */
export async function respondToInquiry(
  inquiryId: string,
  response: string
): Promise<ActionResult<InquiryRecord>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Please sign in' };
    }

    if (!inquiryId || !response) {
      return { success: false, error: 'Missing required fields' };
    }

    const { data: updatedInquiry, error: updateError } = await supabase
      .from('inquiry_history')
      .update({
        user_response: response,
        responded_at: new Date().toISOString(),
      })
      .eq('id', inquiryId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError || !updatedInquiry) {
      return { success: false, error: updateError?.message || 'Failed to record response' };
    }

    const dataGaps = updatedInquiry.data_gaps_addressed || [];

    if (dataGaps.length > 0) {
      const gapField = dataGaps[0];
      const today = new Date().toISOString().split('T')[0];
      const calibrationUpdate: Record<string, number | null> = {};

      switch (gapField) {
        case 'sleep_hours': {
          const sleepMap: Record<string, number> = {
            under_6: 5,
            '6_7': 6.5,
            '7_8': 7.5,
            over_8: 8.5,
          };
          calibrationUpdate.sleep_hours = sleepMap[response] || null;
          break;
        }
        case 'stress_level': {
          const stressMap: Record<string, number> = {
            low: 3,
            medium: 6,
            high: 9,
          };
          calibrationUpdate.stress_level = stressMap[response] || null;
          break;
        }
        case 'exercise_duration': {
          const exerciseMap: Record<string, number> = {
            none: 0,
            light: 15,
            moderate: 30,
            intense: 60,
          };
          calibrationUpdate.exercise_duration = exerciseMap[response] || null;
          break;
        }
        case 'mood': {
          const moodMap: Record<string, number> = {
            bad: 3,
            okay: 6,
            great: 9,
          };
          calibrationUpdate.mood_score = moodMap[response] || null;
          break;
        }
        case 'meal_quality':
          calibrationUpdate.meal_quality = response;
          break;
        case 'water_intake':
          calibrationUpdate.water_intake = response;
          break;
        default:
          break;
      }

      if (Object.keys(calibrationUpdate).length > 0) {
        const { error: calibrationError } = await supabase
          .from('daily_calibrations')
          .upsert({
            user_id: user.id,
            date: today,
            ...calibrationUpdate,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,date',
          });

        if (calibrationError) {
          console.warn('[Inquiry Action] daily_calibrations sync warning:', calibrationError.message);
        }
      }
    }

    const now = new Date();
    const dayOfWeek = now.getDay();
    const hourOfDay = now.getHours();

    const { error: patternError } = await supabase
      .from('user_activity_patterns')
      .upsert({
        user_id: user.id,
        day_of_week: dayOfWeek,
        hour_of_day: hourOfDay,
        activity_score: 0.7,
        updated_at: now.toISOString(),
      }, {
        onConflict: 'user_id,day_of_week,hour_of_day',
      });

    if (patternError) {
      console.warn('[Inquiry Action] activity pattern update warning:', patternError.message);
    }

    refreshUserProfile().catch(() => {});
    syncUserProfile().catch(() => {});

    return toSerializable({ success: true, data: toInquiryRecord(updatedInquiry) });
  } catch (error) {
    console.error('[Inquiry Action] respondToInquiry error:', error);
    return { success: false, error: 'Failed to record response' };
  }
}

/**
 * Get pending inquiry for the current user.
 */
export async function getPendingInquiry(
  language: 'zh' | 'en' = 'zh'
): Promise<ActionResult<InquiryPendingResponse>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Please sign in' };
    }

    const { data: recentInquiry } = await supabase
      .from('inquiry_history')
      .select('*')
      .eq('user_id', user.id)
      .is('user_response', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (recentInquiry) {
      const gapField = Array.isArray(recentInquiry.data_gaps_addressed)
        ? recentInquiry.data_gaps_addressed[0]
        : undefined;

      let questionText = recentInquiry.question_text;
      if (gapField) {
        const template = generateInquiryQuestion(
          [{ field: gapField, importance: 'high', description: '' }],
          [],
          language
        );
        if (template) {
          questionText = template.question_text;
        }
      }

      const derivedOptions = gapField ? getInquiryOptionsForGap(gapField, language) : null;
      const response: InquiryPendingResponse = {
        hasInquiry: true,
        inquiry: {
          id: recentInquiry.id,
          question_text: questionText,
          question_type: recentInquiry.question_type,
          priority: recentInquiry.priority,
          data_gaps_addressed: recentInquiry.data_gaps_addressed || [],
          options: derivedOptions || [
            { label: language === 'en' ? 'Yes' : '是', value: 'yes' },
            { label: language === 'en' ? 'No' : '否', value: 'no' },
          ],
        },
      };

      return toSerializable({ success: true, data: response });
    }

    const twentyMinutesAgo = new Date();
    twentyMinutesAgo.setMinutes(twentyMinutesAgo.getMinutes() - 20);

    const { data: recentResponse } = await supabase
      .from('inquiry_history')
      .select('responded_at')
      .eq('user_id', user.id)
      .not('user_response', 'is', null)
      .gte('responded_at', twentyMinutesAgo.toISOString())
      .order('responded_at', { ascending: false })
      .limit(1)
      .single();

    if (recentResponse) {
      return toSerializable({ success: true, data: { hasInquiry: false } });
    }

    const today = new Date().toISOString().split('T')[0];
    const { data: todayResponses } = await supabase
      .from('inquiry_history')
      .select('data_gaps_addressed')
      .eq('user_id', user.id)
      .not('user_response', 'is', null)
      .gte('responded_at', `${today}T00:00:00Z`);

    const answeredGapsToday = new Set<string>();
    if (todayResponses) {
      todayResponses.forEach(r => {
        if (r.data_gaps_addressed) {
          r.data_gaps_addressed.forEach((gap: string) => answeredGapsToday.add(gap));
        }
      });
    }

    const { data: recentCalibrations } = await supabase
      .from('daily_calibrations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(7);

    const { data: phaseGoals } = await supabase
      .from('phase_goals')
      .select('*')
      .eq('user_id', user.id);

    const recentData: Record<string, { value: string; timestamp: string }> = {};
    if (recentCalibrations && recentCalibrations.length > 0) {
      const latest = recentCalibrations[0];
      if (latest.sleep_hours) {
        recentData.sleep_hours = {
          value: String(latest.sleep_hours),
          timestamp: latest.created_at,
        };
      }
      if (latest.stress_level) {
        recentData.stress_level = {
          value: latest.stress_level,
          timestamp: latest.created_at,
        };
      }
    }

    const allGaps = identifyDataGaps(recentData);
    const gaps = allGaps.filter(gap => !answeredGapsToday.has(gap.field));

    if (gaps.length === 0) {
      return toSerializable({ success: true, data: { hasInquiry: false } });
    }

    const inquiry = generateInquiryQuestion(gaps, phaseGoals || [], language);
    if (!inquiry) {
      return toSerializable({ success: true, data: { hasInquiry: false } });
    }

    const { data: storedInquiry, error: storeError } = await supabase
      .from('inquiry_history')
      .insert({
        user_id: user.id,
        question_text: inquiry.question_text,
        question_type: inquiry.question_type,
        priority: inquiry.priority,
        data_gaps_addressed: inquiry.data_gaps_addressed,
        delivery_method: 'in_app',
      })
      .select()
      .single();

    let feedContent: CuratedContent | undefined;
    const { data: curatedFeed } = await supabase
      .from('curated_feed_queue')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_pushed', false)
      .gte('relevance_score', 0.6)
      .order('relevance_score', { ascending: false })
      .limit(5);

    if (curatedFeed && curatedFeed.length > 0) {
      feedContent = getTopRecommendation(curatedFeed as CuratedContent[]) || undefined;
    }

    const response: InquiryPendingResponse = {
      hasInquiry: true,
      inquiry: {
        ...inquiry,
        id: storedInquiry?.id || inquiry.id,
        feedContent,
      },
    };

    if (storeError) {
      console.error('[Inquiry Action] store inquiry warning:', storeError.message);
    }

    return toSerializable({ success: true, data: response });
  } catch (error) {
    console.error('[Inquiry Action] getPendingInquiry error:', error);
    return { success: false, error: 'Failed to load inquiry' };
  }
}
