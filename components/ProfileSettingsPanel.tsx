'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AnimatedSection from '@/components/AnimatedSection';
import { useProfile } from '@/hooks/domain/useProfile';

interface ProfileRecord {
  id?: string;
  height?: number | null;
  weight?: number | null;
  birth_date?: string | null;
  location?: string | null;
  daily_checkin_time?: string | null;
  notification_enabled?: boolean | null;
  notification_email?: string | null;
}

interface ProfileSettingsPanelProps {
  initialProfile: ProfileRecord;
}

interface ProfileFormState {
  height: string;
  weight: string;
  birth_date: string;
  location: string;
  daily_checkin_time: string;
  notification_enabled: boolean;
  notification_email: string;
}

export default function ProfileSettingsPanel({ initialProfile }: ProfileSettingsPanelProps) {
  const router = useRouter();
  const { isLoading, isSaving, error, update } = useProfile();
  const [localError, setLocalError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProfileFormState>({
    height: initialProfile?.height ? String(initialProfile.height) : '',
    weight: initialProfile?.weight ? String(initialProfile.weight) : '',
    birth_date: initialProfile?.birth_date ? (initialProfile.birth_date as string).slice(0, 10) : '',
    location: initialProfile?.location || '广州',
    daily_checkin_time: initialProfile?.daily_checkin_time ? (initialProfile.daily_checkin_time as string).slice(0, 5) : '',
    notification_enabled: initialProfile?.notification_enabled !== false,
    notification_email: initialProfile?.notification_email || '',
  });

  const handleChange = <K extends keyof ProfileFormState>(field: K, value: ProfileFormState[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);

    try {
      const success = await update({
        height: formData.height ? parseFloat(formData.height) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        birth_date: formData.birth_date || null,
        location: formData.location || null,
        daily_checkin_time: formData.daily_checkin_time ? `${formData.daily_checkin_time}:00` : null,
        notification_enabled: formData.notification_enabled,
        notification_email: formData.notification_email || null,
      });

      if (!success) {
        setLocalError(error || '保存失败，请稍后重试');
        return;
      }

      router.push('/unlearn');
      router.refresh();
    } catch (err) {
      console.error('保存设置时出错:', err);
      setLocalError('保存时发生错误，请稍后重试');
    }
  };

  return (
    <AnimatedSection inView variant="fadeUp">
      <div className="rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#0B3D2E] mb-2">设置</h2>
        </div>
        <form onSubmit={handleSubmit} className={`space-y-6 ${isLoading ? 'animate-pulse' : ''}`}>

          {/* 个人生理指标 */}
          <div>
            <h3 className="text-lg font-medium text-[#0B3D2E] mb-4">个人生理指标</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0B3D2E] mb-2">身高 (cm)</label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleChange('height', e.target.value)}
                  className="w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20"
                  placeholder="例如：175"
                  min="100"
                  max="250"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0B3D2E] mb-2">体重 (kg)</label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleChange('weight', e.target.value)}
                  className="w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20"
                  placeholder="例如：70"
                  min="30"
                  max="200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0B3D2E] mb-2">生日</label>
                <input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleChange('birth_date', e.target.value)}
                  className="w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20"
                />
              </div>
            </div>
          </div>

          {/* 定位位置 */}
          <div>
            <h3 className="text-lg font-medium text-[#0B3D2E] mb-4">定位位置</h3>
            <div>
              <label className="block text-sm font-medium text-[#0B3D2E] mb-2">所在城市</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className="w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20"
                placeholder="例如：广州"
              />
            </div>
          </div>

          {/* 提醒时间设置 */}
          <div>
            <h3 className="text-lg font-medium text-[#0B3D2E] mb-4">提醒时间设置</h3>
            <div>
              <label className="block text-sm font-medium text-[#0B3D2E] mb-2">每日记录提醒时间</label>
              <input
                type="time"
                value={formData.daily_checkin_time}
                onChange={(e) => handleChange('daily_checkin_time', e.target.value)}
                className="w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20"
              />
            </div>
          </div>

          {/* 通知设置 */}
          <div>
            <h3 className="text-lg font-medium text-[#0B3D2E] mb-4">通知设置</h3>
            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.notification_enabled}
                    onChange={(e) => handleChange('notification_enabled', e.target.checked)}
                    className="rounded border-[#E7E1D6] text-[#0B3D2E] focus:ring-[#0B3D2E]/20"
                  />
                  <span className="text-sm font-medium text-[#0B3D2E]">启用通知</span>
                </label>
              </div>

              {formData.notification_enabled && (
                <div>
                  <label className="block text-sm font-medium text-[#0B3D2E] mb-2">通知邮箱</label>
                  <input
                    type="email"
                    value={formData.notification_email}
                    onChange={(e) => handleChange('notification_email', e.target.value)}
                    className="w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20"
                    placeholder="your@email.com"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push('/unlearn')}
              className="px-4 py-2 rounded-md border border-[#E7E1D6] bg-white text-[#0B3D2E] text-sm font-medium hover:bg-[#FAF6EF] transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 rounded-md bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] text-white text-sm font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? '保存中...' : '保存并返回首页'}
            </button>
          </div>
          {(localError || error) && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <p className="text-sm text-red-800">{localError || error}</p>
            </div>
          )}
        </form>
      </div>
    </AnimatedSection>
  );
}

