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

export interface PlanItem {
  id?: string;
  text: string;
  status?: 'pending' | 'completed' | 'skipped';
  order?: number;
  index?: number;
}

export interface ActivePlan {
  id: string;
  title: string;
  created_at: string;
  items?: PlanItem[]; // New: Structured items
  content?: string; // Fallback: Raw content
}

export interface ActiveInquiryContext {
  dailyLogs: DailyLog[];
  profile?: UserProfile | null;
  activePlan?: ActivePlan | null; // New: Active Plan Context
  currentTime?: Date; // To determine morning/evening
}

export interface DiagnosticQuestion {
  question: string;
  questionZh: string;
  dataPoints: string[];
  possibleTriggers: string[];
  priority: 'high' | 'medium' | 'low';
  type: 'biometric' | 'plan_execution' | 'plan_review'; // Added plan_review
  reviewItems?: PlanItem[]; // Items to review
}

export enum CheckInType {
  MORNING = 'morning',
  EVENING = 'evening'
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
  const now = context.currentTime || new Date();
  const hour = now.getHours();
  const isMorning = hour >= 5 && hour < 12;

  // 1. 优先检查计划执行情况 (Day 2+)
  if (context.activePlan) {
    const planStartDate = new Date(context.activePlan.created_at);
    const dayDiff = Math.floor((now.getTime() - planStartDate.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDiff >= 1) {
      // 如果是第二天或以后
      return generatePlanExecutionCheckIn(context.activePlan, displayName, dayDiff, isMorning);
    }
  }

  // 2. 如果没有计划或计划第一天，回退到生物数据/状态检查
  return generateBiometricCheckIn(latestLog, displayName, isMorning);
}

/**
 * 生成计划执行检查 (Day 2+)
 */
function generatePlanExecutionCheckIn(plan: ActivePlan, name: string, day: number, isMorning: boolean): DiagnosticQuestion {
  // 尝试解析 Plan Items
  const items = plan.items || [];
  const hasItems = items.length > 0;

  // Fallback if no items
  let focusItem = "上次制定的计划";
  if (hasItems) {
    focusItem = `"${items[0].text.substring(0, 15)}..."`;
  } else if (plan.content) {
    const match = plan.content.match(/(?:1\.|-|•)\s*([^。\\n]+)/);
    if (match) focusItem = `"${match[1].substring(0, 15)}..."`;
  }

  if (isMorning) {
    // Morning: Readiness Check
    return {
      question: `${name}, Day ${day + 1} of "${plan.title}". Let's review your plan for today. Please select any items you feel might be difficult to stick to, and we can adjust them.`,
      questionZh: `${name}，今天是执行"${plan.title}"的第 ${day + 1} 天。让我们回顾一下今天的计划。请勾选你觉得今天可能**难以坚持**的项目，我们可以调整。`,
      dataPoints: [`Plan: ${plan.title}`, `Day: ${day + 1}`],
      possibleTriggers: ['motivation', 'schedule conflict', 'fatigue'],
      priority: 'medium',
      type: 'plan_review',
      reviewItems: items // Send items for checklist
    };
  } else {
    // Evening: Review
    return {
      question: `${name}, Day ${day + 1} of "${plan.title}" complete. How did it go? Please select any items that you found **difficult** or **unsuitable** today, so we can find replacements.`,
      questionZh: `${name}，"${plan.title}"执行的第 ${day + 1} 天结束了。感觉如何？请勾选今天觉得**执行困难**或**不适合**的项目，我们来找找平替方案。`,
      dataPoints: [`Plan: ${plan.title}`, `Day: ${day + 1}`],
      possibleTriggers: ['completion rate', 'habit formation', 'satisfaction'],
      priority: 'medium',
      type: 'plan_review',
      reviewItems: items // Send items for checklist
    };
  }
}


/**
 * 生成生物数据/状态检查 (Day 1 or No Plan)
 */
function generateBiometricCheckIn(latestLog: DailyLog | undefined, name: string, isMorning: boolean): DiagnosticQuestion {
  // 没有数据时的默认问题
  if (!latestLog) {
    if (isMorning) {
      return {
        question: `${name}, good morning. How did you sleep? Starting the day with full battery or low energy?`,
        questionZh: `${name}，早安。昨晚睡得怎么样？今天起床感觉精力如何？`,
        dataPoints: [],
        possibleTriggers: [],
        priority: 'low',
        type: 'biometric'
      };
    } else {
      return {
        question: `${name}, evening check-in. How was your energy throughout the day? Any specific fatigue or stress?`,
        questionZh: `${name}，晚上好。今天一整天精力感觉如何？有没有特别累或压力大的时候？`,
        dataPoints: [],
        possibleTriggers: [],
        priority: 'low',
        type: 'biometric'
      };
    }
  }

  // 检测 HRV 低值模式 (高优先级)
  if (latestLog.hrv !== null && latestLog.hrv < 50) {
    return {
      question: `${name}, I noticed your HRV dipped to ${latestLog.hrv}ms. Was there a specific stress trigger, or did you have a high-carb lunch?`,
      questionZh: `${name}，我注意到你的 HRV 降到了 ${latestLog.hrv}ms。是有特定的压力触发因素，还是午餐吃了高碳水食物？`,
      dataPoints: [`HRV: ${latestLog.hrv}ms`],
      possibleTriggers: ['stress event', 'high-carb meal', 'poor sleep', 'dehydration'],
      priority: 'high',
      type: 'biometric'
    };
  }

  // 检测睡眠不足模式 (高优先级)
  if (latestLog.sleep_hours !== null && latestLog.sleep_hours < 6) {
    return {
      question: `${name}, your sleep was ${latestLog.sleep_hours}h last night. Was this due to late work, difficulty falling asleep, or early waking?`,
      questionZh: `${name}，你昨晚只睡了 ${latestLog.sleep_hours} 小时。是因为工作太晚、入睡困难，还是早醒？`,
      dataPoints: [`Sleep: ${latestLog.sleep_hours}h`],
      possibleTriggers: ['late work', 'insomnia', 'early waking', 'environment noise'],
      priority: 'high',
      type: 'biometric'
    };
  }

  // 检测高压力模式 (中优先级)
  if (latestLog.stress_level !== null && latestLog.stress_level > 7) {
    return {
      question: `${name}, your stress level is at ${latestLog.stress_level}/10. Is this from work pressure, personal matters, or physical discomfort?`,
      questionZh: `${name}，你的压力水平达到了 ${latestLog.stress_level}/10。这是来自工作压力、个人事务，还是身体不适？`,
      dataPoints: [`Stress: ${latestLog.stress_level}/10`],
      possibleTriggers: ['work pressure', 'personal matters', 'physical discomfort', 'uncertainty'],
      priority: 'medium',
      type: 'biometric'
    };
  }

  // 检测缺乏运动模式 (低优先级)
  if (latestLog.exercise_duration_minutes !== null && latestLog.exercise_duration_minutes < 10) {
    return {
      question: `${name}, I see minimal movement today (${latestLog.exercise_duration_minutes} min). Would a short walk help clear your mind?`,
      questionZh: `${name}，今天活动量较少（${latestLog.exercise_duration_minutes} 分钟）。短暂散步会帮助你理清思绪吗？`,
      dataPoints: [`Exercise: ${latestLog.exercise_duration_minutes} min`],
      possibleTriggers: ['busy schedule', 'low energy', 'weather', 'motivation'],
      priority: 'low',
      type: 'biometric'
    };
  }

  // 数据正常时的上下文问候
  return {
    question: `${name}, your biometrics look balanced today. What's on your mind?`,
    questionZh: `${name}，你今天的生物指标看起来很平衡。有什么想聊的吗？`,
    dataPoints: buildDataPointsSummary(latestLog),
    possibleTriggers: [],
    priority: 'low',
    type: 'biometric'
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
