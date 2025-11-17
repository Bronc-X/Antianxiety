'use client';

import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// 用户指标数据类型
interface UserMetric {
  date: string;
  belief_curve_score: number | null;
  confidence_score: number | null;
  physical_performance_score: number | null;
}

interface UserMetricsChartProps {
  data: UserMetric[];
}

/**
 * 用户指标曲线图表组件
 * 展示贝叶斯函数生成的三个核心指标：
 * - 信念曲线分数 (belief_curve_score)
 * - 信心增强分数 (confidence_score)
 * - 身体机能表现分数 (physical_performance_score)
 */
export default function UserMetricsChart({ data }: UserMetricsChartProps) {
  // 转换数据格式：将数据库中的 0-1 范围转换为 0-100 显示
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
    belief: item.belief_curve_score !== null ? (item.belief_curve_score * 100).toFixed(1) : null,
    confidence: item.confidence_score !== null ? (item.confidence_score * 100).toFixed(1) : null,
    performance: item.physical_performance_score !== null ? (item.physical_performance_score * 100).toFixed(1) : null,
  }));

  // 如果没有数据，显示提示
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-[#E7E1D6] bg-white p-6 shadow-sm">
        <h3 className="text-lg font-medium text-[#0B3D2E] mb-4">贝叶斯信念循环曲线</h3>
        <p className="text-sm text-[#0B3D2E]/70 text-center py-8">
          暂无数据。完成习惯打卡后，系统将自动计算并生成曲线。
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#E7E1D6] bg-white p-6 shadow-sm">
      <h3 className="text-lg font-medium text-[#0B3D2E] mb-2">贝叶斯信念循环曲线</h3>
      <p className="text-sm text-[#0B3D2E]/70 mb-4">
        基于第一性原理计算的三个核心指标，直观展示最小阻力习惯养成对身体带来的有利变化
      </p>
      <div className="h-80 w-full min-w-0 min-h-[20rem]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 60 }}>
            <defs>
              <linearGradient id="beliefGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0B3D2E" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0B3D2E" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E7E1D6" strokeOpacity={0.3} />
            <XAxis
              dataKey="date"
              stroke="#0B3D2E"
              style={{ fontSize: '12px' }}
              opacity={0.7}
              angle={-45}
              textAnchor="end"
              height={80}
              label={{ value: '日期', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#0B3D2E', opacity: 0.7, fontSize: '12px' } }}
            />
            <YAxis
              stroke="#0B3D2E"
              style={{ fontSize: '12px' }}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              opacity={0.7}
              label={{ value: '分数 (0-100)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#0B3D2E', opacity: 0.8, fontSize: '12px' } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #E7E1D6',
                borderRadius: '6px',
                color: '#0B3D2E',
              }}
              formatter={(value: any) => {
                if (value === null || value === undefined) return '暂无数据';
                return `${parseFloat(value).toFixed(1)}`;
              }}
              labelFormatter={(label) => `日期: ${label}`}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
              formatter={(value) => {
                const labels: Record<string, string> = {
                  belief: '信念曲线分数',
                  confidence: '信心增强分数',
                  performance: '身体机能表现分数',
                };
                return labels[value] || value;
              }}
            />
            {/* 信念曲线分数 */}
            <Area
              type="monotone"
              dataKey="belief"
              stroke="none"
              fill="url(#beliefGradient)"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="belief"
              stroke="#0B3D2E"
              strokeWidth={2}
              name="belief"
              dot={{ fill: '#0B3D2E', r: 4 }}
              connectNulls={false}
            />
            {/* 信心增强分数 */}
            <Area
              type="monotone"
              dataKey="confidence"
              stroke="none"
              fill="url(#confidenceGradient)"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="confidence"
              stroke="#3B82F6"
              strokeWidth={2}
              name="confidence"
              dot={{ fill: '#3B82F6', r: 4 }}
              connectNulls={false}
            />
            {/* 身体机能表现分数 */}
            <Area
              type="monotone"
              dataKey="performance"
              stroke="none"
              fill="url(#performanceGradient)"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="performance"
              stroke="#10B981"
              strokeWidth={2}
              name="performance"
              dot={{ fill: '#10B981', r: 4 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* 指标说明 */}
      <div className="mt-4 space-y-2 text-xs text-[#0B3D2E]/70">
        <div className="flex items-start gap-2">
          <div className="h-3 w-3 rounded-full bg-[#0B3D2E] mt-0.5" />
          <div>
            <p className="font-medium">信念曲线分数：</p>
            <p>基于贝叶斯定理计算，反映您对习惯有效性的信念强度（P(belief|evidence)）</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className="h-3 w-3 rounded-full bg-[#3B82F6] mt-0.5" />
          <div>
            <p className="font-medium">信心增强分数：</p>
            <p>基于连续完成天数、一致性和完成率计算，反映您坚持习惯的信心增长</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className="h-3 w-3 rounded-full bg-[#10B981] mt-0.5" />
          <div>
            <p className="font-medium">身体机能表现分数：</p>
            <p>基于睡眠、运动、压力、精力等指标计算，反映身体机能的综合表现</p>
          </div>
        </div>
      </div>
    </div>
  );
}


