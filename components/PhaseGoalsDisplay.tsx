'use client';

/**
 * Phase Goals Display Component
 * 
 * Displays AI-recommended Phase Goals in the Settings page.
 * Allows users to view and modify their goals.
 * 
 * Requirements: 2.5 - Sync Phase Goals to Settings page
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Edit3, Loader2, Check, X, AlertCircle, Sparkles } from 'lucide-react';
import type { PhaseGoal, GoalType } from '@/types/adaptive-interaction';

interface PhaseGoalsDisplayProps {
  userId: string;
  onGoalChange?: (goals: PhaseGoal[]) => void;
}

const GOAL_TYPE_LABELS: Record<GoalType, { zh: string; en: string; icon: string }> = {
  sleep: { zh: '改善睡眠', en: 'Improve Sleep', icon: '😴' },
  energy: { zh: '提升能量', en: 'Boost Energy', icon: '⚡' },
  weight: { zh: '体重管理', en: 'Weight Management', icon: '🎯' },
  stress: { zh: '压力管理', en: 'Stress Management', icon: '🧘' },
  fitness: { zh: '提升体能', en: 'Improve Fitness', icon: '💪' },
};

export default function PhaseGoalsDisplay({ userId, onGoalChange }: PhaseGoalsDisplayProps) {
  const [goals, setGoals] = useState<PhaseGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [alternatives, setAlternatives] = useState<Array<{ type: GoalType; title: string; rationale: string }>>([]);
  const [selectedAlternative, setSelectedAlternative] = useState<GoalType | null>(null);
  const [isModifying, setIsModifying] = useState(false);

  // Fetch user's Phase Goals
  useEffect(() => {
    fetchGoals();
  }, [userId]);

  const fetchGoals = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/settings/phase-goals?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || []);
      } else {
        setError('无法加载目标');
      }
    } catch (err) {
      console.error('Error fetching goals:', err);
      setError('网络错误');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit button click - fetch explanation
  const handleEditClick = async (goal: PhaseGoal) => {
    setEditingGoalId(goal.id);
    setSelectedAlternative(null);
    
    try {
      const response = await fetch('/api/onboarding/modify-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId: goal.id, action: 'explain' }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setExplanation(data.explanation);
        setAlternatives(data.alternativeGoals || []);
      }
    } catch (err) {
      console.error('Error fetching explanation:', err);
      setExplanation('无法获取解释');
    }
  };

  // Confirm goal modification
  const handleConfirmModification = async () => {
    if (!editingGoalId || !selectedAlternative) return;
    
    setIsModifying(true);
    
    try {
      const response = await fetch('/api/onboarding/modify-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: editingGoalId,
          newGoalType: selectedAlternative,
          action: 'confirm',
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setGoals(prev => prev.map(g => g.id === editingGoalId ? data.updatedGoal : g));
        onGoalChange?.(goals.map(g => g.id === editingGoalId ? data.updatedGoal : g));
        setEditingGoalId(null);
      }
    } catch (err) {
      console.error('Error modifying goal:', err);
    } finally {
      setIsModifying(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingGoalId(null);
    setExplanation('');
    setAlternatives([]);
    setSelectedAlternative(null);
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#E7E1D6] bg-white p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-[#0B3D2E] animate-spin" />
          <span className="ml-2 text-sm text-[#0B3D2E]/60">加载目标中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="rounded-xl border border-[#E7E1D6] bg-white p-6">
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-[#0B3D2E]/20 mx-auto mb-3" />
          <p className="text-[#0B3D2E]/60 mb-2">还没有设置阶段性目标</p>
          <p className="text-sm text-[#0B3D2E]/40">完成自适应问卷后，AI 将为你推荐个性化目标</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#9CAF88]" />
          <h3 className="text-lg font-semibold text-[#0B3D2E]">AI 推荐的阶段性目标</h3>
        </div>
        <span className="text-xs text-[#0B3D2E]/40">基于你的代谢指纹分析</span>
      </div>

      {/* Goals List */}
      <div className="space-y-3">
        {goals.map((goal) => (
          <motion.div
            key={goal.id}
            layout
            className="rounded-xl border border-[#E7E1D6] bg-white overflow-hidden"
          >
            {/* Goal Card */}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{GOAL_TYPE_LABELS[goal.goal_type]?.icon || '🎯'}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-[#0B3D2E]">{goal.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        goal.priority === 1 
                          ? 'bg-[#0B3D2E] text-white' 
                          : 'bg-[#E7E1D6] text-[#0B3D2E]'
                      }`}>
                        {goal.priority === 1 ? '首要' : '次要'}
                      </span>
                      {goal.user_modified && (
                        <span className="text-xs text-[#9CAF88]">✓ 已调整</span>
                      )}
                    </div>
                    <p className="text-sm text-[#0B3D2E]/60 mt-1">{goal.rationale}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleEditClick(goal)}
                  className="p-2 hover:bg-[#F2F7F5] rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-[#0B3D2E]/40" />
                </button>
              </div>

              {/* Citation */}
              {goal.citations && goal.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#E7E1D6]">
                  <p className="text-xs text-[#0B3D2E]/50">
                    📚 {goal.citations[0].title} ({goal.citations[0].year})
                  </p>
                </div>
              )}
            </div>

            {/* Edit Panel */}
            <AnimatePresence>
              {editingGoalId === goal.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-[#E7E1D6] bg-[#FAFAFA]"
                >
                  <div className="p-4 space-y-4">
                    {/* AI Explanation */}
                    <div className="bg-white rounded-lg p-3 border border-[#E7E1D6]">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-[#9CAF88] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-[#0B3D2E]/40 mb-1">为什么推荐这个目标？</p>
                          <p className="text-sm text-[#0B3D2E]/80">{explanation || '加载中...'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Alternatives */}
                    {alternatives.length > 0 && (
                      <div>
                        <p className="text-xs text-[#0B3D2E]/60 mb-2">可选择的替代目标：</p>
                        <div className="space-y-2">
                          {alternatives.map((alt) => (
                            <button
                              key={alt.type}
                              onClick={() => setSelectedAlternative(alt.type)}
                              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                                selectedAlternative === alt.type
                                  ? 'border-[#0B3D2E] bg-[#0B3D2E]/5'
                                  : 'border-[#E7E1D6] bg-white hover:border-[#0B3D2E]/40'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span>{GOAL_TYPE_LABELS[alt.type]?.icon}</span>
                                  <span className="font-medium text-sm text-[#0B3D2E]">{alt.title}</span>
                                </div>
                                {selectedAlternative === alt.type && (
                                  <Check className="w-4 h-4 text-[#0B3D2E]" />
                                )}
                              </div>
                              <p className="text-xs text-[#0B3D2E]/60 mt-1 ml-6">{alt.rationale}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 py-2 border border-[#E7E1D6] text-[#0B3D2E] rounded-lg text-sm font-medium hover:bg-white transition-colors"
                      >
                        保持原目标
                      </button>
                      <button
                        onClick={handleConfirmModification}
                        disabled={!selectedAlternative || isModifying}
                        className="flex-1 py-2 bg-[#0B3D2E] text-white rounded-lg text-sm font-medium hover:bg-[#0a3629] transition-colors disabled:opacity-50"
                      >
                        {isModifying ? (
                          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        ) : (
                          '确认修改'
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
