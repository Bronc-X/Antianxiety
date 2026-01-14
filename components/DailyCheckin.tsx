'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  TrendingUp,
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
import { shouldEvolve, calculateEvolutionLevel } from '@/lib/calibration-engine';

type CalibrationStep = 'input' | 'inquiry' | 'result' | 'complete';

interface DailyCheckinProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (result: { input: CalibrationInput; task: GeneratedTask }) => void;
  weeklyRecords?: CalibrationInput[];
  consecutiveDays?: number;
}

// California Calm 配色方案
type OptionTone = 'sage' | 'clay' | 'sand';

const stressOptions: { value: StressLevel; label: string; desc: string; tone: OptionTone }[] = [
  { value: 'low', label: '低压', desc: '神经系统平稳', tone: 'sage' },
  { value: 'medium', label: '中压', desc: '轻微紧绷', tone: 'clay' },
  { value: 'high', label: '高压', desc: '需要立刻降压', tone: 'sand' },
];

const intentionOptions: {
  value: ExerciseIntention;
  label: string;
  desc: string;
  tone: OptionTone;
}[] = [
  { value: 'rest', label: '恢复', desc: '以修复为主', tone: 'sage' },
  { value: 'moderate', label: '稳态', desc: '轻量激活', tone: 'clay' },
  { value: 'challenge', label: '冲刺', desc: '提升阈值', tone: 'sand' },
];

export function DailyCheckin({
  open,
  onOpenChange,
  onComplete,
  weeklyRecords = [],
  consecutiveDays = 0,
}: DailyCheckinProps) {
  const [step, setStep] = useState<CalibrationStep>('input');

  // Input state
  const [sleepHours, setSleepHours] = useState(7);
  const [stressLevel, setStressLevel] = useState<StressLevel>('medium');
  const [exerciseIntention, setExerciseIntention] = useState<ExerciseIntention>('moderate');

  // Inquiry state
  const [anomalies, setAnomalies] = useState<AnomalyResult[]>([]);
  // Result state
  const [generatedTask, setGeneratedTask] = useState<GeneratedTask | null>(null);
  
  // Evolution state (Requirement 3.3)
  const evolutionLevel = calculateEvolutionLevel(consecutiveDays);
  const isEvolutionDay = shouldEvolve(consecutiveDays);
  
  const stressTone = useMemo<OptionTone>(() => {
    if (stressLevel === 'high') return 'sand';
    if (stressLevel === 'low') return 'sage';
    return 'clay';
  }, [stressLevel]);

  // California Calm 配色 - Sand, Clay, Sage
  const toneStyles: Record<OptionTone, string> = {
    sage: 'bg-[#9CAF88]/10 ring-[#9CAF88]/30 text-[#0B3D2E]',
    clay: 'bg-[#C4A77D]/10 ring-[#C4A77D]/30 text-[#0B3D2E]',
    sand: 'bg-[#E8DFD0]/20 ring-[#C4A77D]/30 text-[#0B3D2E]',
  };

  const handleSubmitInput = () => {
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
      setStep('inquiry');
    } else {
      const task = generateTask([], undefined);
      setGeneratedTask(task);
      setStep('result');
    }
  };

  const handleInquiryResponse = (response: string) => {
    const task = generateTask(anomalies, response);
    setGeneratedTask(task);
    setStep('result');
  };

  const handleComplete = () => {
    localStorage.setItem('nma_daily_calibration', new Date().toDateString());
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
      onOpenChange(false);
      setTimeout(() => {
        setStep('input');
        setSleepHours(7);
        setStressLevel('medium');
        setExerciseIntention('moderate');
        setAnomalies([]);
        setInquiryResponse(undefined);
        setGeneratedTask(null);
      }, 300);
    }, 1200);
  };

  const currentAnomaly = anomalies[0];
  const inquiryQuestion = currentAnomaly ? getInquiryQuestion(currentAnomaly) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto border border-[#E7E1D6] bg-[#FAF6EF] text-[#0B3D2E] rounded-3xl shadow-2xl">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl text-[#0B3D2E] flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#9CAF88]/20 ring-1 ring-[#9CAF88]/40">
              <Zap className="w-4 h-4 text-[#9CAF88]" />
            </span>
            每日校准
          </DialogTitle>
          <DialogDescription className="text-sm text-[#0B3D2E]/60">
            {step === 'input' && '输入今日状态，生成个性化行动建议'}
            {step === 'inquiry' && '检测到波动，补充细节以完成校准'}
            {step === 'result' && '校准完成，确认后写入今日节奏'}
            {step === 'complete' && '校准完成'}
          </DialogDescription>
        </DialogHeader>

        {/* 温暖的引导提示 */}
        {step === 'input' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[#9CAF88]/10 to-[#C4A77D]/10 border border-[#9CAF88]/20"
          >
            <p className="text-xs text-[#0B3D2E]/70 leading-relaxed italic">
              💭 「别着急，我们一点点来。每一次互动，都让 Max 更懂你。」
            </p>
          </motion.div>
        )}

        <div className="mt-3">
          <AnimatePresence mode="wait">
            {step === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="space-y-4"
              >
                <ControlCard
                  title="睡眠时长"
                  icon={<Moon className="w-4 h-4 text-[#9CAF88]" />}
                  accent="from-[#9CAF88]/10 to-[#9CAF88]/5"
                  value={`${sleepHours}h`}
                  hint="7-8h 为最佳恢复带"
                >
                  <div className="mt-3">
                    <input
                      type="range"
                      min="0"
                      max="12"
                      step="0.5"
                      value={sleepHours}
                      onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                      className="w-full h-2 accent-[#9CAF88] cursor-pointer rounded-full"
                      style={{
                        background: `linear-gradient(to right, #9CAF88 0%, #9CAF88 ${(sleepHours / 12) * 100}%, #E7E1D6 ${(sleepHours / 12) * 100}%, #E7E1D6 100%)`,
                        borderRadius: '9999px',
                      }}
                    />
                    <div className="flex justify-between text-[11px] text-[#0B3D2E]/50 pt-1">
                      <span>0h</span>
                      <span>6h</span>
                      <span>12h</span>
                    </div>
                  </div>
                </ControlCard>

                <ControlCard
                  title="压力水平"
                  icon={<Brain className="w-4 h-4 text-[#C4A77D]" />}
                  accent="from-[#C4A77D]/10 to-[#C4A77D]/5"
                  hint="读取交感/副交感平衡"
                >
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {stressOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setStressLevel(option.value)}
                        className={`group rounded-xl border px-3 py-3 text-left transition-all ${
                          stressLevel === option.value
                            ? `ring-1 ${toneStyles[option.tone]} border-[#9CAF88] shadow-sm`
                            : 'border-[#E7E1D6] bg-white hover:border-[#C4A77D]/50 hover:bg-[#FAF6EF]'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#0B3D2E]">
                          {option.value === 'low' && <Wind className="w-4 h-4 text-[#9CAF88]" />}
                          {option.value === 'medium' && <Activity className="w-4 h-4 text-[#C4A77D]" />}
                          {option.value === 'high' && <Flame className="w-4 h-4 text-[#C4A77D]" />}
                          <span>{option.label}</span>
                        </div>
                        <p className="mt-1 text-xs text-[#0B3D2E]/60">{option.desc}</p>
                      </button>
                    ))}
                  </div>
                </ControlCard>

                <ControlCard
                  title="运动意图"
                  icon={<Activity className="w-4 h-4 text-[#9CAF88]" />}
                  accent="from-[#9CAF88]/10 to-[#C4A77D]/5"
                  hint="决定代谢与神经刺激强度"
                >
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {intentionOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setExerciseIntention(option.value)}
                        className={`group rounded-xl border px-3 py-3 text-left transition-all ${
                          exerciseIntention === option.value
                            ? `ring-1 ${toneStyles[option.tone]} border-[#9CAF88] shadow-sm`
                            : 'border-[#E7E1D6] bg-white hover:border-[#C4A77D]/50 hover:bg-[#FAF6EF]'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#0B3D2E]">
                          {option.value === 'rest' && <Moon className="w-4 h-4 text-[#9CAF88]" />}
                          {option.value === 'moderate' && <Wind className="w-4 h-4 text-[#C4A77D]" />}
                          {option.value === 'challenge' && <Flame className="w-4 h-4 text-[#C4A77D]" />}
                          <span>{option.label}</span>
                        </div>
                        <p className="mt-1 text-xs text-[#0B3D2E]/60">{option.desc}</p>
                      </button>
                    ))}
                  </div>
                </ControlCard>

                {/* 今日状态卡片 - 移到底部 */}
                <div className={`relative overflow-hidden rounded-2xl border border-[#E7E1D6] p-4 ring-1 ${toneStyles[stressTone]}`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent" />
                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[#0B3D2E]/50">今日状态</p>
                      <div className="mt-1 flex items-center gap-1.5 text-lg font-semibold text-[#0B3D2E]">
                        身心校准
                        <ArrowUpRight className="w-4 h-4 text-[#9CAF88]" />
                      </div>
                      <p className="text-xs text-[#0B3D2E]/60 mt-1">
                        数据化地校正睡眠、压力与运动意图
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2 rounded-xl bg-white/60 px-3 py-2 ring-1 ring-[#E7E1D6] backdrop-blur">
                        <Sparkles className="w-4 h-4 text-[#C4A77D]" />
                        <div className="text-[11px] text-[#0B3D2E]/70">实时</div>
                      </div>
                      {consecutiveDays > 0 && (
                        <div className={`flex items-center gap-1.5 rounded-lg px-2 py-1 ${
                          isEvolutionDay 
                            ? 'bg-[#9CAF88]/20 ring-1 ring-[#9CAF88]/40' 
                            : 'bg-white/60 ring-1 ring-[#E7E1D6]'
                        }`}>
                          <TrendingUp className={`w-3 h-3 ${isEvolutionDay ? 'text-[#9CAF88]' : 'text-[#0B3D2E]/40'}`} />
                          <span className={`text-[10px] font-medium ${isEvolutionDay ? 'text-[#9CAF88]' : 'text-[#0B3D2E]/50'}`}>
                            Lv.{evolutionLevel}
                          </span>
                          {isEvolutionDay && <span className="text-[10px]">🎉</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="relative mt-3 grid grid-cols-3 gap-2">
                    <StatPill label="睡眠" value={`${sleepHours}h`} hint="修复窗" />
                    <StatPill
                      label="压力"
                      value={stressOptions.find((o) => o.value === stressLevel)?.label ?? ''}
                      hint="交感张力"
                    />
                    <StatPill
                      label="运动"
                      value={intentionOptions.find((o) => o.value === exerciseIntention)?.label ?? ''}
                      hint="负载计划"
                    />
                  </div>
                </div>

                <MotionButton
                  onClick={handleSubmitInput}
                  className="w-full py-3.5 rounded-2xl bg-[#0B3D2E] hover:bg-[#0a3629] text-white text-sm font-semibold shadow-lg transition-colors"
                  hapticFeedback
                >
                  完成每日校准
                </MotionButton>
              </motion.div>
            )}

            {step === 'inquiry' && inquiryQuestion && (
              <motion.div
                key="inquiry"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="space-y-4"
              >
                {/* 宽慰提示 */}
                <div className="px-3 py-2 rounded-lg bg-[#9CAF88]/10 border border-[#9CAF88]/20">
                  <p className="text-xs text-[#0B3D2E]/60 italic">
                    🌿 「多了解一点，才能给你更精准的建议。」
                  </p>
                </div>
                
                <div className="rounded-2xl border border-[#C4A77D]/30 bg-gradient-to-br from-[#C4A77D]/10 via-[#E8DFD0]/10 to-white p-4 text-[#0B3D2E] shadow-sm">
                  <p className="text-sm font-semibold leading-relaxed">
                    {inquiryQuestion.question}
                  </p>
                  <p className="mt-2 text-[11px] text-[#0B3D2E]/60">补充关键情境后，算法会重新生成建议</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {inquiryQuestion.options.map((opt) => (
                    <MotionButton
                      key={opt.value}
                      variant="outline"
                      className="h-auto py-3.5 px-3 rounded-2xl bg-white border border-[#E7E1D6] hover:border-[#C4A77D] hover:bg-[#FAF6EF] text-left"
                      onClick={() => handleInquiryResponse(opt.value)}
                      hapticFeedback
                    >
                      <span className="text-2xl">{opt.emoji}</span>
                      <span className="mt-1 block text-sm font-medium text-[#0B3D2E]">{opt.label}</span>
                    </MotionButton>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 'result' && generatedTask && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="space-y-4"
              >
                <div
                  className={`rounded-2xl border p-4 shadow-sm ${
                    generatedTask.mode === 'low_energy'
                      ? 'border-[#C4A77D]/30 bg-gradient-to-br from-[#C4A77D]/10 via-[#FAF6EF] to-white'
                      : 'border-[#9CAF88]/30 bg-gradient-to-br from-[#9CAF88]/10 via-[#FAF6EF] to-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {generatedTask.mode === 'low_energy' ? (
                      <Moon className="w-4 h-4 text-[#C4A77D]" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-[#9CAF88]" />
                    )}
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-[0.12em] px-2.5 py-1 rounded-full ${
                        generatedTask.mode === 'low_energy'
                          ? 'bg-[#C4A77D]/15 text-[#0B3D2E] ring-1 ring-[#C4A77D]/30'
                          : 'bg-[#9CAF88]/15 text-[#0B3D2E] ring-1 ring-[#9CAF88]/30'
                      }`}
                    >
                      {generatedTask.mode === 'low_energy' ? '恢复模式' : '平衡模式'}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[#0B3D2E] mb-1">{generatedTask.title}</h3>
                  <p className="text-sm text-[#0B3D2E]/70 leading-relaxed">{generatedTask.description}</p>
                </div>

                <MotionButton
                  onClick={handleComplete}
                  className="w-full py-3.5 rounded-2xl bg-[#0B3D2E] hover:bg-[#0a3629] text-white text-sm font-semibold shadow-lg transition-colors"
                  hapticFeedback
                >
                  确认，开始今日执行
                </MotionButton>
              </motion.div>
            )}

            {step === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-16 h-16 rounded-full bg-[#9CAF88]/20 ring-1 ring-[#9CAF88]/40 flex items-center justify-center mb-3"
                >
                  <Check className="w-8 h-8 text-[#9CAF88]" />
                </motion.div>
                <p className="text-base font-medium text-[#0B3D2E]">校准完成</p>
                <p className="text-sm text-[#0B3D2E]/60 mt-1">今日状态已更新</p>
                <p className="text-xs text-[#9CAF88] mt-3 italic">
                  ✨ 「谢谢你的耐心，Max 又更懂你了一点。」
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatPill({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-[#E7E1D6] bg-white px-3 py-2 shadow-sm">
      <div className="text-[11px] text-[#0B3D2E]/50">{label}</div>
      <div className="text-base font-semibold text-[#0B3D2E] leading-tight">{value}</div>
      <p className="text-[11px] text-[#0B3D2E]/40">{hint}</p>
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
      className={`rounded-2xl border border-[#E7E1D6] p-4 ring-1 ring-[#E7E1D6]/50 shadow-sm bg-gradient-to-br ${accent} bg-white`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#0B3D2E]">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white ring-1 ring-[#E7E1D6]">
            {icon}
          </span>
          {title}
        </div>
        {value ? <span className="text-sm font-semibold text-[#0B3D2E]">{value}</span> : null}
      </div>
      {hint && <p className="mt-1 text-xs text-[#0B3D2E]/60">{hint}</p>}
      {children}
    </div>
  );
}

export default DailyCheckin;
