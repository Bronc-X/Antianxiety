/**
 * Questionnaire Scales - Standardized Health Assessment Scales
 * 
 * Based on validated clinical instruments:
 * - GAD-7 (Generalized Anxiety Disorder) - Spitzer RL, JAMA Internal Medicine
 * - SHSQ-25 (Sub-Health Status Questionnaire) - Southern Medical University
 * - AMS (Aging Males' Symptoms) - Heinemann, Berlin [Reserved]
 * - MRS (Menopause Rating Scale) - Heinemann [Reserved]
 * 
 * Design Principle: "用真相打破焦虑" - Truth vs Anxiety
 */

// ============ Types ============

export interface ScaleQuestion {
  id: string;
  text: string;
  textEn: string;
  options: ScaleOption[];
}

export interface ScaleOption {
  label: string;
  labelEn: string;
  value: string;
  score: number;
}

export interface ScaleDefinition {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  source: string;
  questions: ScaleQuestion[];
  thresholds: ScaleThreshold[];
  tags: TagMapping[];
}

export interface ScaleThreshold {
  minScore: number;
  maxScore: number;
  severity: 'minimal' | 'mild' | 'moderate' | 'severe';
  label: string;
  labelEn: string;
}

export interface TagMapping {
  condition: (score: number, subscores?: Record<string, number>) => boolean;
  tag: string;
  tagEn: string;
}

export interface ScaleResult {
  scaleId: string;
  totalScore: number;
  subscores?: Record<string, number>;
  severity: string;
  tags: string[];
}

// ============ GAD-7 (Generalized Anxiety Disorder 7-item) ============

/**
 * GAD-7 量表 - 广泛性焦虑障碍筛查
 * 来源: Spitzer RL, et al. JAMA Internal Medicine, 2006
 * 评分: 0-21分，>10分为中度以上焦虑
 */
export const GAD7_SCALE: ScaleDefinition = {
  id: 'gad7',
  name: 'GAD-7 焦虑量表',
  nameEn: 'GAD-7 Anxiety Scale',
  description: '过去两周内，您被以下问题困扰的频率是？',
  source: 'Spitzer RL, JAMA Internal Medicine 2006',
  questions: [
    {
      id: 'gad7_1',
      text: '感到紧张、焦虑或急切',
      textEn: 'Feeling nervous, anxious, or on edge',
      options: [
        { label: '完全没有', labelEn: 'Not at all', value: 'not_at_all', score: 0 },
        { label: '有几天', labelEn: 'Several days', value: 'several_days', score: 1 },
        { label: '超过一半的天数', labelEn: 'More than half the days', value: 'more_than_half', score: 2 },
        { label: '几乎每天', labelEn: 'Nearly every day', value: 'nearly_every_day', score: 3 },
      ],
    },
    {
      id: 'gad7_2',
      text: '不能停止或控制担忧',
      textEn: 'Not being able to stop or control worrying',
      options: [
        { label: '完全没有', labelEn: 'Not at all', value: 'not_at_all', score: 0 },
        { label: '有几天', labelEn: 'Several days', value: 'several_days', score: 1 },
        { label: '超过一半的天数', labelEn: 'More than half the days', value: 'more_than_half', score: 2 },
        { label: '几乎每天', labelEn: 'Nearly every day', value: 'nearly_every_day', score: 3 },
      ],
    },
    {
      id: 'gad7_3',
      text: '对各种事情担忧过多',
      textEn: 'Worrying too much about different things',
      options: [
        { label: '完全没有', labelEn: 'Not at all', value: 'not_at_all', score: 0 },
        { label: '有几天', labelEn: 'Several days', value: 'several_days', score: 1 },
        { label: '超过一半的天数', labelEn: 'More than half the days', value: 'more_than_half', score: 2 },
        { label: '几乎每天', labelEn: 'Nearly every day', value: 'nearly_every_day', score: 3 },
      ],
    },
    {
      id: 'gad7_4',
      text: '很难放松下来',
      textEn: 'Trouble relaxing',
      options: [
        { label: '完全没有', labelEn: 'Not at all', value: 'not_at_all', score: 0 },
        { label: '有几天', labelEn: 'Several days', value: 'several_days', score: 1 },
        { label: '超过一半的天数', labelEn: 'More than half the days', value: 'more_than_half', score: 2 },
        { label: '几乎每天', labelEn: 'Nearly every day', value: 'nearly_every_day', score: 3 },
      ],
    },
    {
      id: 'gad7_5',
      text: '烦躁不安，以至于难以静坐',
      textEn: 'Being so restless that it is hard to sit still',
      options: [
        { label: '完全没有', labelEn: 'Not at all', value: 'not_at_all', score: 0 },
        { label: '有几天', labelEn: 'Several days', value: 'several_days', score: 1 },
        { label: '超过一半的天数', labelEn: 'More than half the days', value: 'more_than_half', score: 2 },
        { label: '几乎每天', labelEn: 'Nearly every day', value: 'nearly_every_day', score: 3 },
      ],
    },
    {
      id: 'gad7_6',
      text: '变得容易烦恼或易怒',
      textEn: 'Becoming easily annoyed or irritable',
      options: [
        { label: '完全没有', labelEn: 'Not at all', value: 'not_at_all', score: 0 },
        { label: '有几天', labelEn: 'Several days', value: 'several_days', score: 1 },
        { label: '超过一半的天数', labelEn: 'More than half the days', value: 'more_than_half', score: 2 },
        { label: '几乎每天', labelEn: 'Nearly every day', value: 'nearly_every_day', score: 3 },
      ],
    },
    {
      id: 'gad7_7',
      text: '感到害怕，好像要发生可怕的事情',
      textEn: 'Feeling afraid as if something awful might happen',
      options: [
        { label: '完全没有', labelEn: 'Not at all', value: 'not_at_all', score: 0 },
        { label: '有几天', labelEn: 'Several days', value: 'several_days', score: 1 },
        { label: '超过一半的天数', labelEn: 'More than half the days', value: 'more_than_half', score: 2 },
        { label: '几乎每天', labelEn: 'Nearly every day', value: 'nearly_every_day', score: 3 },
      ],
    },
  ],
  thresholds: [
    { minScore: 0, maxScore: 4, severity: 'minimal', label: '极轻微焦虑', labelEn: 'Minimal anxiety' },
    { minScore: 5, maxScore: 9, severity: 'mild', label: '轻度焦虑', labelEn: 'Mild anxiety' },
    { minScore: 10, maxScore: 14, severity: 'moderate', label: '中度焦虑', labelEn: 'Moderate anxiety' },
    { minScore: 15, maxScore: 21, severity: 'severe', label: '重度焦虑', labelEn: 'Severe anxiety' },
  ],
  tags: [
    {
      condition: (score) => score >= 10,
      tag: '高皮质醇风险',
      tagEn: 'High Cortisol Risk',
    },
    {
      condition: (score) => score >= 15,
      tag: '重度焦虑',
      tagEn: 'Severe Anxiety',
    },
  ],
};

// ============ SHSQ-25 (Sub-Health Status Questionnaire) ============

/**
 * SHSQ-25 量表 - 亚健康状态问卷
 * 来源: 南方医科大学 / 国际亚健康学术研讨会
 * 维度: 疲劳、心血管、消化、免疫、精神
 */
export const SHSQ25_SCALE: ScaleDefinition = {
  id: 'shsq25',
  name: 'SHSQ-25 亚健康量表',
  nameEn: 'SHSQ-25 Sub-Health Scale',
  description: '过去三个月内，您经历以下症状的频率是？',
  source: 'Southern Medical University, International Sub-Health Forum',
  questions: [
    // Fatigue Dimension (疲劳维度) - Q1-Q9
    {
      id: 'shsq_1',
      text: '感到精力不足',
      textEn: 'Feeling lack of energy',
      options: [
        { label: '从不', labelEn: 'Never', value: 'never', score: 0 },
        { label: '偶尔', labelEn: 'Sometimes', value: 'sometimes', score: 1 },
        { label: '经常', labelEn: 'Often', value: 'often', score: 2 },
        { label: '总是', labelEn: 'Always', value: 'always', score: 3 },
      ],
    },
    {
      id: 'shsq_2',
      text: '容易疲劳',
      textEn: 'Getting tired easily',
      options: [
        { label: '从不', labelEn: 'Never', value: 'never', score: 0 },
        { label: '偶尔', labelEn: 'Sometimes', value: 'sometimes', score: 1 },
        { label: '经常', labelEn: 'Often', value: 'often', score: 2 },
        { label: '总是', labelEn: 'Always', value: 'always', score: 3 },
      ],
    },
    {
      id: 'shsq_3',
      text: '早晨起床困难',
      textEn: 'Difficulty waking up in the morning',
      options: [
        { label: '从不', labelEn: 'Never', value: 'never', score: 0 },
        { label: '偶尔', labelEn: 'Sometimes', value: 'sometimes', score: 1 },
        { label: '经常', labelEn: 'Often', value: 'often', score: 2 },
        { label: '总是', labelEn: 'Always', value: 'always', score: 3 },
      ],
    },
    {
      id: 'shsq_4',
      text: '嗜睡或困倦',
      textEn: 'Feeling drowsy or sleepy',
      options: [
        { label: '从不', labelEn: 'Never', value: 'never', score: 0 },
        { label: '偶尔', labelEn: 'Sometimes', value: 'sometimes', score: 1 },
        { label: '经常', labelEn: 'Often', value: 'often', score: 2 },
        { label: '总是', labelEn: 'Always', value: 'always', score: 3 },
      ],
    },
    {
      id: 'shsq_5',
      text: '注意力难以集中',
      textEn: 'Difficulty concentrating',
      options: [
        { label: '从不', labelEn: 'Never', value: 'never', score: 0 },
        { label: '偶尔', labelEn: 'Sometimes', value: 'sometimes', score: 1 },
        { label: '经常', labelEn: 'Often', value: 'often', score: 2 },
        { label: '总是', labelEn: 'Always', value: 'always', score: 3 },
      ],
    },
    {
      id: 'shsq_6',
      text: '记忆力减退',
      textEn: 'Memory decline',
      options: [
        { label: '从不', labelEn: 'Never', value: 'never', score: 0 },
        { label: '偶尔', labelEn: 'Sometimes', value: 'sometimes', score: 1 },
        { label: '经常', labelEn: 'Often', value: 'often', score: 2 },
        { label: '总是', labelEn: 'Always', value: 'always', score: 3 },
      ],
    },
    {
      id: 'shsq_7',
      text: '反应变慢',
      textEn: 'Slower reactions',
      options: [
        { label: '从不', labelEn: 'Never', value: 'never', score: 0 },
        { label: '偶尔', labelEn: 'Sometimes', value: 'sometimes', score: 1 },
        { label: '经常', labelEn: 'Often', value: 'often', score: 2 },
        { label: '总是', labelEn: 'Always', value: 'always', score: 3 },
      ],
    },
    {
      id: 'shsq_8',
      text: '四肢乏力',
      textEn: 'Weakness in limbs',
      options: [
        { label: '从不', labelEn: 'Never', value: 'never', score: 0 },
        { label: '偶尔', labelEn: 'Sometimes', value: 'sometimes', score: 1 },
        { label: '经常', labelEn: 'Often', value: 'often', score: 2 },
        { label: '总是', labelEn: 'Always', value: 'always', score: 3 },
      ],
    },
    {
      id: 'shsq_9',
      text: '懒于活动',
      textEn: 'Reluctant to be active',
      options: [
        { label: '从不', labelEn: 'Never', value: 'never', score: 0 },
        { label: '偶尔', labelEn: 'Sometimes', value: 'sometimes', score: 1 },
        { label: '经常', labelEn: 'Often', value: 'often', score: 2 },
        { label: '总是', labelEn: 'Always', value: 'always', score: 3 },
      ],
    },
    // Cardiovascular Dimension (心血管维度) - Q10-Q13
    {
      id: 'shsq_10',
      text: '头晕目眩',
      textEn: 'Dizziness',
      options: [
        { label: '从不', labelEn: 'Never', value: 'never', score: 0 },
        { label: '偶尔', labelEn: 'Sometimes', value: 'sometimes', score: 1 },
        { label: '经常', labelEn: 'Often', value: 'often', score: 2 },
        { label: '总是', labelEn: 'Always', value: 'always', score: 3 },
      ],
    },
    {
      id: 'shsq_11',
      text: '心慌心悸',
      textEn: 'Palpitations',
      options: [
        { label: '从不', labelEn: 'Never', value: 'never', score: 0 },
        { label: '偶尔', labelEn: 'Sometimes', value: 'sometimes', score: 1 },
        { label: '经常', labelEn: 'Often', value: 'often', score: 2 },
        { label: '总是', labelEn: 'Always', value: 'always', score: 3 },
      ],
    },
    {
      id: 'shsq_12',
      text: '胸闷气短',
      textEn: 'Chest tightness or shortness of breath',
      options: [
        { label: '从不', labelEn: 'Never', value: 'never', score: 0 },
        { label: '偶尔', labelEn: 'Sometimes', value: 'sometimes', score: 1 },
        { label: '经常', labelEn: 'Often', value: 'often', score: 2 },
        { label: '总是', labelEn: 'Always', value: 'always', score: 3 },
      ],
    },
    {
      id: 'shsq_13',
      text: '眼睛干涩或视力模糊',
      textEn: 'Dry eyes or blurred vision',
      options: [
        { label: '从不', labelEn: 'Never', value: 'never', score: 0 },
        { label: '偶尔', labelEn: 'Sometimes', value: 'sometimes', score: 1 },
        { label: '经常', labelEn: 'Often', value: 'often', score: 2 },
        { label: '总是', labelEn: 'Always', value: 'always', score: 3 },
      ],
    },
    // Digestive Dimension (消化维度) - Q14-Q17
    {
      id: 'shsq_14',
      text: '食欲不振',
      textEn: 'Loss of appetite',
      options: [
        { label: '从不', labelEn: 'Never', value: 'never', score: 0 },
        { label: '偶尔', labelEn: 'Sometimes', value: 'sometimes', score: 1 },
        { label: '经常', labelEn: 'Often', value: 'often', score: 2 },
        { label: '总是', labelEn: 'Always', value: 'always', score: 3 },
      ],
    },
    {
      id: 'shsq_15',
      text: '腹胀或消化不良',
      textEn: 'Bloating or indigestion',
      options: [
        { label: '从不', labelEn: 'Never', value: 'never', score: 0 },
        { label: '偶尔', labelEn: 'Sometimes', value: 'sometimes', score: 1 },
        { label: '经常', labelEn: 'Often', value: 'often', score: 2 },
        { label: '总是', labelEn: 'Always', value: 'always', score: 3 },
      ],
    },
    {
      id: 'shsq_16',
      text: '便秘或腹泻',
      textEn: 'Constipation or diarrhea',
      options: [
        { label: '从不', labelEn: 'Never', value: 'never', score: 0 },
        { label: '偶尔', labelEn: 'Sometimes', value: 'sometimes', score: 1 },
        { label: '经常', labelEn: 'Often', value: 'often', score: 2 },
        { label: '总是', labelEn: 'Always', value: 'always', score: 3 },
      ],
    },
    {
      id: 'shsq_17',
      text: '口干舌燥',
      textEn: 'Dry mouth',
      options: [
        { label: '从不', labelEn: 'Never', value: 'never', score: 0 },
        { label: '偶尔', labelEn: 'Sometimes', value: 'sometimes', score: 1 },
        { label: '经常', labelEn: 'Often', value: 'often', score: 2 },
        { label: '总是', labelEn: 'Always', value: 'always', score: 3 },
      ],
    },
    // Immune Dimension (免疫维度) - Q18-Q21
    {
      id: 'shsq_18',
      text: '容易感冒',
      textEn: 'Catching colds easily',
      options: [
        { label: '从不', labelEn: 'Never', value: 'never', score: 0 },
        { label: '偶尔', labelEn: 'Sometimes', value: 'sometimes', score: 1 },
        { label: '经常', labelEn: 'Often', value: 'often', score: 2 },
        { label: '总是', labelEn: 'Always', value: 'always', score: 3 },
      ],
    },
    {
      id: 'shsq_19',
      text: '伤口愈合慢',
      textEn: 'Slow wound healing',
      options: [
        { label: '从不', labelEn: 'Never', value: 'never', score: 0 },
        { label: '偶尔', labelEn: 'Sometimes', value: 'sometimes', score: 1 },
        { label: '经常', labelEn: 'Often', value: 'often', score: 2 },
        { label: '总是', labelEn: 'Always', value: 'always', score: 3 },
      ],
    },
    {
      id: 'shsq_20',
      text: '皮肤问题（干燥、过敏、长痘）',
      textEn: 'Skin problems (dryness, allergy, acne)',
      options: [
        { label: '从不', labelEn: 'Never', value: 'never', score: 0 },
        { label: '偶尔', labelEn: 'Sometimes', value: 'sometimes', score: 1 },
        { label: '经常', labelEn: 'Often', value: 'often', score: 2 },
        { label: '总是', labelEn: 'Always', value: 'always', score: 3 },
      ],
    },
    {
      id: 'shsq_21',
      text: '关节或肌肉酸痛',
      textEn: 'Joint or muscle pain',
      options: [
        { label: '从不', labelEn: 'Never', value: 'never', score: 0 },
        { label: '偶尔', labelEn: 'Sometimes', value: 'sometimes', score: 1 },
        { label: '经常', labelEn: 'Often', value: 'often', score: 2 },
        { label: '总是', labelEn: 'Always', value: 'always', score: 3 },
      ],
    },
    // Mental Dimension (精神维度) - Q22-Q25
    {
      id: 'shsq_22',
      text: '情绪低落或抑郁',
      textEn: 'Low mood or depression',
      options: [
        { label: '从不', labelEn: 'Never', value: 'never', score: 0 },
        { label: '偶尔', labelEn: 'Sometimes', value: 'sometimes', score: 1 },
        { label: '经常', labelEn: 'Often', value: 'often', score: 2 },
        { label: '总是', labelEn: 'Always', value: 'always', score: 3 },
      ],
    },
    {
      id: 'shsq_23',
      text: '烦躁易怒',
      textEn: 'Irritability',
      options: [
        { label: '从不', labelEn: 'Never', value: 'never', score: 0 },
        { label: '偶尔', labelEn: 'Sometimes', value: 'sometimes', score: 1 },
        { label: '经常', labelEn: 'Often', value: 'often', score: 2 },
        { label: '总是', labelEn: 'Always', value: 'always', score: 3 },
      ],
    },
    {
      id: 'shsq_24',
      text: '失眠或睡眠质量差',
      textEn: 'Insomnia or poor sleep quality',
      options: [
        { label: '从不', labelEn: 'Never', value: 'never', score: 0 },
        { label: '偶尔', labelEn: 'Sometimes', value: 'sometimes', score: 1 },
        { label: '经常', labelEn: 'Often', value: 'often', score: 2 },
        { label: '总是', labelEn: 'Always', value: 'always', score: 3 },
      ],
    },
    {
      id: 'shsq_25',
      text: '对生活缺乏兴趣',
      textEn: 'Lack of interest in life',
      options: [
        { label: '从不', labelEn: 'Never', value: 'never', score: 0 },
        { label: '偶尔', labelEn: 'Sometimes', value: 'sometimes', score: 1 },
        { label: '经常', labelEn: 'Often', value: 'often', score: 2 },
        { label: '总是', labelEn: 'Always', value: 'always', score: 3 },
      ],
    },
  ],
  thresholds: [
    { minScore: 0, maxScore: 18, severity: 'minimal', label: '健康状态良好', labelEn: 'Good health status' },
    { minScore: 19, maxScore: 37, severity: 'mild', label: '轻度亚健康', labelEn: 'Mild sub-health' },
    { minScore: 38, maxScore: 56, severity: 'moderate', label: '中度亚健康', labelEn: 'Moderate sub-health' },
    { minScore: 57, maxScore: 75, severity: 'severe', label: '重度亚健康', labelEn: 'Severe sub-health' },
  ],
  tags: [
    {
      condition: (score) => score >= 38,
      tag: '亚健康状态',
      tagEn: 'Sub-Health Status',
    },
    {
      condition: (score, subscores) => (subscores?.fatigue ?? 0) >= 18,
      tag: '慢性疲劳',
      tagEn: 'Chronic Fatigue',
    },
    {
      condition: (score, subscores) => (subscores?.mental ?? 0) >= 8,
      tag: '情绪困扰',
      tagEn: 'Emotional Distress',
    },
    {
      condition: (score, subscores) => (subscores?.immune ?? 0) >= 8,
      tag: '免疫力差',
      tagEn: 'Weak Immunity',
    },
  ],
};

// ============ Scoring Functions ============

/**
 * Calculate total score for a scale
 */
export function calculateScaleScore(
  scale: ScaleDefinition,
  answers: Record<string, string>
): ScaleResult {
  let totalScore = 0;
  const subscores: Record<string, number> = {};

  // Calculate SHSQ-25 subscores by dimension
  if (scale.id === 'shsq25') {
    subscores.fatigue = 0;      // Q1-Q9
    subscores.cardiovascular = 0; // Q10-Q13
    subscores.digestive = 0;    // Q14-Q17
    subscores.immune = 0;       // Q18-Q21
    subscores.mental = 0;       // Q22-Q25
  }

  for (const question of scale.questions) {
    const answer = answers[question.id];
    const option = question.options.find(opt => opt.value === answer);
    if (option) {
      totalScore += option.score;

      // Track subscores for SHSQ-25
      if (scale.id === 'shsq25') {
        const qNum = parseInt(question.id.split('_')[1]);
        if (qNum <= 9) subscores.fatigue += option.score;
        else if (qNum <= 13) subscores.cardiovascular += option.score;
        else if (qNum <= 17) subscores.digestive += option.score;
        else if (qNum <= 21) subscores.immune += option.score;
        else subscores.mental += option.score;
      }
    }
  }

  // Determine severity
  const threshold = scale.thresholds.find(
    t => totalScore >= t.minScore && totalScore <= t.maxScore
  );
  const severity = threshold?.label ?? '未知';

  // Collect triggered tags
  const tags: string[] = [];
  for (const tagMapping of scale.tags) {
    if (tagMapping.condition(totalScore, subscores)) {
      tags.push(tagMapping.tag);
    }
  }

  return {
    scaleId: scale.id,
    totalScore,
    subscores: scale.id === 'shsq25' ? subscores : undefined,
    severity,
    tags,
  };
}

/**
 * Get severity level for display
 */
export function getSeverityLevel(
  scale: ScaleDefinition,
  score: number
): ScaleThreshold | undefined {
  return scale.thresholds.find(
    t => score >= t.minScore && score <= t.maxScore
  );
}

/**
 * Get all available scales
 */
export function getAllScales(): ScaleDefinition[] {
  return [GAD7_SCALE, SHSQ25_SCALE];
}

/**
 * Get scale by ID
 */
export function getScaleById(id: string): ScaleDefinition | undefined {
  const scales: Record<string, ScaleDefinition> = {
    gad7: GAD7_SCALE,
    shsq25: SHSQ25_SCALE,
  };
  return scales[id];
}

// ============ Reserved for Future: AMS & MRS Scales ============

/**
 * AMS Scale (Aging Males' Symptoms) - Reserved
 * To be implemented when male-specific features are needed
 */
// export const AMS_SCALE: ScaleDefinition = { ... };

/**
 * MRS Scale (Menopause Rating Scale) - Reserved
 * To be implemented when female-specific features are needed
 */
// export const MRS_SCALE: ScaleDefinition = { ... };
