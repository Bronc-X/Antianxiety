/**
 * Plan Item Replacer for Max Plan Creation
 * 
 * 生成同类别不同内容的替换计划项
 * 确保替换项与原项类别相同但内容不同
 * 
 * @module lib/max/plan-replacer
 */

import type {
  PlanItemDraft,
  PlanCategory,
  DifficultyLevel,
} from '@/types/max-plan';

// ============================================
// 替换项模板库
// ============================================

interface ReplacementTemplate {
  title: string;
  action: string;
  rationale: string;
  difficulty: DifficultyLevel;
}

const REPLACEMENT_TEMPLATES: Record<PlanCategory, Record<'zh' | 'en', ReplacementTemplate[]>> = {
  sleep: {
    zh: [
      {
        title: '睡前仪式',
        action: '睡前 30 分钟进行轻度拉伸和深呼吸',
        rationale: '放松肌肉紧张，促进副交感神经激活',
        difficulty: 'easy',
      },
      {
        title: '光照管理',
        action: '睡前 1 小时调暗室内灯光，使用暖色光源',
        rationale: '减少蓝光干扰，促进褪黑素自然分泌',
        difficulty: 'easy',
      },
      {
        title: '温度调节',
        action: '保持卧室温度在 18-20°C，使用透气床品',
        rationale: '适宜温度有助于深度睡眠阶段的进入',
        difficulty: 'medium',
      },
      {
        title: '睡眠日记',
        action: '每天记录入睡时间、醒来次数和睡眠质量',
        rationale: '自我监测是改善睡眠的第一步',
        difficulty: 'easy',
      },
      {
        title: '咖啡因管理',
        action: '下午 2 点后避免咖啡、茶和含咖啡因饮料',
        rationale: '咖啡因半衰期约 6 小时，影响入睡',
        difficulty: 'medium',
      },
    ],
    en: [
      {
        title: 'Bedtime Ritual',
        action: 'Do light stretching and deep breathing 30 minutes before bed',
        rationale: 'Relaxes muscle tension, activates parasympathetic system',
        difficulty: 'easy',
      },
      {
        title: 'Light Management',
        action: 'Dim lights 1 hour before bed, use warm light sources',
        rationale: 'Reduces blue light interference, promotes natural melatonin',
        difficulty: 'easy',
      },
      {
        title: 'Temperature Control',
        action: 'Keep bedroom at 18-20°C, use breathable bedding',
        rationale: 'Optimal temperature helps enter deep sleep stages',
        difficulty: 'medium',
      },
      {
        title: 'Sleep Journal',
        action: 'Record sleep time, wake-ups, and quality daily',
        rationale: 'Self-monitoring is the first step to better sleep',
        difficulty: 'easy',
      },
      {
        title: 'Caffeine Management',
        action: 'Avoid coffee, tea, and caffeinated drinks after 2 PM',
        rationale: 'Caffeine has ~6 hour half-life, affects falling asleep',
        difficulty: 'medium',
      },
    ],
  },
  stress: {
    zh: [
      {
        title: '箱式呼吸',
        action: '每天练习 5 分钟箱式呼吸（吸4秒-屏4秒-呼4秒-屏4秒）',
        rationale: '激活迷走神经，快速降低皮质醇水平',
        difficulty: 'easy',
      },
      {
        title: '正念散步',
        action: '每天进行 15 分钟户外正念散步，专注于感官体验',
        rationale: '结合运动和正念，双重减压效果',
        difficulty: 'easy',
      },
      {
        title: '边界设定',
        action: '每天设定 1 小时"无打扰时间"，关闭通知',
        rationale: '减少信息过载，恢复注意力资源',
        difficulty: 'medium',
      },
      {
        title: '渐进放松',
        action: '睡前进行 10 分钟渐进式肌肉放松',
        rationale: '系统性释放身体紧张，促进深度放松',
        difficulty: 'easy',
      },
      {
        title: '压力日志',
        action: '每天记录压力事件和应对方式',
        rationale: '提高压力觉察，识别触发因素',
        difficulty: 'easy',
      },
    ],
    en: [
      {
        title: 'Box Breathing',
        action: 'Practice 5 min box breathing daily (inhale 4s-hold 4s-exhale 4s-hold 4s)',
        rationale: 'Activates vagus nerve, rapidly lowers cortisol',
        difficulty: 'easy',
      },
      {
        title: 'Mindful Walking',
        action: 'Take a 15-minute outdoor mindful walk, focus on sensory experience',
        rationale: 'Combines exercise and mindfulness for dual stress relief',
        difficulty: 'easy',
      },
      {
        title: 'Boundary Setting',
        action: 'Set 1 hour of "do not disturb" time daily, turn off notifications',
        rationale: 'Reduces information overload, restores attention resources',
        difficulty: 'medium',
      },
      {
        title: 'Progressive Relaxation',
        action: 'Do 10 minutes of progressive muscle relaxation before bed',
        rationale: 'Systematically releases body tension, promotes deep relaxation',
        difficulty: 'easy',
      },
      {
        title: 'Stress Journal',
        action: 'Record stress events and coping strategies daily',
        rationale: 'Increases stress awareness, identifies triggers',
        difficulty: 'easy',
      },
    ],
  },
  fitness: {
    zh: [
      {
        title: '晨间拉伸',
        action: '每天早起后进行 10 分钟全身拉伸',
        rationale: '唤醒身体，提高一天的活力水平',
        difficulty: 'easy',
      },
      {
        title: '快走运动',
        action: '每天进行 20 分钟快走，保持心率在 100-120',
        rationale: '低强度有氧运动，适合初学者',
        difficulty: 'easy',
      },
      {
        title: '力量训练',
        action: '每周 3 次，每次 20 分钟自重训练',
        rationale: '增强肌肉力量，提高基础代谢',
        difficulty: 'medium',
      },
      {
        title: '瑜伽练习',
        action: '每周 2-3 次，每次 30 分钟温和瑜伽',
        rationale: '提高柔韧性，减轻身心压力',
        difficulty: 'medium',
      },
      {
        title: '站立办公',
        action: '每小时站立活动 5 分钟，做简单伸展',
        rationale: '打断久坐，改善血液循环',
        difficulty: 'easy',
      },
    ],
    en: [
      {
        title: 'Morning Stretch',
        action: 'Do 10 minutes of full-body stretching after waking up',
        rationale: 'Awakens the body, improves daily energy levels',
        difficulty: 'easy',
      },
      {
        title: 'Brisk Walking',
        action: 'Walk briskly for 20 minutes daily, keep heart rate at 100-120',
        rationale: 'Low-intensity cardio, suitable for beginners',
        difficulty: 'easy',
      },
      {
        title: 'Strength Training',
        action: '3 times per week, 20 minutes of bodyweight exercises',
        rationale: 'Builds muscle strength, increases basal metabolism',
        difficulty: 'medium',
      },
      {
        title: 'Yoga Practice',
        action: '2-3 times per week, 30 minutes of gentle yoga',
        rationale: 'Improves flexibility, reduces physical and mental stress',
        difficulty: 'medium',
      },
      {
        title: 'Standing Breaks',
        action: 'Stand and move for 5 minutes every hour, do simple stretches',
        rationale: 'Breaks sedentary behavior, improves circulation',
        difficulty: 'easy',
      },
    ],
  },
  nutrition: {
    zh: [
      {
        title: '早餐蛋白',
        action: '每天早餐包含至少 20g 蛋白质',
        rationale: '稳定血糖，提供持久能量',
        difficulty: 'medium',
      },
      {
        title: '彩虹蔬菜',
        action: '每天摄入 5 种不同颜色的蔬菜',
        rationale: '多样化植物营养素，增强抗氧化能力',
        difficulty: 'medium',
      },
      {
        title: '水分补充',
        action: '每天饮用 8 杯水，分散在全天',
        rationale: '维持身体水合，支持代谢功能',
        difficulty: 'easy',
      },
      {
        title: '减少加工',
        action: '每周减少 2 次加工食品摄入',
        rationale: '降低炎症因子，改善肠道健康',
        difficulty: 'medium',
      },
      {
        title: '正念进食',
        action: '每餐专注进食，细嚼慢咽至少 20 分钟',
        rationale: '提高饱腹感知，避免过量进食',
        difficulty: 'easy',
      },
    ],
    en: [
      {
        title: 'Breakfast Protein',
        action: 'Include at least 20g protein in breakfast daily',
        rationale: 'Stabilizes blood sugar, provides sustained energy',
        difficulty: 'medium',
      },
      {
        title: 'Rainbow Vegetables',
        action: 'Eat 5 different colored vegetables daily',
        rationale: 'Diverse phytonutrients, enhanced antioxidant capacity',
        difficulty: 'medium',
      },
      {
        title: 'Hydration',
        action: 'Drink 8 glasses of water daily, spread throughout the day',
        rationale: 'Maintains hydration, supports metabolic function',
        difficulty: 'easy',
      },
      {
        title: 'Reduce Processed',
        action: 'Reduce processed food intake by 2 times per week',
        rationale: 'Lowers inflammatory factors, improves gut health',
        difficulty: 'medium',
      },
      {
        title: 'Mindful Eating',
        action: 'Focus on eating, chew slowly for at least 20 minutes per meal',
        rationale: 'Improves satiety awareness, prevents overeating',
        difficulty: 'easy',
      },
    ],
  },
  mental: {
    zh: [
      {
        title: '感恩练习',
        action: '每晚记录 3 件今天感恩的事',
        rationale: '提升多巴胺和血清素水平',
        difficulty: 'easy',
      },
      {
        title: '正念冥想',
        action: '每天进行 10 分钟正念冥想',
        rationale: '增强前额叶功能，提高情绪调节能力',
        difficulty: 'easy',
      },
      {
        title: '社交连接',
        action: '每天与一位朋友或家人进行有意义的对话',
        rationale: '社交支持是心理健康的重要保护因素',
        difficulty: 'easy',
      },
      {
        title: '创意表达',
        action: '每周进行 1 次创意活动（绘画、写作、音乐等）',
        rationale: '创意活动可以释放情绪，提升幸福感',
        difficulty: 'medium',
      },
      {
        title: '自我关怀',
        action: '每天安排 15 分钟专属自己的放松时间',
        rationale: '自我关怀是预防倦怠的关键',
        difficulty: 'easy',
      },
    ],
    en: [
      {
        title: 'Gratitude Practice',
        action: 'Write down 3 things you are grateful for each night',
        rationale: 'Boosts dopamine and serotonin levels',
        difficulty: 'easy',
      },
      {
        title: 'Mindfulness Meditation',
        action: 'Practice 10 minutes of mindfulness meditation daily',
        rationale: 'Enhances prefrontal function, improves emotional regulation',
        difficulty: 'easy',
      },
      {
        title: 'Social Connection',
        action: 'Have a meaningful conversation with a friend or family member daily',
        rationale: 'Social support is a key protective factor for mental health',
        difficulty: 'easy',
      },
      {
        title: 'Creative Expression',
        action: 'Engage in creative activity once a week (drawing, writing, music)',
        rationale: 'Creative activities release emotions, boost well-being',
        difficulty: 'medium',
      },
      {
        title: 'Self-Care',
        action: 'Schedule 15 minutes of personal relaxation time daily',
        rationale: 'Self-care is key to preventing burnout',
        difficulty: 'easy',
      },
    ],
  },
  habits: {
    zh: [
      {
        title: '习惯堆叠',
        action: '将新习惯与现有习惯绑定（如：刷牙后冥想）',
        rationale: '利用已有神经通路，降低新习惯阻力',
        difficulty: 'easy',
      },
      {
        title: '环境设计',
        action: '调整环境让好习惯更容易执行',
        rationale: '减少决策疲劳，自动化行为',
        difficulty: 'medium',
      },
      {
        title: '微小开始',
        action: '将目标习惯缩小到 2 分钟版本',
        rationale: '降低启动门槛，建立一致性',
        difficulty: 'easy',
      },
      {
        title: '追踪记录',
        action: '使用习惯追踪器记录每日完成情况',
        rationale: '可视化进度，增强动力',
        difficulty: 'easy',
      },
      {
        title: '奖励机制',
        action: '完成习惯后给自己一个小奖励',
        rationale: '强化正向反馈循环',
        difficulty: 'easy',
      },
    ],
    en: [
      {
        title: 'Habit Stacking',
        action: 'Link new habit to existing one (e.g., meditate after brushing teeth)',
        rationale: 'Uses existing neural pathways, reduces resistance',
        difficulty: 'easy',
      },
      {
        title: 'Environment Design',
        action: 'Adjust environment to make good habits easier',
        rationale: 'Reduces decision fatigue, automates behavior',
        difficulty: 'medium',
      },
      {
        title: 'Start Small',
        action: 'Shrink target habit to a 2-minute version',
        rationale: 'Lowers activation threshold, builds consistency',
        difficulty: 'easy',
      },
      {
        title: 'Track Progress',
        action: 'Use a habit tracker to record daily completion',
        rationale: 'Visualizes progress, enhances motivation',
        difficulty: 'easy',
      },
      {
        title: 'Reward System',
        action: 'Give yourself a small reward after completing the habit',
        rationale: 'Reinforces positive feedback loop',
        difficulty: 'easy',
      },
    ],
  },
};

// ============================================
// 核心函数
// ============================================

/**
 * 生成替换计划项
 * 
 * @param originalItem - 原始计划项
 * @param language - 语言
 * @param excludeTitles - 要排除的标题列表（避免重复）
 * @returns 替换后的计划项
 */
export function generateReplacement(
  originalItem: PlanItemDraft,
  language: 'zh' | 'en' = 'zh',
  excludeTitles: string[] = []
): PlanItemDraft {
  const category = originalItem.category;
  const templates = REPLACEMENT_TEMPLATES[category]?.[language] || REPLACEMENT_TEMPLATES.habits[language];
  
  // 过滤掉原始项和已排除的项
  const allExcluded = [...excludeTitles, originalItem.title];
  const availableTemplates = templates.filter(t => !allExcluded.includes(t.title));
  
  // 如果没有可用模板，使用所有模板（除了原始项）
  const candidateTemplates = availableTemplates.length > 0 
    ? availableTemplates 
    : templates.filter(t => t.title !== originalItem.title);
  
  // 随机选择一个模板
  const selectedTemplate = candidateTemplates[Math.floor(Math.random() * candidateTemplates.length)];
  
  // 如果实在没有可用模板，返回一个通用替换
  if (!selectedTemplate) {
    return generateGenericReplacement(originalItem, language);
  }
  
  return {
    id: `plan_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: selectedTemplate.title,
    action: selectedTemplate.action,
    rationale: selectedTemplate.rationale,
    difficulty: selectedTemplate.difficulty,
    category: category,
  };
}

/**
 * 生成通用替换项
 */
function generateGenericReplacement(
  originalItem: PlanItemDraft,
  language: 'zh' | 'en'
): PlanItemDraft {
  const genericTemplates: Record<'zh' | 'en', ReplacementTemplate> = {
    zh: {
      title: '自定义练习',
      action: '根据个人情况调整练习内容和时长',
      rationale: '个性化调整可以提高坚持度',
      difficulty: 'easy',
    },
    en: {
      title: 'Custom Practice',
      action: 'Adjust practice content and duration based on personal situation',
      rationale: 'Personalized adjustments improve adherence',
      difficulty: 'easy',
    },
  };
  
  const template = genericTemplates[language];
  
  return {
    id: `plan_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: template.title,
    action: template.action,
    rationale: template.rationale,
    difficulty: template.difficulty,
    category: originalItem.category,
  };
}

/**
 * 验证替换一致性
 * 
 * @param original - 原始计划项
 * @param replacement - 替换计划项
 * @returns 是否满足替换一致性要求
 */
export function validateReplacementConsistency(
  original: PlanItemDraft,
  replacement: PlanItemDraft
): boolean {
  // 类别必须相同
  if (original.category !== replacement.category) {
    return false;
  }
  
  // 标题必须不同
  if (original.title === replacement.title) {
    return false;
  }
  
  // 行动描述必须不同
  if (original.action === replacement.action) {
    return false;
  }
  
  // 替换项必须有完整的字段
  if (!replacement.id || replacement.id.length === 0) return false;
  if (!replacement.title || replacement.title.length === 0) return false;
  if (!replacement.action || replacement.action.length === 0) return false;
  if (!replacement.rationale || replacement.rationale.length === 0) return false;
  
  return true;
}

/**
 * 批量生成替换选项
 * 
 * @param originalItem - 原始计划项
 * @param count - 生成数量
 * @param language - 语言
 * @returns 替换选项列表
 */
export function generateReplacementOptions(
  originalItem: PlanItemDraft,
  count: number = 3,
  language: 'zh' | 'en' = 'zh'
): PlanItemDraft[] {
  const options: PlanItemDraft[] = [];
  const excludeTitles: string[] = [originalItem.title];
  
  for (let i = 0; i < count; i++) {
    const replacement = generateReplacement(originalItem, language, excludeTitles);
    options.push(replacement);
    excludeTitles.push(replacement.title);
  }
  
  return options;
}

/**
 * 获取类别的所有可用模板
 */
export function getTemplatesForCategory(
  category: PlanCategory,
  language: 'zh' | 'en' = 'zh'
): ReplacementTemplate[] {
  return REPLACEMENT_TEMPLATES[category]?.[language] || REPLACEMENT_TEMPLATES.habits[language];
}
