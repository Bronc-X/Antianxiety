'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { useProfile } from '@/hooks/domain/useProfile';
import { useProfileMaintenance } from '@/hooks/domain/useProfileMaintenance';

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
    metabolic_concerns?: string[] | null;
  };
}

export default function HealthProfileForm({ userId, initialData }: HealthProfileFormProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { saveHealthProfile } = useProfile();
  const { refresh: refreshProfile, sync } = useProfileMaintenance();

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
    metabolic_concerns: initialData?.metabolic_concerns || [],
  });

  const totalSteps = 2;
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const toggleMetabolicConcern = (concern: string) => {
    setFormData(prev => {
      const current = prev.metabolic_concerns as string[];
      const isSelected = current.includes(concern);
      return {
        ...prev,
        metabolic_concerns: isSelected
          ? current.filter(c => c !== concern)
          : [...current, concern]
      };
    });
  };

  const validateStep = (step: number): boolean => {
    if (step === 0) {
      if (!formData.primary_goal) {
        setError(t('healthProfile.error.selectGoal'));
        return false;
      }
      if ((formData.primary_goal === 'lose_weight' || formData.primary_goal === 'gain_muscle') && !formData.target_weight_kg) {
        setError(t('healthProfile.error.setWeight'));
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
        primary_goal: formData.primary_goal || null,
        target_weight_kg: formData.target_weight_kg ? parseFloat(formData.target_weight_kg) : null,
        weekly_goal_rate: formData.weekly_goal_rate || null,
        ai_profile_completed: true,
      };

      console.log('准备保存数据:', payload);

      const result = await saveHealthProfile({
        gender: formData.gender || null,
        birth_date: formData.birth_date || null,
        height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        activity_level: formData.activity_level || null,
        body_fat_percentage: formData.body_fat_percentage ? parseFloat(formData.body_fat_percentage) : null,
        primary_goal: formData.primary_goal,
        target_weight_kg: formData.target_weight_kg ? parseFloat(formData.target_weight_kg) : null,
        weekly_goal_rate: formData.weekly_goal_rate,
        sleep_hours: formData.sleep_hours ? Math.round(parseFloat(formData.sleep_hours) * 10) / 10 : null,
        stress_level: formData.stress_level ? parseInt(formData.stress_level, 10) : null,
        energy_level: formData.energy_level ? parseInt(formData.energy_level, 10) : null,
        exercise_frequency: formData.exercise_frequency,
        caffeine_intake: formData.caffeine_intake,
        alcohol_intake: formData.alcohol_intake,
        smoking_status: formData.smoking_status,
        metabolic_concerns: formData.metabolic_concerns,
      });
      console.log('API 返回:', result);

      if (!result.success) {
        throw new Error(result.error || t('healthProfile.error.saveFailed'));
      }

      setSuccess(t('healthProfile.saved'));

      // 后台刷新：更新 AI 分析/方案 + 用户画像向量（用于文章推荐）
      refreshProfile().catch(() => {});
      sync().catch(() => {});

      setTimeout(() => {
        router.push('/unlearn');
        router.refresh();
      }, 1000);
    } catch (err) {
      console.error('Save failed:', err);
      setError(err instanceof Error ? err.message : t('healthProfile.error.saveFailed'));
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
            <h2 className="text-xl font-semibold text-[#0B3D2E] mb-4">{t('healthProfile.step1.title')}</h2>
            <p className="text-sm text-[#0B3D2E]/70 mb-6">{t('healthProfile.step1.desc')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
              {t('healthProfile.primaryGoal')} <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {[
                { value: 'lose_weight', labelKey: 'healthProfile.goal.loseWeight', needWeight: true },
                { value: 'maintain_energy', labelKey: 'healthProfile.goal.maintainEnergy', needWeight: false },
                { value: 'gain_muscle', labelKey: 'healthProfile.goal.gainMuscle', needWeight: true },
                { value: 'improve_metric', labelKey: 'healthProfile.goal.improveMetric', needWeight: false },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('primary_goal', option.value)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${formData.primary_goal === option.value
                    ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]'
                    : 'bg-white text-[#0B3D2E] border-[#E7E1D6] hover:border-[#0B3D2E]'
                    }`}
                >
                  {t(option.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {(formData.primary_goal === 'lose_weight' || formData.primary_goal === 'gain_muscle') && (
            <>
              <div>
                <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
                  {t('healthProfile.targetWeight')} <span className="text-red-500">*</span>
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
                  {t('healthProfile.weeklyRate')} <span className="text-[#0B3D2E]/60 text-xs ml-1">{t('healthProfile.optional')}</span>
                </label>
                <div className="space-y-2">
                  {(formData.primary_goal === 'lose_weight'
                    ? [
                      { value: 'slow', labelKey: 'healthProfile.rate.slow.lose' },
                      { value: 'moderate', labelKey: 'healthProfile.rate.moderate.lose' },
                      { value: 'fast', labelKey: 'healthProfile.rate.fast.lose' },
                    ]
                    : [
                      { value: 'slow', labelKey: 'healthProfile.rate.slow.gain' },
                      { value: 'moderate', labelKey: 'healthProfile.rate.moderate.gain' },
                    ]
                  ).map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleChange('weekly_goal_rate', option.value)}
                      className={`w-full text-left px-4 py-2 rounded-lg border transition-all ${formData.weekly_goal_rate === option.value
                        ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]'
                        : 'bg-white text-[#0B3D2E] border-[#E7E1D6] hover:border-[#0B3D2E]'
                        }`}
                    >
                      {t(option.labelKey)}
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
              {t('healthProfile.back')}
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 bg-[#0B3D2E] text-white py-3 rounded-lg hover:bg-[#0a3629] transition-colors font-medium"
            >
              {t('healthProfile.next')}
            </button>
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-[#0B3D2E] mb-4">{t('healthProfile.step2.title')}</h2>
            <p className="text-sm text-[#0B3D2E]/70 mb-6">{t('healthProfile.step2.desc')}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
                {t('healthProfile.sleepHours')}
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
                {t('healthProfile.stressLevel')}
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
              {t('healthProfile.energyLevel')}
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
              {t('healthProfile.exerciseFrequency')}
            </label>
            <div className="space-y-2">
              {[
                { value: 'rarely', labelKey: 'healthProfile.exercise.rarely' },
                { value: '1-2_week', labelKey: 'healthProfile.exercise.1-2' },
                { value: '2-3_week', labelKey: 'healthProfile.exercise.2-3' },
                { value: '4-5_week', labelKey: 'healthProfile.exercise.4-5' },
                { value: '6-7_week', labelKey: 'healthProfile.exercise.6-7' },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('exercise_frequency', option.value)}
                  className={`w-full text-left px-4 py-2 rounded-lg border transition-all ${formData.exercise_frequency === option.value
                    ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]'
                    : 'bg-white text-[#0B3D2E] border-[#E7E1D6] hover:border-[#0B3D2E]'
                    }`}
                >
                  {t(option.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
              {t('healthProfile.caffeineIntake')}
            </label>
            <div className="space-y-2">
              {[
                { value: 'none', labelKey: 'healthProfile.caffeine.none' },
                { value: '1_cup', labelKey: 'healthProfile.caffeine.1' },
                { value: '2-3_cups', labelKey: 'healthProfile.caffeine.2-3' },
                { value: '4+_cups', labelKey: 'healthProfile.caffeine.4+' },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('caffeine_intake', option.value)}
                  className={`w-full text-left px-4 py-2 rounded-lg border transition-all ${formData.caffeine_intake === option.value
                    ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]'
                    : 'bg-white text-[#0B3D2E] border-[#E7E1D6] hover:border-[#0B3D2E]'
                    }`}
                >
                  {t(option.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
              {t('healthProfile.alcoholIntake')}
            </label>
            <div className="space-y-2">
              {[
                { value: 'none', labelKey: 'healthProfile.alcohol.none' },
                { value: 'occasional', labelKey: 'healthProfile.alcohol.occasional' },
                { value: '1-2_week', labelKey: 'healthProfile.alcohol.1-2' },
                { value: '3+_week', labelKey: 'healthProfile.alcohol.3+' },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('alcohol_intake', option.value)}
                  className={`w-full text-left px-4 py-2 rounded-lg border transition-all ${formData.alcohol_intake === option.value
                    ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]'
                    : 'bg-white text-[#0B3D2E] border-[#E7E1D6] hover:border-[#0B3D2E]'
                    }`}
                >
                  {t(option.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
              {t('healthProfile.smokingStatus')}
            </label>
            <div className="space-y-2">
              {[
                { value: 'non_smoker', labelKey: 'healthProfile.smoking.nonSmoker' },
                { value: 'ex_smoker', labelKey: 'healthProfile.smoking.exSmoker' },
                { value: 'occasional', labelKey: 'healthProfile.smoking.occasional' },
                { value: 'regular', labelKey: 'healthProfile.smoking.regular' },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('smoking_status', option.value)}
                  className={`w-full text-left px-4 py-2 rounded-lg border transition-all ${formData.smoking_status === option.value
                    ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]'
                    : 'bg-white text-[#0B3D2E] border-[#E7E1D6] hover:border-[#0B3D2E]'
                    }`}
                >
                  {t(option.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Metabolic Health Concerns */}
          <div>
            <label className="block text-sm font-medium text-[#0B3D2E] mb-2">
              {t('healthProfile.metabolicConcerns')} <span className="text-[#0B3D2E]/60 text-xs ml-1">{t('healthProfile.metabolicConcernsHint')}</span>
            </label>
            <p className="text-xs text-[#0B3D2E]/60 mb-3">
              {t('healthProfile.metabolicConcernsDesc')}
            </p>
            <div className="grid grid-cols-1 gap-2">
              {[
                {
                  value: 'easy_fatigue',
                  labelKey: 'healthProfile.concern.fatigue',
                  mechanismKey: 'healthProfile.concern.fatigueMech',
                  descKey: 'healthProfile.concern.fatigueDesc'
                },
                {
                  value: 'belly_fat',
                  labelKey: 'healthProfile.concern.bellyFat',
                  mechanismKey: 'healthProfile.concern.bellyFatMech',
                  descKey: 'healthProfile.concern.bellyFatDesc'
                },
                {
                  value: 'muscle_loss',
                  labelKey: 'healthProfile.concern.muscleLoss',
                  mechanismKey: 'healthProfile.concern.muscleLossMech',
                  descKey: 'healthProfile.concern.muscleLossDesc'
                },
                {
                  value: 'slow_recovery',
                  labelKey: 'healthProfile.concern.slowRecovery',
                  mechanismKey: 'healthProfile.concern.slowRecoveryMech',
                  descKey: 'healthProfile.concern.slowRecoveryDesc'
                },
                {
                  value: 'carb_cravings',
                  labelKey: 'healthProfile.concern.carbCravings',
                  mechanismKey: 'healthProfile.concern.carbCravingsMech',
                  descKey: 'healthProfile.concern.carbCravingsDesc'
                },
              ].map(option => {
                const isSelected = (formData.metabolic_concerns as string[]).includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleMetabolicConcern(option.value)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${isSelected
                      ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]'
                      : 'bg-white text-[#0B3D2E] border-[#E7E1D6] hover:border-[#0B3D2E]'
                      }`}
                  >
                    <div className="font-medium mb-1">{t(option.labelKey)}</div>
                    <div className={`text-xs ${isSelected ? 'text-white/70' : 'text-[#0B3D2E]/50'
                      }`}>
                      <span className="font-semibold">{t('healthProfile.mechanism')}</span>{t(option.mechanismKey)}
                    </div>
                    <div className={`text-xs mt-0.5 ${isSelected ? 'text-white/60' : 'text-[#0B3D2E]/40'
                      }`}>
                      {t(option.descKey)}
                    </div>
                  </button>
                );
              })}
            </div>
            {(formData.metabolic_concerns as string[]).length > 0 && (
              <div className="mt-3 p-3 bg-[#0B3D2E]/5 rounded-lg border border-[#0B3D2E]/10">
                <div className="text-xs text-[#0B3D2E]/70">
                  {t('healthProfile.concernsSelected', { count: (formData.metabolic_concerns as string[]).length })}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 bg-white text-[#0B3D2E] border border-[#E7E1D6] py-3 rounded-lg hover:bg-[#FAF6EF] transition-colors font-medium"
            >
              {t('healthProfile.back')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-[#0B3D2E] text-white py-3 rounded-lg hover:bg-[#0a3629] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? t('healthProfile.saving') : t('healthProfile.saveComplete')}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
