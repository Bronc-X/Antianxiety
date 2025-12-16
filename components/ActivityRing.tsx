'use client';

import { motion } from 'framer-motion';

/**
 * ActivityRing 组件 - 类似 Apple Health 的活动环
 * 
 * 颜色标准（与 Apple Health 一致）：
 * - 红色 (#FA114F): 活动/移动
 * - 绿色 (#92E82A): 锻炼
 * - 青色 (#00C7BE): 站立/活动
 */

// Apple Health 标准颜色
export const RING_COLORS = {
  movement: '#FA114F',  // 红色 - 活动
  exercise: '#92E82A',  // 绿色 - 锻炼
  standing: '#00C7BE',  // 青色 - 站立
};

interface ActivityRingProps {
  movement: number;    // 0-100, 红色
  exercise: number;    // 0-100, 绿色
  standing: number;    // 0-100, 蓝色/青色
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  animated?: boolean;
}

export default function ActivityRing({
  movement,
  exercise,
  standing,
  size = 'md',
  showLabels = true,
  animated = true,
}: ActivityRingProps) {
  // 尺寸配置
  const sizeConfig = {
    sm: { width: 100, strokeWidth: 8, fontSize: 'text-xs' },
    md: { width: 160, strokeWidth: 12, fontSize: 'text-sm' },
    lg: { width: 220, strokeWidth: 16, fontSize: 'text-base' },
  };

  const config = sizeConfig[size];
  const center = config.width / 2;
  
  // 三个环的半径（从外到内）
  const radii = {
    movement: center - config.strokeWidth / 2 - 2,
    exercise: center - config.strokeWidth * 1.5 - 6,
    standing: center - config.strokeWidth * 2.5 - 10,
  };

  // 计算圆周长
  const getCircumference = (radius: number) => 2 * Math.PI * radius;

  // 计算 stroke-dashoffset（用于显示进度）
  const getStrokeDashoffset = (percentage: number, circumference: number) => {
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    return circumference - (clampedPercentage / 100) * circumference;
  };

  // 渲染单个环
  const renderRing = (
    radius: number,
    percentage: number,
    color: string,
    delay: number
  ) => {
    const circumference = getCircumference(radius);
    const strokeDashoffset = getStrokeDashoffset(percentage, circumference);

    return (
      <>
        {/* 背景环 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={config.strokeWidth}
          strokeOpacity={0.2}
        />
        {/* 进度环 */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, delay, ease: 'easeOut' }}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
          }}
        />
      </>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* SVG 活动环 */}
      <svg
        width={config.width}
        height={config.width}
        viewBox={`0 0 ${config.width} ${config.width}`}
      >
        {/* 外环 - 活动/移动 (红色) */}
        {renderRing(radii.movement, movement, RING_COLORS.movement, 0)}
        
        {/* 中环 - 锻炼 (绿色) */}
        {renderRing(radii.exercise, exercise, RING_COLORS.exercise, 0.2)}
        
        {/* 内环 - 站立 (青色) */}
        {renderRing(radii.standing, standing, RING_COLORS.standing, 0.4)}
      </svg>

      {/* 标签 */}
      {showLabels && (
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: RING_COLORS.movement }}
            />
            <span className={`${config.fontSize} text-[#0B3D2E]/70`}>
              活动 {Math.round(movement)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: RING_COLORS.exercise }}
            />
            <span className={`${config.fontSize} text-[#0B3D2E]/70`}>
              锻炼 {Math.round(exercise)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: RING_COLORS.standing }}
            />
            <span className={`${config.fontSize} text-[#0B3D2E]/70`}>
              站立 {Math.round(standing)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 从每日日志计算活动环百分比
 * 
 * 目标值：
 * - 活动：基于睡眠质量和整体状态
 * - 锻炼：30分钟 = 100%
 * - 站立：基于非睡眠时间的活动
 */
export function calculateRingPercentages(log: {
  sleep_duration_minutes?: number | null;
  sleep_quality?: string | null;
  exercise_duration_minutes?: number | null;
  stress_level?: number | null;
} | null): { movement: number; exercise: number; standing: number } {
  if (!log) {
    return { movement: 0, exercise: 0, standing: 0 };
  }

  // 锻炼环：30分钟 = 100%
  const exerciseMinutes = log.exercise_duration_minutes || 0;
  const exercise = Math.min(100, (exerciseMinutes / 30) * 100);

  // 活动环：基于睡眠质量
  const sleepQualityScores: Record<string, number> = {
    'excellent': 100,
    'good': 80,
    'average': 60,
    'poor': 40,
    'very_poor': 20,
  };
  const movement = sleepQualityScores[log.sleep_quality || ''] || 50;

  // 站立环：基于压力水平（低压力 = 高活动）
  const stressLevel = log.stress_level || 5;
  const standing = Math.max(0, 100 - (stressLevel - 1) * 10);

  return { movement, exercise, standing };
}
