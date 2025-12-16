/**
 * Response Variation Engine
 * 动态调整回复格式和语气策略
 */

import type { ConversationState, ResponseStructure } from './conversation-state';

export type FormatStyle = 'structured' | 'conversational' | 'concise' | 'detailed' | 'plan';
export type CitationStyle = 'formal' | 'casual' | 'minimal';

export interface VariationStrategy {
  formatStyle: FormatStyle;
  endearment: string | null;
  citationStyle: CitationStyle;
  shouldMentionHealthContext: boolean;
  responseTemplate: string;
}

// 称呼语池 - 避免重复使用
const ENDEARMENT_POOL = ['朋友', '小伙伴', '老铁', '亲', '伙计', '兄弟', '姐妹'];

// 格式模板
const FORMAT_TEMPLATES: Record<FormatStyle, string> = {
  structured: `回复结构：
1. 简短的关键要点（1-2句）
2. 科学依据（如有）
3. 具体建议`,
  conversational: `回复风格：
- 像朋友聊天一样自然
- 不使用固定模板
- 直接回答问题`,
  concise: `回复风格：
- 简洁直接
- 不重复已知信息
- 直奔主题`,
  detailed: `回复风格：
- 详细解释
- 提供背景知识
- 多角度分析`,
  plan: `回复格式：
- 直接给出方案
- 不重述问题背景
- 使用方案1/方案2格式`,
};

// 引用风格模板
const CITATION_TEMPLATES: Record<CitationStyle, string> = {
  formal: '引用格式：使用 [1], [2] 标注，末尾列出参考文献',
  casual: '引用格式：自然地提及研究发现，如"研究表明..."',
  minimal: '引用格式：仅在必要时简短提及，不重复已引用的论文',
};

/**
 * 根据对话状态选择变化策略
 */
export function selectVariationStrategy(state: ConversationState): VariationStrategy {
  const { turnCount, usedFormats, usedEndearments, mentionedHealthContext } = state;
  
  // 选择格式风格
  const formatStyle = selectFormatStyle(turnCount, usedFormats);
  
  // 选择称呼语（避免重复）
  const endearment = selectEndearment(turnCount, usedEndearments);
  
  // 选择引用风格
  const citationStyle = selectCitationStyle(turnCount, state.citedPaperIds.length);
  
  // 是否提及健康上下文
  const shouldMentionHealthContext = turnCount <= 1 && !mentionedHealthContext;
  
  return {
    formatStyle,
    endearment,
    citationStyle,
    shouldMentionHealthContext,
    responseTemplate: FORMAT_TEMPLATES[formatStyle],
  };
}

/**
 * 选择格式风格
 */
export function selectFormatStyle(turnCount: number, usedFormats: string[]): FormatStyle {
  // 第一轮使用结构化格式
  if (turnCount <= 1) {
    return 'structured';
  }
  
  // 检查最近使用的格式，避免连续重复
  const lastFormat = usedFormats[usedFormats.length - 1];
  
  // 格式轮换顺序
  const formatRotation: FormatStyle[] = ['conversational', 'concise', 'detailed', 'structured'];
  
  // 找到下一个不同的格式
  for (const format of formatRotation) {
    if (format !== lastFormat) {
      return format;
    }
  }
  
  return 'conversational';
}

/**
 * 选择称呼语
 */
export function selectEndearment(turnCount: number, usedEndearments: string[]): string | null {
  // 不是每次都用称呼语
  if (turnCount % 3 !== 1) {
    return null;
  }
  
  // 找到未使用的称呼语
  const unused = ENDEARMENT_POOL.filter(e => !usedEndearments.includes(e));
  
  if (unused.length === 0) {
    // 如果都用过了，重新开始但跳过最近用的
    const lastUsed = usedEndearments[usedEndearments.length - 1];
    const available = ENDEARMENT_POOL.filter(e => e !== lastUsed);
    return available[Math.floor(Math.random() * available.length)] || null;
  }
  
  return unused[Math.floor(Math.random() * unused.length)];
}

/**
 * 选择引用风格
 */
export function selectCitationStyle(turnCount: number, citedCount: number): CitationStyle {
  // 第一轮使用正式引用
  if (turnCount <= 1) {
    return 'formal';
  }
  
  // 已经引用过很多论文，使用最小化引用
  if (citedCount >= 3) {
    return 'minimal';
  }
  
  // 其他情况使用随意风格
  return 'casual';
}

/**
 * 生成变化指令（注入到 system prompt）
 */
export function generateVariationInstructions(strategy: VariationStrategy): string {
  const parts: string[] = [];
  
  parts.push('[RESPONSE VARIATION INSTRUCTIONS - 回复变化指令]');
  parts.push('');
  parts.push(strategy.responseTemplate);
  parts.push('');
  parts.push(CITATION_TEMPLATES[strategy.citationStyle]);
  
  if (strategy.endearment) {
    parts.push(`\n称呼：可以使用"${strategy.endearment}"，但不要每句都用`);
  } else {
    parts.push('\n称呼：这次不使用特定称呼语，保持自然');
  }
  
  if (!strategy.shouldMentionHealthContext) {
    parts.push('\n⚠️ 重要：不要重复提及用户的健康状况，已经在之前的对话中说过了');
    parts.push('直接回答问题，不要以"考虑到你的XXX状况"开头');
  }
  
  parts.push('\n⚠️ 避免重复：');
  parts.push('- 不要使用和上一条回复相同的格式结构');
  parts.push('- 不要重复引用已经引用过的论文');
  parts.push('- 不要重复解释已经解释过的概念');
  
  return parts.join('\n');
}

/**
 * 检测回复是否符合变化要求
 */
export function validateResponseVariation(
  response: string,
  previousResponses: string[],
  strategy: VariationStrategy
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // 检查是否重复了健康上下文
  if (!strategy.shouldMentionHealthContext) {
    const healthPatterns = [
      /考虑到你目前有【[^】]+】/,
      /考虑到你的[^，。]+状况/,
    ];
    for (const pattern of healthPatterns) {
      if (pattern.test(response)) {
        issues.push('重复提及了健康上下文');
        break;
      }
    }
  }
  
  // 检查格式是否与上一条相同
  if (previousResponses.length > 0) {
    const lastResponse = previousResponses[previousResponses.length - 1];
    const currentHasStructured = response.includes('**关键要点**') && response.includes('**科学证据**');
    const lastHasStructured = lastResponse.includes('**关键要点**') && lastResponse.includes('**科学证据**');
    
    if (currentHasStructured && lastHasStructured) {
      issues.push('连续使用了相同的结构化格式');
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}
