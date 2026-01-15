import { Resend } from 'resend';
import { generatePDFHTML, PDFReportData } from './pdf-generator';

// 初始化 Resend 客户端
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface EmailReportParams {
  to: string;
  reportData: PDFReportData;
  language: 'zh' | 'en';
}

/**
 * 发送评估报告邮件
 */
export async function sendReportEmail(params: EmailReportParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const { to, reportData, language } = params;

  if (!resend) {
    console.warn('Resend API key not configured, skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  const isZh = language === 'zh';
  const html = generatePDFHTML(reportData);

  try {
    const { data, error } = await resend.emails.send({
      from: 'Bio-Ledger <noreply@bio-ledger.com>',
      to: [to],
      subject: isZh 
        ? `您的健康评估报告 - ${reportData.date}` 
        : `Your Health Assessment Report - ${reportData.date}`,
      html: generateEmailTemplate(reportData, language),
      attachments: [
        {
          filename: `assessment-report-${reportData.sessionId.slice(0, 8)}.html`,
          content: Buffer.from(html).toString('base64'),
        },
      ],
    });

    if (error) {
      console.error('Failed to send email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error: unknown) {
    const errorInfo = error as { message?: string };
    console.error('Email send error:', errorInfo);
    return { success: false, error: errorInfo.message || 'Email send failed' };
  }
}

/**
 * 生成邮件正文模板
 */
function generateEmailTemplate(data: PDFReportData, language: 'zh' | 'en'): string {
  const isZh = language === 'zh';
  const topCondition = data.conditions[0];

  const urgencyLabels: Record<string, { zh: string; en: string }> = {
    emergency: { zh: '紧急', en: 'Emergency' },
    urgent: { zh: '需尽快就医', en: 'Urgent' },
    routine: { zh: '常规就诊', en: 'Routine' },
    self_care: { zh: '自我护理', en: 'Self Care' },
  };

  const urgencyLabel = urgencyLabels[data.urgency] || urgencyLabels.routine;

  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FAFAFA; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #9CAF88; font-size: 24px; margin-bottom: 8px;">Bio-Ledger</h1>
      <h2 style="color: #2C2C2C; font-size: 20px; margin-bottom: 8px;">
        ${isZh ? '您的健康评估报告已生成' : 'Your Health Assessment Report is Ready'}
      </h2>
      <p style="color: #666; font-size: 14px;">${data.date}</p>
    </div>

    <div style="background: #F5F5F5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">
        ${isZh ? '主诉' : 'Chief Complaint'}
      </p>
      <p style="margin: 0; font-size: 16px; font-weight: 500;">${data.chiefComplaint}</p>
    </div>

    <div style="background: #F5F5F5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">
        ${isZh ? '最可能的情况' : 'Most Likely Condition'}
      </p>
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #9CAF88;">
        ${topCondition?.name || '-'} (${topCondition?.probability || 0}%)
      </p>
    </div>

    <div style="background: #FFF3CD; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; color: #856404; font-size: 14px;">
        ${isZh ? '紧急程度' : 'Urgency Level'}
      </p>
      <p style="margin: 0; font-size: 16px; font-weight: 600; color: #856404;">
        ${isZh ? urgencyLabel.zh : urgencyLabel.en}
      </p>
    </div>

    <p style="color: #666; font-size: 14px; margin-bottom: 24px;">
      ${isZh 
        ? '完整报告已作为附件发送，您也可以登录 Bio-Ledger 查看详细信息。' 
        : 'The full report is attached. You can also log in to Bio-Ledger to view details.'}
    </p>

    <div style="background: #E8DFD0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 12px; color: #666; text-align: center;">
        ⚠️ ${isZh 
          ? '此评估仅供参考，不能替代专业医疗诊断。如有疑虑，请咨询医生。' 
          : 'This assessment is for reference only and cannot replace professional medical diagnosis.'}
      </p>
    </div>

    <div style="text-align: center; color: #999; font-size: 12px;">
      <p>Powered by Bio-Ledger Assessment Engine</p>
      <p>© ${new Date().getFullYear()} Bio-Ledger. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
