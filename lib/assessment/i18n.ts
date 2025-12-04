/**
 * Assessment Engine 多语言支持
 */

export type SupportedLanguage = 'zh' | 'en';

// UI 标签本地化
export const UI_LABELS = {
  // 通用
  back: { zh: '返回', en: 'Back' },
  continue: { zh: '继续', en: 'Continue' },
  skip: { zh: '跳过', en: 'Skip' },
  confirm: { zh: '确认', en: 'Confirm' },
  cancel: { zh: '取消', en: 'Cancel' },
  loading: { zh: '加载中...', en: 'Loading...' },
  
  // 欢迎页
  welcome_title: { zh: '健康评估', en: 'Health Assessment' },
  welcome_subtitle: { zh: '让我们了解您的症状', en: "Let's understand your symptoms" },
  welcome_description: { 
    zh: '这个评估将帮助您了解可能的健康状况。请如实回答问题，以获得最准确的结果。', 
    en: 'This assessment will help you understand possible health conditions. Please answer honestly for the most accurate results.' 
  },
  welcome_disclaimer: { 
    zh: '此评估不能替代专业医疗诊断', 
    en: 'This assessment cannot replace professional medical diagnosis' 
  },
  start_assessment: { zh: '开始评估', en: 'Start Assessment' },
  
  // 基线问题
  baseline_sex_question: { zh: '您的生理性别是？', en: 'What is your biological sex?' },
  baseline_sex_description: { 
    zh: '生理性别是某些疾病的风险因素，您的回答对于准确评估很重要。', 
    en: 'Biological sex is a risk factor for some conditions. Your answer is necessary for an accurate assessment.' 
  },
  baseline_age_question: { zh: '您的年龄是？', en: 'How old are you?' },
  baseline_smoking_question: { zh: '您吸烟吗？', en: 'Do you smoke?' },
  
  // 选项
  option_male: { zh: '男性', en: 'Male' },
  option_female: { zh: '女性', en: 'Female' },
  option_never_smoked: { zh: '从不吸烟', en: 'Never smoked' },
  option_former_smoker: { zh: '已戒烟', en: 'Former smoker' },
  option_current_smoker: { zh: '目前吸烟', en: 'Current smoker' },
  option_unknown: { zh: '我不知道', en: "I don't know" },
  
  // 主诉
  chief_complaint_question: { zh: '您今天哪里不舒服？', en: 'What brings you here today?' },
  chief_complaint_description: { 
    zh: '请描述您的主要症状，例如：头痛、胸闷、膝盖痛...', 
    en: 'Please describe your main symptom, e.g., headache, chest tightness, knee pain...' 
  },
  add_symptom: { zh: '添加症状', en: 'Add symptom' },
  confirm_symptoms: { zh: '确认症状', en: 'Confirm symptoms' },
  
  // 报告
  report_title: { zh: '评估报告', en: 'Assessment Report' },
  best_match: { zh: '最佳匹配', en: 'Best match' },
  matched_symptoms: { zh: '匹配的症状', en: 'Your match' },
  next_steps: { zh: '下一步', en: 'Next steps' },
  download_pdf: { zh: '下载 PDF', en: 'Download PDF' },
  send_email: { zh: '发送邮件', en: 'Email' },
  email_sent: { zh: '已发送', en: 'Sent' },
  history: { zh: '历史记录', en: 'History' },
  
  // 紧急程度
  urgency_emergency: { zh: '紧急', en: 'Emergency' },
  urgency_urgent: { zh: '尽快就医', en: 'Urgent' },
  urgency_routine: { zh: '建议就医', en: 'See a doctor' },
  urgency_self_care: { zh: '自我护理', en: 'Self-care' },
  
  // 紧急警报
  emergency_title: { zh: '紧急警告', en: 'Emergency Alert' },
  emergency_call: { zh: '立即拨打', en: 'Call now' },
  emergency_dismiss: { zh: '我已了解', en: 'I understand' },
  
  // 错误消息
  error_session_not_found: { zh: '找不到您的评估会话，请重新开始', en: 'Session not found, please start again' },
  error_session_expired: { zh: '您的评估会话已过期，请重新开始', en: 'Your session has expired, please start again' },
  error_invalid_request: { zh: '请求格式有误，请稍后重试', en: 'Invalid request format, please try again' },
  error_ai_unavailable: { zh: 'AI 暂时无法响应，请稍后重试', en: 'AI temporarily unavailable, please try again' },
  error_database: { zh: '数据保存失败，请稍后重试', en: 'Failed to save data, please try again' },
  error_generic: { zh: '服务暂时不可用', en: 'Service temporarily unavailable' },
  
  // 免责声明
  disclaimer: { 
    zh: '此评估仅供参考，不能替代专业医疗诊断。如有疑虑，请咨询医生。本系统不提供医疗建议、诊断或治疗。', 
    en: 'This assessment is for reference only and cannot replace professional medical diagnosis. Please consult a doctor if you have concerns. This system does not provide medical advice, diagnosis, or treatment.' 
  },
} as const;

/**
 * 获取本地化文本
 */
export function t(key: keyof typeof UI_LABELS, language: SupportedLanguage): string {
  return UI_LABELS[key][language];
}

/**
 * 从浏览器/系统设置检测语言
 */
export function detectLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'zh';
  
  const browserLang = navigator.language || (navigator as any).userLanguage;
  
  if (browserLang.startsWith('zh')) return 'zh';
  if (browserLang.startsWith('en')) return 'en';
  
  // 默认中文
  return 'zh';
}

/**
 * 验证语言代码
 */
export function isValidLanguage(lang: string): lang is SupportedLanguage {
  return lang === 'zh' || lang === 'en';
}

/**
 * 获取语言显示名称
 */
export function getLanguageDisplayName(lang: SupportedLanguage): string {
  return lang === 'zh' ? '中文' : 'English';
}

/**
 * 年龄范围选项
 */
export const AGE_RANGE_OPTIONS = [
  { value: '0-17', label_zh: '17岁以下', label_en: 'Under 18' },
  { value: '18-29', label_zh: '18-29岁', label_en: '18-29' },
  { value: '30-44', label_zh: '30-44岁', label_en: '30-44' },
  { value: '45-59', label_zh: '45-59岁', label_en: '45-59' },
  { value: '60-74', label_zh: '60-74岁', label_en: '60-74' },
  { value: '75+', label_zh: '75岁以上', label_en: '75 or older' },
];

/**
 * 获取年龄范围选项（本地化）
 */
export function getAgeRangeOptions(language: SupportedLanguage) {
  return AGE_RANGE_OPTIONS.map(opt => ({
    value: opt.value,
    label: language === 'zh' ? opt.label_zh : opt.label_en,
  }));
}
