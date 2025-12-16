/**
 * 严格的数据映射模块
 * CRITICAL: 不允许伪造或估算数据
 * 如果真实日志数据不足，必须返回 null 或 { hasData: false }
 */

// 日志数据接口
export interface DailyLog {
  id: string;
  user_id: string;
  log_date: string;
  sleep_hours?: number | null;
  sleep_quality?: number | null;  // 1-5
  stress_level?: number | null;   // 1-5
  energy_level?: number | null;   // 1-5
  exercise_minutes?: number | null;
  water_intake_ml?: number | null;
  notes?: string | null;
  created_at: string;
}

// 雷达图数据格式
export interface RadarDataPoint {
  subject: string;       // 维度名称（中文）
  value: number;         // 0-100
  fullMark: number;      // 总是100
}

export interface RadarChartData {
  hasData: boolean;      // 关键标志：是否有足够的真实数据
  data: RadarDataPoint[] | null;
  dataSource: 'real_logs' | 'empty';  // 数据来源
  minLogCount: number;   // 最少需要的日志数量
  actualLogCount: number; // 实际日志数量
  message?: string;      // 给用户的提示信息
}

/**
 * 严格的雷达图数据生成器
 * @param dailyLogs 用户的每日健康日志
 * @returns 雷达图数据或空状态
 * 
 * 业务规则：
 * - 至少需要 3 条日志才能生成有意义的图表
 * - 不使用问卷答案伪造睡眠/压力数据
 * - 数据不足时，明确返回 hasData = false
 */
export function getRadarChartData(dailyLogs: DailyLog[]): RadarChartData {
  const MIN_LOG_COUNT = 3; // 最少需要3条日志

  // 严格检查：日志数量不足
  if (!dailyLogs || dailyLogs.length < MIN_LOG_COUNT) {
    return {
      hasData: false,
      data: null,
      dataSource: 'empty',
      minLogCount: MIN_LOG_COUNT,
      actualLogCount: dailyLogs?.length || 0,
      message: '暂无数据。请完成至少 3 天的健康日记以解锁你的代谢指纹。'
    };
  }

  // 计算各维度的平均值
  const metrics = calculateMetrics(dailyLogs);

  // 严格检查：关键指标缺失
  if (metrics.dataQuality < 0.5) { // 数据质量低于50%
    return {
      hasData: false,
      data: null,
      dataSource: 'empty',
      minLogCount: MIN_LOG_COUNT,
      actualLogCount: dailyLogs.length,
      message: '数据不完整。请确保填写完整的健康日记（睡眠、压力、能量等）。'
    };
  }

  // 构建雷达图数据
  const radarData: RadarDataPoint[] = [
    {
      subject: '睡眠恢复',
      value: metrics.sleepScore,
      fullMark: 100
    },
    {
      subject: '压力管理',
      value: metrics.stressScore,
      fullMark: 100
    },
    {
      subject: '能量水平',
      value: metrics.energyScore,
      fullMark: 100
    },
    {
      subject: '运动表现',
      value: metrics.exerciseScore,
      fullMark: 100
    },
    {
      subject: '水分摄入',
      value: metrics.hydrationScore,
      fullMark: 100
    },
    {
      subject: '整体健康',
      value: metrics.overallScore,
      fullMark: 100
    }
  ];

  return {
    hasData: true,
    data: radarData,
    dataSource: 'real_logs',
    minLogCount: MIN_LOG_COUNT,
    actualLogCount: dailyLogs.length,
    message: `基于最近 ${dailyLogs.length} 天的真实数据`
  };
}

/**
 * 计算各维度指标
 * 使用真实日志数据，不估算
 */
interface CalculatedMetrics {
  sleepScore: number;      // 睡眠评分 0-100
  stressScore: number;     // 压力管理评分（低压力=高分）
  energyScore: number;     // 能量评分
  exerciseScore: number;   // 运动评分
  hydrationScore: number;  // 水分评分
  overallScore: number;    // 综合评分
  dataQuality: number;     // 数据完整度 0-1
}

function calculateMetrics(dailyLogs: DailyLog[]): CalculatedMetrics {
  let sleepSum = 0, sleepCount = 0;
  let stressSum = 0, stressCount = 0;
  let energySum = 0, energyCount = 0;
  let exerciseSum = 0, exerciseCount = 0;
  let hydrationSum = 0, hydrationCount = 0;

  dailyLogs.forEach(log => {
    // 睡眠评分（7-9小时为最佳）
    if (log.sleep_hours !== null && log.sleep_hours !== undefined) {
      let score = 0;
      if (log.sleep_hours >= 7 && log.sleep_hours <= 9) {
        score = 100; // 理想睡眠
      } else if (log.sleep_hours >= 6 && log.sleep_hours < 7) {
        score = 75;  // 稍少
      } else if (log.sleep_hours > 9 && log.sleep_hours <= 10) {
        score = 75;  // 稍多
      } else if (log.sleep_hours >= 5 && log.sleep_hours < 6) {
        score = 50;  // 不足
      } else {
        score = 25;  // 严重不足/过多
      }
      // 考虑睡眠质量（1-5分）
      if (log.sleep_quality) {
        score = score * (log.sleep_quality / 5); // 质量加权
      }
      sleepSum += score;
      sleepCount++;
    }

    // 压力评分（低压力=高分）
    if (log.stress_level !== null && log.stress_level !== undefined) {
      const stressScore = (6 - log.stress_level) * 20; // 1分=100, 5分=20
      stressSum += stressScore;
      stressCount++;
    }

    // 能量评分
    if (log.energy_level !== null && log.energy_level !== undefined) {
      const energyScore = log.energy_level * 20; // 1分=20, 5分=100
      energySum += energyScore;
      energyCount++;
    }

    // 运动评分（30分钟为基准）
    if (log.exercise_minutes !== null && log.exercise_minutes !== undefined) {
      let score = 0;
      if (log.exercise_minutes >= 30) {
        score = Math.min(100, (log.exercise_minutes / 60) * 100); // 60分钟=100分
      } else {
        score = (log.exercise_minutes / 30) * 60; // 30分钟=60分
      }
      exerciseSum += score;
      exerciseCount++;
    }

    // 水分评分（2000ml为基准）
    if (log.water_intake_ml !== null && log.water_intake_ml !== undefined) {
      const score = Math.min(100, (log.water_intake_ml / 2000) * 100);
      hydrationSum += score;
      hydrationCount++;
    }
  });

  // 计算平均值，如果没有数据则为0
  const sleepScore = sleepCount > 0 ? sleepSum / sleepCount : 0;
  const stressScore = stressCount > 0 ? stressSum / stressCount : 0;
  const energyScore = energyCount > 0 ? energySum / energyCount : 0;
  const exerciseScore = exerciseCount > 0 ? exerciseSum / exerciseCount : 0;
  const hydrationScore = hydrationCount > 0 ? hydrationSum / hydrationCount : 0;

  // 计算整体评分
  const overallScore = (sleepScore + stressScore + energyScore + exerciseScore + hydrationScore) / 5;

  // 数据完整度（有多少维度有数据）
  const totalFields = 5;
  const filledFields = [sleepCount, stressCount, energyCount, exerciseCount, hydrationCount]
    .filter(count => count > 0).length;
  const dataQuality = filledFields / totalFields;

  return {
    sleepScore: Math.round(sleepScore),
    stressScore: Math.round(stressScore),
    energyScore: Math.round(energyScore),
    exerciseScore: Math.round(exerciseScore),
    hydrationScore: Math.round(hydrationScore),
    overallScore: Math.round(overallScore),
    dataQuality
  };
}

/**
 * 获取最新日志
 * @param dailyLogs 用户的每日日志
 * @returns 最新的日志或null
 */
export function getLatestLog(dailyLogs: DailyLog[]): DailyLog | null {
  if (!dailyLogs || dailyLogs.length === 0) {
    return null;
  }

  // 按日期排序，返回最新的
  const sorted = [...dailyLogs].sort((a, b) => {
    return new Date(b.log_date).getTime() - new Date(a.log_date).getTime();
  });

  return sorted[0];
}

/**
 * 检查今天是否已记录
 * @param dailyLogs 用户的每日日志
 * @returns 是否已记录
 */
export function hasLoggedToday(dailyLogs: DailyLog[]): boolean {
  if (!dailyLogs || dailyLogs.length === 0) {
    return false;
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return dailyLogs.some(log => log.log_date === today);
}

/**
 * 获取数据质量提示
 * @param radarData 雷达图数据
 * @returns 给用户的友好提示
 */
export function getDataQualityMessage(radarData: RadarChartData): string {
  if (!radarData.hasData) {
    return radarData.message || '暂无数据';
  }

  if (radarData.actualLogCount < 7) {
    return `当前基于 ${radarData.actualLogCount} 天数据。建议记录至少 7 天以获得更准确的分析。`;
  }

  if (radarData.actualLogCount < 30) {
    return `当前基于 ${radarData.actualLogCount} 天数据。继续记录以解锁长期趋势分析。`;
  }

  return `基于 ${radarData.actualLogCount} 天的完整数据。`;
}
