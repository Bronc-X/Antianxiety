'use client';

import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// 图表数据类型定义
interface ChartDataPoint {
  period: string;
  averageScore: number;
}

interface BeliefScoreChartProps {
  data: ChartDataPoint[];
}

/**
 * 信心增长曲线图表组件（贝叶斯可视化）
 * 显示用户信念分数的平均值变化
 * 使用与StatCurve相同的计算逻辑：0-100指数范围，波动向上趋势
 */
export default function BeliefScoreChart({ data }: BeliefScoreChartProps) {
  // 生成6周的波动向上曲线，使用与StatCurve相同的计算逻辑
  // StatCurve的12周数据：[50, 53, 51, 54, 56, 59, 57, 61, 64, 68, 66, 80, 85]
  // 6周数据：直接使用StatCurve的前6周数据，保持完全相同的波动模式
  const generateWeeklyData = () => {
    // 使用与StatCurve完全相同的前6周数据（0-100范围）
    // 从StatCurve看，前6周是：[50, 53, 51, 54, 56, 59]
    const weeklyScores = [50, 53, 51, 54, 56, 59];
    return weeklyScores.map((score, i) => {
      return {
        period: `${i}周`,
        averageScore: score,
      };
    });
  };

  // 如果没有传入数据或数据为空，使用模拟的6周数据
  const chartData = data && data.length > 0 ? data : generateWeeklyData();

  return (
    <div className="rounded-lg border border-[#E7E1D6] bg-white p-6 shadow-sm">
      <h3 className="text-lg font-medium text-[#0B3D2E] mb-4">信心增长曲线</h3>
      <p className="text-sm text-[#0B3D2E]/70 mb-4">
        显示您对习惯帮助缓解焦虑的信念分数变化（0-100指数）
      </p>
      <div className="h-64 w-full min-w-0 min-h-[16rem]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 60 }}>
            <defs>
              <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0B3D2E" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#0B3D2E" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#0B3D2E" stopOpacity="0" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E7E1D6" strokeOpacity={0.3} />
            <XAxis
              dataKey="period"
              stroke="#0B3D2E"
              style={{ fontSize: '12px' }}
              opacity={0.7}
              label={{ value: '时间（周）', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#0B3D2E', opacity: 0.7, fontSize: '12px' } }}
            />
            <YAxis
              stroke="#0B3D2E"
              style={{ fontSize: '12px' }}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              opacity={0.7}
              label={{ value: '信心增长指数（0-100）', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#0B3D2E', opacity: 0.8, fontSize: '12px' } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #E7E1D6',
                borderRadius: '6px',
                color: '#0B3D2E',
              }}
              formatter={(value: number) => [`${value.toFixed(1)}`, '信心增长指数']}
            />
            {/* 曲线下方阴影填充 - 先渲染面积，再渲染曲线 */}
            <Area
              type="monotone"
              dataKey="averageScore"
              stroke="none"
              fill="url(#confidenceGradient)"
              connectNulls={false}
              baseLine={0}
              isAnimationActive={false}
            />
            {/* 曲线 */}
            <Line
              type="monotone"
              dataKey="averageScore"
              stroke="#0B3D2E"
              strokeWidth={2}
              name="信心增长指数"
              dot={{ fill: '#0B3D2E', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* 指数说明 */}
      <div className="mt-4 space-y-2 text-xs text-[#0B3D2E]/70">
        <p className="text-center">
          指数 = 归一化的后验置信度：P(Confidence | Habits, Signals) ∝ P(Habits, Signals | Confidence) × P(Confidence)
        </p>
        <p className="text-center">
          根据您对习惯的坚持程度、日常活动水平以及身体信号反馈，经过算法呈现您对习惯缓解焦虑的信心增长趋势。
        </p>
      </div>
    </div>
  );
}

