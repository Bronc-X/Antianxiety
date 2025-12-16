import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendReportEmail } from '@/lib/assessment/email-service';
import { formatDate, PDFReportData } from '@/lib/assessment/pdf-generator';
import { Condition, UrgencyLevel } from '@/types/assessment';

const EmailRequestSchema = z.object({
  session_id: z.string().uuid(),
  email: z.string().email().optional(), // 如果不提供，使用用户注册邮箱
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
    const parsed = EmailRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: '请求格式有误' } },
        { status: 400 }
      );
    }

    const { session_id, email } = parsed.data;
    const targetEmail = email || user.email;

    if (!targetEmail) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_EMAIL', message: '未找到邮箱地址' } },
        { status: 400 }
      );
    }

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

    // 获取报告
    const { data: report, error: reportError } = await supabase
      .from('assessment_reports')
      .select('*')
      .eq('session_id', session_id)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { success: false, error: { code: 'REPORT_NOT_FOUND', message: '报告未找到，请先完成评估' } },
        { status: 404 }
      );
    }

    const language = session.language as 'zh' | 'en';

    // 构建报告数据
    const reportData: PDFReportData = {
      sessionId: session_id,
      date: formatDate(new Date(report.created_at), language),
      demographics: session.demographics || {},
      chiefComplaint: session.chief_complaint || '',
      symptoms: session.symptoms || [],
      conditions: report.conditions as Condition[],
      urgency: report.urgency as UrgencyLevel,
      nextSteps: report.next_steps as { action: string; icon: string }[],
      language,
    };

    // 发送邮件
    const result = await sendReportEmail({
      to: targetEmail,
      reportData,
      language,
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'EMAIL_FAILED', 
            message: language === 'zh' ? '邮件发送失败，请稍后重试' : 'Failed to send email, please try again later',
            details: result.error,
          } 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: language === 'zh' 
        ? `报告已发送至 ${targetEmail}` 
        : `Report sent to ${targetEmail}`,
      messageId: result.messageId,
    });
  } catch (error: any) {
    console.error('Assessment email error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务暂时不可用' } },
      { status: 500 }
    );
  }
}
