'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface GuideLineProps {
  show: boolean;
  targetPosition?: { x: number; y: number } | null;
}

export function GuideLine({ show, targetPosition }: GuideLineProps) {
  const [windowSize, setWindowSize] = useState<{ width: number; height: number } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 等待客户端挂载
  if (!isMounted || !show || !targetPosition || !windowSize) return null;

  // 起点：屏幕中下方（提示区域大概位置）
  const startX = windowSize.width / 2;
  const startY = windowSize.height * 0.65;
  
  // 终点：按钮底部中心
  const endX = targetPosition.x;
  const endY = targetPosition.y + 10;

  // 控制点：创建优美的曲线路径
  const controlX = (startX + endX) / 2;
  const controlY = (startY + endY) / 2 - 50;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* 粒子发光 */}
          <filter id="particleGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 流动粒子 1 - 大 */}
        <motion.circle
          r="8"
          fill="#D4AF37"
          filter="url(#particleGlow)"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.9, 0.9, 0],
            cx: [startX, controlX, endX, endX],
            cy: [startY, controlY, endY, endY],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0,
          }}
        />

        {/* 流动粒子 2 - 中 */}
        <motion.circle
          r="5"
          fill="#D4AF37"
          filter="url(#particleGlow)"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.8, 0.8, 0],
            cx: [startX, controlX, endX, endX],
            cy: [startY, controlY, endY, endY],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.6,
          }}
        />

        {/* 流动粒子 3 - 小 */}
        <motion.circle
          r="3"
          fill="#D4AF37"
          filter="url(#particleGlow)"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.7, 0.7, 0],
            cx: [startX, controlX, endX, endX],
            cy: [startY, controlY, endY, endY],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.2,
          }}
        />
      </svg>
    </div>
  );
}

export default GuideLine;
