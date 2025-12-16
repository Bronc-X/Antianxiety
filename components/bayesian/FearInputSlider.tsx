'use client';

/**
 * FearInputSlider Component
 * 
 * 恐惧输入滑块 - 主动式沉浸重构的第一步
 * 全屏黑色背景，红色渐变滑块，用于输入用户的恐惧值
 * 
 * @module components/bayesian/FearInputSlider
 */

import React, { useState, useCallback } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { BeliefContext } from '@/lib/services/bayesian-scholar';

// ============================================
// Types
// ============================================

interface FearInputSliderProps {
  value: number;
  onChange: (value: number) => void;
  onSubmit: () => void;
  beliefContext: BeliefContext;
  onContextChange: (context: BeliefContext) => void;
}

// ============================================
// Constants
// ============================================

const BELIEF_CONTEXTS: { value: BeliefContext; label: string; description: string }[] = [
  { value: 'metabolic_crash', label: '代谢崩溃', description: '担心血糖、能量或新陈代谢问题' },
  { value: 'cardiac_event', label: '心脏事件', description: '担心心跳、心悸或心脏健康' },
  { value: 'social_rejection', label: '社交被拒', description: '担心被他人拒绝或评判' },
  { value: 'custom', label: '自定义', description: '其他焦虑场景' }
];

// ============================================
// Component
// ============================================

export function FearInputSlider({
  value,
  onChange,
  onSubmit,
  beliefContext,
  onContextChange
}: FearInputSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  
  // Spring animation for the number display
  const springValue = useSpring(value, { stiffness: 100, damping: 20 });
  const displayValue = useTransform(springValue, (v) => Math.round(v));

  // Update spring when value changes
  React.useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  // Handle slider change with haptic feedback
  const handleSliderChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    onChange(newValue);
    
    // Subtle haptic feedback on value change
    try {
      if (newValue % 10 === 0) {
        await Haptics.impact({ style: ImpactStyle.Light });
      }
    } catch {
      // Haptics not available
    }
  }, [onChange]);

  // Handle submit with heavy haptic feedback
  const handleSubmit = useCallback(async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {
      // Haptics not available
    }
    onSubmit();
  }, [onSubmit]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0A0A]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <motion.div
        className="absolute top-8 left-0 right-0 text-center px-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-white/60 text-sm font-medium tracking-wider uppercase">
          认知校准
        </h2>
      </motion.div>

      {/* Context Selector */}
      <motion.div
        className="w-full max-w-md px-6 mb-12"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-white/40 text-sm mb-4 text-center">选择你的焦虑场景</p>
        <div className="grid grid-cols-2 gap-3">
          {BELIEF_CONTEXTS.map((ctx) => (
            <motion.button
              key={ctx.value}
              onClick={() => onContextChange(ctx.value)}
              className={`p-3 rounded-xl text-left transition-all ${
                beliefContext === ctx.value
                  ? 'bg-red-900/30 border border-red-500/50'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <span className={`text-sm font-medium ${
                beliefContext === ctx.value ? 'text-red-400' : 'text-white/80'
              }`}>
                {ctx.label}
              </span>
              <p className="text-xs text-white/40 mt-1 line-clamp-2">
                {ctx.description}
              </p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Main Question */}
      <motion.h1
        className="text-white text-xl md:text-2xl font-light text-center px-6 mb-8 max-w-md"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        你现在觉得这件事发生的可能性有多大？
      </motion.h1>

      {/* Value Display */}
      <motion.div
        className="relative mb-8"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
      >
        <motion.span
          className="text-7xl md:text-8xl font-light tabular-nums"
          style={{
            color: `rgb(${Math.min(255, 100 + value * 1.5)}, ${Math.max(50, 100 - value)}, ${Math.max(50, 100 - value)})`
          }}
          animate={{
            scale: isDragging ? 1.1 : 1
          }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <motion.span>{displayValue}</motion.span>
          <span className="text-4xl text-white/40">%</span>
        </motion.span>
      </motion.div>

      {/* Slider */}
      <motion.div
        className="w-full max-w-md px-8 mb-12"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="relative">
          {/* Slider Track Background */}
          <div className="absolute inset-0 h-3 rounded-full bg-white/10" />
          
          {/* Slider Track Fill */}
          <motion.div
            className="absolute left-0 top-0 h-3 rounded-full"
            style={{
              width: `${value}%`,
              background: `linear-gradient(90deg, #7f1d1d 0%, #dc2626 50%, #ef4444 100%)`
            }}
          />
          
          {/* Native Slider */}
          <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={handleSliderChange}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            className="relative w-full h-3 appearance-none bg-transparent cursor-pointer z-10
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-6
              [&::-webkit-slider-thumb]:h-6
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:shadow-lg
              [&::-webkit-slider-thumb]:shadow-red-500/30
              [&::-webkit-slider-thumb]:cursor-grab
              [&::-webkit-slider-thumb]:active:cursor-grabbing
              [&::-moz-range-thumb]:w-6
              [&::-moz-range-thumb]:h-6
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-white
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:shadow-lg
              [&::-moz-range-thumb]:cursor-grab"
          />
        </div>
        
        {/* Scale Labels */}
        <div className="flex justify-between mt-3 text-xs text-white/30">
          <span>不太可能</span>
          <span>非常可能</span>
        </div>
      </motion.div>

      {/* Submit Button */}
      <motion.button
        onClick={handleSubmit}
        className="px-8 py-4 rounded-full bg-gradient-to-r from-red-900 to-red-700 
          text-white font-medium shadow-lg shadow-red-900/30
          hover:from-red-800 hover:to-red-600 transition-all"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
      >
        开始校准认知
      </motion.button>

      {/* Hint */}
      <motion.p
        className="absolute bottom-8 text-white/30 text-xs text-center px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        滑动选择你感受到的恐惧程度，然后让科学帮你重新校准
      </motion.p>
    </motion.div>
  );
}

export default FearInputSlider;
