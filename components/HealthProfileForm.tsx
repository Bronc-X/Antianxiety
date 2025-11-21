'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClientSupabaseClient } from '@/lib/supabase-client';

interface HealthProfileFormProps {
  userId: string;
  initialData?: {
    gender?: string | null;
    birth_date?: string | null;
    height_cm?: number | null;
    weight_kg?: number | null;
    activity_level?: string | null;
    body_fat_percentage?: number | null;
    primary_goal?: string | null;
    target_weight_kg?: number | null;
    weekly_goal_rate?: string | null;
    sleep_hours?: number | null;
    stress_level?: number | null;
    energy_level?: number | null;
    exercise_frequency?: string | null;
    caffeine_intake?: string | null;
    alcohol_intake?: string | null;
    smoking_status?: string | null;
  };
}

export default function HealthProfileForm({ userId, initialData }: HealthProfileFormProps) {
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  
  const [formData, setFormData] = useState({
    gender: initialData?.gender || '',
    birth_date: initialData?.birth_date || '',
    height_cm: initialData?.height_cm?.toString() || '',
    weight_kg: initialData?.weight_kg?.toString() || '',
    activity_level: initialData?.activity_level || '',
    body_fat_percentage: initialData?.body_fat_percentage?.toString() || '',
    primary_goal: initialData?.primary_goal || '',
    target_weight_kg: initialData?.target_weight_kg?.toString() || '',
    weekly_goal_rate: initialData?.weekly_goal_rate || '',
    sleep_hours: initialData?.sleep_hours?.toString() || '',
    stress_level: initialData?.stress_level?.toString() || '',
    energy_level: initialData?.energy_level?.toString() || '',
    exercise_frequency: initialData?.exercise_frequency || '',
    caffeine_intake: initialData?.caffeine_intake || '',
    alcohol_intake: initialData?.alcohol_intake || '',
    smoking_status: initialData?.smoking_status || '',
  });

  const totalSteps = 3;
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateStep = (step: number): boolean => {
    if (step === 0) {
      if (!formData.gender) {
        setError('请选择性别');
        return false;
      }
      if (!formData.birth_date) {
        setError('请选择出生日期');
        return false;
      }
      if (!formData.height_cm || parseFloat(formData.height_cm) <= 0) {
        setError('请输入有效的身高');
        return false;
      }
      if (!formData.weight_kg || parseFloat(formData.weight_kg) <= 0) {
        setError('请输入有效的体重');
        return false;
      }
      if (!formData.activity_level) {
        setError('请选择活动水平');
        return false;
      }
    } else if (step === 1) {
      if (!formData.primary_goal) {
        setError('请选择主要健康目标');
        return false;
      }
      if ((formData.primary_goal === 'lose_weight' || formData.primary_goal === 'gain_muscle') && !formData.target_weight_kg) {
        setError('请设置目标体重');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setError(null);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        id: userId,
        username: userId.slice(0, 8),
        gender: formData.gender || null,
        birth_date: formData.birth_date || null,
        height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        activity_level: formData.activity_level || null,
        body_fat_percentage: formData.body_fat_percentage ? parseFloat(formData.body_fat_percentage) : null,
        primary_goal: formData.primary_goal || null,
        target_weight_kg: formData.target_weight_kg ? parseFloat(formData.target_weight_kg) : null,
        weekly_goal_rate: formData.weekly_goal_rate || null,
        ai_profile_completed: true,
      };

      console.log('准备保存数据:', payload);
      
      const response = await fetch('/api/profile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender: formData.gender,
          birth_date: formData.birth_date,
          height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
          weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
          activity_level: formData.activity_level,
          body_fat_percentage: formData.body_fat_percentage ? parseFloat(formData.body_fat_percentage) : null,
          primary_goal: formData.primary_goal,
          target_weight_kg: formData.target_weight_kg ? parseFloat(formData.target_weight_kg) : null,
          weekly_goal_rate: formData.weekly_goal_rate,
          sleep_hours: formData.sleep_hours ? parseFloat(formData.sleep_hours) : null,
          stress_level: formData.stress_level ? parseInt(formData.stress_level) : null,
          energy_level: formData.energy_level ? parseInt(formData.energy_level) : null,
          exercise_frequency: formData.exercise_frequency,
          caffeine_intake: formData.caffeine_intake,
          alcohol_intake: formData.alcohol_intake,
          smoking_status: formData.smoking_status,
        }),
      });

      const result = await response.json();
      console.log('API 返回:', result);

      if (!response.ok || result.error) {
        throw new Error(result.error || '保存失败');
      }

      setSuccess('设置已保存，正在返回主页...');
      setTimeout(() => {
        router.push('/landing');
        router.refresh();
      }, 1000);
    } catch (err) {
      console.error('保存失败:', err);
      setError(err instanceof Error ? err.message : '保存失败，请重试');
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {currentStep === 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-[#0B3D2E] mb-4">模块一：核心基础指标</h2>
            <p className="text-sm text-[#0B3D2E]/70 mb-6">这些数据用于计算基础代谢率和个性化健康建议</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
              性别 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'male', label: '男' },
                { value: 'female', label: '女' },
                { value: 'prefer_not', label: '暂不透露' },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('gender', option.value)}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    formData.gender === option.value
                      ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]'
                      : 'bg-white text-[#0B3D2E] border-[#E7E1D6] hover:border-[#0B3D2E]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
              出生日期 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.birth_date}
              onChange={(e) => handleChange('birth_date', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[#E7E1D6] focus:border-[#0B3D2E] focus:ring-1 focus:ring-[#0B3D2E] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
                身高 (厘米) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.height_cm}
                onChange={(e) => handleChange('height_cm', e.target.value)}
                placeholder="170"
                className="w-full px-4 py-2 rounded-lg border border-[#E7E1D6] focus:border-[#0B3D2E] focus:ring-1 focus:ring-[#0B3D2E] outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
                当前体重 (公斤) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.weight_kg}
                onChange={(e) => handleChange('weight_kg', e.target.value)}
                placeholder="65"
                className="w-full px-4 py-2 rounded-lg border border-[#E7E1D6] focus:border-[#0B3D2E] focus:ring-1 focus:ring-[#0B3D2E] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
              日常活动量 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {[
                { value: 'sedentary', label: '久坐型', desc: '大部分时间坐着（如：办公室职员、程序员）' },
                { value: 'light', label: '轻度活跃', desc: '少量站立和行走（如：教师、客服）' },
                { value: 'moderate', label: '中度活跃', desc: '需经常站立和行走（如：服务员、快递员）' },
                { value: 'active', label: '高度活跃', desc: '大量体力劳动（如：建筑工人、健身教练）' },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('activity_level', option.value)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                    formData.activity_level === option.value
                      ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]'
                      : 'bg-white text-[#0B3D2E] border-[#E7E1D6] hover:border-[#0B3D2E]'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className={`text-xs mt-1 ${formData.activity_level === option.value ? 'text-white/80' : 'text-[#0B3D2E]/60'}`}>
                    {option.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
              体脂率 (%) <span className="text-[#0B3D2E]/60 text-xs ml-1">可选</span>
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.body_fat_percentage}
              onChange={(e) => handleChange('body_fat_percentage', e.target.value)}
              placeholder="如您有智能体脂秤，可在此输入"
              className="w-full px-4 py-2 rounded-lg border border-[#E7E1D6] focus:border-[#0B3D2E] focus:ring-1 focus:ring-[#0B3D2E] outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="w-full bg-[#0B3D2E] text-white py-3 rounded-lg hover:bg-[#0a3629] transition-colors font-medium"
          >
            下一步：目标设定
          </button>
        </div>
      )}

      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-[#0B3D2E] mb-4">模块二：目标设定</h2>
            <p className="text-sm text-[#0B3D2E]/70 mb-6">设定您的健康目标，AI将为您制定个性化计划</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
              主要健康目标 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {[
                { value: 'lose_weight', label: '减轻体重', needWeight: true },
                { value: 'maintain_energy', label: '保持健康 / 改善精力', needWeight: false },
                { value: 'gain_muscle', label: '增加肌肉', needWeight: true },
                { value: 'improve_metric', label: '改善特定指标（如：睡眠、压力）', needWeight: false },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('primary_goal', option.value)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                    formData.primary_goal === option.value
                      ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]'
                      : 'bg-white text-[#0B3D2E] border-[#E7E1D6] hover:border-[#0B3D2E]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {(formData.primary_goal === 'lose_weight' || formData.primary_goal === 'gain_muscle') && (
            <>
              <div>
                <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
                  目标体重 (公斤) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.target_weight_kg}
                  onChange={(e) => handleChange('target_weight_kg', e.target.value)}
                  placeholder="60"
                  className="w-full px-4 py-2 rounded-lg border border-[#E7E1D6] focus:border-[#0B3D2E] focus:ring-1 focus:ring-[#0B3D2E] outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
                  每周目标速率 <span className="text-[#0B3D2E]/60 text-xs ml-1">可选</span>
                </label>
                <div className="space-y-2">
                  {(formData.primary_goal === 'lose_weight' 
                    ? [
                        { value: 'slow', label: '轻松（约 0.25 kg/周）' },
                        { value: 'moderate', label: '推荐（约 0.5 kg/周）' },
                        { value: 'fast', label: '进取（约 1 kg/周）' },
                      ]
                    : [
                        { value: 'slow', label: '缓慢（约 0.1 kg/周）' },
                        { value: 'moderate', label: '推荐（约 0.2 kg/周）' },
                      ]
                  ).map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleChange('weekly_goal_rate', option.value)}
                      className={`w-full text-left px-4 py-2 rounded-lg border transition-all ${
                        formData.weekly_goal_rate === option.value
                          ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]'
                          : 'bg-white text-[#0B3D2E] border-[#E7E1D6] hover:border-[#0B3D2E]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 bg-white text-[#0B3D2E] border border-[#E7E1D6] py-3 rounded-lg hover:bg-[#FAF6EF] transition-colors font-medium"
            >
              上一步
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 bg-[#0B3D2E] text-white py-3 rounded-lg hover:bg-[#0a3629] transition-colors font-medium"
            >
              下一步：生活习惯
            </button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-[#0B3D2E] mb-4">模块三：生活习惯</h2>
            <p className="text-sm text-[#0B3D2E]/70 mb-6">这些数据将帮助AI更准确地分析您的健康状况</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
                每日睡眠时长 (小时)
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.sleep_hours}
                onChange={(e) => handleChange('sleep_hours', e.target.value)}
                placeholder="7"
                className="w-full px-4 py-2 rounded-lg border border-[#E7E1D6] focus:border-[#0B3D2E] focus:ring-1 focus:ring-[#0B3D2E] outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
                压力水平 (1-10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.stress_level}
                onChange={(e) => handleChange('stress_level', e.target.value)}
                placeholder="5"
                className="w-full px-4 py-2 rounded-lg border border-[#E7E1D6] focus:border-[#0B3D2E] focus:ring-1 focus:ring-[#0B3D2E] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
              精力水平 (1-10)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.energy_level}
              onChange={(e) => handleChange('energy_level', e.target.value)}
              placeholder="5"
              className="w-full px-4 py-2 rounded-lg border border-[#E7E1D6] focus:border-[#0B3D2E] focus:ring-1 focus:ring-[#0B3D2E] outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
              运动频率
            </label>
            <div className="space-y-2">
              {[
                { value: 'rarely', label: '很少运动' },
                { value: '1-2_week', label: '每周1-2次' },
                { value: '2-3_week', label: '每周2-3次' },
                { value: '4-5_week', label: '每周4-5次' },
                { value: '6-7_week', label: '每周6-7次' },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('exercise_frequency', option.value)}
                  className={`w-full text-left px-4 py-2 rounded-lg border transition-all ${
                    formData.exercise_frequency === option.value
                      ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]'
                      : 'bg-white text-[#0B3D2E] border-[#E7E1D6] hover:border-[#0B3D2E]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
              咖啡因摄入
            </label>
            <div className="space-y-2">
              {[
                { value: 'none', label: '不饮用' },
                { value: '1_cup', label: '每天1杯' },
                { value: '2-3_cups', label: '每天2-3杯' },
                { value: '4+_cups', label: '每天4杯以上' },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('caffeine_intake', option.value)}
                  className={`w-full text-left px-4 py-2 rounded-lg border transition-all ${
                    formData.caffeine_intake === option.value
                      ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]'
                      : 'bg-white text-[#0B3D2E] border-[#E7E1D6] hover:border-[#0B3D2E]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
              酒精摄入
            </label>
            <div className="space-y-2">
              {[
                { value: 'none', label: '不饮酒' },
                { value: 'occasional', label: '偶尔（每月1-2次）' },
                { value: '1-2_week', label: '每周1-2次' },
                { value: '3+_week', label: '每周3次以上' },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('alcohol_intake', option.value)}
                  className={`w-full text-left px-4 py-2 rounded-lg border transition-all ${
                    formData.alcohol_intake === option.value
                      ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]'
                      : 'bg-white text-[#0B3D2E] border-[#E7E1D6] hover:border-[#0B3D2E]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
              吸烟状况
            </label>
            <div className="space-y-2">
              {[
                { value: 'non_smoker', label: '不吸烟' },
                { value: 'ex_smoker', label: '已戒烟' },
                { value: 'occasional', label: '偶尔吸烟' },
                { value: 'regular', label: '经常吸烟' },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('smoking_status', option.value)}
                  className={`w-full text-left px-4 py-2 rounded-lg border transition-all ${
                    formData.smoking_status === option.value
                      ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]'
                      : 'bg-white text-[#0B3D2E] border-[#E7E1D6] hover:border-[#0B3D2E]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 bg-white text-[#0B3D2E] border border-[#E7E1D6] py-3 rounded-lg hover:bg-[#FAF6EF] transition-colors font-medium"
            >
              上一步
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-[#0B3D2E] text-white py-3 rounded-lg hover:bg-[#0a3629] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? '保存中...' : '完成并保存'}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
