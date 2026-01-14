'use client';

/**
 * @deprecated Use AdaptiveOnboardingFlow instead.
 * This component is kept for backward compatibility but will be removed in a future version.
 * 
 * Migration: Replace `<OnboardingFlow onComplete={...} />` with `<AdaptiveOnboardingFlow onComplete={...} />`
 * Note: The onComplete callback signature has changed to accept OnboardingResult instead of Record<string, string>
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ONBOARDING_FLOW, ONBOARDING_FLOW_EN } from '@/lib/questions';
import { tr, useI18n } from '@/lib/i18n';

interface OnboardingFlowProps {
  onComplete: (answers: Record<string, string>) => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { language } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);

  const flow = language === 'en' ? ONBOARDING_FLOW_EN : ONBOARDING_FLOW;
  const totalSteps = flow.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const currentQuestion = flow[currentStep];

  // 分析阶段的文案
  const analysisTexts = [
    tr(language, { zh: 'AI 正在分析你的代谢指纹...', en: 'Analyzing your metabolic fingerprint...' }),
    tr(language, { zh: '正在构建皮质醇模型...', en: 'Building a cortisol model...' }),
    tr(language, { zh: '生成个性化方案...', en: 'Generating a personalized plan...' }),
  ];

  // 分析阶段动画
  useEffect(() => {
    if (isAnalyzing) {
      const timer = setInterval(() => {
        setAnalysisStep(prev => {
          if (prev >= analysisTexts.length - 1) {
            clearInterval(timer);
            // 3秒后完成
            setTimeout(() => {
              onComplete(answers);
            }, 1000);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [answers, analysisTexts.length, isAnalyzing, onComplete]);

  // 选择答案
  const handleAnswer = (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    // 自动进入下一题（单选题）
    if (currentQuestion.type === 'single') {
      setTimeout(() => {
        if (currentStep < totalSteps - 1) {
          setCurrentStep(prev => prev + 1);
        } else {
          // 最后一题，进入分析阶段
          setIsAnalyzing(true);
        }
      }, 300);
    }
  };

  // 如果正在分析
  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          {/* 脉动圆形 */}
          <motion.div
            className="mx-auto w-32 h-32 rounded-full bg-gradient-to-br from-[#0B3D2E] to-[#0a3427] mb-8"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* 分析文案 */}
          <AnimatePresence mode="wait">
            <motion.p
              key={analysisStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-2xl font-serif text-[#0B3D2E]"
            >
              {analysisTexts[analysisStep]}
            </motion.p>
          </AnimatePresence>

          {/* 进度点 */}
          <div className="flex gap-2 justify-center mt-8">
            {analysisTexts.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${idx <= analysisStep ? 'bg-[#0B3D2E]' : 'bg-[#E7E1D6]'
                  }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF0] flex flex-col">
      {/* 顶部进度条 */}
      <div className="sticky top-0 z-10 w-full h-1 bg-[#E7E1D6]">
        <motion.div
          className="h-full bg-[#0B3D2E]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* 问题区域 */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              {/* 问题序号 */}
              <div className="text-sm font-mono text-[#0B3D2E]/60 mb-4">
                {tr(language, { zh: '问题', en: 'Question' })} {currentStep + 1} / {totalSteps}
              </div>

              {/* 问题主文本 */}
              <h2 className="text-3xl sm:text-4xl font-serif text-[#0B3D2E] leading-tight mb-3">
                {currentQuestion.question}
              </h2>

              {/* 问题描述 */}
              {currentQuestion.description && (
                <p className="text-lg text-[#0B3D2E]/70 mb-8">
                  {currentQuestion.description}
                </p>
              )}

              {/* 选项卡片 */}
              <div className="space-y-3 mt-8">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = answers[currentQuestion.id] === option.value;

                  return (
                    <motion.button
                      key={option.value}
                      onClick={() => handleAnswer(currentQuestion.id, option.value)}
                      className={`
                        w-full text-left p-5 rounded-2xl border-2 transition-all
                        ${isSelected
                          ? 'border-[#0B3D2E] bg-[#F2F7F5] shadow-md'
                          : 'border-[#E7E1D6] bg-white hover:border-[#0B3D2E]/40 hover:shadow-sm'
                        }
                      `}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-lg ${isSelected ? 'text-[#0B3D2E] font-medium' : 'text-[#0B3D2E]/80'}`}>
                          {option.label}
                        </span>

                        {/* 选中指示器 */}
                        <div
                          className={`
                            w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                            ${isSelected ? 'border-[#0B3D2E] bg-[#0B3D2E]' : 'border-[#E7E1D6]'}
                          `}
                        >
                          {isSelected && (
                            <motion.svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </motion.svg>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* 底部提示（可选） */}
              <div className="mt-8 text-center">
                <p className="text-xs text-[#0B3D2E]/40">
                  {tr(language, { zh: '选择答案后将自动进入下一题', en: 'Selecting an answer will automatically go to the next question.' })}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 底部装饰（可选） */}
      <div className="p-4 text-center">
        <p className="text-xs text-[#0B3D2E]/30 font-mono">
          {tr(language, { zh: 'AntiAnxiety™ · 代谢焦虑诊断', en: 'AntiAnxiety™ · Metabolic Anxiety Assessment' })}
        </p>
      </div>
    </div>
  );
}
