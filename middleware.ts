import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 中间件：API 限流 + 路由保护
 * 
 * 限流策略：
 * - /api/chat: 每用户每天 20 次
 * - /api/ai/*: 每用户每小时 50 次
 * - 其他 API: 每用户每分钟 60 次
 * 
 * 注意：由于 Edge Runtime 限制，这里使用简化的限流逻辑
 * 完整的限流在各 API route 中实现
 */

// 简化的内存限流存储（Edge Runtime 兼容）
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// 限流配置
const RATE_LIMITS = {
  chat: { max: 20, windowMs: 24 * 60 * 60 * 1000 }, // 每天 20 次
  ai: { max: 50, windowMs: 60 * 60 * 1000 }, // 每小时 50 次
  api: { max: 60, windowMs: 60 * 1000 }, // 每分钟 60 次
};

function getClientIdentifier(req: NextRequest): string {
  // 优先使用用户 ID（从 cookie 中获取）
  const supabaseAuth = req.cookies.get('sb-access-token')?.value;
  if (supabaseAuth) {
    // 使用 token 的前 16 位作为标识（避免暴露完整 token）
    return `user:${supabaseAuth.substring(0, 16)}`;
  }

  // 回退到 IP 地址
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return `ip:${ip}`;
}

function checkRateLimit(
  identifier: string,
  limitType: 'chat' | 'ai' | 'api'
): { allowed: boolean; remaining: number; resetAt: number } {
  const config = RATE_LIMITS[limitType];
  const key = `${identifier}:${limitType}`;
  const now = Date.now();

  let entry = rateLimitMap.get(key);

  // 清理过期条目
  if (entry && entry.resetAt < now) {
    rateLimitMap.delete(key);
    entry = undefined;
  }

  if (!entry) {
    entry = { count: 0, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  rateLimitMap.set(key, entry);

  return {
    allowed: true,
    remaining: config.max - entry.count,
    resetAt: entry.resetAt,
  };
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  let effectivePathname = pathname;
  let shouldRewriteApi = false;
  const normalizedPathname = pathname.endsWith('/') && pathname !== '/'
    ? pathname.slice(0, -1)
    : pathname;

  if (pathname.startsWith('/api/') && pathname.length > 1 && pathname.endsWith('/')) {
    effectivePathname = pathname.slice(0, -1);
    shouldRewriteApi = true;
  }

  // Language-based redirect for root domain
  // REMOVED: Single domain strategy. Language is handled by client-side i18n.
  /*
  if (hostname === 'antianxiety.app' || hostname === 'www.antianxiety.app') {
    const acceptLang = req.headers.get('accept-language') || '';
    const isZh = acceptLang.toLowerCase().includes('zh');
    const targetHost = isZh ? 'zh.antianxiety.app' : 'en.antianxiety.app';

    const redirectUrl = new URL(pathname, `https://${targetHost}`);
    redirectUrl.search = req.nextUrl.search;

    return NextResponse.redirect(redirectUrl, 302);
  }
  */

  // Only apply rate limiting to API routes
  if (effectivePathname.startsWith('/api/')) {
    const identifier = getClientIdentifier(req);

    // Determine rate limit type
    let limitType: 'chat' | 'ai' | 'api' = 'api';
    if (effectivePathname === '/api/chat') {
      limitType = 'chat';
    } else if (effectivePathname.startsWith('/api/ai/')) {
      limitType = 'ai';
    }

    // Check rate limit
    const { allowed, remaining, resetAt } = checkRateLimit(identifier, limitType);

    if (!allowed) {
      const resetTime = new Date(resetAt).toLocaleTimeString('en-US');
      console.warn(`🚫 Rate limit exceeded: ${identifier} - ${pathname}`);

      return new NextResponse(
        JSON.stringify({
          error: 'rate_limit_exceeded',
          message: `Too many requests. Please try again after ${resetTime}`,
          resetAt: resetAt,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(RATE_LIMITS[limitType].max),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
            'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
          },
        }
      );
    }

    // Add rate limit info to response headers
    let response: NextResponse;
    if (shouldRewriteApi) {
      const normalizedUrl = req.nextUrl.clone();
      normalizedUrl.pathname = effectivePathname;
      response = NextResponse.rewrite(normalizedUrl);
    } else {
      response = NextResponse.next();
    }
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    return response;
  }

  const isAuthRoute = normalizedPathname === '/login' || normalizedPathname === '/signup' || normalizedPathname.startsWith('/onboarding') || normalizedPathname.startsWith('/auth');
  const isUnlearnRoute = normalizedPathname === '/unlearn' || normalizedPathname.startsWith('/unlearn/');
  const isMobileRoute = normalizedPathname === '/mobile' || normalizedPathname.startsWith('/mobile/');
  const isTestRoute = pathname.startsWith('/test/'); // Allow test pages
  const isDigitalTwinRoute = normalizedPathname === '/digital-twin' || normalizedPathname.startsWith('/digital-twin/');
  const isMarketingRoute = normalizedPathname === '/unlearn/app' || normalizedPathname === '/thanks' || normalizedPathname.startsWith('/poster'); // Public marketing landing page
  const isERoute = normalizedPathname === '/e' || normalizedPathname.startsWith('/e/') || normalizedPathname === '/eee' || normalizedPathname.startsWith('/eee/');
  const isWhitepaperPreviewRoute = normalizedPathname === '/agent-whitepaper-preview' || normalizedPathname.startsWith('/agent-whitepaper-preview/');
  const isRoot = normalizedPathname === '/';

  const isNativeRoute = normalizedPathname === '/native' || normalizedPathname.startsWith('/native/');

  if (!isRoot && !isUnlearnRoute && !isAuthRoute && !isMobileRoute && !isNativeRoute && !isTestRoute && !isDigitalTwinRoute && !isMarketingRoute && !isERoute && !isWhitepaperPreviewRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/unlearn';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl, 302);
  }

  // Non-API routes pass through
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - 公共资源文件
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html|mp4|mov)$).*)',
  ],
};
