'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function BreathingModal({ isOpen, onClose, onComplete }: BreathingModalProps) {
  const [timeRemaining, setTimeRemaining] = useState(300); // 5分钟 = 300秒
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [cycleCount, setCycleCount] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cycleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 呼吸循环：4秒吸气 + 4秒呼气
  useEffect(() => {
    if (!isOpen || !isActive) return;

    const startCycle = () => {
      setPhase('inhale');
      cycleTimerRef.current = setTimeout(() => {
        setPhase('exhale');
        setCycleCount(prev => prev + 1);
      }, 4000);
    };

    startCycle();
    const interval = setInterval(startCycle, 8000);

    return () => {
      clearInterval(interval);
      if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
    };
  }, [isOpen, isActive]);

  // 倒计时
  useEffect(() => {
    if (!isOpen || !isActive) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isActive]);

  const handleComplete = () => {
    // 彩花效果
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    setTimeout(() => {
      onComplete();
      onClose();
      resetState();
    }, 1000);
  };

  const handleFinishEarly = () => {
    if (confirm('确定要提前结束吗？进度将被保存。')) {
      handleComplete();
    }
  };

  const resetState = () => {
    setTimeRemaining(300);
    setPhase('inhale');
    setCycleCount(0);
    setIsActive(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B3D2E]/90 backdrop-blur-xl"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isActive) onClose();
        }}
      >
        <div className="relative w-full h-full flex flex-col items-center justify-center p-8">
          {/* 关闭按钮 */}
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onClose}
            className="absolute top-8 right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-6 h-6" />
          </motion.button>

          {/* 静音按钮 */}
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setIsMuted(!isMuted)}
            className="absolute top-8 right-24 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </motion.button>

          {/* 标题 */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-2">呼吸练习</h2>
            <p className="text-white/70">跟随圆圈的节奏，深呼吸放松</p>
          </motion.div>

          {/* 呼吸圆圈 */}
          <div className="relative">
            <motion.div
              animate={{
                scale: phase === 'inhale' ? 1.5 : 1,
              }}
              transition={{
                duration: 4,
                ease: "easeInOut"
              }}
              className="w-64 h-64 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-2xl flex items-center justify-center"
              style={{
                boxShadow: phase === 'inhale' 
                  ? '0 0 80px rgba(52, 211, 153, 0.6)' 
                  : '0 0 40px rgba(52, 211, 153, 0.3)'
              }}
            >
              <div className="text-center">
                <motion.p
                  key={phase}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-2xl font-bold text-white mb-2"
                >
                  {phase === 'inhale' ? '吸气' : '呼气'}
                </motion.p>
                <p className="text-white/70">第 {cycleCount + 1} 轮</p>
              </div>
            </motion.div>
          </div>

          {/* 倒计时和控制 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 text-center space-y-4"
          >
            <div className="text-5xl font-bold text-white">
              {formatTime(timeRemaining)}
            </div>
            
            {!isActive ? (
              <button
                onClick={() => setIsActive(true)}
                className="px-8 py-3 bg-white text-[#0B3D2E] rounded-full font-semibold hover:scale-105 transition-transform"
              >
                开始练习
              </button>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={() => setIsActive(false)}
                  className="px-6 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
                >
                  暂停
                </button>
                <button
                  onClick={handleFinishEarly}
                  className="px-6 py-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors"
                >
                  提前结束
                </button>
              </div>
            )}

            <p className="text-white/50 text-sm mt-4">
              完成后将自动标记为已完成
            </p>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
