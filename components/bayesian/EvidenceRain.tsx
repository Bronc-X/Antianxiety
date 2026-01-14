'use client';

/**
 * EvidenceRain Component
 * 
 * 证据雨 - 展示证据砝码落入认知天平的动画
 * 使用 Framer Motion spring physics 实现自然的落下效果
 * 
 * @module components/bayesian/EvidenceRain
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Evidence } from '@/lib/bayesian-evidence';

// ============================================
// Types
// ============================================

interface EvidenceRainProps {
  evidences: Evidence[];
  onComplete: () => void;
  staggerDelay?: number;
}

// ============================================
// Animation Variants
// ============================================

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.2
    }
  }
};

const evidenceVariants = {
  hidden: { 
    y: -200, 
    opacity: 0, 
    scale: 0,
    rotate: -10
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 200,
      damping: 15,
      mass: 1.5
    }
  },
  exit: {
    y: 50,
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.3 }
  }
};

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

function getEvidenceLabel(type: Evidence['type']): string {
  switch (type) {
    case 'bio':
      return '生理证据';
    case 'science':
      return '科学证据';
    case 'action':
      return '行为证据';
    default:
      return '证据';
  }
}

// ============================================
// Component
// ============================================

export function EvidenceRain({
  evidences,
  onComplete,
  staggerDelay = 0.3
}: EvidenceRainProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Trigger haptic feedback when each evidence lands
  useEffect(() => {
    if (visibleCount > 0 && visibleCount <= evidences.length) {
      const triggerHaptic = async () => {
        try {
          await Haptics.impact({ style: ImpactStyle.Medium });
        } catch {
          // Haptics not available
        }
      };
      triggerHaptic();
    }
  }, [visibleCount, evidences.length]);

  // Animate evidences one by one
  useEffect(() => {
    if (evidences.length === 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= evidences.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, staggerDelay * 1000);

    return () => clearInterval(timer);
  }, [evidences.length, onComplete, staggerDelay]);

  // Call onComplete when all evidences are visible
  useEffect(() => {
    if (visibleCount >= evidences.length && evidences.length > 0 && !isComplete) {
      const timer = setTimeout(() => {
        setIsComplete(true);
        onComplete();
      }, 1000); // Wait 1 second after last evidence
      return () => clearTimeout(timer);
    }
  }, [visibleCount, evidences.length, onComplete, isComplete]);

  // Handle tap on science evidence
  const handleEvidenceTap = (evidence: Evidence) => {
    if (evidence.type === 'science' && evidence.source_id) {
      const url = `https://www.semanticscholar.org/paper/${evidence.source_id}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0A0A] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <motion.div
        className="absolute top-8 left-0 right-0 text-center"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-white/60 text-sm font-medium tracking-wider uppercase">
          收集证据中
        </h2>
        <p className="text-white/40 text-xs mt-2">
          正在为你的认知天平添加砝码...
        </p>
      </motion.div>

      {/* Scale Visual */}
      <motion.div
        className="relative w-64 h-32 mb-8"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {/* Scale Base */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-16 bg-white/20 rounded-full" />
        
        {/* Scale Beam */}
        <motion.div
          className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48 h-1 bg-white/30 rounded-full origin-center"
          animate={{
            rotate: visibleCount > 0 ? -5 - visibleCount * 2 : 0
          }}
          transition={{ type: 'spring', stiffness: 50, damping: 10 }}
        >
          {/* Left Pan (Fear) */}
          <div className="absolute -left-2 -top-4 w-8 h-8 rounded-full bg-red-500/30 border border-red-500/50 flex items-center justify-center">
            <span className="text-xs">😰</span>
          </div>
          
          {/* Right Pan (Evidence) */}
          <div className="absolute -right-2 -top-4 w-8 h-8 rounded-full bg-green-500/30 border border-green-500/50 flex items-center justify-center">
            <span className="text-xs">⚖️</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Evidence Cards */}
      <motion.div
        className="flex flex-col gap-4 w-full max-w-md px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {evidences.slice(0, visibleCount).map((evidence, index) => (
            <motion.div
              key={`${evidence.type}-${index}`}
              variants={evidenceVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => handleEvidenceTap(evidence)}
              className={`p-4 rounded-xl border backdrop-blur-sm ${
                evidence.type === 'science' ? 'cursor-pointer hover:bg-white/10' : ''
              }`}
              style={{
                backgroundColor: `${getEvidenceColor(evidence.type)}15`,
                borderColor: `${getEvidenceColor(evidence.type)}40`
              }}
              whileTap={evidence.type === 'science' ? { scale: 0.98 } : undefined}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <motion.div
                  className="text-2xl"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                >
                  {getEvidenceIcon(evidence.type)}
                </motion.div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ 
                        backgroundColor: `${getEvidenceColor(evidence.type)}30`,
                        color: getEvidenceColor(evidence.type)
                      }}
                    >
                      {getEvidenceLabel(evidence.type)}
                    </span>
                    <span className="text-white/40 text-xs">
                      权重: {Math.round(evidence.weight * 100)}%
                    </span>
                  </div>
                  
                  <p className="text-white/80 text-sm line-clamp-2">
                    {evidence.value}
                  </p>
                  
                  {evidence.type === 'science' && evidence.consensus !== undefined && (
                    <p className="text-white/40 text-xs mt-1">
                      共识度: {Math.round(evidence.consensus * 100)}% · 点击查看论文
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Progress Indicator */}
      <motion.div
        className="absolute bottom-8 left-0 right-0 flex justify-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {evidences.map((_, index) => (
          <motion.div
            key={index}
            className="w-2 h-2 rounded-full"
            initial={{ scale: 0 }}
            animate={{ 
              scale: 1,
              backgroundColor: index < visibleCount ? '#9CAF88' : 'rgba(255,255,255,0.2)'
            }}
            transition={{ delay: index * 0.1 }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

export default EvidenceRain;
