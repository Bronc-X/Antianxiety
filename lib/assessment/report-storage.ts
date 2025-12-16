import { createServerSupabaseClient } from '@/lib/supabase-server';
import { Condition, UrgencyLevel, AnswerRecord } from '@/types/assessment';
import { generateNextSteps, generateDisclaimer } from './report-generator';

export interface ReportData {
  conditions: Condition[];
  urgency: UrgencyLevel;
  next_steps: { action: string; icon: string }[];
}

/**
 * 存储报告到数据库并更新会话状态
 */
export async function storeReport(
  sessionId: string,
  userId: string,
  reportData: ReportData,
  language: 'zh' | 'en'
): Promise<{ success: boolean; reportId?: string; error?: string }> {
  const supabase = await createServerSupabaseClient();

  try {
    // 1. 存储报告到 assessment_reports 表
    const { data: report, error: reportError } = await supabase
      .from('assessment_reports')
      .insert({
        session_id: sessionId,
        user_id: userId,
        conditions: reportData.conditions,
        urgency: reportData.urgency,
        next_steps: reportData.next_steps,
      })
      .select('id')
      .single();

    if (reportError) {
      console.error('Failed to store report:', reportError);
      return { success: false, error: reportError.message };
    }

    // 2. 更新会话状态为完成
    const { error: sessionError } = await supabase
      .from('assessment_sessions')
      .update({
        phase: 'report',
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (sessionError) {
      console.error('Failed to update session:', sessionError);
      // 报告已存储，不回滚
    }

    return { success: true, reportId: report.id };
  } catch (error: any) {
    console.error('Store report error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 将评估结果存储到 The Brain 记忆系统
 */
export async function storeAssessmentToMemory(
  userId: string,
  sessionId: string,
  reportData: ReportData,
  chiefComplaint: string,
  symptoms: string[],
  language: 'zh' | 'en'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();

  try {
    // 构建记忆内容
    const conditionNames = reportData.conditions.map(c => c.name).join(', ');
    const topCondition = reportData.conditions[0];
    
    const contentText = language === 'zh'
      ? `健康评估结果：主诉「${chiefComplaint}」，症状包括${symptoms.join('、')}。可能的情况：${conditionNames}。最可能是${topCondition?.name}（${topCondition?.probability}%概率）。紧急程度：${reportData.urgency}。`
      : `Health assessment result: Chief complaint "${chiefComplaint}", symptoms include ${symptoms.join(', ')}. Possible conditions: ${conditionNames}. Most likely ${topCondition?.name} (${topCondition?.probability}% probability). Urgency: ${reportData.urgency}.`;

    // 存储到 ai_memory 表
    const { error: memoryError } = await supabase
      .from('ai_memory')
      .insert({
        user_id: userId,
        content_text: contentText,
        metadata: {
          type: 'assessment_result',
          session_id: sessionId,
          date: new Date().toISOString(),
          chief_complaint: chiefComplaint,
          symptoms,
          conditions: reportData.conditions.map(c => ({
            name: c.name,
            probability: c.probability,
          })),
          urgency: reportData.urgency,
        },
      });

    if (memoryError) {
      console.error('Failed to store to memory:', memoryError);
      return { success: false, error: memoryError.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Store to memory error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 获取用户历史评估记录
 */
export async function getHistoricalAssessments(
  userId: string,
  limit: number = 5
): Promise<Array<{
  date: string;
  chiefComplaint: string;
  topCondition: string;
  urgency: string;
}>> {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: memories, error } = await supabase
      .from('ai_memory')
      .select('metadata, created_at')
      .eq('user_id', userId)
      .eq('metadata->>type', 'assessment_result')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !memories) {
      return [];
    }

    return memories.map(m => ({
      date: m.created_at,
      chiefComplaint: (m.metadata as any)?.chief_complaint || '',
      topCondition: (m.metadata as any)?.conditions?.[0]?.name || '',
      urgency: (m.metadata as any)?.urgency || '',
    }));
  } catch (error) {
    console.error('Get historical assessments error:', error);
    return [];
  }
}

/**
 * 查找相似症状的历史评估
 */
export async function findSimilarAssessments(
  userId: string,
  symptoms: string[],
  limit: number = 3
): Promise<Array<{
  date: string;
  chiefComplaint: string;
  matchedSymptoms: string[];
  topCondition: string;
}>> {
  const supabase = await createServerSupabaseClient();

  try {
    // 简单的关键词匹配（未来可以用向量相似度搜索）
    const { data: memories, error } = await supabase
      .from('ai_memory')
      .select('metadata, created_at')
      .eq('user_id', userId)
      .eq('metadata->>type', 'assessment_result')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !memories) {
      return [];
    }

    // 过滤出有相似症状的记录
    const similar = memories
      .map(m => {
        const metadata = m.metadata as any;
        const historicalSymptoms: string[] = metadata?.symptoms || [];
        const matched = symptoms.filter(s => 
          historicalSymptoms.some(hs => 
            hs.toLowerCase().includes(s.toLowerCase()) || 
            s.toLowerCase().includes(hs.toLowerCase())
          )
        );
        return {
          date: m.created_at,
          chiefComplaint: metadata?.chief_complaint || '',
          matchedSymptoms: matched,
          topCondition: metadata?.conditions?.[0]?.name || '',
          matchCount: matched.length,
        };
      })
      .filter(r => r.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, limit);

    return similar;
  } catch (error) {
    console.error('Find similar assessments error:', error);
    return [];
  }
}
