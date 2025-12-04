'use client';

/**
 * 完整贝叶斯仪式流程测试页
 * 
 * 流程：FearInput → EvidenceRain → BayesianMoment → Result
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FearInputSlider } from '@/components/bayesian/FearInputSlider';
import { EvidenceRain } from '@/components/bayesian/EvidenceRain';
import { BayesianMoment } from '@/components/bayesian/BayesianMoment';
import { Evidence } from '@/lib/bayesian-evidence';
import { BeliefContext } from '@/lib/services/bayesian-scholar';
import { MotionButton } from '@/components/motion/MotionButton';

type RitualStep = 'idle' | 'input' | 'evidence' | 'moment' | 'complete';

export default function TestRitualPage() {
  const [step, setStep] = useState<RitualStep>('idle');
  const [priorScore, setPriorScore] = useState(50);
  const [beliefContext, setBeliefContext] = useState<BeliefContext>('metabolic_crash');
  const [posteriorScore, setPosteriorScore] = useState(0);

  // 模拟证据数据
  const mockEvidence: Evidence[] = [
    { type: 'bio', value: 'HRV=55ms，心率变异性正常，说明你的自主神经系统运作良好', weight: 0.3 },
    { type: 'science', value: '研究表明：90%的焦虑预期从未发生（Borkovec et al., 1999）', weight: 0.4, consensus: 0.85, source_id: '12345' },
    { type: 'action', value: '你今天完成了5分钟呼吸练习，这有助于激活副交感神经', weight: 0.2 },
    { type: 'bio', value: '睡眠质量评分：78/100，恢复状态良好', weight: 0.1 },
  ];

  // 开始仪式
  const handleStart = useCallback(() => {
    setStep('input');
    setPriorScore(50);
  }, []);

  // 提交恐惧值
  const handleSubmitFear = useCallback(() => {
    // 模拟计算后验概率（实际应该调用API）
    const reduction = Math.random() * 0.4 + 0.3; // 30%-70% 降低
    const newPosterior = Math.max(5, Math.round(priorScore * (1 - reduction)));
    setPosteriorScore(newPosterior);
    setStep('evidence');
  }, [priorScore]);

  // 证据雨完成
  const handleEvidenceComplete = useCallback(() => {
    setStep('moment');
  }, []);

  // 贝叶斯时刻完成
  const handleMomentComplete = useCallback(() => {
    setStep('complete');
  }, []);

  // 关闭/重置
  const handleClose = useCallback(() => {
    setStep('idle');
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Idle State - 入口 */}
      {step === 'idle' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          <motion.div
            className="text-center space-y-6 max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-light text-[#E8DFD0]">
              贝叶斯仪式测试
            </h1>
            <p className="text-white/40 text-sm">
              完整流程：恐惧输入 → 证据雨 → 贝叶斯时刻 → 结果
            </p>
            
            <div className="bg-white/5 rounded-2xl p-6 text-left space-y-3">
              <h3 className="text-[#C4A77D] text-sm font-medium">流程说明</h3>
              <ol className="text-white/60 text-sm space-y-2">
                <li>1. <span className="text-red-400">选择焦虑场景</span> + 滑块输入恐惧值</li>
                <li>2. <span className="text-[#9CAF88]">证据雨</span> - 砝码落入天平</li>
                <li>3. <span className="text-[#6B8DD6]">贝叶斯时刻</span> - 数字滚动揭示</li>
                <li>4. <span className="text-[#C4A77D]">结果展示</span> - 恐惧被夸大了多少倍</li>
              </ol>
            </div>

            <MotionButton
              onClick={handleStart}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-red-900/50 to-red-700/50 
                border border-red-500/30 text-white font-medium"
            >
              <span className="mr-2">😰</span>
              开始仪式
            </MotionButton>
          </motion.div>
        </div>
      )}

      {/* Step 1: Fear Input */}
      <AnimatePresence>
        {step === 'input' && (
          <FearInputSlider
            value={priorScore}
            onChange={setPriorScore}
            onSubmit={handleSubmitFear}
            beliefContext={beliefContext}
            onContextChange={setBeliefContext}
          />
        )}
      </AnimatePresence>

      {/* Step 2: Evidence Rain */}
      <AnimatePresence>
        {step === 'evidence' && (
          <EvidenceRain
            evidences={mockEvidence}
            onComplete={handleEvidenceComplete}
          />
        )}
      </AnimatePresence>

      {/* Step 3: Bayesian Moment */}
      <AnimatePresence>
        {step === 'moment' && (
          <BayesianMoment
            prior={priorScore}
            posterior={posteriorScore}
            onComplete={handleMomentComplete}
          />
        )}
      </AnimatePresence>

      {/* Step 4: Complete */}
      <AnimatePresence>
        {step === 'complete' && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0A0A]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center px-6 max-w-md"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {/* Success Icon */}
              <motion.div
                className="text-6xl mb-6"
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🌱
              </motion.div>

              {/* Message */}
              <h2 className="text-white text-2xl font-light mb-4">
                认知已校准
              </h2>
              
              {/* Stats */}
              <div className="bg-white/5 rounded-2xl p-6 mb-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/40">原始恐惧</span>
                  <span className="text-red-400 text-xl">{priorScore}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/40">校准后</span>
                  <span className="text-[#9CAF88] text-xl">{posteriorScore}%</span>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/40">降低了</span>
                    <span className="text-white text-xl font-medium">
                      {priorScore - posteriorScore}%
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-white/40 text-sm mb-8">
                你的恐惧被夸大了 <span className="text-[#C4A77D]">{(priorScore / posteriorScore).toFixed(1)}x</span>
              </p>

              {/* Actions */}
              <div className="flex gap-4 justify-center">
                <MotionButton
                  onClick={handleClose}
                  className="px-6 py-3 rounded-full bg-white/5 border border-white/10 
                    text-white/80 font-medium"
                >
                  返回
                </MotionButton>
                <MotionButton
                  onClick={handleStart}
                  className="px-6 py-3 rounded-full bg-[#9CAF88]/20 border border-[#9CAF88]/40 
                    text-[#9CAF88] font-medium"
                >
                  再来一次
                </MotionButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
