'use client';

/**
 * PassiveNudge Component
 * 
 * 被动微调 - 不打断用户的微小概率修正提示
 * 当用户完成健康习惯时显示，带有粒子飞行动画
 * 
 * @module components/bayesian/PassiveNudge
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// ============================================
// Types
// ============================================

interface PassiveNudgeProps {
  actionType: string;
  correction: number;
  targetPosition?: { x: number; y: number };
  onComplete?: () => void;
  duration?: number;
}

// ============================================
// Constants
// ============================================

const ACTION_NAMES: Record<string, string> = {
  breathing_exercise: '呼吸练习',
  meditation: '冥想',
  exercise: '运动',
  sleep_improvement: '睡眠改善',
  hydration: '补水',
  journaling: '日记',
  stretching: '拉伸',
  default: '健康行为'
};

const ACTION_EMOJIS: Record<string, string> = {
  breathing_exercise: '🌬️',
  meditation: '🧘',
  exercise: '💪',
  sleep_improvement: '😴',
  hydration: '💧',
  journaling: '📝',
  stretching: '🤸',
  default: '✨'
};

// ============================================
// Animation Variants
// ============================================

const toastVariants = {
  hidden: { 
    y: -100, 
    opacity: 0,
    scale: 0.9
  },
  visible: { 
    y: 0, 
    opacity: 1,
    scale: 1,
    transition: { 
      type: 'spring' as const, 
      stiffness: 300, 
      damping: 25 
    }
  },
  exit: { 
    y: -50, 
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.3 }
  }
};

// ============================================
// Particle Component
// ============================================

function FlyingParticle({ 
  targetPosition, 
  onComplete 
}: { 
  targetPosition: { x: number; y: number }; 
  onComplete: () => void;
}) {
  return (
    <motion.div
      className="fixed w-4 h-4 rounded-full bg-[#9CAF88] shadow-lg shadow-[#9CAF88]/50 z-[60]"
      initial={{ 
        x: window.innerWidth / 2, 
        y: 80, 
        scale: 1, 
        opacity: 1 
      }}
      animate={{
        x: [window.innerWidth / 2, window.innerWidth / 2 + 50, targetPosition.x],
        y: [80, 40, targetPosition.y],
        scale: [1, 1.2, 0.5],
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: 1.2,
        ease: [0.22, 1, 0.36, 1], // Custom bezier curve
        times: [0, 0.4, 1]
      }}
      onAnimationComplete={onComplete}
    />
  );
}

// ============================================
// Component
// ============================================

export function PassiveNudge({
  actionType,
  correction,
  targetPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 },
  onComplete,
  duration = 3000
}: PassiveNudgeProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showParticle, setShowParticle] = useState(false);

  const actionName = ACTION_NAMES[actionType] || ACTION_NAMES.default;
  const actionEmoji = ACTION_EMOJIS[actionType] || ACTION_EMOJIS.default;

  // Trigger haptic feedback on mount
  useEffect(() => {
    const triggerHaptic = async () => {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch {
        // Haptics not available
      }
    };
    triggerHaptic();
  }, []);

  // Show particle after toast appears
  useEffect(() => {
    const particleTimer = setTimeout(() => {
      setShowParticle(true);
    }, 500);

    return () => clearTimeout(particleTimer);
  }, []);

  // Auto-hide after duration
  useEffect(() => {
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(hideTimer);
  }, [duration]);

  // Call onComplete when animation finishes
  const handleExitComplete = () => {
    onComplete?.();
  };

  const handleParticleComplete = () => {
    setShowParticle(false);
  };

  return (
    <>
      {/* Toast Notification */}
      <AnimatePresence onExitComplete={handleExitComplete}>
        {isVisible && (
          <motion.div
            className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none"
            variants={toastVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="bg-[#1a1a1a]/90 backdrop-blur-xl border border-[#9CAF88]/30 rounded-2xl px-5 py-3 shadow-xl shadow-black/20 max-w-sm">
              <div className="flex items-center gap-3">
                {/* Emoji */}
                <motion.span
                  className="text-2xl"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                >
                  {actionEmoji}
                </motion.span>
                
                {/* Content */}
                <div className="flex-1">
                  <p className="text-white/90 text-sm font-medium">
                    {actionName}完成
                  </p>
                  <p className="text-[#9CAF88] text-xs mt-0.5">
                    皮质醇风险概率修正：
                    <motion.span
                      className="font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {correction}%
                    </motion.span>
                  </p>
                </div>
                
                {/* Indicator */}
                <motion.div
                  className="w-8 h-8 rounded-full bg-[#9CAF88]/20 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring' }}
                >
                  <motion.span
                    className="text-[#9CAF88] text-xs font-bold"
                    animate={{ 
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ 
                      duration: 1,
                      repeat: 2,
                      ease: 'easeInOut'
                    }}
                  >
                    ↓
                  </motion.span>
                </motion.div>
              </div>
              
              {/* Progress Bar */}
              <motion.div
                className="mt-2 h-0.5 bg-white/10 rounded-full overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.div
                  className="h-full bg-[#9CAF88]/50"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: duration / 1000, ease: 'linear' }}
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flying Particle */}
      <AnimatePresence>
        {showParticle && (
          <FlyingParticle 
            targetPosition={targetPosition} 
            onComplete={handleParticleComplete}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default PassiveNudge;
