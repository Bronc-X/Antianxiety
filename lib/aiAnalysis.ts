import { createServerSupabaseClient } from './supabase-server';

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
    cue: string;
    response: string;
    timing: string;
    rationale: string;
  }>;
  avoidance_behaviors: string[];
  monitoring_approach: string;
  expected_timeline: string;
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

  // 1. 代谢率评估（基于年龄、性别、活动水平、BMI）
  if (profile.age && profile.height_cm && profile.weight_kg) {
    const bmi = profile.weight_kg / Math.pow(profile.height_cm / 100, 2);
    const ageFactor = profile.age > 40 ? -1 : profile.age > 30 ? 0 : 1;
    const activityFactor = profile.exercise_frequency === '每周4-5次' || profile.exercise_frequency === '每周6-7次' ? 1 :
                          profile.exercise_frequency === '每周2-3次' ? 0 : -1;
    
    if (bmi > 25 && ageFactor <= 0 && activityFactor <= 0) {
      analysis.metabolic_rate_estimate = 'low';
    } else if (bmi < 20 && activityFactor >= 0) {
      analysis.metabolic_rate_estimate = 'high';
    }
    confidencePoints += 15;
  }

  // 2. 皮质醇模式（基于压力水平、睡眠、咖啡因、运动）
  const stressScore = profile.stress_level || 5;
  const sleepScore = profile.sleep_hours ? (profile.sleep_hours >= 7 && profile.sleep_hours <= 9 ? 0 : -1) : 0;
  const caffeineScore = profile.caffeine_intake === '每天4杯以上' ? 1 : profile.caffeine_intake === '每天2-3杯' ? 0.5 : 0;
  
  if (stressScore >= 7 || sleepScore < 0 || caffeineScore >= 1) {
    analysis.cortisol_pattern = 'elevated';
  } else if (stressScore <= 3 && sleepScore === 0 && caffeineScore === 0) {
    analysis.cortisol_pattern = 'low';
  }
  confidencePoints += 20;

  // 3. 睡眠质量
  if (profile.sleep_hours) {
    if (profile.sleep_hours < 6) {
      analysis.sleep_quality = 'poor';
      analysis.risk_factors.push('睡眠不足');
    } else if (profile.sleep_hours >= 7 && profile.sleep_hours <= 9) {
      analysis.sleep_quality = 'good';
      analysis.strengths.push('睡眠时长充足');
    } else {
      analysis.sleep_quality = 'fair';
    }
    confidencePoints += 15;
  }

  // 4. 恢复能力（基于运动频率、时长、精力水平）
  const exerciseScore = profile.exercise_frequency === '每周4-5次' || profile.exercise_frequency === '每周6-7次' ? 1 :
                       profile.exercise_frequency === '每周2-3次' ? 0 : -1;
  const energyScore = (profile.energy_level || 5) >= 7 ? 1 : (profile.energy_level || 5) <= 4 ? -1 : 0;
  
  if (exerciseScore >= 0 && energyScore >= 0) {
    analysis.recovery_capacity = 'high';
    analysis.strengths.push('良好的运动习惯');
  } else if (exerciseScore < 0 && energyScore < 0) {
    analysis.recovery_capacity = 'low';
    analysis.risk_factors.push('运动不足且精力低下');
  }
  confidencePoints += 15;

  // 5. 压力韧性（基于压力水平、医疗状况、药物）
  if (profile.stress_level && profile.stress_level >= 8) {
    analysis.stress_resilience = 'low';
    analysis.risk_factors.push('高压力水平');
  } else if (profile.medical_conditions && profile.medical_conditions.includes('焦虑症')) {
    analysis.stress_resilience = 'low';
    analysis.risk_factors.push('焦虑症');
  } else if (profile.stress_level && profile.stress_level <= 4) {
    analysis.stress_resilience = 'high';
    analysis.strengths.push('压力管理良好');
  }
  confidencePoints += 15;

  // 6. 其他风险因素
  if (profile.smoking_status && profile.smoking_status !== '不吸烟' && profile.smoking_status !== '已戒烟') {
    analysis.risk_factors.push('吸烟');
  }
  if (profile.alcohol_intake && profile.alcohol_intake === '每周3次以上') {
    analysis.risk_factors.push('酒精摄入过多');
  }
  if (profile.medications && profile.medications.includes('抗焦虑药')) {
    analysis.risk_factors.push('正在服用抗焦虑药物');
  }
  confidencePoints += 10;

  // 6. 精力稳定性（基于精力水平、睡眠、咖啡因依赖）
  const energyLevel = profile.energy_level || 5;
  const caffeineHigh = profile.caffeine_intake === '每天4杯以上';
  
  if (energyLevel >= 7 && profile.sleep_hours && profile.sleep_hours >= 7 && !caffeineHigh) {
    analysis.energy_stability = 'stable';
    analysis.strengths.push('精力稳定');
  } else if (energyLevel <= 4 || caffeineHigh || (profile.sleep_hours && profile.sleep_hours < 6)) {
    analysis.energy_stability = 'unstable';
    analysis.risk_factors.push('精力不稳定');
  }
  confidencePoints += 10;

  // 7. 炎症风险（基于吸烟、酒精、压力、运动）
  let inflammationScore = 0;
  if (profile.smoking_status && profile.smoking_status !== 'non_smoker' && profile.smoking_status !== 'ex_smoker') inflammationScore += 2;
  if (profile.alcohol_intake === '3+_week') inflammationScore += 1;
  if (profile.stress_level && profile.stress_level >= 7) inflammationScore += 1;
  if (profile.exercise_frequency === 'rarely') inflammationScore += 1;
  
  if (inflammationScore >= 3) {
    analysis.inflammation_risk = 'high';
    analysis.risk_factors.push('高炎症风险');
  } else if (inflammationScore <= 1) {
    analysis.inflammation_risk = 'low';
    analysis.strengths.push('低炎症风险');
  }
  confidencePoints += 10;

  // 8. 激素平衡（基于睡眠、压力、体脂、运动）
  const goodSleep = profile.sleep_hours && profile.sleep_hours >= 7 && profile.sleep_hours <= 9;
  const lowStress = profile.stress_level && profile.stress_level <= 5;
  const regularExercise = profile.exercise_frequency && ['2-3_week', '4-5_week', '6-7_week'].includes(profile.exercise_frequency);
  
  if (goodSleep && lowStress && regularExercise) {
    analysis.hormonal_balance = 'balanced';
    analysis.strengths.push('激素平衡良好');
  } else if (!goodSleep || (profile.stress_level && profile.stress_level >= 8)) {
    analysis.hormonal_balance = 'imbalanced';
    analysis.risk_factors.push('激素可能失衡');
  }
  confidencePoints += 10;

  // 9. 心血管健康（基于运动、体重、吸烟、酒精）
  const activeLifestyle = profile.activity_level && ['moderate', 'active'].includes(profile.activity_level);
  const noSmoking = profile.smoking_status === 'non_smoker' || profile.smoking_status === 'ex_smoker';
  const moderateAlcohol = !profile.alcohol_intake || profile.alcohol_intake !== '3+_week';
  
  if (activeLifestyle && noSmoking && moderateAlcohol && regularExercise) {
    analysis.cardiovascular_health = 'good';
    analysis.strengths.push('心血管状况良好');
  } else if (profile.smoking_status === 'regular' || profile.activity_level === 'sedentary') {
    analysis.cardiovascular_health = 'needs_attention';
    analysis.risk_factors.push('心血管需要关注');
  }
  confidencePoints += 10;

  // 10. 其他优势
  if (profile.exercise_types && profile.exercise_types.length >= 3) {
    analysis.strengths.push('运动类型多样化');
  }
  if (profile.meal_pattern === '规律三餐') {
    analysis.strengths.push('规律饮食');
  }

  analysis.confidence_score = Math.min(confidencePoints, maxPoints);

  // 添加置信度理由
  if (profile.age && profile.height_cm && profile.weight_kg) {
    analysis.confidence_reasons.push('已提供完整身体基础数据');
  }
  if (profile.sleep_hours) {
    analysis.confidence_reasons.push('已提供睡眠数据');
  }
  if (profile.stress_level) {
    analysis.confidence_reasons.push('已提供压力水平数据');
  }
  if (profile.exercise_frequency) {
    analysis.confidence_reasons.push('已提供运动习惯数据');
  }
  if (!profile.age || !profile.height_cm) {
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

  // 根据分析结果生成微习惯
  if (analysis.cortisol_pattern === 'elevated') {
    plan.micro_habits.push({
      name: '压力激素代谢',
      cue: '感到焦虑或压力上升时',
      response: '进行5分钟步行或深呼吸',
      timing: '随时',
      rationale: '及时代谢升高的皮质醇，防止压力累积',
    });
  }

  if (analysis.sleep_quality === 'poor') {
    plan.micro_habits.push({
      name: '睡眠信号优化',
      cue: '晚上9点后',
      response: '调暗灯光，停止使用电子设备',
      timing: '睡前1-2小时',
      rationale: '改善褪黑素分泌，提升睡眠质量',
    });
  }

  if (analysis.recovery_capacity === 'low') {
    plan.micro_habits.push({
      name: '最低有效运动',
      cue: '感到精力不足时',
      response: '进行10分钟轻度运动（如拉伸、慢走）',
      timing: '根据精力水平',
      rationale: '不增加负担，但保持运动习惯的连续性',
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

