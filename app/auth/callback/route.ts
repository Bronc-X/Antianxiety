import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 认证回调路由
 * 处理 Supabase Magic Link 和邮件验证的重定向
 * Supabase auth helpers 会自动处理 URL 中的 code 参数
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get('next') || '/landing';

  try {
    const cookieStore = cookies();

    // 在路由处理器中使用 createRouteHandlerClient
    const supabase = createRouteHandlerClient(
      {
        cookies: () => cookieStore,
      },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      }
    );

    // 处理 URL 中的 code 参数（用于 OAuth 和 Magic Link）
    const code = requestUrl.searchParams.get('code');
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        console.error('交换 code 失败:', exchangeError);
        return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
      }
    }

    // 获取会话
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      // 认证失败，重定向到登录页面
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }

    // 认证成功，重定向到指定页面或仪表板
    return NextResponse.redirect(new URL(next, request.url));
  } catch (error) {
    console.error('认证回调处理错误:', error);
    // 发生错误，重定向到登录页面
    return NextResponse.redirect(new URL('/login?error=server_error', request.url));
  }
}

