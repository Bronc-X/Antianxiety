/**
 * Active Inquiry Service
 * 主动询问服务 - 基于用户数据生成贝叶斯诊断问题
 */

export interface DailyLog {
  id?: string;
  user_id?: string;
  sleep_hours: number | null;
  hrv: number | null;
  stress_level: number | null;
  exercise_duration_minutes: number | null;
  created_at?: string;
  hrv_timestamps?: { time: string; value: number }[];
}

export interface UserProfile {
  full_name?: string;
  nickname?: string;
  preferred_name?: string;
}

export interface ActiveInquiryContext {
  dailyLogs: DailyLog[];
  profile?: UserProfile | null;
}

export interface DiagnosticQuestion {
  question: string;
  questionZh: string;
  dataPoints: string[];
  possibleTriggers: string[];
  priority: 'high' | 'medium' | 'low';
}

// 禁止的通用问候语
const FORBIDDEN_GREETINGS = [
  'How can I help',
  'What can I do for you',
  'Hello, how are you',
  '有什么可以帮你',
  '需要什么帮助'
];

/**
 * 生成主动询问问题
 * @param context 用户上下文（包含日志和档案）
 */
export function generateActiveInquiry(context: ActiveInquiryContext): DiagnosticQuestion {
  const latestLog = context.dailyLogs?.[0];
  const displayName = getDisplayName(context.profile);
  
  // 没有数据时的默认问题
  if (!latestLog) {
    return {
      question: `${displayName}, I don't have your recent biometrics yet. How are you feeling right now - energized, tired, or somewhere in between?`,
      questionZh: `${displayName}，我还没有你最近的生物数据。你现在感觉如何——精力充沛、疲惫，还是介于两者之间？`,
      dataPoints: [],
      possibleTriggers: [],
      priority: 'low'
    };
  }
  
  // 检测 HRV 低值模式 (高优先级)
  if (latestLog.hrv !== null && latestLog.hrv < 50) {
    return {
      question: `${displayName}, I noticed your HRV dipped to ${latestLog.hrv}ms. Was there a specific stress trigger, or did you have a high-carb lunch?`,
      questionZh: `${displayName}，我注意到你的 HRV 降到了 ${latestLog.hrv}ms。是有特定的压力触发因素，还是午餐吃了高碳水食物？`,
      dataPoints: [`HRV: ${latestLog.hrv}ms`],
      possibleTriggers: ['stress event', 'high-carb meal', 'poor sleep', 'dehydration'],
      priority: 'high'
    };
  }
  
  // 检测睡眠不足模式 (高优先级)
  if (latestLog.sleep_hours !== null && latestLog.sleep_hours < 6) {
    return {
      question: `${displayName}, your sleep was ${latestLog.sleep_hours}h last night. Was this due to late work, difficulty falling asleep, or early waking?`,
      questionZh: `${displayName}，你昨晚只睡了 ${latestLog.sleep_hours} 小时。是因为工作太晚、入睡困难，还是早醒？`,
      dataPoints: [`Sleep: ${latestLog.sleep_hours}h`],
      possibleTriggers: ['late work', 'insomnia', 'early waking', 'environment noise'],
      priority: 'high'
    };
  }
  
  // 检测高压力模式 (中优先级)
  if (latestLog.stress_level !== null && latestLog.stress_level > 7) {
    return {
      question: `${displayName}, your stress level is at ${latestLog.stress_level}/10. Is this from work pressure, personal matters, or physical discomfort?`,
      questionZh: `${displayName}，你的压力水平达到了 ${latestLog.stress_level}/10。这是来自工作压力、个人事务，还是身体不适？`,
      dataPoints: [`Stress: ${latestLog.stress_level}/10`],
      possibleTriggers: ['work pressure', 'personal matters', 'physical discomfort', 'uncertainty'],
      priority: 'medium'
    };
  }
  
  // 检测缺乏运动模式 (低优先级)
  if (latestLog.exercise_duration_minutes !== null && latestLog.exercise_duration_minutes < 10) {
    return {
      question: `${displayName}, I see minimal movement today (${latestLog.exercise_duration_minutes} min). Would a short walk help clear your mind?`,
      questionZh: `${displayName}，今天活动量较少（${latestLog.exercise_duration_minutes} 分钟）。短暂散步会帮助你理清思绪吗？`,
      dataPoints: [`Exercise: ${latestLog.exercise_duration_minutes} min`],
      possibleTriggers: ['busy schedule', 'low energy', 'weather', 'motivation'],
      priority: 'low'
    };
  }
  
  // 数据正常时的上下文问候
  return {
    question: `${displayName}, your biometrics look balanced today. What's on your mind?`,
    questionZh: `${displayName}，你今天的生物指标看起来很平衡。有什么想聊的吗？`,
    dataPoints: buildDataPointsSummary(latestLog),
    possibleTriggers: [],
    priority: 'low'
  };
}

/**
 * 验证问候语不包含通用短语
 */
export function isValidActiveInquiry(question: string): boolean {
  const lowerQuestion = question.toLowerCase();
  return !FORBIDDEN_GREETINGS.some(greeting => 
    lowerQuestion.includes(greeting.toLowerCase())
  );
}

/**
 * 获取显示名称
 */
function getDisplayName(profile?: UserProfile | null): string {
  if (!profile) return '';
  const candidates = [
    profile.preferred_name,
    profile.nickname,
    profile.full_name
  ];
  const found = candidates.find(name => name && name.trim().length > 0);
  return found ? found.trim() : '';
}

/**
 * 构建数据点摘要
 */
function buildDataPointsSummary(log: DailyLog): string[] {
  const points: string[] = [];
  if (log.sleep_hours !== null) points.push(`Sleep: ${log.sleep_hours}h`);
  if (log.hrv !== null) points.push(`HRV: ${log.hrv}ms`);
  if (log.stress_level !== null) points.push(`Stress: ${log.stress_level}/10`);
  if (log.exercise_duration_minutes !== null) points.push(`Exercise: ${log.exercise_duration_minutes}min`);
  return points;
}
