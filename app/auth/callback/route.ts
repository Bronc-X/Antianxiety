import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Session } from '@supabase/supabase-js';

export const runtime = 'nodejs';

/**
 * 认证回调路由
 * 处理 Supabase Magic Link 和邮件验证的重定向
 * Supabase auth helpers 会自动处理 URL 中的 code 参数
 */
function createClientWithCookies(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            return cookieStore.get(name)?.value;
          } catch (error) {
            console.error('Error getting cookie:', error);
            return undefined;
          }
        },
        set(name: string, value: string, options: { path?: string; maxAge?: number }) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            console.error('Error setting cookie:', error);
          }
        },
        remove(name: string, options: { path?: string }) {
          try {
            cookieStore.delete({ name, ...options });
          } catch (error) {
            console.error('Error removing cookie:', error);
          }
        },
      },
    }
  );
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get('next') || '/landing';

  try {
    const cookieStore = await cookies();
    const supabase = createClientWithCookies(cookieStore);

    // 处理 URL 中的 code 参数（用于 OAuth 和 Magic Link）
    const code = requestUrl.searchParams.get('code');
    const errorParam = requestUrl.searchParams.get('error');
    
    // 如果 OAuth 提供商返回了错误
    if (errorParam) {
      console.error('OAuth 提供商返回错误:', errorParam);
      return NextResponse.redirect(new URL('/login?error=oauth_error', request.url));
    }
    
    if (code) {
      // 交换 code 获取 session
      const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('交换 code 失败:', {
          message: exchangeError.message,
          status: exchangeError.status,
          name: exchangeError.name,
        });
        return NextResponse.redirect(new URL(`/login?error=invalid_token&details=${encodeURIComponent(exchangeError.message)}`, request.url));
      }

      // 如果成功交换到 session，验证 session 是否存在
      if (sessionData?.session) {
        console.log('Session 交换成功，用户ID:', sessionData.session.user.id);
        
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token,
        });

        if (setSessionError) {
          console.error('设置 session 到 cookies 失败:', setSessionError);
          return NextResponse.redirect(new URL('/login?error=session_cookie_failed', request.url));
        }
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (user && !userError) {
          console.log('Session 验证成功，准备重定向到:', next);
          const redirectUrl = new URL(next, request.url);
          return NextResponse.redirect(redirectUrl);
        } else {
          console.error('Session 验证失败:', userError);
          return NextResponse.redirect(new URL('/login?error=session_validation_failed', request.url));
        }
      } else {
        console.error('Session 交换成功但 session 为空');
        return NextResponse.redirect(new URL('/login?error=no_session', request.url));
      }
    }

    // 如果没有 code，尝试获取现有会话（可能是直接访问回调URL）
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('获取 session 失败:', sessionError);
      return NextResponse.redirect(new URL('/login?error=session_error', request.url));
    }

    if (session) {
      // 已有会话，直接重定向
    return NextResponse.redirect(new URL(next, request.url));
    } else {
      // 没有 code 也没有 session，重定向到登录页
      console.error('没有 code 参数且没有现有 session');
      return NextResponse.redirect(new URL('/login?error=no_code', request.url));
    }
  } catch (error) {
    const err = error as Error;
    console.error('认证回调处理错误:', {
      message: err?.message,
      stack: err?.stack,
      name: err?.name,
    });
    // 发生错误，重定向到登录页面
    return NextResponse.redirect(
      new URL(
        `/login?error=server_error&details=${encodeURIComponent(err?.message || '未知错误')}`,
        request.url
      )
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClientWithCookies(cookieStore);
    const { event, session } = (await request.json()) as {
      event: string;
      session: Session | null;
    };

    if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
      const { error } = await supabase.auth.setSession(session);
      if (error) {
        console.error('同步 session 失败:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    if (event === 'SIGNED_OUT') {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('登出时清理 session 失败:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error as Error;
    console.error('POST /auth/callback 处理失败:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

