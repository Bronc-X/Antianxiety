/**
 * Consensus Meter Utility Functions
 * 科学共识仪表工具函数
 */

export type ConsensusLevel = 'high' | 'emerging' | 'controversial';

export interface ScientificSource {
  title: string;
  url: string;
  citations: number;
  consensus_percentage: number;
  meta_analysis_count: number;
  source_type: 'meta_analysis' | 'rct' | 'observational';
}

export interface ConsensusData {
  percentage: number;
  level: ConsensusLevel;
  label: string;
  labelZh: string;
  color: string;
  metaAnalysisCount: number;
  verificationText: string;
  verificationTextZh: string;
}

/**
 * 获取共识级别
 * @param percentage 共识百分比 (0-100)
 */
export function getConsensusLevel(percentage: number): ConsensusLevel {
  if (percentage >= 70) return 'high';
  if (percentage >= 40) return 'emerging';
  return 'controversial';
}

/**
 * 获取共识级别的颜色
 */
export function getConsensusColor(level: ConsensusLevel): string {
  const colors: Record<ConsensusLevel, string> = {
    high: '#22c55e',        // Green
    emerging: '#eab308',    // Yellow
    controversial: '#9ca3af' // Gray
  };
  return colors[level];
}

/**
 * 格式化共识文本
 * @param percentage 共识百分比 (0-100)
 */
export function formatConsensusText(percentage: number): string {
  const level = getConsensusLevel(percentage);
  const labels: Record<ConsensusLevel, string> = {
    high: 'High Consensus',
    emerging: 'Emerging Evidence',
    controversial: 'Controversial'
  };
  return `${labels[level]} (${percentage}%)`;
}

/**
 * 格式化共识文本（中文）
 */
export function formatConsensusTextZh(percentage: number): string {
  const level = getConsensusLevel(percentage);
  const labels: Record<ConsensusLevel, string> = {
    high: '高度共识',
    emerging: '新兴证据',
    controversial: '存在争议'
  };
  return `${labels[level]} (${percentage}%)`;
}

/**
 * 格式化验证文本
 * @param count 元分析数量
 */
export function formatVerificationText(count: number): string {
  return `Verified by ${count} meta-analyses`;
}

/**
 * 格式化验证文本（中文）
 */
export function formatVerificationTextZh(count: number): string {
  return `经 ${count} 项元分析验证`;
}

/**
 * 获取完整的共识数据
 */
export function getConsensusData(percentage: number, metaAnalysisCount: number): ConsensusData {
  const level = getConsensusLevel(percentage);
  
  return {
    percentage,
    level,
    label: formatConsensusText(percentage),
    labelZh: formatConsensusTextZh(percentage),
    color: getConsensusColor(level),
    metaAnalysisCount,
    verificationText: formatVerificationText(metaAnalysisCount),
    verificationTextZh: formatVerificationTextZh(metaAnalysisCount)
  };
}

// 模拟科学来源数据
export const MOCK_SOURCES: ScientificSource[] = [
  {
    title: "Sleep restriction increases HPA axis activity and cortisol levels",
    url: "https://www.semanticscholar.org/paper/Sleep-restriction-and-circadian-misalignment",
    citations: 342,
    consensus_percentage: 85,
    meta_analysis_count: 12,
    source_type: 'meta_analysis'
  },
  {
    title: "HRV as biomarker for stress resilience and autonomic function",
    url: "https://www.semanticscholar.org/paper/Heart-rate-variability-stress",
    citations: 218,
    consensus_percentage: 78,
    meta_analysis_count: 8,
    source_type: 'meta_analysis'
  },
  {
    title: "Vagus nerve stimulation improves parasympathetic tone",
    url: "https://www.semanticscholar.org/paper/Vagus-nerve-stimulation",
    citations: 156,
    consensus_percentage: 72,
    meta_analysis_count: 6,
    source_type: 'rct'
  }
];
