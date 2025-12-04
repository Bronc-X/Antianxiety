import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ReportStep, Condition, UrgencyLevel } from '@/types/assessment';

const ReportRequestSchema = z.object({
  session_id: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = ReportRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: '请求格式有误' } },
        { status: 400 }
      );
    }

    const { session_id } = parsed.data;

    // 获取会话
    const { data: session, error: sessionError } = await supabase
      .from('assessment_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'SESSION_NOT_FOUND', message: '找不到您的评估会话' } },
        { status: 404 }
      );
    }

    // 检查是否已有报告
    const { data: existingReport } = await supabase
      .from('assessment_reports')
      .select('*')
      .eq('session_id', session_id)
      .single();

    if (existingReport) {
      // 返回已有报告
      const response: ReportStep = {
        step_type: 'report',
        session_id,
        phase: 'report',
        report: {
          conditions: existingReport.conditions as Condition[],
          urgency: existingReport.urgency as UrgencyLevel,
          next_steps: existingReport.next_steps as { action: string; icon: string }[],
          disclaimer: session.language === 'zh'
            ? '此评估仅供参考，不能替代专业医疗诊断。如有疑虑，请咨询医生。'
            : 'This assessment is for reference only and cannot replace professional medical diagnosis.',
        },
      };
      return NextResponse.json(response);
    }

    // 如果会话还没完成，返回错误
    if (session.phase !== 'report' && session.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: { code: 'SESSION_NOT_COMPLETE', message: '评估尚未完成' } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'REPORT_NOT_FOUND', message: '报告未找到' } },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Assessment report error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务暂时不可用' } },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(req.url);
    const session_id = searchParams.get('session_id');

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      );
    }

    if (!session_id) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: '缺少 session_id' } },
        { status: 400 }
      );
    }

    // 获取报告
    const { data: report, error: reportError } = await supabase
      .from('assessment_reports')
      .select('*, assessment_sessions!inner(language, user_id)')
      .eq('session_id', session_id)
      .eq('user_id', user.id)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { success: false, error: { code: 'REPORT_NOT_FOUND', message: '报告未找到' } },
        { status: 404 }
      );
    }

    const language = (report.assessment_sessions as any)?.language || 'zh';

    const response: ReportStep = {
      step_type: 'report',
      session_id,
      phase: 'report',
      report: {
        conditions: report.conditions as Condition[],
        urgency: report.urgency as UrgencyLevel,
        next_steps: report.next_steps as { action: string; icon: string }[],
        disclaimer: language === 'zh'
          ? '此评估仅供参考，不能替代专业医疗诊断。如有疑虑，请咨询医生。'
          : 'This assessment is for reference only and cannot replace professional medical diagnosis.',
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Assessment report GET error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务暂时不可用' } },
      { status: 500 }
    );
  }
}
