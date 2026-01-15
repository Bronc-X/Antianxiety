/**
 * 贝叶斯信心统计系统
 * 基于用户历史数据评估健康状态的可信度
 */

interface DailyLog {
  log_date: string;
  sleep_duration_minutes?: number | null;
  sleep_quality?: string | null;
  exercise_duration_minutes?: number | null;
  mood_status?: string | null;
  stress_level?: number | null;
}

interface ConfidenceMetrics {
  overall: number;          // 整体信心度 (0-1)
  dataCompleteness: number; // 数据完整度 (0-1)
  consistency: number;      // 一致性 (0-1)
  weeklyTrend: number;      // 周趋势稳定性 (0-1)
  sampleSize: number;       // 样本数量
  reliabilityLevel: 'low' | 'medium' | 'high' | 'very_high';
}

interface WeeklyConfidence {
  week: string;             // 周标识 (如: "2024-W47")
  startDate: string;        // 周开始日期
  endDate: string;          // 周结束日期
  confidence: ConfidenceMetrics;
  insights: string[];       // 信心度洞察
}

/**
 * 获取周标识符 (ISO周)
 */
const getWeekIdentifier = (date: Date): string => {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
};

/**
 * 获取周的开始和结束日期
 */
const getWeekRange = (weekId: string): { start: Date; end: Date } => {
  const [year, week] = weekId.split('-W');
  const startOfYear = new Date(parseInt(year), 0, 1);
  const weekNumber = parseInt(week);
  
  // 计算该周的开始日期 (周一)
  const daysToAdd = (weekNumber - 1) * 7 - startOfYear.getDay() + 1;
  const start = new Date(startOfYear.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  
  // 结束日期 (周日)
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  
  return { start, end };
};

/**
 * 计算数据完整度
 * 基于每日必填字段的完整性
 */
const calculateDataCompleteness = (logs: DailyLog[]): number => {
  if (logs.length === 0) return 0;
  
  const requiredFields = ['sleep_duration_minutes', 'sleep_quality', 'exercise_duration_minutes', 'mood_status', 'stress_level'];
  let totalFields = 0;
  let completedFields = 0;
  
  logs.forEach(log => {
    requiredFields.forEach(field => {
      totalFields++;
      if (log[field as keyof DailyLog] !== null && log[field as keyof DailyLog] !== undefined) {
        completedFields++;
      }
    });
  });
  
  return totalFields > 0 ? completedFields / totalFields : 0;
};

/**
 * 计算数据一致性
 * 基于数据变异系数和异常值检测
 */
const calculateConsistency = (logs: DailyLog[]): number => {
  if (logs.length < 3) return 0.3; // 数据量不足时给较低分
  
  // 睡眠时长一致性
  const sleepDurations = logs
    .map(log => log.sleep_duration_minutes)
    .filter(duration => duration !== null && duration !== undefined) as number[];
  
  // 压力水平一致性  
  const stressLevels = logs
    .map(log => log.stress_level)
    .filter(level => level !== null && level !== undefined) as number[];
  
  let consistencyScore = 0;
  let metrics = 0;
  
  // 睡眠时长变异系数
  if (sleepDurations.length >= 3) {
    const mean = sleepDurations.reduce((a, b) => a + b, 0) / sleepDurations.length;
    const variance = sleepDurations.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / sleepDurations.length;
    const cv = Math.sqrt(variance) / mean; // 变异系数
    consistencyScore += Math.max(0, 1 - cv / 0.3); // CV < 0.3 认为是一致的
    metrics++;
  }
  
  // 压力水平变异系数
  if (stressLevels.length >= 3) {
    const mean = stressLevels.reduce((a, b) => a + b, 0) / stressLevels.length;
    const variance = stressLevels.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / stressLevels.length;
    const cv = Math.sqrt(variance) / mean;
    consistencyScore += Math.max(0, 1 - cv / 0.5); // 压力允许更大变异
    metrics++;
  }
  
  return metrics > 0 ? consistencyScore / metrics : 0.5;
};

/**
 * 计算周趋势稳定性
 * 分析趋势是否显著且稳定
 */
const calculateWeeklyTrendStability = (logs: DailyLog[]): number => {
  if (logs.length < 5) return 0.4;
  
  // 按日期排序
  const sortedLogs = logs.sort((a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime());
  
  // 计算睡眠质量趋势稳定性
  const sleepQualityScores = sortedLogs
    .map(log => {
      const qualityMap: Record<string, number> = {
        'excellent': 5, 'good': 4, 'average': 3, 'poor': 2, 'very_poor': 1
      };
      return log.sleep_quality ? qualityMap[log.sleep_quality] || 3 : null;
    })
    .filter(score => score !== null) as number[];
  
  // 计算运动量趋势稳定性
  const exerciseDurations = sortedLogs
    .map(log => log.exercise_duration_minutes)
    .filter(duration => duration !== null) as number[];
    
  let stabilityScore = 0;
  let metrics = 0;
  
  // 睡眠质量趋势分析
  if (sleepQualityScores.length >= 4) {
    const trend = calculateLinearTrend(sleepQualityScores);
    const trendStrength = Math.abs(trend.slope);
    const r2 = trend.rSquared;
    
    // 趋势越明显且拟合度越高，稳定性越高
    stabilityScore += r2 * (1 + Math.min(trendStrength, 0.5));
    metrics++;
  }
  
  // 运动量趋势分析
  if (exerciseDurations.length >= 4) {
    const trend = calculateLinearTrend(exerciseDurations);
    const r2 = trend.rSquared;
    stabilityScore += r2;
    metrics++;
  }
  
  return metrics > 0 ? stabilityScore / metrics : 0.5;
};

/**
 * 线性趋势计算
 */
const calculateLinearTrend = (values: number[]): { slope: number; rSquared: number } => {
  const n = values.length;
  const sumX = (n * (n - 1)) / 2; // 0 + 1 + 2 + ... + (n-1)
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
  const sumXX = (n * (n - 1) * (2 * n - 1)) / 6; // 0² + 1² + 2² + ... + (n-1)²
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  // 计算 R²
  const yMean = sumY / n;
  const ssTotal = values.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
  const ssResidual = values.reduce((sum, y, x) => {
    const predicted = slope * x + (sumY - slope * sumX) / n;
    return sum + Math.pow(y - predicted, 2);
  }, 0);
  
  const rSquared = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;
  
  return { slope, rSquared: Math.max(0, rSquared) };
};

/**
 * 计算贝叶斯整体信心度
 * 使用贝叶斯方法综合各维度信心
 */
const calculateBayesianConfidence = (
  completeness: number,
  consistency: number, 
  trendStability: number,
  sampleSize: number
): number => {
  // 先验概率 (基于样本量)
  let prior = 0.5; // 默认50%信心
  if (sampleSize >= 7) prior = 0.7;      // 一周以上数据
  else if (sampleSize >= 14) prior = 0.8; // 两周以上数据
  else if (sampleSize >= 21) prior = 0.9; // 三周以上数据
  
  // 似然度计算 (基于数据质量)
  const dataQuality = (completeness * 0.4 + consistency * 0.3 + trendStability * 0.3);
  
  // 贝叶斯更新
  const likelihood = dataQuality;
  const evidence = prior * likelihood + (1 - prior) * (1 - likelihood);
  const posterior = (prior * likelihood) / evidence;
  
  return Math.min(0.95, Math.max(0.05, posterior)); // 限制在 5%-95% 范围内
};

/**
 * 获取可靠性等级
 */
const getReliabilityLevel = (confidence: number): 'low' | 'medium' | 'high' | 'very_high' => {
  if (confidence >= 0.8) return 'very_high';
  if (confidence >= 0.65) return 'high'; 
  if (confidence >= 0.45) return 'medium';
  return 'low';
};

/**
 * 生成信心度洞察
 */
const generateConfidenceInsights = (metrics: ConfidenceMetrics, sampleSize: number): string[] => {
  const insights: string[] = [];
  
  // 整体评估
  if (metrics.overall >= 0.8) {
    insights.push('🎯 数据质量优秀，分析结果高度可信');
  } else if (metrics.overall >= 0.65) {
    insights.push('✅ 数据质量良好，趋势分析较为可靠');
  } else if (metrics.overall >= 0.45) {
    insights.push('⚡ 数据质量中等，建议增加记录频率');
  } else {
    insights.push('📝 数据量不足，请坚持记录以提高分析精度');
  }
  
  // 数据完整度
  if (metrics.dataCompleteness < 0.6) {
    insights.push('💡 建议完整填写所有字段以获得更准确的分析');
  }
  
  // 一致性
  if (metrics.consistency < 0.5) {
    insights.push('🔄 数据波动较大，可能反映生活节奏变化');
  }
  
  // 样本量
  if (sampleSize >= 21) {
    insights.push('📊 数据积累充足，可进行深度趋势分析');
  } else if (sampleSize >= 7) {
    insights.push('📈 一周数据已收集，趋势开始显现');
  }
  
  return insights;
};

/**
 * 主函数：计算周贝叶斯信心统计
 */
export const calculateWeeklyBayesianConfidence = (logs: DailyLog[]): WeeklyConfidence[] => {
  if (!logs || logs.length === 0) return [];
  
  // 按周分组数据
  const weeklyGroups: Record<string, DailyLog[]> = {};
  
  logs.forEach(log => {
    const date = new Date(log.log_date);
    const weekId = getWeekIdentifier(date);
    
    if (!weeklyGroups[weekId]) {
      weeklyGroups[weekId] = [];
    }
    weeklyGroups[weekId].push(log);
  });
  
  // 计算每周的信心统计
  const weeklyConfidences: WeeklyConfidence[] = [];
  
  Object.entries(weeklyGroups).forEach(([weekId, weekLogs]) => {
    const { start, end } = getWeekRange(weekId);
    
    // 计算各维度指标
    const completeness = calculateDataCompleteness(weekLogs);
    const consistency = calculateConsistency(weekLogs);
    const trendStability = calculateWeeklyTrendStability(weekLogs);
    const sampleSize = weekLogs.length;
    
    // 计算贝叶斯整体信心度
    const overall = calculateBayesianConfidence(completeness, consistency, trendStability, sampleSize);
    
    const confidence: ConfidenceMetrics = {
      overall,
      dataCompleteness: completeness,
      consistency,
      weeklyTrend: trendStability,
      sampleSize,
      reliabilityLevel: getReliabilityLevel(overall)
    };
    
    weeklyConfidences.push({
      week: weekId,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      confidence,
      insights: generateConfidenceInsights(confidence, sampleSize)
    });
  });
  
  // 按周排序 (最新的在前)
  return weeklyConfidences.sort((a, b) => b.week.localeCompare(a.week));
};

/**
 * 获取当前周的信心统计
 */
export const getCurrentWeekConfidence = (logs: DailyLog[]): WeeklyConfidence | null => {
  const weeklyConfidences = calculateWeeklyBayesianConfidence(logs);
  return weeklyConfidences.length > 0 ? weeklyConfidences[0] : null;
};

/**
 * 格式化信心度百分比
 */
export const formatConfidencePercentage = (confidence: number): string => {
  return `${Math.round(confidence * 100)}%`;
};

/**
 * 获取信心度颜色主题
 */
export const getConfidenceColor = (level: 'low' | 'medium' | 'high' | 'very_high'): string => {
  const colors = {
    'low': 'text-red-600',
    'medium': 'text-amber-600', 
    'high': 'text-blue-600',
    'very_high': 'text-green-600'
  };
  return colors[level];
};

/**
 * 获取信心度图标
 */
export const getConfidenceIcon = (level: 'low' | 'medium' | 'high' | 'very_high'): string => {
  const icons = {
    'low': '📊',
    'medium': '📈',
    'high': '🎯',
    'very_high': '💎'
  };
  return icons[level];
};
