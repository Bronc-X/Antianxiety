// lib/plan-naming.ts
// 计划命名服务 - 生成个性化的计划名称
// Requirements: 5.1, 5.2, 5.3

/**
 * AI 性格风格类型
 */
export type AIPersonalityStyle = 'cute_pet' | 'mayo_doctor' | 'gentle_thea' | 'science_phd' | 'default';

/**
 * 计划命名上下文
 */
export interface PlanNamingContext {
  primaryConcern: string;      // 主要关注点
  metabolicType?: string;      // 代谢类型
  targetOutcome?: string;      // 目标结果
  difficulty?: string;         // 难度
  duration?: string;           // 时长
  planIndex?: number;          // 计划索引（用于区分多个计划）
  aiPersonality?: AIPersonalityStyle; // AI 性格风格
  language?: 'zh' | 'en';      // 语言
}

/**
 * 个性化计划名称
 */
export interface PersonalizedPlanName {
  title: string;       // 主标题，如 "晨光唤醒计划"
  subtitle: string;    // 副标题，如 "7天重置生物钟"
  emoji: string;       // 表情符号
}

/**
 * 禁止使用的通用名称模式
 */
export const FORBIDDEN_PATTERNS = [
  /^方案[一二三四五六七八九十\d]+$/,
  /^计划[一二三四五六七八九十\d]+$/,
  /^Plan\s*[A-Z]$/i,
  /^Plan\s*\d+$/i,
  /^Option\s*[A-Z\d]+$/i,
  /^选项[一二三四五六七八九十\d]+$/,
  /^Scheme\s*\d+$/i,
  /^Program\s*\d+$/i,
];

/**
 * 根据 AI 风格生成不同的命名风格
 */
const STYLE_NAME_TRANSFORMS: Record<AIPersonalityStyle, {
  prefix?: string;
  suffix?: string;
  emojis: string[];
  transform: (title: string, concern: string) => string;
}> = {
  'cute_pet': {
    emojis: ['🐱', '🐾', '🌸', '💕', '✨', '🎀', '🌷', '🍀'],
    transform: (title, concern) => {
      const cuteNames: Record<string, string[]> = {
        weight_loss: ['喵喵轻盈计划', '小猫咪陪你瘦瘦', '软萌燃脂大作战', '猫猫助理减重记'],
        fat_loss: ['喵喵燃脂计划', '小猫咪塑形记', '软绵绵减脂计划', '猫猫助理瘦身记'],
        stress_management: ['喵喵放松时光', '小猫咪陪你解压', '软萌减压计划', '猫猫助理治愈记'],
        stress: ['喵喵舒心计划', '小猫咪抱抱计划', '软绵绵放松记', '猫猫助理安心记'],
        sleep_improvement: ['喵喵好眠计划', '小猫咪陪你入睡', '软绵绵安眠记', '猫猫助理晚安记'],
        sleep: ['喵喵晚安计划', '小猫咪睡眠记', '软萌好梦计划', '猫猫助理甜梦记'],
        energy_boost: ['喵喵元气计划', '小猫咪活力记', '软萌能量大作战', '猫猫助理充电记'],
        energy: ['喵喵活力计划', '小猫咪精力记', '软绵绵元气记', '猫猫助理能量记'],
        muscle_gain: ['喵喵力量计划', '小猫咪增肌记', '软萌变强计划', '猫猫助理肌肉记'],
        strength: ['喵喵强壮计划', '小猫咪力量记', '软萌健身记', '猫猫助理变强记'],
        general: ['喵喵健康计划', '小猫咪陪伴记', '软萌养生计划', '猫猫助理关爱记'],
      };
      const names = cuteNames[concern] || cuteNames.general;
      return names[Math.floor(Math.random() * names.length)];
    },
  },
  'mayo_doctor': {
    emojis: ['🏥', '⚕️', '💊', '🩺', '📋', '🔬'],
    transform: (title, concern) => {
      const doctorNames: Record<string, string[]> = {
        weight_loss: ['循证体重管理方案', '梅奥减重干预计划', '医学减重协议', '临床体重优化方案'],
        fat_loss: ['循证体脂管理方案', '梅奥塑形干预计划', '医学减脂协议', '临床体脂优化方案'],
        stress_management: ['循证压力管理方案', '梅奥减压干预计划', '医学应激调控协议', '临床压力优化方案'],
        stress: ['循证舒压方案', '梅奥心理干预计划', '医学减压协议', '临床压力管理方案'],
        sleep_improvement: ['循证睡眠改善方案', '梅奥睡眠干预计划', '医学睡眠优化协议', '临床睡眠管理方案'],
        sleep: ['循证睡眠方案', '梅奥安眠干预计划', '医学睡眠协议', '临床睡眠优化方案'],
        energy_boost: ['循证能量提升方案', '梅奥活力干预计划', '医学能量优化协议', '临床精力管理方案'],
        energy: ['循证活力方案', '梅奥能量干预计划', '医学精力协议', '临床能量优化方案'],
        muscle_gain: ['循证增肌方案', '梅奥力量干预计划', '医学肌肉优化协议', '临床增肌管理方案'],
        strength: ['循证力量方案', '梅奥增强干预计划', '医学力量协议', '临床强化管理方案'],
        general: ['循证健康管理方案', '梅奥综合干预计划', '医学健康优化协议', '临床健康管理方案'],
      };
      const names = doctorNames[concern] || doctorNames.general;
      return names[Math.floor(Math.random() * names.length)];
    },
  },
  'gentle_thea': {
    emojis: ['🌸', '🌿', '☀️', '🌈', '💫', '🕊️'],
    transform: (title, concern) => {
      const gentleNames: Record<string, string[]> = {
        weight_loss: ['温柔蜕变之旅', '轻盈绽放计划', '柔和减重方案', '温暖瘦身之路'],
        fat_loss: ['温柔塑形之旅', '轻盈燃脂计划', '柔和减脂方案', '温暖塑身之路'],
        stress_management: ['心灵疗愈之旅', '温柔解压计划', '柔和放松方案', '温暖舒心之路'],
        stress: ['心灵舒缓之旅', '温柔减压计划', '柔和安心方案', '温暖治愈之路'],
        sleep_improvement: ['温柔入梦之旅', '安心好眠计划', '柔和修复方案', '温暖安眠之路'],
        sleep: ['甜蜜好梦之旅', '温柔睡眠计划', '柔和深睡方案', '温暖晚安之路'],
        energy_boost: ['活力绽放之旅', '温柔充能计划', '柔和元气方案', '温暖能量之路'],
        energy: ['元气满满之旅', '温柔活力计划', '柔和精力方案', '温暖充电之路'],
        muscle_gain: ['力量成长之旅', '温柔增肌计划', '柔和强化方案', '温暖塑肌之路'],
        strength: ['稳步变强之旅', '温柔力量计划', '柔和增强方案', '温暖进阶之路'],
        general: ['健康绽放之旅', '温柔养生计划', '柔和调理方案', '温暖健康之路'],
      };
      const names = gentleNames[concern] || gentleNames.general;
      return names[Math.floor(Math.random() * names.length)];
    },
  },
  'science_phd': {
    emojis: ['🔬', '📊', '🧬', '⚗️', '📈', '🧪'],
    transform: (title, concern) => {
      const scienceNames: Record<string, string[]> = {
        weight_loss: ['代谢优化协议v1.0', '脂肪氧化增强方案', 'BMR提升计划', '热量赤字系统'],
        fat_loss: ['脂肪分解协议v2.0', '体脂率优化方案', '脂代谢重编程', '燃脂效率系统'],
        stress_management: ['皮质醇调控协议', 'HPA轴平衡方案', '应激反应优化', '神经内分泌调节'],
        stress: ['压力激素调控v1.0', '自主神经平衡方案', '应激系统重置', '皮质醇管理协议'],
        sleep_improvement: ['昼夜节律重置协议', '褪黑素优化方案', '深睡周期增强', '睡眠架构重建'],
        sleep: ['睡眠周期优化v2.0', '生物钟校准方案', 'REM增强协议', '睡眠质量系统'],
        energy_boost: ['线粒体激活协议', 'ATP合成优化方案', '能量代谢增强', '细胞能量系统'],
        energy: ['线粒体功能优化v1.0', '能量代谢重编程', 'ATP产出增强', '细胞活力协议'],
        muscle_gain: ['肌肉蛋白合成协议', 'mTOR激活方案', '肌纤维增殖计划', '力量增长系统'],
        strength: ['肌力增强协议v2.0', '神经肌肉优化方案', '力量输出增强', '肌肉适应系统'],
        general: ['全身代谢优化协议', '系统性健康方案', '生理功能增强', '综合调控系统'],
      };
      const names = scienceNames[concern] || scienceNames.general;
      return names[Math.floor(Math.random() * names.length)];
    },
  },
  'default': {
    emojis: ['🌿', '✨', '🎯', '💫'],
    transform: (title) => title,
  },
};

/**
 * 关注点到名称映射（默认风格）- 中文
 */
const CONCERN_NAME_MAP_ZH: Record<string, { titles: string[]; emojis: string[]; keywords: string[] }> = {
  weight_loss: {
    titles: ['轻盈蜕变计划', '代谢激活方案', '燃脂重塑计划', '体态优化方案'],
    emojis: ['🔥', '⚡', '💪', '🎯'],
    keywords: ['减重', '燃脂', '代谢', '体态'],
  },
  fat_loss: {
    titles: ['脂肪燃烧计划', '精准减脂方案', '体脂管理计划', '塑形燃脂方案'],
    emojis: ['🔥', '💪', '🎯', '⚡'],
    keywords: ['燃脂', '减脂', '塑形', '体脂'],
  },
  stress_management: {
    titles: ['心灵舒缓计划', '压力释放方案', '身心平衡计划', '宁静修复方案'],
    emojis: ['🧘', '🌿', '☮️', '🕊️'],
    keywords: ['压力', '放松', '平衡', '舒缓'],
  },
  stress: {
    titles: ['压力调节计划', '心神安宁方案', '情绪平衡计划', '减压修复方案'],
    emojis: ['🧘', '🌸', '🌊', '🍃'],
    keywords: ['减压', '调节', '安宁', '平衡'],
  },
  sleep_improvement: {
    titles: ['深度睡眠计划', '睡眠修复方案', '安眠重塑计划', '夜间恢复方案'],
    emojis: ['🌙', '💤', '🌟', '✨'],
    keywords: ['睡眠', '安眠', '修复', '恢复'],
  },
  sleep: {
    titles: ['晨光唤醒计划', '生物钟重置方案', '优质睡眠计划', '深睡修复方案'],
    emojis: ['🌅', '🌙', '💤', '🛏️'],
    keywords: ['睡眠', '生物钟', '唤醒', '深睡'],
  },
  energy_boost: {
    titles: ['能量激活计划', '活力唤醒方案', '精力充沛计划', '元气恢复方案'],
    emojis: ['⚡', '🌟', '💫', '🔋'],
    keywords: ['能量', '活力', '精力', '元气'],
  },
  energy: {
    titles: ['全天活力计划', '能量管理方案', '精力优化计划', '活力提升方案'],
    emojis: ['⚡', '☀️', '🌈', '💪'],
    keywords: ['活力', '能量', '精力', '提升'],
  },
  muscle_gain: {
    titles: ['肌肉塑造计划', '力量增长方案', '增肌强化计划', '体能提升方案'],
    emojis: ['💪', '🏋️', '🎯', '🔥'],
    keywords: ['增肌', '力量', '塑造', '强化'],
  },
  strength: {
    titles: ['力量突破计划', '核心强化方案', '体能进阶计划', '肌力提升方案'],
    emojis: ['💪', '🏆', '⚡', '🎯'],
    keywords: ['力量', '强化', '突破', '进阶'],
  },
  general: {
    titles: ['全面健康计划', '身心平衡方案', '健康优化计划', '综合调理方案'],
    emojis: ['🌿', '🌸', '✨', '🎯'],
    keywords: ['健康', '平衡', '优化', '调理'],
  },
};

/**
 * 关注点到名称映射（默认风格）- 英文
 */
const CONCERN_NAME_MAP_EN: Record<string, { titles: string[]; emojis: string[]; keywords: string[] }> = {
  weight_loss: {
    titles: ['Weight Loss Plan', 'Metabolism Boost', 'Fat Burn Program', 'Body Optimization'],
    emojis: ['🔥', '⚡', '💪', '🎯'],
    keywords: ['weight', 'burn', 'metabolism', 'body'],
  },
  fat_loss: {
    titles: ['Fat Burning Plan', 'Precision Fat Loss', 'Body Fat Management', 'Sculpting Program'],
    emojis: ['🔥', '💪', '🎯', '⚡'],
    keywords: ['fat', 'burn', 'sculpt', 'body'],
  },
  stress_management: {
    titles: ['Stress Relief Plan', 'Calm & Balance', 'Mind-Body Harmony', 'Serenity Program'],
    emojis: ['🧘', '🌿', '☮️', '🕊️'],
    keywords: ['stress', 'relax', 'balance', 'calm'],
  },
  stress: {
    titles: ['Stress Control Plan', 'Inner Peace Program', 'Emotional Balance', 'Relaxation Plan'],
    emojis: ['🧘', '🌸', '🌊', '🍃'],
    keywords: ['stress', 'peace', 'balance', 'relax'],
  },
  sleep_improvement: {
    titles: ['Deep Sleep Plan', 'Sleep Recovery', 'Rest & Restore', 'Night Recovery'],
    emojis: ['🌙', '💤', '🌟', '✨'],
    keywords: ['sleep', 'rest', 'recover', 'restore'],
  },
  sleep: {
    titles: ['Morning Wake Plan', 'Circadian Reset', 'Quality Sleep', 'Deep Rest Program'],
    emojis: ['🌅', '🌙', '💤', '🛏️'],
    keywords: ['sleep', 'circadian', 'wake', 'rest'],
  },
  energy_boost: {
    titles: ['Energy Activation', 'Vitality Boost', 'Power Up Plan', 'Energy Recovery'],
    emojis: ['⚡', '🌟', '💫', '🔋'],
    keywords: ['energy', 'vitality', 'power', 'boost'],
  },
  energy: {
    titles: ['All-Day Energy', 'Energy Management', 'Vitality Optimization', 'Power Plan'],
    emojis: ['⚡', '☀️', '🌈', '💪'],
    keywords: ['energy', 'vitality', 'power', 'boost'],
  },
  muscle_gain: {
    titles: ['Muscle Building Plan', 'Strength Growth', 'Muscle Enhancement', 'Fitness Boost'],
    emojis: ['💪', '🏋️', '🎯', '🔥'],
    keywords: ['muscle', 'strength', 'build', 'enhance'],
  },
  strength: {
    titles: ['Strength Breakthrough', 'Core Enhancement', 'Fitness Progress', 'Power Growth'],
    emojis: ['💪', '🏆', '⚡', '🎯'],
    keywords: ['strength', 'core', 'power', 'progress'],
  },
  general: {
    titles: ['Complete Health Plan', 'Mind-Body Balance', 'Health Optimization', 'Wellness Program'],
    emojis: ['🌿', '🌸', '✨', '🎯'],
    keywords: ['health', 'balance', 'optimize', 'wellness'],
  },
};

// 获取对应语言的名称映射
const getConcernNameMap = (language: 'zh' | 'en' = 'zh') => {
  return language === 'en' ? CONCERN_NAME_MAP_EN : CONCERN_NAME_MAP_ZH;
};

/**
 * 难度到描述映射
 */
const DIFFICULTY_MAP: Record<string, string> = {
  easy: '轻松入门',
  beginner: '新手友好',
  medium: '稳步进阶',
  intermediate: '中级挑战',
  hard: '高强度挑战',
  advanced: '专业进阶',
};

/**
 * 时长到描述映射
 */
const DURATION_MAP: Record<string, string> = {
  '3days': '3天快速启动',
  '7days': '7天重塑习惯',
  '14days': '14天深度改变',
  '21days': '21天习惯养成',
  '30days': '30天全面蜕变',
  '1week': '一周集中突破',
  '2weeks': '两周稳步提升',
  '1month': '一月系统调理',
};

/**
 * 生成个性化计划名称
 * 
 * @param context 命名上下文
 * @returns 个性化计划名称
 */
export function generatePlanName(context: PlanNamingContext): PersonalizedPlanName {
  const { primaryConcern, metabolicType, targetOutcome, difficulty, duration, planIndex, aiPersonality, language = 'zh' } = context;
  
  // 获取关注点对应的名称配置
  const concernKey = normalizeConcern(primaryConcern);
  const CONCERN_NAME_MAP = getConcernNameMap(language);
  const nameConfig = CONCERN_NAME_MAP[concernKey] || CONCERN_NAME_MAP.general;
  
  // 获取 AI 风格配置
  const styleConfig = STYLE_NAME_TRANSFORMS[aiPersonality || 'default'] || STYLE_NAME_TRANSFORMS.default;
  
  // 根据风格生成标题
  let title: string;
  let emoji: string;
  
  if (aiPersonality && aiPersonality !== 'default') {
    // 使用风格特定的命名
    title = styleConfig.transform(nameConfig.titles[0], concernKey);
    const emojiIndex = planIndex !== undefined 
      ? planIndex % styleConfig.emojis.length 
      : Math.floor(Math.random() * styleConfig.emojis.length);
    emoji = styleConfig.emojis[emojiIndex];
  } else {
    // 使用默认命名
    const titleIndex = planIndex !== undefined 
      ? planIndex % nameConfig.titles.length 
      : Math.floor(Math.random() * nameConfig.titles.length);
    title = nameConfig.titles[titleIndex];
    emoji = nameConfig.emojis[titleIndex % nameConfig.emojis.length];
  }
  
  // 如果有代谢类型，可以进一步个性化
  if (metabolicType) {
    title = personalizeWithMetabolicType(title, metabolicType);
  }
  
  // 生成副标题（根据风格调整）
  let subtitle = generateSubtitle(duration, difficulty, targetOutcome, aiPersonality, language);
  
  // 如果副标题为空，使用默认
  if (!subtitle) {
    subtitle = getDefaultSubtitle(aiPersonality, nameConfig.keywords[0], language);
  }
  
  return {
    title,
    subtitle,
    emoji,
  };
}

/**
 * 根据风格获取默认副标题
 */
function getDefaultSubtitle(style?: AIPersonalityStyle, keyword?: string, language: 'zh' | 'en' = 'zh'): string {
  if (language === 'en') {
    const subtitles: Record<AIPersonalityStyle, string> = {
      'cute_pet': `Customized by your cute assistant 💕`,
      'mayo_doctor': `Evidence-based Mayo Clinic approach`,
      'gentle_thea': `Gently guiding your every step`,
      'science_phd': `Personalized evidence-based plan`,
      'default': `Your personal ${keyword || 'health'} plan`,
    };
    return subtitles[style || 'default'];
  }
  const subtitles: Record<AIPersonalityStyle, string> = {
    'cute_pet': `小猫助理为你定制喵~ 💕`,
    'mayo_doctor': `梅奥医生循证方案`,
    'gentle_thea': `温柔陪伴你的每一步`,
    'science_phd': `基于循证医学的个性化方案`,
    'default': `专属${keyword || '健康'}方案`,
  };
  return subtitles[style || 'default'];
}

/**
 * 标准化关注点字符串
 */
function normalizeConcern(concern: string): string {
  if (!concern) return 'general';
  
  const normalized = concern.toLowerCase().trim();
  
  // 直接匹配
  if (CONCERN_NAME_MAP_ZH[normalized] || CONCERN_NAME_MAP_EN[normalized]) {
    return normalized;
  }
  
  // 关键词匹配
  if (normalized.includes('weight') || normalized.includes('减重') || normalized.includes('瘦')) {
    return 'weight_loss';
  }
  if (normalized.includes('fat') || normalized.includes('脂肪') || normalized.includes('减脂')) {
    return 'fat_loss';
  }
  if (normalized.includes('stress') || normalized.includes('压力') || normalized.includes('焦虑')) {
    return 'stress_management';
  }
  if (normalized.includes('sleep') || normalized.includes('睡眠') || normalized.includes('失眠')) {
    return 'sleep_improvement';
  }
  if (normalized.includes('energy') || normalized.includes('能量') || normalized.includes('精力') || normalized.includes('疲劳')) {
    return 'energy_boost';
  }
  if (normalized.includes('muscle') || normalized.includes('增肌') || normalized.includes('肌肉')) {
    return 'muscle_gain';
  }
  if (normalized.includes('strength') || normalized.includes('力量')) {
    return 'strength';
  }
  
  return 'general';
}

/**
 * 根据代谢类型个性化标题
 */
function personalizeWithMetabolicType(title: string, metabolicType: string): string {
  const type = metabolicType.toLowerCase();
  
  if (type.includes('fast') || type.includes('快速')) {
    return title.replace('计划', '快代谢计划').replace('方案', '快代谢方案');
  }
  if (type.includes('slow') || type.includes('慢速')) {
    return title.replace('计划', '稳代谢计划').replace('方案', '稳代谢方案');
  }
  if (type.includes('mixed') || type.includes('混合')) {
    return title.replace('计划', '平衡计划').replace('方案', '平衡方案');
  }
  
  return title;
}

/**
 * 难度到描述映射 - 英文
 */
const DIFFICULTY_MAP_EN: Record<string, string> = {
  easy: 'Easy Start',
  beginner: 'Beginner Friendly',
  medium: 'Steady Progress',
  intermediate: 'Intermediate Challenge',
  hard: 'High Intensity',
  advanced: 'Advanced Level',
};

/**
 * 时长到描述映射 - 英文
 */
const DURATION_MAP_EN: Record<string, string> = {
  '3days': '3-Day Quick Start',
  '7days': '7-Day Habit Reset',
  '14days': '14-Day Deep Change',
  '21days': '21-Day Habit Formation',
  '30days': '30-Day Transformation',
  '1week': 'One Week Focus',
  '2weeks': 'Two Week Progress',
  '1month': 'One Month Program',
};

/**
 * 生成副标题
 */
function generateSubtitle(
  duration?: string, 
  difficulty?: string, 
  targetOutcome?: string,
  style?: AIPersonalityStyle,
  language: 'zh' | 'en' = 'zh'
): string {
  const parts: string[] = [];
  const durationMap = language === 'en' ? DURATION_MAP_EN : DURATION_MAP;
  const difficultyMap = language === 'en' ? DIFFICULTY_MAP_EN : DIFFICULTY_MAP;
  
  // 时长
  if (duration) {
    const durationText = durationMap[duration.toLowerCase()] || duration;
    parts.push(durationText);
  }
  
  // 难度
  if (difficulty) {
    const difficultyText = difficultyMap[difficulty.toLowerCase()] || difficulty;
    parts.push(difficultyText);
  }
  
  // 目标结果
  if (targetOutcome && !parts.length) {
    parts.push(targetOutcome);
  }
  
  return parts.join(' · ');
}

/**
 * 验证计划名称是否符合规范（不使用通用名称）
 * 
 * @param name 计划名称
 * @returns 是否有效
 */
export function isValidPlanName(name: string): boolean {
  if (!name || name.trim().length === 0) {
    return false;
  }
  
  // 检查是否匹配任何禁止模式
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(name.trim())) {
      return false;
    }
  }
  
  return true;
}

/**
 * 批量生成多个计划的名称
 * 
 * @param context 基础上下文
 * @param count 计划数量
 * @returns 计划名称数组
 */
export function generateMultiplePlanNames(
  context: Omit<PlanNamingContext, 'planIndex'>,
  count: number
): PersonalizedPlanName[] {
  const names: PersonalizedPlanName[] = [];
  
  for (let i = 0; i < count; i++) {
    names.push(generatePlanName({ ...context, planIndex: i }));
  }
  
  return names;
}
