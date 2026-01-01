'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useHabits } from '@/hooks/domain/useHabits';

// 习惯表单数据类型定义（兼容新 habits 表）
interface HabitFormData {
  title: string; // 从 habit_name 改为 title
  cue: string;
  response: string;
  reward: string;
}

/**
 * 习惯表单组件
 * 用于添加新的习惯（基于 Cue-Response-Reward 模型）
 */
export default function HabitForm() {
  const router = useRouter();
  const { create, isSaving, error: habitError, clearError } = useHabits({ autoLoad: false });

  const [formData, setFormData] = useState<HabitFormData>({
    title: '',
    cue: '',
    response: '',
    reward: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // 处理表单提交
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    clearError();

    // 验证必填字段
    if (!formData.title.trim()) {
      setError('请填写习惯名称');
      return;
    }

    try {
      const success = await create({
        title: formData.title.trim(),
        cue: formData.cue.trim() || null,
        response: formData.response.trim() || null,
        reward: formData.reward.trim() || null,
      });

      if (!success) {
        return;
      }

      // 添加成功，重置表单并刷新页面
      setFormData({
        title: '',
        cue: '',
        response: '',
        reward: '',
      });
      setIsExpanded(false);
      router.refresh();
    } catch (err) {
      console.error('提交表单时出错:', err);
      setError('提交时发生错误，请稍后重试');
    }
  };

  // 处理输入变化
  const handleChange = (field: keyof HabitFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const combinedError = error || habitError;

  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm${isSaving ? ' animate-pulse' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">我的习惯</h3>
        {!isExpanded && (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            + 添加新习惯
          </button>
        )}
      </div>

      {/* 添加习惯表单 */}
      {isExpanded && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-4 border-b border-gray-200 pb-6">
          {/* 错误提示 */}
          {combinedError && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">{combinedError}</p>
            </div>
          )}

          {/* 习惯名称 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              习惯名称 <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="例如：下午步行"
            />
          </div>

          {/* 线索 (Cue) */}
          <div>
            <label htmlFor="cue" className="block text-sm font-medium text-gray-700">
              线索（触发习惯的提示）
            </label>
            <input
              id="cue"
              name="cue"
              type="text"
              value={formData.cue}
              onChange={(e) => handleChange('cue', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="例如：下午3点感到焦虑"
            />
            <p className="mt-1 text-xs text-gray-500">什么情况会触发这个习惯？</p>
          </div>

          {/* 反应 (Response) */}
          <div>
            <label htmlFor="response" className="block text-sm font-medium text-gray-700">
              反应（习惯行为）
            </label>
            <input
              id="response"
              name="response"
              type="text"
              value={formData.response}
              onChange={(e) => handleChange('response', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="例如：步行5分钟"
            />
            <p className="mt-1 text-xs text-gray-500">您会采取什么行动？</p>
          </div>

          {/* 奖励 (Reward) */}
          <div>
            <label htmlFor="reward" className="block text-sm font-medium text-gray-700">
              奖励（习惯带来的好处）
            </label>
            <input
              id="reward"
              name="reward"
              type="text"
              value={formData.reward}
              onChange={(e) => handleChange('reward', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="例如：记录一件积极的小事"
            />
            <p className="mt-1 text-xs text-gray-500">这个习惯会带来什么好处？</p>
          </div>

          {/* 提交按钮 */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? '保存中...' : '保存习惯'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsExpanded(false);
                setFormData({
                  title: '',
                  cue: '',
                  response: '',
                  reward: '',
                });
                setError(null);
                clearError();
              }}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              取消
            </button>
          </div>
        </form>
      )}

      {combinedError && (
        <div className="mt-4 text-sm text-red-600">{combinedError}</div>
      )}
    </div>
  );
}

