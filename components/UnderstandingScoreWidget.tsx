/**
 * Understanding Score Widget Component
 * 用户理解度评分组件
 * 
 * Requirements: 5.6, 5.8
 * - Display current score with progress bar to 95
 * - Show score breakdown (4 components)
 * - Display "Deep Understanding Achieved" celebration when >= 95
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, Target, Sparkles } from 'lucide-react';
import type { UserUnderstandingScore, ScoreBreakdown } from '@/types/adaptive-plan';
import { useUnderstandingScore } from '@/hooks/domain/useUnderstandingScore';

interface UnderstandingScoreWidgetProps {
  userId: string;
  className?: string;
}

const SCORE_COMPONENTS: { key: keyof ScoreBreakdown; label: string; icon: React.ReactNode }[] = [
  { key: 'completion_prediction_accuracy', label: '完成预测', icon: <Target className="w-4 h-4" /> },
  { key: 'replacement_acceptance_rate', label: '替换接受', icon: <TrendingUp className="w-4 h-4" /> },
  { key: 'sentiment_prediction_accuracy', label: '情绪预测', icon: <Brain className="w-4 h-4" /> },
  { key: 'preference_pattern_match', label: '偏好匹配', icon: <Sparkles className="w-4 h-4" /> },
];

const DEEP_UNDERSTANDING_THRESHOLD = 95;

export default function UnderstandingScoreWidget({
  userId,
  className = '',
}: UnderstandingScoreWidgetProps) {
  const { fetchScore: fetchUnderstandingScore } = useUnderstandingScore();
  const [score, setScore] = useState<UserUnderstandingScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const loadScore = useCallback(async () => {
    try {
      const result = await fetchUnderstandingScore({ userId });
      if (result.success && result.data) {
        const data = result.data;
        setScore({
          user_id: userId,
          current_score: data.score.current,
          score_breakdown: data.score.breakdown,
          is_deep_understanding: data.score.isDeepUnderstanding,
          last_updated: data.score.lastUpdated,
          history: [],
        });
      } else {
        setScore(null);
      }
    } catch (error) {
      console.error('Failed to fetch understanding score:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchUnderstandingScore, userId]);

  useEffect(() => {
    loadScore();
  }, [loadScore]);

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl p-6 border border-[#E8DFD0] ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-[#E8DFD0] rounded w-1/3"></div>
          <div className="h-8 bg-[#E8DFD0] rounded"></div>
        </div>
      </div>
    );
  }

  if (!score) {
    return null;
  }

  const progressPercentage = Math.min(100, (score.current_score / DEEP_UNDERSTANDING_THRESHOLD) * 100);

  return (
    <div className={`bg-white rounded-2xl p-6 border border-[#E8DFD0] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-[#9CAF88]" />
          <h3 className="font-medium text-[#2C2C2C]">理解度评分</h3>
        </div>
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="text-sm text-[#C4A77D] hover:text-[#B4976D] transition-colors"
        >
          {showBreakdown ? '收起' : '详情'}
        </button>
      </div>

      {/* Score Display */}
      <div className="mb-4">
        <div className="flex items-end gap-2 mb-2">
          <span className="text-4xl font-bold text-[#2C2C2C]">
            {Math.round(score.current_score)}
          </span>
          <span className="text-lg text-[#666] mb-1">/ 100</span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 bg-[#E8DFD0] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`absolute inset-y-0 left-0 rounded-full ${
              score.is_deep_understanding ? 'bg-[#9CAF88]' : 'bg-[#C4A77D]'
            }`}
          />
          {/* Threshold Marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[#2C2C2C]"
            style={{ left: '100%' }}
          />
        </div>

        <p className="text-sm text-[#666] mt-2">
          距离深度理解还需 {Math.max(0, DEEP_UNDERSTANDING_THRESHOLD - score.current_score).toFixed(1)} 分
        </p>
      </div>

      {/* Deep Understanding Badge */}
      <AnimatePresence>
        {score.is_deep_understanding && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mb-4 p-3 bg-[#9CAF88]/10 rounded-xl border border-[#9CAF88]/30"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#9CAF88]" />
              <span className="font-medium text-[#9CAF88]">深度理解已达成！</span>
            </div>
            <p className="text-sm text-[#666] mt-1">
              系统已充分了解你的偏好和习惯
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score Breakdown */}
      <AnimatePresence>
        {showBreakdown && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 border-t border-[#E8DFD0] space-y-3">
              {SCORE_COMPONENTS.map(({ key, label, icon }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#E8DFD0] rounded-lg flex items-center justify-center text-[#666]">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-[#2C2C2C]">{label}</span>
                      <span className="text-sm font-medium text-[#2C2C2C]">
                        {Math.round(score.score_breakdown[key])}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#E8DFD0] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${score.score_breakdown[key]}%` }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="h-full bg-[#C4A77D] rounded-full"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
