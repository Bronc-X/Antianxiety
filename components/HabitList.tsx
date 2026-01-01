'use client';

import { useState } from 'react';
import BeliefScoreModal from './BeliefScoreModal';
import { useHabits } from '@/hooks/domain/useHabits';

// 习惯数据类型定义（兼容新 habits 表）
interface Habit {
  id: number;
  title: string; // 从 habit_name 改为 title
  cue: string | null;
  response: string | null;
  reward: string | null;
  belief_score: number | null;
  created_at: string;
}

interface HabitListProps {
  habits?: Habit[];
  userId?: string;
}

/**
 * 习惯列表组件
 * 显示用户的习惯列表，并提供"我今天完成了"按钮
 */
export default function HabitList({ habits, userId }: HabitListProps) {
  const {
    habits: hookHabits,
    isLoading,
    isSaving,
    error: habitError,
    complete,
    clearError,
  } = useHabits({ initialHabits: habits, userId });
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const displayHabits = hookHabits;

  // 处理点击"我今天完成了"按钮
  const handleCompleteClick = (habit: Habit) => {
    setSelectedHabit(habit);
    setIsModalOpen(true);
  };

  // 处理关闭模态框
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedHabit(null);
  };

  // 处理提交信念分数
  const handleSubmitBeliefScore = async (score: number) => {
    if (!selectedHabit) return;

    try {
      clearError();
      const success = await complete(selectedHabit.id, score);
      if (!success) {
        const errorMessage = habitError || '完成习惯时发生错误，请稍后重试';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('完成习惯时出错:', error);
      const errorMessage =
        error instanceof Error ? error.message : '完成习惯时发生错误，请稍后重试';
      alert(errorMessage);
      throw error; // 重新抛出错误，让模态框知道提交失败
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="h-4 w-32 bg-gray-200 rounded mb-3" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-gray-100 rounded" />
              <div className="h-3 w-2/3 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (displayHabits.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-4">
        {displayHabits.map((habit) => (
          <div
            key={habit.id}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-base font-medium text-gray-900">
                    {habit.title}
                  </h4>
                  {habit.belief_score !== null && (
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      信念分数: {habit.belief_score}/10
                    </span>
                  )}
                </div>

                {/* 习惯循环信息 */}
                <div className="space-y-2 text-sm text-gray-600">
                  {habit.cue && (
                    <div>
                      <span className="font-medium text-gray-700">线索：</span>
                      {habit.cue}
                    </div>
                  )}
                  {habit.response && (
                    <div>
                      <span className="font-medium text-gray-700">反应：</span>
                      {habit.response}
                    </div>
                  )}
                  {habit.reward && (
                    <div>
                      <span className="font-medium text-gray-700">奖励：</span>
                      {habit.reward}
                    </div>
                  )}
                </div>
              </div>

              {/* 完成按钮 */}
              <button
                type="button"
                onClick={() => handleCompleteClick(habit)}
                disabled={isSaving}
                className="ml-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                我今天完成了
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 信念分数模态框 */}
      {selectedHabit && (
        <BeliefScoreModal
          isOpen={isModalOpen}
          habitName={selectedHabit.title}
          onClose={handleCloseModal}
          onSubmit={handleSubmitBeliefScore}
        />
      )}

      {habitError && (
        <div className="mt-4 text-sm text-red-600">{habitError}</div>
      )}
    </>
  );
}

