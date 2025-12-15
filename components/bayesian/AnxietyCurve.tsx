'use client';

/**
 * AnxietyCurve Component
 * 
 * 焦虑曲线 - 展示用户焦虑趋势的可视化图表
 * 使用 Recharts 绘制，带有颜色编码和交互功能
 * 
 * @module components/bayesian/AnxietyCurve
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Evidence } from '@/lib/bayesian-evidence';

// ============================================
// Types
// ============================================

interface DataPoint {
  id: string;
  date: string;
  belief_context: string;
  prior_score: number;
  posterior_score: number;
  evidence_stack: Evidence[];
  exaggeration_factor: number;
}

interface AnxietyCurveProps {
  data: DataPoint[];
  timeRange: '7d' | '30d' | '90d' | 'all';
  onTimeRangeChange?: (range: '7d' | '30d' | '90d' | 'all') => void;
  onDataPointTap?: (point: DataPoint) => void;
}

// ============================================
// Constants
// ============================================

const SAGE_GREEN = '#9CAF88';
const CLAY = '#C4A77D';

const TIME_RANGES = [
  { value: '7d', label: '7天' },
  { value: '30d', label: '30天' },
  { value: '90d', label: '90天' },
  { value: 'all', label: '全部' }
] as const;

// ============================================
// Helper Functions
// ============================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getSegmentColor(current: number, previous: number): string {
  if (current < previous) {
    return SAGE_GREEN; // Improving (decreasing anxiety)
  } else if (current > previous) {
    return CLAY; // Worsening (increasing anxiety)
  }
  return '#666'; // Stable
}

// ============================================
// Custom Tooltip
// ============================================

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: DataPoint }> }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const date = new Date(data.date);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-xl"
    >
      <p className="text-white/60 text-xs mb-2">
        {date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-red-400 text-xs">先验:</span>
          <span className="text-white text-sm font-medium">{data.prior_score}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#9CAF88] text-xs">后验:</span>
          <span className="text-white text-sm font-medium">{data.posterior_score}%</span>
        </div>
        {data.exaggeration_factor > 1 && (
          <p className="text-white/40 text-xs mt-1">
            夸大 {data.exaggeration_factor}x
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// Empty State
// ============================================

function EmptyState() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center h-48 text-center px-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 100 }}
    >
      <motion.div
        className="text-4xl mb-4"
        animate={{ 
          y: [0, -5, 0],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        📊
      </motion.div>
      <p className="text-white/60 text-sm mb-2">
        还没有足够的数据来绘制曲线
      </p>
      <p className="text-white/40 text-xs">
        完成几次认知校准后，你的焦虑趋势将在这里显示 🌱
      </p>
    </motion.div>
  );
}

// ============================================
// Component
// ============================================

export function AnxietyCurve({
  data,
  timeRange,
  onTimeRangeChange,
  onDataPointTap
}: AnxietyCurveProps) {
  const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);

  // Process data for chart
  const chartData = useMemo(() => {
    return data.map((point, index) => ({
      ...point,
      displayDate: formatDate(point.date),
      segmentColor: index > 0 
        ? getSegmentColor(point.posterior_score, data[index - 1].posterior_score)
        : SAGE_GREEN
    }));
  }, [data]);

  // Handle point click
  const handlePointClick = (point: DataPoint) => {
    setSelectedPoint(point);
    onDataPointTap?.(point);
  };

  // Show empty state if not enough data
  if (data.length < 3) {
    return <EmptyState />;
  }

  return (
    <div className="w-full">
      {/* Time Range Selector */}
      <div className="flex justify-center gap-2 mb-6">
        {TIME_RANGES.map((range) => (
          <motion.button
            key={range.value}
            onClick={() => onTimeRangeChange?.(range.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              timeRange === range.value
                ? 'bg-[#9CAF88]/20 text-[#9CAF88] border border-[#9CAF88]/40'
                : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {range.label}
          </motion.button>
        ))}
      </div>

      {/* Chart */}
      <motion.div
        className="w-full h-48"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            onClick={(e) => {
              const activeIndex =
                typeof e?.activeTooltipIndex === 'number'
                  ? e.activeTooltipIndex
                  : typeof e?.activeTooltipIndex === 'string'
                    ? Number.parseInt(e.activeTooltipIndex, 10)
                    : undefined;

              if (
                typeof activeIndex === 'number' &&
                Number.isFinite(activeIndex) &&
                activeIndex >= 0 &&
                activeIndex < chartData.length
              ) {
                handlePointClick(chartData[activeIndex]);
              }
            }}
          >
            <XAxis
              dataKey="displayDate"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={50}
              stroke="rgba(255,255,255,0.1)"
              strokeDasharray="3 3"
            />
            <Line
              type="monotone"
              dataKey="posterior_score"
              stroke={SAGE_GREEN}
              strokeWidth={2}
              dot={{
                fill: '#1a1a1a',
                stroke: SAGE_GREEN,
                strokeWidth: 2,
                r: 4
              }}
              activeDot={{
                fill: SAGE_GREEN,
                stroke: '#fff',
                strokeWidth: 2,
                r: 6
              }}
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Selected Point Detail */}
      <AnimatePresence>
        {selectedPoint && (
          <motion.div
            layoutId={`point-${selectedPoint.id}`}
            className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/60 text-sm">
                {new Date(selectedPoint.date).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              <button
                onClick={() => setSelectedPoint(null)}
                className="text-white/40 hover:text-white/60 text-xs"
              >
                关闭
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="text-center">
                <p className="text-white/40 text-xs">先验</p>
                <p className="text-red-400 text-lg font-medium">{selectedPoint.prior_score}%</p>
              </div>
              <div className="text-center">
                <p className="text-white/40 text-xs">后验</p>
                <p className="text-[#9CAF88] text-lg font-medium">{selectedPoint.posterior_score}%</p>
              </div>
              <div className="text-center">
                <p className="text-white/40 text-xs">夸大</p>
                <p className="text-white text-lg font-medium">{selectedPoint.exaggeration_factor}x</p>
              </div>
            </div>

            {/* Evidence Stack */}
            {selectedPoint.evidence_stack.length > 0 && (
              <div>
                <p className="text-white/40 text-xs mb-2">证据栈</p>
                <div className="flex flex-wrap gap-1">
                  {selectedPoint.evidence_stack.map((evidence, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full text-xs"
                      style={{
                        backgroundColor: evidence.type === 'bio' ? `${SAGE_GREEN}20` :
                          evidence.type === 'science' ? '#6B8DD620' : `${CLAY}20`,
                        color: evidence.type === 'bio' ? SAGE_GREEN :
                          evidence.type === 'science' ? '#6B8DD6' : CLAY
                      }}
                    >
                      {evidence.type === 'bio' && '💚'}
                      {evidence.type === 'science' && '📚'}
                      {evidence.type === 'action' && '✨'}
                      {' '}{Math.round(evidence.weight * 100)}%
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AnxietyCurve;
