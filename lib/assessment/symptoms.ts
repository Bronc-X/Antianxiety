// 常见症状库（用于模糊搜索和建议）
export const SYMPTOM_DATABASE = {
  // 头部
  headache: {
    id: 'headache',
    name_zh: '头痛',
    name_en: 'Headache',
    description_zh: '头部任何部位的疼痛',
    description_en: 'Any pain in the head',
    related: ['migraine', 'tension_headache', 'sinus_pain', 'dizziness']
  },
  migraine: {
    id: 'migraine',
    name_zh: '偏头痛',
    name_en: 'Migraine',
    description_zh: '通常为单侧的搏动性头痛，可能伴有恶心',
    description_en: 'Usually one-sided throbbing headache, may include nausea',
    related: ['headache', 'nausea', 'light_sensitivity']
  },
  dizziness: {
    id: 'dizziness',
    name_zh: '头晕',
    name_en: 'Dizziness',
    description_zh: '感觉头重脚轻或不稳',
    description_en: 'Feeling lightheaded or unsteady',
    related: ['vertigo', 'nausea', 'fatigue']
  },
  
  // 胸部
  chest_pain: {
    id: 'chest_pain',
    name_zh: '胸痛',
    name_en: 'Chest pain',
    description_zh: '胸部区域的疼痛或不适',
    description_en: 'Pain or discomfort in the chest area',
    related: ['shortness_of_breath', 'heart_palpitations', 'arm_pain']
  },
  shortness_of_breath: {
    id: 'shortness_of_breath',
    name_zh: '呼吸困难',
    name_en: 'Shortness of breath',
    description_zh: '感觉呼吸费力或气不够用',
    description_en: 'Difficulty breathing or feeling like you cannot get enough air',
    related: ['chest_pain', 'cough', 'wheezing']
  },
  
  // 腹部
  abdominal_pain: {
    id: 'abdominal_pain',
    name_zh: '腹痛',
    name_en: 'Abdominal pain',
    description_zh: '腹部区域的疼痛',
    description_en: 'Pain in the stomach or belly area',
    related: ['nausea', 'vomiting', 'diarrhea', 'bloating']
  },
  nausea: {
    id: 'nausea',
    name_zh: '恶心',
    name_en: 'Nausea',
    description_zh: '想吐的感觉',
    description_en: 'Feeling like you might vomit',
    related: ['vomiting', 'abdominal_pain', 'dizziness']
  },
  
  // 全身
  fatigue: {
    id: 'fatigue',
    name_zh: '疲劳',
    name_en: 'Fatigue',
    description_zh: '持续的疲倦感，休息后不能缓解',
    description_en: 'Persistent tiredness that does not improve with rest',
    related: ['weakness', 'sleep_problems', 'muscle_aches']
  },
  fever: {
    id: 'fever',
    name_zh: '发烧',
    name_en: 'Fever',
    description_zh: '体温升高',
    description_en: 'Elevated body temperature',
    related: ['chills', 'sweating', 'body_aches']
  },
  
  // 皮肤
  rash: {
    id: 'rash',
    name_zh: '皮疹',
    name_en: 'Rash',
    description_zh: '皮肤上的异常变化',
    description_en: 'Abnormal changes on the skin',
    related: ['itching', 'swelling', 'redness']
  },
  
  // 耳鼻喉
  sore_throat: {
    id: 'sore_throat',
    name_zh: '喉咙痛',
    name_en: 'Sore throat',
    description_zh: '喉咙疼痛或不适',
    description_en: 'Pain or discomfort in the throat',
    related: ['cough', 'fever', 'difficulty_swallowing']
  },
  cough: {
    id: 'cough',
    name_zh: '咳嗽',
    name_en: 'Cough',
    description_zh: '反复咳嗽',
    description_en: 'Repeated coughing',
    related: ['sore_throat', 'shortness_of_breath', 'chest_pain']
  },
  runny_nose: {
    id: 'runny_nose',
    name_zh: '流鼻涕',
    name_en: 'Runny nose',
    description_zh: '鼻腔分泌物增多',
    description_en: 'Excess nasal discharge',
    related: ['stuffy_nose', 'sneezing', 'sinus_pain']
  },
  stuffy_nose: {
    id: 'stuffy_nose',
    name_zh: '鼻塞',
    name_en: 'Stuffy nose',
    description_zh: '鼻腔堵塞，呼吸不畅',
    description_en: 'Blocked nasal passages',
    related: ['runny_nose', 'sinus_pain', 'headache']
  },
  sinus_pain: {
    id: 'sinus_pain',
    name_zh: '鼻窦痛',
    name_en: 'Sinus pain',
    description_zh: '面部鼻窦区域的疼痛或压迫感',
    description_en: 'Pain or pressure in the sinus areas of the face',
    related: ['headache', 'stuffy_nose', 'runny_nose']
  },
  ear_pain: {
    id: 'ear_pain',
    name_zh: '耳痛',
    name_en: 'Ear pain',
    description_zh: '耳朵疼痛',
    description_en: 'Pain in the ear',
    related: ['hearing_loss', 'tinnitus', 'dizziness']
  },
  tinnitus: {
    id: 'tinnitus',
    name_zh: '耳鸣',
    name_en: 'Tinnitus',
    description_zh: '耳朵里听到铃声、嗡嗡声或其他声音',
    description_en: 'Hearing ringing, buzzing, or other sounds in the ear',
    related: ['ear_pain', 'hearing_loss', 'dizziness']
  },
  
  // 肌肉骨骼
  back_pain: {
    id: 'back_pain',
    name_zh: '背痛',
    name_en: 'Back pain',
    description_zh: '背部任何部位的疼痛',
    description_en: 'Pain in any part of the back',
    related: ['muscle_aches', 'stiffness', 'numbness']
  },
  joint_pain: {
    id: 'joint_pain',
    name_zh: '关节痛',
    name_en: 'Joint pain',
    description_zh: '关节部位的疼痛',
    description_en: 'Pain in the joints',
    related: ['swelling', 'stiffness', 'muscle_aches']
  },
  knee_pain: {
    id: 'knee_pain',
    name_zh: '膝盖痛',
    name_en: 'Knee pain',
    description_zh: '膝盖部位的疼痛',
    description_en: 'Pain in the knee',
    related: ['joint_pain', 'swelling', 'stiffness']
  }
};

export type SymptomId = keyof typeof SYMPTOM_DATABASE;

export interface SymptomSearchResult {
  id: string;
  name: string;
  description: string;
  score: number;
}

/**
 * 模糊搜索症状
 */
export function searchSymptoms(
  query: string, 
  language: 'zh' | 'en',
  limit: number = 5
): SymptomSearchResult[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];

  const results: SymptomSearchResult[] = [];

  for (const [id, symptom] of Object.entries(SYMPTOM_DATABASE)) {
    const name = language === 'zh' ? symptom.name_zh : symptom.name_en;
    const description = language === 'zh' ? symptom.description_zh : symptom.description_en;
    
    // 计算匹配分数
    let score = 0;
    
    // 精确匹配名称
    if (name.toLowerCase() === normalizedQuery) {
      score = 100;
    }
    // 名称包含查询
    else if (name.toLowerCase().includes(normalizedQuery)) {
      score = 80;
    }
    // 查询包含名称
    else if (normalizedQuery.includes(name.toLowerCase())) {
      score = 70;
    }
    // 描述包含查询
    else if (description.toLowerCase().includes(normalizedQuery)) {
      score = 50;
    }
    // ID 匹配
    else if (id.includes(normalizedQuery.replace(/\s+/g, '_'))) {
      score = 40;
    }

    if (score > 0) {
      results.push({ id, name, description, score });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * 获取相关症状建议
 */
export function getRelatedSymptoms(
  symptomId: string,
  language: 'zh' | 'en'
): SymptomSearchResult[] {
  const symptom = SYMPTOM_DATABASE[symptomId as SymptomId];
  if (!symptom) return [];

  return symptom.related
    .filter(id => id in SYMPTOM_DATABASE)
    .map(id => {
      const related = SYMPTOM_DATABASE[id as SymptomId];
      return {
        id,
        name: language === 'zh' ? related.name_zh : related.name_en,
        description: language === 'zh' ? related.description_zh : related.description_en,
        score: 100
      };
    });
}

/**
 * 根据主诉获取建议症状
 */
export function getSuggestedSymptoms(
  chiefComplaint: string,
  language: 'zh' | 'en'
): SymptomSearchResult[] {
  // 先搜索主诉
  const directMatches = searchSymptoms(chiefComplaint, language, 3);
  
  // 获取相关症状
  const relatedIds = new Set<string>();
  for (const match of directMatches) {
    const symptom = SYMPTOM_DATABASE[match.id as SymptomId];
    if (symptom) {
      symptom.related.forEach(id => relatedIds.add(id));
    }
  }

  // 合并结果
  const allResults = [...directMatches];
  for (const id of relatedIds) {
    if (!allResults.some(r => r.id === id) && id in SYMPTOM_DATABASE) {
      const symptom = SYMPTOM_DATABASE[id as SymptomId];
      allResults.push({
        id,
        name: language === 'zh' ? symptom.name_zh : symptom.name_en,
        description: language === 'zh' ? symptom.description_zh : symptom.description_en,
        score: 60
      });
    }
  }

  return allResults.slice(0, 6);
}
