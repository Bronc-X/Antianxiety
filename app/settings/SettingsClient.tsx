'use client';

import { useState } from 'react';
import { User, Activity, Brain, CreditCard, Save, Loader2 } from 'lucide-react';
import { updateSettings } from '../actions/settings';
import { useRouter } from 'next/navigation';

interface SettingsClientProps {
  user: { id: string; email?: string };
  profile: any;
}

export default function SettingsClient({ user, profile }: SettingsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'body' | 'ai' | 'account'>('body');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    // Body Metrics
    height: profile?.height || '',
    weight: profile?.weight || '',
    age: profile?.age || '',
    gender: profile?.gender || 'male',
    
    // AI Tuning - CRITICAL
    primary_goal: profile?.primary_goal || 'maintain_energy',
    ai_personality: profile?.ai_personality || 'gentle_friend',
    current_focus: profile?.current_focus || '',
    
    // Account
    full_name: profile?.full_name || '',
    avatar_url: profile?.avatar_url || '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const result = await updateSettings(user.id, formData);
      
      if (result.success) {
        setMessage({ type: 'success', text: '设置已保存！AI 已同步最新配置。' });
        router.refresh();
      } else {
        setMessage({ type: 'error', text: result.error || '保存失败' });
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: '保存失败，请重试' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* Header */}
      <div className="border-b border-[#E7E1D6] bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[#0B3D2E]">设置中心</h1>
              <p className="mt-1 text-sm text-[#0B3D2E]/60">
                配置您的健康档案和 AI 助手行为
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0B3D2E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0a3629] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  保存设置
                </>
              )}
            </button>
          </div>

          {/* Message Banner */}
          {message && (
            <div className={`mt-4 rounded-lg p-4 ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.text}
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[#E7E1D6] bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('body')}
              className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'body'
                  ? 'border-[#0B3D2E] text-[#0B3D2E]'
                  : 'border-transparent text-[#0B3D2E]/60 hover:text-[#0B3D2E]/80'
              }`}
            >
              <Activity className="w-4 h-4" />
              身体档案
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'ai'
                  ? 'border-[#0B3D2E] text-[#0B3D2E]'
                  : 'border-transparent text-[#0B3D2E]/60 hover:text-[#0B3D2E]/80'
              }`}
            >
              <Brain className="w-4 h-4" />
              AI 调优
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                关键
              </span>
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'account'
                  ? 'border-[#0B3D2E] text-[#0B3D2E]'
                  : 'border-transparent text-[#0B3D2E]/60 hover:text-[#0B3D2E]/80'
              }`}
            >
              <User className="w-4 h-4" />
              账号与会员
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Tab 1: Body Metrics */}
        {activeTab === 'body' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#0B3D2E] mb-4">基础指标</h2>
              <p className="text-sm text-[#0B3D2E]/60 mb-6">
                这些数据用于计算 BMI 和 BMR，影响分析报告中的健康评估
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
                    身高 (cm)
                  </label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => handleChange('height', e.target.value)}
                    className="w-full rounded-lg border border-[#E7E1D6] px-4 py-2.5 text-[#0B3D2E] focus:border-[#0B3D2E] focus:ring-1 focus:ring-[#0B3D2E] outline-none"
                    placeholder="170"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
                    体重 (kg)
                  </label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleChange('weight', e.target.value)}
                    className="w-full rounded-lg border border-[#E7E1D6] px-4 py-2.5 text-[#0B3D2E] focus:border-[#0B3D2E] focus:ring-1 focus:ring-[#0B3D2E] outline-none"
                    placeholder="65"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
                    年龄
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleChange('age', e.target.value)}
                    className="w-full rounded-lg border border-[#E7E1D6] px-4 py-2.5 text-[#0B3D2E] focus:border-[#0B3D2E] focus:ring-1 focus:ring-[#0B3D2E] outline-none"
                    placeholder="30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
                    性别
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'male', label: '男' },
                      { value: 'female', label: '女' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleChange('gender', option.value)}
                        className={`rounded-lg border-2 py-2.5 text-sm font-medium transition-all ${
                          formData.gender === option.value
                            ? 'border-[#0B3D2E] bg-[#0B3D2E] text-white'
                            : 'border-[#E7E1D6] bg-white text-[#0B3D2E] hover:border-[#0B3D2E]/50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* BMI Preview */}
              {formData.height && formData.weight && (
                <div className="mt-6 rounded-lg bg-[#F2F7F5] p-4 border border-[#E7E1D6]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#0B3D2E]/70">计算的 BMI:</span>
                    <span className="text-lg font-semibold text-[#0B3D2E]">
                      {((parseFloat(formData.weight) / Math.pow(parseFloat(formData.height) / 100, 2))).toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: AI Tuning - CRITICAL */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/50 p-6">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900">AI 上下文同步</h3>
                  <p className="mt-1 text-sm text-amber-800">
                    此页面的设置将直接注入到 AI 的系统提示中，影响聊天行为和分析报告逻辑
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#0B3D2E] mb-6">核心配置</h2>

              {/* Primary Goal */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#0B3D2E] mb-3">
                  主要目标 <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-[#0B3D2E]/60 mb-3">
                  影响报告中的策略优先级和雷达图高亮显示
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { value: 'lose_weight', label: '减脂塑形', icon: '🎯' },
                    { value: 'improve_sleep', label: '改善睡眠', icon: '😴' },
                    { value: 'boost_energy', label: '提升精力', icon: '⚡' },
                    { value: 'maintain_energy', label: '保持健康', icon: '🌿' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleChange('primary_goal', option.value)}
                      className={`flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all ${
                        formData.primary_goal === option.value
                          ? 'border-[#0B3D2E] bg-[#F2F7F5]'
                          : 'border-[#E7E1D6] bg-white hover:border-[#0B3D2E]/50'
                      }`}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <span className="font-medium text-[#0B3D2E]">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Personality */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#0B3D2E] mb-3">
                  AI 性格 <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-[#0B3D2E]/60 mb-3">
                  控制 AI 的对话风格和建议严格程度
                </p>
                <div className="space-y-3">
                  {[
                    { 
                      value: 'strict_coach', 
                      label: '严格教练', 
                      desc: '直言不讳，严格督促，适合需要强制约束的用户'
                    },
                    { 
                      value: 'gentle_friend', 
                      label: '温和朋友', 
                      desc: '鼓励为主，理解你的困难，适合压力较大的用户'
                    },
                    { 
                      value: 'science_nerd', 
                      label: '科学极客', 
                      desc: '数据驱动，详细解释机制，适合喜欢深度学习的用户'
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleChange('ai_personality', option.value)}
                      className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                        formData.ai_personality === option.value
                          ? 'border-[#0B3D2E] bg-[#F2F7F5]'
                          : 'border-[#E7E1D6] bg-white hover:border-[#0B3D2E]/50'
                      }`}
                    >
                      <div className="font-medium text-[#0B3D2E] mb-1">{option.label}</div>
                      <div className="text-sm text-[#0B3D2E]/60">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Focus */}
              <div>
                <label className="block text-sm font-medium text-[#0B3D2E] mb-3">
                  当前关注点
                </label>
                <p className="text-xs text-[#0B3D2E]/60 mb-3">
                  告诉 AI 您当前的特殊情况（如："膝盖疼痛，避免跑步"、"备孕期间"等）
                </p>
                <textarea
                  value={formData.current_focus}
                  onChange={(e) => handleChange('current_focus', e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-[#E7E1D6] px-4 py-3 text-[#0B3D2E] focus:border-[#0B3D2E] focus:ring-1 focus:ring-[#0B3D2E] outline-none resize-none"
                  placeholder="例如：最近膝盖有些疼，请避免推荐高冲击运动；我正在调整作息，希望重点关注睡眠质量..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Account */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#0B3D2E] mb-6">账号信息</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
                    邮箱地址
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full rounded-lg border border-[#E7E1D6] px-4 py-2.5 text-[#0B3D2E]/50 bg-[#FAF6EF] cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-[#0B3D2E]/50">邮箱地址不可更改</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
                    显示名称
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    className="w-full rounded-lg border border-[#E7E1D6] px-4 py-2.5 text-[#0B3D2E] focus:border-[#0B3D2E] focus:ring-1 focus:ring-[#0B3D2E] outline-none"
                    placeholder="您的名字"
                  />
                </div>
              </div>
            </div>

            {/* Subscription Status */}
            <div className="rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#0B3D2E]">会员状态</h2>
                <span className="rounded-full bg-[#F2F7F5] px-3 py-1 text-sm font-medium text-[#0B3D2E]">
                  免费版
                </span>
              </div>
              <p className="text-sm text-[#0B3D2E]/70 mb-4">
                升级到 Pro 解锁完整的 AI 分析报告和高级功能
              </p>
              <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-semibold text-white hover:shadow-lg transition-all">
                <CreditCard className="w-4 h-4" />
                升级到 Pro
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
