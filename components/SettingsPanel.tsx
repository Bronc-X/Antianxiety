'use client';

import { useMemo, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AnimatedSection from '@/components/AnimatedSection';
import { createClientSupabaseClient } from '@/lib/supabase-client';

type GenderOption = 'male' | 'female' | 'prefer_not';
type ActivityLevelOption = 'sedentary' | 'light' | 'moderate' | 'active';
type PrimaryGoalOption = 'lose_weight' | 'maintain_energy' | 'gain_muscle' | 'improve_metric';

interface ProfileRecord {
  id?: string;
  username?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  height?: number | null;
  height_cm?: number | null;
  weight?: number | null;
  weight_kg?: number | null;
  activity_level?: string | null;
  body_fat_percentage?: number | null;
  primary_goal?: string | null;
  goal_focus_notes?: string | null;
  target_weight_kg?: number | null;
  weekly_goal_rate?: string | null;
  weekly_goal_custom?: number | null;
}

interface SettingsPanelProps {
  initialProfile: ProfileRecord | null;
  userId: string;
}

interface SettingsFormState {
  gender: GenderOption | '';
  birthDate: string;
  heightCm: string;
  heightFeet: string;
  heightInches: string;
  weightKg: string;
  weightLbs: string;
  activityLevel: ActivityLevelOption | '';
  bodyFat: string;
  primaryGoal: PrimaryGoalOption | '';
  customGoalDetail: string;
  targetWeightKg: string;
  targetWeightLbs: string;
  weeklyGoalRate: string;
  weeklyGoalCustom: string;
}

const CM_PER_INCH = 2.54;
const LBS_PER_KG = 2.20462;

const activityLevelOptions = [
  {
    id: 'sedentary',
    label: '久坐型',
    description: '大部分时间坐着，运动量极低',
  },
  {
    id: 'light',
    label: '轻度活跃',
    description: '少量站立与步行，例如短途通勤',
  },
  {
    id: 'moderate',
    label: '中度活跃',
    description: '经常站立、行走或轻体力劳动',
  },
  {
    id: 'active',
    label: '高度活跃',
    description: '需要大量体力劳动或训练',
  },
] as const;

const primaryGoalOptions = [
  { id: 'lose_weight', label: '减轻体重' },
  { id: 'maintain_energy', label: '保持健康 / 改善精力' },
  { id: 'gain_muscle', label: '增加肌肉' },
  { id: 'improve_metric', label: '改善特定指标（睡眠、压力等）' },
] as const;

const weeklyRateOptions: Record<Extract<PrimaryGoalOption, 'lose_weight' | 'gain_muscle'>, { id: string; label: string; description: string; value: string }[]> = {
  lose_weight: [
    { id: 'loss_easy', label: '轻松', description: '约 0.25 kg/周', value: '-0.25' },
    { id: 'loss_recommended', label: '推荐', description: '约 0.5 kg/周', value: '-0.5' },
    { id: 'loss_aggressive', label: '进取', description: '约 1 kg/周', value: '-1' },
  ],
  gain_muscle: [
    { id: 'gain_slow', label: '缓慢', description: '约 0.1 kg/周', value: '0.1' },
    { id: 'gain_recommended', label: '推荐', description: '约 0.2 kg/周', value: '0.2' },
  ],
};

const convertCmToImperial = (cm: number) => {
  const totalInches = cm / CM_PER_INCH;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  return { feet, inches };
};

const convertImperialToCm = (feet: number, inches: number) =>
  Math.round((feet * 12 + inches) * CM_PER_INCH);

const convertKgToLbs = (kg: number) => parseFloat((kg * LBS_PER_KG).toFixed(1));
const convertLbsToKg = (lbs: number) => parseFloat((lbs / LBS_PER_KG).toFixed(1));

export default function SettingsPanel({ initialProfile, userId }: SettingsPanelProps) {
  const profile = initialProfile || {};
  const supabase = createClientSupabaseClient();
  const router = useRouter();

  const initialHeightCm = profile.height_cm ?? profile.height ?? null;
  const baseHeightImperial =
    initialHeightCm !== null
      ? convertCmToImperial(initialHeightCm)
      : { feet: '', inches: '' };

  const initialWeightKg = profile.weight_kg ?? profile.weight ?? null;
  const defaultTargetKg = profile.target_weight_kg ?? initialWeightKg ?? null;

  const [formData, setFormData] = useState<SettingsFormState>({
    gender: (profile.gender as GenderOption) || '',
    birthDate: profile.birth_date ? (profile.birth_date as string).slice(0, 10) : '',
    heightCm: initialHeightCm ? initialHeightCm.toString() : '',
    heightFeet: baseHeightImperial.feet?.toString() || '',
    heightInches: baseHeightImperial.inches?.toString() || '',
    weightKg: initialWeightKg ? initialWeightKg.toString() : '',
    weightLbs: initialWeightKg ? convertKgToLbs(initialWeightKg).toString() : '',
    activityLevel: (profile.activity_level as ActivityLevelOption) || '',
    bodyFat: profile.body_fat_percentage ? profile.body_fat_percentage.toString() : '',
    primaryGoal: (profile.primary_goal as PrimaryGoalOption) || '',
    customGoalDetail: profile.goal_focus_notes || '',
    targetWeightKg: defaultTargetKg ? defaultTargetKg.toString() : '',
    targetWeightLbs: defaultTargetKg ? convertKgToLbs(defaultTargetKg).toString() : '',
    weeklyGoalRate: profile.weekly_goal_rate || '',
    weeklyGoalCustom: profile.weekly_goal_custom ? profile.weekly_goal_custom.toString() : '',
  });

  const [currentStep, setCurrentStep] = useState(0);
  const steps = ['基础指标', '目标设定'];
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasTouchedTargetWeight, setHasTouchedTargetWeight] = useState(
    Boolean(profile.target_weight_kg),
  );

  const progressPercent = useMemo(() => {
    if (steps.length === 1) return 100;
    return (currentStep / (steps.length - 1)) * 100;
  }, [currentStep, steps.length]);

  const parseSafeNumber = (value: string) => {
    if (!value) return null;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const suggestTargetWeight = (goal: PrimaryGoalOption, currentWeightKg: number | null) => {
    if (!currentWeightKg) return null;
    if (goal === 'lose_weight') {
      const delta = Math.max(2, currentWeightKg * 0.05);
      return parseFloat(Math.max(currentWeightKg - delta, 35).toFixed(1));
    }
    if (goal === 'gain_muscle') {
      const delta = Math.max(2, currentWeightKg * 0.03);
      return parseFloat((currentWeightKg + delta).toFixed(1));
    }
    return parseFloat(currentWeightKg.toFixed(1));
  };

  const handleHeightInput = (type: 'cm' | 'imperial', value: string, subType?: 'feet' | 'inches') => {
    if (type === 'cm') {
      setFormData((prev) => {
        const cmValue = value;
        const cmNumber = parseSafeNumber(cmValue);
        if (cmNumber) {
          const { feet, inches } = convertCmToImperial(cmNumber);
          return {
            ...prev,
            heightCm: cmValue,
            heightFeet: feet.toString(),
            heightInches: inches.toString(),
          };
        }
        return { ...prev, heightCm: cmValue, heightFeet: '', heightInches: '' };
      });
      return;
    }

    setFormData((prev) => {
      const next = { ...prev };
      if (subType === 'feet') {
        next.heightFeet = value;
      } else if (subType === 'inches') {
        next.heightInches = value;
      }
      const feetNumber = parseSafeNumber(next.heightFeet);
      const inchesNumber = parseSafeNumber(next.heightInches);
      if (feetNumber !== null && inchesNumber !== null) {
        next.heightCm = convertImperialToCm(feetNumber, inchesNumber).toString();
      } else {
        next.heightCm = '';
      }
      return next;
    });
  };

  const handleWeightInput = (unit: 'kg' | 'lbs', value: string, targetField?: 'current' | 'goal') => {
    const useTarget = targetField === 'goal';
    const keyKg = useTarget ? 'targetWeightKg' : 'weightKg';
    const keyLbs = useTarget ? 'targetWeightLbs' : 'weightLbs';

    setFormData((prev) => {
      const next = { ...prev };
      next[keyKg] = prev[keyKg];
      next[keyLbs] = prev[keyLbs];

      if (unit === 'kg') {
        next[keyKg] = value;
        const kgNumber = parseSafeNumber(value);
        next[keyLbs] = kgNumber !== null ? convertKgToLbs(kgNumber).toString() : '';
      } else {
        next[keyLbs] = value;
        const lbsNumber = parseSafeNumber(value);
        next[keyKg] = lbsNumber !== null ? convertLbsToKg(lbsNumber).toString() : '';
      }

      return next;
    });

    if (useTarget) {
      setHasTouchedTargetWeight(true);
    }
  };

  const handlePrimaryGoalChange = (goal: PrimaryGoalOption) => {
    setFormData((prev) => {
      const next = { ...prev, primaryGoal: goal };
      if ((goal === 'lose_weight' || goal === 'gain_muscle') && !hasTouchedTargetWeight) {
        const currentKg = parseSafeNumber(prev.weightKg);
        const suggestion = suggestTargetWeight(goal, currentKg);
        if (suggestion) {
          next.targetWeightKg = suggestion.toString();
          next.targetWeightLbs = convertKgToLbs(suggestion).toString();
        }
      }
      if (goal !== 'improve_metric') {
        next.customGoalDetail = '';
      }
      if (goal !== 'lose_weight' && goal !== 'gain_muscle') {
        next.weeklyGoalRate = '';
        next.weeklyGoalCustom = '';
      }
      return next;
    });
  };

  const validateStep = (stepIndex: number) => {
    const missing: string[] = [];
    if (stepIndex === 0) {
      if (!formData.gender) missing.push('性别');
      if (!formData.birthDate) missing.push('出生日期');
      if (!formData.heightCm) missing.push('身高');
      if (!formData.weightKg) missing.push('当前体重');
      if (!formData.activityLevel) missing.push('日常活动量');
    } else if (stepIndex === 1) {
      if (!formData.primaryGoal) missing.push('主要健康目标');
      if (
        (formData.primaryGoal === 'lose_weight' || formData.primaryGoal === 'gain_muscle') &&
        !formData.targetWeightKg
      ) {
        missing.push('目标体重');
      }
      if (
        (formData.primaryGoal === 'lose_weight' || formData.primaryGoal === 'gain_muscle') &&
        !formData.weeklyGoalRate &&
        !formData.weeklyGoalCustom
      ) {
        missing.push('每周目标速率');
      }
      if (formData.primaryGoal === 'improve_metric' && !formData.customGoalDetail) {
        missing.push('需要改善的指标');
      }
    }

    if (missing.length > 0) {
      setBanner({
        type: 'error',
        text: `请完整填写：${missing.join('、')}`,
      });
      return false;
    }
    setBanner(null);
    return true;
  };

  const handleNextStep = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrevStep = () => {
    setBanner(null);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateStep(1)) return;
    setIsSaving(true);
    setBanner(null);

    try {
      if (!userId) {
        setBanner({ type: 'error', text: '请先登录后再保存设置。' });
        setIsSaving(false);
        return;
      }

      const customRateRaw = parseSafeNumber(formData.weeklyGoalCustom);
      const signedCustomRate =
        customRateRaw !== null && formData.primaryGoal
          ? (formData.primaryGoal === 'lose_weight' ? -Math.abs(customRateRaw) : Math.abs(customRateRaw))
          : null;

      const payload = {
        gender: formData.gender || null,
        birth_date: formData.birthDate || null,
        height_cm: parseSafeNumber(formData.heightCm),
        weight_kg: parseSafeNumber(formData.weightKg),
        activity_level: formData.activityLevel || null,
        body_fat_percentage: parseSafeNumber(formData.bodyFat),
        primary_goal: formData.primaryGoal || null,
        goal_focus_notes:
          formData.primaryGoal === 'improve_metric' ? formData.customGoalDetail || null : formData.customGoalDetail || null,
        target_weight_kg:
          formData.primaryGoal === 'lose_weight' || formData.primaryGoal === 'gain_muscle'
            ? parseSafeNumber(formData.targetWeightKg)
            : null,
        weekly_goal_rate:
          formData.primaryGoal === 'lose_weight' || formData.primaryGoal === 'gain_muscle'
            ? formData.weeklyGoalRate || (signedCustomRate !== null ? 'custom' : null)
            : null,
        weekly_goal_custom:
          formData.primaryGoal === 'lose_weight' || formData.primaryGoal === 'gain_muscle'
            ? signedCustomRate
            : null,
      };

      const fallbackUsername = initialProfile?.username || userId.slice(0, 8);
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: userId,
            username: fallbackUsername,
            ...payload
          },
          {
            onConflict: 'id',
            ignoreDuplicates: false
          }
        );

      if (upsertError) {
        setBanner({ type: 'error', text: `保存失败：${upsertError.message}` });
        setIsSaving(false);
        return;
      }

      setBanner({ type: 'success', text: '设置已保存，正在返回首页…' });
      router.push('/unlearn/app');
      router.refresh();
    } catch (err) {
      console.error('保存设置时出错:', err);
      setBanner({
        type: 'error',
        text: '保存设置时出现问题，请稍后再试。',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderStepOne = () => (
    <div className="space-y-8">
      <SectionCard
        title="性别"
        subtitle="用于选择合适的 BMR 计算公式与医学参考数据"
        hint="我们根据性别来匹配更准确的代谢率和临床建议，所有数据仅用于个性化推荐。"
      >
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { id: 'male', label: '男' },
            { id: 'female', label: '女' },
            { id: 'prefer_not', label: '暂不透露' },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, gender: option.id as GenderOption }))}
              className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${formData.gender === option.id
                  ? 'border-[#0B3D2E] bg-[#0B3D2E]/5 text-[#0B3D2E]'
                  : 'border-[#E7E1D6] text-[#0B3D2E]/70 hover:border-[#0B3D2E]/40'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="出生日期"
        subtitle="AI 根据年龄段提供差异化建议"
        hint="精确年龄有助于提供符合生命周期的健康方案，我们不会对外分享您的出生日期。"
      >
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-[#0B3D2E]">选择日期</label>
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, birthDate: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:border-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/10"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <InfoBlock
            title="AI 应用"
            description="计算年龄、选择适合的 BMR 公式，并触发针对不同年龄阶段的健康提示。"
          />
        </div>
      </SectionCard>

      <SectionCard
        title="身高"
        subtitle="支持厘米或英尺英寸输入"
        hint="准确身高可提升 BMI、BMR 等核心公式精度。"
      >
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-[#0B3D2E]">厘米 (cm)</label>
            <input
              type="number"
              inputMode="decimal"
              value={formData.heightCm}
              onChange={(e) => handleHeightInput('cm', e.target.value)}
              placeholder="175"
              className="mt-2 w-full rounded-lg border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:border-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/10"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-[#0B3D2E]">英尺 (ft)</label>
              <input
                type="number"
                inputMode="numeric"
                value={formData.heightFeet}
                onChange={(e) => handleHeightInput('imperial', e.target.value, 'feet')}
                placeholder="5"
                className="mt-2 w-full rounded-lg border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:border-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/10"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#0B3D2E]">英寸 (in)</label>
              <input
                type="number"
                inputMode="numeric"
                value={formData.heightInches}
                onChange={(e) => handleHeightInput('imperial', e.target.value, 'inches')}
                placeholder="9"
                className="mt-2 w-full rounded-lg border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:border-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/10"
              />
            </div>
          </div>
        </div>
        <InfoBlock
          className="mt-4"
          title="AI 应用"
          description="结合体重计算 BMI、推断体脂率，并为 BMR、姿态训练等模块提供输入。"
        />
      </SectionCard>

      <SectionCard
        title="当前体重"
        subtitle="可输入公斤或磅"
        hint="体重数据是监控趋势、生成卡路里策略的核心指标。"
      >
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-[#0B3D2E]">公斤 (kg)</label>
            <input
              type="number"
              inputMode="decimal"
              value={formData.weightKg}
              onChange={(e) => handleWeightInput('kg', e.target.value)}
              placeholder="70"
              className="mt-2 w-full rounded-lg border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:border-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/10"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#0B3D2E]">磅 (lbs)</label>
            <input
              type="number"
              inputMode="decimal"
              value={formData.weightLbs}
              onChange={(e) => handleWeightInput('lbs', e.target.value)}
              placeholder="154"
              className="mt-2 w-full rounded-lg border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:border-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/10"
            />
          </div>
        </div>
        <InfoBlock
          className="mt-4"
          title="AI 应用"
          description="追踪体重变化、计算 BMI/BMR，并用于生成饮食与运动热量建议。"
        />
      </SectionCard>

      <SectionCard
        title="日常活动量"
        subtitle="请选择最贴近您日常状态的选项"
        hint="AI 根据活动水平推算 TDEE，并决定饮食/训练方案强度。"
      >
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {activityLevelOptions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                setFormData((prev) => ({ ...prev, activityLevel: item.id as ActivityLevelOption }))
              }
              className={`rounded-2xl border p-4 text-left transition-all ${formData.activityLevel === item.id
                  ? 'border-[#0B3D2E] bg-[#0B3D2E]/5 shadow-sm'
                  : 'border-[#E7E1D6] hover:border-[#0B3D2E]/40'
                }`}
            >
              <div className="text-sm font-semibold text-[#0B3D2E]">{item.label}</div>
              <p className="mt-1 text-xs text-[#0B3D2E]/70">{item.description}</p>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="（可选）身体成分"
        subtitle="体脂率有助于更精准的体态方案"
        hint="如果您使用体脂秤，可填写最新数值；如不确定可空置。"
      >
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-[#0B3D2E]">体脂率 (%)</label>
            <input
              type="number"
              inputMode="decimal"
              value={formData.bodyFat}
              onChange={(e) => setFormData((prev) => ({ ...prev, bodyFat: e.target.value }))}
              placeholder="18"
              className="mt-2 w-full rounded-lg border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:border-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/10"
            />
          </div>
          <InfoBlock
            title="AI 应用"
            description="结合体脂率可推断去脂体重、更准确地匹配训练和营养建议。"
          />
        </div>
      </SectionCard>
    </div>
  );

  const renderStepTwo = () => (
    <div className="space-y-8">
      <SectionCard
        title="主要健康目标"
        subtitle="选择后 AI 将自动生成对应的激励路径"
        hint="我们使用目标类型来规划卡路里缺口/盈余、睡眠或压力改善节奏。"
      >
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {primaryGoalOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handlePrimaryGoalChange(option.id as PrimaryGoalOption)}
              className={`rounded-2xl border p-4 text-left transition-all ${formData.primaryGoal === option.id
                  ? 'border-[#0B3D2E] bg-[#0B3D2E]/5 shadow-sm'
                  : 'border-[#E7E1D6] hover:border-[#0B3D2E]/40'
                }`}
            >
              <div className="text-sm font-semibold text-[#0B3D2E]">{option.label}</div>
              {option.id === 'improve_metric' && (
                <p className="mt-1 text-xs text-[#0B3D2E]/70">如：睡眠、压力、专注力、血糖等</p>
              )}
            </button>
          ))}
        </div>
      </SectionCard>

      {(formData.primaryGoal === 'lose_weight' || formData.primaryGoal === 'gain_muscle') && (
        <SectionCard
          title="目标体重"
          subtitle="我们已根据当前体重自动生成，可自行调整"
          hint="目标体重帮助 AI 计算卡路里缺口或盈余，并拆解阶段性里程碑。"
        >
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-[#0B3D2E]">公斤 (kg)</label>
              <input
                type="number"
                inputMode="decimal"
                value={formData.targetWeightKg}
                onChange={(e) => handleWeightInput('kg', e.target.value, 'goal')}
                placeholder="65"
                className="mt-2 w-full rounded-lg border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:border-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/10"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#0B3D2E]">磅 (lbs)</label>
              <input
                type="number"
                inputMode="decimal"
                value={formData.targetWeightLbs}
                onChange={(e) => handleWeightInput('lbs', e.target.value, 'goal')}
                placeholder="143"
                className="mt-2 w-full rounded-lg border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:border-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/10"
              />
            </div>
          </div>
          <InfoBlock
            className="mt-4"
            title="AI 应用"
            description="设定目标后，AI 将匹配热量缺口/盈余、周期性提醒与心理激励策略。"
          />
        </SectionCard>
      )}

      {formData.primaryGoal === 'improve_metric' && (
        <SectionCard
          title="改善的指标 / 目标描述"
          subtitle="例如：每晚 7 小时睡眠、降低工作压力、改善 HRV"
          hint="具体指标让 AI 更容易输出评估标准与阶段复盘。"
        >
          <div className="mt-6 space-y-4">
            <textarea
              rows={4}
              value={formData.customGoalDetail}
              onChange={(e) => setFormData((prev) => ({ ...prev, customGoalDetail: e.target.value }))}
              className="w-full rounded-xl border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:border-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/10"
              placeholder="例如：目标 11 点前入睡；或：将平均睡眠提高到 7.5 小时；或：连续两周保持压力低于 5/10。"
            />
          </div>
        </SectionCard>
      )}

      {(formData.primaryGoal === 'lose_weight' || formData.primaryGoal === 'gain_muscle') && (
        <SectionCard
          title="每周目标速率"
          subtitle="决定卡路里缺口/盈余与习惯强度"
          hint="选择轻松/推荐/进取档，AI 会同步调整饮食、训练与提醒频次。"
        >
          <div className="mt-6 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {weeklyRateOptions[formData.primaryGoal].map((option) => (
                <label
                  key={option.id}
                  className={`flex flex-col rounded-2xl border p-4 text-left text-sm transition-all ${formData.weeklyGoalRate === option.id
                      ? 'border-[#0B3D2E] bg-[#0B3D2E]/5 shadow-sm'
                      : 'border-[#E7E1D6] hover:border-[#0B3D2E]/40'
                    }`}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    name="weekly-goal-rate"
                    value={option.id}
                    checked={formData.weeklyGoalRate === option.id}
                    onChange={() => setFormData((prev) => ({ ...prev, weeklyGoalRate: option.id, weeklyGoalCustom: '' }))}
                  />
                  <span className="font-semibold text-[#0B3D2E]">{option.label}</span>
                  <span className="mt-1 text-xs text-[#0B3D2E]/70">{option.description}</span>
                </label>
              ))}
            </div>
            <div className="rounded-2xl border border-dashed border-[#E7E1D6] p-4">
              <label className="text-sm font-medium text-[#0B3D2E]">自定义速率 (kg/周)</label>
              <div className="mt-2 flex gap-3">
                <input
                  type="number"
                  inputMode="decimal"
                  value={formData.weeklyGoalCustom}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      weeklyGoalCustom: e.target.value,
                      weeklyGoalRate: '',
                    }))
                  }
                  placeholder="例如 0.4"
                  className="flex-1 rounded-lg border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:border-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/10"
                />
                <span className="text-xs text-[#0B3D2E]/60">
                  {formData.primaryGoal === 'lose_weight'
                    ? '系统会按减重方向处理此速率'
                    : '系统会按增肌方向处理此速率'}
                </span>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {formData.primaryGoal === 'maintain_energy' && (
        <SectionCard
          title="维护型目标备注（可选）"
          subtitle="例如：保持体重、想要拥有更稳定的精力"
          hint="简短描述可以帮助 AI 聚焦到饮食节奏、午休、压力管理等策略。"
        >
          <textarea
            rows={3}
            value={formData.customGoalDetail}
            onChange={(e) => setFormData((prev) => ({ ...prev, customGoalDetail: e.target.value }))}
            placeholder="例如：保持目前体重，同时提升下午 3 点后的专注力。"
            className="mt-6 w-full rounded-xl border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:border-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/10"
          />
        </SectionCard>
      )}
    </div>
  );

  return (
    <AnimatedSection inView variant="fadeUp">
      <form onSubmit={handleSubmit} className="rounded-3xl border border-[#E7E1D6] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#E7E1D6] pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0B3D2E]/60">
              基础指标设置
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#0B3D2E]">个性化健康参数</h2>
            <p className="mt-1 text-sm text-[#0B3D2E]/70">
              通过翻页填写，顶部进度条会实时反馈完成度。
            </p>
          </div>
          <div className="w-full max-w-xs space-y-3">
            <div className="flex items-center justify-between text-xs text-[#0B3D2E]/70">
              {steps.map((label, index) => (
                <div key={label} className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${index <= currentStep
                        ? 'border-[#0B3D2E] bg-[#0B3D2E] text-white'
                        : 'border-[#E7E1D6] text-[#0B3D2E]/50'
                      }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`mt-2 text-[10px] uppercase tracking-[0.2em] ${currentStep === index ? 'text-[#0B3D2E]' : 'text-[#0B3D2E]/60'
                      }`}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-2 rounded-full bg-[#F1EBE0]">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {banner && (
          <div
            className={`mt-6 rounded-xl border px-4 py-3 text-sm ${banner.type === 'success'
                ? 'border-[#0B3D2E]/30 bg-[#0B3D2E]/5 text-[#0B3D2E]'
                : 'border-red-200 bg-red-50 text-red-700'
              }`}
          >
            {banner.text}
          </div>
        )}

        <div className="mt-6 space-y-6">
          {currentStep === 0 ? renderStepOne() : renderStepTwo()}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-[#E7E1D6] pt-6">
          <button
            type="button"
            onClick={() => router.push('/unlearn/app')}
            className="rounded-full border border-[#E7E1D6] px-4 py-2 text-sm font-medium text-[#0B3D2E] hover:bg-[#FAF6EF]"
          >
            返回主页
          </button>
          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="rounded-full border border-[#E7E1D6] px-5 py-2 text-sm font-medium text-[#0B3D2E] hover:bg-[#FAF6EF]"
              >
                上一页
              </button>
            )}
            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="rounded-full bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] px-6 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg"
              >
                下一页
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-full bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] px-6 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? '保存中…' : '保存设定'}
              </button>
            )}
          </div>
        </div>
      </form>
    </AnimatedSection>
  );
}

function SectionCard({
  title,
  subtitle,
  hint,
  children,
}: {
  title: string;
  subtitle: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-[#F1EBE0] bg-[#FFFDF8] px-4 py-5 sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#0B3D2E]">{title}</h3>
          <p className="text-sm text-[#0B3D2E]/70">{subtitle}</p>
        </div>
        <InfoHint text={hint} />
      </div>
      {children}
    </div>
  );
}

function InfoBlock({
  title,
  description,
  className = '',
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-[#E7E1D6] bg-white/60 px-4 py-3 text-sm text-[#0B3D2E]/80 ${className}`}
    >
      <p className="font-medium text-[#0B3D2E]">{title}</p>
      <p className="mt-1 text-xs text-[#0B3D2E]/70">{description}</p>
    </div>
  );
}

function InfoHint({ text }: { text: string }) {
  return (
    <div className="relative">
      <button
        type="button"
        aria-label="查看字段说明"
        className="group relative flex h-8 w-8 items-center justify-center rounded-full border border-[#0B3D2E]/30 text-xs font-semibold text-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/30"
      >
        i
        <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-64 -translate-x-1/2 rounded-xl border border-[#E7E1D6] bg-white/95 p-3 text-xs leading-relaxed text-[#0B3D2E]/80 shadow-lg group-focus-visible:block group-hover:block">
          {text}
        </span>
      </button>
    </div>
  );
}

