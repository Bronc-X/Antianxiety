import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 中间件：保护需要认证的路由
 * 使用客户端 cookie 检查，避免 Supabase auth-helpers 的问题
 */
export function middleware(req: NextRequest) {
  // 检查是否有有效的 Supabase session cookie（兼容不同 cookie 名称）
  const cookieCandidates = [
    'sb-session',
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token',
    'sb:token',
  ];

  let session: string | undefined = undefined;
  for (const name of cookieCandidates) {
    const c = req.cookies.get(name as string);
    if (c) {
      // NextRequest.cookies.get 在不同环境可能返回字符串或带 value 的对象
      // 兼容处理以获取真实值
      // @ts-ignore
      session = typeof c === 'string' ? c : c?.value ?? String(c);
      break;
    }
  }

  // 受保护的路由路径
  const protectedPaths = ['/dashboard', '/onboarding', '/inspiration'];
  const isProtectedPath = protectedPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  // 如果访问受保护的路由且没有 session，重定向到登录页面
  if (isProtectedPath && !session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 如果有 session 且访问登录或注册页面，重定向到 landing 页面
  if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/landing';
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - 公共资源文件
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

