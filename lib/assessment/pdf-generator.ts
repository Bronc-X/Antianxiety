import { Condition, UrgencyLevel } from '@/types/assessment';

// Bio-Ledger 品牌色
const COLORS = {
  sand: '#E8DFD0',
  clay: '#C4A77D',
  sage: '#9CAF88',
  forest: '#0B3D2E',
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
 * 生成 PDF 报告的 HTML 模板 - 专业医疗报告设计
 * 优化为 A4 单页打印
 */
export function generatePDFHTML(data: PDFReportData): string {
  const isZh = data.language === 'zh';
  
  const urgencyLabels: Record<UrgencyLevel, { zh: string; en: string; color: string; bg: string }> = {
    emergency: { zh: '紧急就医', en: 'Emergency', color: '#DC2626', bg: '#FEE2E2' },
    urgent: { zh: '尽快就医', en: 'Urgent', color: '#D97706', bg: '#FEF3C7' },
    routine: { zh: '择期就诊', en: 'Routine', color: '#2563EB', bg: '#DBEAFE' },
    self_care: { zh: '居家护理', en: 'Self Care', color: COLORS.forest, bg: '#D1FAE5' },
  };

  const urgencyInfo = urgencyLabels[data.urgency];
  const topCondition = data.conditions[0];
  const otherConditions = data.conditions.slice(1, 3);

  return `
<!DOCTYPE html>
<html lang="${data.language}">
<head>
  <meta charset="UTF-8">
  <title>${isZh ? '健康评估报告' : 'Health Assessment Report'} - Bio-Ledger</title>
  <style>
    @page { size: A4; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
      background: ${COLORS.white};
      color: ${COLORS.softBlack};
      line-height: 1.5;
      font-size: 11px;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 15mm 18mm;
      background: ${COLORS.white};
      position: relative;
    }
    /* 顶部装饰条 */
    .header-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 8mm;
      background: linear-gradient(90deg, ${COLORS.forest} 0%, ${COLORS.sage} 100%);
    }
    /* 头部 */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 6mm;
      padding-top: 2mm;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 3mm;
    }
    .logo-icon {
      width: 10mm;
      height: 10mm;
      background: ${COLORS.forest};
      border-radius: 2mm;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
    }
    .brand-text h1 {
      font-size: 16px;
      font-weight: 700;
      color: ${COLORS.forest};
      letter-spacing: -0.5px;
    }
    .brand-text p {
      font-size: 9px;
      color: #666;
    }
    .report-meta {
      text-align: right;
      font-size: 9px;
      color: #666;
    }
    .report-meta .date {
      font-size: 11px;
      color: ${COLORS.softBlack};
      font-weight: 500;
    }
    /* 紧急程度横幅 */
    .urgency-banner {
      background: ${urgencyInfo.bg};
      border-left: 4px solid ${urgencyInfo.color};
      padding: 3mm 4mm;
      margin-bottom: 5mm;
      border-radius: 0 2mm 2mm 0;
      display: flex;
      align-items: center;
      gap: 3mm;
    }
    .urgency-label {
      font-size: 14px;
      font-weight: 700;
      color: ${urgencyInfo.color};
    }
    .urgency-desc {
      font-size: 10px;
      color: ${COLORS.softBlack};
    }
    /* 主要内容区 */
    .main-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5mm;
    }
    .left-col, .right-col {
      display: flex;
      flex-direction: column;
      gap: 4mm;
    }
    /* 卡片样式 */
    .card {
      background: ${COLORS.background};
      border-radius: 3mm;
      padding: 4mm;
    }
    .card-title {
      font-size: 10px;
      font-weight: 600;
      color: ${COLORS.forest};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2mm;
      padding-bottom: 1.5mm;
      border-bottom: 1px solid ${COLORS.sand};
    }
    /* 主诉卡片 */
    .complaint-text {
      font-size: 13px;
      font-weight: 500;
      color: ${COLORS.softBlack};
    }
    /* 症状标签 */
    .symptoms-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 2mm;
    }
    .symptom-tag {
      background: ${COLORS.sand};
      padding: 1.5mm 3mm;
      border-radius: 10px;
      font-size: 9px;
      color: ${COLORS.softBlack};
    }
    /* 主要诊断卡片 */
    .primary-condition {
      background: linear-gradient(135deg, ${COLORS.forest}08, ${COLORS.sage}15);
      border: 1px solid ${COLORS.sage}40;
    }
    .condition-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2mm;
    }
    .condition-name {
      font-size: 14px;
      font-weight: 700;
      color: ${COLORS.forest};
    }
    .probability-badge {
      background: ${COLORS.forest};
      color: white;
      padding: 1.5mm 3mm;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 700;
    }
    .condition-desc {
      font-size: 10px;
      color: #555;
      margin-bottom: 2mm;
    }
    .matched-label {
      font-size: 8px;
      color: #888;
      margin-bottom: 1mm;
    }
    .matched-list {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5mm;
    }
    .matched-item {
      background: ${COLORS.sage}30;
      padding: 1mm 2.5mm;
      border-radius: 8px;
      font-size: 8px;
      color: ${COLORS.forest};
    }
    /* 其他可能诊断 */
    .other-conditions {
      display: flex;
      flex-direction: column;
      gap: 2mm;
    }
    .other-condition {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2mm 3mm;
      background: white;
      border-radius: 2mm;
      border: 1px solid ${COLORS.sand};
    }
    .other-name {
      font-size: 10px;
      font-weight: 500;
    }
    .other-prob {
      font-size: 11px;
      font-weight: 600;
      color: ${COLORS.sage};
    }
    /* 建议步骤 */
    .steps-list {
      display: flex;
      flex-direction: column;
      gap: 2mm;
    }
    .step-item {
      display: flex;
      align-items: flex-start;
      gap: 2.5mm;
      padding: 2.5mm 3mm;
      background: white;
      border-radius: 2mm;
      border-left: 3px solid ${COLORS.sage};
    }
    .step-number {
      width: 5mm;
      height: 5mm;
      background: ${COLORS.forest};
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      font-weight: 600;
      flex-shrink: 0;
    }
    .step-text {
      font-size: 10px;
      color: ${COLORS.softBlack};
      line-height: 1.4;
    }
    /* 底部 */
    .footer {
      position: absolute;
      bottom: 10mm;
      left: 18mm;
      right: 18mm;
    }
    .disclaimer {
      background: ${COLORS.sand}50;
      padding: 3mm;
      border-radius: 2mm;
      font-size: 8px;
      color: #666;
      text-align: center;
      margin-bottom: 3mm;
    }
    .footer-info {
      display: flex;
      justify-content: space-between;
      font-size: 8px;
      color: #999;
    }
    /* 打印优化 */
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { margin: 0; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header-bar"></div>
    
    <div class="header">
      <div class="brand">
        <div class="logo-icon">BL</div>
        <div class="brand-text">
          <h1>Bio-Ledger</h1>
          <p>${isZh ? '智能健康评估系统' : 'Intelligent Health Assessment'}</p>
        </div>
      </div>
      <div class="report-meta">
        <p class="date">${data.date}</p>
        <p>ID: ${data.sessionId.slice(0, 8).toUpperCase()}</p>
      </div>
    </div>

    <div class="urgency-banner">
      <span class="urgency-label">${isZh ? urgencyInfo.zh : urgencyInfo.en}</span>
      <span class="urgency-desc">${isZh ? '建议处理方式' : 'Recommended Action'}</span>
    </div>

    <div class="main-content">
      <div class="left-col">
        <div class="card">
          <div class="card-title">${isZh ? '主诉' : 'Chief Complaint'}</div>
          <p class="complaint-text">${data.chiefComplaint}</p>
        </div>

        <div class="card">
          <div class="card-title">${isZh ? '相关症状' : 'Related Symptoms'}</div>
          <div class="symptoms-grid">
            ${data.symptoms.map(s => `<span class="symptom-tag">${s}</span>`).join('')}
          </div>
        </div>

        <div class="card primary-condition">
          <div class="card-title">${isZh ? '最可能的情况' : 'Most Likely Condition'}</div>
          <div class="condition-header">
            <span class="condition-name">${topCondition?.name || '-'}</span>
            <span class="probability-badge">${topCondition?.probability || 0}%</span>
          </div>
          <p class="condition-desc">${topCondition?.description || ''}</p>
          <p class="matched-label">${isZh ? '匹配症状:' : 'Matched:'}</p>
          <div class="matched-list">
            ${(topCondition?.matched_symptoms || []).map(s => `<span class="matched-item">${s}</span>`).join('')}
          </div>
        </div>

        ${otherConditions.length > 0 ? `
        <div class="card">
          <div class="card-title">${isZh ? '其他可能' : 'Other Possibilities'}</div>
          <div class="other-conditions">
            ${otherConditions.map(c => `
              <div class="other-condition">
                <span class="other-name">${c.name}</span>
                <span class="other-prob">${c.probability}%</span>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </div>

      <div class="right-col">
        <div class="card">
          <div class="card-title">${isZh ? '建议下一步' : 'Recommended Steps'}</div>
          <div class="steps-list">
            ${data.nextSteps.map((step, index) => `
              <div class="step-item">
                <span class="step-number">${index + 1}</span>
                <span class="step-text">${step.action}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="disclaimer">
        ⚠️ ${isZh 
          ? '此报告由 AI 生成，仅供参考，不能替代专业医疗诊断。如有疑虑，请咨询医生。' 
          : 'This AI-generated report is for reference only and cannot replace professional medical diagnosis.'}
      </div>
      <div class="footer-info">
        <span>Powered by Bio-Ledger Assessment Engine</span>
        <span>${isZh ? '生成时间' : 'Generated'}: ${new Date().toISOString().slice(0, 16).replace('T', ' ')}</span>
      </div>
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
    });
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
