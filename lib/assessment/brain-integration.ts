import { createServerSupabaseClient } from '@/lib/supabase-server';
import { Demographics } from '@/types/assessment';

export interface HealthProfile {
  demographics: Demographics;
  recentConditions: string[];
  lastAssessmentDate?: string;
  knownAllergies?: string[];
  medications?: string[];
}

/**
 * 从 The Brain 获取用户健康档案
 */
export async function getUserHealthProfile(userId: string): Promise<HealthProfile | null> {
  const supabase = await createServerSupabaseClient();

  try {
    // 1. 查询健康档案
    const { data: profileData } = await supabase
      .from('ai_memory')
      .select('content_text, metadata')
      .eq('user_id', userId)
      .eq('metadata->>type', 'health_profile')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // 2. 查询最近的评估结果
    const { data: recentAssessments } = await supabase
      .from('ai_memory')
      .select('metadata, created_at')
      .eq('user_id', userId)
      .eq('metadata->>type', 'assessment_result')
      .order('created_at', { ascending: false })
      .limit(3);

    // 3. 从 profiles 表获取基本信息
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('age, gender, height, weight')
      .eq('id', userId)
      .single();

    // 构建健康档案
    const profile: HealthProfile = {
      demographics: {},
      recentConditions: [],
    };

    // 从 profiles 表填充人口统计信息
    if (userProfile) {
      if (userProfile.gender) {
        profile.demographics.biological_sex = userProfile.gender as 'male' | 'female';
      }
      if (userProfile.age) {
        profile.demographics.age = userProfile.age;
      }
    }

    // 从 ai_memory 填充更多信息
    if (profileData?.metadata) {
      const metadata = profileData.metadata as any;
      if (metadata.allergies) {
        profile.knownAllergies = metadata.allergies;
      }
      if (metadata.medications) {
        profile.medications = metadata.medications;
        profile.demographics.medications = metadata.medications;
      }
      if (metadata.medical_history) {
        profile.demographics.medical_history = metadata.medical_history;
      }
      if (metadata.smoking_status) {
        profile.demographics.smoking_status = metadata.smoking_status;
      }
    }

    // 从最近评估中提取条件
    if (recentAssessments && recentAssessments.length > 0) {
      const conditions = new Set<string>();
      recentAssessments.forEach(a => {
        const metadata = a.metadata as any;
        if (metadata?.conditions) {
          metadata.conditions.forEach((c: any) => {
            if (c.name) conditions.add(c.name);
          });
        }
      });
      profile.recentConditions = Array.from(conditions);
      profile.lastAssessmentDate = recentAssessments[0].created_at;
    }

    return profile;
  } catch (error) {
    console.error('Failed to get health profile:', error);
    return null;
  }
}

/**
 * 检查是否有可预填充的基线数据
 */
export function hasPrefilledData(profile: HealthProfile | null): boolean {
  if (!profile) return false;
  
  const { demographics } = profile;
  return !!(
    demographics.biological_sex ||
    demographics.age ||
    demographics.smoking_status ||
    (demographics.medical_history && demographics.medical_history.length > 0)
  );
}

/**
 * 生成预填充确认问题
 */
export function generatePrefilledConfirmation(
  profile: HealthProfile,
  language: 'zh' | 'en'
): {
  text: string;
  description: string;
  prefilledData: Record<string, string>;
} {
  const isZh = language === 'zh';
  const prefilledData: Record<string, string> = {};

  if (profile.demographics.biological_sex) {
    prefilledData[isZh ? '生理性别' : 'Biological Sex'] = 
      profile.demographics.biological_sex === 'male' 
        ? (isZh ? '男性' : 'Male') 
        : (isZh ? '女性' : 'Female');
  }

  if (profile.demographics.age) {
    prefilledData[isZh ? '年龄' : 'Age'] = String(profile.demographics.age);
  }

  if (profile.demographics.smoking_status) {
    const smokingLabels: Record<string, { zh: string; en: string }> = {
      never: { zh: '从不吸烟', en: 'Never smoked' },
      former: { zh: '已戒烟', en: 'Former smoker' },
      current: { zh: '目前吸烟', en: 'Current smoker' },
    };
    const label = smokingLabels[profile.demographics.smoking_status];
    if (label) {
      prefilledData[isZh ? '吸烟状态' : 'Smoking Status'] = isZh ? label.zh : label.en;
    }
  }

  if (profile.demographics.medical_history && profile.demographics.medical_history.length > 0) {
    prefilledData[isZh ? '既往病史' : 'Medical History'] = 
      profile.demographics.medical_history.join(', ');
  }

  return {
    text: isZh 
      ? '我们找到了您之前的健康信息，请确认是否正确：' 
      : 'We found your previous health information. Please confirm if it\'s correct:',
    description: isZh
      ? '如果信息有变化，您可以选择"需要更新"来修改。'
      : 'If any information has changed, you can select "Need to update" to modify.',
    prefilledData,
  };
}

/**
 * 存储健康档案到 The Brain
 */
export async function storeHealthProfile(
  userId: string,
  demographics: Demographics
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();

  try {
    // 构建内容文本
    const contentParts: string[] = [];
    if (demographics.biological_sex) {
      contentParts.push(`性别: ${demographics.biological_sex === 'male' ? '男' : '女'}`);
    }
    if (demographics.age) {
      contentParts.push(`年龄: ${demographics.age}`);
    }
    if (demographics.smoking_status) {
      const smokingMap = { never: '从不吸烟', former: '已戒烟', current: '吸烟' };
      contentParts.push(`吸烟: ${smokingMap[demographics.smoking_status]}`);
    }
    if (demographics.medical_history && demographics.medical_history.length > 0) {
      contentParts.push(`病史: ${demographics.medical_history.join(', ')}`);
    }

    const contentText = `用户健康档案 - ${contentParts.join('; ')}`;

    // 检查是否已有档案
    const { data: existing } = await supabase
      .from('ai_memory')
      .select('id')
      .eq('user_id', userId)
      .eq('metadata->>type', 'health_profile')
      .single();

    if (existing) {
      // 更新现有档案
      const { error } = await supabase
        .from('ai_memory')
        .update({
          content_text: contentText,
          metadata: {
            type: 'health_profile',
            updated_at: new Date().toISOString(),
            ...demographics,
          },
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // 创建新档案
      const { error } = await supabase
        .from('ai_memory')
        .insert({
          user_id: userId,
          content_text: contentText,
          metadata: {
            type: 'health_profile',
            created_at: new Date().toISOString(),
            ...demographics,
          },
        });

      if (error) throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Failed to store health profile:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 查找相似症状的历史评估（用于报告中显示历史上下文）
 */
export async function findSimilarHistoricalAssessments(
  userId: string,
  symptoms: string[],
  chiefComplaint: string
): Promise<Array<{
  date: string;
  chiefComplaint: string;
  topCondition: string;
  similarity: number;
}>> {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: assessments } = await supabase
      .from('ai_memory')
      .select('metadata, created_at')
      .eq('user_id', userId)
      .eq('metadata->>type', 'assessment_result')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!assessments || assessments.length === 0) {
      return [];
    }

    // 计算相似度
    const searchTerms = [...symptoms, chiefComplaint].map(s => s.toLowerCase());
    
    const results = assessments
      .map(a => {
        const metadata = a.metadata as any;
        const historicalSymptoms: string[] = metadata?.symptoms || [];
        const historicalComplaint: string = metadata?.chief_complaint || '';
        
        // 简单的关键词匹配相似度
        const historicalTerms = [...historicalSymptoms, historicalComplaint].map(s => s.toLowerCase());
        const matchCount = searchTerms.filter(term => 
          historicalTerms.some(ht => ht.includes(term) || term.includes(ht))
        ).length;
        
        const similarity = matchCount / Math.max(searchTerms.length, 1);

        return {
          date: a.created_at,
          chiefComplaint: historicalComplaint,
          topCondition: metadata?.conditions?.[0]?.name || '',
          similarity,
        };
      })
      .filter(r => r.similarity > 0.3) // 只返回相似度 > 30% 的
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);

    return results;
  } catch (error) {
    console.error('Failed to find similar assessments:', error);
    return [];
  }
}
