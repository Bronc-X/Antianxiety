'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MotionButton } from '@/components/motion/MotionButton';
import { Brain, Sparkles, Check, Zap, Moon, Activity } from 'lucide-react';
import {
  CalibrationInput,
  StressLevel,
  ExerciseIntention,
  AnomalyResult,
  WeeklyStats,
  calculateWeeklyStats,
  detectAnomalies,
  getInquiryQuestion,
  generateTask,
  GeneratedTask,
} from '@/lib/calibration-service';

type CalibrationStep = 'input' | 'inquiry' | 'result' | 'complete';

interface DailyCalibrationSheetProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onComplete?: (result: { input: CalibrationInput; task: GeneratedTask }) => void;
  weeklyRecords?: CalibrationInput[];
  autoShow?: boolean;
  storageKey?: string;
}

export function DailyCalibrationSheet({
  isOpen: controlledOpen,
  onOpenChange,
  onComplete,
  weeklyRecords = [],
  autoShow = true,
  storageKey = 'nma_daily_calibration',
}: DailyCalibrationSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [step, setStep] = useState<CalibrationStep>('input');

  // Input state
  const [sleepHours, setSleepHours] = useState(7);
  const [stressLevel, setStressLevel] = useState<StressLevel>('medium');
  const [exerciseIntention, setExerciseIntention] = useState<ExerciseIntention>('moderate');

  // Inquiry state
  const [anomalies, setAnomalies] = useState<AnomalyResult[]>([]);
  const [currentAnomalyIndex, setCurrentAnomalyIndex] = useState(0);
  const [inquiryResponse, setInquiryResponse] = useState<string | undefined>();

  // Result state
  const [generatedTask, setGeneratedTask] = useState<GeneratedTask | null>(null);

  const isOpen = controlledOpen ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;

  // Check if calibration completed today
  useEffect(() => {
    if (!autoShow) return;
    const today = new Date().toDateString();
    const lastCalibration = localStorage.getItem(storageKey);
    if (lastCalibration !== today) {
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [autoShow, storageKey, setIsOpen]);

  const handleSubmitInput = useCallback(() => {
    const input: CalibrationInput = {
      sleep_hours: sleepHours,
      stress_level: stressLevel,
      exercise_intention: exerciseIntention,
      timestamp: new Date().toISOString(),
    };

    const weeklyStats: WeeklyStats = calculateWeeklyStats(weeklyRecords);
    const detected = detectAnomalies(input, weeklyStats);

    if (detected.length > 0) {
      setAnomalies(detected);
      setCurrentAnomalyIndex(0);
      setStep('inquiry');
    } else {
      // No anomalies, generate normal task
      const task = generateTask([], undefined);
      setGeneratedTask(task);
      setStep('result');
    }
  }, [sleepHours, stressLevel, exerciseIntention, weeklyRecords]);

  const handleInquiryResponse = useCallback((response: string) => {
    setInquiryResponse(response);
    const task = generateTask(anomalies, response);
    setGeneratedTask(task);
    setStep('result');
  }, [anomalies]);

  const handleComplete = useCallback(() => {
    localStorage.setItem(storageKey, new Date().toDateString());
    setStep('complete');

    const input: CalibrationInput = {
      sleep_hours: sleepHours,
      stress_level: stressLevel,
      exercise_intention: exerciseIntention,
      timestamp: new Date().toISOString(),
    };

    if (generatedTask) {
      onComplete?.({ input, task: generatedTask });
    }

    setTimeout(() => {
      setIsOpen(false);
      setTimeout(() => {
        setStep('input');
        setSleepHours(7);
        setStressLevel('medium');
        setExerciseIntention('moderate');
        setAnomalies([]);
        setInquiryResponse(undefined);
        setGeneratedTask(null);
      }, 300);
    }, 1500);
  }, [storageKey, sleepHours, stressLevel, exerciseIntention, generatedTask, onComplete, setIsOpen]);

  const currentAnomaly = anomalies[currentAnomalyIndex];
  const inquiryQuestion = currentAnomaly ? getInquiryQuestion(currentAnomaly) : null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side="bottom"
        className="h-[75vh] rounded-t-3xl bg-[#FAF6EF] border-t border-amber-100"
      >
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="text-xl text-gray-800 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Bio-Voltage 校准
          </SheetTitle>
          <p className="text-sm text-gray-500">
            {step === 'input' && '快速输入今日状态'}
            {step === 'inquiry' && '检测到变化，需要了解更多'}
            {step === 'result' && '校准完成，生成今日任务'}
            {step === 'complete' && '校准完成！'}
          </p>
        </SheetHeader>

        <div className="mt-4 px-1">
          <AnimatePresence mode="wait">
            {/* Step 1: Input */}
            {step === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Sleep Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Moon className="w-4 h-4 text-indigo-500" />
                      睡眠时长
                    </label>
                    <span className="text-lg font-bold text-indigo-600">{sleepHours}h</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    step="0.5"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                    className="w-full h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>0h</span>
                    <span>6h</span>
                    <span>12h</span>
                  </div>
                </div>

                {/* Stress Level */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-rose-500" />
                    压力水平
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['low', 'medium', 'high'] as StressLevel[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => setStressLevel(level)}
                        className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                          stressLevel === level
                            ? 'bg-rose-500 text-white shadow-md'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-rose-300'
                        }`}
                      >
                        {level === 'low' && '😌 低'}
                        {level === 'medium' && '😐 中'}
                        {level === 'high' && '😰 高'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exercise Intention */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    运动意愿
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['rest', 'moderate', 'challenge'] as ExerciseIntention[]).map((intention) => (
                      <button
                        key={intention}
                        onClick={() => setExerciseIntention(intention)}
                        className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                          exerciseIntention === intention
                            ? 'bg-emerald-500 text-white shadow-md'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'
                        }`}
                      >
                        {intention === 'rest' && '🧘 休息'}
                        {intention === 'moderate' && '🚶 适度'}
                        {intention === 'challenge' && '🏃 挑战'}
                      </button>
                    ))}
                  </div>
                </div>

                <MotionButton
                  onClick={handleSubmitInput}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium"
                  hapticFeedback
                >
                  完成校准
                </MotionButton>
              </motion.div>
            )}

            {/* Step 2: Inquiry */}
            {step === 'inquiry' && inquiryQuestion && (
              <motion.div
                key="inquiry"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                  <p className="text-base text-gray-800 leading-relaxed">
                    {inquiryQuestion.question}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {inquiryQuestion.options.map((opt) => (
                    <MotionButton
                      key={opt.value}
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2 bg-white hover:bg-amber-50 border-gray-200 hover:border-amber-300"
                      onClick={() => handleInquiryResponse(opt.value)}
                      hapticFeedback
                    >
                      <span className="text-2xl">{opt.emoji}</span>
                      <span className="text-sm text-gray-700">{opt.label}</span>
                    </MotionButton>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Result */}
            {step === 'result' && generatedTask && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                <div className={`rounded-2xl p-5 ${
                  generatedTask.mode === 'low_energy'
                    ? 'bg-indigo-50 border border-indigo-100'
                    : 'bg-emerald-50 border border-emerald-100'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    {generatedTask.mode === 'low_energy' ? (
                      <Moon className="w-5 h-5 text-indigo-500" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-emerald-500" />
                    )}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      generatedTask.mode === 'low_energy'
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {generatedTask.mode === 'low_energy' ? '低耗能模式' : '正常模式'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {generatedTask.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {generatedTask.description}
                  </p>
                </div>

                <MotionButton
                  onClick={handleComplete}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium"
                  hapticFeedback
                >
                  确认，开始今天
                </MotionButton>

                {/* Bayesian Ritual Option */}
                {stressLevel === 'high' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-4"
                  >
                    <a
                      href="/bayesian"
                      className="block w-full py-3 text-center text-sm text-rose-600 bg-rose-50 rounded-xl border border-rose-100 hover:bg-rose-100 transition-colors"
                    >
                      😰 感到焦虑？开始认知校准
                    </a>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Step 4: Complete */}
            {step === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4"
                >
                  <Check className="w-10 h-10 text-emerald-600" />
                </motion.div>
                <p className="text-lg font-medium text-gray-800">校准完成</p>
                <p className="text-sm text-gray-500 mt-1">仪表盘已更新</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Skip button */}
        {step === 'input' && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsOpen(false)}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              稍后再说
            </button>
          </div>
        )}

        {/* Decorative */}
        <div className="absolute bottom-4 right-4 opacity-10">
          <Zap className="w-24 h-24 text-amber-500" />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default DailyCalibrationSheet;
