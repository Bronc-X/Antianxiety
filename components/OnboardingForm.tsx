'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/hooks/domain/useProfile';

// 表单数据类型定义
interface OnboardingFormData {
  primary_concern: string;
  activity_level: string;
  circadian_rhythm: string;
}

interface OnboardingFormProps {
  initialData?: {
    primary_concern?: string | null;
    activity_level?: string | null;
    circadian_rhythm?: string | null;
  } | null;
}

/**
 * Onboarding 表单组件
 * 收集用户的主要担忧、活动水平和昼夜节律信息
 */
export default function OnboardingForm({ initialData }: OnboardingFormProps) {
  const router = useRouter();
  const { update, isSaving, error: profileError } = useProfile();

  const [formData, setFormData] = useState<OnboardingFormData>({
    primary_concern: initialData?.primary_concern || '',
    activity_level: initialData?.activity_level || '',
    circadian_rhythm: initialData?.circadian_rhythm || '',
  });

  const [error, setError] = useState<string | null>(null);
  const isLoading = isSaving;

  const displayError = error || profileError;

  // 处理表单提交
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // 验证所有字段都已填写
    if (!formData.primary_concern || !formData.activity_level || !formData.circadian_rhythm) {
      setError('请填写所有字段');
      setIsLoading(false);
      return;
    }

    try {
      const success = await update({
        primary_concern: formData.primary_concern,
        activity_level: formData.activity_level,
        circadian_rhythm: formData.circadian_rhythm,
      });

      if (!success) {
        setError(profileError || '保存信息时出错，请稍后重试');
        return;
      }

      // 更新成功，重定向到主页
      router.push('/unlearn/app');
      router.refresh();
    } catch (err) {
      console.error('提交表单时出错:', err);
      setError('提交时发生错误，请稍后重试');
    }
  };

  // 处理输入变化
  const handleChange = (field: keyof OnboardingFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${isLoading ? 'animate-pulse' : ''}`}>
      {/* 错误提示 */}
      {displayError && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-800">{displayError}</p>
        </div>
      )}

      {/* 主要担忧 */}
      <div>
        <label htmlFor="primary_concern" className="block text-sm font-medium text-[#0B3D2E]">
          您的主要担忧是什么？
        </label>
        <select
          id="primary_concern"
          name="primary_concern"
          required
          value={formData.primary_concern}
          onChange={(e) => handleChange('primary_concern', e.target.value)}
          className="mt-1 block w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E]/30"
        >
          <option value="">请选择...</option>
          <option value="缓解焦虑">缓解焦虑</option>
          <option value="改善睡眠">改善睡眠</option>
          <option value="提升精力">提升精力</option>
        </select>
        <p className="mt-1 text-xs text-[#0B3D2E]/60">
          选择您最希望改善的健康方面
        </p>
      </div>

      {/* 活动水平 */}
      <div>
        <label htmlFor="activity_level" className="block text-sm font-medium text-[#0B3D2E]">
          您的活动水平如何？
        </label>
        <select
          id="activity_level"
          name="activity_level"
          required
          value={formData.activity_level}
          onChange={(e) => handleChange('activity_level', e.target.value)}
          className="mt-1 block w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E]/30"
        >
          <option value="">请选择...</option>
          <option value="低">低</option>
          <option value="中">中</option>
          <option value="高">高</option>
        </select>
        <p className="mt-1 text-xs text-[#0B3D2E]/60">
          描述您目前的日常活动量
        </p>
      </div>

      {/* 昼夜节律 */}
      <div>
        <label htmlFor="circadian_rhythm" className="block text-sm font-medium text-[#0B3D2E]">
          您的作息类型是？
        </label>
        <select
          id="circadian_rhythm"
          name="circadian_rhythm"
          required
          value={formData.circadian_rhythm}
          onChange={(e) => handleChange('circadian_rhythm', e.target.value)}
          className="mt-1 block w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E]/30"
        >
          <option value="">请选择...</option>
          <option value="早鸟型">早鸟型</option>
          <option value="夜猫子型">夜猫子型</option>
        </select>
        <p className="mt-1 text-xs text-[#0B3D2E]/60">
          选择最符合您作息习惯的类型
        </p>
      </div>

      {/* 提交按钮 */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? '保存中...' : '完成设置'}
        </button>
      </div>
    </form>
  );
}

