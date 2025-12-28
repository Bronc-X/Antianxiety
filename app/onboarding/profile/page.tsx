'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import { User, Activity, Calendar, Scale, Smile } from 'lucide-react';
import { tr, useI18n } from '@/lib/i18n';

/**
 * 个人资料设置页面（营销漏斗最后一步）
 * 收集用户的静态生理数据：身高、体重、年龄、性别
 * CRITICAL: 只有完成此步骤，用户才能进入主页
 */
export default function ProfileSetupPage() {
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const { language } = useI18n();

  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // 表单字段
  const [nickname, setNickname] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');

  // 检查用户是否已登录以及是否已完成设置
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error('用户未登录，重定向到登录页');
        router.push('/login');
        return;
      }

      setUserId(user.id);

      // 检查用户是否已完成个人资料设置
      const { data: profile } = await supabase
        .from('profiles')
        .select('height, weight, age')
        .eq('id', user.id)
        .single();

      // 如果用户已完成设置，直接跳转到主页
      if (profile && profile.height && profile.weight && profile.age) {
        console.log('用户已完成个人资料设置，跳转到主页');
        router.push('/landing');
        return;
      }
    };
    checkUser();
  }, [supabase, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // 验证必填字段
    if (!height || !weight || !age) {
      alert(tr(language, { zh: '请填写所有必填字段', en: 'Please fill in all required fields.' }));
      setIsLoading(false);
      return;
    }

    // 验证数值范围
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);
    const ageNum = parseInt(age, 10);

    if (heightNum < 100 || heightNum > 250) {
      alert(tr(language, { zh: '身高请输入 100-250 cm', en: 'Height must be between 100–250 cm.' }));
      setIsLoading(false);
      return;
    }

    if (weightNum < 30 || weightNum > 300) {
      alert(tr(language, { zh: '体重请输入 30-300 kg', en: 'Weight must be between 30–300 kg.' }));
      setIsLoading(false);
      return;
    }

    if (ageNum < 10 || ageNum > 120) {
      alert(tr(language, { zh: '年龄请输入 10-120 岁', en: 'Age must be between 10–120.' }));
      setIsLoading(false);
      return;
    }

    try {
      // 保存到 profiles 表
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: nickname.trim() || null,
          height: heightNum,
          weight: weightNum,
          age: ageNum,
          gender: gender,
          profile_completed_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('保存个人资料失败:', error);
        alert(tr(language, { zh: '保存失败，请重试', en: 'Save failed. Please try again.' }));
        setIsLoading(false);
        return;
      }

      // 保存成功，跳转到主页
      console.log('✅ 个人资料保存成功，用户完成 onboarding');
      router.push('/unlearn/app');
      router.refresh();
    } catch (error) {
      console.error('保存个人资料时出错:', error);
      alert(tr(language, { zh: '保存失败，请重试', en: 'Save failed. Please try again.' }));
      setIsLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center">
        <p className="text-[#0B3D2E]">{tr(language, { zh: '正在加载...', en: 'Loading...' })}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">

        {/* 头部 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B3D2E]/10 rounded-full mb-4">
            <Activity className="w-4 h-4 text-[#0B3D2E]" />
            <span className="text-sm font-medium text-[#0B3D2E]">
              {tr(language, { zh: '最后一步', en: 'Final Step' })}
            </span>
          </div>

          <h1 className="text-3xl font-serif font-medium text-[#0B3D2E] mb-3">
            {tr(language, { zh: '完善你的健康档案', en: 'Complete Your Health Profile' })}
          </h1>

          <p className="text-[#0B3D2E]/60">
            {tr(language, {
              zh: '这些基础数据将帮助 AI 计算你的 BMI、基础代谢率等关键指标',
              en: 'This helps AI compute key metrics like BMI and basal metabolic rate.',
            })}
          </p>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border border-[#E7E1D6] shadow-sm">

          {/* 昵称输入 */}
          <div className="mb-6">
            <label htmlFor="nickname" className="block text-sm font-medium text-[#0B3D2E] mb-3">
              <div className="flex items-center gap-2">
                <Smile className="w-4 h-4" />
                {tr(language, { zh: '我应该怎么称呼你', en: 'What should I call you?' })}
              </div>
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={tr(language, { zh: '例如：小明、Alex', en: 'e.g., Alex, 小明' })}
              maxLength={20}
              className="w-full px-4 py-3 border-2 border-[#E7E1D6] rounded-xl focus:outline-none focus:border-[#0B3D2E] transition-colors text-[#0B3D2E]"
            />
            <p className="mt-2 text-xs text-[#0B3D2E]/50">
              {tr(language, { zh: '这个名字会出现在首页问候语中', en: 'This name will appear in the homepage greeting' })}
            </p>
          </div>

          {/* 性别选择 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#0B3D2E] mb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {tr(language, { zh: '性别', en: 'Gender' })}
              </div>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'male', label: tr(language, { zh: '男', en: 'Male' }) },
                { value: 'female', label: tr(language, { zh: '女', en: 'Female' }) },
                { value: 'other', label: tr(language, { zh: '暂不透露', en: 'Prefer not to say' }) },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setGender(option.value as 'male' | 'female' | 'other')}
                  className={`py-3 rounded-xl border-2 font-medium transition-all ${gender === option.value
                    ? 'bg-[#0B3D2E] text-[#FAF6EF] border-[#0B3D2E]'
                    : 'bg-white text-[#0B3D2E] border-[#E7E1D6] hover:border-[#0B3D2E]/30'
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 年龄 */}
          <div className="mb-6">
            <label htmlFor="age" className="block text-sm font-medium text-[#0B3D2E] mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {tr(language, { zh: '年龄', en: 'Age' })} <span className="text-red-500">*</span>
              </div>
            </label>
            <div className="relative">
              <input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder={tr(language, { zh: '例如：30', en: 'e.g., 30' })}
                required
                min="10"
                max="120"
                className="w-full px-4 py-3 pr-16 border-2 border-[#E7E1D6] rounded-xl focus:outline-none focus:border-[#0B3D2E] transition-colors text-[#0B3D2E]"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0B3D2E]/50 text-sm">
                {tr(language, { zh: '岁', en: 'yrs' })}
              </span>
            </div>
          </div>

          {/* 身高 */}
          <div className="mb-6">
            <label htmlFor="height" className="block text-sm font-medium text-[#0B3D2E] mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                {tr(language, { zh: '身高', en: 'Height' })} <span className="text-red-500">*</span>
              </div>
            </label>
            <div className="relative">
              <input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder={tr(language, { zh: '例如：175', en: 'e.g., 175' })}
                required
                min="100"
                max="250"
                step="0.1"
                className="w-full px-4 py-3 pr-16 border-2 border-[#E7E1D6] rounded-xl focus:outline-none focus:border-[#0B3D2E] transition-colors text-[#0B3D2E]"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0B3D2E]/50 text-sm">
                cm
              </span>
            </div>
          </div>

          {/* 体重 */}
          <div className="mb-8">
            <label htmlFor="weight" className="block text-sm font-medium text-[#0B3D2E] mb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4" />
                {tr(language, { zh: '体重', en: 'Weight' })} <span className="text-red-500">*</span>
              </div>
            </label>
            <div className="relative">
              <input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder={tr(language, { zh: '例如：70', en: 'e.g., 70' })}
                required
                min="30"
                max="300"
                step="0.1"
                className="w-full px-4 py-3 pr-16 border-2 border-[#E7E1D6] rounded-xl focus:outline-none focus:border-[#0B3D2E] transition-colors text-[#0B3D2E]"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0B3D2E]/50 text-sm">
                kg
              </span>
            </div>
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-[#0B3D2E] text-[#FAF6EF] rounded-xl font-semibold hover:bg-[#0B3D2E]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? tr(language, { zh: '正在保存...', en: 'Saving...' })
              : tr(language, { zh: '完成设置，进入主页 →', en: 'Finish and continue →' })}
          </button>

          {/* 提示文字 */}
          <p className="mt-4 text-xs text-center text-[#0B3D2E]/50">
            {tr(language, {
              zh: '你的数据将安全存储，仅用于个性化健康分析',
              en: 'Your data is stored securely and used only for personalized health analysis.',
            })}
          </p>
        </form>

        {/* 进度指示器 */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-[#0B3D2E] rounded-full" />
          <div className="w-2 h-2 bg-[#0B3D2E] rounded-full" />
          <div className="w-2 h-2 bg-[#0B3D2E] rounded-full" />
          <div className="w-6 h-2 bg-[#0B3D2E] rounded-full" />
        </div>
        <p className="text-center mt-2 text-xs text-[#0B3D2E]/50">
          {tr(language, { zh: '步骤 4/4 - 几乎完成了！', en: 'Step 4/4 — almost done!' })}
        </p>
      </div>
    </div>
  );
}
