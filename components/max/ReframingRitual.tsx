'use client';

/**
 * ReframingRitual Component - Premium Edition
 * 
 * 高级认知重构仪式
 * 沉浸式体验 + Glassmorphism + 精致动效
 * 
 * Task 8.3: Max responses integrated throughout ritual flow
 * - Prior set acknowledgment
 * - Evidence gathering commentary
 * - Ritual completion conclusion with confirmation prompt
 * 
 * @module components/max/ReframingRitual
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, FileText, Activity, ArrowRight, Check, X, Sparkles, Zap } from 'lucide-react';
import { BeliefOutput, Paper, HRVData, MaxResponse } from '@/types/max';
import { BayesianAnimation } from './BayesianAnimation';

type RitualStep = 'input' | 'evidence' | 'calculate' | 'result';

interface ReframingRitualProps {
  onComplete?: (result: BeliefOutput) => void;
  onCancel?: () => void;
  hrvData?: HRVData;
}

// Mock papers for demo
const MOCK_PAPERS: Paper[] = [
  { id: '1', title: '认知重评与焦虑缓解的神经机制', relevance_score: 0.85, url: '#' },
  { id: '2', title: 'HRV 作为压力响应的生物标志物', relevance_score: 0.78, url: '#' },
  { id: '3', title: '贝叶斯大脑假说与焦虑障碍', relevance_score: 0.72, url: '#' }
];

const STEP_TITLES: Record<RitualStep, { title: string; subtitle: string }> = {
  input: { title: '描述你的担忧', subtitle: 'BELIEF INPUT' },
  evidence: { title: '收集证据', subtitle: 'EVIDENCE GATHERING' },
  calculate: { title: '贝叶斯修正', subtitle: 'BAYESIAN RECALIBRATION' },
  result: { title: '真相揭示', subtitle: 'TRUTH REVEALED' }
};

// Max contextual messages for different ritual stages
const MAX_STAGE_MESSAGES: Record<RitualStep, string[]> = {
  input: [
    '准备好了。告诉我你在担心什么。',
    'System ready. Describe your concern.',
    'Bio-metrics stable. Awaiting input.'
  ],
  evidence: [
    'Data suggests gathering evidence now.',
    'Processing physiological signals...',
    'Bio-metrics indicate analysis in progress.'
  ],
  calculate: [
    'Recalibrating belief parameters...',
    'System processing Bayesian inference...',
    'Data suggests probability adjustment imminent.'
  ],
  result: [
    'Recalibration complete.',
    'System detects truth revealed.',
    'Bio-metrics indicate clarity achieved.'
  ]
};

export function ReframingRitual({ onComplete, onCancel, hrvData }: ReframingRitualProps) {
  const [step, setStep] = useState<RitualStep>('input');
  const [prior, setPrior] = useState(70);
  const [beliefText, setBeliefText] = useState('');
  const [maxMessage, setMaxMessage] = useState('准备好了。告诉我你在担心什么。');
  const [maxTone, setMaxTone] = useState<'neutral' | 'humorous' | 'serious'>('neutral');
  const [result, setResult] = useState<BeliefOutput | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMaxTyping, setIsMaxTyping] = useState(false);

  /**
   * Fetch Max response from API with typing animation
   * Validates: Requirements 4.2, 4.6
   */
  const fetchMaxResponse = useCallback(async (eventType: string, value: number, additionalData?: Record<string, unknown>) => {
    setIsMaxTyping(true);
    try {
      const res = await fetch('/api/max/response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          event_type: eventType, 
          data: { value, ...additionalData } 
        })
      });
      if (res.ok) {
        const data = await res.json();
        const response: MaxResponse = data.response;
        // Simulate typing delay for more natural feel
        await new Promise(resolve => setTimeout(resolve, 300));
        setMaxMessage(response?.text || '处理中...');
        setMaxTone(response?.tone || 'neutral');
      }
    } catch (error) {
      console.error('Error fetching Max response:', error);
      // Fallback to local message
      const fallbackMessages = MAX_STAGE_MESSAGES[step];
      setMaxMessage(fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)]);
    } finally {
      setIsMaxTyping(false);
    }
  }, [step]);

  /**
   * Handle Prior belief commitment
   * Max acknowledges the belief value before proceeding
   * Validates: Requirements 4.2
   */
  const handlePriorCommit = async () => {
    // Fetch Max acknowledgment for the belief value
    await fetchMaxResponse('belief_set', prior, { belief_text: beliefText });
    setStep('evidence');
  };

  /**
   * Handle Bayesian calculation
   * Max provides commentary during calculation and conclusion at result
   * Validates: Requirements 4.6
   */
  const handleCalculate = async () => {
    setStep('calculate');
    setIsProcessing(true);
    
    // Max commentary during calculation
    setMaxMessage('Recalibrating belief parameters...');

    try {
      const res = await fetch('/api/max/belief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prior,
          hrv_data: hrvData,
          paper_ids: MOCK_PAPERS.map(p => p.id),
          belief_text: beliefText
        })
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data.calculation);
        
        // Transition to result with Max conclusion
        setTimeout(async () => {
          setStep('result');
          // Fetch Max's ritual completion response with posterior value
          await fetchMaxResponse('ritual_complete', data.calculation.posterior, {
            prior,
            reduction: prior - data.calculation.posterior,
            belief_text: beliefText
          });
        }, 8000);
      } else {
        // Fallback calculation
        const posteriorValue = Math.round(prior * 0.3 / 0.7);
        const mockResult: BeliefOutput = {
          prior,
          likelihood: 0.3,
          evidence: 0.7,
          posterior: posteriorValue,
          papers_used: MOCK_PAPERS,
          calculation_steps: [
            { step: 1, description: '设置先验概率', value: prior },
            { step: 2, description: '计算似然度', value: 0.3 },
            { step: 3, description: '计算证据权重', value: 0.7 },
            { step: 4, description: '计算后验概率', value: posteriorValue }
          ]
        };
        setResult(mockResult);
        setTimeout(async () => {
          setStep('result');
          await fetchMaxResponse('ritual_complete', posteriorValue, {
            prior,
            reduction: prior - posteriorValue
          });
        }, 8000);
      }
    } catch (error) {
      console.error('Error calculating belief:', error);
      const posteriorValue = Math.round(prior * 0.3 / 0.7);
      const mockResult: BeliefOutput = {
        prior,
        likelihood: 0.3,
        evidence: 0.7,
        posterior: posteriorValue,
        papers_used: MOCK_PAPERS,
        calculation_steps: [
          { step: 1, description: '设置先验概率', value: prior },
          { step: 2, description: '计算似然度', value: 0.3 },
          { step: 3, description: '计算证据权重', value: 0.7 },
          { step: 4, description: '计算后验概率', value: posteriorValue }
        ]
      };
      setResult(mockResult);
      setTimeout(async () => {
        setStep('result');
        await fetchMaxResponse('ritual_complete', posteriorValue, {
          prior,
          reduction: prior - posteriorValue
        });
      }, 8000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (result) {
      onComplete?.(result);
    }
  };

  const currentStepInfo = STEP_TITLES[step];

  return (
    <div className="relative">
      {/* Glassmorphism Container */}
      <motion.div
        className="relative rounded-3xl overflow-hidden max-w-lg mx-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23]" />
        
        {/* Animated Glow */}
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{
            background: [
              'radial-gradient(circle at 20% 30%, rgba(156, 175, 136, 0.4) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 70%, rgba(196, 167, 125, 0.4) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 30%, rgba(156, 175, 136, 0.4) 0%, transparent 50%)',
            ]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Glass Overlay */}
        <div className="absolute inset-0 backdrop-blur-xl bg-white/[0.02]" />

        {/* Content */}
        <div className="relative z-10 p-8">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <motion.div 
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#9CAF88]/20 to-[#9CAF88]/5 
                           flex items-center justify-center border border-[#9CAF88]/20"
                animate={{ 
                  boxShadow: ['0 0 20px rgba(156,175,136,0.2)', '0 0 40px rgba(156,175,136,0.1)', '0 0 20px rgba(156,175,136,0.2)']
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Brain className="w-5 h-5 text-[#9CAF88]" />
              </motion.div>
              <div>
                <h3 className="text-lg font-medium text-white">{currentStepInfo.title}</h3>
                <p className="text-xs text-white/30 tracking-wider">{currentStepInfo.subtitle}</p>
              </div>
            </div>
            
            <button
              onClick={onCancel}
              className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center 
                         hover:bg-white/10 transition-colors border border-white/5"
            >
              <X className="w-4 h-4 text-white/40" />
            </button>
          </div>

          {/* Max Message - Enhanced with typing indicator and tone */}
          <AnimatePresence mode="wait">
            <motion.div
              key={maxMessage + (isMaxTyping ? '-typing' : '')}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="mb-8"
            >
              <div className={`bg-white/[0.03] rounded-2xl p-5 border transition-colors duration-300 ${
                maxTone === 'humorous' ? 'border-[#C4A77D]/30' :
                maxTone === 'serious' ? 'border-[#9CAF88]/30' :
                'border-white/[0.05]'
              }`}>
                <div className="flex items-start gap-4">
                  <motion.div 
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      maxTone === 'humorous' ? 'bg-[#C4A77D]/20' :
                      maxTone === 'serious' ? 'bg-[#9CAF88]/20' :
                      'bg-[#C4A77D]/10'
                    }`}
                    animate={isMaxTyping ? { 
                      scale: [1, 1.1, 1],
                      opacity: [1, 0.7, 1]
                    } : {}}
                    transition={{ duration: 0.8, repeat: isMaxTyping ? Infinity : 0 }}
                  >
                    {isMaxTyping ? (
                      <Zap className="w-4 h-4 text-[#C4A77D] animate-pulse" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-[#C4A77D]" />
                    )}
                  </motion.div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs text-white/30">MAX</p>
                      {maxTone === 'humorous' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#C4A77D]/20 text-[#C4A77D]">
                          WIT MODE
                        </span>
                      )}
                      {maxTone === 'serious' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#9CAF88]/20 text-[#9CAF88]">
                          DIRECT
                        </span>
                      )}
                    </div>
                    {isMaxTyping ? (
                      <div className="flex items-center gap-1">
                        <motion.span
                          className="w-1.5 h-1.5 rounded-full bg-[#C4A77D]"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        />
                        <motion.span
                          className="w-1.5 h-1.5 rounded-full bg-[#C4A77D]"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.span
                          className="w-1.5 h-1.5 rounded-full bg-[#C4A77D]"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-white/80 leading-relaxed">{maxMessage}</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {step === 'input' && (
              <InputStep
                beliefText={beliefText}
                prior={prior}
                onBeliefChange={setBeliefText}
                onPriorChange={setPrior}
                onSubmit={handlePriorCommit}
              />
            )}

            {step === 'evidence' && (
              <EvidenceStep
                hrvData={hrvData}
                papers={MOCK_PAPERS}
                onCalculate={handleCalculate}
              />
            )}

            {step === 'calculate' && result && (
              <motion.div
                key="calculate"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <BayesianAnimation
                  prior={result.prior}
                  likelihood={result.likelihood}
                  evidence={result.evidence}
                  posterior={result.posterior}
                  duration={8000}
                  beliefContext="default"
                />
              </motion.div>
            )}

            {step === 'result' && result && (
              <ResultStep
                result={result}
                onRetry={onCancel}
                onConfirm={handleConfirm}
                maxMessage={maxMessage}
                maxTone={maxTone}
              />
            )}
          </AnimatePresence>

          {/* Progress Indicator */}
          <div className="flex justify-center gap-3 mt-8">
            {(['input', 'evidence', 'calculate', 'result'] as RitualStep[]).map((s, i) => {
              const stepIndex = ['input', 'evidence', 'calculate', 'result'].indexOf(step);
              const isActive = step === s;
              const isComplete = stepIndex > i;
              
              return (
                <motion.div
                  key={s}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    isActive ? 'w-8 bg-[#C4A77D]' : 
                    isComplete ? 'w-4 bg-[#9CAF88]' : 'w-4 bg-white/10'
                  }`}
                  animate={isActive ? { opacity: [0.7, 1, 0.7] } : {}}
                  transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
                />
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Input Step Component
function InputStep({
  beliefText,
  prior,
  onBeliefChange,
  onPriorChange,
  onSubmit
}: {
  beliefText: string;
  prior: number;
  onBeliefChange: (text: string) => void;
  onPriorChange: (value: number) => void;
  onSubmit: () => void;
}) {
  const percentage = prior;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Belief Text Input */}
      <div className="space-y-2">
        <label className="text-xs text-white/40 tracking-wide">你在担心什么？</label>
        <textarea
          value={beliefText}
          onChange={(e) => onBeliefChange(e.target.value)}
          placeholder="例如：我担心明天的演讲会搞砸..."
          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 
                     text-white text-sm resize-none h-24 
                     focus:border-[#9CAF88]/50 focus:outline-none focus:bg-white/[0.05]
                     placeholder:text-white/20 transition-all"
        />
      </div>

      {/* Prior Slider */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80">你觉得这件事发生的概率是？</p>
            <p className="text-xs text-white/30">主观感受</p>
          </div>
          <motion.div
            className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-2xl font-light text-red-400">{prior}</span>
            <span className="text-sm text-red-400/60">%</span>
          </motion.div>
        </div>

        <div className="relative h-14 flex items-center">
          {/* Track */}
          <div className="absolute inset-x-0 h-2 bg-white/[0.05] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#9CAF88] via-[#C4A77D] to-red-400"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Input */}
          <input
            type="range"
            min={0}
            max={100}
            value={prior}
            onChange={(e) => onPriorChange(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />

          {/* Thumb */}
          <motion.div
            className="absolute w-6 h-6 rounded-full bg-[#1a1a2e] border-2 border-[#C4A77D] pointer-events-none"
            style={{ 
              left: `calc(${percentage}% - 12px)`,
              boxShadow: '0 0 20px rgba(196,167,125,0.4)'
            }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-white/20">
          <span>不太可能</span>
          <span>非常确定</span>
        </div>
      </div>

      {/* Submit Button */}
      <motion.button
        onClick={onSubmit}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#C4A77D] to-[#D4B78D] 
                   text-[#1a1a2e] font-medium flex items-center justify-center gap-3
                   shadow-[0_10px_40px_rgba(196,167,125,0.3)]"
      >
        开始收集证据
        <ArrowRight className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}

// Evidence Step Component
function EvidenceStep({
  hrvData,
  papers,
  onCalculate
}: {
  hrvData?: HRVData;
  papers: Paper[];
  onCalculate: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* HRV Data */}
      <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.05]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-[#9CAF88]/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-[#9CAF88]" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">生理数据</p>
            <p className="text-xs text-white/30">你的身体告诉我们</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/[0.03] rounded-xl p-3 text-center">
            <p className="text-xs text-white/30 mb-1">RMSSD</p>
            <p className="text-lg text-[#9CAF88]">{hrvData?.rmssd || 45}ms</p>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-3 text-center">
            <p className="text-xs text-white/30 mb-1">LF/HF</p>
            <p className="text-lg text-[#9CAF88]">{hrvData?.lf_hf_ratio?.toFixed(2) || '1.20'}</p>
          </div>
        </div>
      </div>

      {/* Papers */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#6B8DD6]/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-[#6B8DD6]" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">科学研究</p>
            <p className="text-xs text-white/30">相关论文支持</p>
          </div>
        </div>
        
        <div className="space-y-2">
          {papers.map((paper, index) => (
            <motion.div
              key={paper.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05]"
            >
              <p className="text-sm text-white/80 mb-2">{paper.title}</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#6B8DD6]"
                    initial={{ width: 0 }}
                    animate={{ width: `${paper.relevance_score * 100}%` }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                  />
                </div>
                <span className="text-xs text-white/40">
                  {Math.round(paper.relevance_score * 100)}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Calculate Button */}
      <motion.button
        onClick={onCalculate}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#9CAF88] to-[#ACBF98] 
                   text-[#1a1a2e] font-medium flex items-center justify-center gap-3
                   shadow-[0_10px_40px_rgba(156,175,136,0.3)]"
      >
        开始贝叶斯修正
        <ArrowRight className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}

// Result Step Component with Max conclusion
// Validates: Requirements 4.6 - Max conclusion with Posterior and confirmation prompt
function ResultStep({
  result,
  onRetry,
  onConfirm,
  maxMessage,
  maxTone
}: {
  result: BeliefOutput;
  onRetry?: () => void;
  onConfirm: () => void;
  maxMessage: string;
  maxTone: 'neutral' | 'humorous' | 'serious';
}) {
  const reduction = result.prior - result.posterior;
  const isSignificantReduction = reduction >= 20;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6"
    >
      {/* Result Display */}
      <div className="py-6">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
          className="inline-block"
        >
          <div className="text-7xl font-light text-[#9CAF88]">
            {result.posterior}
            <span className="text-3xl text-[#9CAF88]/60">%</span>
          </div>
        </motion.div>
        
        <motion.p 
          className="text-white/40 mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          修正后的真实概率
        </motion.p>

        {/* Reduction Badge */}
        <motion.div
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full mt-4 ${
            isSignificantReduction 
              ? 'bg-[#9CAF88]/20 border border-[#9CAF88]/30' 
              : 'bg-[#9CAF88]/10 border border-[#9CAF88]/20'
          }`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <span className="text-[#9CAF88]">↓ {reduction}%</span>
          <span className="text-white/30 text-sm">
            {isSignificantReduction ? '显著降低' : '焦虑降低'}
          </span>
        </motion.div>
      </div>

      {/* Max Conclusion Message */}
      <motion.div
        className={`bg-white/[0.03] rounded-xl p-4 border ${
          maxTone === 'humorous' ? 'border-[#C4A77D]/20' : 'border-white/[0.05]'
        }`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-lg bg-[#C4A77D]/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3 h-3 text-[#C4A77D]" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs text-white/30 mb-1">MAX CONCLUSION</p>
            <p className="text-sm text-white/70 leading-relaxed">{maxMessage}</p>
          </div>
        </div>
      </motion.div>

      {/* Scientific Explanation */}
      <motion.p
        className="text-white/40 text-xs leading-relaxed max-w-sm mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        基于你的生理数据和 {result.papers_used.length} 篇科学研究，
        你担心的事情实际发生的概率比你感觉的要低 {reduction}%。
      </motion.p>

      {/* Confirmation Prompt */}
      <motion.div
        className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.05]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <p className="text-sm text-white/50 mb-3">
          你接受这个修正后的概率吗？
        </p>
        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 text-sm font-medium 
                       hover:bg-white/10 transition-colors border border-white/5"
          >
            重新评估
          </button>
          <motion.button
            onClick={onConfirm}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#9CAF88] to-[#ACBF98] 
                       text-[#1a1a2e] text-sm font-medium flex items-center justify-center gap-2
                       shadow-[0_10px_40px_rgba(156,175,136,0.3)]"
          >
            <Check className="w-4 h-4" />
            确认接受
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ReframingRitual;
