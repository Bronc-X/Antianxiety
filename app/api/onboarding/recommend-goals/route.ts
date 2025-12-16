/**
 * POST /api/onboarding/recommend-goals
 * 
 * Generates 1-2 prioritized Phase Goals based on onboarding answers.
 * Returns goals with scientific rationale and citations.
 * 
 * **Validates: Requirements 1.6, 2.1, 2.2**
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { inferMetabolicProfile, inferPhaseGoals } from '@/lib/adaptive-onboarding';
import type { PhaseGoal, MetabolicProfile } from '@/types/adaptive-interaction';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { answers } = body as { answers: Record<string, string> };
    
    if (!answers || Object.keys(answers).length === 0) {
      return NextResponse.json({ error: 'No answers provided' }, { status: 400 });
    }
    
    // Infer metabolic profile from answers
    const metabolicProfile: MetabolicProfile = inferMetabolicProfile(answers);
    
    // Generate phase goals
    const goals: PhaseGoal[] = inferPhaseGoals(metabolicProfile);
    
    // Set user_id on goals
    const goalsWithUserId = goals.map(goal => ({
      ...goal,
      user_id: user.id,
    }));
    
    // Save goals to database
    const { error: deleteError } = await supabase
      .from('phase_goals')
      .delete()
      .eq('user_id', user.id);
    
    if (deleteError) {
      console.error('Error deleting old goals:', deleteError);
    }
    
    const { error: insertError } = await supabase
      .from('phase_goals')
      .insert(goalsWithUserId.map(g => ({
        id: g.id,
        user_id: g.user_id,
        goal_type: g.goal_type,
        priority: g.priority,
        title: g.title,
        rationale: g.rationale,
        citations: g.citations,
        is_ai_recommended: g.is_ai_recommended,
        user_modified: g.user_modified,
      })));
    
    if (insertError) {
      console.error('Error inserting goals:', insertError);
      // Continue anyway, return the generated goals
    }
    
    // Save onboarding answers
    const answerRecords = Object.entries(answers).map(([questionId, answerValue], index) => ({
      user_id: user.id,
      question_id: questionId,
      question_type: index < 3 ? 'template' : 'decision_tree',
      question_text: questionId, // Simplified, could be enhanced
      answer_value: answerValue,
      sequence_order: index,
    }));
    
    await supabase
      .from('onboarding_answers')
      .delete()
      .eq('user_id', user.id);
    
    await supabase
      .from('onboarding_answers')
      .insert(answerRecords);
    
    // Update user profile with metabolic profile
    await supabase
      .from('profiles')
      .update({
        primary_goal: goalsWithUserId[0]?.goal_type || 'energy',
        ai_persona_context: `代谢档案: ${JSON.stringify(metabolicProfile)}`,
      })
      .eq('id', user.id);
    
    return NextResponse.json({
      goals: goalsWithUserId,
      metabolicProfile,
    });
    
  } catch (error) {
    console.error('Error in recommend-goals:', error);
    return NextResponse.json(
      { error: 'Failed to generate goals' },
      { status: 500 }
    );
  }
}
