'use client';

import { Lock, PenLine, TrendingUp } from 'lucide-react';

/**
 * 空状态雷达图组件
 * 当用户没有足够的日志数据时显示
 * 鼓励用户记录数据以解锁完整功能
 */
interface EmptyRadarChartProps {
  message: string;
  minLogCount: number;
  actualLogCount: number;
  onStartLogging?: () => void;
}

export default function EmptyRadarChart({
  message,
  minLogCount,
  actualLogCount,
  onStartLogging
}: EmptyRadarChartProps) {
  return (
    <div className="relative w-full h-[400px] flex items-center justify-center">
      {/* 灰色雷达图轮廓 */}
      <svg 
        viewBox="0 0 400 400" 
        className="absolute inset-0 w-full h-full opacity-10"
      >
        {/* 6个同心圆 */}
        {[20, 40, 60, 80, 100, 120].map((radius, i) => (
          <circle
            key={i}
            cx="200"
            cy="200"
            r={radius}
            fill="none"
            stroke="#0B3D2E"
            strokeWidth="1"
          />
        ))}
        {/* 6条射线 */}
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i * 60 - 90) * (Math.PI / 180);
          const x = 200 + Math.cos(angle) * 120;
          const y = 200 + Math.sin(angle) * 120;
          return (
            <line
              key={i}
              x1="200"
              y1="200"
              x2={x}
              y2={y}
              stroke="#0B3D2E"
              strokeWidth="1"
            />
          );
        })}
        {/* 维度标签 */}
        {['睡眠', '压力', '能量', '运动', '水分', '健康'].map((label, i) => {
          const angle = (i * 60 - 90) * (Math.PI / 180);
          const x = 200 + Math.cos(angle) * 140;
          const y = 200 + Math.sin(angle) * 140;
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              fill="#0B3D2E"
              fontSize="14"
              opacity="0.3"
            >
              {label}
            </text>
          );
        })}
      </svg>

      {/* 中心锁定图标和提示 */}
      <div className="relative z-10 text-center max-w-sm p-8">
        <div className="w-20 h-20 mx-auto mb-6 bg-[#0B3D2E]/10 rounded-full flex items-center justify-center">
          <Lock className="w-10 h-10 text-[#0B3D2E]/40" />
        </div>

        <h3 className="text-xl font-medium text-[#0B3D2E] mb-3">
          {message}
        </h3>

        {/* 进度提示 */}
        {actualLogCount > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-sm text-[#0B3D2E]/60">
                已记录 {actualLogCount} / {minLogCount} 天
              </span>
            </div>
            <div className="w-full h-2 bg-[#E7E1D6] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#0B3D2E] to-amber-500 transition-all duration-500"
                style={{ width: `${(actualLogCount / minLogCount) * 100}%` }}
              />
            </div>
          </div>
        )}

        <p className="text-sm text-[#0B3D2E]/60 mb-6 leading-relaxed">
          你的代谢指纹需要真实的健康数据来生成。完成 {minLogCount} 天的记录后，AI 将为你构建个性化的健康雷达图。
        </p>

        {/* 行动按钮 */}
        {onStartLogging && (
          <button
            onClick={onStartLogging}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0B3D2E] text-[#FAF6EF] rounded-xl font-medium hover:bg-[#0B3D2E]/90 transition-colors"
          >
            <PenLine className="w-5 h-5" />
            开始记录今日数据
          </button>
        )}

        {/* 提示卡片 */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-left">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-900 mb-1">
                为什么需要真实数据？
              </h4>
              <p className="text-xs text-amber-800/80 leading-relaxed">
                我们坚持不伪造数据的原则。你的睡眠时长、压力水平和能量状态需要基于真实记录，AI 才能给出科学的分析和建议。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
