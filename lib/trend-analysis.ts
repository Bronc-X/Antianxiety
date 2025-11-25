/**
 * 健康数据趋势分析工具
 * 基于用户的daily_wellness_logs数据计算真实的健康趋势
 */

interface DailyLog {
  log_date: string;
  sleep_duration_minutes?: number | null;
  sleep_quality?: string | null;
  exercise_duration_minutes?: number | null;
  mood_status?: string | null;
  stress_level?: number | null;
  notes?: string | null;
}

interface HealthTrend {
  type: 'sleep' | 'exercise' | 'stress' | 'mood' | 'overall';
  direction: 'improving' | 'declining' | 'stable';
  percentage: number;
  description: string;
  insight: string;
  confidence: 'high' | 'medium' | 'low';
}

interface TrendAnalysis {
  primary: HealthTrend;
  secondary?: HealthTrend;
  hasEnoughData: boolean;
  dataPoints: number;
}

// 睡眠质量映射到数值
const sleepQualityScore: Record<string, number> = {
  'excellent': 5,
  'good': 4,
  'average': 3,
  'poor': 2,
  'very_poor': 1
};

// 心情状态映射到数值
const moodScore: Record<string, number> = {
  '专注平稳': 5,
  '轻松愉悦': 5,
  '略感疲惫': 3,
  '焦虑紧绷': 2,
  '情绪低落': 1,
  '亢奋躁动': 2
};

/**
 * 计算数组的趋势（线性回归）
 * @param values 数值数组
 * @returns 趋势斜率，正数表示上升，负数表示下降
 */
const calculateTrend = (values: number[]): number => {
  if (values.length < 2) return 0;
  
  const n = values.length;
  const sumX = n * (n - 1) / 2; // 0 + 1 + 2 + ... + (n-1)
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
  const sumXX = n * (n - 1) * (2 * n - 1) / 6; // 0² + 1² + 2² + ... + (n-1)²
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  return slope;
};

/**
 * 计算百分比变化
 * @param values 数值数组
 * @returns 百分比变化
 */
const calculatePercentageChange = (values: number[]): number => {
  if (values.length < 2) return 0;
  
  const firstHalf = values.slice(0, Math.ceil(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  if (firstAvg === 0) return 0;
  return ((secondAvg - firstAvg) / firstAvg) * 100;
};

/**
 * 分析睡眠趋势
 */
const analyzeSleepTrend = (logs: DailyLog[]): HealthTrend | null => {
  const sleepData = logs
    .filter(log => log.sleep_duration_minutes && log.sleep_quality)
    .map(log => ({
      duration: log.sleep_duration_minutes! / 60, // 转换为小时
      quality: sleepQualityScore[log.sleep_quality!] || 3
    }));

  if (sleepData.length < 3) return null;

  // 分析睡眠时长趋势
  const durations = sleepData.map(d => d.duration);
  const durationTrend = calculateTrend(durations);
  const durationChange = calculatePercentageChange(durations);

  // 分析睡眠质量趋势
  const qualities = sleepData.map(d => d.quality);
  const qualityTrend = calculateTrend(qualities);
  const qualityChange = calculatePercentageChange(qualities);

  // 选择更显著的趋势
  if (Math.abs(qualityChange) > Math.abs(durationChange)) {
    const direction = qualityTrend > 0.1 ? 'improving' : qualityTrend < -0.1 ? 'declining' : 'stable';
    const avgQuality = qualities.reduce((a, b) => a + b, 0) / qualities.length;
    
    return {
      type: 'sleep',
      direction,
      percentage: Math.abs(qualityChange),
      description: direction === 'improving' 
        ? `睡眠质量提升了 ${Math.round(Math.abs(qualityChange))}%`
        : direction === 'declining'
        ? `睡眠质量下降了 ${Math.round(Math.abs(qualityChange))}%`
        : `睡眠质量保持稳定`,
      insight: avgQuality >= 4 
        ? '继续保持良好的睡眠习惯'
        : avgQuality >= 3
        ? '可以尝试优化睡前环境和作息时间'
        : '建议重点关注睡眠质量改善',
      confidence: qualities.length >= 7 ? 'high' : qualities.length >= 5 ? 'medium' : 'low'
    };
  } else {
    const direction = durationTrend > 0.1 ? 'improving' : durationTrend < -0.1 ? 'declining' : 'stable';
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    
    return {
      type: 'sleep',
      direction,
      percentage: Math.abs(durationChange),
      description: direction === 'improving' 
        ? `睡眠时长增加了 ${Math.round(Math.abs(durationChange))}%`
        : direction === 'declining'
        ? `睡眠时长减少了 ${Math.round(Math.abs(durationChange))}%`
        : `睡眠时长保持稳定`,
      insight: avgDuration >= 7 && avgDuration <= 9 
        ? '睡眠时长在理想范围内'
        : avgDuration < 7
        ? '建议增加睡眠时间至7-9小时'
        : '睡眠时间偏长，可能需要检查睡眠质量',
      confidence: durations.length >= 7 ? 'high' : durations.length >= 5 ? 'medium' : 'low'
    };
  }
};

/**
 * 分析运动趋势
 */
const analyzeExerciseTrend = (logs: DailyLog[]): HealthTrend | null => {
  const exerciseData = logs
    .map(log => log.exercise_duration_minutes || 0)
    .filter(duration => duration !== null);

  if (exerciseData.length < 3) return null;

  const trend = calculateTrend(exerciseData);
  const change = calculatePercentageChange(exerciseData);
  const avgExercise = exerciseData.reduce((a, b) => a + b, 0) / exerciseData.length;
  
  const direction = trend > 1 ? 'improving' : trend < -1 ? 'declining' : 'stable';
  
  return {
    type: 'exercise',
    direction,
    percentage: Math.abs(change),
    description: direction === 'improving' 
      ? `运动量增加了 ${Math.round(Math.abs(change))}%`
      : direction === 'declining'
      ? `运动量减少了 ${Math.round(Math.abs(change))}%`
      : `运动量保持稳定`,
    insight: avgExercise >= 30 
      ? '运动量达到健康标准，继续保持'
      : avgExercise >= 15
      ? '可以适当增加运动强度和时长'
      : '建议增加日常运动，目标每天至少30分钟',
    confidence: exerciseData.length >= 7 ? 'high' : exerciseData.length >= 5 ? 'medium' : 'low'
  };
};

/**
 * 分析压力趋势
 */
const analyzeStressTrend = (logs: DailyLog[]): HealthTrend | null => {
  const stressData = logs
    .filter(log => log.stress_level && log.stress_level > 0)
    .map(log => log.stress_level!);

  if (stressData.length < 3) return null;

  const trend = calculateTrend(stressData);
  const change = calculatePercentageChange(stressData);
  const avgStress = stressData.reduce((a, b) => a + b, 0) / stressData.length;
  
  // 注意：压力下降是好事，所以方向逻辑相反
  const direction = trend < -0.2 ? 'improving' : trend > 0.2 ? 'declining' : 'stable';
  
  return {
    type: 'stress',
    direction,
    percentage: Math.abs(change),
    description: direction === 'improving' 
      ? `压力水平降低了 ${Math.round(Math.abs(change))}%`
      : direction === 'declining'
      ? `压力水平上升了 ${Math.round(Math.abs(change))}%`
      : `压力水平保持稳定`,
    insight: avgStress <= 3 
      ? '压力管理良好，继续保持'
      : avgStress <= 5
      ? '压力在可控范围内，注意适度放松'
      : avgStress <= 7
      ? '压力偏高，建议增加减压活动'
      : '压力较重，建议寻求专业帮助或调整生活节奏',
    confidence: stressData.length >= 7 ? 'high' : stressData.length >= 5 ? 'medium' : 'low'
  };
};

/**
 * 分析心情趋势
 */
const analyzeMoodTrend = (logs: DailyLog[]): HealthTrend | null => {
  const moodData = logs
    .filter(log => log.mood_status && moodScore[log.mood_status])
    .map(log => moodScore[log.mood_status!]);

  if (moodData.length < 3) return null;

  const trend = calculateTrend(moodData);
  const change = calculatePercentageChange(moodData);
  const avgMood = moodData.reduce((a, b) => a + b, 0) / moodData.length;
  
  const direction = trend > 0.1 ? 'improving' : trend < -0.1 ? 'declining' : 'stable';
  
  return {
    type: 'mood',
    direction,
    percentage: Math.abs(change),
    description: direction === 'improving' 
      ? `心情状态改善了 ${Math.round(Math.abs(change))}%`
      : direction === 'declining'
      ? `心情状态下滑了 ${Math.round(Math.abs(change))}%`
      : `心情状态保持稳定`,
    insight: avgMood >= 4 
      ? '情绪状态良好，保持积极心态'
      : avgMood >= 3
      ? '情绪基本稳定，可适当增加愉悦活动'
      : '建议关注情绪健康，增加减压和放松时间',
    confidence: moodData.length >= 7 ? 'high' : moodData.length >= 5 ? 'medium' : 'low'
  };
};

/**
 * 主函数：分析健康趋势
 * @param logs 用户日志数据
 * @returns 趋势分析结果
 */
export const analyzeHealthTrends = (logs: DailyLog[]): TrendAnalysis => {
  if (!logs || logs.length < 3) {
    return {
      primary: {
        type: 'overall',
        direction: 'stable',
        percentage: 0,
        description: '数据积累中',
        insight: `记录 ${Math.max(0, 3 - logs.length)} 天后即可查看趋势分析`,
        confidence: 'low'
      },
      hasEnoughData: false,
      dataPoints: logs.length
    };
  }

  // 按时间排序（最新的在前）
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(b.log_date).getTime() - new Date(a.log_date).getTime()
  );

  // 分析各个维度的趋势
  const trends = [
    analyzeSleepTrend(sortedLogs),
    analyzeExerciseTrend(sortedLogs),
    analyzeStressTrend(sortedLogs),
    analyzeMoodTrend(sortedLogs)
  ].filter(trend => trend !== null) as HealthTrend[];

  if (trends.length === 0) {
    return {
      primary: {
        type: 'overall',
        direction: 'stable',
        percentage: 0,
        description: '暂无明显趋势',
        insight: '继续记录数据以获得更准确的分析',
        confidence: 'low'
      },
      hasEnoughData: true,
      dataPoints: logs.length
    };
  }

  // 选择最显著的趋势作为主要趋势
  const primaryTrend = trends
    .sort((a, b) => {
      // 优先级：improving > declining > stable
      // 在同等方向下，选择变化幅度更大的
      if (a.direction !== b.direction) {
        if (a.direction === 'improving') return -1;
        if (b.direction === 'improving') return 1;
        if (a.direction === 'declining') return -1;
        if (b.direction === 'declining') return 1;
      }
      return b.percentage - a.percentage;
    })[0];

  // 选择次要趋势（如果存在）
  const secondaryTrend = trends
    .filter(t => t.type !== primaryTrend.type)
    .sort((a, b) => b.percentage - a.percentage)[0];

  return {
    primary: primaryTrend,
    secondary: secondaryTrend,
    hasEnoughData: true,
    dataPoints: logs.length
  };
};

/**
 * 获取趋势描述的图标
 */
export const getTrendIcon = (trend: HealthTrend): string => {
  const icons = {
    sleep: trend.direction === 'improving' ? '😴✨' : trend.direction === 'declining' ? '😴💤' : '😴',
    exercise: trend.direction === 'improving' ? '💪📈' : trend.direction === 'declining' ? '💪📉' : '💪',
    stress: trend.direction === 'improving' ? '🧘✨' : trend.direction === 'declining' ? '😰📈' : '🧘',
    mood: trend.direction === 'improving' ? '😊📈' : trend.direction === 'declining' ? '😔📉' : '😐',
    overall: trend.direction === 'improving' ? '📈✨' : trend.direction === 'declining' ? '📉' : '📊'
  };
  return icons[trend.type];
};

/**
 * 获取趋势的颜色主题
 */
export const getTrendColor = (trend: HealthTrend): string => {
  return trend.direction === 'improving' 
    ? 'text-emerald-700'
    : trend.direction === 'declining'
    ? 'text-amber-700'
    : 'text-[#0B3D2E]';
};
