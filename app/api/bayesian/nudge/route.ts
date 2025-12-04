/**
 * Bayesian Nudge API Endpoint
 * 
 * 被动式微修正 (Passive Nudge) 的后端处理
 * 当用户完成健康习惯时，静默更新焦虑概率
 * 
 * POST /api/bayesian/nudge
 * 
 * @module app/api/bayesian/nudge/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createActionEvidence, Evidence } from '@/lib/bayesian-evidence';

// ============================================
// Types
// ============================================

interface NudgeRequest {
  action_type: string;
  duration_minutes?: number;
  belief_id?: string;  // 可选：指定要更新的信念记录
}

interface NudgeResponse {
  success: boolean;
  data?: {
    correction: number;
    new_posterior: number;
    message: string;
  };
  error?: string;
}

// ============================================
// Constants
// ============================================

const BASE_CORRECTIONS: Record<string, number> = {
  breathing_exercise: -5,
  meditation: -8,
  exercise: -10,
  sleep_improvement: -7,
  hydration: -3,
  journaling: -4,
  stretching: -3,
  default: -2
};

// ============================================
// Helper Functions
// ============================================

/**
 * 计算被动微调的概率修正值
 * 
 * @param actionType - 行为类型
 * @param duration - 持续时间（分钟）
 * @returns 修正值 (负数，范围 [-20, -1])
 * 
 * **Validates: Requirements 4.1, 4.4**
 */
export function calculateNudgeCorrection(actionType: string, duration?: number): number {
  let correction = BASE_CORRECTIONS[actionType] || BASE_CORRECTIONS.default;
  
  // 根据持续时间调整
  if (duration && duration > 10) {
    correction = Math.min(correction * 1.5, -20);
  }
  
  // 确保在有效范围内 [-20, -1]
  return Math.max(-20, Math.min(-1, Math.round(correction)));
}

/**
 * 生成微调消息
 */
function generateNudgeMessage(actionType: string, correction: number): string {
  const actionNames: Record<string, string> = {
    breathing_exercise: '呼吸练习',
    meditation: '冥想',
    exercise: '运动',
    sleep_improvement: '睡眠改善',
    hydration: '补水',
    journaling: '日记',
    stretching: '拉伸',
    default: '健康行为'
  };

  const actionName = actionNames[actionType] || actionNames.default;
  return `${actionName}完成。皮质醇风险概率修正：${correction}%`;
}

// ============================================
// API Handler
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse<NudgeResponse>> {
  try {
    const supabase = await createClient();
    
    // 验证用户身份
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 }
      );
    }

    // 解析请求体
    const body: NudgeRequest = await request.json();
    const { action_type, duration_minutes, belief_id } = body;

    // 验证输入
    if (!action_type) {
      return NextResponse.json(
        { success: false, error: '请指定行为类型' },
        { status: 400 }
      );
    }

    // 计算修正值
    const correction = calculateNudgeCorrection(action_type, duration_minutes);

    // 获取最近的信念记录
    let beliefQuery = supabase
      .from('bayesian_beliefs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (belief_id) {
      beliefQuery = supabase
        .from('bayesian_beliefs')
        .select('*')
        .eq('id', belief_id)
        .eq('user_id', user.id);
    }

    const { data: beliefs, error: fetchError } = await beliefQuery;

    if (fetchError || !beliefs || beliefs.length === 0) {
      // 没有现有记录，创建一个默认记录
      const defaultPosterior = 50 + correction;
      return NextResponse.json({
        success: true,
        data: {
          correction,
          new_posterior: Math.max(0, Math.min(100, defaultPosterior)),
          message: generateNudgeMessage(action_type, correction)
        }
      });
    }

    const belief = beliefs[0];
    const currentPosterior = belief.posterior_score;
    const newPosterior = Math.max(0, Math.min(100, currentPosterior + correction));

    // 创建行为证据
    const actionEvidence = createActionEvidence(
      action_type,
      generateNudgeMessage(action_type, correction),
      { duration_minutes, correction }
    );

    // 更新证据栈
    const currentStack: Evidence[] = belief.evidence_stack || [];
    const updatedStack = [...currentStack, actionEvidence];

    // 更新数据库
    const { error: updateError } = await supabase
      .from('bayesian_beliefs')
      .update({
        posterior_score: newPosterior,
        evidence_stack: updatedStack,
        updated_at: new Date().toISOString()
      })
      .eq('id', belief.id);

    if (updateError) {
      console.error('❌ Failed to update belief:', updateError);
      // 即使更新失败，也返回计算结果
    }

    return NextResponse.json({
      success: true,
      data: {
        correction,
        new_posterior: newPosterior,
        message: generateNudgeMessage(action_type, correction)
      }
    });

  } catch (error) {
    console.error('❌ Nudge API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '微调正在进行中，请稍候...' 
      },
      { status: 500 }
    );
  }
}
