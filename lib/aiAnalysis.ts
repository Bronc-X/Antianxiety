import { createServerSupabaseClient } from './supabase-server';

/**
 * AI Analysis System - Metabolic Aging Research Database
 * 
 * 本分析系统基于2024年最新代谢衰老研究：
 * 
 * 核心机制（30-45岁人群）：
 * 1. 线粒体功能障碍 (Błaszczyk 2020, Raza 2024)
 *    - ATP生成↓, ROS↑ → 易疲劳、恢复慢
 * 
 * 2. 代谢重编程 (Raffaghello & Longo 2017)
 *    - 氧化磷酸化→糖酵解, RER: 0.75→0.85
 *    - 表现：对碳水渴望↑, 餐后困倦
 * 
 * 3. IL-17/TNF炎症通路 (Shen et al. 2024, DOI: 10.1186/s13020-024-00927-9)
 *    - SASP激活慢性炎症 → 内脏脂肪积累, 代谢失调
 *    - 关键通路：IL-17/TNF-α驱动的Inflammaging
 * 
 * 循证干预策略：
 * - Zone 2有氧 → BMR↑ 5-10% (Cabo 2024)
 * - 抗阻训练 → 保留肌肉量 (Chen & Wu 2024, DOI: 10.14336/AD.2024.0407)
 * - 16:8禁食 → 胰岛素敏感性↑ 20-30% (Kwon 2019)
 * - Omega-3/多酚 → 炎症标志物↓ 20-30% (Izadi 2024)
 * 
 * 前沿研究：
 * - AgeXtend AI预测抗衰分子 (Arora 2024, Nature Aging)
 * - 血细胞代谢时钟-尿苷 (Zeng 2024, Nature Aging)
 * - EEAI能量消耗衰老指数 (Shen 2024)
 * 
 * 完整数据库：/data/metabolic_aging_research_database.json
 * 使用指南：/data/METABOLIC_AGING_RESEARCH_README.md
 */

interface UserProfile {
  id: string;
  age?: number | null;
  gender?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  sleep_hours?: number | null;
  stress_level?: number | null;
  energy_level?: number | null;
  exercise_types?: string[] | null;
  exercise_frequency?: string | null;
  exercise_duration_minutes?: number | null;
  work_schedule?: string | null;
  meal_pattern?: string | null;
  caffeine_intake?: string | null;
  alcohol_intake?: string | null;
  smoking_status?: string | null;
  medical_conditions?: string[] | null;
  medications?: string[] | null;
  primary_concern?: string | null;
  activity_level?: string | null;
  circadian_rhythm?: string | null;
  metabolic_concerns?: string[] | null;
}

interface PhysiologicalAnalysis {
  metabolic_rate_estimate: 'low' | 'medium' | 'high';
  cortisol_pattern: 'elevated' | 'normal' | 'low';
  sleep_quality: 'poor' | 'fair' | 'good';
  recovery_capacity: 'low' | 'medium' | 'high';
  stress_resilience: 'low' | 'medium' | 'high';
  energy_stability: 'unstable' | 'moderate' | 'stable';
  inflammation_risk: 'high' | 'medium' | 'low';
  hormonal_balance: 'imbalanced' | 'moderate' | 'balanced';
  cardiovascular_health: 'needs_attention' | 'fair' | 'good';
  risk_factors: string[];
  strengths: string[];
  confidence_score: number; // 0-100, 分析置信度
  confidence_reasons: string[]; // 置信度评分理由
  analysis_details: {
    [key: string]: {
      reason: string;
      reason_en: string;
      target: string;
      target_en: string;
    };
  };
  risk_factors_en?: string[];
  strengths_en?: string[];
  confidence_reasons_en?: string[];
}

interface RecommendationPlan {
  core_principles: string[];
  micro_habits: Array<{
    name: string;
    name_en: string;
    cue: string;
    cue_en: string;
    response: string;
    response_en: string;
    timing: string;
    timing_en: string;
    rationale: string;
    rationale_en: string;
  }>;
  avoidance_behaviors: string[];
  monitoring_approach: string;
  expected_timeline: string;
}

type NormalizedExerciseFrequency = 'rarely' | '1-2_week' | '2-3_week' | '4-5_week' | '6-7_week';
type NormalizedCaffeineIntake = 'none' | '1_cup' | '2-3_cups' | '4+_cups';
type NormalizedAlcoholIntake = 'none' | 'occasional' | '1-2_week' | '3+_week';
type NormalizedSmokingStatus = 'non_smoker' | 'ex_smoker' | 'occasional' | 'regular';

function normalizeExerciseFrequency(value?: string | null): NormalizedExerciseFrequency | null {
  if (!value) return null;
  const v = String(value).trim();
  if (['rarely', '1-2_week', '2-3_week', '4-5_week', '6-7_week'].includes(v)) {
    return v as NormalizedExerciseFrequency;
  }
  if (v.includes('很少')) return 'rarely';
  if (v.includes('1-2')) return '1-2_week';
  if (v.includes('2-3')) return '2-3_week';
  if (v.includes('4-5')) return '4-5_week';
  if (v.includes('6-7')) return '6-7_week';
  return null;
}

function normalizeCaffeineIntake(value?: string | null): NormalizedCaffeineIntake | null {
  if (!value) return null;
  const v = String(value).trim();
  if (['none', '1_cup', '2-3_cups', '4+_cups'].includes(v)) {
    return v as NormalizedCaffeineIntake;
  }
  if (v.includes('不饮')) return 'none';
  if (v.includes('每天1')) return '1_cup';
  if (v.includes('2-3')) return '2-3_cups';
  if (v.includes('4') && v.includes('以上')) return '4+_cups';
  return null;
}

function normalizeAlcoholIntake(value?: string | null): NormalizedAlcoholIntake | null {
  if (!value) return null;
  const v = String(value).trim();
  if (['none', 'occasional', '1-2_week', '3+_week'].includes(v)) {
    return v as NormalizedAlcoholIntake;
  }
  if (v.includes('不饮')) return 'none';
  if (v.includes('偶尔') || v.includes('每月')) return 'occasional';
  if (v.includes('1-2')) return '1-2_week';
  if (v.includes('3') && v.includes('以上')) return '3+_week';
  return null;
}

function normalizeSmokingStatus(value?: string | null): NormalizedSmokingStatus | null {
  if (!value) return null;
  const v = String(value).trim();
  if (['non_smoker', 'ex_smoker', 'occasional', 'regular'].includes(v)) {
    return v as NormalizedSmokingStatus;
  }
  if (v.includes('不吸')) return 'non_smoker';
  if (v.includes('戒烟')) return 'ex_smoker';
  if (v.includes('偶尔')) return 'occasional';
  if (v.includes('经常')) return 'regular';
  return null;
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * 分析用户生理情况（基于收集的数据，目标80%准确度）
 */
export function analyzeUserProfile(profile: UserProfile): PhysiologicalAnalysis {
  const analysis: PhysiologicalAnalysis = {
    metabolic_rate_estimate: 'medium',
    cortisol_pattern: 'normal',
    sleep_quality: 'fair',
    recovery_capacity: 'medium',
    stress_resilience: 'medium',
    energy_stability: 'moderate',
    inflammation_risk: 'medium',
    hormonal_balance: 'moderate',
    cardiovascular_health: 'fair',
    risk_factors: [],
    strengths: [],
    confidence_score: 0,
    confidence_reasons: [],
    analysis_details: {},
  };

  let confidencePoints = 0;
  const maxPoints = 100;

  const exerciseFrequency = normalizeExerciseFrequency(profile.exercise_frequency);
  const caffeineIntake = normalizeCaffeineIntake(profile.caffeine_intake);
  const isCaffeineHigh = caffeineIntake === '4+_cups';
  const alcoholIntake = normalizeAlcoholIntake(profile.alcohol_intake);
  const smokingStatus = normalizeSmokingStatus(profile.smoking_status);

  const stressLevelValue = isNumber(profile.stress_level) ? profile.stress_level : null;
  const sleepHoursValue = isNumber(profile.sleep_hours) ? profile.sleep_hours : null;
  const energyLevelValue = isNumber(profile.energy_level) ? profile.energy_level : null;

  const hasStressLevel = stressLevelValue !== null;
  const hasSleepHours = sleepHoursValue !== null;
  const hasEnergyLevel = energyLevelValue !== null;
  const hasExerciseFrequency = Boolean(exerciseFrequency);

  // 代谢健康困扰映射（基于2024年代谢研究数据库）
  if (profile.metabolic_concerns && profile.metabolic_concerns.length > 0) {
    profile.metabolic_concerns.forEach(concern => {
      switch (concern) {
        case 'easy_fatigue':
          // 线粒体功能障碍
          analysis.metabolic_rate_estimate = 'low';
          analysis.energy_stability = 'unstable';
          analysis.risk_factors.push('ATP生成减少（线粒体功能障碍）');
          analysis.risk_factors_en = analysis.risk_factors_en || [];
          analysis.risk_factors_en.push('Reduced ATP production (mitochondrial dysfunction)');
          break;
        
        case 'belly_fat':
          // IL-17/TNF炎症通路
          analysis.inflammation_risk = 'high';
          analysis.hormonal_balance = 'imbalanced';
          analysis.risk_factors.push('IL-17/TNF炎症通路激活');
          analysis.risk_factors_en = analysis.risk_factors_en || [];
          analysis.risk_factors_en.push('IL-17/TNF inflammatory pathway activation');
          break;
        
        case 'muscle_loss':
          // 肌少症风险
          analysis.metabolic_rate_estimate = 'low';
          analysis.recovery_capacity = 'low';
          analysis.risk_factors.push('肌少症风险（30岁后每年流失1-2%肌肉量）');
          analysis.risk_factors_en = analysis.risk_factors_en || [];
          analysis.risk_factors_en.push('Sarcopenia risk (1-2% muscle loss per year after 30)');
          break;
        
        case 'slow_recovery':
          // 线粒体+氧化应激
          analysis.recovery_capacity = 'low';
          analysis.inflammation_risk = 'high';
          analysis.risk_factors.push('恢复能力下降（氧化应激）');
          analysis.risk_factors_en = analysis.risk_factors_en || [];
          analysis.risk_factors_en.push('Reduced recovery capacity (oxidative stress)');
          break;
        
        case 'carb_cravings':
          // 代谢重编程 RER 0.75→0.85
          analysis.energy_stability = 'unstable';
          analysis.hormonal_balance = 'imbalanced';
          analysis.risk_factors.push('代谢重编程（燃料偏好转向葡萄糖）');
          analysis.risk_factors_en = analysis.risk_factors_en || [];
          analysis.risk_factors_en.push('Metabolic reprogramming (shift to glucose preference)');
          break;
      }
    });
    
    // 用户提供了详细的代谢困扰信息，提高置信度
    confidencePoints += 20;
    analysis.confidence_reasons.push(`用户提供了${profile.metabolic_concerns.length}项代谢困扰信息`);
    analysis.confidence_reasons_en = analysis.confidence_reasons_en || [];
    analysis.confidence_reasons_en.push(`User provided ${profile.metabolic_concerns.length} metabolic concern(s)`);
  }

  // 1. 代谢率评估（基于年龄、性别、活动水平、BMI）
  if (profile.age && profile.height_cm && profile.weight_kg) {
    const bmi = profile.weight_kg / Math.pow(profile.height_cm / 100, 2);
    const ageFactor = profile.age > 40 ? -1 : profile.age > 30 ? 0 : 1;
    const activityFactor =
      exerciseFrequency === '4-5_week' || exerciseFrequency === '6-7_week'
        ? 1
        : exerciseFrequency === '2-3_week'
          ? 0
          : -1;
    
    if (bmi > 25 && ageFactor <= 0 && activityFactor <= 0) {
      analysis.metabolic_rate_estimate = 'low';
    } else if (bmi < 20 && activityFactor >= 0) {
      analysis.metabolic_rate_estimate = 'high';
    }
    confidencePoints += 15;
  }

  // 2. 皮质醇模式（基于压力水平、睡眠、咖啡因、运动）
  const stressScore = stressLevelValue;
  const sleepScore = sleepHoursValue !== null ? (sleepHoursValue >= 7 && sleepHoursValue <= 9 ? 0 : -1) : null;
  
  if ((stressScore !== null && stressScore >= 7) || (sleepScore !== null && sleepScore < 0) || isCaffeineHigh) {
    analysis.cortisol_pattern = 'elevated';
  } else if (stressScore !== null && stressScore <= 3 && sleepScore === 0 && (caffeineIntake === 'none' || caffeineIntake === '1_cup')) {
    analysis.cortisol_pattern = 'low';
  }
  if (hasStressLevel) confidencePoints += 8;
  if (hasSleepHours) confidencePoints += 8;
  if (caffeineIntake) confidencePoints += 4;

  // 3. 睡眠质量
  if (sleepHoursValue !== null) {
    if (sleepHoursValue < 6) {
      analysis.sleep_quality = 'poor';
      analysis.risk_factors.push('睡眠不足');
    } else if (sleepHoursValue >= 7 && sleepHoursValue <= 9) {
      analysis.sleep_quality = 'good';
      analysis.strengths.push('睡眠时长充足');
    } else {
      analysis.sleep_quality = 'fair';
    }
    confidencePoints += 15;
  }

  // 4. 恢复能力（基于运动频率、时长、精力水平）
  const exerciseScore =
    exerciseFrequency === '4-5_week' || exerciseFrequency === '6-7_week'
      ? 1
      : exerciseFrequency === '2-3_week' || exerciseFrequency === '1-2_week'
        ? 0
        : exerciseFrequency === 'rarely'
          ? -1
          : 0;
  const energyScore = energyLevelValue !== null ? (energyLevelValue >= 7 ? 1 : energyLevelValue <= 4 ? -1 : 0) : 0;
  
  if ((exerciseScore === 1 && energyScore >= 0) || (energyScore === 1 && exerciseScore >= 0)) {
    analysis.recovery_capacity = 'high';
    analysis.strengths.push('良好的运动习惯');
  } else if (exerciseScore < 0 && energyScore < 0) {
    analysis.recovery_capacity = 'low';
    analysis.risk_factors.push('运动不足且精力低下');
  }
  if (hasExerciseFrequency) confidencePoints += 8;
  if (hasEnergyLevel) confidencePoints += 7;

  // 5. 压力韧性（基于压力水平、医疗状况、药物）
  if (stressLevelValue !== null && stressLevelValue >= 8) {
    analysis.stress_resilience = 'low';
    analysis.risk_factors.push('高压力水平');
  } else if (profile.medical_conditions && profile.medical_conditions.includes('焦虑症')) {
    analysis.stress_resilience = 'low';
    analysis.risk_factors.push('焦虑症');
  } else if (stressLevelValue !== null && stressLevelValue <= 4) {
    analysis.stress_resilience = 'high';
    analysis.strengths.push('压力管理良好');
  }
  if (hasStressLevel) confidencePoints += 10;
  if (Array.isArray(profile.medical_conditions) && profile.medical_conditions.length > 0) confidencePoints += 3;
  if (Array.isArray(profile.medications) && profile.medications.length > 0) confidencePoints += 2;

  // 6. 其他风险因素
  if (smokingStatus && smokingStatus !== 'non_smoker' && smokingStatus !== 'ex_smoker') {
    analysis.risk_factors.push('吸烟');
  }
  if (alcoholIntake === '3+_week') {
    analysis.risk_factors.push('酒精摄入过多');
  }
  if (profile.medications && profile.medications.includes('抗焦虑药')) {
    analysis.risk_factors.push('正在服用抗焦虑药物');
  }
  if (smokingStatus) confidencePoints += 4;
  if (alcoholIntake) confidencePoints += 3;
  if (Array.isArray(profile.medications) && profile.medications.length > 0) confidencePoints += 3;

  // 6. 精力稳定性（基于精力水平、睡眠、咖啡因依赖）
  if (energyLevelValue !== null && energyLevelValue >= 7 && sleepHoursValue !== null && sleepHoursValue >= 7 && !isCaffeineHigh) {
    analysis.energy_stability = 'stable';
    analysis.strengths.push('精力稳定');
  } else if ((energyLevelValue !== null && energyLevelValue <= 4) || isCaffeineHigh || (sleepHoursValue !== null && sleepHoursValue < 6)) {
    analysis.energy_stability = 'unstable';
    analysis.risk_factors.push('精力不稳定');
  }
  if (hasEnergyLevel) confidencePoints += 4;
  if (hasSleepHours) confidencePoints += 3;
  if (caffeineIntake) confidencePoints += 3;

  // 7. 炎症风险（基于吸烟、酒精、压力、运动）
  let inflammationScore = 0;
  if (smokingStatus && smokingStatus !== 'non_smoker' && smokingStatus !== 'ex_smoker') inflammationScore += 2;
  if (alcoholIntake === '3+_week') inflammationScore += 1;
  if (stressLevelValue !== null && stressLevelValue >= 7) inflammationScore += 1;
  if (exerciseFrequency === 'rarely') inflammationScore += 1;
  
  if (inflammationScore >= 3) {
    analysis.inflammation_risk = 'high';
    analysis.risk_factors.push('高炎症风险');
  } else if (inflammationScore <= 1) {
    analysis.inflammation_risk = 'low';
    analysis.strengths.push('低炎症风险');
  }
  if (smokingStatus) confidencePoints += 3;
  if (alcoholIntake) confidencePoints += 2;
  if (hasStressLevel) confidencePoints += 3;
  if (hasExerciseFrequency) confidencePoints += 2;

  // 8. 激素平衡（基于睡眠、压力、体脂、运动）
  const goodSleep = sleepHoursValue !== null && sleepHoursValue >= 7 && sleepHoursValue <= 9;
  const lowStress = stressLevelValue !== null && stressLevelValue <= 5;
  const highStress = stressLevelValue !== null && stressLevelValue >= 8;
  const regularExercise =
    exerciseFrequency !== null && ['2-3_week', '4-5_week', '6-7_week'].includes(exerciseFrequency);
  
  if (goodSleep && lowStress && regularExercise) {
    analysis.hormonal_balance = 'balanced';
    analysis.strengths.push('激素平衡良好');
  } else if ((hasSleepHours && !goodSleep) || highStress) {
    analysis.hormonal_balance = 'imbalanced';
    analysis.risk_factors.push('激素可能失衡');
  }
  if (hasSleepHours) confidencePoints += 4;
  if (hasStressLevel) confidencePoints += 3;
  if (hasExerciseFrequency) confidencePoints += 3;

  // 9. 心血管健康（基于运动、体重、吸烟、酒精）
  const activeLifestyle = profile.activity_level && ['moderate', 'active'].includes(profile.activity_level);
  const noSmoking = smokingStatus === 'non_smoker' || smokingStatus === 'ex_smoker';
  const moderateAlcohol = !alcoholIntake || alcoholIntake !== '3+_week';
  
  if (activeLifestyle && noSmoking && moderateAlcohol && regularExercise) {
    analysis.cardiovascular_health = 'good';
    analysis.strengths.push('心血管状况良好');
  } else if (smokingStatus === 'regular' || profile.activity_level === 'sedentary') {
    analysis.cardiovascular_health = 'needs_attention';
    analysis.risk_factors.push('心血管需要关注');
  }
  if (profile.activity_level) confidencePoints += 4;
  if (smokingStatus) confidencePoints += 3;
  if (alcoholIntake) confidencePoints += 1;
  if (hasExerciseFrequency) confidencePoints += 2;

  // 10. 其他优势
  if (profile.exercise_types && profile.exercise_types.length >= 3) {
    analysis.strengths.push('运动类型多样化');
  }
  if (profile.meal_pattern === '规律三餐') {
    analysis.strengths.push('规律饮食');
  }

  analysis.confidence_score = Math.min(confidencePoints, maxPoints);

  // 添加置信度理由
  if (isNumber(profile.age) && isNumber(profile.height_cm) && isNumber(profile.weight_kg)) {
    analysis.confidence_reasons.push('已提供完整身体基础数据');
  }
  if (hasSleepHours) {
    analysis.confidence_reasons.push('已提供睡眠数据');
  }
  if (hasStressLevel) {
    analysis.confidence_reasons.push('已提供压力水平数据');
  }
  if (hasExerciseFrequency) {
    analysis.confidence_reasons.push('已提供运动习惯数据');
  }
  if (!isNumber(profile.age) || !isNumber(profile.height_cm)) {
    analysis.confidence_reasons.push('缺少部分基础数据影响分析准确性');
  }

  // 添加每个指标的详细分析（中英文）
  analysis.analysis_details = {
    metabolic_rate_estimate: {
      reason: `基于您的${profile.age ? `${profile.age}岁年龄` : '年龄信息'}、${profile.activity_level || '活动水平'}和BMI计算`,
      reason_en: `Based on your ${profile.age ? `age (${profile.age})` : 'age'}, ${profile.activity_level || 'activity level'}, and BMI calculation`,
      target: '提升至"较高"以优化能量消耗效率',
      target_en: 'Improve to "High" to optimize energy expenditure efficiency'
    },
    cortisol_pattern: {
      reason: `根据您的压力水平${profile.stress_level ? `(${profile.stress_level}/10)` : ''}、睡眠时长${profile.sleep_hours ? `(${profile.sleep_hours}小时)` : ''}和咖啡因摄入评估`,
      reason_en: `Based on your stress level${profile.stress_level ? ` (${profile.stress_level}/10)` : ''}, sleep duration${profile.sleep_hours ? ` (${profile.sleep_hours} hours)` : ''}, and caffeine intake`,
      target: '维持"正常"水平，避免升高',
      target_en: 'Maintain "Normal" level, avoid elevation'
    },
    sleep_quality: {
      reason: `基于每日${profile.sleep_hours || '未知'}小时睡眠时长的评估`,
      reason_en: `Based on ${profile.sleep_hours || 'unknown'} hours of daily sleep duration`,
      target: '达到"良好"，每晚7-9小时深度睡眠',
      target_en: 'Achieve "Good" with 7-9 hours of deep sleep per night'
    },
    recovery_capacity: {
      reason: `综合运动频率${profile.exercise_frequency ? `"${profile.exercise_frequency}"` : ''}和精力水平${profile.energy_level ? `(${profile.energy_level}/10)` : ''}`,
      reason_en: `Based on exercise frequency${profile.exercise_frequency ? ` "${profile.exercise_frequency}"` : ''} and energy level${profile.energy_level ? ` (${profile.energy_level}/10)` : ''}`,
      target: '提升至"较高"以增强身体适应能力',
      target_en: 'Improve to "High" to enhance physical adaptability'
    },
    stress_resilience: {
      reason: `根据压力水平${profile.stress_level ? `(${profile.stress_level}/10)` : ''}和生活方式评估`,
      reason_en: `Based on stress level${profile.stress_level ? ` (${profile.stress_level}/10)` : ''} and lifestyle assessment`,
      target: '提升至"较高"以增强抗压能力',
      target_en: 'Improve to "High" to enhance stress resistance'
    },
    energy_stability: {
      reason: `综合精力水平${profile.energy_level ? `(${profile.energy_level}/10)` : ''}、睡眠质量和咖啡因依赖分析`,
      reason_en: `Based on energy level${profile.energy_level ? ` (${profile.energy_level}/10)` : ''}, sleep quality, and caffeine dependency analysis`,
      target: '达到"稳定"，全天保持均衡精力',
      target_en: 'Achieve "Stable" with consistent energy throughout the day'
    },
    inflammation_risk: {
      reason: `基于吸烟状况"${profile.smoking_status || '未知'}"、酒精摄入和运动习惯评估`,
      reason_en: `Based on smoking status "${profile.smoking_status || 'unknown'}", alcohol intake, and exercise habits`,
      target: '降低至"低"风险水平',
      target_en: 'Reduce to "Low" risk level'
    },
    hormonal_balance: {
      reason: `综合睡眠、压力和运动规律性分析`,
      reason_en: `Based on sleep, stress, and exercise regularity analysis`,
      target: '达到"平衡"状态',
      target_en: 'Achieve "Balanced" state'
    },
    cardiovascular_health: {
      reason: `基于活动水平"${profile.activity_level || '未知'}"、吸烟状况和运动频率综合评估`,
      reason_en: `Based on activity level "${profile.activity_level || 'unknown'}", smoking status, and exercise frequency`,
      target: '提升至"良好"水平',
      target_en: 'Improve to "Good" level'
    }
  };

  // 添加英文版本的strengths和risk_factors
  analysis.strengths_en = analysis.strengths.map(s => {
    const translations: Record<string, string> = {
      '代谢能力良好': 'Good metabolic capacity',
      '睡眠充足': 'Adequate sleep',
      '睡眠质量良好': 'Good sleep quality',
      '运动习惯良好': 'Good exercise habits',
      '压力管理良好': 'Good stress management',
      '精力稳定': 'Stable energy',
      '低炎症风险': 'Low inflammation risk',
      '激素平衡良好': 'Good hormonal balance',
      '心血管状况良好': 'Good cardiovascular health',
      '运动类型多样化': 'Diverse exercise types',
      '规律饮食': 'Regular eating patterns'
    };
    return translations[s] || s;
  });

  analysis.risk_factors_en = analysis.risk_factors.map(r => {
    const translations: Record<string, string> = {
      '代谢率偏低': 'Low metabolic rate',
      '压力激素可能偏高': 'Stress hormones may be elevated',
      '睡眠不足': 'Insufficient sleep',
      '睡眠质量差': 'Poor sleep quality',
      '高压力水平': 'High stress level',
      '焦虑症': 'Anxiety disorder',
      '吸烟': 'Smoking',
      '酒精摄入过多': 'Excessive alcohol intake',
      '正在服用抗焦虑药物': 'Taking anti-anxiety medication',
      '精力不稳定': 'Unstable energy',
      '高炎症风险': 'High inflammation risk',
      '激素可能失衡': 'Possible hormonal imbalance',
      '心血管需要关注': 'Cardiovascular needs attention'
    };
    return translations[r] || r;
  });

  analysis.confidence_reasons_en = analysis.confidence_reasons.map(r => {
    const translations: Record<string, string> = {
      '已提供完整身体基础数据': 'Complete basic physical data provided',
      '已提供睡眠数据': 'Sleep data provided',
      '已提供压力水平数据': 'Stress level data provided',
      '已提供运动习惯数据': 'Exercise habit data provided',
      '缺少部分基础数据影响分析准确性': 'Missing some basic data affects analysis accuracy'
    };
    return translations[r] || r;
  });

  return analysis;
}

/**
 * 生成推荐方案（基于分析结果和平台理念）
 */
export function generateRecommendationPlan(
  profile: UserProfile,
  analysis: PhysiologicalAnalysis
): RecommendationPlan {
  const plan: RecommendationPlan = {
    core_principles: [],
    micro_habits: [],
    avoidance_behaviors: [],
    monitoring_approach: '',
    expected_timeline: '',
  };

  // 核心原则（基于平台理念）
  plan.core_principles = [
    '不刻意打卡，关注生理信号而非数字',
    '接受新陈代谢的生理性衰退，专注于可控的反应',
    '通过解决焦虑（领先指标）来改善身体机能（滞后指标）',
    '建立最低有效剂量的微习惯，而非高强度计划',
  ];

  // 根据代谢困扰生成针对性微习惯（优先级最高）
  if (profile.metabolic_concerns && profile.metabolic_concerns.length > 0) {
    profile.metabolic_concerns.forEach(concern => {
      switch (concern) {
        case 'easy_fatigue':
          plan.micro_habits.push({
            name: 'Zone 2有氧运动',
            name_en: 'Zone 2 Aerobic Exercise',
            cue: '每天早晨或下午精力较好时',
            cue_en: 'Morning or afternoon when energy is good',
            response: '进行30分钟低心率有氧运动（60-70%最大心率）',
            response_en: '30-minute low heart rate aerobic exercise (60-70% max HR)',
            timing: '每日',
            timing_en: 'Daily',
            rationale: '提升线粒体功能，增加ATP生成。研究显示8-12周可提升基础代谢率5-10%（Cabo et al. 2024）',
            rationale_en: 'Enhance mitochondrial function and ATP production. Studies show 5-10% BMR increase in 8-12 weeks (Cabo et al. 2024)',
          });
          break;
        
        case 'belly_fat':
          plan.micro_habits.push({
            name: '16:8间歇性禁食',
            name_en: '16:8 Intermittent Fasting',
            cue: '每天晚上8点后',
            cue_en: 'After 8 PM daily',
            response: '停止进食，只喝水或无糖茶，直到次日中午12点',
            response_en: 'Stop eating, only water or unsweetened tea until 12 PM next day',
            timing: '每日',
            timing_en: 'Daily',
            rationale: '抑制IL-17/TNF炎症通路，改善胰岛素敏感性20-30%。研究显示可减少内脏脂肪积累（Kwon et al. 2019）',
            rationale_en: 'Suppress IL-17/TNF pathway, improve insulin sensitivity 20-30%. Reduces visceral fat (Kwon et al. 2019)',
          });
          plan.micro_habits.push({
            name: '抗炎食物摄入',
            name_en: 'Anti-inflammatory Foods',
            cue: '每日午餐和晚餐',
            cue_en: 'Lunch and dinner daily',
            response: '摄入深海鱼（Omega-3）或绿茶（多酚）',
            response_en: 'Consume fatty fish (Omega-3) or green tea (polyphenols)',
            timing: '随餐',
            timing_en: 'With meals',
            rationale: '降低炎症标志物（CRP、IL-6）20-30%（Izadi et al. 2024）',
            rationale_en: 'Reduce inflammatory markers (CRP, IL-6) by 20-30% (Izadi et al. 2024)',
          });
          break;
        
        case 'muscle_loss':
          plan.micro_habits.push({
            name: '抗阻训练',
            name_en: 'Resistance Training',
            cue: '每周一、三、五',
            cue_en: 'Monday, Wednesday, Friday',
            response: '进行自重深蹲或俯卧撑（3组×8-12次）',
            response_en: 'Bodyweight squats or push-ups (3 sets × 8-12 reps)',
            timing: '每周3次',
            timing_en: '3 times per week',
            rationale: '对抗肌少症，每周3-4次抗阻训练可提升基础代谢率5-8%。30岁后每年流失1-2%肌肉量（Chen & Wu 2024）',
            rationale_en: 'Counter sarcopenia, 3-4 sessions/week can boost BMR 5-8%. Prevent 1-2% muscle loss per year after 30 (Chen & Wu 2024)',
          });
          plan.micro_habits.push({
            name: '优质蛋白补充',
            name_en: 'Quality Protein Intake',
            cue: '早餐或运动后30分钟内',
            cue_en: 'Breakfast or within 30 min post-workout',
            response: '摄入20-30g优质蛋白（鸡蛋、乳清蛋白）',
            response_en: '20-30g quality protein (eggs, whey protein)',
            timing: '每日早餐/练后',
            timing_en: 'Daily breakfast/post-workout',
            rationale: '亮氨酸激活mTOR通路，促进肌肉蛋白合成（Deng et al. 2024）',
            rationale_en: 'Leucine activates mTOR pathway for muscle protein synthesis (Deng et al. 2024)',
          });
          break;
        
        case 'slow_recovery':
          plan.micro_habits.push({
            name: '主动恢复',
            name_en: 'Active Recovery',
            cue: '运动后或疲劳时',
            cue_en: 'Post-exercise or when fatigued',
            response: '进行10-15分钟轻度有氧运动或拉伸',
            response_en: '10-15 min light aerobic or stretching',
            timing: '运动后',
            timing_en: 'After exercise',
            rationale: '促进血液循环，加速代谢废物清除。配合冷热交替浴效果更佳',
            rationale_en: 'Enhance circulation, accelerate metabolic waste removal. Contrast baths amplify effects',
          });
          plan.micro_habits.push({
            name: 'Omega-3补充',
            name_en: 'Omega-3 Supplementation',
            cue: '每日午餐或晚餐',
            cue_en: 'Lunch or dinner daily',
            response: '摄入1-2g EPA+DHA（深海鱼或鱼油）',
            response_en: '1-2g EPA+DHA (fatty fish or fish oil)',
            timing: '随餐',
            timing_en: 'With meals',
            rationale: '减少氧化应激，改善线粒体功能，降低炎症标志物20-30%',
            rationale_en: 'Reduce oxidative stress, improve mitochondrial function, lower inflammation 20-30%',
          });
          break;
        
        case 'carb_cravings':
          plan.micro_habits.push({
            name: '低GI饮食',
            name_en: 'Low-GI Diet',
            cue: '每日三餐',
            cue_en: 'All meals',
            response: '选择低GI食物（全谷物、蔬菜），避免精制碳水',
            response_en: 'Choose low-GI foods (whole grains, vegetables), avoid refined carbs',
            timing: '每餐',
            timing_en: 'Every meal',
            rationale: '稳定血糖，逆转代谢重编程。配合16:8禁食可优化RER（呼吸交换率）',
            rationale_en: 'Stabilize blood sugar, reverse metabolic reprogramming. Combined with 16:8 fasting optimizes RER',
          });
          plan.micro_habits.push({
            name: '规律进餐',
            name_en: 'Regular Meal Timing',
            cue: '每3-4小时',
            cue_en: 'Every 3-4 hours',
            response: '小份餐食，避免长时间空腹后暴食',
            response_en: 'Small portions, avoid binge eating after long fasting',
            timing: '每日',
            timing_en: 'Daily',
            rationale: '维持能量稳定性，防止血糖波动。短暂户外活动可快速恢复精力',
            rationale_en: 'Maintain energy stability, prevent blood sugar fluctuations. Brief outdoor activity restores energy quickly',
          });
          break;
      }
    });
  }

  // 根据分析结果生成微习惯
  if (analysis.cortisol_pattern === 'elevated') {
    plan.micro_habits.push({
      name: '压力激素代谢',
      name_en: 'Stress Hormone Metabolism',
      cue: '感到焦虑或压力上升时',
      cue_en: 'When feeling anxious or stress rising',
      response: '进行5分钟步行或深呼吸',
      response_en: 'Take a 5-minute walk or deep breathing',
      timing: '随时',
      timing_en: 'Anytime',
      rationale: '及时代谢升高的皮质醇，防止压力累积',
      rationale_en: 'Metabolize elevated cortisol promptly to prevent stress accumulation',
    });
  }

  if (analysis.sleep_quality === 'poor') {
    plan.micro_habits.push({
      name: '睡眠信号优化',
      name_en: 'Sleep Signal Optimization',
      cue: '晚上9点后',
      cue_en: 'After 9 PM',
      response: '调暗灯光，停止使用电子设备',
      response_en: 'Dim lights and stop using electronic devices',
      timing: '睡前1-2小时',
      timing_en: '1-2 hours before bed',
      rationale: '改善褪黑素分泌，提升睡眠质量',
      rationale_en: 'Improve melatonin secretion and sleep quality',
    });
  }

  if (analysis.recovery_capacity === 'low') {
    plan.micro_habits.push({
      name: '最低有效运动',
      name_en: 'Minimum Effective Exercise',
      cue: '感到精力不足时',
      cue_en: 'When feeling low energy',
      response: '进行10分钟轻度运动（如拉伸、慢走）',
      response_en: 'Do 10 minutes of light exercise (stretching or slow walking)',
      timing: '根据精力水平',
      timing_en: 'Based on energy level',
      rationale: '不增加负担，但保持运动习惯的连续性',
      rationale_en: 'Maintain exercise continuity without adding burden',
    });
  }

  // 避免的行为
  if (analysis.cortisol_pattern === 'elevated') {
    plan.avoidance_behaviors.push('避免在压力高时进行高强度运动');
    plan.avoidance_behaviors.push('避免下午3点后摄入咖啡因');
  }

  if (analysis.sleep_quality === 'poor') {
    plan.avoidance_behaviors.push('避免睡前2小时内进食');
    plan.avoidance_behaviors.push('避免在床上使用电子设备');
  }

  // 监控方式
  plan.monitoring_approach = '不记录打卡天数，而是每次行动后评估"这对我有帮助吗？"（1-10分）。关注信念强度而非完成率。';

  // 预期时间线
  plan.expected_timeline = '2-4周内建立微习惯，3-6个月看到生理改善。不追求快速变化，关注长期可持续性。';

  return plan;
}

/**
 * 保存分析结果到数据库
 */
export async function saveAnalysisToDatabase(
  userId: string,
  analysis: PhysiologicalAnalysis,
  plan: RecommendationPlan
) {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from('profiles')
    .update({
      ai_analysis_result: analysis,
      ai_recommendation_plan: plan,
    })
    .eq('id', userId);

  if (error) {
    console.error('保存分析结果时出错:', error);
    throw error;
  }
}

/**
 * 完整的分析流程
 */
export async function analyzeUserProfileAndSave(profile: UserProfile) {
  const analysis = analyzeUserProfile(profile);
  const plan = generateRecommendationPlan(profile, analysis);
  
  await saveAnalysisToDatabase(profile.id, analysis, plan);
  
  return { analysis, plan };
}
