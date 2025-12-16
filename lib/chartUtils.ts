// 图表数据处理工具函数

interface HabitLog {
  id: number;
  habit_id: number;
  completed_at: string;
  belief_score_snapshot: number;
}

interface ChartDataPoint {
  period: string;
  completions: number;
  averageScore: number;
}

/**
 * 按周统计数据
 */
export function groupByWeek(logs: HabitLog[]): ChartDataPoint[] {
  const grouped: { [key: string]: HabitLog[] } = {};

  logs.forEach((log) => {
    const date = new Date(log.completed_at);
    // 获取该周的周一日期作为标识
    const monday = new Date(date);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1); // 调整为周一
    monday.setDate(diff);
    const weekKey = `${monday.getFullYear()}-W${getWeekNumber(monday)}`;

    if (!grouped[weekKey]) {
      grouped[weekKey] = [];
    }
    grouped[weekKey].push(log);
  });

  return Object.keys(grouped)
    .sort()
    .map((key) => {
      const logsInPeriod = grouped[key];
      const averageScore =
        logsInPeriod.reduce((sum, log) => sum + log.belief_score_snapshot, 0) /
        logsInPeriod.length;

      return {
        period: key,
        completions: logsInPeriod.length,
        averageScore: Math.round(averageScore * 10) / 10, // 保留一位小数
      };
    });
}

/**
 * 按月统计数据
 */
export function groupByMonth(logs: HabitLog[]): ChartDataPoint[] {
  const grouped: { [key: string]: HabitLog[] } = {};

  logs.forEach((log) => {
    const date = new Date(log.completed_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }
    grouped[monthKey].push(log);
  });

  return Object.keys(grouped)
    .sort()
    .map((key) => {
      const logsInPeriod = grouped[key];
      const averageScore =
        logsInPeriod.reduce((sum, log) => sum + log.belief_score_snapshot, 0) /
        logsInPeriod.length;

      return {
        period: formatMonthLabel(key),
        completions: logsInPeriod.length,
        averageScore: Math.round(averageScore * 10) / 10, // 保留一位小数
      };
    });
}

/**
 * 获取周数
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * 格式化月份标签
 */
function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const monthNames = [
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月',
  ];
  return `${year}年${monthNames[parseInt(month) - 1]}`;
}

/**
 * 根据数据量自动选择按周或按月统计
 */
export function autoGroupData(logs: HabitLog[]): {
  completionData: { period: string; completions: number }[];
  beliefData: { period: string; averageScore: number }[];
} {
  // 如果数据少于8条，按周统计；否则按月统计
  const useWeekly = logs.length < 8;

  const grouped = useWeekly ? groupByWeek(logs) : groupByMonth(logs);

  return {
    completionData: grouped.map((item) => ({
      period: item.period,
      completions: item.completions,
    })),
    beliefData: grouped.map((item) => ({
      period: item.period,
      averageScore: item.averageScore,
    })),
  };
}

