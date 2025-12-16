/**
 * Daily Calibration Service
 * 处理每日校准数据的对比、异常检测和任务生成
 */

// ============ Types ============

export type StressLevel = 'low' | 'medium' | 'high';
export type ExerciseIntention = 'rest' | 'moderate' | 'challenge';
export type AnomalyType = 'sleep_deficit' | 'high_stress' | 'none';
export type InquiryType = 'sleep' | 'stress';

export interface CalibrationInput {
  sleep_hours: number;
  stress_level: StressLevel;
  exercise_intention: ExerciseIntention;
  timestamp: string;
}

export interface CalibrationRecord extends CalibrationInput {
  id?: string;
  user_id?: string;
  inquiry_response?: string;
  generated_task?: string;
}

export interface AnomalyResult {
  type: AnomalyType;
  inquiry?: InquiryType;
  message?: string;
  delta?: number;
}

export interface WeeklyStats {
  avg_sleep: number;
  avg_stress: number; // 0=low, 1=medium, 2=high
  count: number;
}

// ============ Constants ============

const SLEEP_ANOMALY_THRESHOLD = 1.5; // hours below average
const STRESS_LEVEL_MAP: Record<StressLevel, number> = { low: 0, medium: 1, high: 2 };
const STRESS_NUM_MAP: Record<number, StressLevel> = { 0: 'low', 1: 'medium', 2: 'high' };

// ============ Serialization ============

export function serializeCalibration(input: CalibrationInput): string {
  return JSON.stringify(input);
}

export function deserializeCalibration(json: string): CalibrationInput {
  const parsed = JSON.parse(json);
  return {
    sleep_hours: parsed.sleep_hours,
    stress_level: parsed.stress_level,
    exercise_intention: parsed.exercise_intention,
    timestamp: parsed.timestamp,
  };
}

// ============ Weekly Stats Calculation ============

export function calculateWeeklyStats(records: CalibrationRecord[]): WeeklyStats {
  if (records.length === 0) {
    return { avg_sleep: 7, avg_stress: 1, count: 0 }; // defaults
  }

  const totalSleep = records.reduce((sum, r) => sum + r.sleep_hours, 0);
  const totalStress = records.reduce((sum, r) => sum + STRESS_LEVEL_MAP[r.stress_level], 0);

  return {
    avg_sleep: totalSleep / records.length,
    avg_stress: totalStress / records.length,
    count: records.length,
  };
}

// ============ Anomaly Detection ============

export function detectAnomalies(
  current: CalibrationInput,
  weeklyStats: WeeklyStats
): AnomalyResult[] {
  const anomalies: AnomalyResult[] = [];

  // Sleep deficit check
  const sleepDelta = weeklyStats.avg_sleep - current.sleep_hours;
  if (sleepDelta >= SLEEP_ANOMALY_THRESHOLD) {
    anomalies.push({
      type: 'sleep_deficit',
      inquiry: 'sleep',
      message: `睡眠时长显著低于本周平均水平（-${sleepDelta.toFixed(1)}h）`,
      delta: sleepDelta,
    });
  }

  // Stress elevation check
  const currentStressNum = STRESS_LEVEL_MAP[current.stress_level];
  if (currentStressNum > weeklyStats.avg_stress + 0.5) {
    anomalies.push({
      type: 'high_stress',
      inquiry: 'stress',
      message: '检测到压力水平高于本周平均',
      delta: currentStressNum - weeklyStats.avg_stress,
    });
  }

  return anomalies;
}

// ============ Inquiry Questions ============

export interface InquiryQuestion {
  question: string;
  options: { label: string; value: string; emoji: string }[];
}

export function getInquiryQuestion(anomaly: AnomalyResult): InquiryQuestion | null {
  if (anomaly.type === 'sleep_deficit') {
    return {
      question: `收到。${anomaly.message}。是昨晚入睡困难，还是早起有事？`,
      options: [
        { label: '入睡困难', value: 'hard_to_sleep', emoji: '😵' },
        { label: '早起有事', value: 'early_wake', emoji: '⏰' },
      ],
    };
  }

  if (anomaly.type === 'high_stress') {
    return {
      question: `${anomaly.message}。是工作压力，还是身体疲劳？`,
      options: [
        { label: '工作压力', value: 'work_pressure', emoji: '💼' },
        { label: '身体疲劳', value: 'physical_fatigue', emoji: '🏃' },
      ],
    };
  }

  return null;
}

// ============ Task Generation ============

export interface GeneratedTask {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  mode: 'low_energy' | 'normal' | 'challenge';
}

export function generateTask(
  anomalies: AnomalyResult[],
  inquiryResponse?: string
): GeneratedTask {
  // Sleep deficit with trouble sleeping
  if (anomalies.some(a => a.type === 'sleep_deficit') && inquiryResponse === 'hard_to_sleep') {
    return {
      title: '午间 15 分钟 NSDR 休息',
      titleEn: '15-min NSDR Rest at Noon',
      description: '明白了。今日进入"低耗能模式"，建议午间进行 NSDR（非睡眠深度休息）。',
      descriptionEn: 'Got it. Entering "low energy mode" today. Recommend NSDR (Non-Sleep Deep Rest) at noon.',
      mode: 'low_energy',
    };
  }

  // Sleep deficit with early wake
  if (anomalies.some(a => a.type === 'sleep_deficit') && inquiryResponse === 'early_wake') {
    return {
      title: '今晚提前 30 分钟入睡',
      titleEn: 'Sleep 30 Minutes Earlier Tonight',
      description: '了解。建议今晚提前入睡以补充睡眠债务。',
      descriptionEn: 'Understood. Recommend sleeping earlier tonight to repay sleep debt.',
      mode: 'low_energy',
    };
  }

  // High stress with work pressure
  if (anomalies.some(a => a.type === 'high_stress') && inquiryResponse === 'work_pressure') {
    return {
      title: '5 分钟盒式呼吸',
      titleEn: '5-min Box Breathing',
      description: '工作压力会提升皮质醇。建议进行盒式呼吸来调节自主神经。',
      descriptionEn: 'Work pressure elevates cortisol. Recommend box breathing to regulate autonomic nervous system.',
      mode: 'normal',
    };
  }

  // High stress with physical fatigue
  if (anomalies.some(a => a.type === 'high_stress') && inquiryResponse === 'physical_fatigue') {
    return {
      title: '轻度拉伸 10 分钟',
      titleEn: '10-min Light Stretching',
      description: '身体疲劳需要主动恢复。建议进行轻度拉伸促进血液循环。',
      descriptionEn: 'Physical fatigue needs active recovery. Recommend light stretching to improve circulation.',
      mode: 'low_energy',
    };
  }

  // No anomalies - normal mode
  return {
    title: '系统稳定，准备生成计划',
    titleEn: 'System Stable, Ready for Planning',
    description: '你的状态良好，可以按正常节奏进行今日活动。',
    descriptionEn: 'Your status is good. You can proceed with today\'s activities at normal pace.',
    mode: 'normal',
  };
}

// ============ Stress Level Helpers ============

export function stressLevelToNumber(level: StressLevel): number {
  return STRESS_LEVEL_MAP[level];
}

export function numberToStressLevel(num: number): StressLevel {
  const rounded = Math.round(Math.max(0, Math.min(2, num)));
  return STRESS_NUM_MAP[rounded];
}
