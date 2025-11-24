/**
 * AI健康助手聊天API
 * POST /api/chat
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { chatWithRAG, ChatRequest, ChatMessage } from '@/lib/rag';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RequestBody {
  message: string;
  sessionId?: string;
  language?: 'zh' | 'en';
}

export async function POST(request: NextRequest) {
  console.log('\n' + '='.repeat(80));
  console.log('📨 AI 聊天请求开始 - Sequential Execution Pipeline');
  console.log('='.repeat(80));
  
  try {
    // ==========================================
    // STEP 0: 认证检查
    // ==========================================
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ STEP 0 FAILED: 认证失败');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('✅ STEP 0: 认证成功 -', user.id);
    
    // 解析请求
    const body: RequestBody = await request.json();
    if (!body.message || body.message.trim().length === 0) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }
    console.log('📝 用户问题:', body.message);
    
    // ==========================================
    // STEP 1: FETCH "THE MEMORY" (User Profile)
    // ==========================================
    console.log('\n🧠 STEP 1: 获取用户档案 (THE MEMORY)...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('age, gender, primary_concern, activity_level, stress_level, energy_level, ai_persona_context, primary_goal, ai_personality, current_focus, full_name')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('⚠️ Profile查询错误:', profileError);
    }
    
    if (!profile) {
      console.error('❌ STEP 1 FAILED: Profile not found, using safety defaults');
      // 使用安全默认值
    }
    
    // 详细日志：显示所有关键设置
    console.log('✅ STEP 1 完成: User Profile loaded');
    console.log('  📋 基础信息:', {
      full_name: profile?.full_name || '未设置',
      age: profile?.age,
      gender: profile?.gender
    });
    console.log('  🎯 AI调优设置 (CRITICAL):');
    console.log('    - current_focus:', profile?.current_focus || '❌ NULL');
    console.log('    - ai_personality:', profile?.ai_personality || '❌ NULL');
    console.log('    - primary_goal:', profile?.primary_goal || '❌ NULL');
    console.log('    - ai_persona_context:', profile?.ai_persona_context ? '✅ 已生成' : '❌ NULL');
    
    // 🚨 安全检查：如果current_focus为空，发出警告
    if (!profile?.current_focus) {
      console.warn('⚠️ WARNING: current_focus is NULL - AI将无法知道用户的特殊健康状况！');
      console.warn('⚠️ 请检查：1) 数据库字段是否存在 2) 用户是否在设置中填写了内容');
    }
    
    // ==========================================
    // STEP 2: 获取对话历史
    // ==========================================
    console.log('\n💬 STEP 2: 获取对话历史...');
    let conversationHistory: ChatMessage[] = [];
    if (body.sessionId) {
      const { data: history } = await supabase
        .from('chat_conversations')
        .select('role, content')
        .eq('user_id', user.id)
        .eq('session_id', body.sessionId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (history) {
        conversationHistory = history.map(h => ({
          role: h.role as 'user' | 'assistant' | 'system',
          content: h.content
        })).reverse();
      }
    }
    console.log('✅ STEP 2 完成: 对话历史条数:', conversationHistory.length);
    
    // ==========================================
    // STEP 3: 组装用户上下文 (THE BRAIN INPUT)
    // ==========================================
    console.log('\n🔧 STEP 3: 组装用户上下文...');
    const userContext = profile ? {
      age: profile.age,
      gender: profile.gender,
      metabolic_concerns: profile.primary_concern ? [profile.primary_concern] : undefined,
      activity_level: profile.activity_level,
      stress_level: profile.stress_level,
      energy_level: profile.energy_level,
      // CRITICAL: Settings Dashboard字段
      ai_persona_context: profile.ai_persona_context,
      primary_goal: profile.primary_goal,
      ai_personality: profile.ai_personality,
      current_focus: profile.current_focus
    } : undefined;
    
    console.log('✅ STEP 3 完成: UserContext assembled');
    console.log('  🚨 CRITICAL FIELDS:');
    console.log('    - current_focus:', userContext?.current_focus || '❌ MISSING');
    console.log('    - ai_personality:', userContext?.ai_personality || '❌ MISSING');
    
    // ==========================================
    // STEP 4: 调用RAG系统 (FETCH KNOWLEDGE + GENERATE)
    // ==========================================
    console.log('\n🚀 STEP 4: 调用RAG系统...');
    const chatRequest: ChatRequest = {
      userId: user.id,
      sessionId: body.sessionId,
      userQuestion: body.message,
      conversationHistory,
      userContext,
      language: body.language || 'zh'
    };
    
    const response = await chatWithRAG(chatRequest);
    console.log('✅ STEP 4 完成: RAG响应成功');
    console.log('='.repeat(80));
    
    // 6. 返回响应
    return NextResponse.json({
      success: true,
      data: {
        answer: response.answer,
        sessionId: response.sessionId,
        knowledgeUsed: response.knowledgeUsed.map(k => ({
          id: k.id,
          category: k.category,
          tags: k.tags,
          similarity: k.similarity
        })),
        metadata: response.metadata
      }
    });
    
  } catch (error: any) {
    console.error('\n❌ Chat API 错误:', {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * 获取对话历史
 * GET /api/chat?sessionId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      // 返回用户的所有会话列表
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('id, title, message_count, last_message_at, created_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      return NextResponse.json({
        success: true,
        data: { sessions: sessions || [] }
      });
    }
    
    // 返回特定会话的对话历史
    const { data: conversations, error } = await supabase
      .from('chat_conversations')
      .select('id, role, content, created_at, user_feedback')
      .eq('user_id', user.id)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      data: { conversations: conversations || [] }
    });
    
  } catch (error: any) {
    console.error('Error fetching chat history:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
