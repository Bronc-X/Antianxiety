'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  formatValue?: (value: number) => string;
  marks?: { value: number; label: string }[];
  color?: string;
}

export default function Slider({
  min,
  max,
  step = 1,
  value,
  onChange,
  unit = '',
  formatValue,
  marks,
  color = '#0B3D2E',
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const percentage = ((value - min) / (max - min)) * 100;

  const displayValue = formatValue ? formatValue(value) : `${value}${unit}`;

  const handleTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, x / rect.width));
      const newValue = Math.round((min + percent * (max - min)) / step) * step;
      onChange(Math.max(min, Math.min(max, newValue)));
    },
    [min, max, step, onChange]
  );

  const handleDrag = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!trackRef.current || !isDragging) return;
      const rect = trackRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const x = clientX - rect.left;
      const percent = Math.max(0, Math.min(1, x / rect.width));
      const newValue = Math.round((min + percent * (max - min)) / step) * step;
      onChange(Math.max(min, Math.min(max, newValue)));
    },
    [min, max, step, onChange, isDragging]
  );

  return (
    <div className="space-y-2">
      {/* 当前值显示 */}
      <div className="flex justify-between items-center">
        <span className="text-2xl font-bold" style={{ color }}>
          {displayValue}
        </span>
        {marks && marks.length > 0 && (
          <span className="text-sm text-[#0B3D2E]/60">
            {marks.find((m) => m.value === value)?.label || ''}
          </span>
        )}
      </div>

      {/* 滑动条轨道 */}
      <div
        ref={trackRef}
        className="relative h-10 cursor-pointer touch-none"
        onClick={handleTrackClick}
        onMouseMove={handleDrag}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onTouchMove={handleDrag}
        onTouchEnd={() => setIsDragging(false)}
      >
        {/* 背景轨道 */}
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-2 bg-[#E7E1D6] rounded-full" />

        {/* 填充轨道 */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full"
          style={{ backgroundColor: color }}
          initial={false}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />

        {/* 滑块 */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full shadow-lg cursor-grab active:cursor-grabbing"
          style={{
            backgroundColor: 'white',
            border: `3px solid ${color}`,
            left: `calc(${percentage}% - 12px)`,
          }}
          initial={false}
          animate={{ scale: isDragging ? 1.2 : 1 }}
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
        />
      </div>

      {/* 刻度标记 */}
      {marks && marks.length > 0 && (
        <div className="flex justify-between text-xs text-[#0B3D2E]/50 px-1">
          {marks
            .filter((_, i) => i === 0 || i === marks.length - 1 || i === Math.floor(marks.length / 2))
            .map((mark) => (
              <span key={mark.value}>{mark.label}</span>
            ))}
        </div>
      )}
    </div>
  );
}
