/**
 * Conversation State Tracker
 * 追踪对话状态，避免重复内容
 */

export interface ResponseStructure {
  hasKeyTakeaway: boolean;
  hasEvidence: boolean;
  hasActionAdvice: boolean;
  hasBulletPoints: boolean;
  hasNumberedList: boolean;
}

export interface ConversationState {
  turnCount: number;
  mentionedHealthContext: boolean;
  citedPaperIds: string[];
  usedFormats: string[];
  usedEndearments: string[];
  lastResponseStructure: ResponseStructure | null;
  establishedContext: string[];
  userSharedDetails: string[];
}

export function createInitialState(): ConversationState {
  return {
    turnCount: 0,
    mentionedHealthContext: false,
    citedPaperIds: [],
    usedFormats: [],
    usedEndearments: [],
    lastResponseStructure: null,
    establishedContext: [],
    userSharedDetails: [],
  };
}

export function extractStateFromMessages(messages: Array<{ role: string; content: string }>): ConversationState {
  const state = createInitialState();
  
  for (const msg of messages) {
    if (msg.role === 'user') {
      state.turnCount++;
      // 提取用户分享的细节
      const details = extractUserDetails(msg.content);
      state.userSharedDetails.push(...details);
    } else if (msg.role === 'assistant') {
      // 检查是否提及了健康上下文
      if (containsHealthContextMention(msg.content)) {
        state.mentionedHealthContext = true;
      }
      // 提取已引用的论文
      const papers = extractCitedPapers(msg.content);
      state.citedPaperIds.push(...papers);
      // 提取使用的格式
      const format = detectResponseFormat(msg.content);
      state.usedFormats.push(format);
      // 提取使用的称呼语
      const endearment = extractEndearment(msg.content);
      if (endearment) {
        state.usedEndearments.push(endearment);
      }
      // 更新最后的响应结构
      state.lastResponseStructure = analyzeResponseStructure(msg.content);
    }
  }
  
  return state;
}

export function containsHealthContextMention(content: string): boolean {
  const patterns = [
    /考虑到你目前有【[^】]+】/,
    /考虑到你的[^，。]+状况/,
    /鉴于你有[^，。]+的问题/,
    /由于你[^，。]+的情况/,
  ];
  return patterns.some(p => p.test(content));
}

export function extractCitedPapers(content: string): string[] {
  const papers: string[] = [];
  // 匹配 [1] "Paper Title" 格式
  const titleMatches = content.matchAll(/\[(\d+)\]\s*"([^"]+)"/g);
  for (const match of titleMatches) {
    papers.push(match[2].toLowerCase().trim());
  }
  // 匹配参考文献格式
  const refMatches = content.matchAll(/参考文献[：:]\s*\[?\d+\]?\s*([^。\n]+)/g);
  for (const match of refMatches) {
    papers.push(match[1].toLowerCase().trim());
  }
  return [...new Set(papers)];
}

export function detectResponseFormat(content: string): string {
  if (content.includes('**关键要点**') && content.includes('**科学证据**')) {
    return 'full_structured';
  }
  if (content.includes('方案1') || content.includes('方案1：')) {
    return 'plan_format';
  }
  if (/^\s*[-•]\s/m.test(content)) {
    return 'bullet_points';
  }
  if (/^\s*\d+\.\s/m.test(content)) {
    return 'numbered_list';
  }
  return 'conversational';
}

export function extractEndearment(content: string): string | null {
  const endearments = ['宝子', '亲爱的', '朋友', '小伙伴', '老铁', '兄弟', '姐妹'];
  for (const e of endearments) {
    if (content.includes(e)) {
      return e;
    }
  }
  return null;
}

export function analyzeResponseStructure(content: string): ResponseStructure {
  return {
    hasKeyTakeaway: content.includes('关键要点') || content.includes('Key Takeaway'),
    hasEvidence: content.includes('科学证据') || content.includes('证据基础') || content.includes('Evidence'),
    hasActionAdvice: content.includes('行动建议') || content.includes('实用建议') || content.includes('Actionable'),
    hasBulletPoints: /^\s*[-•]\s/m.test(content),
    hasNumberedList: /^\s*\d+\.\s/m.test(content),
  };
}

export function extractUserDetails(content: string): string[] {
  const details: string[] = [];
  // 提取症状描述
  const symptomPatterns = [
    /我(有|出现|感觉|觉得)[^，。]+/g,
    /最近[^，。]+/g,
    /我的[^，。]+(疼|痛|不舒服|问题)/g,
  ];
  for (const pattern of symptomPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      details.push(match[0]);
    }
  }
  return details;
}

export function shouldMentionHealthContext(state: ConversationState): boolean {
  // 只在第一轮或从未提及时才完整提及健康上下文
  return state.turnCount <= 1 && !state.mentionedHealthContext;
}

export function getUnusedEndearments(state: ConversationState): string[] {
  const allEndearments = ['朋友', '小伙伴', '老铁', '兄弟', '姐妹', '亲'];
  return allEndearments.filter(e => !state.usedEndearments.includes(e));
}

export function getExcludedPaperIds(state: ConversationState): string[] {
  return state.citedPaperIds;
}
