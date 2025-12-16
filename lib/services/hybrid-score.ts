/**
 * Hybrid Score Calculator
 * 混合评分计算 - 纯函数，用于测试
 * 
 * @module lib/services/hybrid-score
 */

// ==================== 类型定义 ====================

export interface HybridSearchWeights {
  similarity: number;
  authority: number;
}

export interface HybridSearchResult {
  id: string;
  content: string;
  metadata: {
    emotion_tags?: string[];
    consensus_score?: number;
    source_type?: string;
  };
  similarity_score: number;
  consensus_score: number;
  final_score: number;
}

// ==================== 默认配置 ====================

export const DEFAULT_WEIGHTS: HybridSearchWeights = {
  similarity: 0.6,
  authority: 0.4
};

// ==================== 核心函数 ====================

/**
 * 计算混合评分（纯函数，用于测试）
 * 公式: (similarity * similarity_weight) + (consensus * authority_weight)
 * 
 * @param similarity 相似度分数 (0-1)
 * @param consensus 共识分数 (0-1 或 null)
 * @param weights 权重配置
 * @returns 最终评分
 */
export function calculateHybridScore(
  similarity: number,
  consensus: number | null,
  weights: HybridSearchWeights = DEFAULT_WEIGHTS
): number {
  const consensusValue = consensus ?? 0;
  return (similarity * weights.similarity) + (consensusValue * weights.authority);
}

/**
 * 对搜索结果进行排序和限制
 * 
 * @param results 搜索结果数组
 * @param matchCount 返回数量限制
 * @returns 排序并限制后的结果
 */
export function orderAndLimitResults<T extends { final_score: number }>(
  results: T[],
  matchCount: number
): T[] {
  return [...results]
    .sort((a, b) => b.final_score - a.final_score)
    .slice(0, matchCount);
}

/**
 * 验证权重配置是否有效
 * 
 * @param weights 权重配置
 * @returns 是否有效
 */
export function validateWeights(weights: HybridSearchWeights): boolean {
  return (
    weights.similarity >= 0 &&
    weights.similarity <= 1 &&
    weights.authority >= 0 &&
    weights.authority <= 1
  );
}
