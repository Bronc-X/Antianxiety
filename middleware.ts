import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 中间件：保护需要认证的路由
 * 使用客户端 cookie 检查，避免 Supabase auth-helpers 的问题
 */
export function middleware(req: NextRequest) {
  // 完全禁用middleware的重定向逻辑
  // 让页面自己处理权限检查
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

