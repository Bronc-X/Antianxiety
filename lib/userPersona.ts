/**
 * 用户画像向量化工具
 * 根据用户的所有数据生成用户画像向量，用于 RAG 搜索
 */

import { createServerSupabaseClient } from './supabase-server';
import { generateEmbedding } from './aiMemory';

/**
 * 生成用户画像文本
 * 汇总用户的所有关键信息，用于生成向量
 */
export async function generateUserPersonaText(userId: string): Promise<string> {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. 获取用户资料
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('获取用户资料失败:', profileError);
      return '';
    }

    // 2. 获取用户习惯
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('title, description, min_resistance_level')
      .eq('user_id', userId);

    if (habitsError) {
      console.error('获取用户习惯失败:', habitsError);
    }

    // 3. 获取最近的完成记录（用于了解用户行为模式）
    const { data: completions, error: completionsError } = await supabase
      .from('habit_completions')
      .select('completed_at, user_notes')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(30); // 最近 30 条记录

    if (completionsError) {
      console.error('获取完成记录失败:', completionsError);
    }

    // 4. 获取用户指标（信念分数、信心分数等）
    const { data: metrics, error: metricsError } = await supabase
      .from('user_metrics')
      .select('belief_curve_score, confidence_score, physical_performance_score, date')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(7); // 最近 7 天

    if (metricsError) {
      console.error('获取用户指标失败:', metricsError);
    }

    // 5. 构建用户画像文本
    let personaText = '用户画像摘要：\n\n';

    // 基本信息
    if (profile) {
      if (profile.primary_concern) {
        personaText += `主要关注：${profile.primary_concern}\n`;
      }
      if (profile.activity_level) {
        personaText += `活动水平：${profile.activity_level}\n`;
      }
      if (profile.circadian_rhythm) {
        personaText += `昼夜节律：${profile.circadian_rhythm}\n`;
      }
      if (profile.language) {
        personaText += `语言偏好：${profile.language}\n`;
      }
    }

    // 习惯信息
    if (habits && habits.length > 0) {
      personaText += `\n当前习惯（${habits.length}个）：\n`;
      habits.forEach((habit, index) => {
        personaText += `${index + 1}. ${habit.title}`;
        if (habit.description) {
          personaText += ` - ${habit.description}`;
        }
        if (habit.min_resistance_level) {
          personaText += ` (阻力等级: ${habit.min_resistance_level})`;
        }
        personaText += '\n';
      });
    }

    // 行为模式（基于完成记录）
    if (completions && completions.length > 0) {
      const completionCount = completions.length;
      const recentDays = new Set(
        completions.map((c) => new Date(c.completed_at).toISOString().split('T')[0])
      ).size;
      personaText += `\n行为模式：最近完成 ${completionCount} 次打卡，涉及 ${recentDays} 天\n`;
    }

    // 指标趋势
    if (metrics && metrics.length > 0) {
      const avgBelief = metrics.reduce((sum, m) => sum + (m.belief_curve_score || 0), 0) / metrics.length;
      const avgConfidence = metrics.reduce((sum, m) => sum + (m.confidence_score || 0), 0) / metrics.length;
      personaText += `\n近期指标：\n`;
      personaText += `- 平均信念分数：${avgBelief.toFixed(2)}\n`;
      personaText += `- 平均信心分数：${avgConfidence.toFixed(2)}\n`;
    }

    return personaText;
  } catch (error) {
    console.error('生成用户画像文本失败:', error);
    return '';
  }
}

/**
 * 生成并更新用户画像向量
 */
export async function updateUserPersonaEmbedding(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. 生成用户画像文本
    const personaText = await generateUserPersonaText(userId);
    if (!personaText) {
      return { success: false, error: '无法生成用户画像文本' };
    }

    // 2. 生成向量嵌入
    const embedding = await generateEmbedding(personaText);
    if (!embedding || embedding.length === 0) {
      return { success: false, error: '无法生成向量嵌入' };
    }

    // 3. 更新 profiles 表
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ user_persona_embedding: embedding })
      .eq('id', userId);

    if (updateError) {
      console.error('更新用户画像向量失败:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('更新用户画像向量异常:', error);
    return { success: false, error: error.message };
  }
}

