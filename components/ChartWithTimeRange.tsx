'use client';

import { useState, useMemo } from 'react';

type TimeRange = 'day' | 'week' | 'month';

interface ChartDataPoint {
  period: string;
  [key: string]: string | number;
}

interface ChartWithTimeRangeProps {
  data: ChartDataPoint[];
  renderChart: (filteredData: ChartDataPoint[]) => React.ReactNode;
  title: string;
}

export default function ChartWithTimeRange({ data, renderChart, title }: ChartWithTimeRangeProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('day');

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const now = new Date();
    let cutoffDate: Date;

    switch (timeRange) {
      case 'day':
        // 最近30天
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'week':
        // 最近12周
        cutoffDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        // 最近12个月
        cutoffDate = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return data;
    }

    // 根据period字段过滤数据
    return data.filter((item) => {
      // 这里需要根据实际的period格式来解析日期
      // 假设period格式为 "YYYY-MM-DD" 或 "第X周" 或 "YYYY-MM"
      const periodStr = item.period.toString();
      
      if (timeRange === 'day') {
        // 解析日期格式
        const dateMatch = periodStr.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (dateMatch) {
          const itemDate = new Date(parseInt(dateMatch[1]), parseInt(dateMatch[2]) - 1, parseInt(dateMatch[3]));
          return itemDate >= cutoffDate;
        }
      } else if (timeRange === 'week') {
        // 保留所有周数据
        return periodStr.includes('周');
      } else if (timeRange === 'month') {
        // 解析月份格式
        const monthMatch = periodStr.match(/(\d{4})-(\d{2})/);
        if (monthMatch) {
          const itemDate = new Date(parseInt(monthMatch[1]), parseInt(monthMatch[2]) - 1);
          return itemDate >= cutoffDate;
        }
      }
      
      return true;
    });
  }, [data, timeRange]);

  return (
    <div>
      {/* 时间范围选择器 */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-[#0B3D2E]">{title}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('day')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              timeRange === 'day'
                ? 'bg-[#0B3D2E] text-white'
                : 'bg-white border border-[#E7E1D6] text-[#0B3D2E] hover:bg-[#FAF6EF]'
            }`}
          >
            日
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              timeRange === 'week'
                ? 'bg-[#0B3D2E] text-white'
                : 'bg-white border border-[#E7E1D6] text-[#0B3D2E] hover:bg-[#FAF6EF]'
            }`}
          >
            周
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              timeRange === 'month'
                ? 'bg-[#0B3D2E] text-white'
                : 'bg-white border border-[#E7E1D6] text-[#0B3D2E] hover:bg-[#FAF6EF]'
            }`}
          >
            月
          </button>
        </div>
      </div>

      {/* 渲染图表 */}
      {renderChart(filteredData)}
    </div>
  );
}

