/**
 * 贝叶斯证据系统 (Bayesian Evidence System)
 * 
 * 核心模块：处理证据权重计算、归一化和序列化
 * 用于"认知天平"系统的证据处理
 */

// ============================================
// Types
// ============================================

export type EvidenceType = 'bio' | 'science' | 'action';

export interface Evidence {
  type: EvidenceType;
  value: string;
  weight: number;
  source_id?: string;
  consensus?: number;
  raw_data?: Record<string, unknown>;
}

export interface EvidenceWeightBounds {
  min: number;
  max: number;
}

export interface BayesianCalculationResult {
  prior: number;
  posterior: number;
  evidenceStack: Evidence[];
  exaggerationFactor: number;
  calculatedAt: Date;
}

// ============================================
// Constants
// ============================================

/**
 * 证据权重边界
 * 根据 Requirements 5.2, 5.3, 5.4
 */
export const EVIDENCE_WEIGHT_BOUNDS: Record<EvidenceType, EvidenceWeightBounds> = {
  bio: { min: 0.2, max: 0.4 },
  science: { min: 0.3, max: 0.6 },
  action: { min: 0.05, max: 0.2 }
};

/**
 * 默认共识值（当未提供时使用）
 */
export const DEFAULT_CONSENSUS = 0.7;

/**
 * 默认权重（当未提供时使用）
 */
export const DEFAULT_WEIGHT = 0.1;

// ============================================
// Weight Validation Functions
// ============================================

/**
 * 验证单个证据的权重是否在有效范围内
 * 
 * @param evidence - 要验证的证据
 * @returns 权重是否有效
 * 
 * **Validates: Requirements 5.2, 5.3, 5.4**
 */
export function validateEvidenceWeight(evidence: Evidence): boolean {
  const bounds = EVIDENCE_WEIGHT_BOUNDS[evidence.type];
  if (!bounds) {
    return false;
  }
  return evidence.weight >= bounds.min && evidence.weight <= bounds.max;
}

/**
 * 验证整个证据栈的权重
 * 
 * @param evidenceStack - 证据栈
 * @returns 所有证据权重是否有效
 */
export function validateEvidenceStack(evidenceStack: Evidence[]): boolean {
  if (!evidenceStack || evidenceStack.length === 0) {
    return true;
  }
  return evidenceStack.every(validateEvidenceWeight);
}

/**
 * 将权重钳制到有效范围内
 * 
 * @param type - 证据类型
 * @param weight - 原始权重
 * @returns 钳制后的权重
 */
export function clampWeight(type: EvidenceType, weight: number): number {
  const bounds = EVIDENCE_WEIGHT_BOUNDS[type];
  if (!bounds) {
    return weight;
  }
  return Math.max(bounds.min, Math.min(bounds.max, weight));
}

/**
 * 根据数据质量计算生理证据权重
 * 
 * @param dataQuality - 数据质量 (0-1)
 * @returns 计算后的权重
 */
export function calculateBioWeight(dataQuality: number): number {
  const { min, max } = EVIDENCE_WEIGHT_BOUNDS.bio;
  return min + (max - min) * Math.max(0, Math.min(1, dataQuality));
}

/**
 * 根据共识分数计算科学证据权重
 * 
 * @param consensusScore - 共识分数 (0-1)
 * @returns 计算后的权重
 */
export function calculateScienceWeight(consensusScore: number): number {
  const { min, max } = EVIDENCE_WEIGHT_BOUNDS.science;
  return min + (max - min) * Math.max(0, Math.min(1, consensusScore));
}

/**
 * 根据行为类型计算行为证据权重
 * 
 * @param actionType - 行为类型
 * @returns 计算后的权重
 */
export function calculateActionWeight(actionType: string): number {
  const { min, max } = EVIDENCE_WEIGHT_BOUNDS.action;
  
  // 不同行为类型的权重映射
  const actionWeights: Record<string, number> = {
    breathing_exercise: 0.15,
    meditation: 0.18,
    exercise: 0.2,
    sleep_improvement: 0.15,
    hydration: 0.08,
    default: 0.1
  };
  
  const baseWeight = actionWeights[actionType] || actionWeights.default;
  return Math.max(min, Math.min(max, baseWeight));
}

// ============================================
// Weight Normalization Functions
// ============================================

/**
 * 归一化证据权重，使总和为 1.0
 * 
 * @param evidenceStack - 证据栈
 * @returns 归一化后的证据栈
 * 
 * **Validates: Requirements 5.5**
 */
export function normalizeWeights(evidenceStack: Evidence[]): Evidence[] {
  if (!evidenceStack || evidenceStack.length === 0) {
    return [];
  }

  const totalWeight = evidenceStack.reduce((sum, e) => sum + (e.weight || 0), 0);
  
  if (totalWeight === 0) {
    // 如果总权重为0，平均分配
    const equalWeight = 1 / evidenceStack.length;
    return evidenceStack.map(e => ({ ...e, weight: equalWeight }));
  }

  return evidenceStack.map(e => ({
    ...e,
    weight: (e.weight || 0) / totalWeight
  }));
}

/**
 * 检查归一化后的权重总和是否为 1.0
 * 
 * @param evidenceStack - 证据栈
 * @param tolerance - 容差 (默认 0.001)
 * @returns 是否归一化
 */
export function isNormalized(evidenceStack: Evidence[], tolerance = 0.001): boolean {
  if (!evidenceStack || evidenceStack.length === 0) {
    return true;
  }
  
  const totalWeight = evidenceStack.reduce((sum, e) => sum + (e.weight || 0), 0);
  return Math.abs(totalWeight - 1.0) < tolerance;
}

// ============================================
// Serialization Functions
// ============================================

/**
 * 序列化证据栈为 JSON 字符串
 * 
 * @param evidenceStack - 证据栈
 * @returns JSON 字符串
 * 
 * **Validates: Requirements 3.5, 7.5**
 */
export function serializeEvidenceStack(evidenceStack: Evidence[]): string {
  return JSON.stringify(evidenceStack);
}

/**
 * 反序列化 JSON 字符串为证据栈
 * 
 * @param json - JSON 字符串
 * @returns 证据栈
 * @throws 如果 JSON 无效或结构不正确
 * 
 * **Validates: Requirements 3.5, 7.5**
 */
export function deserializeEvidenceStack(json: string): Evidence[] {
  const parsed = JSON.parse(json);
  
  if (!Array.isArray(parsed)) {
    throw new Error('Evidence stack must be an array');
  }
  
  // 验证每个元素的结构
  for (const item of parsed) {
    if (!item.type || !['bio', 'science', 'action'].includes(item.type)) {
      throw new Error(`Invalid evidence type: ${item.type}`);
    }
    if (typeof item.weight !== 'number' || item.weight < 0 || item.weight > 1) {
      throw new Error(`Invalid evidence weight: ${item.weight}`);
    }
  }
  
  return parsed as Evidence[];
}

/**
 * 验证 JSON 字符串是否为有效的证据栈
 * 
 * @param json - JSON 字符串
 * @returns 是否有效
 */
export function isValidEvidenceStackJson(json: string): boolean {
  try {
    deserializeEvidenceStack(json);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// Bayesian Calculation Functions
// ============================================

/**
 * 计算贝叶斯后验分数
 * TypeScript 实现，与 PostgreSQL 函数逻辑一致
 * 
 * @param prior - 先验分数 (0-100)
 * @param evidenceStack - 证据栈
 * @returns 后验分数 (0-100)
 * 
 * **Validates: Requirements 3.2, 7.2**
 */
export function calculateBayesianPosterior(prior: number, evidenceStack: Evidence[]): number {
  // 验证输入
  if (prior < 0 || prior > 100) {
    throw new Error('Prior score must be between 0 and 100');
  }

  // 如果证据栈为空，返回先验值
  if (!evidenceStack || evidenceStack.length === 0) {
    return prior;
  }

  // 计算总权重
  let totalWeight = 0;
  for (const evidence of evidenceStack) {
    totalWeight += evidence.weight || DEFAULT_WEIGHT;
  }

  // 如果总权重为0，返回先验值
  if (totalWeight === 0) {
    return prior;
  }

  // 计算归一化后的加权共识
  let weightedSum = 0;
  for (const evidence of evidenceStack) {
    const weight = evidence.weight || DEFAULT_WEIGHT;
    const consensus = evidence.consensus ?? DEFAULT_CONSENSUS;
    weightedSum += (weight / totalWeight) * consensus;
  }

  // 似然度 = 加权共识平均值
  const likelihood = weightedSum;

  // 证据强度基于总权重
  const evidenceStrength = 0.5 + (Math.min(totalWeight, 1.0) * 0.3);

  // 贝叶斯公式简化版
  let posterior = (likelihood * (prior / 100)) / evidenceStrength * 100;

  // 钳制到有效范围 [0, 100]
  posterior = Math.max(0, Math.min(100, posterior));

  return Math.round(posterior);
}

/**
 * 计算夸大因子
 * 
 * @param prior - 先验分数
 * @param posterior - 后验分数
 * @returns 夸大因子 (prior / posterior)
 * 
 * **Validates: Requirements 3.3**
 */
export function calculateExaggerationFactor(prior: number, posterior: number): number {
  if (posterior <= 0) {
    return Infinity;
  }
  return Math.round((prior / posterior) * 10) / 10;
}

/**
 * 执行完整的贝叶斯计算
 * 
 * @param prior - 先验分数 (0-100)
 * @param evidenceStack - 证据栈
 * @returns 完整的计算结果
 */
export function performBayesianCalculation(
  prior: number,
  evidenceStack: Evidence[]
): BayesianCalculationResult {
  const normalizedStack = normalizeWeights(evidenceStack);
  const posterior = calculateBayesianPosterior(prior, normalizedStack);
  const exaggerationFactor = calculateExaggerationFactor(prior, posterior);

  return {
    prior,
    posterior,
    evidenceStack: normalizedStack,
    exaggerationFactor,
    calculatedAt: new Date()
  };
}

// ============================================
// Evidence Factory Functions
// ============================================

/**
 * 创建生理证据
 * 
 * @param value - 证据值描述
 * @param dataQuality - 数据质量 (0-1)
 * @param rawData - 原始数据
 * @returns 生理证据对象
 */
export function createBioEvidence(
  value: string,
  dataQuality: number,
  rawData?: Record<string, unknown>
): Evidence {
  return {
    type: 'bio',
    value,
    weight: calculateBioWeight(dataQuality),
    consensus: 0.8, // 生理数据通常有较高的可信度
    raw_data: rawData
  };
}

/**
 * 创建科学证据
 * 
 * @param value - 论文标题
 * @param sourceId - Semantic Scholar paper ID
 * @param consensusScore - 共识分数 (0-1)
 * @returns 科学证据对象
 */
export function createScienceEvidence(
  value: string,
  sourceId: string,
  consensusScore: number
): Evidence {
  return {
    type: 'science',
    value,
    weight: calculateScienceWeight(consensusScore),
    source_id: sourceId,
    consensus: consensusScore
  };
}

/**
 * 创建行为证据
 * 
 * @param actionType - 行为类型
 * @param value - 行为描述
 * @param rawData - 原始数据
 * @returns 行为证据对象
 */
export function createActionEvidence(
  actionType: string,
  value: string,
  rawData?: Record<string, unknown>
): Evidence {
  return {
    type: 'action',
    value,
    weight: calculateActionWeight(actionType),
    consensus: 0.6, // 行为证据的共识度相对较低
    raw_data: rawData
  };
}
