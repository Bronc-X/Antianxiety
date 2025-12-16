'use client';

import { useEffect, useState } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';

// AI提醒数据类型
interface AIReminder {
  id: number;
  reminder_type: 'habit_prompt' | 'stress_check' | 'exercise_reminder' | 'custom';
  title: string;
  content: string;
  scheduled_at: string;
  read: boolean;
  dismissed: boolean;
  created_at: string;
}

interface AIReminderListProps {
  userId: string;
}

/**
 * AI提醒列表组件
 * 显示AI生成的预测性提醒和建议
 */
export default function AIReminderList({ userId }: AIReminderListProps) {
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const [reminders, setReminders] = useState<AIReminder[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取未读提醒
  useEffect(() => {
    async function fetchReminders() {
      try {
        const { data, error } = await supabase
          .from('ai_reminders')
          .select('*')
          .eq('user_id', userId)
          .eq('dismissed', false)
          .order('scheduled_at', { ascending: false })
          .limit(5);

        if (error) {
          console.error('获取AI提醒失败:', error);
        } else {
          setReminders(data || []);
        }
      } catch (error) {
        console.error('获取AI提醒时发生错误:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReminders();

    // 订阅实时更新
    const channel = supabase
      .channel(`ai-reminders-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_reminders', filter: `user_id=eq.${userId}` },
        () => {
          fetchReminders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  // 标记为已读
  const markAsRead = async (reminderId: number) => {
    try {
      const { error } = await supabase
        .from('ai_reminders')
        .update({ read: true })
        .eq('id', reminderId)
        .eq('user_id', userId);

      if (error) {
        console.error('标记提醒为已读失败:', error);
      } else {
        setReminders((prev) =>
          prev.map((r) => (r.id === reminderId ? { ...r, read: true } : r))
        );
      }
    } catch (error) {
      console.error('标记提醒为已读时发生错误:', error);
    }
  };

  // 忽略提醒
  const dismissReminder = async (reminderId: number) => {
    try {
      const { error } = await supabase
        .from('ai_reminders')
        .update({ dismissed: true })
        .eq('id', reminderId)
        .eq('user_id', userId);

      if (error) {
        console.error('忽略提醒失败:', error);
      } else {
        setReminders((prev) => prev.filter((r) => r.id !== reminderId));
      }
    } catch (error) {
      console.error('忽略提醒时发生错误:', error);
    }
  };

  // 提醒类型图标和颜色
  const getReminderStyle = (type: AIReminder['reminder_type']) => {
    switch (type) {
      case 'habit_prompt':
        return {
          icon: '🎯',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
        };
      case 'stress_check':
        return {
          icon: '🧘',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-800',
        };
      case 'exercise_reminder':
        return {
          icon: '💪',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
        };
      default:
        return {
          icon: '💡',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
        };
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-sm text-gray-500">加载AI提醒中...</div>
        </div>
      </div>
    );
  }

  if (reminders.length === 0) {
    return null; // 没有提醒时不显示组件
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 mb-4">AI 助手提醒</h3>
      <div className="space-y-3">
        {reminders.map((reminder) => {
          const style = getReminderStyle(reminder.reminder_type);
          return (
            <div
              key={reminder.id}
              className={`rounded-lg border ${style.borderColor} ${style.bgColor} p-4 ${
                !reminder.read ? 'ring-2 ring-offset-2 ring-blue-400' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{style.icon}</span>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-medium ${style.textColor} mb-1`}>
                    {reminder.title}
                  </h4>
                  <p className="text-sm text-gray-700 mb-2">{reminder.content}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>
                      {new Date(reminder.scheduled_at).toLocaleString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  {!reminder.read && (
                    <button
                      onClick={() => markAsRead(reminder.id)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      title="标记为已读"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    onClick={() => dismissReminder(reminder.id)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                    title="忽略"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
