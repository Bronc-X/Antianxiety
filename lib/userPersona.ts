/**
 * 用户画像向量化工具
 * 根据用户的所有数据生成用户画像向量，用于 RAG 搜索
 */

import { createServerSupabaseClient } from './supabase-server';
import { generateEmbedding } from './aiMemory';

type DailyLogRow = {
  sleep_duration_minutes?: number | null;
  stress_level?: number | null;
  exercise_duration_minutes?: number | null;
};

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

    // 4b. 获取近期每日状态（用于“持续采集 → 推荐更新”）
    const { data: dailyLogs, error: dailyLogsError } = await supabase
      .from('daily_wellness_logs')
      .select('log_date, sleep_duration_minutes, sleep_quality, stress_level, mood_status, exercise_duration_minutes')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })
      .limit(14);

    if (dailyLogsError) {
      console.error('获取每日状态记录失败:', dailyLogsError);
    }

    // 4c. 获取最新问卷（用于“当前状态”语义）
    const { data: latestQuestionnaire, error: questionnaireError } = await supabase
      .from('daily_questionnaire_responses')
      .select('responses, questions, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (questionnaireError) {
      console.error('获取每日问卷失败:', questionnaireError);
    }

    // 5. 构建用户画像文本
    let personaText = '用户画像摘要：\n\n';

    // 基本信息
    if (profile) {
      if (profile.primary_goal) {
        personaText += `主要目标：${profile.primary_goal}\n`;
      }
      if (profile.primary_concern) {
        personaText += `主要关注：${profile.primary_concern}\n`;
      }
      if (profile.current_focus) {
        personaText += `当前关注/症状：${profile.current_focus}\n`;
      }
      if (Array.isArray(profile.primary_focus_topics) && profile.primary_focus_topics.length > 0) {
        personaText += `重点关注话题：${profile.primary_focus_topics.slice(0, 8).join('、')}\n`;
      }
      if (Array.isArray(profile.metabolic_concerns) && profile.metabolic_concerns.length > 0) {
        personaText += `代谢困扰：${profile.metabolic_concerns.slice(0, 8).join('、')}\n`;
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

    // 每日状态趋势（最近 14 天）
    if (dailyLogs && dailyLogs.length > 0) {
      const sleepHours = (dailyLogs as DailyLogRow[])
        .map((row) => (typeof row.sleep_duration_minutes === 'number' ? row.sleep_duration_minutes / 60 : null))
        .filter((v: number | null) => v !== null) as number[];
      const stressLevels = (dailyLogs as DailyLogRow[])
        .map((row) => (typeof row.stress_level === 'number' ? row.stress_level : null))
        .filter((v: number | null) => v !== null) as number[];
      const exerciseMinutes = (dailyLogs as DailyLogRow[])
        .map((row) =>
          typeof row.exercise_duration_minutes === 'number' ? row.exercise_duration_minutes : null
        )
        .filter((v: number | null) => v !== null) as number[];

      const avgSleep =
        sleepHours.length > 0 ? sleepHours.reduce((sum: number, v: number) => sum + v, 0) / sleepHours.length : null;
      const avgStress =
        stressLevels.length > 0
          ? stressLevels.reduce((sum: number, v: number) => sum + v, 0) / stressLevels.length
          : null;
      const exerciseDays = exerciseMinutes.filter((v: number) => v > 0).length;

      personaText += `\n近期每日状态（最近${dailyLogs.length}天）：\n`;
      if (avgSleep !== null) personaText += `- 平均睡眠：${avgSleep.toFixed(1)}小时\n`;
      if (avgStress !== null) personaText += `- 平均压力：${avgStress.toFixed(1)}/10\n`;
      if (exerciseMinutes.length > 0) personaText += `- 运动天数：${exerciseDays}/${dailyLogs.length}\n`;
    }

    // 今日/最新问卷语义（只抽取少量关键题）
    if (latestQuestionnaire?.responses && typeof latestQuestionnaire.responses === 'object') {
      const responses = latestQuestionnaire.responses as Record<string, number>;
      const pick = (key: string) => (typeof responses[key] === 'number' ? responses[key] : null);
      const stress = pick('stress_level');
      const anxiety = pick('anxiety_feeling');
      const sleepQuality = pick('sleep_quality');
      const brainFog = pick('brain_fog');

      const stressLabels = ['很轻松', '较轻松', '一般', '有压力', '压力很大'];
      const sleepLabels = ['很差', '较差', '一般', '较好', '很好'];
      const anxietyLabels = ['完全没有', '偶尔有', '经常有', '持续存在'];
      const fogLabels = ['没有', '轻微', '明显', '严重'];

      const items: string[] = [];
      if (sleepQuality !== null) items.push(`睡眠质量=${sleepLabels[sleepQuality] ?? sleepQuality}`);
      if (stress !== null) items.push(`压力=${stressLabels[stress] ?? stress}`);
      if (anxiety !== null) items.push(`焦虑感=${anxietyLabels[anxiety] ?? anxiety}`);
      if (brainFog !== null) items.push(`脑雾=${fogLabels[brainFog] ?? brainFog}`);

      if (items.length > 0) {
        personaText += `\n最新问卷（语义摘要）：${items.join('，')}\n`;
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
  } catch (error) {
    console.error('更新用户画像向量异常:', error);
    const message = error instanceof Error ? error.message : '未知错误';
    return { success: false, error: message };
  }
}
