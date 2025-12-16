'use client';

/**
 * BayesianAnimation Component - Premium Edition
 * 
 * 高级贝叶斯公式动画，包含：
 * 1. 公式展示 + 人话解释
 * 2. 为什么要修正的说明
 * 3. Glassmorphism + 高级动效
 * 
 * @module components/max/BayesianAnimation
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';

interface BayesianAnimationProps {
  prior: number;
  likelihood: number;
  evidence: number;
  posterior: number;
  duration?: number;
  beliefContext?: string;
}

type Phase = 'intro' | 'prior' | 'evidence' | 'calculate' | 'result';

// 人话解释映射
const getBeliefExplanation = (context?: string) => {
  const explanations: Record<string, string> = {
    metabolic_crash: '你担心新陈代谢崩溃',
    heart_attack: '你担心心脏病发作',
    sleep_death: '你担心睡眠中出问题',
    default: '你对这件事感到焦虑'
  };
  return explanations[context || 'default'] || explanations.default;
};

export function BayesianAnimation({
  prior,
  likelihood,
  evidence,
  posterior,
  duration = 8000,
  beliefContext
}: BayesianAnimationProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [displayValue, setDisplayValue] = useState(prior);
  const countValue = useMotionValue(prior);

  // Subscribe to motion value changes
  useEffect(() => {
    const unsubscribe = countValue.on('change', (v) => {
      setDisplayValue(Math.round(v));
    });
    return () => unsubscribe();
  }, [countValue]);

  // Phase progression
  useEffect(() => {
    const phaseTime = duration / 5;
    
    const timers = [
      setTimeout(() => setPhase('prior'), phaseTime * 0.5),
      setTimeout(() => setPhase('evidence'), phaseTime * 1.5),
      setTimeout(() => setPhase('calculate'), phaseTime * 2.5),
      setTimeout(() => {
        setPhase('result');
        animate(countValue, posterior, {
          duration: 1.5,
          ease: [0.32, 0.72, 0, 1]
        });
      }, phaseTime * 3.5),
    ];

    return () => timers.forEach(clearTimeout);
  }, [prior, posterior, countValue, duration]);

  const reduction = prior - posterior;
  const reductionPercent = Math.round((reduction / prior) * 100);

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Glassmorphism Container */}
      <motion.div
        className="relative rounded-3xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23]" />
        
        {/* Animated Glow */}
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(156, 175, 136, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, rgba(156, 175, 136, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(156, 175, 136, 0.3) 0%, transparent 50%)',
            ]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Glass Overlay */}
        <div className="absolute inset-0 backdrop-blur-xl bg-white/[0.02]" />

        {/* Content */}
        <div className="relative z-10 p-8 space-y-8">
          
          {/* Header */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-white/40 text-xs tracking-[0.3em] uppercase mb-2">
              Bayesian Recalibration
            </h3>
            <p className="text-white/70 text-sm">
              {getBeliefExplanation(beliefContext)}
            </p>
          </motion.div>

          {/* Main Display */}
          <div className="relative h-32 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {/* Intro Phase */}
              {phase === 'intro' && (
                <PhaseContent key="intro">
                  <p className="text-white/50 text-center text-sm">
                    让我们用数学来重新审视这个担忧...
                  </p>
                </PhaseContent>
              )}

              {/* Prior Phase */}
              {phase === 'prior' && (
                <PhaseContent key="prior">
                  <div className="text-center space-y-3">
                    <p className="text-white/40 text-xs">你的主观感受</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-5xl font-light text-red-400/90">{prior}</span>
                      <span className="text-2xl text-red-400/60">%</span>
                    </div>
                    <p className="text-white/50 text-xs max-w-xs mx-auto">
                      这是你<span className="text-red-400">感觉</span>这件事会发生的概率
                    </p>
                  </div>
                </PhaseContent>
              )}

              {/* Evidence Phase */}
              {phase === 'evidence' && (
                <PhaseContent key="evidence">
                  <div className="text-center space-y-4">
                    <p className="text-white/40 text-xs">但科学证据显示</p>
                    <div className="flex items-center justify-center gap-6">
                      <EvidenceItem 
                        label="生理数据" 
                        value={`${Math.round(likelihood * 100)}%`}
                        color="#9CAF88"
                        delay={0}
                      />
                      <EvidenceItem 
                        label="研究支持" 
                        value={`${Math.round(evidence * 100)}%`}
                        color="#6B8DD6"
                        delay={0.2}
                      />
                    </div>
                    <p className="text-white/50 text-xs max-w-xs mx-auto">
                      你的 HRV 和科学论文告诉我们<span className="text-[#9CAF88]">真实情况</span>
                    </p>
                  </div>
                </PhaseContent>
              )}

              {/* Calculate Phase */}
              {phase === 'calculate' && (
                <PhaseContent key="calculate">
                  <div className="text-center space-y-4">
                    <p className="text-white/40 text-xs mb-4">贝叶斯修正公式</p>
                    
                    {/* Formula with Explanation */}
                    <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                      <div className="flex items-center justify-center gap-3 text-lg font-mono">
                        <span className="text-[#9CAF88]">P</span>
                        <span className="text-white/30">=</span>
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-2 pb-1 border-b border-white/20">
                            <motion.span 
                              className="text-red-400"
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              {prior}
                            </motion.span>
                            <span className="text-white/30">×</span>
                            <span className="text-[#9CAF88]">{Math.round(likelihood * 100)}</span>
                          </div>
                          <span className="text-[#6B8DD6] pt-1">{Math.round(evidence * 100)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Human Explanation */}
                    <div className="text-white/50 text-xs space-y-1">
                      <p><span className="text-red-400">你的感受</span> × <span className="text-[#9CAF88]">身体真实状态</span></p>
                      <p>÷ <span className="text-[#6B8DD6]">科学证据强度</span></p>
                    </div>
                  </div>
                </PhaseContent>
              )}

              {/* Result Phase */}
              {phase === 'result' && (
                <PhaseContent key="result">
                  <div className="text-center space-y-4">
                    <p className="text-white/40 text-xs">修正后的真实概率</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <motion.span 
                        className="text-6xl font-light text-[#9CAF88]"
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                      >
                        {displayValue}
                      </motion.span>
                      <span className="text-2xl text-[#9CAF88]/60">%</span>
                    </div>
                    
                    {/* Reduction Badge */}
                    <motion.div
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#9CAF88]/10 border border-[#9CAF88]/20"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <span className="text-[#9CAF88] text-sm">↓ {reduction}%</span>
                      <span className="text-white/40 text-xs">降低了 {reductionPercent}%</span>
                    </motion.div>
                  </div>
                </PhaseContent>
              )}
            </AnimatePresence>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-white/30">
              <span>感受</span>
              <span>真相</span>
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-red-400/80 via-[#C4A77D] to-[#9CAF88]"
                initial={{ width: '0%' }}
                animate={{ 
                  width: phase === 'result' ? '100%' : 
                         phase === 'calculate' ? '75%' :
                         phase === 'evidence' ? '50%' :
                         phase === 'prior' ? '25%' : '0%'
                }}
                transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
              />
            </div>
          </div>

          {/* Why Explanation */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'result' ? 1 : 0.5 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-white/40 text-xs leading-relaxed max-w-sm mx-auto">
              {phase === 'result' ? (
                <>
                  <span className="text-white/60">为什么修正？</span>
                  <br />
                  焦虑会放大我们的感知。贝叶斯公式用客观证据（你的生理数据 + 科学研究）来校准主观感受，让你看到更接近真相的概率。
                </>
              ) : (
                '正在收集证据...'
              )}
            </p>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}

// Phase Content Wrapper
function PhaseContent({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

// Evidence Item Component
function EvidenceItem({ 
  label, 
  value, 
  color, 
  delay 
}: { 
  label: string; 
  value: string; 
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      className="text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div 
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2"
        style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
      >
        <span className="text-xl font-light" style={{ color }}>{value}</span>
      </div>
      <p className="text-white/40 text-xs">{label}</p>
    </motion.div>
  );
}

export default BayesianAnimation;
