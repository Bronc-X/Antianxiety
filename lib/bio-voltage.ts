/**
 * Bio-Voltage Recommendation Service
 * 基于道家内丹和迷走神经理论的能量调节推荐系统
 */

export type BioVoltageTechnique = 'six_healing_sounds' | 'zhan_zhuang' | 'box_breathing';

export interface BioVoltageRecommendation {
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  technique: BioVoltageTechnique;
  duration_minutes: number;
  icon: string;
}

/**
 * 根据压力和能量水平获取 Bio-Voltage 推荐
 * @param stressLevel 压力水平 (0-10)
 * @param energyLevel 能量水平 (0-10)
 */
export function getBioVoltageRecommendation(
  stressLevel: number,
  energyLevel: number = 5
): BioVoltageRecommendation {
  // 高压力: 六字诀 - 释放多余噪音
  if (stressLevel > 7) {
    return {
      title: 'Six Healing Sounds',
      titleZh: '六字诀',
      description: 'Discharge excess noise',
      descriptionZh: '释放多余噪音',
      technique: 'six_healing_sounds',
      duration_minutes: 5,
      icon: '🌬️'
    };
  }
  
  // 低压力或低能量: 站桩 - 接地充能
  if (stressLevel < 4 || energyLevel < 4) {
    return {
      title: 'Standing Meditation',
      titleZh: '站桩',
      description: 'Grounding to recharge',
      descriptionZh: '接地充能',
      technique: 'zhan_zhuang',
      duration_minutes: 10,
      icon: '🧘'
    };
  }
  
  // 默认: 箱式呼吸 - 维持平衡
  return {
    title: 'Box Breathing',
    titleZh: '箱式呼吸',
    description: 'Maintain equilibrium',
    descriptionZh: '维持平衡',
    technique: 'box_breathing',
    duration_minutes: 3,
    icon: '🫁'
  };
}

/**
 * 获取技术的详细说明
 */
export function getTechniqueDetails(technique: BioVoltageTechnique): {
  steps: string[];
  stepsZh: string[];
  benefits: string[];
} {
  const details: Record<BioVoltageTechnique, { steps: string[]; stepsZh: string[]; benefits: string[] }> = {
    six_healing_sounds: {
      steps: [
        'Inhale deeply through nose',
        'Exhale with "Xu" sound for liver',
        'Exhale with "He" sound for heart',
        'Repeat 6 times each'
      ],
      stepsZh: [
        '用鼻子深吸气',
        '发"嘘"音呼气（肝）',
        '发"呵"音呼气（心）',
        '每个音重复6次'
      ],
      benefits: ['Releases tension', 'Balances organ energy', 'Calms nervous system']
    },
    zhan_zhuang: {
      steps: [
        'Stand with feet shoulder-width apart',
        'Slightly bend knees',
        'Hold arms as if hugging a tree',
        'Breathe naturally for 10 minutes'
      ],
      stepsZh: [
        '双脚与肩同宽站立',
        '膝盖微曲',
        '双臂环抱如抱树',
        '自然呼吸10分钟'
      ],
      benefits: ['Grounds energy', 'Builds internal strength', 'Improves focus']
    },
    box_breathing: {
      steps: [
        'Inhale for 4 seconds',
        'Hold for 4 seconds',
        'Exhale for 4 seconds',
        'Hold for 4 seconds'
      ],
      stepsZh: [
        '吸气4秒',
        '屏息4秒',
        '呼气4秒',
        '屏息4秒'
      ],
      benefits: ['Activates parasympathetic', 'Reduces anxiety', 'Improves HRV']
    }
  };
  
  return details[technique];
}
