// lib/energy-calculator.ts
// 能量计算器模块 - 基于用户健康数据计算综合能量值
// Requirements: 1.1, 4.4

/**
 * 能量计算输入参数
 */
export interface EnergyCalculationInput {
  sleepHours: number | null;           // 睡眠时长（小时）
  sleepQuality: string | null;         // 睡眠质量
  exerciseMinutes: number | null;      // 运动时长（分钟）
  stressLevel: number | null;          // 压力等级 1-10
  hrv: number | null;                  // 心率变异性
  metabolicResetCompletion: number;    // 代谢重置完成率 0-100
}

/**
 * 单项因素得分详情
 */
export interface FactorScore {
  score: number;        // 0-100
  weight: number;       // 权重 0-1
  description: string;  // 中文描述
  descriptionEn: string; // 英文描述
}

/**
 * 能量分解结果
 */
export interface EnergyBreakdown {
  totalScore: number;   // 总分 0-100
  factors: {
    sleep: FactorScore;
    exercise: FactorScore;
    stress: FactorScore;
    recovery: FactorScore;
    habits: FactorScore;
  };
}

/**
 * 睡眠质量映射表
 */
const SLEEP_QUALITY_SCORES: Record<string, number> = {
  'excellent': 100,
  'good': 85,
  'average': 65,
  'poor': 40,
  'very_poor': 20,
};

/**
 * 计算睡眠得分
 * 基于睡眠时长和质量综合评估
 */
function calculateSleepScore(hours: number | null, quality: string | null): FactorScore {
  let score = 50; // 默认值
  let description = '数据不足，使用默认值';
  let descriptionEn = 'Insufficient data, using default';

  if (hours !== null) {
    // 最佳睡眠时长 7-8 小时
    if (hours >= 7 && hours <= 8) {
      score = 100;
      description = '睡眠时长理想（7-8小时）';
      descriptionEn = 'Optimal sleep duration (7-8 hours)';
    } else if (hours >= 6 && hours < 7) {
      score = 75;
      description = '睡眠时长略短（6-7小时）';
      descriptionEn = 'Slightly short sleep (6-7 hours)';
    } else if (hours > 8 && hours <= 9) {
      score = 85;
      description = '睡眠时长充足（8-9小时）';
      descriptionEn = 'Adequate sleep (8-9 hours)';
    } else if (hours >= 5 && hours < 6) {
      score = 50;
      description = '睡眠不足（5-6小时）';
      descriptionEn = 'Insufficient sleep (5-6 hours)';
    } else if (hours < 5) {
      score = 25;
      description = '严重睡眠不足（<5小时）';
      descriptionEn = 'Severe sleep deprivation (<5 hours)';
    } else if (hours > 9) {
      score = 70;
      description = '睡眠过长（>9小时），可能需关注';
      descriptionEn = 'Oversleeping (>9 hours), may need attention';
    }
  }

  // 睡眠质量调整
  if (quality && SLEEP_QUALITY_SCORES[quality] !== undefined) {
    const qualityScore = SLEEP_QUALITY_SCORES[quality];
    score = Math.round((score + qualityScore) / 2);
    
    if (quality === 'excellent') {
      description += '，睡眠质量极佳';
      descriptionEn += ', excellent sleep quality';
    } else if (quality === 'poor' || quality === 'very_poor') {
      description += '，睡眠质量较差';
      descriptionEn += ', poor sleep quality';
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    weight: 0.30, // 睡眠权重 30%
    description,
    descriptionEn,
  };
}

/**
 * 计算运动得分
 * 基于运动时长评估
 */
function calculateExerciseScore(minutes: number | null): FactorScore {
  let score = 50;
  let description = '数据不足，使用默认值';
  let descriptionEn = 'Insufficient data, using default';

  if (minutes !== null) {
    if (minutes >= 30 && minutes <= 60) {
      score = 100;
      description = '运动量适中（30-60分钟）';
      descriptionEn = 'Moderate exercise (30-60 minutes)';
    } else if (minutes >= 20 && minutes < 30) {
      score = 80;
      description = '轻度运动（20-30分钟）';
      descriptionEn = 'Light exercise (20-30 minutes)';
    } else if (minutes > 60 && minutes <= 90) {
      score = 90;
      description = '较高运动量（60-90分钟）';
      descriptionEn = 'High exercise (60-90 minutes)';
    } else if (minutes > 90) {
      score = 75;
      description = '运动量较大（>90分钟），注意恢复';
      descriptionEn = 'Heavy exercise (>90 min), focus on recovery';
    } else if (minutes >= 10 && minutes < 20) {
      score = 60;
      description = '基础活动（10-20分钟）';
      descriptionEn = 'Basic activity (10-20 minutes)';
    } else if (minutes > 0 && minutes < 10) {
      score = 40;
      description = '活动量偏少（<10分钟）';
      descriptionEn = 'Low activity (<10 minutes)';
    } else {
      score = 30;
      description = '今日未运动';
      descriptionEn = 'No exercise today';
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    weight: 0.20, // 运动权重 20%
    description,
    descriptionEn,
  };
}

/**
 * 计算压力得分
 * 压力等级 1-10，1 最低，10 最高
 */
function calculateStressScore(level: number | null): FactorScore {
  let score = 50;
  let description = '数据不足，使用默认值';
  let descriptionEn = 'Insufficient data, using default';

  if (level !== null) {
    // 压力越低，得分越高
    score = Math.round(100 - (level - 1) * 10);
    
    if (level <= 3) {
      description = '压力水平低，状态轻松';
      descriptionEn = 'Low stress, relaxed state';
    } else if (level <= 5) {
      description = '压力适中，可控范围';
      descriptionEn = 'Moderate stress, manageable';
    } else if (level <= 7) {
      description = '压力较高，建议放松';
      descriptionEn = 'High stress, relaxation recommended';
    } else {
      description = '压力过高，需要关注';
      descriptionEn = 'Very high stress, needs attention';
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    weight: 0.20, // 压力权重 20%
    description,
    descriptionEn,
  };
}

/**
 * 计算恢复能力得分
 * 基于 HRV（心率变异性）评估
 */
function calculateRecoveryScore(hrv: number | null): FactorScore {
  let score = 50;
  let description = '数据不足，使用默认值';
  let descriptionEn = 'Insufficient data, using default';

  if (hrv !== null) {
    // HRV 正常范围约 20-100ms，越高越好
    if (hrv >= 60) {
      score = 100;
      description = 'HRV 优秀，恢复能力强';
      descriptionEn = 'Excellent HRV, strong recovery';
    } else if (hrv >= 50) {
      score = 85;
      description = 'HRV 良好，恢复正常';
      descriptionEn = 'Good HRV, normal recovery';
    } else if (hrv >= 40) {
      score = 70;
      description = 'HRV 一般，恢复能力中等';
      descriptionEn = 'Average HRV, moderate recovery';
    } else if (hrv >= 30) {
      score = 50;
      description = 'HRV 偏低，恢复能力较弱';
      descriptionEn = 'Low HRV, weak recovery';
    } else {
      score = 30;
      description = 'HRV 过低，需要休息';
      descriptionEn = 'Very low HRV, rest needed';
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    weight: 0.15, // 恢复权重 15%
    description,
    descriptionEn,
  };
}

/**
 * 计算习惯完成得分
 * 基于代谢重置任务完成率
 */
function calculateHabitsScore(completionRate: number): FactorScore {
  const score = Math.round(completionRate);
  let description: string;
  let descriptionEn: string;

  if (completionRate >= 80) {
    description = '习惯执行优秀，保持下去！';
    descriptionEn = 'Excellent habit execution, keep it up!';
  } else if (completionRate >= 60) {
    description = '习惯执行良好';
    descriptionEn = 'Good habit execution';
  } else if (completionRate >= 40) {
    description = '习惯执行一般，可以提升';
    descriptionEn = 'Average habit execution, room for improvement';
  } else if (completionRate > 0) {
    description = '习惯执行较少，建议坚持';
    descriptionEn = 'Low habit execution, consistency recommended';
  } else {
    description = '今日暂无习惯完成记录';
    descriptionEn = 'No habits completed today';
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    weight: 0.15, // 习惯权重 15%
    description,
    descriptionEn,
  };
}

/**
 * 计算综合能量值
 * 
 * 权重分配：
 * - 睡眠: 30%
 * - 运动: 20%
 * - 压力: 20%
 * - 恢复: 15%
 * - 习惯: 15%
 * 
 * @param input 健康数据输入
 * @returns 能量分解结果
 */
export function calculateEnergyLevel(input: EnergyCalculationInput): EnergyBreakdown {
  const sleep = calculateSleepScore(input.sleepHours, input.sleepQuality);
  const exercise = calculateExerciseScore(input.exerciseMinutes);
  const stress = calculateStressScore(input.stressLevel);
  const recovery = calculateRecoveryScore(input.hrv);
  const habits = calculateHabitsScore(input.metabolicResetCompletion);

  // 加权计算总分
  const totalScore = Math.round(
    sleep.score * sleep.weight +
    exercise.score * exercise.weight +
    stress.score * stress.weight +
    recovery.score * recovery.weight +
    habits.score * habits.weight
  );

  return {
    totalScore: Math.max(0, Math.min(100, totalScore)),
    factors: {
      sleep,
      exercise,
      stress,
      recovery,
      habits,
    },
  };
}

/**
 * 获取能量等级标签
 */
export function getEnergyLabel(score: number): { label: string; labelEn: string; color: string } {
  if (score >= 80) {
    return { label: '巅峰状态', labelEn: 'Peak', color: 'text-emerald-600' };
  } else if (score >= 60) {
    return { label: '良好状态', labelEn: 'Good', color: 'text-[#0B3D2E]' };
  } else if (score >= 40) {
    return { label: '一般状态', labelEn: 'Fair', color: 'text-amber-600' };
  } else {
    return { label: '需要恢复', labelEn: 'Recovery', color: 'text-red-600' };
  }
}

/**
 * 从每日日志数据转换为能量计算输入
 */
export function convertLogToEnergyInput(
  log: {
    sleep_hours?: number | null;
    sleep_duration_minutes?: number | null;
    sleep_quality?: string | null;
    exercise_duration_minutes?: number | null;
    stress_level?: number | null;
    hrv?: number | null;
    metabolic_reset_completion?: number | null;
  } | null
): EnergyCalculationInput {
  if (!log) {
    return {
      sleepHours: null,
      sleepQuality: null,
      exerciseMinutes: null,
      stressLevel: null,
      hrv: null,
      metabolicResetCompletion: 0,
    };
  }

  // 兼容两种睡眠时长字段
  const sleepHours = log.sleep_hours ?? 
    (log.sleep_duration_minutes ? log.sleep_duration_minutes / 60 : null);

  return {
    sleepHours,
    sleepQuality: log.sleep_quality ?? null,
    exerciseMinutes: log.exercise_duration_minutes ?? null,
    stressLevel: log.stress_level ?? null,
    hrv: log.hrv ?? null,
    metabolicResetCompletion: log.metabolic_reset_completion ?? 0,
  };
}
