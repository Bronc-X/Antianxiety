'use server';

/**
 * Bayesian Server Actions (The Brain)
 *
 * Wraps Bayesian nudge logic previously handled in /api/bayesian/nudge.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { toSerializable } from '@/lib/dto-utils';
import { createActionEvidence, type Evidence } from '@/lib/bayesian-evidence';
import type { ActionResult } from '@/types/architecture';
import { NextRequest } from 'next/server';
import { GET as getBayesianHistoryRoute } from '@/app/api/bayesian/history/route';

export interface BayesianNudgeInput {
  action_type: string;
  duration_minutes?: number;
  belief_id?: string;
}

export interface BayesianNudgeResult {
  correction: number;
  new_posterior: number;
  message: string;
}

export type BayesianHistoryRange = '7d' | '30d' | '90d' | 'all';

type BayesianHistoryPayload = {
  error?: string;
} & Record<string, unknown>;

const BASE_CORRECTIONS: Record<string, number> = {
  breathing_exercise: -5,
  meditation: -8,
  exercise: -10,
  sleep_improvement: -7,
  hydration: -3,
  journaling: -4,
  stretching: -3,
  default: -2,
};

function calculateNudgeCorrection(actionType: string, duration?: number): number {
  let correction = BASE_CORRECTIONS[actionType] || BASE_CORRECTIONS.default;

  if (duration && duration > 10) {
    correction = Math.min(correction * 1.5, -20);
  }

  return Math.max(-20, Math.min(-1, Math.round(correction)));
}

function generateNudgeMessage(actionType: string, correction: number): string {
  const actionNames: Record<string, string> = {
    breathing_exercise: '呼吸练习',
    meditation: '冥想',
    exercise: '运动',
    sleep_improvement: '睡眠改善',
    hydration: '补水',
    journaling: '日记',
    stretching: '拉伸',
    default: '健康行为',
  };

  const actionName = actionNames[actionType] || actionNames.default;
  return `${actionName}完成。皮质醇风险概率修正：${correction}%`;
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function triggerBayesianNudge(
  input: BayesianNudgeInput
): Promise<ActionResult<BayesianNudgeResult>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: '请先登录' };
    }

    if (!input.action_type) {
      return { success: false, error: '请指定行为类型' };
    }

    const correction = calculateNudgeCorrection(input.action_type, input.duration_minutes);

    let beliefQuery = supabase
      .from('bayesian_beliefs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (input.belief_id) {
      beliefQuery = supabase
        .from('bayesian_beliefs')
        .select('*')
        .eq('id', input.belief_id)
        .eq('user_id', user.id);
    }

    const { data: beliefs, error: fetchError } = await beliefQuery;

    if (fetchError || !beliefs || beliefs.length === 0) {
      const defaultPosterior = 50 + correction;
      return toSerializable({
        success: true,
        data: {
          correction,
          new_posterior: Math.max(0, Math.min(100, defaultPosterior)),
          message: generateNudgeMessage(input.action_type, correction),
        },
      });
    }

    const belief = beliefs[0];
    const currentPosterior = belief.posterior_score;
    const newPosterior = Math.max(0, Math.min(100, currentPosterior + correction));

    const actionEvidence = createActionEvidence(
      input.action_type,
      generateNudgeMessage(input.action_type, correction),
      { duration_minutes: input.duration_minutes, correction }
    );

    const currentStack: Evidence[] = belief.evidence_stack || [];
    const updatedStack = [...currentStack, actionEvidence];

    const { error: updateError } = await supabase
      .from('bayesian_beliefs')
      .update({
        posterior_score: newPosterior,
        evidence_stack: updatedStack,
        updated_at: new Date().toISOString(),
      })
      .eq('id', belief.id);

    if (updateError) {
      console.error('[Bayesian Action] update belief error:', updateError);
    }

    return toSerializable({
      success: true,
      data: {
        correction,
        new_posterior: newPosterior,
        message: generateNudgeMessage(input.action_type, correction),
      },
    });
  } catch (error) {
    console.error('[Bayesian Action] triggerBayesianNudge error:', error);
    return { success: false, error: '微调正在进行中，请稍候...' };
  }
}

export async function getBayesianHistory(
  timeRange: BayesianHistoryRange = '30d',
  context?: string | null
): Promise<ActionResult<unknown>> {
  try {
    const url = new URL('http://bayesian.local/api/bayesian/history');
    url.searchParams.set('timeRange', timeRange);
    if (context) {
      url.searchParams.set('context', context);
    }

    const request = new NextRequest(url.toString());
    const response = await getBayesianHistoryRoute(request);
    const data = await parseJsonResponse(response);
    const payload = typeof data === 'object' && data !== null ? (data as BayesianHistoryPayload) : null;

    if (!response.ok) {
      return { success: false, error: payload?.error || 'Failed to load history' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[Bayesian Action] getBayesianHistory error:', error);
    return { success: false, error: 'Failed to load history' };
  }
}
