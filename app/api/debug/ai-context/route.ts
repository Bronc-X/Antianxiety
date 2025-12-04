import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

/**
 * Debug API: 检查用户的 AI 调优设置
 * GET /api/debug/ai-context
 * 
 * 用于调试 Brain Sync 是否正常工作
 */
export async function GET() {
  try {
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
