'use client';

import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { User, Activity, Brain, CreditCard, Save, Loader2, Upload, Camera, Link2, Share2, Settings, Zap, Sparkles, Target } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import PhaseGoalsDisplay from '@/components/PhaseGoalsDisplay';
import { useSettings } from '@/hooks/domain/useSettings';
import { useMaxApi } from '@/hooks/domain/useMaxApi';

// 懒加载 ImageComparisonSlider - 只在解锁页面需要时才加载
const ImageComparisonSlider = lazy(() => import('@/components/ImageComparisonSlider'));

interface SettingsClientProps {
  user: { id: string; email?: string };
  profile: any; // Relaxed type to allow flexible profile data
}

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
  const { t, language, setLanguage } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use Domain Hook
  // We construct initial data from props to avoid flash
  const initialSettings = {
    height: profile?.height,
    weight: profile?.weight,
    age: profile?.age,
    gender: profile?.gender,
    primary_goal: profile?.primary_goal,
    ai_personality: profile?.ai_personality,
    current_focus: profile?.current_focus,
    full_name: profile?.full_name,
    avatar_url: profile?.avatar_url,
    max_honesty: profile?.ai_settings?.honesty_level ?? 90,
    max_humor: profile?.ai_settings?.humor_level ?? 65,
  };

  const { update: updateSettingsHook, isSaving: isHookSaving, error: hookError } = useSettings({
    userId: user.id,
    initialData: initialSettings
  });
  const { getResponse } = useMaxApi();

  // 滑动解锁状态 - 必须在所有其他 hooks 之前
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [sliderProgress, setSliderProgress] = useState(0);
  const [imageId] = useState(() => Math.floor(Math.random() * 1000) + 1);

  const [activeTab, setActiveTab] = useState<'body' | 'ai' | 'account'>('body');
  const [isSaving, setIsSaving] = useState(false); // Local loading state for UX feedback (success message timing)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState<FormState>({
    height: profile?.height || '',
    weight: profile?.weight || '',
    age: profile?.age || '',
    gender: profile?.gender || 'male',
    primary_goal: profile?.primary_goal || 'maintain_energy',
    ai_personality: profile?.ai_personality || 'max',
    current_focus: profile?.current_focus || '',
    max_honesty: initialSettings.max_honesty,
    max_humor: initialSettings.max_humor,
    full_name: profile?.full_name || '',
    avatar_url: profile?.avatar_url || '',
  });

  // Handle URL tab parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'body' || tab === 'ai' || tab === 'account') {
      setActiveTab(tab);
    }
    if (tab) {
      setIsUnlocked(true);
    }
  }, [searchParams]);

  const handleSliderComplete = () => {
    setIsUnlocked(true);
    sessionStorage.setItem('settings_unlocked', 'true');
  };

  const handleChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  // 滑动解锁页面
  if (!isUnlocked) {
    const imgBw = `https://picsum.photos/seed/${imageId}/800/450?grayscale`;
    const imgColor = `https://picsum.photos/seed/${imageId}/800/450`;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FAF6EF] dark:bg-neutral-950 relative overflow-hidden transition-colors">
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="settings-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1.5" className="fill-[#0B3D2E] dark:fill-white" opacity={0.1 + sliderProgress * 0.3} />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#settings-dots)" />
          </svg>
        </div>

        <div className="z-10 w-full max-w-2xl flex flex-col items-center space-y-8">
          <div className="text-center space-y-2">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-bold text-[#0B3D2E] dark:text-white"
            >
              {t('settings.personalTitle')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm md:text-base text-[#C4A77D] dark:text-neutral-400"
            >
              {t('settings.unlockHint')}
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full"
          >
            <Suspense fallback={
              <div className="w-full h-64 bg-white/50 rounded-xl flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-[#9CAF88] animate-spin" />
              </div>
            }>
              <ImageComparisonSlider
                beforeImage={imgBw}
                afterImage={imgColor}
                onComplete={handleSliderComplete}
                onProgressChange={setSliderProgress}
              />
            </Suspense>
          </motion.div>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      // Use hook update
      const success = await updateSettingsHook({
        ...formData, // Spread all form data
        height: Number(formData.height),
        weight: Number(formData.weight),
        age: Number(formData.age),
      });

      if (success) {
        setMessage({ type: 'success', text: t('settings.saveSuccess') });
        router.refresh();
      } else {
        setMessage({ type: 'error', text: hookError || t('settings.saveFail') });
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: t('settings.saveFail') });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: t('settings.selectImage') });
      return;
    }

    // 验证文件大小 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: t('settings.imageTooLarge') });
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
        setMessage({ type: 'success', text: t('settings.avatarUploadSuccess') });
        setIsUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Avatar upload error:', error);
      setMessage({ type: 'error', text: t('settings.avatarUploadFail') });
      setIsUploadingAvatar(false);
    }
  };

  const handleSocialConnect = (platform: string) => {
    // TODO: 实现社交平台OAuth连接
    setMessage({ type: 'success', text: `${t('settings.connectingTo')} ${platform}...` });
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF] dark:bg-neutral-950 transition-colors">
      {/* Header */}
      <div className="border-b border-[#E7E1D6] dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#0B3D2E] dark:text-white">{t('settings.center')}</h1>
            <p className="mt-1 text-sm text-[#0B3D2E]/60 dark:text-neutral-400">
              {t('settings.configDesc')}
            </p>
          </div>

          {/* Message Banner */}
          {message && (
            <div className={`mt-4 rounded-lg p-4 ${message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
              }`}>
              {message.text}
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[#E7E1D6] dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('body')}
              className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${activeTab === 'body'
                ? 'border-[#0B3D2E] dark:border-white text-[#0B3D2E] dark:text-white'
                : 'border-transparent text-[#0B3D2E]/60 dark:text-neutral-400 hover:text-[#0B3D2E]/80 dark:hover:text-white'
                }`}
            >
              <Activity className="w-4 h-4" />
              {t('settings.bodyProfile')}
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${activeTab === 'ai'
                ? 'border-[#0B3D2E] dark:border-white text-[#0B3D2E] dark:text-white'
                : 'border-transparent text-[#0B3D2E]/60 dark:text-neutral-400 hover:text-[#0B3D2E]/80 dark:hover:text-white'
                }`}
            >
              <Brain className="w-4 h-4" />
              {t('settings.aiTuning')}
              <span className="rounded-full bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                {t('settings.critical')}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${activeTab === 'account'
                ? 'border-[#0B3D2E] dark:border-white text-[#0B3D2E] dark:text-white'
                : 'border-transparent text-[#0B3D2E]/60 dark:text-neutral-400 hover:text-[#0B3D2E]/80 dark:hover:text-white'
                }`}
            >
              <User className="w-4 h-4" />
              {t('settings.accountMembership')}
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
              <h2 className="text-lg font-semibold text-[#0B3D2E] mb-4">{t('settings.basicMetrics')}</h2>
              <p className="text-sm text-[#0B3D2E]/60 mb-6">
                {t('settings.metricsDesc')}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
                    {t('settings.heightCm')}
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
                    {t('settings.weightKg')}
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
                    {t('settings.age')}
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
                    {t('settings.gender')}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'male', label: t('settings.male') },
                      { value: 'female', label: t('settings.female') },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleChange('gender', option.value)}
                        className={`rounded-lg border-2 py-2.5 text-sm font-medium transition-all ${formData.gender === option.value
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
                    <span className="text-sm text-[#0B3D2E]/70">{t('settings.calculatedBmi')}</span>
                    <span className="text-lg font-semibold text-[#0B3D2E]">
                      {((parseFloat(String(formData.weight)) / Math.pow(parseFloat(String(formData.height)) / 100, 2))).toFixed(1)}
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
                    {t('settings.saving')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {t('settings.saveSettings')}
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
                  <h3 className="font-semibold text-amber-900">{t('settings.aiContextSyncTitle')}</h3>
                  <p className="mt-1 text-sm text-amber-800">
                    {t('settings.aiContextSyncDesc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#0B3D2E] mb-6">{t('settings.coreConfigTitle')}</h2>

              {/* Phase Goals Display - AI Recommended (Requirement 2.5) */}
              <div className="mb-6">
                <PhaseGoalsDisplay userId={user.id} />
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
                t={t}
                language={language}
              />

              {/* Current Focus */}
              <div>
                <label className="block text-sm font-medium text-[#0B3D2E] mb-3">
                  {t('settings.currentFocusLabel')}
                </label>
                <p className="text-xs text-[#0B3D2E]/60 mb-3">
                  {t('settings.currentFocusHint')}
                </p>
                <textarea
                  value={formData.current_focus}
                  onChange={(e) => handleChange('current_focus', e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-[#E7E1D6] px-4 py-3 text-[#0B3D2E] focus:border-[#0B3D2E] focus:ring-1 focus:ring-[#0B3D2E] outline-none resize-none"
                  placeholder={t('settings.currentFocusPlaceholder')}
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
                    {t('settings.savingBtn')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {t('settings.saveBtn')}
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
              <h2 className="text-lg font-semibold text-[#0B3D2E] mb-6">{t('settings.accountInfoTitle')}</h2>

              <div className="space-y-6">
                {/* Avatar Upload */}
                <div>
                  <label className="block text-sm font-medium text-[#0B3D2E] mb-3">
                    {t('settings.avatarLabel')}
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-[#F2F7F5] border-2 border-[#E7E1D6] flex items-center justify-center">
                        {formData.avatar_url ? (
                          <img
                            src={formData.avatar_url}
                            alt={t('settings.avatarAlt')}
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
                        {isUploadingAvatar ? t('settings.uploadingAvatar') : t('settings.changeAvatarBtn')}
                      </button>
                      <p className="mt-1 text-xs text-[#0B3D2E]/50">
                        {t('settings.avatarFormatHint')}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
                    {t('settings.emailLabel')}
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full rounded-lg border border-[#E7E1D6] px-4 py-2.5 text-[#0B3D2E]/50 bg-[#FAF6EF] cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-[#0B3D2E]/50">{t('settings.emailCannotChange')}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
                    {t('settings.displayNameLabel')}
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    className="w-full rounded-lg border border-[#E7E1D6] px-4 py-2.5 text-[#0B3D2E] focus:border-[#0B3D2E] focus:ring-1 focus:ring-[#0B3D2E] outline-none"
                    placeholder={t('settings.displayNamePlaceholder')}
                  />
                </div>

                {/* Language Selection */}
                <div>
                  <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
                    {language === 'en' ? 'Language' : '语言'}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setLanguage('zh')}
                      className={`rounded-lg border-2 py-2.5 text-sm font-medium transition-all ${language === 'zh'
                        ? 'border-[#0B3D2E] bg-[#0B3D2E] text-white'
                        : 'border-[#E7E1D6] bg-white text-[#0B3D2E] hover:border-[#0B3D2E]/50'
                        }`}
                    >
                      🇨🇳 中文
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('en')}
                      className={`rounded-lg border-2 py-2.5 text-sm font-medium transition-all ${language === 'en'
                        ? 'border-[#0B3D2E] bg-[#0B3D2E] text-white'
                        : 'border-[#E7E1D6] bg-white text-[#0B3D2E] hover:border-[#0B3D2E]/50'
                        }`}
                    >
                      🇺🇸 English
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Status */}
            <div className="rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#0B3D2E]">{t('settings.memberStatusTitle')}</h2>
                <span className="rounded-full bg-[#F2F7F5] px-3 py-1 text-sm font-medium text-[#0B3D2E]">
                  {t('settings.freeVersionLabel')}
                </span>
              </div>
              <p className="text-sm text-[#0B3D2E]/70 mb-4">
                {t('settings.upgradeHint')}
              </p>
              <button
                onClick={() => router.push('/unlearn/onboarding/upgrade?from=settings')}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-semibold text-white hover:shadow-lg transition-all"
              >
                <CreditCard className="w-4 h-4" />
                {t('settings.upgradeToProBtn')}
              </button>
            </div>

            {/* Social Platform Binding */}
            <div className="rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#0B3D2E]">{t('settings.socialBindingTitle')}</h2>
                <div className="flex items-center gap-2 text-sm text-[#0B3D2E]/60">
                  <Share2 className="w-4 h-4" />
                  <span>{t('settings.crossPlatformShare')}</span>
                </div>
              </div>
              <p className="text-sm text-[#0B3D2E]/70 mb-6">
                {t('settings.socialBindingDesc')}
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
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${platform.connected
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
                    <h4 className="text-sm font-medium text-[#0B3D2E] mb-1">{t('settings.dataSecurityTitle')}</h4>
                    <p className="text-xs text-[#0B3D2E]/60 leading-relaxed">
                      {t('settings.dataSecurityInfo')}
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
                    {t('settings.savingBtn')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {t('settings.saveBtn')}
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
  t: (key: string) => string;
  language: string;
}

function MaxSettingsPanelWhite({
  honestyLevel,
  humorLevel,
  onHonestyChange,
  onHumorChange,
  t,
  language
}: MaxSettingsPanelWhiteProps) {
  const [maxFeedback, setMaxFeedback] = useState<string>(t('settings.systemReady'));
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 获取 Max 实时反馈
  const fetchMaxFeedback = async (sliderType: 'honesty' | 'humor', value: number) => {
    setIsLoadingFeedback(true);
    try {
      const data = await getResponse({
        context: 'slider_change',
        sliderType,
        value
      });
      if (data) {
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
    if (language === 'zh') {
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
    } else {
      if (type === 'honesty') {
        if (value >= 90) return 'Brutal honesty mode activated. Ready for the truth?';
        if (value >= 70) return 'High honesty level. I\'ll tell you what you need to know directly.';
        if (value >= 40) return 'Balanced mode. Truth will be appropriately packaged.';
        return 'Diplomatic mode on. I\'ll express things very gently.';
      } else {
        if (value >= 100) return '🎉 Easter egg unlocked! Max humor, prepare to laugh!';
        if (value >= 80) return 'Witty mode fully on. Every sentence might be a joke.';
        if (value >= 50) return 'Moderate humor. Occasional light moments.';
        return 'Serious professional mode. Focused on facts and data.';
      }
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
          {t('settings.aiParamTuning')}
        </h4>
        <ul className="space-y-2 text-xs text-[#0B3D2E]/70">
          <li className="flex items-start gap-2">
            <span className="text-[#C4A77D]">•</span>
            <span><strong>{t('settings.honestySlider')}</strong>: {t('settings.honestySliderDesc')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#9CAF88]">•</span>
            <span><strong>{t('settings.humorSlider')}</strong>: {t('settings.humorSliderDesc')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#0B3D2E]">•</span>
            <span><strong>{t('settings.realtimeFeedback')}</strong>: {t('settings.realtimeFeedbackDesc')}</span>
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
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isLoadingFeedback ? 'bg-amber-100' : 'bg-[#F2F7F5]'
              }`}>
              {isLoadingFeedback ? (
                <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
              ) : (
                <Brain className="w-4 h-4 text-[#0B3D2E]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-[#0B3D2E]/40 mb-1 uppercase tracking-wide">{t('settings.aiFeedback')}</p>
              <p className="text-sm text-[#0B3D2E] leading-relaxed">{maxFeedback}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 诚实度滑块 */}
      <div className="bg-white rounded-lg p-4 border border-[#E7E1D6]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-[#0B3D2E]">{t('settings.honestyLabel')}</p>
            <p className="text-xs text-[#0B3D2E]/50">{t('settings.honestyDesc')}</p>
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
          <span>{t('settings.diplomatic')}</span>
          <span>{t('settings.brutal')}</span>
        </div>
      </div>

      {/* 幽默感滑块 + 自动人格指示器 */}
      <div className="bg-white rounded-lg p-4 border border-[#E7E1D6]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-[#0B3D2E]">{t('settings.humorLabel')}</p>
            <p className="text-xs text-[#0B3D2E]/50">{t('settings.humorDesc')}</p>
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
              className={`h-full rounded-full ${humorLevel >= 100
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
            className={`absolute w-5 h-5 rounded-full bg-white border-2 shadow-md pointer-events-none ${humorLevel >= 100 ? 'border-pink-500' : humorLevel < 33 ? 'border-[#C4A77D]' : humorLevel < 66 ? 'border-[#9CAF88]' : 'border-[#D4C4A8]'
              }`}
            initial={false}
            animate={{ left: `calc(${humorLevel}% - 10px)` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-[#0B3D2E]/40 mt-2">
          <span>{t('settings.serious')}</span>
          <span>{t('settings.witty')}</span>
        </div>

        {/* 自动人格指示器 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={humorLevel < 33 ? 'dr_house' : humorLevel < 66 ? 'zen_master' : 'max'}
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className={`mt-4 flex items-center justify-center gap-3 py-3 px-4 rounded-xl border ${humorLevel < 33
              ? 'bg-[#C4A77D]/10 border-[#C4A77D]/30'
              : humorLevel < 66
                ? 'bg-[#9CAF88]/10 border-[#9CAF88]/30'
                : 'bg-[#E8DFD0]/20 border-[#D4C4A8]/30'
              }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${humorLevel < 33
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
              <p className={`text-xs ${humorLevel < 33
                ? 'text-[#C4A77D]'
                : humorLevel < 66
                  ? 'text-[#9CAF88]'
                  : 'text-[#B8A888]'
                }`}>
                {humorLevel < 33 ? t('settings.drHouseStyle') : humorLevel < 66 ? t('settings.zenMasterStyle') : t('settings.maxStyle')}
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
