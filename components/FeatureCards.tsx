'use client';

import { ArrowRight, Activity, RotateCw, Brain, TrendingUp, Sun, CheckCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';

/**
 * Symptom Assessment Card
 * Mango-style card with vibrant imagery and clean bottom section
 */
export const SymptomAssessmentCard = () => {
  const { language } = useI18n();
  const isZh = language !== 'en';

  return (
    <div className="relative w-full h-full rounded-[32px] overflow-hidden shadow-[0_20px_40px_-5px_rgba(0,0,0,0.1)] font-sans group hover:scale-[1.02] transition-transform duration-300 ease-out">
      {/* Full Background Gradient - Clay/Sand tones for calm */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#D4C4A8] to-[#A89070]">
        {/* Organic Circles/Blobs */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#E8DFD0] rounded-full blur-2xl opacity-60" />
        <div className="absolute top-20 -left-10 w-40 h-40 bg-[#C4A77D]/50 rounded-full blur-xl opacity-50" />

        {/* Central 3D-ish Element with Animation */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-60 h-60">
          {/* Pulsing rings */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-32 h-32 rounded-full border-2 border-white/20" />
          </motion.div>
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          >
            <div className="w-40 h-40 rounded-full border border-white/10" />
          </motion.div>

          {/* Central icon with heartbeat */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-10"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center rotate-45">
              <Activity className="w-10 h-10 text-[#8B7355] -rotate-45" strokeWidth={2.5} />
            </div>
          </motion.div>
        </div>

        {/* Badge */}
        <div className="absolute top-6 left-6 px-3 py-1.5 bg-black/15 backdrop-blur-md rounded-full">
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">
            {isZh ? 'AI 驱动' : 'AI Powered'}
          </span>
        </div>
      </div>

      {/* Bottom Content Overlay */}
      <div className="absolute bottom-0 left-0 w-full p-8 pb-20 bg-gradient-to-t from-[#6B5344] via-[#6B5344]/90 to-transparent pt-20 text-white">
        <div className="mb-4">
          <h3 className="text-3xl font-bold leading-none mb-2">
            {isZh ? (
              <>症状<br />评估</>
            ) : (
              <>Symptom<br />Check</>
            )}
          </h3>
          <p className="text-white/80 text-xs font-medium max-w-[200px]">
            {isZh
              ? '使用先进贝叶斯推理模型进行快速生理评估。'
              : 'Rapid physiological assessment using advanced Bayesian inference models.'
            }
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
            <span className="text-[10px] font-bold">{isZh ? '快速' : 'Fast'}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
            <span className="text-[10px] font-bold">{isZh ? '安全' : 'Secure'}</span>
          </div>
          <div className="ml-auto flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
            <span className="text-[10px] font-bold text-[#D4AF37]">Pro {isZh ? '免费' : 'Free'}</span>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Button */}
      <button className="absolute bottom-5 left-5 right-5 py-3 bg-white text-[#6B5344] rounded-2xl font-bold text-sm shadow-xl hover:bg-[#FAF6EF] transition-colors flex items-center justify-center gap-2 z-20">
        {isZh ? '开始评估' : 'Start Check'}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};


/**
 * Bayesian Cycle Card
 * Teal gradient card with cycle visualization
 */
export const BayesianCycleCard = () => {
  const { language } = useI18n();
  const isZh = language !== 'en';

  return (
    <div className="relative w-full h-full bg-[#E6F4F1] rounded-[32px] overflow-hidden shadow-[0_20px_40px_-5px_rgba(0,0,0,0.1)] font-sans group hover:scale-[1.02] transition-transform duration-300 ease-out">
      {/* Full Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#4DB6AC] to-[#00695C]">
        {/* Dynamic Background Patterns */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 0 C 50 100 80 100 100 0 Z" fill="white" />
          </svg>
        </div>

        {/* The Cycle Visual */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-60 h-60">
          {/* Center Brain */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center rotate-45">
              <Brain className="w-10 h-10 text-teal-700 -rotate-45" />
            </div>
          </div>

          {/* Orbiting Elements - 轨道旋转 */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            {/* Node 1: Prior - top */}
            <motion.div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 px-4 py-2 bg-white/95 backdrop-blur shadow-lg rounded-xl"
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <span className="text-sm font-bold text-teal-800">{isZh ? '先验' : 'PRIOR'}</span>
            </motion.div>
            {/* Node 2: Evidence - bottom right */}
            <motion.div
              className="absolute bottom-6 right-0 px-4 py-2 bg-white/95 backdrop-blur shadow-lg rounded-xl"
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <span className="text-sm font-bold text-teal-800">{isZh ? '证据' : 'EVIDENCE'}</span>
            </motion.div>
            {/* Node 3: Posterior - bottom left */}
            <motion.div
              className="absolute bottom-6 left-0 px-4 py-2 bg-teal-900 shadow-lg rounded-xl border border-white/20"
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <span className="text-sm font-bold text-white">{isZh ? '后验' : 'POSTERIOR'}</span>
            </motion.div>
            {/* Connecting Ring */}
            <div className="absolute inset-6 border-2 border-dashed border-white/30 rounded-full" />
          </motion.div>
        </div>

        {/* Tags Top Right */}
        <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
          <span className="px-3 py-1.5 bg-black/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white">
            {isZh ? '逻辑' : 'Logic'}
          </span>
        </div>
      </div>

      {/* Bottom Content Overlay */}
      <div className="absolute bottom-0 left-0 w-full p-8 pb-20 bg-gradient-to-t from-teal-900 via-teal-900/80 to-transparent pt-20 text-white">
        <div className="mb-4">
          <h3 className="text-3xl font-bold leading-none mb-2">
            {isZh ? (
              <>贝叶斯<br />循环</>
            ) : (
              <>Bayesian<br />Cycle</>
            )}
          </h3>
          <p className="text-white/80 text-xs font-medium max-w-[200px]">
            {isZh
              ? '基于累积证据的迭代信念更新。'
              : 'Iterative belief updating based on accumulating evidence.'
            }
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
            <RotateCw className="w-3 h-3 text-teal-200" />
            <span className="text-[10px] font-bold">
              {isZh ? '持续' : 'Continuous'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
            <TrendingUp className="w-3 h-3 text-teal-200" />
            <span className="text-[10px] font-bold">
              {isZh ? '优化' : 'Optimized'}
            </span>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Button */}
      <button className="absolute bottom-5 left-5 right-5 py-3 bg-white text-teal-900 rounded-2xl font-bold text-sm shadow-xl hover:bg-teal-50 transition-colors flex items-center justify-center gap-2 z-20">
        {isZh ? '开始循环' : 'Start Loop'}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};


/**
 * Daily Calibration Card
 * Amber gradient card with daily check-in theme
 */
export const DailyCalibrationCard = ({ isCompleted = false, onStart }: { isCompleted?: boolean; onStart?: () => void }) => {
  const { language } = useI18n();
  const isZh = language !== 'en';

  return (
    <div
      className="relative w-full h-full rounded-[32px] overflow-hidden shadow-[0_20px_40px_-5px_rgba(0,0,0,0.1)] font-sans group hover:scale-[1.02] transition-transform duration-300 ease-out cursor-pointer"
      onClick={onStart}
    >
      {/* Full Background Gradient - Warm Amber/Gold tones */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F5C563] to-[#D4A03C]">
        {/* Organic Circles/Blobs */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#FFE4A4] rounded-full blur-2xl opacity-60" />
        <div className="absolute top-20 -left-10 w-40 h-40 bg-[#FFCC66]/50 rounded-full blur-xl opacity-50" />

        {/* Central Element with Sun Ray Animation */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-60 h-60">
          {/* Rotating sun rays */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-16 bg-gradient-to-t from-white/0 to-white/30 rounded-full"
                style={{
                  transform: `rotate(${i * 45}deg) translateY(-50px)`,
                  transformOrigin: 'center 80px',
                }}
              />
            ))}
          </motion.div>

          {/* Pulsing glow ring */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-28 h-28 rounded-full bg-white/20 blur-lg" />
          </motion.div>

          {/* Central icon */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-10"
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center rotate-45">
              {isCompleted ? (
                <CheckCircle className="w-10 h-10 text-[#D4A03C] -rotate-45" strokeWidth={2.5} />
              ) : (
                <Sun className="w-10 h-10 text-[#D4A03C] -rotate-45" strokeWidth={2.5} />
              )}
            </div>
          </motion.div>

          {/* Floating time indicators */}
          <motion.div
            className="absolute top-4 right-8"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="px-2 py-1 bg-white/80 rounded-lg shadow-md">
              <span className="text-[10px] font-bold text-[#D4A03C]">☀️ AM</span>
            </div>
          </motion.div>
          <motion.div
            className="absolute bottom-8 left-6"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <div className="px-2 py-1 bg-white/80 rounded-lg shadow-md">
              <span className="text-[10px] font-bold text-[#D4A03C]">🌙 PM</span>
            </div>
          </motion.div>
        </div>

        {/* Badge */}
        <div className="absolute top-6 left-6 px-3 py-1.5 bg-black/15 backdrop-blur-md rounded-full">
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">
            {isZh ? '每日' : 'Daily'}
          </span>
        </div>
      </div>

      {/* Bottom Content Overlay */}
      <div className="absolute bottom-0 left-0 w-full p-8 pb-20 bg-gradient-to-t from-[#B8860B] via-[#B8860B]/90 to-transparent pt-20 text-white">
        <div className="mb-4">
          <h3 className="text-3xl font-bold leading-none mb-2">
            {isZh ? (
              <>今日<br />校准</>
            ) : (
              <>Daily<br />Check</>
            )}
          </h3>
          <p className="text-white/80 text-xs font-medium max-w-[200px]">
            {isCompleted
              ? (isZh ? '今日校准已完成，明天再来！' : 'Calibration complete, see you tomorrow!')
              : (isZh ? '每天追踪你的身心状态，获得个人化洞见。' : 'Track your daily wellness for personalized insights.')
            }
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
            <span className="text-[10px] font-bold">{isZh ? '1分钟' : '1 Min'}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
            <span className="text-[10px] font-bold">{isZh ? '个人化' : 'Personal'}</span>
          </div>
          {isCompleted && (
            <div className="ml-auto flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
              <span className="text-[10px] font-bold text-[#90EE90]">✓ {isZh ? '完成' : 'Done'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Action Button */}
      <button className="absolute bottom-5 left-5 right-5 py-3 bg-white text-[#B8860B] rounded-2xl font-bold text-sm shadow-xl hover:bg-[#FFFAF0] transition-colors flex items-center justify-center gap-2 z-20">
        {isCompleted
          ? (isZh ? '查看结果' : 'View Results')
          : (isZh ? '开始校准' : 'Start Check')
        }
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

const FeatureCards = { SymptomAssessmentCard, BayesianCycleCard, DailyCalibrationCard };

export default FeatureCards;

