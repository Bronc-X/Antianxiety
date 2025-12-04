import { 
  RED_FLAG_PATTERNS, 
  RedFlagPattern, 
  getEmergencyNumber,
  EmergencyStep 
} from '@/types/assessment';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export interface RedFlagCheckResult {
  triggered: boolean;
  pattern?: RedFlagPattern;
  matchedTerms?: string[];
}

/**
 * 检查症状是否匹配红旗模式
 */
export function checkRedFlags(
  symptoms: string[],
  chiefComplaint: string,
  history: Array<{ question_text: string; value: string | string[] | number | boolean }>
): RedFlagCheckResult {
  // 收集所有文本用于匹配
  const allText = [
    chiefComplaint.toLowerCase(),
    ...symptoms.map(s => s.toLowerCase()),
    ...history.flatMap(h => {
      const values = Array.isArray(h.value) ? h.value : [String(h.value)];
      return [...values.map(v => v.toLowerCase()), h.question_text.toLowerCase()];
    })
  ].join(' ');

  for (const pattern of RED_FLAG_PATTERNS) {
    const matchedTerms: string[] = [];
    
    for (const term of pattern.patterns) {
      if (allText.includes(term.toLowerCase())) {
        matchedTerms.push(term);
      }
    }

    if (matchedTerms.length >= pattern.min_matches) {
      return {
        triggered: true,
        pattern,
        matchedTerms
      };
    }
  }

  return { triggered: false };
}

/**
 * 生成紧急响应
 */
export function generateEmergencyResponse(
  sessionId: string,
  pattern: RedFlagPattern,
  matchedTerms: string[],
  language: 'zh' | 'en',
  countryCode: string
): EmergencyStep {
  const emergency = getEmergencyNumber(countryCode);
  
  const instructions = language === 'zh' 
    ? [
        '保持冷静，不要惊慌',
        `立即拨打 ${emergency.number} (${emergency.name})`,
        '如果可能，让身边的人陪伴您',
        '不要自行驾车前往医院',
        '准备好告诉急救人员您的症状'
      ]
    : [
        'Stay calm, do not panic',
        `Call ${emergency.number} (${emergency.name}) immediately`,
        'If possible, have someone stay with you',
        'Do not drive yourself to the hospital',
        'Be ready to describe your symptoms to emergency responders'
      ];

  return {
    step_type: 'emergency',
    session_id: sessionId,
    phase: 'emergency',
    emergency: {
      title: language === 'zh' ? '⚠️ 紧急警告' : '⚠️ Emergency Warning',
      message: language === 'zh' ? pattern.message_zh : pattern.message_en,
      detected_pattern: pattern.id,
      emergency_number: emergency.number,
      emergency_name: emergency.name,
      instructions
    }
  };
}

/**
 * 记录红旗事件到审计日志
 */
export async function logRedFlagEvent(
  sessionId: string,
  userId: string,
  pattern: RedFlagPattern,
  matchedTerms: string[],
  symptomData: {
    chief_complaint: string;
    symptoms: string[];
    history: any[];
  }
): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    
    await supabase.from('assessment_red_flag_logs').insert({
      session_id: sessionId,
      user_id: userId,
      detected_pattern: pattern.id,
      symptom_data: {
        matched_terms: matchedTerms,
        ...symptomData
      }
    });

    // 更新会话状态
    await supabase
      .from('assessment_sessions')
      .update({ 
        status: 'emergency_triggered',
        phase: 'emergency'
      })
      .eq('id', sessionId);

  } catch (error) {
    console.error('Failed to log red flag event:', error);
    // 不抛出错误，确保紧急响应仍然返回给用户
  }
}

/**
 * 记录用户关闭紧急警告
 */
export async function logEmergencyDismissal(
  sessionId: string
): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    
    await supabase
      .from('assessment_red_flag_logs')
      .update({ 
        was_dismissed: true,
        dismissed_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

  } catch (error) {
    console.error('Failed to log emergency dismissal:', error);
  }
}
