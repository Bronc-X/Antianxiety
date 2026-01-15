import { createServerSupabaseClient } from '@/lib/supabase-server';
import { AssessmentPhase, QuestionStep } from '@/types/assessment';
import { getSuggestedSymptoms } from './symptoms';

// 基线问题 ID 列表
const REQUIRED_BASELINE_QUESTIONS = [
  'baseline_sex',
  'baseline_age',
  'baseline_smoking'
];

/**
 * 检查基线阶段是否完成
 */
export function isBaselineComplete(history: Array<{ question_id: string }>): boolean {
  const answeredIds = history.map(h => h.question_id);
  return REQUIRED_BASELINE_QUESTIONS.every(id => answeredIds.includes(id));
}

/**
 * 处理阶段转换
 */
export async function handlePhaseTransition(
  sessionId: string,
  currentPhase: AssessmentPhase,
  history: Array<{ question_id: string; value: unknown }>,
  chiefComplaint: string | null,
  symptoms: string[]
): Promise<{ newPhase: AssessmentPhase; shouldTransition: boolean }> {
  
  switch (currentPhase) {
    case 'welcome':
      return { newPhase: 'baseline', shouldTransition: true };
    
    case 'baseline':
      if (isBaselineComplete(history)) {
        return { newPhase: 'chief_complaint', shouldTransition: true };
      }
      return { newPhase: 'baseline', shouldTransition: false };
    
    case 'chief_complaint':
      if (chiefComplaint && symptoms.length > 0) {
        return { newPhase: 'differential', shouldTransition: true };
      }
      return { newPhase: 'chief_complaint', shouldTransition: false };
    
    case 'differential':
      // 由 AI 决定何时转换到 report
      return { newPhase: 'differential', shouldTransition: false };
    
    default:
      return { newPhase: currentPhase, shouldTransition: false };
  }
}

/**
 * 更新会话阶段
 */
export async function updateSessionPhase(
  sessionId: string,
  newPhase: AssessmentPhase
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  
  await supabase
    .from('assessment_sessions')
    .update({ 
      phase: newPhase,
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId);
}

/**
 * 生成主诉阶段的问题
 */
export function generateChiefComplaintQuestion(
  sessionId: string,
  language: 'zh' | 'en'
): QuestionStep {
  return {
    step_type: 'question',
    session_id: sessionId,
    phase: 'chief_complaint',
    question: {
      id: 'chief_complaint',
      text: language === 'zh' ? '您今天哪里不舒服？' : 'What brings you here today?',
      description: language === 'zh' 
        ? '请描述您的主要症状，例如：头痛、胸闷、膝盖痛...' 
        : 'Please describe your main symptom, e.g., headache, chest tightness, knee pain...',
      type: 'symptom_search',
      progress: 35,
      category: 'associated'
    }
  };
}

/**
 * 生成症状确认问题
 */
export function generateSymptomConfirmationQuestion(
  sessionId: string,
  chiefComplaint: string,
  language: 'zh' | 'en'
): QuestionStep {
  const suggestions = getSuggestedSymptoms(chiefComplaint, language);
  
  return {
    step_type: 'question',
    session_id: sessionId,
    phase: 'chief_complaint',
    question: {
      id: 'symptom_confirmation',
      text: language === 'zh' ? '确认您的症状' : 'Confirm your symptoms',
      description: language === 'zh' 
        ? '请选择您正在经历的症状，或添加新的症状。' 
        : 'Please select the symptoms you are experiencing, or add new ones.',
      type: 'multiple_choice',
      options: suggestions.map(s => ({
        value: s.id,
        label: s.name,
        description: s.description
      })),
      progress: 40,
      category: 'associated'
    }
  };
}

/**
 * 更新会话的主诉和症状
 */
export async function updateChiefComplaintAndSymptoms(
  sessionId: string,
  chiefComplaint: string,
  symptoms: string[]
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  
  await supabase
    .from('assessment_sessions')
    .update({ 
      chief_complaint: chiefComplaint,
      symptoms,
      phase: 'differential',
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId);
}
