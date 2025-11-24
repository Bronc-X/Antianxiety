'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

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
  
  // Account
  full_name?: string;
  avatar_url?: string;
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
    const updatePayload: Record<string, any> = {};

    // Body metrics
    if (data.height !== undefined) updatePayload.height = parseFloat(String(data.height)) || null;
    if (data.weight !== undefined) updatePayload.weight = parseFloat(String(data.weight)) || null;
    if (data.age !== undefined) updatePayload.age = parseInt(String(data.age), 10) || null;
    if (data.gender !== undefined) updatePayload.gender = data.gender;
    
    // AI tuning fields
    if (data.primary_goal !== undefined) updatePayload.primary_goal = data.primary_goal;
    if (data.primary_goal !== undefined) updatePayload.primary_concern = data.primary_goal; // Alias for compatibility
    if (data.ai_personality !== undefined) updatePayload.ai_personality = data.ai_personality;
    if (data.current_focus !== undefined) updatePayload.current_focus = data.current_focus;
    
    // Account fields
    if (data.full_name !== undefined) updatePayload.full_name = data.full_name;
    if (data.avatar_url !== undefined) updatePayload.avatar_url = data.avatar_url;

    // === STEP 2: Regenerate AI Persona Context (The "Sync") ===
    // This is the CRITICAL part that connects Settings → AI Behavior
    
    const goalMap: Record<string, string> = {
      lose_weight: '减脂塑形',
      improve_sleep: '改善睡眠质量',
      boost_energy: '提升精力和活力',
      maintain_energy: '保持健康状态',
    };

    const personalityMap: Record<string, string> = {
      strict_coach: '严格教练模式：直言不讳，严格督促用户执行计划',
      gentle_friend: '温和朋友模式：鼓励为主，理解用户的困难',
      science_nerd: '科学极客模式：数据驱动，详细解释生理机制',
    };

    const goal = data.primary_goal || 'maintain_energy';
    const personality = data.ai_personality || 'gentle_friend';
    const focus = data.current_focus || '';

    // Construct AI Context String
    const aiPersonaContext = `
用户主要目标：${goalMap[goal] || goal}

AI性格设定：${personalityMap[personality] || personality}

用户当前关注点：${focus || '无特殊说明'}

重要提示：
- 基于用户的主要目标调整建议优先级
- 遵循设定的性格风格进行对话
- 始终考虑用户的特殊关注点，避免不适合的建议
`.trim();

    updatePayload.ai_persona_context = aiPersonaContext;

    console.log('🧠 Brain Sync: Regenerating AI Context');
    console.log('📝 New Context:', aiPersonaContext);

    // === STEP 3: Update Database ===
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Update failed:', updateError);
      return {
        success: false,
        error: updateError.message || '更新失败'
      };
    }

    console.log('✅ Settings updated successfully');
    console.log('👤 Updated profile:', updatedProfile);

    // === STEP 4: Revalidate Paths ===
    // This ensures the Assistant page and Landing page update immediately
    revalidatePath('/assistant');
    revalidatePath('/landing');
    revalidatePath('/settings');
    
    console.log('🔄 Paths revalidated: /assistant, /landing, /settings');

    return {
      success: true,
      data: updatedProfile
    };

  } catch (error: any) {
    console.error('❌ Settings update error:', error);
    return {
      success: false,
      error: error.message || '发生未知错误'
    };
  }
}
