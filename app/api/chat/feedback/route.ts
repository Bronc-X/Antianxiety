/**
 * 用户反馈API
 * POST /api/chat/feedback
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { submitFeedback } from '@/lib/rag';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface FeedbackRequest {
  conversationId: number;
  feedback: 'helpful' | 'not_helpful';
  comment?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 认证检查
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 解析请求
    const body: FeedbackRequest = await request.json();
    
    if (!body.conversationId || !body.feedback) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // 验证conversation属于当前用户
    const { data: conversation, error: verifyError } = await supabase
      .from('chat_conversations')
      .select('user_id')
      .eq('id', body.conversationId)
      .single();
    
    if (verifyError || !conversation || conversation.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Conversation not found or unauthorized' },
        { status: 404 }
      );
    }
    
    // 提交反馈
    await submitFeedback(
      body.conversationId,
      body.feedback,
      body.comment
    );
    
    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully'
    });
    
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
