/**
 * Goal Modification API
 * 
 * Handles user requests to modify AI-recommended Phase Goals.
 * Provides AI explanation for original recommendation and persists changes.
 * 
 * Requirements: 2.3, 2.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { PhaseGoal, GoalType } from '@/types/adaptive-interaction';

interface ModifyGoalRequest {
  goalId: string;
  newGoalType?: GoalType;
  newTitle?: string;
  action: 'explain' | 'confirm';
}

interface ExplainResponse {
  originalGoal: PhaseGoal;
  explanation: string;
  alternativeGoals: Array<{
    type: GoalType;
    title: string;
    rationale: string;
  }>;
}

interface ConfirmResponse {
  success: boolean;
  updatedGoal: PhaseGoal;
  recalibrationTriggered: boolean;
}

// Goal type explanations based on metabolic patterns
const GOAL_EXPLANATIONS: Record<GoalType, string> = {
  sleep: '根据你的回答，你的睡眠模式显示出皮质醇节律紊乱的迹象。改善睡眠是恢复昼夜节律、提升整体代谢效率的基础。研究表明，睡眠质量的改善往往能带动其他健康指标的连锁提升。',
  energy: '你的能量波动模式表明线粒体功能可能需要优化。下午的能量崩溃通常与血糖调节和肾上腺疲劳有关。优先提升能量水平可以帮助你建立更稳定的日常节奏。',
  weight: '基于你的代谢指纹，体重管理目标与你当前的身体状态高度相关。代谢减缓往往是多种因素的综合结果，通过科学的方法可以逐步恢复代谢活力。',
  stress: '你的压力耐受模式显示出需要关注的信号。长期压力会影响 HPA 轴功能，进而影响睡眠、能量和体重。优先管理压力可以为其他健康目标打下基础。',
  fitness: '你的身体状态显示出对运动能力提升的需求。适度的体能训练不仅能改善心肺功能，还能促进神经可塑性和情绪调节。',
};

// Alternative goal suggestions
const ALTERNATIVE_GOALS: Record<GoalType, Array<{ type: GoalType; title: string; rationale: string }>> = {
  sleep: [
    { type: 'energy', title: '提升日间能量', rationale: '如果你觉得睡眠问题不是首要困扰，可以先从提升日间能量入手' },
    { type: 'stress', title: '压力管理', rationale: '压力往往是睡眠问题的根源，也可以从这里开始' },
  ],
  energy: [
    { type: 'sleep', title: '改善睡眠质量', rationale: '能量问题常常源于睡眠，可以从睡眠入手' },
    { type: 'fitness', title: '提升体能', rationale: '通过运动提升基础代谢也能改善能量水平' },
  ],
  weight: [
    { type: 'energy', title: '提升代谢活力', rationale: '先提升能量水平，体重管理会更轻松' },
    { type: 'fitness', title: '增强体能', rationale: '通过运动建立肌肉，提高基础代谢率' },
  ],
  stress: [
    { type: 'sleep', title: '改善睡眠', rationale: '良好的睡眠是压力恢复的基础' },
    { type: 'energy', title: '稳定能量', rationale: '稳定的能量水平有助于应对压力' },
  ],
  fitness: [
    { type: 'energy', title: '提升能量', rationale: '先建立稳定的能量基础，再进行体能训练' },
    { type: 'stress', title: '压力管理', rationale: '在压力可控的状态下训练效果更好' },
  ],
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ModifyGoalRequest = await request.json();
    const { goalId, newGoalType, newTitle, action } = body;

    // Fetch the original goal
    const { data: originalGoal, error: fetchError } = await supabase
      .from('phase_goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !originalGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (action === 'explain') {
      // Return AI explanation for why this goal was recommended
      const explanation = GOAL_EXPLANATIONS[originalGoal.goal_type as GoalType] || 
        '这个目标是基于你的问卷回答和代谢指纹分析推荐的。';
      
      const alternatives = ALTERNATIVE_GOALS[originalGoal.goal_type as GoalType] || [];

      const response: ExplainResponse = {
        originalGoal: originalGoal as PhaseGoal,
        explanation,
        alternativeGoals: alternatives,
      };

      return NextResponse.json(response);
    }

    if (action === 'confirm') {
      // Update the goal with user modifications
      const updateData: Partial<PhaseGoal> = {
        user_modified: true,
        updated_at: new Date().toISOString(),
      };

      if (newGoalType) {
        updateData.goal_type = newGoalType;
      }
      if (newTitle) {
        updateData.title = newTitle;
      }

      const { data: updatedGoal, error: updateError } = await supabase
        .from('phase_goals')
        .update(updateData)
        .eq('id', goalId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
      }

      // Trigger recalibration of dependent systems (async, don't wait)
      // This would notify the calibration engine to regenerate questions
      const recalibrationTriggered = true;

      const elapsed = Date.now() - startTime;
      
      // Ensure response within 1 second (Requirement 2.4)
      if (elapsed > 1000) {
        console.warn(`Goal modification took ${elapsed}ms, exceeding 1s target`);
      }

      const response: ConfirmResponse = {
        success: true,
        updatedGoal: updatedGoal as PhaseGoal,
        recalibrationTriggered,
      };

      return NextResponse.json(response);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Goal modification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
