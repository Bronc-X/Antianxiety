import { Condition, UrgencyLevel } from '@/types/assessment';

// Bio-Ledger 品牌色
const COLORS = {
  sand: '#E8DFD0',
  clay: '#C4A77D',
  sage: '#9CAF88',
  softBlack: '#2C2C2C',
  white: '#FFFFFF',
  background: '#FAFAFA',
};

export interface PDFReportData {
  sessionId: string;
  date: string;
  demographics: {
    biological_sex?: 'male' | 'female';
    age?: string;
  };
  chiefComplaint: string;
  symptoms: string[];
  conditions: Condition[];
  urgency: UrgencyLevel;
  nextSteps: { action: string; icon: string }[];
  language: 'zh' | 'en';
}

/**
 * 生成 PDF 报告的 HTML 模板
 * 使用 HTML 模板方式，可以通过 puppeteer 或其他工具转换为 PDF
 */
export function generatePDFHTML(data: PDFReportData): string {
  const isZh = data.language === 'zh';
  
  const urgencyLabels: Record<UrgencyLevel, { zh: string; en: string; color: string }> = {
    emergency: { zh: '紧急', en: 'Emergency', color: '#DC2626' },
    urgent: { zh: '需尽快就医', en: 'Urgent', color: '#F59E0B' },
    routine: { zh: '常规就诊', en: 'Routine', color: '#3B82F6' },
    self_care: { zh: '自我护理', en: 'Self Care', color: COLORS.sage },
  };

  const urgencyInfo = urgencyLabels[data.urgency];

  return `
<!DOCTYPE html>
<html lang="${data.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isZh ? '健康评估报告' : 'Health Assessment Report'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: ${COLORS.background};
      color: ${COLORS.softBlack};
      line-height: 1.6;
      padding: 40px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: ${COLORS.white};
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 2px solid ${COLORS.sand};
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      color: ${COLORS.sage};
      margin-bottom: 8px;
    }
    .title {
      font-size: 28px;
      font-weight: 600;
      color: ${COLORS.softBlack};
      margin-bottom: 8px;
    }
    .date {
      color: #666;
      font-size: 14px;
    }
    .section {
      margin-bottom: 28px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: ${COLORS.softBlack};
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid ${COLORS.sand};
    }
    .urgency-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
      color: white;
      background-color: ${urgencyInfo.color};
      margin-bottom: 16px;
    }
    .symptoms-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .symptom-tag {
      background: ${COLORS.sand};
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 14px;
    }
    .condition-card {
      background: ${COLORS.background};
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      border-left: 4px solid ${COLORS.sage};
    }
    .condition-card.best-match {
      border-left-color: ${COLORS.clay};
      background: linear-gradient(135deg, ${COLORS.sand}20, ${COLORS.background});
    }
    .condition-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .condition-name {
      font-size: 18px;
      font-weight: 600;
    }
    .best-match-badge {
      background: ${COLORS.clay};
      color: white;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .probability {
      font-size: 24px;
      font-weight: 700;
      color: ${COLORS.sage};
    }
    .condition-description {
      color: #555;
      font-size: 14px;
      margin-bottom: 12px;
    }
    .matched-symptoms {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .matched-symptom {
      background: ${COLORS.sage}30;
      color: ${COLORS.softBlack};
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
    }
    .next-step {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: ${COLORS.background};
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .step-icon {
      font-size: 20px;
    }
    .step-action {
      font-size: 14px;
    }
    .disclaimer {
      margin-top: 32px;
      padding: 16px;
      background: ${COLORS.sand}40;
      border-radius: 8px;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
    .footer {
      margin-top: 24px;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Bio-Ledger</div>
      <h1 class="title">${isZh ? '健康评估报告' : 'Health Assessment Report'}</h1>
      <p class="date">${isZh ? '评估日期' : 'Assessment Date'}: ${data.date}</p>
    </div>

    <div class="section">
      <span class="urgency-badge">${isZh ? urgencyInfo.zh : urgencyInfo.en}</span>
    </div>

    <div class="section">
      <h2 class="section-title">${isZh ? '主诉' : 'Chief Complaint'}</h2>
      <p>${data.chiefComplaint}</p>
    </div>

    <div class="section">
      <h2 class="section-title">${isZh ? '症状' : 'Symptoms'}</h2>
      <div class="symptoms-list">
        ${data.symptoms.map(s => `<span class="symptom-tag">${s}</span>`).join('')}
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">${isZh ? '可能的情况' : 'Possible Conditions'}</h2>
      ${data.conditions.map(c => `
        <div class="condition-card ${c.is_best_match ? 'best-match' : ''}">
          <div class="condition-header">
            <div>
              <span class="condition-name">${c.name}</span>
              ${c.is_best_match ? `<span class="best-match-badge">${isZh ? '最可能' : 'Best Match'}</span>` : ''}
            </div>
            <span class="probability">${c.probability}%</span>
          </div>
          <p class="condition-description">${c.description}</p>
          <div class="matched-symptoms">
            ${c.matched_symptoms.map(s => `<span class="matched-symptom">${s}</span>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>

    <div class="section">
      <h2 class="section-title">${isZh ? '建议下一步' : 'Recommended Next Steps'}</h2>
      ${data.nextSteps.map(step => `
        <div class="next-step">
          <span class="step-icon">${step.icon}</span>
          <span class="step-action">${step.action}</span>
        </div>
      `).join('')}
    </div>

    <div class="disclaimer">
      ${isZh 
        ? '⚠️ 此评估仅供参考，不能替代专业医疗诊断。如有疑虑，请咨询医生。本系统不提供医疗建议、诊断或治疗。'
        : '⚠️ This assessment is for reference only and cannot replace professional medical diagnosis. Please consult a doctor if you have concerns. This system does not provide medical advice, diagnosis, or treatment.'}
    </div>

    <div class="footer">
      <p>Powered by Bio-Ledger Assessment Engine</p>
      <p>Session ID: ${data.sessionId}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 格式化日期
 */
export function formatDate(date: Date, language: 'zh' | 'en'): string {
  if (language === 'zh') {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
