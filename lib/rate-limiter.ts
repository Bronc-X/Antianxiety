/**
 * API 限流器
 * 基于内存的简单限流实现，适合单实例部署
 * 未来可升级到 Redis/Upstash 支持多实例
 */

// 限流配置
export const RATE_LIMITS = {
  // AI 聊天：每用户每天 20 次
  ai_chat: { max: 20, windowMs: 24 * 60 * 60 * 1000 }, // 24小时
  // 科学搜索：每用户每小时 50 次
  scientific_search: { max: 50, windowMs: 60 * 60 * 1000 }, // 1小时
  // 通用 API：每用户每分钟 60 次
  api_general: { max: 60, windowMs: 60 * 1000 }, // 1分钟
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// 内存存储（单实例）
// 格式: { "userId:limitType": { count, resetAt } }
const rateLimitStore = new Map<string, RateLimitEntry>();

// 定期清理过期条目（每5分钟）
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 限流器清理: 移除 ${cleaned} 条过期记录`);
    }
  }, CLEANUP_INTERVAL);
}

// 启动清理定时器
startCleanup();

/**
 * 检查并消费限流配额
 * @returns { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(
  userId: string,
  limitType: RateLimitType
): { allowed: boolean; remaining: number; resetAt: number; limit: number } {
  const config = RATE_LIMITS[limitType];
  const key = `${userId}:${limitType}`;
  const now = Date.now();
  
  let entry = rateLimitStore.get(key);
  
  // 如果没有记录或已过期，创建新记录
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
  }
  
  // 检查是否超过限制
  if (entry.count >= config.max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      limit: config.max,
    };
  }
  
  // 消费配额
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return {
    allowed: true,
    remaining: config.max - entry.count,
    resetAt: entry.resetAt,
    limit: config.max,
  };
}

/**
 * 获取当前限流状态（不消费配额）
 */
export function getRateLimitStatus(
  userId: string,
  limitType: RateLimitType
): { remaining: number; resetAt: number; limit: number } {
  const config = RATE_LIMITS[limitType];
  const key = `${userId}:${limitType}`;
  const now = Date.now();
  
  const entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetAt < now) {
    return {
      remaining: config.max,
      resetAt: now + config.windowMs,
      limit: config.max,
    };
  }
  
  return {
    remaining: Math.max(0, config.max - entry.count),
    resetAt: entry.resetAt,
    limit: config.max,
  };
}

/**
 * 重置用户的限流计数（管理员功能）
 */
export function resetRateLimit(userId: string, limitType?: RateLimitType): void {
  if (limitType) {
    rateLimitStore.delete(`${userId}:${limitType}`);
  } else {
    // 重置该用户的所有限流
    for (const type of Object.keys(RATE_LIMITS) as RateLimitType[]) {
      rateLimitStore.delete(`${userId}:${type}`);
    }
  }
}

/**
 * 生成限流响应头
 */
export function getRateLimitHeaders(
  remaining: number,
  resetAt: number,
  limit: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)), // Unix timestamp
    'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
  };
}

/**
 * 创建限流错误响应
 */
export function createRateLimitResponse(
  remaining: number,
  resetAt: number,
  limit: number,
  message?: string
): Response {
  const headers = getRateLimitHeaders(remaining, resetAt, limit);
  const resetTime = new Date(resetAt).toLocaleTimeString('zh-CN');
  
  return new Response(
    JSON.stringify({
      error: 'rate_limit_exceeded',
      message: message || `请求过于频繁，请在 ${resetTime} 后重试`,
      resetAt: resetAt,
      remaining: 0,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }
  );
}

/**
 * 获取限流统计信息（调试用）
 */
export function getRateLimitStats(): {
  totalEntries: number;
  entriesByType: Record<string, number>;
} {
  const stats: Record<string, number> = {};
  
  for (const key of rateLimitStore.keys()) {
    const type = key.split(':')[1];
    stats[type] = (stats[type] || 0) + 1;
  }
  
  return {
    totalEntries: rateLimitStore.size,
    entriesByType: stats,
  };
}
