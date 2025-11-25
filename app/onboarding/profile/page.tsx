'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import { User, Activity, Calendar, Scale } from 'lucide-react';

/**
 * 个人资料设置页面（营销漏斗最后一步）
 * 收集用户的静态生理数据：身高、体重、年龄、性别
 * CRITICAL: 只有完成此步骤，用户才能进入主页
 */
export default function ProfileSetupPage() {
  const router = useRouter();
  const supabase = createClientSupabaseClient();

  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // 表单字段
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
      alert('请填写所有必填字段');
      setIsLoading(false);
      return;
    }

    // 验证数值范围
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);
    const ageNum = parseInt(age, 10);

    if (heightNum < 100 || heightNum > 250) {
      alert('身高请输入 100-250 cm');
      setIsLoading(false);
      return;
    }

    if (weightNum < 30 || weightNum > 300) {
      alert('体重请输入 30-300 kg');
      setIsLoading(false);
      return;
    }

    if (ageNum < 10 || ageNum > 120) {
      alert('年龄请输入 10-120 岁');
      setIsLoading(false);
      return;
    }

    try {
      // 保存到 profiles 表
      const { error } = await supabase
        .from('profiles')
        .update({
          height: heightNum,
          weight: weightNum,
          age: ageNum,
          gender: gender,
          profile_completed_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('保存个人资料失败:', error);
        alert('保存失败，请重试');
        setIsLoading(false);
        return;
      }

      // 保存成功，跳转到主页
      console.log('✅ 个人资料保存成功，用户完成 onboarding');
      router.push('/landing');
      router.refresh();
    } catch (error) {
      console.error('保存个人资料时出错:', error);
      alert('保存失败，请重试');
      setIsLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center">
        <p className="text-[#0B3D2E]">正在加载...</p>
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
            <span className="text-sm font-medium text-[#0B3D2E]">最后一步</span>
          </div>
          
          <h1 className="text-3xl font-serif font-medium text-[#0B3D2E] mb-3">
            完善你的健康档案
          </h1>
          
          <p className="text-[#0B3D2E]/60">
            这些基础数据将帮助 AI 计算你的 BMI、基础代谢率等关键指标
          </p>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border border-[#E7E1D6] shadow-sm">
          
          {/* 性别选择 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#0B3D2E] mb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                性别
              </div>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'male', label: '男' },
                { value: 'female', label: '女' },
                { value: 'other', label: '其他' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setGender(option.value as 'male' | 'female' | 'other')}
                  className={`py-3 rounded-xl border-2 font-medium transition-all ${
                    gender === option.value
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
                年龄 <span className="text-red-500">*</span>
              </div>
            </label>
            <div className="relative">
              <input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="例如：30"
                required
                min="10"
                max="120"
                className="w-full px-4 py-3 pr-16 border-2 border-[#E7E1D6] rounded-xl focus:outline-none focus:border-[#0B3D2E] transition-colors text-[#0B3D2E]"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0B3D2E]/50 text-sm">
                岁
              </span>
            </div>
            <p className="mt-2 text-xs text-[#0B3D2E]/50">范围：10-120 岁</p>
          </div>

          {/* 身高 */}
          <div className="mb-6">
            <label htmlFor="height" className="block text-sm font-medium text-[#0B3D2E] mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                身高 <span className="text-red-500">*</span>
              </div>
            </label>
            <div className="relative">
              <input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="例如：175"
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
            <p className="mt-2 text-xs text-[#0B3D2E]/50">范围：100-250 cm</p>
          </div>

          {/* 体重 */}
          <div className="mb-8">
            <label htmlFor="weight" className="block text-sm font-medium text-[#0B3D2E] mb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4" />
                体重 <span className="text-red-500">*</span>
              </div>
            </label>
            <div className="relative">
              <input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="例如：70"
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
            <p className="mt-2 text-xs text-[#0B3D2E]/50">范围：30-300 kg</p>
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-[#0B3D2E] text-[#FAF6EF] rounded-xl font-semibold hover:bg-[#0B3D2E]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '正在保存...' : '完成设置，进入主页 →'}
          </button>

          {/* 提示文字 */}
          <p className="mt-4 text-xs text-center text-[#0B3D2E]/50">
            你的数据将安全存储，仅用于个性化健康分析
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
          步骤 4/4 - 几乎完成了！
        </p>
      </div>
    </div>
  );
}
