import { Condition, UrgencyLevel, AnswerRecord } from '@/types/assessment';

export interface ReportGenerationInput {
  sessionId: string;
  chiefComplaint: string;
  symptoms: string[];
  history: AnswerRecord[];
  demographics: {
    biological_sex?: 'male' | 'female';
    age?: number;
    smoking_status?: 'never' | 'former' | 'current';
    medical_history?: string[];
  };
  language: 'zh' | 'en';
}

export interface GeneratedReport {
  conditions: Condition[];
  urgency: UrgencyLevel;
  next_steps: { action: string; icon: string }[];
  disclaimer: string;
}

/**
 * 根据症状和历史生成报告内容
 * 这是一个辅助函数，用于在 AI 生成报告后进行后处理
 */
export function processReportConditions(
  conditions: Array<{
    name: string;
    description: string;
    probability: number;
    matched_symptoms: string[];
  }>
): Condition[] {
  // 按概率降序排序
  const sorted = [...conditions].sort((a, b) => b.probability - a.probability);
  
  // 标记最佳匹配
  return sorted.map((c, index) => ({
    ...c,
    is_best_match: index === 0,
  }));
}

/**
 * 根据紧急程度生成下一步建议
 */
export function generateNextSteps(
  urgency: UrgencyLevel,
  language: 'zh' | 'en'
): { action: string; icon: string }[] {
  const steps: Record<UrgencyLevel, { action_zh: string; action_en: string; icon: string }[]> = {
    emergency: [
      { action_zh: '立即拨打急救电话 120', action_en: 'Call emergency services 911 immediately', icon: '🚨' },
      { action_zh: '前往最近的急诊室', action_en: 'Go to the nearest emergency room', icon: '🏥' },
      { action_zh: '不要独自驾车', action_en: 'Do not drive yourself', icon: '🚗' },
    ],
    urgent: [
      { action_zh: '24小时内就医', action_en: 'See a doctor within 24 hours', icon: '🏥' },
      { action_zh: '如症状加重，立即就医', action_en: 'Seek immediate care if symptoms worsen', icon: '⚠️' },
      { action_zh: '记录症状变化', action_en: 'Keep track of symptom changes', icon: '📝' },
    ],
    routine: [
      { action_zh: '预约医生门诊', action_en: 'Schedule a doctor appointment', icon: '📅' },
      { action_zh: '保持充足休息', action_en: 'Get adequate rest', icon: '🛏️' },
      { action_zh: '多喝水', action_en: 'Stay hydrated', icon: '💧' },
    ],
    self_care: [
      { action_zh: '在家休息观察', action_en: 'Rest and monitor at home', icon: '🏠' },
      { action_zh: '可使用非处方药缓解症状', action_en: 'OTC medications may help relieve symptoms', icon: '💊' },
      { action_zh: '如症状持续超过一周，请就医', action_en: 'See a doctor if symptoms persist over a week', icon: '📞' },
    ],
  };

  return steps[urgency].map(s => ({
    action: language === 'zh' ? s.action_zh : s.action_en,
    icon: s.icon,
  }));
}

/**
 * 生成免责声明
 */
export function generateDisclaimer(language: 'zh' | 'en'): string {
  return language === 'zh'
    ? '此评估仅供参考，不能替代专业医疗诊断。如有疑虑，请咨询医生。本系统不提供医疗建议、诊断或治疗。'
    : 'This assessment is for reference only and cannot replace professional medical diagnosis. Please consult a doctor if you have concerns. This system does not provide medical advice, diagnosis, or treatment.';
}

/**
 * 根据条件确定紧急程度
 */
export function determineUrgency(
  conditions: Array<{ name: string; probability: number }>,
  symptoms: string[]
): UrgencyLevel {
  // 高危症状关键词
  const emergencyKeywords = ['心脏病', '心肌梗塞', '中风', '脑卒中', 'heart attack', 'stroke', 'cardiac'];
  const urgentKeywords = ['感染', '发烧', '高血压', 'infection', 'fever', 'hypertension'];
  
  const allText = [
    ...conditions.map(c => c.name.toLowerCase()),
    ...symptoms.map(s => s.toLowerCase()),
  ].join(' ');

  // 检查紧急情况
  if (emergencyKeywords.some(k => allText.includes(k.toLowerCase()))) {
    return 'emergency';
  }

  // 检查紧迫情况
  if (urgentKeywords.some(k => allText.includes(k.toLowerCase()))) {
    return 'urgent';
  }

  // 根据最高概率条件判断
  const topCondition = conditions[0];
  if (topCondition && topCondition.probability >= 70) {
    return 'routine';
  }

  return 'self_care';
}

/**
 * 格式化报告用于存储
 */
export function formatReportForStorage(report: GeneratedReport) {
  return {
    conditions: report.conditions,
    urgency: report.urgency,
    next_steps: report.next_steps,
  };
}
