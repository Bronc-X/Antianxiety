/**
 * Bayesian Ritual API Endpoint
 * 
 * 主动式沉浸重构 (Active Ritual) 的后端处理
 * 处理用户焦虑输入，收集证据，计算贝叶斯后验
 * 
 * POST /api/bayesian/ritual
 * 
 * @module app/api/bayesian/ritual/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  Evidence,
  performBayesianCalculation,
  createBioEvidence,
  serializeEvidenceStack
} from '@/lib/bayesian-evidence';
import { searchByBeliefContext, BeliefContext } from '@/lib/services/bayesian-scholar';

// ============================================
// Types
// ============================================

interface RitualRequest {
  belief_context: BeliefContext;
  prior_score: number;
  custom_query?: string;
}

interface RitualResponse {
  success: boolean;
  data?: {
    id: string;
    prior_score: number;
    posterior_score: number;
    evidence_stack: Evidence[];
    exaggeration_factor: number;
    message: string;
  };
  error?: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * 从用户指标中收集生理证据
 */
async function collectBioEvidence(userId: string): Promise<Evidence[]> {
  const supabase = await createClient();
  const evidences: Evidence[] = [];

  try {
    // 获取最近的用户指标
    const { data: metrics } = await supabase
      .from('user_metrics')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (metrics) {
      // HRV 证据
      if (metrics.hrv && metrics.hrv > 0) {
        const hrvQuality = Math.min(1, metrics.hrv / 100); // 归一化到 0-1
        evidences.push(createBioEvidence(
          `HRV=${metrics.hrv}ms`,
          hrvQuality,
          { hrv: metrics.hrv, unit: 'ms' }
        ));
      }

      // 睡眠质量证据
      if (metrics.sleep_quality && metrics.sleep_quality > 0) {
        const sleepQuality = metrics.sleep_quality / 10; // 假设 0-10 评分
        evidences.push(createBioEvidence(
          `睡眠质量=${metrics.sleep_quality}/10`,
          sleepQuality,
          { sleep_quality: metrics.sleep_quality }
        ));
      }

      // 能量水平证据
      if (metrics.energy_level && metrics.energy_level > 0) {
        const energyQuality = metrics.energy_level / 10;
        evidences.push(createBioEvidence(
          `能量水平=${metrics.energy_level}/10`,
          energyQuality,
          { energy_level: metrics.energy_level }
        ));
      }
    }
  } catch (error) {
    console.error('❌ Failed to collect bio evidence:', error);
  }

  // 如果没有生理数据，添加默认证据
  if (evidences.length === 0) {
    evidences.push(createBioEvidence(
      '基础生理状态正常',
      0.5,
      { default: true }
    ));
  }

  return evidences;
}

/**
 * 生成安慰性消息
 */
function generateCalmMessage(prior: number, posterior: number, exaggerationFactor: number): string {
  if (exaggerationFactor >= 3) {
    return `数学显示，你的恐惧被夸大了 ${exaggerationFactor} 倍。深呼吸，真相站在你这边 🌱`;
  } else if (exaggerationFactor >= 1.5) {
    return `你的担忧比实际风险高出 ${exaggerationFactor} 倍。科学证据正在帮助你校准认知 ✨`;
  } else if (posterior < prior) {
    return `证据表明实际风险比你感受到的要低。你的身体比你想象的更强大 💪`;
  } else {
    return `你的感知与现实相当接近。保持这份觉察，继续前行 🌿`;
  }
}

// ============================================
// API Handler
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse<RitualResponse>> {
  try {
    const supabase = await createClient();
    
    // 验证用户身份
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '请先登录以开始认知校准' },
        { status: 401 }
      );
    }

    // 解析请求体
    const body: RitualRequest = await request.json();
    const { belief_context, prior_score, custom_query } = body;

    // 验证输入
    if (!belief_context) {
      return NextResponse.json(
        { success: false, error: '请选择一个焦虑场景' },
        { status: 400 }
      );
    }

    if (prior_score === undefined || prior_score < 0 || prior_score > 100) {
      return NextResponse.json(
        { success: false, error: '恐惧值必须在 0-100 之间' },
        { status: 400 }
      );
    }

    // 收集证据
    const evidenceStack: Evidence[] = [];

    // 1. 收集生理证据
    const bioEvidences = await collectBioEvidence(user.id);
    evidenceStack.push(...bioEvidences);

    // 2. 收集科学证据
    const scholarResult = await searchByBeliefContext(
      belief_context,
      custom_query
    );
    evidenceStack.push(...scholarResult.evidence);

    // 3. 执行贝叶斯计算
    const result = performBayesianCalculation(prior_score, evidenceStack);

    // 4. 存储到数据库
    const { data: beliefRecord, error: insertError } = await supabase
      .from('bayesian_beliefs')
      .insert({
        user_id: user.id,
        belief_context,
        prior_score,
        posterior_score: result.posterior,
        evidence_stack: result.evidenceStack,
        calculation_details: {
          exaggeration_factor: result.exaggerationFactor,
          calculated_at: result.calculatedAt.toISOString(),
          science_from_cache: scholarResult.fromCache
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to store belief record:', insertError);
      // 即使存储失败，也返回计算结果
    }

    // 5. 生成响应消息
    const message = generateCalmMessage(
      prior_score,
      result.posterior,
      result.exaggerationFactor
    );

    return NextResponse.json({
      success: true,
      data: {
        id: beliefRecord?.id || 'temp-' + Date.now(),
        prior_score,
        posterior_score: result.posterior,
        evidence_stack: result.evidenceStack,
        exaggeration_factor: result.exaggerationFactor,
        message
      }
    });

  } catch (error) {
    console.error('❌ Ritual API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '正在重新校准您的认知天平，请稍候...' 
      },
      { status: 500 }
    );
  }
}
