'use client';

import { useEffect, useRef, useState } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import BeliefScoreModal from './BeliefScoreModal';

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
  habits: Habit[];
  userId: string;
}

/**
 * 习惯列表组件
 * 显示用户的习惯列表，并提供"我今天完成了"按钮
 */
export default function HabitList({ habits, userId }: HabitListProps) {
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const habitIdSetRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    habitIdSetRef.current = new Set(habits.map((habit) => habit.id));
  }, [habits]);

  useEffect(() => {
    const channel = supabase
      .channel(`habit-sync-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${userId}` },
        () => {
          router.refresh();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'habit_completions' },
        (payload) => {
          const newHabitId = (payload.new as { habit_id?: number } | null)?.habit_id;
          const oldHabitId = (payload.old as { habit_id?: number } | null)?.habit_id;
          if (
            (typeof newHabitId === 'number' && habitIdSetRef.current.has(newHabitId)) ||
            (typeof oldHabitId === 'number' && habitIdSetRef.current.has(oldHabitId))
          ) {
            router.refresh();
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('Supabase 实时频道连接失败，已回退到手动刷新。');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, supabase, userId]);

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
      // 获取当前用户
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('无法获取用户信息，请重新登录');
      }

      // 开始事务：更新 belief_score 并创建 habit_completions 记录
      // 由于 Supabase 不支持事务，我们需要分别执行两个操作

      // 1. 更新 habits 表的 belief_score
      const { error: updateError } = await supabase
        .from('habits')
        .update({ belief_score: score })
        .eq('id', selectedHabit.id)
        .eq('user_id', user.id)
        .select();

      if (updateError) {
        // 记录详细的错误信息
        console.error('更新信念分数时出错:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          error: updateError,
        });

        // 根据错误类型提供更具体的错误消息
        let errorMessage = '更新信念分数时出错，请稍后重试';
        if (updateError.code === 'PGRST116') {
          errorMessage = '未找到要更新的记录，请刷新页面后重试';
        } else if (updateError.code === '42501') {
          errorMessage = '权限不足，无法更新记录';
        } else if (updateError.message) {
          // 检查是否是列不存在的错误
          if (
            updateError.message.includes('belief_score') ||
            updateError.message.includes('column') ||
            updateError.message.includes('schema cache')
          ) {
            errorMessage =
              '数据库表结构未更新。请在 Supabase Dashboard 中执行 supabase_belief_system.sql 文件中的 SQL 语句来添加 belief_score 列。';
          } else {
            errorMessage = `更新失败：${updateError.message}`;
          }
        }

        throw new Error(errorMessage);
      }

      // 2. 在 habit_completions 表中创建新记录
      const { error: insertError } = await supabase
        .from('habit_completions')
        .insert({
          habit_id: selectedHabit.id,
          user_id: user.id, // habit_completions 表需要 user_id
          belief_score_snapshot: score,
          completed_at: new Date().toISOString(),
        })
        .select();

      if (insertError) {
        // 记录详细的错误信息
        console.error('创建完成记录时出错:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          error: insertError,
        });

        // 根据错误类型提供更具体的错误消息
        let errorMessage = '创建完成记录时出错，请稍后重试';
        if (insertError.code === '23503') {
          errorMessage = '关联的习惯不存在，请刷新页面后重试';
        } else if (insertError.code === '42501') {
          errorMessage = '权限不足，无法创建记录';
        } else if (insertError.message) {
          errorMessage = `创建失败：${insertError.message}`;
        }

        throw new Error(errorMessage);
      }

      // 成功，刷新页面
      router.refresh();
    } catch (error) {
      console.error('完成习惯时出错:', error);
      const errorMessage =
        error instanceof Error ? error.message : '完成习惯时发生错误，请稍后重试';
      alert(errorMessage);
      throw error; // 重新抛出错误，让模态框知道提交失败
    }
  };

  if (habits.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500 text-center">
          还没有习惯，开始添加您的第一个习惯吧
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {habits.map((habit) => (
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
    </>
  );
}

