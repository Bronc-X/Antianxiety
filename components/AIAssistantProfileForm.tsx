'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import AnimatedSection from '@/components/AnimatedSection';

interface ProfileFormData {
  // 基本信息
  gender: string;
  age_range: string;
  height_cm: string;
  weight_kg: string;
  sleep_hours: string;
  stress_level: string;
  energy_level: string;
  
  // 运动相关
  exercise_types: string[];
  exercise_frequency: string;
  exercise_duration_minutes: string;
  has_fitness_app: boolean;
  fitness_app_name: string;
  can_sync_fitness_data: boolean;
  
  // 生活习惯
  hobbies: string[];
  work_schedule: string;
  meal_pattern: string;
  caffeine_intake: string;
  alcohol_intake: string;
  smoking_status: string;
  
  // 健康信息
  chronic_conditions: string[];
  primary_focus_topics: string[];
  medical_conditions: string[];
  medications: string[];

  // 每日提醒
  daily_checkin_time: string;
}

interface ProfileUpdatePayload {
  gender: string | null;
  age_range: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  sleep_hours: number | null;
  stress_level: number | null;
  energy_level: number | null;
  exercise_types: string[] | null;
  exercise_frequency: string | null;
  exercise_duration_minutes: number | null;
  has_fitness_app: boolean;
  fitness_app_name: string | null;
  can_sync_fitness_data: boolean;
  hobbies: string[] | null;
  work_schedule: string | null;
  meal_pattern: string | null;
  caffeine_intake: string | null;
  alcohol_intake: string | null;
  smoking_status: string | null;
  chronic_conditions: string[] | null;
  primary_focus_topics: string[] | null;
  medical_conditions: string[] | null;
  medications: string[] | null;
  daily_checkin_time: string | null;
  ai_profile_completed: boolean;
}

interface UserMetadata {
  username?: string;
  [key: string]: unknown;
}

/**
 * AI 助理资料收集表单
 * 通过选择题收集用户信息，用于判断生理情况（80%准确度）
 */
export default function AIAssistantProfileForm() {
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    gender: '',
    age_range: '',
    height_cm: '',
    weight_kg: '',
    sleep_hours: '',
    stress_level: '',
    energy_level: '',
    exercise_types: [],
    exercise_frequency: '',
    exercise_duration_minutes: '',
    has_fitness_app: false,
    fitness_app_name: '',
    can_sync_fitness_data: false,
    hobbies: [],
    work_schedule: '',
    meal_pattern: '',
    caffeine_intake: '',
    alcohol_intake: '',
    smoking_status: '',
    chronic_conditions: [],
    primary_focus_topics: [],
    medical_conditions: [],
    medications: [],
    daily_checkin_time: '',
  });

  const totalSteps = 5;

  const ageOptions = ['20岁以下', '20-24岁', '25-34岁', '35-44岁', '45-54岁', '55-64岁', '65岁以上'];

  const chronicConditionOptions = [
    '高血压',
    '糖尿病',
    '心血管疾病',
    '甲状腺疾病',
    '肥胖症',
    '慢性炎症',
    '睡眠障碍',
    '焦虑症',
    '抑郁症',
    '自体免疫疾病',
    '神经系统疾病',
    '消化系统疾病',
    '无'
  ];

  const focusTopicOptions = [
    '人际关系焦虑',
    '职场压力',
    '婚姻关系',
    '子女与亲子关系',
    '体重管理/减肥',
    '老化与长寿',
    '健身策略',
    '营养优化',
    '睡眠与昼夜节律',
    '压力水平与皮质醇',
    '多巴胺/奖励机制',
    '内啡肽/幸福感',
    '荷尔蒙与激素平衡',
    '药物依赖',
    '酒精与烟草',
    '焦虑发作与恐慌',
  ];

  // 处理多选
  const handleMultiSelect = (
    field:
      | 'exercise_types'
      | 'hobbies'
      | 'medical_conditions'
      | 'medications'
      | 'chronic_conditions'
      | 'primary_focus_topics',
    value: string
  ) => {
    setFormData(prev => {
      const current = prev[field];
      const newValue = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [field]: newValue };
    });
  };

  // 处理单选
  const handleChange = (field: keyof ProfileFormData, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 验证当前步骤
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.gender &&
          formData.age_range &&
          formData.height_cm &&
          formData.weight_kg &&
          formData.sleep_hours &&
          formData.stress_level &&
          formData.energy_level
        );
      case 2:
        return !!(formData.exercise_frequency && formData.exercise_duration_minutes);
      case 3:
        return !!(formData.work_schedule && formData.meal_pattern && formData.caffeine_intake && formData.alcohol_intake && formData.smoking_status);
      case 4:
        return formData.primary_focus_topics.length > 0 || formData.chronic_conditions.length > 0 || true; // 关注话题/疾病非必选
      case 5:
        return true; // 运动App和提醒时间可选
      default:
        return false;
    }
  };

  // 提交表单
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateStep(currentStep)) {
      setError('请完成当前步骤的所有必填项');
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
      setError(null);
      return;
    }

    // 最后一步，提交数据
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('请先登录');
        setIsLoading(false);
        return;
      }

      // 准备更新数据
      const updateData: ProfileUpdatePayload = {
        gender: formData.gender || null,
        age_range: formData.age_range || null,
        height_cm: formData.height_cm ? parseInt(formData.height_cm, 10) : null,
        weight_kg: formData.weight_kg ? Math.round(parseFloat(formData.weight_kg)) : null, // 数据库是 INTEGER，需要四舍五入
        sleep_hours: formData.sleep_hours ? parseFloat(formData.sleep_hours) : null,
        stress_level: formData.stress_level ? parseInt(formData.stress_level) : null,
        energy_level: formData.energy_level ? parseInt(formData.energy_level) : null,
        exercise_types: formData.exercise_types.length > 0 ? formData.exercise_types : null,
        exercise_frequency: formData.exercise_frequency || null,
        exercise_duration_minutes: formData.exercise_duration_minutes ? parseInt(formData.exercise_duration_minutes) : null,
        has_fitness_app: formData.has_fitness_app,
        fitness_app_name: formData.fitness_app_name || null,
        can_sync_fitness_data: formData.can_sync_fitness_data,
        hobbies: formData.hobbies.length > 0 ? formData.hobbies : null,
        work_schedule: formData.work_schedule || null,
        meal_pattern: formData.meal_pattern || null,
        caffeine_intake: formData.caffeine_intake || null,
        alcohol_intake: formData.alcohol_intake || null,
        smoking_status: formData.smoking_status || null,
        chronic_conditions: formData.chronic_conditions.length > 0 ? formData.chronic_conditions : null,
        primary_focus_topics: formData.primary_focus_topics.length > 0 ? formData.primary_focus_topics : null,
        medical_conditions: formData.medical_conditions.length > 0 ? formData.medical_conditions : null,
        medications: formData.medications.length > 0 ? formData.medications : null,
        daily_checkin_time: formData.daily_checkin_time ? `${formData.daily_checkin_time}:00` : null,
        ai_profile_completed: true,
      };

      // 使用 upsert 避免 RLS 策略问题
      const metadata = (user.user_metadata || {}) as UserMetadata;
      const fallbackUsername = metadata.username || user.email || user.id.slice(0, 8);
      
      const { error: upsertError, data: upserted } = await supabase
        .from('profiles')
        .upsert(
          { id: user.id, username: fallbackUsername, ...updateData },
          { 
            onConflict: 'id',
            ignoreDuplicates: false 
          }
        )
        .select();

      if (upsertError) {
        console.error('保存资料时出错:', {
          message: upsertError.message,
          details: upsertError.details,
          hint: upsertError.hint,
          code: upsertError.code,
          fullError: upsertError,
        });
        setError(`保存资料时出错: ${upsertError.message || '未知错误'}${upsertError.hint ? ` (提示: ${upsertError.hint})` : ''}`);
        setIsLoading(false);
        return;
      }

      if (!upserted || upserted.length === 0) {
        console.error('保存资料失败: 没有返回数据');
        setError('保存资料失败，请检查您的账户是否存在');
        setIsLoading(false);
        return;
      }

      // 触发 AI 分析（这里先保存数据，分析在服务端进行）
      router.push('/assistant?analyzing=true');
      router.refresh();
    } catch (err) {
      console.error('提交表单时出错:', err);
      setError('提交时发生错误，请稍后重试');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* 步骤指示器 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#0B3D2E]">步骤 {currentStep} / {totalSteps}</span>
          <span className="text-xs text-[#0B3D2E]/60">{Math.round((currentStep / totalSteps) * 100)}%</span>
        </div>
        <div className="w-full bg-[#E7E1D6] rounded-full h-2">
          <div
            className="bg-[#0B3D2E] h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* 步骤 1: 基本信息 */}
      {currentStep === 1 && (
        <AnimatedSection variant="fadeUp" className="space-y-6">
          <h3 className="text-xl font-semibold text-[#0B3D2E]">基本信息</h3>
          
          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">性别</label>
            <div className="grid grid-cols-2 gap-3">
              {['男', '女', '其他', '不愿透露'].map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleChange('gender', option)}
                  className={`px-4 py-2 rounded-md border text-sm transition-colors ${
                    formData.gender === option
                      ? 'border-[#0B3D2E] bg-[#0B3D2E]/10 text-[#0B3D2E]'
                      : 'border-[#E7E1D6] bg-white text-[#0B3D2E]/70 hover:border-[#0B3D2E]/50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">年龄段</label>
            <div className="grid grid-cols-2 gap-3">
              {ageOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleChange('age_range', option)}
                  className={`px-4 py-2 rounded-md border text-sm transition-colors ${
                    formData.age_range === option
                      ? 'border-[#0B3D2E] bg-[#0B3D2E]/10 text-[#0B3D2E]'
                      : 'border-[#E7E1D6] bg-white text-[#0B3D2E]/70 hover:border-[#0B3D2E]/50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0B3D2E] mb-2">身高 (cm)</label>
              <input
                type="number"
                value={formData.height_cm}
                onChange={(e) => handleChange('height_cm', e.target.value)}
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
                step="0.1"
                value={formData.weight_kg}
                onChange={(e) => handleChange('weight_kg', e.target.value)}
                className="w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20"
                placeholder="例如：70"
                min="30"
                max="200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">平均睡眠时长 (小时)</label>
            <select
              value={formData.sleep_hours}
              onChange={(e) => handleChange('sleep_hours', e.target.value)}
              className="w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20"
            >
              <option value="">请选择...</option>
              {[4, 5, 6, 7, 8, 9, 10, 11, 12].map(hours => (
                <option key={hours} value={hours}>{hours} 小时</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">压力水平 (1-10)</label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleChange('stress_level', level.toString())}
                  className={`px-3 py-2 rounded-md border text-sm transition-colors ${
                    formData.stress_level === level.toString()
                      ? 'border-[#0B3D2E] bg-[#0B3D2E]/10 text-[#0B3D2E]'
                      : 'border-[#E7E1D6] bg-white text-[#0B3D2E]/70 hover:border-[#0B3D2E]/50'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-[#0B3D2E]/60">1=非常轻松，10=极度紧张</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">精力水平 (1-10)</label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleChange('energy_level', level.toString())}
                  className={`px-3 py-2 rounded-md border text-sm transition-colors ${
                    formData.energy_level === level.toString()
                      ? 'border-[#0B3D2E] bg-[#0B3D2E]/10 text-[#0B3D2E]'
                      : 'border-[#E7E1D6] bg-white text-[#0B3D2E]/70 hover:border-[#0B3D2E]/50'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-[#0B3D2E]/60">1=非常疲惫，10=精力充沛</p>
          </div>
        </AnimatedSection>
      )}

      {/* 步骤 2: 运动习惯 */}
      {currentStep === 2 && (
        <AnimatedSection variant="fadeUp" className="space-y-6">
          <h3 className="text-xl font-semibold text-[#0B3D2E]">运动习惯</h3>
          
          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">您喜欢的运动类型（可多选）</label>
            <div className="grid grid-cols-2 gap-3">
              {['跑步', '游泳', '骑行', '力量训练', '瑜伽', '普拉提', '球类运动', '徒步', '舞蹈', '其他'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleMultiSelect('exercise_types', type)}
                  className={`px-4 py-2 rounded-md border text-sm transition-colors ${
                    formData.exercise_types.includes(type)
                      ? 'border-[#0B3D2E] bg-[#0B3D2E]/10 text-[#0B3D2E]'
                      : 'border-[#E7E1D6] bg-white text-[#0B3D2E]/70 hover:border-[#0B3D2E]/50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">运动频率</label>
            <div className="grid grid-cols-2 gap-3">
              {['几乎不运动', '每周1次', '每周2-3次', '每周4-5次', '每周6-7次', '每天多次'].map(freq => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => handleChange('exercise_frequency', freq)}
                  className={`px-4 py-2 rounded-md border text-sm transition-colors ${
                    formData.exercise_frequency === freq
                      ? 'border-[#0B3D2E] bg-[#0B3D2E]/10 text-[#0B3D2E]'
                      : 'border-[#E7E1D6] bg-white text-[#0B3D2E]/70 hover:border-[#0B3D2E]/50'
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">单次运动时长</label>
            <div className="grid grid-cols-2 gap-3">
              {['15分钟以下', '15-30分钟', '30-60分钟', '60-90分钟', '90分钟以上'].map(duration => (
                <button
                  key={duration}
                  type="button"
                  onClick={() => {
                    const minutes = duration === '15分钟以下' ? '15' : 
                                  duration === '15-30分钟' ? '30' :
                                  duration === '30-60分钟' ? '60' :
                                  duration === '60-90分钟' ? '90' : '120';
                    handleChange('exercise_duration_minutes', minutes);
                  }}
                  className={`px-4 py-2 rounded-md border text-sm transition-colors ${
                    formData.exercise_duration_minutes === (duration === '15分钟以下' ? '15' : 
                                  duration === '15-30分钟' ? '30' :
                                  duration === '30-60分钟' ? '60' :
                                  duration === '60-90分钟' ? '90' : '120')
                      ? 'border-[#0B3D2E] bg-[#0B3D2E]/10 text-[#0B3D2E]'
                      : 'border-[#E7E1D6] bg-white text-[#0B3D2E]/70 hover:border-[#0B3D2E]/50'
                  }`}
                >
                  {duration}
                </button>
              ))}
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* 步骤 3: 生活习惯 */}
      {currentStep === 3 && (
        <AnimatedSection variant="fadeUp" className="space-y-6">
          <h3 className="text-xl font-semibold text-[#0B3D2E]">生活习惯</h3>
          
          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">工作时间安排</label>
            <div className="grid grid-cols-2 gap-3">
              {['朝九晚五', '弹性工作', '轮班制', '自由职业', '学生', '退休', '其他'].map(schedule => (
                <button
                  key={schedule}
                  type="button"
                  onClick={() => handleChange('work_schedule', schedule)}
                  className={`px-4 py-2 rounded-md border text-sm transition-colors ${
                    formData.work_schedule === schedule
                      ? 'border-[#0B3D2E] bg-[#0B3D2E]/10 text-[#0B3D2E]'
                      : 'border-[#E7E1D6] bg-white text-[#0B3D2E]/70 hover:border-[#0B3D2E]/50'
                  }`}
                >
                  {schedule}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">饮食模式</label>
            <div className="grid grid-cols-2 gap-3">
              {['规律三餐', '不规律', '间歇性禁食', '素食', '生酮饮食', '其他'].map(pattern => (
                <button
                  key={pattern}
                  type="button"
                  onClick={() => handleChange('meal_pattern', pattern)}
                  className={`px-4 py-2 rounded-md border text-sm transition-colors ${
                    formData.meal_pattern === pattern
                      ? 'border-[#0B3D2E] bg-[#0B3D2E]/10 text-[#0B3D2E]'
                      : 'border-[#E7E1D6] bg-white text-[#0B3D2E]/70 hover:border-[#0B3D2E]/50'
                  }`}
                >
                  {pattern}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">咖啡因摄入</label>
            <div className="grid grid-cols-2 gap-3">
              {['不摄入', '每天1杯', '每天2-3杯', '每天4杯以上'].map(intake => (
                <button
                  key={intake}
                  type="button"
                  onClick={() => handleChange('caffeine_intake', intake)}
                  className={`px-4 py-2 rounded-md border text-sm transition-colors ${
                    formData.caffeine_intake === intake
                      ? 'border-[#0B3D2E] bg-[#0B3D2E]/10 text-[#0B3D2E]'
                      : 'border-[#E7E1D6] bg-white text-[#0B3D2E]/70 hover:border-[#0B3D2E]/50'
                  }`}
                >
                  {intake}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">酒精摄入</label>
            <div className="grid grid-cols-2 gap-3">
              {['不饮酒', '偶尔（每月几次）', '每周1-2次', '每周3次以上'].map(intake => (
                <button
                  key={intake}
                  type="button"
                  onClick={() => handleChange('alcohol_intake', intake)}
                  className={`px-4 py-2 rounded-md border text-sm transition-colors ${
                    formData.alcohol_intake === intake
                      ? 'border-[#0B3D2E] bg-[#0B3D2E]/10 text-[#0B3D2E]'
                      : 'border-[#E7E1D6] bg-white text-[#0B3D2E]/70 hover:border-[#0B3D2E]/50'
                  }`}
                >
                  {intake}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">吸烟状态</label>
            <div className="grid grid-cols-2 gap-3">
              {['不吸烟', '偶尔', '每天少量', '每天大量', '已戒烟'].map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleChange('smoking_status', status)}
                  className={`px-4 py-2 rounded-md border text-sm transition-colors ${
                    formData.smoking_status === status
                      ? 'border-[#0B3D2E] bg-[#0B3D2E]/10 text-[#0B3D2E]'
                      : 'border-[#E7E1D6] bg-white text-[#0B3D2E]/70 hover:border-[#0B3D2E]/50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* 步骤 4: 爱好和健康信息 */}
      {currentStep === 4 && (
        <AnimatedSection variant="fadeUp" className="space-y-6">
          <h3 className="text-xl font-semibold text-[#0B3D2E]">爱好与健康信息</h3>
          
          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">您的爱好（可多选）</label>
            <div className="grid grid-cols-2 gap-3">
              {['阅读', '音乐', '电影', '游戏', '旅行', '摄影', '烹饪', '手工', '园艺', '其他'].map(hobby => (
                <button
                  key={hobby}
                  type="button"
                  onClick={() => handleMultiSelect('hobbies', hobby)}
                  className={`px-4 py-2 rounded-md border text-sm transition-colors ${
                    formData.hobbies.includes(hobby)
                      ? 'border-[#0B3D2E] bg-[#0B3D2E]/10 text-[#0B3D2E]'
                      : 'border-[#E7E1D6] bg-white text-[#0B3D2E]/70 hover:border-[#0B3D2E]/50'
                  }`}
                >
                  {hobby}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">基础疾病 / 慢性状况（可多选）</label>
            <div className="grid grid-cols-2 gap-3">
              {chronicConditionOptions.map(condition => (
                <button
                  key={condition}
                  type="button"
                  onClick={() => {
                    if (condition === '无') {
                      handleChange('chronic_conditions', []);
                    } else {
                      handleMultiSelect('chronic_conditions', condition);
                    }
                  }}
                  className={`px-4 py-2 rounded-md border text-sm transition-colors ${
                    condition === '无' && formData.chronic_conditions.length === 0
                      ? 'border-[#0B3D2E] bg-[#0B3D2E]/10 text-[#0B3D2E]'
                      : formData.chronic_conditions.includes(condition)
                      ? 'border-[#0B3D2E] bg-[#0B3D2E]/10 text-[#0B3D2E]'
                      : 'border-[#E7E1D6] bg-white text-[#0B3D2E]/70 hover:border-[#0B3D2E]/50'
                  }`}
                >
                  {condition}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">您最关注的生理问题/焦虑话题（可多选）</label>
            <p className="text-xs text-[#0B3D2E]/60 mb-3">我们会基于这些主题为你匹配 Reddit / X 上的高赞科学讨论。</p>
            <div className="grid grid-cols-2 gap-3">
              {focusTopicOptions.map(topic => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => handleMultiSelect('primary_focus_topics', topic)}
                  className={`text-left px-4 py-2 rounded-md border text-sm transition-colors ${
                    formData.primary_focus_topics.includes(topic)
                      ? 'border-[#0B3D2E] bg-[#0B3D2E]/10 text-[#0B3D2E]'
                      : 'border-[#E7E1D6] bg-white text-[#0B3D2E]/70 hover:border-[#0B3D2E]/50'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">医疗状况（可多选，如无请跳过）</label>
            <div className="grid grid-cols-2 gap-3">
              {['高血压', '糖尿病', '心脏病', '甲状腺问题', '焦虑症', '抑郁症', '失眠', '慢性疼痛', '其他', '无'].map(condition => (
                <button
                  key={condition}
                  type="button"
                  onClick={() => {
                    if (condition === '无') {
                      handleChange('medical_conditions', []);
                    } else {
                      handleMultiSelect('medical_conditions', condition);
                    }
                  }}
                  className={`px-4 py-2 rounded-md border text-sm transition-colors ${
                    condition === '无' && formData.medical_conditions.length === 0
                      ? 'border-[#0B3D2E] bg-[#0B3D2E]/10 text-[#0B3D2E]'
                      : formData.medical_conditions.includes(condition)
                      ? 'border-[#0B3D2E] bg-[#0B3D2E]/10 text-[#0B3D2E]'
                      : 'border-[#E7E1D6] bg-white text-[#0B3D2E]/70 hover:border-[#0B3D2E]/50'
                  }`}
                >
                  {condition}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">正在服用的药物（可多选，如无请跳过）</label>
            <div className="grid grid-cols-2 gap-3">
              {['降压药', '降糖药', '抗焦虑药', '抗抑郁药', '安眠药', '止痛药', '其他', '无'].map(med => (
                <button
                  key={med}
                  type="button"
                  onClick={() => {
                    if (med === '无') {
                      handleChange('medications', []);
                    } else {
                      handleMultiSelect('medications', med);
                    }
                  }}
                  className={`px-4 py-2 rounded-md border text-sm transition-colors ${
                    med === '无' && formData.medications.length === 0
                      ? 'border-[#0B3D2E] bg-[#0B3D2E]/10 text-[#0B3D2E]'
                      : formData.medications.includes(med)
                      ? 'border-[#0B3D2E] bg-[#0B3D2E]/10 text-[#0B3D2E]'
                      : 'border-[#E7E1D6] bg-white text-[#0B3D2E]/70 hover:border-[#0B3D2E]/50'
                  }`}
                >
                  {med}
                </button>
              ))}
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* 步骤 5: 运动App */}
      {currentStep === 5 && (
        <AnimatedSection variant="fadeUp" className="space-y-6">
          <h3 className="text-xl font-semibold text-[#0B3D2E]">运动记录App</h3>
          
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.has_fitness_app}
                onChange={(e) => handleChange('has_fitness_app', e.target.checked)}
                className="rounded border-[#E7E1D6] text-[#0B3D2E] focus:ring-[#0B3D2E]/20"
              />
              <span className="text-sm font-medium text-[#0B3D2E]">我使用运动记录App</span>
            </label>
          </div>

          {formData.has_fitness_app && (
            <>
              <div>
                <label className="block text-sm font-medium text-[#0B3D2E] mb-2">App名称</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Apple Health', 'Google Fit', 'Keep', 'Nike Run Club', 'Strava', '其他'].map(app => (
                    <button
                      key={app}
                      type="button"
                      onClick={() => handleChange('fitness_app_name', app)}
                      className={`px-4 py-2 rounded-md border text-sm transition-colors ${
                        formData.fitness_app_name === app
                          ? 'border-[#0B3D2E] bg-[#0B3D2E]/10 text-[#0B3D2E]'
                          : 'border-[#E7E1D6] bg-white text-[#0B3D2E]/70 hover:border-[#0B3D2E]/50'
                      }`}
                    >
                      {app}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.can_sync_fitness_data}
                    onChange={(e) => handleChange('can_sync_fitness_data', e.target.checked)}
                    className="rounded border-[#E7E1D6] text-[#0B3D2E] focus:ring-[#0B3D2E]/20"
                  />
                  <span className="text-sm font-medium text-[#0B3D2E]">可以同步运动数据到本平台</span>
                </label>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">每日个人检查提醒时间</label>
            <p className="text-xs text-[#0B3D2E]/60 mb-2">我们会在你设定的时间提醒你记录睡眠、运动、心情和压力等指标。</p>
            <input
              type="time"
              value={formData.daily_checkin_time}
              onChange={(e) => handleChange('daily_checkin_time', e.target.value)}
              className="w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20"
            />
          </div>
        </AnimatedSection>
      )}

      {/* 按钮 */}
      <div className="flex justify-between pt-4">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={() => {
              setCurrentStep(prev => prev - 1);
              setError(null);
            }}
            className="px-4 py-2 rounded-md border border-[#E7E1D6] bg-white text-[#0B3D2E] text-sm font-medium hover:bg-[#FAF6EF] transition-colors"
          >
            上一步
          </button>
        )}
        <div className={currentStep === 1 ? 'ml-auto' : ''}>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 rounded-md bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] text-white text-sm font-medium shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? '保存中...' : currentStep < totalSteps ? '下一步' : '完成并开始分析'}
          </button>
        </div>
      </div>
    </form>
  );
}

