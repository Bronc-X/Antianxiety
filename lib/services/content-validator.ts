/**
 * Content Validator Service
 * 内容相关性验证 - 确保用户查询聚焦于健康领域
 * 
 * @module lib/services/content-validator
 */

// ==================== 类型定义 ====================

export interface ValidationResult {
  /** 是否与健康相关 */
  isHealthRelated: boolean;
  /** 被拦截的原因（如果不相关） */
  blockedReason?: string;
  /** 建议的回复消息 */
  suggestedResponse?: string;
  /** 匹配到的关键词（用于调试） */
  matchedKeywords?: string[];
}

// ==================== 关键词配置 ====================

/** 政治相关关键词 */
const POLITICS_KEYWORDS = [
  '政治', '选举', '投票', '总统', '主席', '政府', '政党', '民主', '共和',
  '左派', '右派', '保守', '自由派', '国会', '议会', '政策', '法案',
  'politics', 'election', 'vote', 'president', 'government', 'party',
  '习近平', '拜登', 'trump', 'biden', '普京', 'putin'
];


/** 八卦娱乐相关关键词 */
const GOSSIP_ENTERTAINMENT_KEYWORDS = [
  '八卦', '绯闻', '明星', '偶像', '粉丝', '追星', '综艺', '选秀',
  '出轨', '离婚', '恋情', '分手', '热搜', '瓜', '吃瓜',
  'gossip', 'celebrity', 'scandal', 'idol', 'fan', 'drama',
  '电视剧', '电影推荐', '剧透', '追剧'
];

/** 推销营销相关关键词 */
const SALES_MARKETING_KEYWORDS = [
  '推销', '促销', '优惠', '折扣', '代购', '微商', '直销', '传销',
  '赚钱', '暴富', '投资理财', '股票推荐', '基金推荐', '炒股',
  '加盟', '代理', '招商', '创业项目',
  'sale', 'discount', 'promotion', 'mlm', 'invest'
];

/** 其他非健康相关关键词 */
const OTHER_BLOCKED_KEYWORDS = [
  '赌博', '博彩', '彩票', '色情', '成人', '约炮',
  '暴力', '恐怖', '极端', '仇恨',
  'gambling', 'porn', 'violence', 'terrorism'
];

/** 所有被屏蔽的关键词（合并） */
export const BLOCKED_KEYWORDS = [
  ...POLITICS_KEYWORDS,
  ...GOSSIP_ENTERTAINMENT_KEYWORDS,
  ...SALES_MARKETING_KEYWORDS,
  ...OTHER_BLOCKED_KEYWORDS
];

// ==================== 礼貌拒绝消息 ====================

const POLITE_DECLINE_MESSAGES: Record<string, string> = {
  politics: '作为您的健康助手，我专注于帮助您改善身心健康。关于政治话题，建议您咨询专业的新闻媒体或相关机构。有什么健康方面的问题我可以帮您解答吗？',
  gossip: '我是您的健康伙伴，专注于帮助您建立健康的生活方式。娱乐八卦不是我的专长，但如果您想聊聊如何减压放松，我很乐意帮忙！',
  sales: '我的使命是帮助您获得更好的健康，而不是推销产品。如果您对某种健康产品有疑问，我可以从科学角度帮您分析它的效果。',
  default: '作为您的健康助手，我专注于生理健康领域。让我们把注意力放在如何让您感觉更好上吧！有什么健康问题想聊聊吗？'
};


// ==================== 核心函数 ====================

/**
 * 检测查询中是否包含被屏蔽的关键词
 * @param query 用户查询文本
 * @returns 匹配到的关键词数组
 */
function detectBlockedKeywords(query: string): string[] {
  const normalizedQuery = query.toLowerCase();
  return BLOCKED_KEYWORDS.filter(keyword => 
    normalizedQuery.includes(keyword.toLowerCase())
  );
}

/**
 * 根据匹配的关键词确定拒绝类别
 * @param matchedKeywords 匹配到的关键词
 * @returns 拒绝类别
 */
function determineBlockedCategory(matchedKeywords: string[]): string {
  for (const keyword of matchedKeywords) {
    const lowerKeyword = keyword.toLowerCase();
    if (POLITICS_KEYWORDS.some(k => k.toLowerCase() === lowerKeyword)) {
      return 'politics';
    }
    if (GOSSIP_ENTERTAINMENT_KEYWORDS.some(k => k.toLowerCase() === lowerKeyword)) {
      return 'gossip';
    }
    if (SALES_MARKETING_KEYWORDS.some(k => k.toLowerCase() === lowerKeyword)) {
      return 'sales';
    }
  }
  return 'default';
}

/**
 * 验证用户查询是否与健康相关
 * 如果包含政治、八卦、娱乐、推销等非健康关键词，返回礼貌拒绝
 * 
 * @param query 用户查询文本
 * @returns ValidationResult 验证结果
 */
export function validateContentRelevance(query: string): ValidationResult {
  // 空查询视为健康相关（让后续逻辑处理）
  if (!query || query.trim().length === 0) {
    return { isHealthRelated: true };
  }

  // 检测被屏蔽的关键词
  const matchedKeywords = detectBlockedKeywords(query);

  // 如果没有匹配到屏蔽关键词，视为健康相关
  if (matchedKeywords.length === 0) {
    return { isHealthRelated: true };
  }

  // 确定拒绝类别并返回礼貌拒绝
  const category = determineBlockedCategory(matchedKeywords);
  
  return {
    isHealthRelated: false,
    blockedReason: category,
    suggestedResponse: POLITE_DECLINE_MESSAGES[category] || POLITE_DECLINE_MESSAGES.default,
    matchedKeywords
  };
}

/**
 * 导出关键词列表（用于测试）
 */
export const KEYWORD_CATEGORIES = {
  politics: POLITICS_KEYWORDS,
  gossip: GOSSIP_ENTERTAINMENT_KEYWORDS,
  sales: SALES_MARKETING_KEYWORDS,
  other: OTHER_BLOCKED_KEYWORDS
};
