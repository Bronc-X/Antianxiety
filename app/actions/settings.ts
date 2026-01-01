'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types/architecture';
import { NextRequest } from 'next/server';
import { GET as getPhaseGoalsRoute } from '@/app/api/settings/phase-goals/route';

interface SettingsData {
  // Body Metrics
  height?: string | number;
  weight?: string | number;
  age?: string | number;
  gender?: string;

  // AI Tuning
  primary_goal?: string;
  ai_personality?: string;
  current_focus?: string;

  // MAX Settings
  max_honesty?: number;
  max_humor?: number;

  // Account
  full_name?: string;
  avatar_url?: string;
}

export async function getSettings(): Promise<ActionResult<{ userId: string; settings: SettingsData }>> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: '请先登录' };
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('height, weight, age, gender, primary_goal, ai_personality, current_focus, full_name, avatar_url, ai_settings, ai_persona_context')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      return { success: false, error: error?.message || 'Failed to load settings' };
    }

    let honesty = 90;
    let humor = 65;

    if (profile.ai_settings && typeof profile.ai_settings.honesty_level === 'number') {
      honesty = profile.ai_settings.honesty_level;
      humor = profile.ai_settings.humor_level ?? 65;
    } else if (profile.ai_persona_context) {
      const honestyMatch = profile.ai_persona_context.match(/诚实度:\s*(\d+)%/);
      const humorMatch = profile.ai_persona_context.match(/幽默感:\s*(\d+)%/);
      if (honestyMatch) honesty = parseInt(honestyMatch[1], 10);
      if (humorMatch) humor = parseInt(humorMatch[1], 10);
    }

    const settings: SettingsData = {
      height: profile.height,
      weight: profile.weight,
      age: profile.age,
      gender: profile.gender,
      primary_goal: profile.primary_goal,
      ai_personality: profile.ai_personality,
      current_focus: profile.current_focus,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      max_honesty: honesty,
      max_humor: humor,
    };

    return {
      success: true,
      data: {
        userId: user.id,
        settings,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * updateSettings - The "Brain Sync" Function
 * 
 * This server action handles the critical logic of updating user settings
 * and regenerating the AI persona context that powers the chatbot.
 * 
 * Logic Flow:
 * 1. Update DB with new settings
 * 2. Regenerate AI Context (The "Sync")
 * 3. Revalidate paths to update UI immediately
 */
export async function updateSettings(userId: string, data: SettingsData) {
  try {
    const supabase = await createServerSupabaseClient();

    // === STEP 1: Prepare Update Payload ===
    const updatePayload: Record<string, unknown> = {};

    // Body metrics
    if (data.height !== undefined) updatePayload.height = parseFloat(String(data.height)) || null;
    if (data.weight !== undefined) updatePayload.weight = parseFloat(String(data.weight)) || null;
    if (data.age !== undefined) updatePayload.age = parseInt(String(data.age), 10) || null;
    if (data.gender !== undefined) updatePayload.gender = data.gender;

    // AI tuning fields - CRITICAL for Brain Sync
    if (data.primary_goal !== undefined) {
      updatePayload.primary_goal = data.primary_goal;
      updatePayload.primary_concern = data.primary_goal; // Alias for compatibility
    }
    if (data.ai_personality !== undefined) {
      updatePayload.ai_personality = data.ai_personality;
    }
    if (data.current_focus !== undefined) {
      // 🚨 CRITICAL: current_focus 是最重要的字段，用于告诉 AI 用户的健康问题
      updatePayload.current_focus = data.current_focus;
    }

    // Account fields
    if (data.full_name !== undefined) updatePayload.full_name = data.full_name;
    if (data.avatar_url !== undefined) updatePayload.avatar_url = data.avatar_url;

    // 🆕 尝试保存 ai_settings JSON 字段（供 chat API 使用）
    // 注意：如果数据库没有这个字段，会在后面单独处理
    const aiSettings = {
      honesty_level: data.max_honesty ?? 90,
      humor_level: data.max_humor ?? 65,
      mode: data.ai_personality || 'max',
    };

    // === STEP 2: Regenerate AI Persona Context (The "Sync") ===
    // This is the CRITICAL part that connects Settings → AI Behavior

    const goalMap: Record<string, string> = {
      lose_weight: '减脂塑形',
      improve_sleep: '改善睡眠质量',
      boost_energy: '提升精力和活力',
      maintain_energy: '保持健康状态',
    };

    // 三种 AI 人格模式
    const personalityMap: Record<string, string> = {
      max: 'MAX模式：简洁干练，带有干幽默，贝叶斯推理引擎',
      zen_master: 'Zen Master模式：平静哲学，深思熟虑，禅意智慧',
      dr_house: 'Dr. House模式：直接诊断，不绕弯子，医学专家',
    };

    const goal = data.primary_goal || 'maintain_energy';
    const personality = data.ai_personality || 'max';
    const focus = data.current_focus || '';

    // 滑块设置（所有模式通用）
    const maxHonesty = data.max_honesty ?? 90;
    const maxHumor = data.max_humor ?? 65;


    // Construct AI Context String
    let aiPersonaContext = `
用户主要目标：${goalMap[goal] || goal}

AI性格设定：${personalityMap[personality] || personality}

用户当前关注点：${focus || '无特殊说明'}

重要提示：
- 基于用户的主要目标调整建议优先级
- 遵循设定的性格风格进行对话
- 始终考虑用户的特殊关注点，避免不适合的建议
`.trim();

    // 为所有人格模式添加滑块配置
    const personalityStyles: Record<string, string> = {
      max: '简洁干练，带有干幽默，使用贝叶斯推理框架',
      zen_master: '平静哲学，深思熟虑，禅意智慧，引导式对话',
      dr_house: '直接诊断，不绕弯子，医学专家视角，循证分析',
    };

    aiPersonaContext += `

AI 引擎配置：
- 人格模式: ${personalityMap[personality] || personality}
- 诚实度: ${maxHonesty}% (${maxHonesty > 70 ? '直接坦率' : maxHonesty > 40 ? '适度委婉' : '温和外交'})
- 幽默感: ${maxHumor}% (${maxHumor > 70 ? '机智风趣' : maxHumor > 40 ? '适度幽默' : '严肃专业'})

行为准则：
- 风格特点: ${personalityStyles[personality] || '专业友好'}
- 根据诚实度调整表达的直接程度
- 根据幽默感添加适当的机智评论
${maxHumor >= 100 ? '- 🎉 彩蛋模式激活：可以更加放飞自我，增加趣味性' : ''}
`;

    updatePayload.ai_persona_context = aiPersonaContext;
    // === STEP 3: Update Database ===
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ ...updatePayload, ai_settings: aiSettings })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Update failed:', updateError);
      return {
        success: false,
        error: updateError.message || 'Update failed'
      };
    }

    // === STEP 4: Revalidate Paths ===
    // This ensures the Assistant page and Landing page update immediately
    revalidatePath('/assistant');
    revalidatePath('/unlearn/app');
    revalidatePath('/settings');

    return {
      success: true,
      data: updatedProfile
    };

  } catch (error: unknown) {
    console.error('Settings update error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: message
    };
  }
}

async function parseJsonResponse(response: Response): Promise<any> {
  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function getPhaseGoals(userId?: string): Promise<ActionResult<any>> {
  try {
    const url = new URL('http://settings.local/api/settings/phase-goals');
    if (userId) {
      url.searchParams.set('userId', userId);
    }
    const request = new NextRequest(url.toString());
    const response = await getPhaseGoalsRoute(request);
    const data = await parseJsonResponse(response);

    if (!response.ok) {
      return { success: false, error: data?.error || 'Failed to load goals' };
    }

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load goals';
    return { success: false, error: message };
  }
}
