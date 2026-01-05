import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { isAdminToken } from '@/lib/admin-auth';

const CONTEXT_ENVELOPE_VERSION = 'v2';
const EMPTY_CONTEXT_MARKER = 'NO_DATA';

const PRIMARY_GOAL_MAP: Record<string, string> = {
  lose_weight: '减脂塑形',
  improve_sleep: '改善睡眠',
  boost_energy: '提升精力',
  maintain_energy: '保持健康',
};

function formatPromptBlock(label: string, content?: string): string {
  const trimmed = content?.trim();
  return `[${label}]\n${trimmed ? trimmed : EMPTY_CONTEXT_MARKER}`;
}

function buildContextEnvelope(blocks: Array<{ label: string; content?: string }>): string {
  const body = blocks.map((block) => formatPromptBlock(block.label, block.content)).join('\n\n');
  return `[CONTEXT ENVELOPE ${CONTEXT_ENVELOPE_VERSION}]\n<CONTEXT>\n${body}\n</CONTEXT>`;
}

function summarizeText(text?: string | null, maxLength: number = 200): string | null {
  if (!text) return null;
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function buildFocusRecap(profile: {
  current_focus?: string | null;
  primary_goal?: string | null;
}): string {
  const parts: string[] = [];
  if (profile.current_focus) {
    parts.push(`健康限制: ${profile.current_focus}`);
  }
  if (profile.primary_goal) {
    const goalName = PRIMARY_GOAL_MAP[profile.primary_goal] || profile.primary_goal;
    parts.push(`主要目标: ${goalName}`);
  }
  return parts.join(' | ');
}

/**
 * Debug API: 检查用户的 AI 调优设置
 * GET /api/debug/ai-context
 * 
 * 用于调试 Brain Sync 是否正常工作
 */
export async function GET(request: Request) {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    const adminRequired = isProd || !!process.env.ADMIN_API_KEY;
    if (adminRequired && !isAdminToken(request.headers)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const supabase = await createServerSupabaseClient();
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: '未登录',
        hint: '请先登录后再访问此接口'
      }, { status: 401 });
    }
    
    // 获取用户档案 - 只选择确定存在的字段
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        age,
        gender,
        height,
        weight,
        primary_goal,
        ai_personality,
        current_focus,
        ai_persona_context,
        metabolic_profile,
        updated_at
      `)
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      return NextResponse.json({
        success: false,
        error: '档案读取失败',
        details: profileError.message,
        hint: '请检查数据库字段是否存在'
      }, { status: 500 });
    }
    
    // 构建诊断报告
    const focusRecap = buildFocusRecap(profile || {});
    const contextEnvelope = buildContextEnvelope([
      {
        label: 'AI TUNING',
        content: [
          `primary_goal: ${profile?.primary_goal || EMPTY_CONTEXT_MARKER}`,
          `ai_personality: ${profile?.ai_personality || EMPTY_CONTEXT_MARKER}`,
          `current_focus: ${profile?.current_focus || EMPTY_CONTEXT_MARKER}`,
        ].join('\n'),
      },
      {
        label: 'USER PROFILE',
        content: [
          `full_name: ${profile?.full_name || EMPTY_CONTEXT_MARKER}`,
          `age: ${profile?.age || EMPTY_CONTEXT_MARKER}`,
          `gender: ${profile?.gender || EMPTY_CONTEXT_MARKER}`,
          `height: ${profile?.height || EMPTY_CONTEXT_MARKER}`,
          `weight: ${profile?.weight || EMPTY_CONTEXT_MARKER}`,
        ].join('\n'),
      },
      {
        label: 'AI PERSONA CONTEXT',
        content: summarizeText(profile?.ai_persona_context) || undefined,
      },
      {
        label: 'FOCUS RECAP',
        content: focusRecap || EMPTY_CONTEXT_MARKER,
      },
    ]);

    const diagnosis = {
      success: true,
      user_id: user.id,
      email: user.email,
      
      // AI 调优字段状态
      ai_tuning: {
        primary_goal: {
          value: profile?.primary_goal || null,
          status: profile?.primary_goal ? '✅ 已设置' : '❌ 未设置',
        },
        ai_personality: {
          value: profile?.ai_personality || null,
          status: profile?.ai_personality ? '✅ 已设置' : '❌ 未设置',
        },
        current_focus: {
          value: profile?.current_focus || null,
          status: profile?.current_focus ? '✅ 已设置' : '⚠️ 未设置 (AI 将无法知道你的健康问题)',
        },
        ai_persona_context: {
          value: profile?.ai_persona_context ? '(已生成)' : null,
          status: profile?.ai_persona_context ? '✅ 已生成' : '❌ 未生成',
        },
      },
      
      // 基础信息
      basic_info: {
        full_name: profile?.full_name || '未设置',
        age: profile?.age || '未设置',
        gender: profile?.gender || '未设置',
        height: profile?.height || '未设置',
        weight: profile?.weight || '未设置',
      },
      
      // 最后更新时间
      last_updated: profile?.updated_at || '未知',
      
      // 上下文调试输出
      context_debug: {
        context_envelope_version: CONTEXT_ENVELOPE_VERSION,
        focus_recap: focusRecap || null,
        context_envelope: contextEnvelope,
      },

      // 建议
      recommendations: [] as string[],
    };
    
    // 生成建议
    if (!profile?.current_focus) {
      diagnosis.recommendations.push(
        '请在设置页面的"AI 调优"标签中填写"当前关注点"，例如"腿疼"、"备孕"等'
      );
    }
    if (!profile?.primary_goal) {
      diagnosis.recommendations.push(
        '请在设置页面选择你的"主要目标"'
      );
    }
    if (!profile?.ai_personality) {
      diagnosis.recommendations.push(
        '请在设置页面选择你喜欢的"AI 性格"'
      );
    }
    
    return NextResponse.json(diagnosis);
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || '未知错误',
    }, { status: 500 });
  }
}
