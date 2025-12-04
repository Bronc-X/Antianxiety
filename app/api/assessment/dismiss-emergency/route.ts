import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { logEmergencyDismissal } from '@/lib/assessment/red-flag';

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: '缺少 session_id' } },
        { status: 400 }
      );
    }

    // 验证会话属于当前用户
    const { data: session, error: sessionError } = await supabase
      .from('assessment_sessions')
      .select('id, user_id')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'SESSION_NOT_FOUND', message: '找不到会话' } },
        { status: 404 }
      );
    }

    // 记录紧急警告被关闭
    await logEmergencyDismissal(session_id);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Dismiss emergency error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务暂时不可用' } },
      { status: 500 }
    );
  }
}
