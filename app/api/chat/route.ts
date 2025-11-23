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
  console.log('\n📨 收到 AI 聊天请求');
  try {
    // 1. 认证检查
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('🔐 用户认证:', { hasUser: !!user, userId: user?.id, authError: authError?.message });
    
    if (authError || !user) {
      console.error('❌ 认证失败');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 2. 解析请求
    const body: RequestBody = await request.json();
    
    if (!body.message || body.message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }
    
    // 3. 获取用户profile（用于生成个性化System Prompt）
    const { data: profile } = await supabase
      .from('profiles')
      .select('age, gender, metabolic_concerns, activity_level, stress_level, energy_level')
      .eq('id', user.id)
      .single();
    
    // 4. 获取对话历史（最近5轮）
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
    
    // 5. 调用RAG系统
    console.log('💬 用户问题:', body.message);
    console.log('📚 对话历史条数:', conversationHistory.length);
    
    const chatRequest: ChatRequest = {
      userId: user.id,
      sessionId: body.sessionId,
      userQuestion: body.message,
      conversationHistory,
      userContext: profile ? {
        age: profile.age,
        gender: profile.gender,
        metabolic_concerns: profile.metabolic_concerns,
        activity_level: profile.activity_level,
        stress_level: profile.stress_level,
        energy_level: profile.energy_level
      } : undefined,
      language: body.language || 'zh'
    };
    
    console.log('🚀 调用RAG系统...');
    const response = await chatWithRAG(chatRequest);
    console.log('✅ RAG响应成功');
    
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
