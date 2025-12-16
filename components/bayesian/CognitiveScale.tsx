'use client';

/**
 * CognitiveScale Component
 * 
 * 认知天平 - 可视化贝叶斯计算的核心组件
 * 一个精美的3D风格天平，左端显示恐惧（红），右端显示真相（绿）
 * 
 * @module components/bayesian/CognitiveScale
 */

import React, { useMemo } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Evidence } from '@/lib/bayesian-evidence';

// ============================================
// Types
// ============================================

interface CognitiveScaleProps {
  priorScore: number;
  posteriorScore: number;
  evidenceStack: Evidence[];
  isAnimating?: boolean;
  onEvidenceTap?: (evidence: Evidence) => void;
}

// ============================================
// Helper Functions
// ============================================

function getEvidenceColor(type: Evidence['type']): string {
  switch (type) {
    case 'bio':
      return '#9CAF88'; // Sage green
    case 'science':
      return '#6B8DD6'; // Soft blue
    case 'action':
      return '#C4A77D'; // Clay
    default:
      return '#9CAF88';
  }
}

function getEvidenceIcon(type: Evidence['type']): string {
  switch (type) {
    case 'bio':
      return '💚';
    case 'science':
      return '📚';
    case 'action':
      return '✨';
    default:
      return '⚖️';
  }
}

// ============================================
// Sub Components
// ============================================

// 发光圆环组件
const GlowRing: React.FC<{ color: string; size: number; intensity?: number }> = ({ 
  color, 
  size, 
  intensity = 0.5 
}) => (
  <div 
    className="absolute rounded-full"
    style={{
      width: size,
      height: size,
      background: `radial-gradient(circle, ${color}${Math.round(intensity * 40).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
      filter: `blur(${size * 0.15}px)`,
    }}
  />
);

// 砝码组件
const Weight: React.FC<{ 
  value: number; 
  color: string; 
  delay?: number;
  size?: 'sm' | 'md' | 'lg';
}> = ({ value, color, delay = 0, size = 'md' }) => {
  const sizeMap = { sm: 28, md: 36, lg: 44 };
  const s = sizeMap[size];
  
  return (
    <motion.div
      className="relative flex items-center justify-center"
      initial={{ y: -30, opacity: 0, scale: 0.5 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 20,
        delay 
      }}
      style={{ width: s, height: s }}
    >
      {/* 发光效果 */}
      <div 
        className="absolute inset-0 rounded-lg"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${color}40, ${color}10)`,
          boxShadow: `0 0 20px ${color}30, inset 0 1px 1px rgba(255,255,255,0.2)`,
        }}
      />
      {/* 砝码主体 */}
      <div 
        className="relative rounded-lg flex items-center justify-center font-medium text-xs"
        style={{
          width: s - 4,
          height: s - 4,
          background: `linear-gradient(135deg, ${color}30 0%, ${color}15 100%)`,
          border: `1px solid ${color}50`,
          color: color,
          textShadow: `0 0 10px ${color}`,
        }}
      >
        {value}%
      </div>
    </motion.div>
  );
};

// ============================================
// Main Component
// ============================================

export function CognitiveScale({
  priorScore,
  posteriorScore,
  evidenceStack,
  isAnimating = false,
  onEvidenceTap
}: CognitiveScaleProps) {
  // 计算天平倾斜角度 - 基于恐惧和真相的差值
  const tiltAngle = useMemo(() => {
    const diff = priorScore - posteriorScore;
    // 正值 = 恐惧更重 = 向左倾斜
    // 负值 = 真相更重 = 向右倾斜
    return Math.max(-18, Math.min(18, diff * 0.2));
  }, [priorScore, posteriorScore]);

  // 使用 spring 动画平滑倾斜
  const springTilt = useSpring(tiltAngle, { stiffness: 80, damping: 15 });
  
  // 计算托盘的垂直偏移
  const leftPanY = useTransform(springTilt, [-18, 18], [-20, 20]);
  const rightPanY = useTransform(springTilt, [-18, 18], [20, -20]);

  // 计算降低百分比
  const reduction = priorScore > posteriorScore ? priorScore - posteriorScore : 0;
  const exaggerationFactor = posteriorScore > 0 ? (priorScore / posteriorScore).toFixed(1) : '∞';

  return (
    <div className="relative w-full max-w-md mx-auto py-4">
      {/* 背景光晕 */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute left-1/4 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #ef4444 0%, transparent 70%)' }}
        />
        <div 
          className="absolute right-1/4 top-1/2 translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #9CAF88 0%, transparent 70%)' }}
        />
      </div>

      {/* 天平主体 */}
      <div className="relative h-72">
        {/* 支柱 */}
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 flex flex-col items-center">
          {/* 底座 */}
          <div 
            className="w-24 h-3 rounded-full"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.1)',
            }}
          />
          {/* 支柱 */}
          <div 
            className="w-2 h-28 -mt-1 rounded-full"
            style={{
              background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 100%)',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)',
            }}
          />
          {/* 顶部枢轴 */}
          <motion.div 
            className="w-6 h-6 -mt-1 rounded-full relative"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), rgba(255,255,255,0.1))',
              boxShadow: '0 0 15px rgba(255,255,255,0.2), inset 0 1px 2px rgba(255,255,255,0.3)',
            }}
            animate={{ 
              boxShadow: isAnimating 
                ? ['0 0 15px rgba(255,255,255,0.2)', '0 0 25px rgba(255,255,255,0.4)', '0 0 15px rgba(255,255,255,0.2)']
                : '0 0 15px rgba(255,255,255,0.2)'
            }}
            transition={{ duration: 1.5, repeat: isAnimating ? Infinity : 0 }}
          />
        </div>

        {/* 横梁 */}
        <motion.div 
          className="absolute left-1/2 top-[calc(100%-140px)] -translate-x-1/2 w-[85%] h-2 origin-center"
          style={{ 
            rotate: springTilt,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.08) 100%)',
            borderRadius: 4,
            boxShadow: '0 2px 10px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.2)',
          }}
        >
          {/* 左侧连接线 */}
          <motion.div 
            className="absolute left-4 top-1 w-0.5 origin-top"
            style={{ 
              height: 50,
              y: leftPanY,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(239,68,68,0.3) 100%)',
            }}
          />
          {/* 右侧连接线 */}
          <motion.div 
            className="absolute right-4 top-1 w-0.5 origin-top"
            style={{ 
              height: 50,
              y: rightPanY,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(156,175,136,0.3) 100%)',
            }}
          />
        </motion.div>

        {/* 左托盘 - 恐惧 */}
        <motion.div 
          className="absolute left-[12%] top-[calc(100%-80px)] flex flex-col items-center"
          style={{ y: leftPanY }}
        >
          {/* 托盘 */}
          <div 
            className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%)',
              border: '1px solid rgba(239,68,68,0.3)',
              boxShadow: '0 8px 32px rgba(239,68,68,0.2), inset 0 1px 1px rgba(255,255,255,0.1)',
            }}
          >
            <GlowRing color="#ef4444" size={80} intensity={0.3} />
            <span className="text-red-400 text-3xl font-light relative z-10">{priorScore}</span>
            <span className="text-red-400/60 text-sm relative z-10">%</span>
          </div>
          <span className="text-white/50 text-xs mt-2 tracking-wider">恐惧</span>
        </motion.div>

        {/* 右托盘 - 真相 */}
        <motion.div 
          className="absolute right-[12%] top-[calc(100%-80px)] flex flex-col items-center"
          style={{ y: rightPanY }}
        >
          {/* 托盘 */}
          <div 
            className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(156,175,136,0.15) 0%, rgba(156,175,136,0.05) 100%)',
              border: '1px solid rgba(156,175,136,0.3)',
              boxShadow: '0 8px 32px rgba(156,175,136,0.2), inset 0 1px 1px rgba(255,255,255,0.1)',
            }}
          >
            <GlowRing color="#9CAF88" size={80} intensity={0.3} />
            <span className="text-[#9CAF88] text-3xl font-light relative z-10">{posteriorScore}</span>
            <span className="text-[#9CAF88]/60 text-sm relative z-10">%</span>
          </div>
          <span className="text-white/50 text-xs mt-2 tracking-wider">真相</span>
        </motion.div>
      </div>

      {/* 证据砝码展示 */}
      {evidenceStack.length > 0 && (
        <motion.div
          className="mt-4 px-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-white/30 text-xs text-center mb-3 tracking-wider">证据砝码</p>
          <div className="flex flex-wrap justify-center gap-2">
            {evidenceStack.map((evidence, index) => (
              <motion.button
                key={`${evidence.type}-${index}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1, type: 'spring' }}
                onClick={() => onEvidenceTap?.(evidence)}
                className="group relative px-3 py-2 rounded-xl transition-all duration-300 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${getEvidenceColor(evidence.type)}15 0%, ${getEvidenceColor(evidence.type)}05 100%)`,
                  border: `1px solid ${getEvidenceColor(evidence.type)}30`,
                }}
              >
                <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: getEvidenceColor(evidence.type) }}>
                  <span>{getEvidenceIcon(evidence.type)}</span>
                  <span>{Math.round(evidence.weight * 100)}%</span>
                </span>
                {/* Hover 发光效果 */}
                <div 
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ boxShadow: `0 0 20px ${getEvidenceColor(evidence.type)}30` }}
                />
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* 降低指示器 */}
      {reduction > 0 && (
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(156,175,136,0.15) 0%, rgba(156,175,136,0.05) 100%)',
              border: '1px solid rgba(156,175,136,0.2)',
            }}
          >
            <span className="text-[#9CAF88]/80 text-sm">恐惧降低了</span>
            <span className="text-[#9CAF88] text-lg font-medium">{reduction}%</span>
          </div>
          {parseFloat(exaggerationFactor) > 1.2 && (
            <motion.p 
              className="text-white/40 text-xs mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              你的恐惧被夸大了 <span className="text-[#C4A77D]">{exaggerationFactor}x</span>
            </motion.p>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default CognitiveScale;
