import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generatePDFHTML, formatDate, PDFReportData } from '@/lib/assessment/pdf-generator';
import { Condition, UrgencyLevel } from '@/types/assessment';

const ExportRequestSchema = z.object({
  session_id: z.string().uuid(),
  format: z.enum(['html', 'json']).default('html'),
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
    const parsed = ExportRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: '请求格式有误' } },
        { status: 400 }
      );
    }

    const { session_id, format } = parsed.data;

    // 获取会话和报告
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

    // 构建 PDF 数据
    const pdfData: PDFReportData = {
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

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: pdfData,
      });
    }

    // 生成 HTML
    const html = generatePDFHTML(pdfData);

    // 返回 HTML 内容，前端可以用于打印或转换为 PDF
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="assessment-report-${session_id.slice(0, 8)}.html"`,
      },
    });
  } catch (error: any) {
    console.error('Assessment export error:', error);
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
    const format = searchParams.get('format') || 'html';

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

    // 获取会话和报告
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

    const { data: report, error: reportError } = await supabase
      .from('assessment_reports')
      .select('*')
      .eq('session_id', session_id)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { success: false, error: { code: 'REPORT_NOT_FOUND', message: '报告未找到' } },
        { status: 404 }
      );
    }

    const language = session.language as 'zh' | 'en';

    const pdfData: PDFReportData = {
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

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: pdfData,
      });
    }

    const html = generatePDFHTML(pdfData);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error: any) {
    console.error('Assessment export GET error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务暂时不可用' } },
      { status: 500 }
    );
  }
}
