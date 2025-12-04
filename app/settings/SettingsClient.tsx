'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { User, Activity, Brain, CreditCard, Save, Loader2, Upload, Camera, Link2, Share2, Settings, Zap, Sparkles } from 'lucide-react';
import { updateSettings } from '../actions/settings';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsClientProps {
  user: { id: string; email?: string };
  profile: Profile;
}

type Profile = {
  height?: number | string;
  weight?: number | string;
  age?: number | string;
  gender?: string;
  primary_goal?: string;
  ai_personality?: string;
  current_focus?: string;
  full_name?: string;
  avatar_url?: string;
  ai_persona_context?: string | null;
  ai_settings?: {
    honesty_level?: number;
    humor_level?: number;
  };
};

type FormState = {
  height: string | number;
  weight: string | number;
  age: string | number;
  gender: string;
  primary_goal: string;
  ai_personality: string;
  current_focus: string;
  max_honesty: number;
  max_humor: number;
  full_name: string;
  avatar_url: string;
};

export default function SettingsClient({ user, profile }: SettingsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'body' | 'ai' | 'account'>('body');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Handle URL tab parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'body' || tab === 'ai' || tab === 'account') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // 从 ai_persona_context 解析诚实度和幽默感设置
  const parseSettingsFromContext = (context: string | null): { honesty: number; humor: number } => {
    if (!context) return { honesty: 90, humor: 65 };
    
    const honestyMatch = context.match(/诚实度:\s*(\d+)%/);
    const humorMatch = context.match(/幽默感:\s*(\d+)%/);
    
    return {
      honesty: honestyMatch ? parseInt(honestyMatch[1], 10) : 90,
      humor: humorMatch ? parseInt(humorMatch[1], 10) : 65,
    };
  };

  // 从 ai_settings JSON 或 ai_persona_context 获取设置
  const getInitialSettings = () => {
    // 调试日志
    
    // 优先使用 ai_settings JSON 字段
    if (profile?.ai_settings && typeof profile.ai_settings.honesty_level === 'number') {
      return {
        honesty: profile.ai_settings.honesty_level,
        humor: profile.ai_settings.humor_level,
      };
    }
    // 否则从 ai_persona_context 解析
    const parsed = parseSettingsFromContext(profile?.ai_persona_context);
    return parsed;
  };

  const initialSettings = getInitialSettings();

  // Form state
  const [formData, setFormData] = useState<FormState>({
    // Body Metrics
    height: profile?.height || '',
    weight: profile?.weight || '',
    age: profile?.age || '',
    gender: profile?.gender || 'male',
    
    // AI Tuning - CRITICAL
    primary_goal: profile?.primary_goal || 'maintain_energy',
    ai_personality: profile?.ai_personality || 'max',
    current_focus: profile?.current_focus || '',
    
    // MAX Settings - 从 ai_settings 或 ai_persona_context 读取
    max_honesty: initialSettings.honesty,
    max_humor: initialSettings.humor,
    
    // Account
    full_name: profile?.full_name || '',
    avatar_url: profile?.avatar_url || '',
  });

  const handleChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: '请选择图片文件' });
      return;
    }

    // 验证文件大小 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: '图片大小不能超过2MB' });
      return;
    }

    setIsUploadingAvatar(true);
    setMessage(null);

    try {
      // TODO: 实现文件上传到云存储 (Supabase Storage)
      // 这里暂时用 base64 来模拟
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        handleChange('avatar_url', base64);
        setMessage({ type: 'success', text: '头像上传成功！请记得保存设置。' });
        setIsUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Avatar upload error:', error);
      setMessage({ type: 'error', text: '头像上传失败，请重试' });
      setIsUploadingAvatar(false);
    }
  };

  const handleSocialConnect = (platform: string) => {
    // TODO: 实现社交平台OAuth连接
    setMessage({ type: 'success', text: `正在连接到 ${platform}...` });
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* Header */}
      <div className="border-b border-[#E7E1D6] bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#0B3D2E]">设置中心</h1>
            <p className="mt-1 text-sm text-[#0B3D2E]/60">
              配置您的健康档案和 AI 助手行为
            </p>
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
            
            {/* Save Button for Body Tab */}
            <div className="flex justify-center">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0B3D2E] px-8 py-3 text-sm font-semibold text-white hover:bg-[#0a3629] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

              {/* MAX Settings Panel - 白色 UI 风格，幽默感自动决定人格 */}
              <MaxSettingsPanelWhite 
                honestyLevel={formData.max_honesty || 90}
                humorLevel={formData.max_humor || 65}
                onHonestyChange={(v) => handleChange('max_honesty', v)}
                onHumorChange={(v) => {
                  handleChange('max_humor', v);
                  // 根据幽默感自动设置人格模式
                  if (v < 33) {
                    handleChange('ai_personality', 'dr_house');
                  } else if (v < 66) {
                    handleChange('ai_personality', 'zen_master');
                  } else {
                    handleChange('ai_personality', 'max');
                  }
                }}
              />

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
            
            {/* Save Button for AI Tab */}
            <div className="flex justify-center">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0B3D2E] px-8 py-3 text-sm font-semibold text-white hover:bg-[#0a3629] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          </div>
        )}

        {/* Tab 3: Account */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#0B3D2E] mb-6">账号信息</h2>

              <div className="space-y-6">
                {/* Avatar Upload */}
                <div>
                  <label className="block text-sm font-medium text-[#0B3D2E] mb-3">
                    头像设置
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-[#F2F7F5] border-2 border-[#E7E1D6] flex items-center justify-center">
                        {formData.avatar_url ? (
                          <img
                            src={formData.avatar_url}
                            alt="头像"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-[#0B3D2E]/40" />
                        )}
                      </div>
                      {isUploadingAvatar && (
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-[#E7E1D6] rounded-lg text-sm font-medium text-[#0B3D2E] hover:bg-[#FAF6EF] transition-colors disabled:opacity-50"
                      >
                        <Camera className="w-4 h-4" />
                        {isUploadingAvatar ? '上传中...' : '更换头像'}
                      </button>
                      <p className="mt-1 text-xs text-[#0B3D2E]/50">
                        支持 JPG、PNG 格式，文件大小不超过 2MB
                      </p>
                    </div>
                  </div>
                </div>

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
              <button 
                onClick={() => router.push('/onboarding/upgrade?from=settings')}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-semibold text-white hover:shadow-lg transition-all"
              >
                <CreditCard className="w-4 h-4" />
                升级到 Pro
              </button>
            </div>

            {/* Social Platform Binding */}
            <div className="rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#0B3D2E]">社交平台绑定</h2>
                <div className="flex items-center gap-2 text-sm text-[#0B3D2E]/60">
                  <Share2 className="w-4 h-4" />
                  <span>跨平台分享</span>
                </div>
              </div>
              <p className="text-sm text-[#0B3D2E]/70 mb-6">
                连接您的社交平台账号，便于快速登录和分享健康成果
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { name: 'X (Twitter)', icon: '𝕏', color: 'bg-black', connected: false },
                  { name: 'Google', icon: 'G', color: 'bg-red-500', connected: false },
                  { name: 'GitHub', icon: '', color: 'bg-gray-800', connected: false },
                  { name: '微信', icon: '微', color: 'bg-green-500', connected: false },
                  { name: '抖音', icon: '抖', color: 'bg-red-600', connected: false },
                  { name: 'Reddit', icon: 'r/', color: 'bg-orange-500', connected: false },
                ].map((platform) => (
                  <button
                    key={platform.name}
                    onClick={() => handleSocialConnect(platform.name)}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      platform.connected
                        ? 'border-green-200 bg-green-50'
                        : 'border-[#E7E1D6] bg-white hover:border-[#0B3D2E]/30 hover:bg-[#FAF6EF]'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full ${platform.color} flex items-center justify-center text-white font-bold text-lg`}>
                      {platform.icon || platform.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-[#0B3D2E]">{platform.name}</span>
                    {platform.connected ? (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full"></span>
                    ) : (
                      <Link2 className="w-3 h-3 text-[#0B3D2E]/40" />
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-[#F8F9FA] rounded-xl border border-[#E7E1D6]">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs">ℹ</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-[#0B3D2E] mb-1">数据安全保障</h4>
                    <p className="text-xs text-[#0B3D2E]/60 leading-relaxed">
                      我们仅获取必要的公开信息用于账户验证，不会存储或分享您的敏感数据。您可以随时解绑任何平台。
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Save Button for Account Tab */}
            <div className="flex justify-center">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0B3D2E] px-8 py-3 text-sm font-semibold text-white hover:bg-[#0a3629] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          </div>
        )}
      </div>
    </div>
  );
}

// MAX Settings Panel - 白色 UI 风格，带实时反馈
interface MaxSettingsPanelWhiteProps {
  honestyLevel: number;
  humorLevel: number;
  onHonestyChange: (value: number) => void;
  onHumorChange: (value: number) => void;
}

function MaxSettingsPanelWhite({
  honestyLevel,
  humorLevel,
  onHonestyChange,
  onHumorChange
}: MaxSettingsPanelWhiteProps) {
  const [maxFeedback, setMaxFeedback] = useState<string>('系统就绪，等待输入...');
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 获取 Max 实时反馈
  const fetchMaxFeedback = async (sliderType: 'honesty' | 'humor', value: number) => {
    setIsLoadingFeedback(true);
    try {
      const res = await fetch('/api/max/response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: 'slider_change',
          sliderType,
          value
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMaxFeedback(data.response?.text || data.message || getLocalFeedback(sliderType, value));
      } else {
        setMaxFeedback(getLocalFeedback(sliderType, value));
      }
    } catch {
      setMaxFeedback(getLocalFeedback(sliderType, value));
    }
    setIsLoadingFeedback(false);
  };

  // 本地反馈（API 失败时使用）
  const getLocalFeedback = (type: 'honesty' | 'humor', value: number): string => {
    if (type === 'honesty') {
      if (value >= 90) return '直言不讳模式激活。准备好接受真相了吗？';
      if (value >= 70) return '诚实度较高，我会直接告诉你需要知道的。';
      if (value >= 40) return '平衡模式，真相会被适当包装。';
      return '外交模式启动，我会非常温和地表达。';
    } else {
      if (value >= 100) return '🎉 彩蛋解锁！幽默感拉满，准备好笑到肚子疼！';
      if (value >= 80) return '机智模式全开，每句话都可能是个梗。';
      if (value >= 50) return '适度幽默，偶尔来点轻松的。';
      return '严肃专业模式，专注于事实和数据。';
    }
  };

  // 处理滑块变化（带防抖）
  const handleSliderChange = (type: 'honesty' | 'humor', value: number) => {
    if (type === 'honesty') {
      onHonestyChange(value);
    } else {
      onHumorChange(value);
    }
    
    // 防抖：500ms 后获取反馈
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = setTimeout(() => {
      fetchMaxFeedback(type, value);
    }, 500);
  };

  return (
    <div className="rounded-xl border border-[#E7E1D6] bg-[#FAFAFA] p-5 space-y-5">
      {/* 功能说明 */}
      <div className="bg-white rounded-lg p-4 border border-[#E7E1D6]">
        <h4 className="text-sm font-medium text-[#0B3D2E] mb-3 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          AI 参数调节
        </h4>
        <ul className="space-y-2 text-xs text-[#0B3D2E]/70">
          <li className="flex items-start gap-2">
            <span className="text-[#C4A77D]">•</span>
            <span><strong>诚实度滑块</strong>: 0-100，控制 AI 的直接程度</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#9CAF88]">•</span>
            <span><strong>幽默感滑块</strong>: 0-100，100 时触发特殊彩蛋</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#0B3D2E]">•</span>
            <span><strong>实时反馈</strong>: 滑块变化时 AI 会给出评论</span>
          </li>
        </ul>
      </div>

      {/* Max 实时反馈 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={maxFeedback}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-lg p-4 border border-[#E7E1D6]"
        >
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isLoadingFeedback ? 'bg-amber-100' : 'bg-[#F2F7F5]'
            }`}>
              {isLoadingFeedback ? (
                <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
              ) : (
                <Brain className="w-4 h-4 text-[#0B3D2E]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-[#0B3D2E]/40 mb-1 uppercase tracking-wide">AI 反馈</p>
              <p className="text-sm text-[#0B3D2E] leading-relaxed">{maxFeedback}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 诚实度滑块 */}
      <div className="bg-white rounded-lg p-4 border border-[#E7E1D6]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-[#0B3D2E]">诚实度 Honesty</p>
            <p className="text-xs text-[#0B3D2E]/50">控制 AI 的直接程度</p>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[#C4A77D]/10">
            <span className="text-lg font-mono text-[#C4A77D] font-semibold">{honestyLevel}</span>
            <span className="text-xs ml-0.5 text-[#C4A77D]/70">%</span>
          </div>
        </div>
        <div className="relative h-10 flex items-center">
          <div className="absolute inset-x-0 h-2 bg-[#E7E1D6] rounded-full overflow-hidden">
            <motion.div 
              className="h-full rounded-full bg-gradient-to-r from-[#C4A77D]/60 to-[#C4A77D]"
              initial={false}
              animate={{ width: `${honestyLevel}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={honestyLevel}
            onChange={(e) => handleSliderChange('honesty', Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <motion.div 
            className="absolute w-5 h-5 rounded-full bg-white border-2 border-[#C4A77D] shadow-md pointer-events-none"
            initial={false}
            animate={{ left: `calc(${honestyLevel}% - 10px)` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-[#0B3D2E]/40 mt-2">
          <span>外交 Diplomatic</span>
          <span>直接 Brutal</span>
        </div>
      </div>

      {/* 幽默感滑块 + 自动人格指示器 */}
      <div className="bg-white rounded-lg p-4 border border-[#E7E1D6]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-[#0B3D2E]">幽默感 Humor</p>
            <p className="text-xs text-[#0B3D2E]/50">滑动自动切换 Max 人格风格</p>
          </div>
          <div className={`px-3 py-1.5 rounded-lg ${humorLevel >= 100 ? 'bg-gradient-to-r from-pink-100 to-amber-100' : 'bg-[#9CAF88]/10'}`}>
            <span className={`text-lg font-mono font-semibold ${humorLevel >= 100 ? 'text-pink-600' : 'text-[#9CAF88]'}`}>{humorLevel}</span>
            <span className={`text-xs ml-0.5 ${humorLevel >= 100 ? 'text-pink-400' : 'text-[#9CAF88]/70'}`}>%</span>
            {humorLevel >= 100 && <span className="ml-1">🎉</span>}
          </div>
        </div>
        <div className="relative h-10 flex items-center">
          <div className="absolute inset-x-0 h-2 bg-[#E7E1D6] rounded-full overflow-hidden">
            <motion.div 
              className={`h-full rounded-full ${
                humorLevel >= 100 
                  ? 'bg-gradient-to-r from-pink-400 via-amber-400 to-pink-400' 
                  : humorLevel < 33
                    ? 'bg-gradient-to-r from-[#C4A77D]/60 to-[#C4A77D]'
                    : humorLevel < 66
                      ? 'bg-gradient-to-r from-[#9CAF88]/60 to-[#9CAF88]'
                      : 'bg-gradient-to-r from-[#E8DFD0]/60 to-[#E8DFD0]'
              }`}
              initial={false}
              animate={{ width: `${humorLevel}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={humorLevel}
            onChange={(e) => handleSliderChange('humor', Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <motion.div 
            className={`absolute w-5 h-5 rounded-full bg-white border-2 shadow-md pointer-events-none ${
              humorLevel >= 100 ? 'border-pink-500' : humorLevel < 33 ? 'border-[#C4A77D]' : humorLevel < 66 ? 'border-[#9CAF88]' : 'border-[#D4C4A8]'
            }`}
            initial={false}
            animate={{ left: `calc(${humorLevel}% - 10px)` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-[#0B3D2E]/40 mt-2">
          <span>严肃 Serious</span>
          <span>机智 Witty</span>
        </div>
        
        {/* 自动人格指示器 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={humorLevel < 33 ? 'dr_house' : humorLevel < 66 ? 'zen_master' : 'max'}
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className={`mt-4 flex items-center justify-center gap-3 py-3 px-4 rounded-xl border ${
              humorLevel < 33 
                ? 'bg-[#C4A77D]/10 border-[#C4A77D]/30' 
                : humorLevel < 66 
                  ? 'bg-[#9CAF88]/10 border-[#9CAF88]/30'
                  : 'bg-[#E8DFD0]/20 border-[#D4C4A8]/30'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              humorLevel < 33 
                ? 'bg-[#C4A77D]/20' 
                : humorLevel < 66 
                  ? 'bg-[#9CAF88]/20'
                  : 'bg-[#E8DFD0]/30'
            }`}>
              <span className="text-lg">
                {humorLevel < 33 ? '🏥' : humorLevel < 66 ? '🧘' : '⚡'}
              </span>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[#0B3D2E]">
                {humorLevel < 33 ? 'Dr. House' : humorLevel < 66 ? 'Zen Master' : 'MAX'}
              </p>
              <p className={`text-xs ${
                humorLevel < 33 
                  ? 'text-[#C4A77D]' 
                  : humorLevel < 66 
                    ? 'text-[#9CAF88]'
                    : 'text-[#B8A888]'
              }`}>
                {humorLevel < 33 ? '直接-诊断' : humorLevel < 66 ? '平静-哲学' : '简洁-幽默'}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <Sparkles className="w-3 h-3 text-[#0B3D2E]/30" />
        <span className="text-[10px] text-[#0B3D2E]/30 tracking-wider">
          POWERED BY BAYESIAN INFERENCE
        </span>
      </div>
    </div>
  );
}
