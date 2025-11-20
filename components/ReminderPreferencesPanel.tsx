'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import AnimatedSection from '@/components/AnimatedSection';

interface ReminderPreference {
  enabled: boolean;
  mode: 'manual' | 'ai';
  time?: string;
  dose?: string;
}

interface ReminderProfile {
  id?: string;
  reminder_preferences?: Record<string, ReminderPreference> & {
    ai_auto_mode?: boolean;
  };
}

interface ReminderPreferencesPanelProps {
  initialProfile: ReminderProfile;
}

const reminderActivities = [
  { id: 'water', label: '💧 喝水', defaultTime: '09:00', defaultDose: '200ml' },
  { id: 'rest', label: '😌 小憩', defaultTime: '14:00', defaultDose: '10分钟' },
  { id: 'slow_walk', label: '🚶 慢走', defaultTime: '16:00', defaultDose: '5分钟' },
  { id: 'walk', label: '🏃 步行', defaultTime: '18:00', defaultDose: '10分钟' },
  { id: 'exercise', label: '💪 运动', defaultTime: '19:00', defaultDose: '15分钟' },
];

export default function ReminderPreferencesPanel({ initialProfile }: ReminderPreferencesPanelProps) {
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savedPreferences = initialProfile?.reminder_preferences || {};
  const [aiAutoMode, setAiAutoMode] = useState(Boolean(savedPreferences.ai_auto_mode));

  const [preferences, setPreferences] = useState<Record<string, ReminderPreference>>(() => {
    const prefs: Record<string, ReminderPreference> = {};
    reminderActivities.forEach((activity) => {
      const existingPreference = savedPreferences[activity.id] as ReminderPreference | undefined;
      prefs[activity.id] =
        existingPreference || {
          enabled: false,
          mode: 'ai',
          time: activity.defaultTime,
          dose: activity.defaultDose,
        };
    });
    return prefs;
  });

  const updatePreference = <K extends keyof ReminderPreference>(
    activityId: string,
    field: K,
    value: ReminderPreference[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [activityId]: {
        ...prev[activityId],
        [field]: value,
      },
    }));
  };

  // 启用AI自动提醒模式
  const handleEnableAIAuto = () => {
    setAiAutoMode(true);
    // 将所有活动设置为启用，模式为AI
    const newPreferences: Record<string, ReminderPreference> = {};
    reminderActivities.forEach((activity) => {
      newPreferences[activity.id] = {
        enabled: true,
        mode: 'ai',
        time: activity.defaultTime,
        dose: activity.defaultDose,
      };
    });
    setPreferences(newPreferences);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('请先登录');
        setIsSaving(false);
        return;
      }

      // 保存提醒偏好，并标记为今日提醒
      const todayReminders = {
        ...preferences,
        ai_auto_mode: aiAutoMode,
        last_updated: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ reminder_preferences: todayReminders })
        .eq('id', user.id);

      if (updateError) {
        setError(`保存失败: ${updateError.message}`);
        setIsSaving(false);
        return;
      }

      // 保存成功后返回首页
      router.push('/landing');
    } catch (err) {
      console.error('保存提醒偏好时出错:', err);
      setError('保存时发生错误，请稍后重试');
      setIsSaving(false);
    }
  };

  return (
    <AnimatedSection inView variant="fadeUp">
      <div className="rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[#0B3D2E] mb-4">今日提醒</h2>
        <p className="text-sm text-[#0B3D2E]/70 mb-6">
          选择你希望今天接收提醒的活动，选择后今天就会智能提醒。也可以启用AI自动提醒，无需手动选择。
        </p>

        {/* AI自动提醒按钮 */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleEnableAIAuto}
            className={`w-full px-4 py-3 rounded-md border text-sm font-medium transition-colors ${
              aiAutoMode
                ? 'border-[#0B3D2E] bg-[#0B3D2E] text-white'
                : 'border-[#0B3D2E]/30 bg-white text-[#0B3D2E] hover:border-[#0B3D2E] hover:bg-[#FAF6EF]'
            }`}
          >
            {aiAutoMode ? '✓ AI自动提醒已启用' : '🤖 启用AI自动提醒（自适应，无需选择）'}
          </button>
          {aiAutoMode && (
            <p className="mt-2 text-xs text-[#0B3D2E]/60">
              AI将根据你的日常行为模式和生理信号，自动为你制定最适合的提醒时间和小计量。
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {reminderActivities.map(activity => {
            const pref = preferences[activity.id];
            return (
              <div key={activity.id} className="rounded-lg border border-[#E7E1D6] bg-[#FAF6EF] p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pref.enabled}
                        onChange={(e) => {
                          updatePreference(activity.id, 'enabled', e.target.checked);
                          if (aiAutoMode) setAiAutoMode(false); // 如果手动选择，取消AI自动模式
                        }}
                        disabled={aiAutoMode}
                        className="rounded border-[#E7E1D6] text-[#0B3D2E] focus:ring-[#0B3D2E]/20 disabled:opacity-50"
                      />
                      <span className={`text-base font-medium ${pref.enabled ? 'text-[#0B3D2E]' : 'text-[#0B3D2E]/60'}`}>
                        {activity.label}
                      </span>
                    </label>
                  </div>
                </div>

                {pref.enabled && !aiAutoMode && (
                  <div className="space-y-4 pl-6">
                    <div>
                      <label className="block text-sm font-medium text-[#0B3D2E] mb-2">提醒时间</label>
                      <input
                        type="time"
                        value={pref.time || activity.defaultTime}
                        onChange={(e) => updatePreference(activity.id, 'time', e.target.value)}
                        className="w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20"
                      />
                    </div>
                    <div className="rounded-md border border-[#0B3D2E]/20 bg-[#0B3D2E]/5 px-4 py-3 text-sm text-[#0B3D2E]">
                      已选择，今天将在此时间智能提醒你{activity.label}
                    </div>
                  </div>
                )}

                {pref.enabled && aiAutoMode && (
                  <div className="pl-6">
                    <div className="rounded-md border border-[#0B3D2E]/20 bg-[#0B3D2E]/5 px-4 py-3 text-sm text-[#0B3D2E]">
                      AI将根据你的日常行为模式和生理信号，自动为你制定最适合的提醒时间和小计量。
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push('/landing')}
              className="px-4 py-2 rounded-md border border-[#E7E1D6] bg-white text-[#0B3D2E] text-sm font-medium hover:bg-[#FAF6EF] transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 rounded-md bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] text-white text-sm font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </AnimatedSection>
  );
}

