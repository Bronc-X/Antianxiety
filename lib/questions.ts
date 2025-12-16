/**
 * Onboarding Questionnaire - 直击灵魂的代谢焦虑诊断
 * 
 * 目标用户：30-45岁，感受到新陈代谢下降但不知如何应对
 * 策略：用"感受词"而非医学术语，建立共鸣
 */

export interface QuestionOption {
  label: string;
  value: string;
  score: number; // 1-3: 1=症状轻微, 2=中等, 3=严重
}

export interface Question {
  id: string;
  question: string;
  description?: string;
  options: QuestionOption[];
  type: 'single' | 'multi';
}

export const ONBOARDING_FLOW: Question[] = [
  {
    id: 'energy_crash',
    question: '在下午 2 点到 4 点之间，你是否会感到一种"断崖式"的能量跌落？',
    description: '哪怕中午睡了觉，脑子也像蒙了一层雾？',
    type: 'single',
    options: [
      {
        label: '是的，这就是我的日常',
        value: 'severe_crash',
        score: 3,
      },
      {
        label: '偶尔会有',
        value: 'occasional_crash',
        score: 2,
      },
      {
        label: '几乎没有，精力很充沛',
        value: 'no_crash',
        score: 1,
      },
    ],
  },
  {
    id: 'sleep_maintenance',
    question: '入睡也许不难，但你是否经常在凌晨 3-4 点莫名醒来？',
    description: '脑子里开始像放电影一样过工作的事，然后再也睡不着？',
    type: 'single',
    options: [
      {
        label: '经常这样，非常痛苦',
        value: 'frequent_wakeup',
        score: 3,
      },
      {
        label: '偶尔醒来',
        value: 'occasional_wakeup',
        score: 2,
      },
      {
        label: '我通常一觉睡到天亮',
        value: 'sleep_well',
        score: 1,
      },
    ],
  },
  {
    id: 'body_composition',
    question: '你是否感觉，现在的你和几年前相比，明明吃得不多，但腰腹的肉却变得松松垮垮？',
    description: '怎么练都紧致不起来？',
    type: 'single',
    options: [
      {
        label: '完全说中了',
        value: 'severe_fat',
        score: 3,
      },
      {
        label: '稍微有一点',
        value: 'slight_fat',
        score: 2,
      },
      {
        label: '没有这个困扰',
        value: 'no_issue',
        score: 1,
      },
    ],
  },
  {
    id: 'stress_tolerance',
    question: '面对工作压力时，你现在的"耐受阈值"是否变低了？',
    description: '以前能轻松应对的琐事，现在很容易让你感到心跳加速或莫名烦躁？',
    type: 'single',
    options: [
      {
        label: '是的，变得很易怒/焦虑',
        value: 'low_tolerance',
        score: 3,
      },
      {
        label: '有时候会',
        value: 'medium_tolerance',
        score: 2,
      },
      {
        label: '我心态一直很稳',
        value: 'high_tolerance',
        score: 1,
      },
    ],
  },
  {
    id: 'previous_failures',
    question: '为了改善上述情况，你尝试过少吃碳水或强迫运动，结果发现除了更累、更易感冒外，并没有实质性好转？',
    description: '',
    type: 'single',
    options: [
      {
        label: '真的！试过很多次都失败了',
        value: 'frustrated',
        score: 3,
      },
      {
        label: '还没怎么尝试过',
        value: 'new_to_this',
        score: 2,
      },
      {
        label: '不，我的方法很有效',
        value: 'successful',
        score: 1,
      },
    ],
  },
];

export const ONBOARDING_FLOW_EN: Question[] = [
  {
    id: 'energy_crash',
    question: 'Between 2–4 PM, do you feel a sudden “cliff drop” in energy?',
    description: 'Even after a nap, does your brain still feel foggy?',
    type: 'single',
    options: [
      { label: "Yes — that's my daily life", value: 'severe_crash', score: 3 },
      { label: 'Sometimes', value: 'occasional_crash', score: 2 },
      { label: 'Rarely — I feel energetic', value: 'no_crash', score: 1 },
    ],
  },
  {
    id: 'sleep_maintenance',
    question: "Falling asleep may be easy — but do you often wake up around 3–4 AM for no reason?",
    description: 'Do work thoughts start playing like a movie, and you can’t fall back asleep?',
    type: 'single',
    options: [
      { label: 'Often — it’s exhausting', value: 'frequent_wakeup', score: 3 },
      { label: 'Occasionally', value: 'occasional_wakeup', score: 2 },
      { label: 'I usually sleep through the night', value: 'sleep_well', score: 1 },
    ],
  },
  {
    id: 'body_composition',
    question: 'Compared with a few years ago, do you feel your waist/abdomen got softer even if you don’t eat much?',
    description: 'No matter how you train, it won’t tighten up?',
    type: 'single',
    options: [
      { label: 'Exactly', value: 'severe_fat', score: 3 },
      { label: 'A little', value: 'slight_fat', score: 2 },
      { label: 'Not an issue for me', value: 'no_issue', score: 1 },
    ],
  },
  {
    id: 'stress_tolerance',
    question: 'Has your stress “tolerance threshold” gotten lower?',
    description: 'Do small things that used to be easy now trigger a racing heart or irritability?',
    type: 'single',
    options: [
      { label: 'Yes — more irritable/anxious', value: 'low_tolerance', score: 3 },
      { label: 'Sometimes', value: 'medium_tolerance', score: 2 },
      { label: "I'm usually steady", value: 'high_tolerance', score: 1 },
    ],
  },
  {
    id: 'previous_failures',
    question:
      'To fix the above, have you tried cutting carbs or forcing workouts—only to end up more exhausted and getting sick more often, with no real improvement?',
    description: '',
    type: 'single',
    options: [
      { label: 'Yes — I’ve failed many times', value: 'frustrated', score: 3 },
      { label: 'Not really tried yet', value: 'new_to_this', score: 2 },
      { label: 'No — my approach works well', value: 'successful', score: 1 },
    ],
  },
];

/**
 * 将问卷答案映射为代谢档案
 */
export interface MetabolicProfile {
  energy_pattern: 'crash_afternoon' | 'stable' | 'variable';
  sleep_pattern: 'cortisol_imbalance' | 'normal' | 'occasional_issue';
  body_pattern: 'metabolic_slowdown' | 'slight_change' | 'healthy';
  stress_pattern: 'low_tolerance' | 'medium_tolerance' | 'high_tolerance';
  psychology: 'frustrated' | 'curious' | 'successful';
  overall_score: number; // 总分 5-15
  severity: 'high' | 'medium' | 'low'; // 症状严重程度
}

export function mapAnswersToProfile(answers: Record<string, string>): MetabolicProfile {
  // 计算总分
  let totalScore = 0;
  const questions = ONBOARDING_FLOW;
  
  questions.forEach(q => {
    const answer = answers[q.id];
    const option = q.options.find(opt => opt.value === answer);
    if (option) {
      totalScore += option.score;
    }
  });

  // 映射能量模式
  const energyPattern = (() => {
    switch (answers.energy_crash) {
      case 'severe_crash':
        return 'crash_afternoon';
      case 'occasional_crash':
        return 'variable';
      default:
        return 'stable';
    }
  })();

  // 映射睡眠模式
  const sleepPattern = (() => {
    switch (answers.sleep_maintenance) {
      case 'frequent_wakeup':
        return 'cortisol_imbalance';
      case 'occasional_wakeup':
        return 'occasional_issue';
      default:
        return 'normal';
    }
  })();

  // 映射身体模式
  const bodyPattern = (() => {
    switch (answers.body_composition) {
      case 'severe_fat':
        return 'metabolic_slowdown';
      case 'slight_fat':
        return 'slight_change';
      default:
        return 'healthy';
    }
  })();

  // 映射压力耐受
  const stressPattern = (() => {
    switch (answers.stress_tolerance) {
      case 'low_tolerance':
        return 'low_tolerance';
      case 'medium_tolerance':
        return 'medium_tolerance';
      default:
        return 'high_tolerance';
    }
  })();

  // 映射心理状态
  const psychology = (() => {
    switch (answers.previous_failures) {
      case 'frustrated':
        return 'frustrated';
      case 'new_to_this':
        return 'curious';
      default:
        return 'successful';
    }
  })();

  // 确定严重程度
  const severity = (() => {
    if (totalScore >= 12) return 'high';
    if (totalScore >= 8) return 'medium';
    return 'low';
  })();

  return {
    energy_pattern: energyPattern,
    sleep_pattern: sleepPattern,
    body_pattern: bodyPattern,
    stress_pattern: stressPattern,
    psychology,
    overall_score: totalScore,
    severity,
  };
}

/**
 * 基于代谢档案生成初始AI人格描述
 */
export function generatePersonaContext(profile: MetabolicProfile): string {
  const patterns: string[] = [];

  if (profile.energy_pattern === 'crash_afternoon') {
    patterns.push('下午能量断崖式跌落');
  }
  if (profile.sleep_pattern === 'cortisol_imbalance') {
    patterns.push('凌晨3-4点醒来且难以再次入睡（皮质醇失衡）');
  }
  if (profile.body_pattern === 'metabolic_slowdown') {
    patterns.push('腰腹脂肪堆积且难以减少（代谢减缓）');
  }
  if (profile.stress_pattern === 'low_tolerance') {
    patterns.push('压力耐受阈值明显降低');
  }

  const psychologyText = 
    profile.psychology === 'frustrated'
      ? '曾多次尝试节食或强制运动但失败，感到挫败'
      : profile.psychology === 'curious'
      ? '对健康优化充满好奇，但尚未找到有效方法'
      : '已找到适合自己的健康管理方法';

  return `
用户代谢档案（Metabolic Profile）:
- 症状严重程度: ${profile.severity === 'high' ? '高' : profile.severity === 'medium' ? '中等' : '轻微'}
- 主要症状: ${patterns.join('、')}
- 心理状态: ${psychologyText}

指导原则:
1. 用共情但科学的语气回应（避免空洞的"加油"）
2. 优先解释"为什么"（生理机制）而非直接给建议
3. 推荐"最低有效剂量"的干预（如5分钟步行而非1小时跑步）
4. 认可用户之前的努力，强调"不是你的错，是方法不对"
  `.trim();
}
