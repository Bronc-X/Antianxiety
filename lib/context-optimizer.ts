/**
 * Context Injection Optimizer
 * 智能决定哪些上下文需要注入到 system prompt
 */

import type { ConversationState } from './conversation-state';

export interface UserProfile {
  current_focus?: string;
  full_name?: string;
  age?: number;
  gender?: string;
  primary_goal?: string;
  ai_personality?: string;
}

export interface Paper {
  id?: string;
  title: string;
  citationCount?: number;
  year?: number | null;
  abstract?: string;
}

export interface ContextInjectionDecision {
  includeFullHealthContext: boolean;
  includeHealthReminder: boolean;
  healthContextText: string;
  excludePaperIds: string[];
  filteredPapers: Paper[];
  contextSummary: string;
}

/**
 * 优化上下文注入决策
 */
export function optimizeContextInjection(
  state: ConversationState,
  userProfile: UserProfile | null,
  scientificPapers: Paper[]
): ContextInjectionDecision {
  const decision: ContextInjectionDecision = {
    includeFullHealthContext: false,
    includeHealthReminder: false,
    healthContextText: '',
    excludePaperIds: [],
    filteredPapers: [],
    contextSummary: '',
  };

  // 健康上下文决策
  if (userProfile?.current_focus) {
    const healthDecision = decideHealthContextInjection(state, userProfile.current_focus);
    decision.includeFullHealthContext = healthDecision.includeFull;
    decision.includeHealthReminder = healthDecision.includeReminder;
    decision.healthContextText = healthDecision.text;
  }

  // 论文去重决策
  const paperDecision = decidePaperInjection(state, scientificPapers);
  decision.excludePaperIds = paperDecision.excludeIds;
  decision.filteredPapers = paperDecision.filteredPapers;

  // 生成上下文摘要
  decision.contextSummary = generateContextSummary(state, userProfile);

  return decision;
}

/**
 * 决定健康上下文注入方式
 */
export function decideHealthContextInjection(
  state: ConversationState,
  healthFocus: string
): { includeFull: boolean; includeReminder: boolean; text: string } {
  // 第一轮且未提及：完整注入
  if (state.turnCount <= 1 && !state.mentionedHealthContext) {
    return {
      includeFull: true,
      includeReminder: false,
      text: buildFullHealthContext(healthFocus),
    };
  }

  // 已提及过：只注入简短提醒（给 AI 内部参考，不要求 AI 重复）
  if (state.mentionedHealthContext) {
    return {
      includeFull: false,
      includeReminder: true,
      text: buildHealthReminder(healthFocus),
    };
  }

  // 其他情况：简短提醒
  return {
    includeFull: false,
    includeReminder: true,
    text: buildHealthReminder(healthFocus),
  };
}

/**
 * 构建完整健康上下文（仅第一次使用）
 */
export function buildFullHealthContext(healthFocus: string): string {
  return `
[CRITICAL HEALTH CONTEXT - 关键健康上下文]
🚨 用户当前健康问题: ${healthFocus}

⚠️ 这是最高优先级的上下文！你必须：
1. 在回答时首先考虑这个健康问题
2. 如果用户询问的活动可能加重这个问题，必须警告
3. 安全永远是第一位的

注意：这是第一次提及，可以在回复中说明"考虑到你的${healthFocus}状况..."
`;
}

/**
 * 构建健康提醒（后续轮次使用）
 */
export function buildHealthReminder(healthFocus: string): string {
  return `
[HEALTH REMINDER - 健康提醒（内部参考）]
用户健康问题: ${healthFocus}
⚠️ 重要：你已经在之前的对话中提及过这个健康问题了！
❌ 不要再次以"考虑到你的XXX状况"开头
✅ 直接回答问题，在必要时隐式考虑健康限制
`;
}

/**
 * 决定论文注入方式
 */
export function decidePaperInjection(
  state: ConversationState,
  papers: Paper[]
): { excludeIds: string[]; filteredPapers: Paper[] } {
  const citedTitles = new Set(state.citedPaperIds.map(id => id.toLowerCase()));
  
  // 过滤掉已引用的论文
  const filteredPapers = papers.filter(paper => {
    const titleLower = paper.title.toLowerCase();
    return !citedTitles.has(titleLower);
  });

  // 返回排除的论文 ID
  const excludeIds = papers
    .filter(paper => citedTitles.has(paper.title.toLowerCase()))
    .map(paper => paper.title.toLowerCase());

  return {
    excludeIds,
    filteredPapers,
  };
}

/**
 * 生成上下文摘要
 */
export function generateContextSummary(
  state: ConversationState,
  userProfile: UserProfile | null
): string {
  const parts: string[] = [];

  if (state.turnCount > 0) {
    parts.push(`对话轮次: ${state.turnCount}`);
  }

  if (state.citedPaperIds.length > 0) {
    parts.push(`已引用论文: ${state.citedPaperIds.length}篇`);
  }

  if (state.userSharedDetails.length > 0) {
    parts.push(`用户分享的细节: ${state.userSharedDetails.slice(0, 3).join(', ')}`);
  }

  if (userProfile?.primary_goal) {
    parts.push(`用户目标: ${userProfile.primary_goal}`);
  }

  return parts.join(' | ');
}

/**
 * 构建优化后的系统提示上下文块
 */
export function buildOptimizedContextBlock(decision: ContextInjectionDecision): string {
  const parts: string[] = [];

  // 健康上下文
  if (decision.healthContextText) {
    parts.push(decision.healthContextText);
  }

  // 论文上下文
  if (decision.filteredPapers.length > 0) {
    parts.push('\n[SCIENTIFIC CONTEXT - 科学上下文]');
    parts.push(`可引用的新论文 (${decision.filteredPapers.length}篇):`);
    
    decision.filteredPapers.slice(0, 5).forEach((paper, index) => {
      parts.push(`[${index + 1}] "${paper.title}" (${paper.year || 'N/A'})`);
    });

    if (decision.excludePaperIds.length > 0) {
      parts.push(`\n⚠️ 以下论文已在之前引用过，请勿重复完整引用：`);
      parts.push(decision.excludePaperIds.slice(0, 3).join(', '));
    }
  }

  // 上下文摘要
  if (decision.contextSummary) {
    parts.push(`\n[CONTEXT SUMMARY] ${decision.contextSummary}`);
  }

  return parts.join('\n');
}

/**
 * 检查是否应该排除某篇论文
 */
export function shouldExcludePaper(paper: Paper, excludeIds: string[]): boolean {
  const titleLower = paper.title.toLowerCase();
  return excludeIds.some(id => titleLower.includes(id) || id.includes(titleLower));
}
