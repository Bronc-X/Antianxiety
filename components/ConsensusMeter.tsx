'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { 
  getConsensusLevel, 
  getConsensusColor, 
  formatConsensusTextZh,
  formatVerificationTextZh,
  type ConsensusLevel 
} from '@/lib/consensus-meter';

interface ConsensusMeterProps {
  percentage: number;
  metaAnalysisCount: number;
  className?: string;
  animated?: boolean;
}

export function ConsensusMeter({ 
  percentage, 
  metaAnalysisCount, 
  className = '',
  animated = true 
}: ConsensusMeterProps) {
  const level = getConsensusLevel(percentage);
  const color = getConsensusColor(level);
  const [displayPercentage, setDisplayPercentage] = useState(0);
  const displayPercentageRef = useRef(0);

  const updateDisplayPercentage = (value: number) => {
    displayPercentageRef.current = value;
    setDisplayPercentage(value);
  };
  
  // 弹簧动画数值
  const springValue = useSpring(0, { stiffness: 50, damping: 15 });
  const angle = useTransform(springValue, [0, 100], [-90, 90]);
  
  useEffect(() => {
    springValue.set(percentage);
    // 数字滚动效果
    const duration = 1500;
    const startTime = Date.now();
    const startValue = displayPercentageRef.current;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      updateDisplayPercentage(Math.round(startValue + (percentage - startValue) * eased));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    if (animated) {
      requestAnimationFrame(animate);
    } else {
      const timer = setTimeout(() => updateDisplayPercentage(percentage), 0);
      return () => clearTimeout(timer);
    }
  }, [percentage, animated, springValue]);
  
  // 获取渐变色
  const getGradientColors = (lvl: ConsensusLevel) => {
    switch (lvl) {
      case 'high': return ['#22c55e', '#10b981', '#059669'];
      case 'emerging': return ['#eab308', '#f59e0b', '#d97706'];
      case 'controversial': return ['#ef4444', '#f97316', '#dc2626'];
    }
  };
  
  const gradientColors = getGradientColors(level);
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* 仪表盘 */}
      <div className="relative w-36 h-20 overflow-hidden">
        {/* 发光背景 */}
        <motion.div
          className="absolute inset-0 blur-2xl opacity-30"
          style={{
            background: `radial-gradient(ellipse at center bottom, ${color} 0%, transparent 70%)`,
          }}
          animate={{
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* SVG 仪表盘 */}
        <div className="absolute inset-0">
          <svg viewBox="0 0 100 55" className="w-full h-full">
            <defs>
              {/* 渐变定义 */}
              <linearGradient id={`gauge-gradient-${level}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={gradientColors[0]} />
                <stop offset="50%" stopColor={gradientColors[1]} />
                <stop offset="100%" stopColor={gradientColors[2]} />
              </linearGradient>
              
              {/* 发光滤镜 */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* 背景弧 - 带刻度 */}
            <path
              d="M 5 50 A 45 45 0 0 1 95 50"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="6"
              strokeLinecap="round"
            />
            
            {/* 彩色进度弧 - 带发光 */}
            <motion.path
              d="M 5 50 A 45 45 0 0 1 95 50"
              fill="none"
              stroke={`url(#gauge-gradient-${level})`}
              strokeWidth="6"
              strokeLinecap="round"
              filter="url(#glow)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: percentage / 100 }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            />
            
            {/* 刻度线 */}
            {[0, 25, 50, 75, 100].map((tick) => {
              const tickAngle = (tick / 100) * 180;
              const rad = (tickAngle * Math.PI) / 180;
              const x1 = 50 - 36 * Math.cos(rad);
              const y1 = 50 - 36 * Math.sin(rad);
              const x2 = 50 - 45 * Math.cos(rad);
              const y2 = 50 - 45 * Math.sin(rad);
              const isActive = tick <= percentage;
              return (
                <motion.line
                  key={tick}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isActive ? color : "#d1d5db"}
                  strokeWidth="1.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: tick / 200 }}
                />
              );
            })}
            
            {/* 刻度数字 */}
            {[0, 50, 100].map((tick) => {
              const tickAngle = (tick / 100) * 180;
              const rad = (tickAngle * Math.PI) / 180;
              const x = 50 - 32 * Math.cos(rad);
              const y = 50 - 32 * Math.sin(rad);
              return (
                <text
                  key={tick}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[6px] fill-gray-400"
                >
                  {tick}
                </text>
              );
            })}
          </svg>
        </div>
        
        {/* 指针 - 带发光 */}
        <motion.div
          className="absolute bottom-0 left-1/2 origin-bottom"
          style={{ 
            width: '3px', 
            height: '32px', 
            marginLeft: '-1.5px',
            rotate: angle,
          }}
        >
          <div 
            className="w-full h-full rounded-full"
            style={{ 
              background: `linear-gradient(to top, ${color}, ${gradientColors[0]})`,
              boxShadow: `0 0 10px ${color}80`,
            }}
          />
        </motion.div>
        
        {/* 中心点 - 带脉动 */}
        <motion.div 
          className="absolute bottom-0 left-1/2 w-4 h-4 rounded-full -translate-x-1/2 translate-y-1/2"
          style={{ 
            background: `radial-gradient(circle, white 30%, ${color} 100%)`,
            boxShadow: `0 0 15px ${color}60`,
          }}
          animate={{
            boxShadow: [
              `0 0 10px ${color}40`,
              `0 0 20px ${color}60`,
              `0 0 10px ${color}40`,
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* 百分比数字 */}
        <motion.div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 text-lg font-bold"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          {displayPercentage}%
        </motion.div>
      </div>
      
      {/* 共识级别标签 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, type: "spring" }}
        className="mt-3 text-center"
      >
        <motion.div 
          className="text-sm font-semibold px-3 py-1 rounded-full"
          style={{ 
            color: 'white',
            background: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[2]})`,
            boxShadow: `0 2px 10px ${color}40`,
          }}
          whileHover={{ scale: 1.05 }}
        >
          {formatConsensusTextZh(percentage)}
        </motion.div>
        <div className="text-xs text-gray-500 mt-1.5">
          {formatVerificationTextZh(metaAnalysisCount)}
        </div>
      </motion.div>
    </div>
  );
}

// 简化版共识指示器（用于列表项）
export function ConsensusIndicator({ percentage }: { percentage: number }) {
  const level = getConsensusLevel(percentage);
  const color = getConsensusColor(level);
  
  const labels: Record<ConsensusLevel, string> = {
    high: '高共识',
    emerging: '新兴',
    controversial: '争议'
  };
  
  return (
    <span 
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ 
        backgroundColor: `${color}20`,
        color: color
      }}
    >
      <span 
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {labels[level]}
    </span>
  );
}

export default ConsensusMeter;
