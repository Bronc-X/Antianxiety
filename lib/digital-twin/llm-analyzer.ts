/**
 * Digital Twin LLM Analyzer
 * 
 * 使用大语言模型分析用户健康数据，生成：
 * - 生理状态评测
 * - 纵向预测
 * - 自适应计划
 * 
 * @module lib/digital-twin/llm-analyzer
 */

import { generateText } from 'ai';
import { aiClient, getModelForUseCase, logModelCall } from '@/lib/ai/model-config';
import { searchPapers, type Paper } from '@/lib/services/semantic-scholar';
import type {
  AggregatedUserData,
  PhysiologicalAssessment,
  LongitudinalPredictions,
  AdaptivePlan,
  ScientificBasis,
  MetricScore,
  PredictionTimepoint,
} from '@/types/digital-twin';

// ============================================
// 类型定义
// ============================================

export interface AnalysisPromptContext {
  userData: AggregatedUserData;
  papers: Paper[];
  previousAnalysis?: LLMAnalysisResult;
}

export interface LLMAnalysisResult {
  assessment: PhysiologicalAssessment;
  predictions: LongitudinalPredictions;
  adaptivePlan: AdaptivePlan;
  analysisTimestamp: string;
  modelUsed: string;
  confidenceScore: number;
}

// ============================================
// 常量
// ============================================

const ANALYSIS_TIMEOUT_MS = 60000;
const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 4000, 8000];

// 健康关键词用于论文搜索
const HEALTH_KEYWORDS = [
  'anxiety reduction',
  'sleep quality improvement',
  'stress management',
  'mood regulation',
  'heart rate variability',
  'cognitive behavioral therapy',
];

// ============================================
// 核心函数
// ============================================

/**
 * 使用 LLM 分析用户数据
 */
export async function analyzeWithLLM(
  userData: AggregatedUserData,
  previousAnalysis?: LLMAnalysisResult
): Promise<LLMAnalysisResult> {
  // 1. 获取相关科学论文
  const papers = await fetchRelevantPapers(userData);
  
  // 2. 构建分析上下文
  const context: AnalysisPromptContext = {
    userData,
    papers,
    previousAnalysis,
  };
  
  // 3. 构建提示词
  const prompt = buildAnalysisPrompt(context);
  
  // 4. 调用 LLM
  const modelName = getModelForUseCase('reasoning');
  logModelCall(modelName, 'digital-twin-analysis');
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const { text } = await generateText({
        model: aiClient(modelName),
        prompt,
        maxTokens: 4000,
        temperature: 0.3,
      });
      
      // 5. 解析响应
      const result = parseAnalysisResponse(text, modelName, papers);
      return result;
      
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ LLM 分析失败 (尝试 ${attempt + 1}/${MAX_RETRIES}):`, error);
      
      if (attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_DELAYS[attempt]);
      }
    }
  }
  
  // 所有重试失败，返回基于规则的分析
  console.warn('⚠️ LLM 分析失败，使用规则分析');
  return generateRuleBasedAnalysis(userData, papers);
}

/**
 * 获取相关科学论文
 */
async function fetchRelevantPapers(userData: AggregatedUserData): Promise<Paper[]> {
  const keywords = extractHealthKeywords(userData);
  const allPapers: Paper[] = [];
  
  // 并行搜索多个关键词
  const searchPromises = keywords.slice(0, 3).map(keyword => 
    searchPapers(keyword, 3).catch(() => [])
  );
  
  const results = await Promise.all(searchPromises);
  results.forEach(papers => allPapers.push(...papers));
  
  // 去重并按引用数排序
  const uniquePapers = deduplicatePapers(allPapers);
  return uniquePapers.slice(0, 5);
}

/**
 * 从用户数据提取健康关键词
 */
export function extractHealthKeywords(userData: AggregatedUserData): string[] {
  const keywords: string[] = [];
  
  // 基于基线数据
  if (userData.baseline) {
    if (userData.baseline.gad7Score > 10) {
      keywords.push('anxiety disorder treatment');
    }
    if (userData.baseline.phq9Score > 10) {
      keywords.push('depression intervention');
    }
    if (userData.baseline.isiScore > 14) {
      keywords.push('insomnia cognitive behavioral therapy');
    }
    if (userData.baseline.pss10Score > 20) {
      keywords.push('stress reduction techniques');
    }
  }
  
  // 基于校准趋势
  if (userData.calibrations.length > 0) {
    const avgSleep = userData.calibrations.reduce((sum, c) => sum + c.sleepQuality, 0) / userData.calibrations.length;
    if (avgSleep < 5) {
      keywords.push('sleep quality improvement');
    }
    
    const avgStress = userData.calibrations.reduce((sum, c) => sum + c.stressLevel, 0) / userData.calibrations.length;
    if (avgStress > 6) {
      keywords.push('stress management');
    }
  }
  
  // 基于对话主题
  if (userData.conversationSummary.frequentTopics.length > 0) {
    userData.conversationSummary.frequentTopics.forEach(topic => {
      if (topic.toLowerCase().includes('sleep')) {
        keywords.push('sleep hygiene');
      }
      if (topic.toLowerCase().includes('anxiety') || topic.toLowerCase().includes('worry')) {
        keywords.push('anxiety coping strategies');
      }
    });
  }
  
  // 确保至少有一些默认关键词
  if (keywords.length === 0) {
    keywords.push(...HEALTH_KEYWORDS.slice(0, 2));
  }
  
  return [...new Set(keywords)];
}

/**
 * 构建分析提示词
 */
export function buildAnalysisPrompt(context: AnalysisPromptContext): string {
  const { userData, papers, previousAnalysis } = context;
  
  let prompt = `你是一位专业的健康数据分析师，专注于焦虑、睡眠和压力管理领域。请基于以下用户数据进行全面分析。

## 用户数据

### 基线评估 (问卷数据)
`;

  if (userData.baseline) {
    prompt += `- GAD-7 焦虑量表: ${userData.baseline.gad7Score}/21 (${userData.baseline.interpretations.gad7})
- PHQ-9 抑郁量表: ${userData.baseline.phq9Score}/27 (${userData.baseline.interpretations.phq9})
- ISI 失眠量表: ${userData.baseline.isiScore}/28 (${userData.baseline.interpretations.isi})
- PSS-10 压力量表: ${userData.baseline.pss10Score}/40 (${userData.baseline.interpretations.pss10})
- 评估日期: ${userData.baseline.assessmentDate}
`;
  } else {
    prompt += `暂无基线数据\n`;
  }

  prompt += `
### 每日校准数据 (最近 ${userData.calibrations.length} 天)
`;

  if (userData.calibrations.length > 0) {
    const recentCalibrations = userData.calibrations.slice(-7);
    recentCalibrations.forEach(c => {
      prompt += `- ${c.date}: 睡眠${c.sleepHours}h(质量${c.sleepQuality}/10), 情绪${c.moodScore}/10, 压力${c.stressLevel}/10, 能量${c.energyLevel}/10\n`;
    });
    
    // 添加趋势摘要
    const avgSleep = userData.calibrations.reduce((sum, c) => sum + c.sleepQuality, 0) / userData.calibrations.length;
    const avgMood = userData.calibrations.reduce((sum, c) => sum + c.moodScore, 0) / userData.calibrations.length;
    const avgStress = userData.calibrations.reduce((sum, c) => sum + c.stressLevel, 0) / userData.calibrations.length;
    const avgEnergy = userData.calibrations.reduce((sum, c) => sum + c.energyLevel, 0) / userData.calibrations.length;
    
    prompt += `
平均值: 睡眠质量 ${avgSleep.toFixed(1)}, 情绪 ${avgMood.toFixed(1)}, 压力 ${avgStress.toFixed(1)}, 能量 ${avgEnergy.toFixed(1)}
`;
  } else {
    prompt += `暂无校准数据\n`;
  }

  prompt += `
### 对话分析
- 总消息数: ${userData.conversationSummary.totalMessages}
- 情绪趋势: ${userData.conversationSummary.emotionalTrend}
- 常见话题: ${userData.conversationSummary.frequentTopics.join(', ') || '无'}
- 最后互动: ${userData.conversationSummary.lastInteraction}

### 用户画像
- 年龄: ${userData.profile.age || '未知'}
- 性别: ${userData.profile.gender || '未知'}
- 主要关注: ${userData.profile.primaryConcern || '未指定'}
- 注册日期: ${userData.profile.registrationDate}
`;

  if (papers.length > 0) {
    prompt += `
## 相关科学文献
`;
    papers.forEach((paper, i) => {
      prompt += `${i + 1}. "${paper.title}" (引用: ${paper.citationCount})
   摘要: ${paper.abstract.substring(0, 200)}...
   链接: ${paper.url}
`;
    });
  }

  if (previousAnalysis) {
    prompt += `
## 上次分析参考
- 整体状态: ${previousAnalysis.assessment.overallStatus}
- 焦虑评分: ${previousAnalysis.assessment.anxietyLevel.score}
- 分析时间: ${previousAnalysis.analysisTimestamp}
`;
  }

  prompt += `
## 输出要求

请以 JSON 格式输出分析结果，包含以下结构：

\`\`\`json
{
  "assessment": {
    "overallStatus": "improving|stable|needs_attention",
    "anxietyLevel": { "score": 0-10, "trend": "描述", "confidence": 0-1 },
    "sleepHealth": { "score": 0-10, "trend": "描述", "confidence": 0-1 },
    "stressResilience": { "score": 0-10, "trend": "描述", "confidence": 0-1 },
    "moodStability": { "score": 0-10, "trend": "描述", "confidence": 0-1 },
    "energyLevel": { "score": 0-10, "trend": "描述", "confidence": 0-1 },
    "hrvEstimate": { "score": 0-10, "trend": "描述", "confidence": 0-1 },
    "riskFactors": ["风险因素1", "风险因素2"],
    "strengths": ["优势1", "优势2"],
    "scientificBasis": [
      { "claim": "结论", "paperTitle": "论文标题", "paperUrl": "链接", "citationCount": 数字 }
    ]
  },
  "predictions": {
    "timepoints": [
      { "week": 0, "predictions": { "anxietyScore": { "value": 数字, "confidence": "X.X ± Y.Y" }, ... } },
      { "week": 3, "predictions": { ... } },
      { "week": 6, "predictions": { ... } },
      { "week": 9, "predictions": { ... } },
      { "week": 12, "predictions": { ... } },
      { "week": 15, "predictions": { ... } }
    ],
    "baselineComparison": [
      { "metric": "指标名", "baseline": 数字, "current": 数字, "change": 数字, "changePercent": 数字 }
    ]
  },
  "adaptivePlan": {
    "dailyFocus": [
      { "area": "领域", "priority": "high|medium|low", "action": "行动", "rationale": "理由" }
    ],
    "breathingExercises": [
      { "name": "名称", "duration": "时长", "timing": "时机", "benefit": "益处" }
    ],
    "sleepRecommendations": [
      { "recommendation": "建议", "reason": "原因", "expectedImpact": "预期效果" }
    ],
    "activitySuggestions": [
      { "activity": "活动", "frequency": "频率", "duration": "时长", "benefit": "益处" }
    ],
    "avoidanceBehaviors": ["避免行为1", "避免行为2"],
    "nextCheckpoint": { "date": "日期", "focus": "重点" }
  },
  "confidenceScore": 0-1
}
\`\`\`

注意：
1. 所有评分使用 0-10 分制
2. 预测必须包含 6 个时间点 (week 0, 3, 6, 9, 12, 15)
3. 每个预测值必须包含置信区间 (格式: "X.X ± Y.Y")
4. 使用温和、积极的语言，避免引起焦虑
5. 所有建议必须有科学依据支持
`;

  return prompt;
}

/**
 * 解析 LLM 响应
 */
export function parseAnalysisResponse(
  response: string,
  modelUsed: string,
  papers: Paper[]
): LLMAnalysisResult {
  // 提取 JSON 块
  const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : response;
  
  try {
    const parsed = JSON.parse(jsonStr);
    
    // 验证并补全必要字段
    const assessment = validateAssessment(parsed.assessment, papers);
    const predictions = validatePredictions(parsed.predictions);
    const adaptivePlan = validateAdaptivePlan(parsed.adaptivePlan);
    
    return {
      assessment,
      predictions,
      adaptivePlan,
      analysisTimestamp: new Date().toISOString(),
      modelUsed,
      confidenceScore: parsed.confidenceScore ?? 0.7,
    };
  } catch (error) {
    console.error('❌ 解析 LLM 响应失败:', error);
    throw new Error('Failed to parse LLM response');
  }
}

// ============================================
// 验证函数
// ============================================

function validateAssessment(raw: any, papers: Paper[]): PhysiologicalAssessment {
  const defaultMetric: MetricScore = { score: 5, trend: '数据收集中', confidence: 0.5 };
  
  return {
    overallStatus: raw?.overallStatus || 'stable',
    anxietyLevel: validateMetricScore(raw?.anxietyLevel) || defaultMetric,
    sleepHealth: validateMetricScore(raw?.sleepHealth) || defaultMetric,
    stressResilience: validateMetricScore(raw?.stressResilience) || defaultMetric,
    moodStability: validateMetricScore(raw?.moodStability) || defaultMetric,
    energyLevel: validateMetricScore(raw?.energyLevel) || defaultMetric,
    hrvEstimate: validateMetricScore(raw?.hrvEstimate) || defaultMetric,
    riskFactors: Array.isArray(raw?.riskFactors) ? raw.riskFactors : [],
    strengths: Array.isArray(raw?.strengths) ? raw.strengths : [],
    scientificBasis: validateScientificBasis(raw?.scientificBasis, papers),
  };
}

function validateMetricScore(raw: any): MetricScore | null {
  if (!raw) return null;
  return {
    score: typeof raw.score === 'number' ? Math.max(0, Math.min(10, raw.score)) : 5,
    trend: raw.trend || '稳定',
    confidence: typeof raw.confidence === 'number' ? Math.max(0, Math.min(1, raw.confidence)) : 0.5,
  };
}

function validateScientificBasis(raw: any[], papers: Paper[]): ScientificBasis[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    // 使用提供的论文生成科学依据
    return papers.slice(0, 3).map(paper => ({
      claim: `基于 ${paper.title.substring(0, 50)}... 的研究发现`,
      paperTitle: paper.title,
      paperUrl: paper.url,
      citationCount: paper.citationCount,
    }));
  }
  
  return raw.map(item => ({
    claim: item.claim || '',
    paperTitle: item.paperTitle || '',
    paperUrl: item.paperUrl || '',
    citationCount: item.citationCount || 0,
  }));
}

function validatePredictions(raw: any): LongitudinalPredictions {
  const requiredWeeks = [0, 3, 6, 9, 12, 15];
  
  const timepoints: PredictionTimepoint[] = requiredWeeks.map(week => {
    const existing = raw?.timepoints?.find((t: any) => t.week === week);
    return {
      week,
      predictions: {
        anxietyScore: validatePredictionValue(existing?.predictions?.anxietyScore, 5),
        sleepQuality: validatePredictionValue(existing?.predictions?.sleepQuality, 6),
        stressResilience: validatePredictionValue(existing?.predictions?.stressResilience, 5),
        moodStability: validatePredictionValue(existing?.predictions?.moodStability, 6),
        energyLevel: validatePredictionValue(existing?.predictions?.energyLevel, 6),
        hrvScore: validatePredictionValue(existing?.predictions?.hrvScore, 5),
      },
    };
  });
  
  return {
    timepoints,
    baselineComparison: Array.isArray(raw?.baselineComparison) ? raw.baselineComparison : [],
  };
}

function validatePredictionValue(raw: any, defaultValue: number): { value: number; confidence: string } {
  if (!raw) {
    return { value: defaultValue, confidence: `${defaultValue.toFixed(1)} ± 1.0` };
  }
  
  const value = typeof raw.value === 'number' ? raw.value : defaultValue;
  const confidence = typeof raw.confidence === 'string' ? raw.confidence : `${value.toFixed(1)} ± 1.0`;
  
  return { value, confidence };
}

function validateAdaptivePlan(raw: any): AdaptivePlan {
  return {
    dailyFocus: Array.isArray(raw?.dailyFocus) ? raw.dailyFocus : getDefaultDailyFocus(),
    breathingExercises: Array.isArray(raw?.breathingExercises) ? raw.breathingExercises : getDefaultBreathingExercises(),
    sleepRecommendations: Array.isArray(raw?.sleepRecommendations) ? raw.sleepRecommendations : getDefaultSleepRecommendations(),
    activitySuggestions: Array.isArray(raw?.activitySuggestions) ? raw.activitySuggestions : [],
    avoidanceBehaviors: Array.isArray(raw?.avoidanceBehaviors) ? raw.avoidanceBehaviors : [],
    nextCheckpoint: raw?.nextCheckpoint || {
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      focus: '整体进展评估',
    },
  };
}

// ============================================
// 默认值生成
// ============================================

function getDefaultDailyFocus() {
  return [
    { area: '睡眠', priority: 'high' as const, action: '保持规律作息', rationale: '稳定的睡眠节律有助于调节情绪' },
    { area: '呼吸', priority: 'medium' as const, action: '每日 3 次深呼吸练习', rationale: '激活副交感神经系统' },
  ];
}

function getDefaultBreathingExercises() {
  return [
    { name: '4-7-8 呼吸法', duration: '5 分钟', timing: '睡前', benefit: '促进放松，改善入睡' },
    { name: '腹式呼吸', duration: '3 分钟', timing: '感到紧张时', benefit: '快速缓解焦虑' },
  ];
}

function getDefaultSleepRecommendations() {
  return [
    { recommendation: '固定就寝时间', reason: '建立稳定的昼夜节律', expectedImpact: '2-3 周内改善入睡时间' },
    { recommendation: '睡前 1 小时避免屏幕', reason: '减少蓝光对褪黑素的抑制', expectedImpact: '提高睡眠质量' },
  ];
}

// ============================================
// 规则分析（备用）
// ============================================

function generateRuleBasedAnalysis(
  userData: AggregatedUserData,
  papers: Paper[]
): LLMAnalysisResult {
  // 基于规则的简单分析
  const baseline = userData.baseline;
  const calibrations = userData.calibrations;
  
  // 计算平均值
  const avgSleep = calibrations.length > 0
    ? calibrations.reduce((sum, c) => sum + c.sleepQuality, 0) / calibrations.length
    : 5;
  const avgMood = calibrations.length > 0
    ? calibrations.reduce((sum, c) => sum + c.moodScore, 0) / calibrations.length
    : 5;
  const avgStress = calibrations.length > 0
    ? calibrations.reduce((sum, c) => sum + c.stressLevel, 0) / calibrations.length
    : 5;
  const avgEnergy = calibrations.length > 0
    ? calibrations.reduce((sum, c) => sum + c.energyLevel, 0) / calibrations.length
    : 5;
  
  // 确定整体状态
  let overallStatus: 'improving' | 'stable' | 'needs_attention' = 'stable';
  if (avgMood > 6 && avgStress < 5) {
    overallStatus = 'improving';
  } else if (avgMood < 4 || avgStress > 7) {
    overallStatus = 'needs_attention';
  }
  
  // 计算焦虑评分（基于 GAD-7 和压力）
  const anxietyScore = baseline
    ? Math.max(0, 10 - (baseline.gad7Score / 21) * 10)
    : 10 - avgStress;
  
  const assessment: PhysiologicalAssessment = {
    overallStatus,
    anxietyLevel: { score: anxietyScore, trend: '基于规则分析', confidence: 0.5 },
    sleepHealth: { score: avgSleep, trend: '基于校准数据', confidence: 0.6 },
    stressResilience: { score: 10 - avgStress, trend: '基于校准数据', confidence: 0.6 },
    moodStability: { score: avgMood, trend: '基于校准数据', confidence: 0.6 },
    energyLevel: { score: avgEnergy, trend: '基于校准数据', confidence: 0.6 },
    hrvEstimate: { score: 5, trend: '需要更多数据', confidence: 0.3 },
    riskFactors: [],
    strengths: [],
    scientificBasis: papers.slice(0, 2).map(p => ({
      claim: `参考研究: ${p.title.substring(0, 50)}...`,
      paperTitle: p.title,
      paperUrl: p.url,
      citationCount: p.citationCount,
    })),
  };
  
  // 生成预测
  const predictions = generateRuleBasedPredictions(assessment);
  
  // 生成计划
  const adaptivePlan = validateAdaptivePlan(null);
  
  return {
    assessment,
    predictions,
    adaptivePlan,
    analysisTimestamp: new Date().toISOString(),
    modelUsed: 'rule-based-fallback',
    confidenceScore: 0.5,
  };
}

function generateRuleBasedPredictions(assessment: PhysiologicalAssessment): LongitudinalPredictions {
  const weeks = [0, 3, 6, 9, 12, 15];
  const improvementRate = 0.05; // 每周 5% 改善
  
  const timepoints: PredictionTimepoint[] = weeks.map(week => {
    const factor = 1 + (week * improvementRate);
    return {
      week,
      predictions: {
        anxietyScore: {
          value: Math.min(10, assessment.anxietyLevel.score * factor),
          confidence: `${(assessment.anxietyLevel.score * factor).toFixed(1)} ± 1.5`,
        },
        sleepQuality: {
          value: Math.min(10, assessment.sleepHealth.score * factor),
          confidence: `${(assessment.sleepHealth.score * factor).toFixed(1)} ± 1.2`,
        },
        stressResilience: {
          value: Math.min(10, assessment.stressResilience.score * factor),
          confidence: `${(assessment.stressResilience.score * factor).toFixed(1)} ± 1.3`,
        },
        moodStability: {
          value: Math.min(10, assessment.moodStability.score * factor),
          confidence: `${(assessment.moodStability.score * factor).toFixed(1)} ± 1.1`,
        },
        energyLevel: {
          value: Math.min(10, assessment.energyLevel.score * factor),
          confidence: `${(assessment.energyLevel.score * factor).toFixed(1)} ± 1.2`,
        },
        hrvScore: {
          value: Math.min(10, assessment.hrvEstimate.score * factor),
          confidence: `${(assessment.hrvEstimate.score * factor).toFixed(1)} ± 1.5`,
        },
      },
    };
  });
  
  return {
    timepoints,
    baselineComparison: [],
  };
}

// ============================================
// 辅助函数
// ============================================

function deduplicatePapers(papers: Paper[]): Paper[] {
  const seen = new Set<string>();
  return papers.filter(paper => {
    if (seen.has(paper.paperId)) return false;
    seen.add(paper.paperId);
    return true;
  }).sort((a, b) => b.citationCount - a.citationCount);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// 导出
// ============================================

export {
  fetchRelevantPapers,
  generateRuleBasedAnalysis,
};
