'use client';

/**
 * BayesianMoment Component
 * 
 * 贝叶斯时刻 - 展示计算过程和结果的戏剧性揭示
 * 数字从先验滚动到后验，显示夸大因子
 * 
 * @module components/bayesian/BayesianMoment
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, easeInOut, useSpring, useTransform } from 'framer-motion';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { calculateExaggerationFactor } from '@/lib/bayesian-evidence';

// ============================================
// Types
// ============================================

interface BayesianMomentProps {
  prior: number;
  posterior: number;
  onComplete: () => void;
}

// ============================================
// Animation Variants
// ============================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15
    }
  }
};

const glowVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: [0.3, 0.6, 0.3],
    scale: [0.8, 1.2, 0.8],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: easeInOut
    }
  }
};

// ============================================
// Number Roller Component
// ============================================

function NumberRoller({ from, to, duration = 2000 }: { from: number; to: number; duration?: number }) {
  const spring = useSpring(from, { 
    stiffness: 50, 
    damping: 20,
    duration: duration / 1000
  });
  const displayValue = useTransform(spring, (v) => Math.round(v));
  const [currentValue, setCurrentValue] = useState(from);

  useEffect(() => {
    spring.set(to);
    
    const unsubscribe = displayValue.on('change', (v) => {
      setCurrentValue(v);
    });
    
    return () => unsubscribe();
  }, [to, spring, displayValue]);

  return (
    <motion.span className="tabular-nums">
      {currentValue}
    </motion.span>
  );
}

// ============================================
// Component
// ============================================

export function BayesianMoment({
  prior,
  posterior,
  onComplete
}: BayesianMomentProps) {
  const [phase, setPhase] = useState<'formula' | 'rolling' | 'result'>('formula');
  const exaggerationFactor = calculateExaggerationFactor(prior, posterior);
  const isSignificantReduction = posterior < prior * 0.5;

  // Phase transitions
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    // Show formula for 1.5s
    timers.push(setTimeout(() => setPhase('rolling'), 1500));
    
    // Roll numbers for 2.5s
    timers.push(setTimeout(() => setPhase('result'), 4000));
    
    // Complete after showing result
    timers.push(setTimeout(() => onComplete(), 7000));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  // Celebratory haptics on significant reduction
  useEffect(() => {
    if (phase === 'result' && isSignificantReduction) {
      const triggerHaptic = async () => {
        try {
          await Haptics.notification({ type: NotificationType.Success });
        } catch {
          // Haptics not available
        }
      };
      triggerHaptic();
    }
  }, [phase, isSignificantReduction]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0A0A] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background Glow */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        variants={glowVariants}
        initial="initial"
        animate="animate"
      >
        <div 
          className="w-96 h-96 rounded-full blur-3xl"
          style={{
            background: isSignificantReduction 
              ? 'radial-gradient(circle, rgba(156,175,136,0.3) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(196,167,125,0.3) 0%, transparent 70%)'
          }}
        />
      </motion.div>

      <motion.div
        className="relative z-10 flex flex-col items-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Formula Display */}
        <AnimatePresence mode="wait">
          {phase === 'formula' && (
            <motion.div
              key="formula"
              className="text-center mb-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <motion.p
                className="text-white/40 text-sm mb-4"
                variants={itemVariants}
              >
                贝叶斯定理
              </motion.p>
              <motion.div
                className="text-white/80 text-2xl md:text-3xl font-light tracking-wider"
                variants={itemVariants}
              >
                P(H|E) = <span className="text-[#9CAF88]">P(E|H)</span> × <span className="text-red-400">P(H)</span> / P(E)
              </motion.div>
              <motion.p
                className="text-white/30 text-xs mt-4"
                variants={itemVariants}
              >
                后验概率 = 似然度 × 先验概率 / 证据强度
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Number Rolling */}
        <AnimatePresence mode="wait">
          {(phase === 'rolling' || phase === 'result') && (
            <motion.div
              key="numbers"
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 100 }}
            >
              <motion.p
                className="text-white/40 text-sm mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                你的恐惧概率
              </motion.p>
              
              <div className="flex items-center justify-center gap-4 mb-6">
                {/* Prior */}
                <div className="text-center">
                  <p className="text-white/30 text-xs mb-1">先验</p>
                  <span className="text-red-400 text-3xl font-light">{prior}%</span>
                </div>
                
                {/* Arrow */}
                <motion.div
                  className="text-white/40 text-2xl"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  →
                </motion.div>
                
                {/* Posterior */}
                <div className="text-center">
                  <p className="text-white/30 text-xs mb-1">后验</p>
                  <motion.span
                    className="text-6xl md:text-7xl font-light"
                    style={{
                      color: isSignificantReduction ? '#9CAF88' : '#C4A77D'
                    }}
                    animate={phase === 'result' ? {
                      scale: [1, 1.1, 1],
                      transition: { duration: 0.5 }
                    } : undefined}
                  >
                    <NumberRoller from={prior} to={posterior} />
                    <span className="text-3xl text-white/40">%</span>
                  </motion.span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Message */}
        <AnimatePresence>
          {phase === 'result' && (
            <motion.div
              className="text-center mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, type: 'spring' }}
            >
              {exaggerationFactor > 1 ? (
                <>
                  <motion.p
                    className="text-white text-xl md:text-2xl font-light mb-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    数学显示，你的恐惧被夸大了
                  </motion.p>
                  <motion.p
                    className="text-4xl md:text-5xl font-light"
                    style={{ color: '#9CAF88' }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.9, type: 'spring', stiffness: 200 }}
                  >
                    {exaggerationFactor === Infinity ? '∞' : exaggerationFactor} 倍
                  </motion.p>
                </>
              ) : (
                <motion.p
                  className="text-white/80 text-xl font-light"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  你的感知与现实相当接近 🌿
                </motion.p>
              )}

              {/* Encouragement */}
              <motion.p
                className="text-white/40 text-sm mt-6 max-w-xs mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                {isSignificantReduction 
                  ? '深呼吸，真相站在你这边 🌱'
                  : '继续收集证据，认知会越来越清晰 ✨'}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Progress Dots */}
      <motion.div
        className="absolute bottom-8 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {['formula', 'rolling', 'result'].map((p, i) => (
          <motion.div
            key={p}
            className="w-2 h-2 rounded-full"
            animate={{
              backgroundColor: ['formula', 'rolling', 'result'].indexOf(phase) >= i 
                ? '#9CAF88' 
                : 'rgba(255,255,255,0.2)'
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

export default BayesianMoment;
