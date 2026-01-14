'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MotionButton } from '@/components/motion/MotionButton';
import {
  Brain,
  Sparkles,
  Check,
  Zap,
  Moon,
  Activity,
  Wind,
  Flame,
  ArrowUpRight,
} from 'lucide-react';
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

type OptionTone = 'emerald' | 'amber' | 'rose';

const stressOptions: { value: StressLevel; label: string; desc: string; tone: OptionTone }[] = [
  { value: 'low', label: '低压', desc: '神经系统平稳', tone: 'emerald' },
  { value: 'medium', label: '中压', desc: '轻微紧绷', tone: 'amber' },
  { value: 'high', label: '高压', desc: '需要立刻降压', tone: 'rose' },
];

const intentionOptions: {
  value: ExerciseIntention;
  label: string;
  desc: string;
  tone: OptionTone;
}[] = [
  { value: 'rest', label: '恢复', desc: '以修复为主', tone: 'emerald' },
  { value: 'moderate', label: '稳态', desc: '轻量激活', tone: 'amber' },
  { value: 'challenge', label: '冲刺', desc: '提升阈值', tone: 'rose' },
];

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

  // Result state
  const [generatedTask, setGeneratedTask] = useState<GeneratedTask | null>(null);

  const isOpen = controlledOpen ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;

  const stressTone = useMemo<OptionTone>(() => {
    if (stressLevel === 'high') return 'rose';
    if (stressLevel === 'low') return 'emerald';
    return 'amber';
  }, [stressLevel]);

  const toneStyles: Record<OptionTone, string> = {
    emerald: 'from-emerald-500/25 to-teal-400/10 ring-emerald-400/35 text-emerald-50',
    amber: 'from-amber-400/25 to-orange-400/10 ring-amber-300/40 text-amber-50',
    rose: 'from-rose-500/25 to-orange-500/15 ring-rose-400/45 text-rose-50',
  };

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
      const task = generateTask([], undefined);
      setGeneratedTask(task);
      setStep('result');
    }
  }, [sleepHours, stressLevel, exerciseIntention, weeklyRecords]);

  const handleInquiryResponse = useCallback(
    (response: string) => {
      setInquiryResponse(response);
      const task = generateTask(anomalies, response);
      setGeneratedTask(task);
      setStep('result');
    },
    [anomalies]
  );

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
        className="h-[78vh] rounded-t-[28px] bg-gradient-to-br from-[#0B0F14] via-[#0D131C] to-[#0B0F14] text-slate-50 border-t border-white/10 shadow-2xl"
      >
        <SheetHeader className="text-left pb-3">
          <SheetTitle className="text-xl text-white flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-400/40">
              <Zap className="w-4 h-4 text-emerald-200" />
            </span>
            Bio-Voltage 校准
          </SheetTitle>
          <p className="text-sm text-slate-400">
            {step === 'input' && '对齐今日神经系统状态，生成 Bio-Voltage 处方'}
            {step === 'inquiry' && '检测到状态波动，完善细节以给出精确干预'}
            {step === 'result' && '校准完成，已生成今日 Bio-Voltage 行动卡'}
            {step === 'complete' && '校准完成，仪表盘已刷新'}
          </p>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          <div className={`relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 ring-1 ${toneStyles[stressTone]}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-white/0 to-white/0" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Alignment</p>
                <div className="mt-1 flex items-center gap-2 text-lg font-semibold text-white">
                  Bio-Voltage
                  <ArrowUpRight className="w-4 h-4 text-emerald-200" />
                </div>
                <p className="text-sm text-slate-300 mt-1">
                  快速同步睡眠、压力与运动意图，输出当日神经电压策略。
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 ring-1 ring-white/10 backdrop-blur">
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <div className="text-xs text-slate-200">实时校准</div>
              </div>
            </div>
            <div className="relative mt-4 grid grid-cols-3 gap-3">
              <StatPill
                label="睡眠"
                value={`${sleepHours}h`}
                hint="神经修复窗"
              />
              <StatPill
                label="压力"
                value={stressOptions.find((o) => o.value === stressLevel)?.label ?? ''}
                hint="迷走神经张力"
              />
              <StatPill
                label="运动"
                value={intentionOptions.find((o) => o.value === exerciseIntention)?.label ?? ''}
                hint="代谢负载计划"
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="space-y-5"
              >
                <ControlCard
                  title="睡眠时长"
                  icon={<Moon className="w-4 h-4 text-emerald-200" />}
                  accent=""
                  value={`${sleepHours}h`}
                  hint="7-8h 为最佳恢复带"
                >
                  <div className="mt-5 mb-1 space-y-3 relative z-10">
                    <input
                      type="range"
                      min="0"
                      max="12"
                      step="0.5"
                      value={sleepHours}
                      onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                      className="w-full h-2 accent-emerald-400 cursor-pointer rounded-full appearance-none bg-slate-700/50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 px-1 pb-1">
                      <span>0h</span>
                      <span>6h</span>
                      <span>12h</span>
                    </div>
                  </div>
                </ControlCard>

                <ControlCard
                  title="压力水平"
                  icon={<Brain className="w-4 h-4 text-amber-200" />}
                  accent="from-amber-500/15 to-orange-500/10"
                  hint="读取交感/副交感平衡"
                >
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {stressOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setStressLevel(option.value)}
                        className={`group rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left transition-all ${
                          stressLevel === option.value
                            ? `ring-1 ${toneStyles[option.tone]} shadow-[0_10px_40px_rgba(0,0,0,0.35)]`
                            : 'hover:border-white/20 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                          {option.value === 'low' && <Wind className="w-4 h-4" />}
                          {option.value === 'medium' && <Activity className="w-4 h-4" />}
                          {option.value === 'high' && <Flame className="w-4 h-4" />}
                          <span>{option.label}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-300">{option.desc}</p>
                      </button>
                    ))}
                  </div>
                </ControlCard>

                <ControlCard
                  title="运动意图"
                  icon={<Activity className="w-4 h-4 text-emerald-200" />}
                  accent="from-emerald-500/12 via-cyan-500/12 to-amber-400/12"
                  hint="决定代谢与神经刺激强度"
                >
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {intentionOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setExerciseIntention(option.value)}
                        className={`group rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left transition-all ${
                          exerciseIntention === option.value
                            ? `ring-1 ${toneStyles[option.tone]} shadow-[0_10px_40px_rgba(0,0,0,0.35)]`
                            : 'hover:border-white/20 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                          {option.value === 'rest' && <Moon className="w-4 h-4" />}
                          {option.value === 'moderate' && <Wind className="w-4 h-4" />}
                          {option.value === 'challenge' && <Flame className="w-4 h-4" />}
                          <span>{option.label}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-300">{option.desc}</p>
                      </button>
                    ))}
                  </div>
                </ControlCard>

                <MotionButton
                  onClick={handleSubmitInput}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                  hapticFeedback
                >
                  完成 Bio-Voltage 校准
                </MotionButton>
              </motion.div>
            )}

            {step === 'inquiry' && inquiryQuestion && (
              <motion.div
                key="inquiry"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="space-y-5"
              >
                <div className="rounded-3xl border border-amber-200/20 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-orange-500/5 p-5 text-slate-50 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
                  <p className="text-base font-semibold leading-relaxed">
                    {inquiryQuestion.question}
                  </p>
                  <p className="mt-2 text-xs text-amber-100">填补关键信息后，算法将重新计算处方。</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {inquiryQuestion.options.map((opt) => (
                    <MotionButton
                      key={opt.value}
                      variant="outline"
                      className="h-auto py-4 px-3 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-200/40 hover:bg-amber-500/10 text-left"
                      onClick={() => handleInquiryResponse(opt.value)}
                      hapticFeedback
                    >
                      <span className="text-2xl">{opt.emoji}</span>
                      <span className="mt-1 block text-sm font-medium text-white">{opt.label}</span>
                    </MotionButton>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 'result' && generatedTask && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="space-y-5"
              >
                <div
                  className={`rounded-3xl border p-5 shadow-[0_14px_50px_rgba(0,0,0,0.35)] ${
                    generatedTask.mode === 'low_energy'
                      ? 'border-indigo-300/20 bg-gradient-to-br from-indigo-500/15 via-slate-900/40 to-slate-900/70'
                      : 'border-emerald-300/20 bg-gradient-to-br from-emerald-500/12 via-slate-900/40 to-slate-900/70'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {generatedTask.mode === 'low_energy' ? (
                      <Moon className="w-5 h-5 text-indigo-200" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-emerald-200" />
                    )}
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-[0.12em] px-2.5 py-1 rounded-full ${
                        generatedTask.mode === 'low_energy'
                          ? 'bg-indigo-400/15 text-indigo-100 ring-1 ring-indigo-300/30'
                          : 'bg-emerald-400/15 text-emerald-100 ring-1 ring-emerald-300/30'
                      }`}
                    >
                      {generatedTask.mode === 'low_energy' ? '低耗能模式' : '常规模式'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{generatedTask.title}</h3>
                  <p className="text-sm text-slate-200 leading-relaxed">{generatedTask.description}</p>
                </div>

                <MotionButton
                  onClick={handleComplete}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                  hapticFeedback
                >
                  确认，开始今日执行
                </MotionButton>

                {stressLevel === 'high' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-2"
                  >
                    <a
                      href="/bayesian"
                      className="block w-full rounded-2xl border border-rose-300/25 bg-rose-500/10 px-4 py-3 text-center text-sm font-medium text-rose-100 hover:border-rose-200/40 hover:bg-rose-500/15 transition-colors"
                    >
                      感到焦虑？进入 Bayesian 认知校准
                    </a>
                  </motion.div>
                )}
              </motion.div>
            )}

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
                  className="w-20 h-20 rounded-full bg-emerald-400/15 ring-1 ring-emerald-400/40 flex items-center justify-center mb-4"
                >
                  <Check className="w-10 h-10 text-emerald-200" />
                </motion.div>
                <p className="text-lg font-medium text-white">校准完成</p>
                <p className="text-sm text-slate-300 mt-1">仪表盘已更新今日基线</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {step === 'input' && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsOpen(false)}
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              暂缓，稍后再校准
            </button>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
          <div className="h-24 w-24 rounded-full bg-emerald-400/10 blur-3xl" />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StatPill({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-inner shadow-black/20">
      <div className="text-xs text-slate-300">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-semibold text-white">{value}</span>
      </div>
      <p className="text-[11px] text-slate-400">{hint}</p>
    </div>
  );
}

function ControlCard({
  title,
  icon,
  value,
  hint,
  children,
  accent,
}: {
  title: string;
  icon: React.ReactNode;
  value?: string;
  hint?: string;
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/5 p-4 pb-5 ring-1 ring-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.35)] ${accent ? `bg-gradient-to-br ${accent}` : ''} relative`}
    >
      <div className="flex items-start justify-between gap-2 relative z-20">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
            {icon}
          </span>
          {title}
        </div>
        {value ? <span className="text-sm font-semibold text-white shrink-0">{value}</span> : null}
      </div>
      {hint && <p className="mt-1 text-xs text-slate-300 relative z-20">{hint}</p>}
      {children}
    </div>
  );
}

export default DailyCalibrationSheet;
