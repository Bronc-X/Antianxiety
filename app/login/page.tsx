'use client';

import { useState, FormEvent, Suspense, useEffect, useRef } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AnimatedSection from '@/components/AnimatedSection';

/*
 * 登录页面组件
 * 支持邮箱/密码登录与第三方 OAuth
 */
function LoginFormContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [oauthProviderLoading, setOauthProviderLoading] = useState<'twitter' | 'github' | 'wechat' | null>(null);
  const isEmailLoginRedirectingRef = useRef(false);
  const searchParams = useSearchParams();
  const supabase = createClientSupabaseClient();
  
  // 页面加载时检查是否已登录，如果已登录直接跳转
  useEffect(() => {
    const checkExistingSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        console.log('⚡ 检测到已存在的Session，直接跳转');
        const redirectTo = searchParams.get('redirectedFrom') || '/landing';
        window.location.href = redirectTo;
      }
    };
    checkExistingSession();
  }, [supabase.auth, searchParams]);
  
  // 检查 URL 中的错误参数（支持 query 和 hash）
  useEffect(() => {
    const error = searchParams.get('error');
    const details = searchParams.get('details');
    
    // 也检查 URL hash 中的错误（Supabase 邮件链接错误会在 hash 中）
    let hashError = null;
    let errorCode = null;
    let errorDescription = null;
    
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      hashError = hashParams.get('error');
      errorCode = hashParams.get('error_code');
      errorDescription = hashParams.get('error_description');
    }
    
    const finalError = error || hashError;
    
    if (finalError) {
      let errorMessage = '登录失败，请稍后再试。';
      
      // 优先处理具体的 error_code
      if (errorCode === 'otp_expired') {
        errorMessage = '邮箱验证链接已过期。请重新登录或注册，我们会发送新的验证邮件。';
      } else if (errorCode === 'access_denied') {
        errorMessage = '访问被拒绝。验证链接可能已失效，请重新尝试。';
      } else if (finalError === 'invalid_token') {
        errorMessage = '登录验证失败，请重新尝试登录。';
      } else if (finalError === 'server_error') {
        errorMessage = details ? `服务器错误：${decodeURIComponent(details)}` : '服务器错误，请稍后再试。';
      } else if (finalError === 'oauth_error') {
        // 如果是 OAuth 错误，尝试显示更详细的信息
        if (errorDescription) {
          const decodedDesc = decodeURIComponent(errorDescription.replace(/\+/g, ' '));
          errorMessage = `第三方登录失败：${decodedDesc}`;
        } else {
          errorMessage = '第三方登录授权失败，请重试。';
        }
      } else if (finalError === 'no_session') {
        errorMessage = '登录会话创建失败，请重试。';
      } else if (finalError === 'no_code') {
        errorMessage = '缺少授权码，请重新登录。';
      } else if (finalError === 'session_error') {
        errorMessage = '会话获取失败，请重试。';
      } else if (finalError === 'session_validation_failed') {
        errorMessage = '登录状态验证失败，请重新登录。';
      } else if (errorDescription) {
        // 如果有详细描述，优先显示
        errorMessage = decodeURIComponent(errorDescription.replace(/\+/g, ' '));
      }
      
      setMessage({
        type: 'error',
        text: errorMessage,
      });
      
      // 清理 URL 中的错误参数（可选）
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, [searchParams]);

  // 监听认证状态变化（主要用于OAuth登录）
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // 如果是邮箱登录，已经在handleEmailPasswordLogin中处理了重定向，这里跳过
      if (event === 'SIGNED_IN' && session && !isEmailLoginRedirectingRef.current) {
        console.log('登录成功，用户ID:', session.user.id);
        // 等待一下确保 cookies 同步
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 验证 session 是否真正可用
        const { data: { user }, error } = await supabase.auth.getUser();
        if (user && !error) {
          console.log('Session 验证成功，准备重定向');
          const redirectedFrom = searchParams.get('redirectedFrom') || '/landing';
          // 使用硬重定向确保服务器端能读取到 session
          window.location.href = redirectedFrom;
        } else {
          console.error('Session 验证失败:', error);
          setMessage({
            type: 'error',
            text: '登录状态验证失败，请重新尝试。',
          });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, searchParams]);

  const handleOAuthLogin = async (provider: 'twitter' | 'github' | 'wechat') => {
    setOauthProviderLoading(provider);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        // Supabase 类型定义可能不包含 wechat，这里通过类型断言绕过，但保持运行时安全
        provider: provider as 'twitter' | 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/landing`,
          skipBrowserRedirect: false, // 确保浏览器重定向
        },
      });

      if (error) {
        setMessage({
          type: 'error',
          text: error.message || '第三方登录失败，请稍后再试。',
        });
        setOauthProviderLoading(null);
      }
      if (data?.url) {
        window.location.assign(data.url);
      }
      // 如果成功，用户会被重定向到OAuth提供商
      // data.url 包含重定向URL，Supabase会自动处理
    } catch (err) {
      console.error('第三方登录出错:', err);
      setMessage({
        type: 'error',
        text: '登录过程中出现未知错误，请稍后重试。',
      });
      setOauthProviderLoading(null);
    }
  };


  // 处理邮箱/密码登录
  const handleEmailPasswordLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      console.log('开始邮箱登录:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('登录失败:', error);
        setMessage({ type: 'error', text: error.message });
        setIsLoading(false);
        return;
      }

      if (data.user && data.session) {
        console.log('✅ 登录成功，用户ID:', data.user.id);
        console.log('🔐 Session:', data.session);
        
        setMessage({ type: 'success', text: '登录成功！正在跳转...' });
        
        // 设置标记，避免onAuthStateChange重复重定向
        isEmailLoginRedirectingRef.current = true;
        setIsLoading(false);
        
        // 立即重定向到landing主页
        console.log('🚀 立即跳转到 /landing');
        window.location.href = '/landing';
        return;
      } else if (data.user) {
        // 如果只有 user 没有 session，等待 session 设置
        console.log('用户存在但 session 为空，等待 session 设置...');
        setMessage({ type: 'success', text: '登录成功，正在设置会话...' });
        // onAuthStateChange 会处理重定向
      } else {
        console.error('登录返回数据异常:', data);
        setMessage({ type: 'error', text: '登录失败，返回数据异常，请重试。' });
        setIsLoading(false);
      }
    } catch (err) {
      console.error('登录时出错:', err);
      setMessage({
        type: 'error',
        text: '登录时发生错误，请稍后重试',
      });
      setIsLoading(false);
    }
  };

  // Magic Link 登录已从前端移除（仅保留邮箱/密码与第三方 OAuth）

  // 处理忘记密码
  const handleForgotPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSendingReset(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/login`,
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
        setIsSendingReset(false);
        return;
      }

      setMessage({
        type: 'success',
        text: '密码重置链接已发送到您的邮箱，请查收邮件并按照提示重置密码',
      });
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
    } catch (error) {
      console.error('发送密码重置邮件时出错:', error);
      setMessage({
        type: 'error',
        text: '发送密码重置邮件时发生错误，请稍后重试',
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF6EF] px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <AnimatedSection variant="fadeUp" className="text-center">
          {/* Logo */}
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#0B3D2E]" />
              <span className="text-2xl font-extrabold tracking-wide text-[#0B3D2E]">
                No More anxious<sup className="text-xs">™</sup>
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-semibold text-[#0B3D2E]">登录</h1>
          <p className="mt-2 text-sm text-[#0B3D2E]/80">
            欢迎回来，请登录您的账户
          </p>
        </AnimatedSection>

        <AnimatedSection variant="fadeUp">
          <div className="text-center px-6 py-2">
            <p className="text-sm text-[#0B3D2E]/60 italic">
              我们将始终履行对抗贩卖焦虑的行为。
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection variant="fadeUp" className="mt-8">
          {/* 消息提示 */}
          {message && (
            <div
              className={`mb-4 rounded-md p-4 ${
                message.type === 'success'
                  ? 'bg-[#0B3D2E]/10 text-[#0B3D2E] border border-[#0B3D2E]/20'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          {/* 登录表单 */}
          <form
            onSubmit={handleEmailPasswordLogin}
            className="space-y-6 rounded-lg border border-[#E7E1D6] bg-white p-6 shadow-sm"
          >
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#0B3D2E]">
                邮箱地址
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] placeholder:text-[#0B3D2E]/40 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E]/30"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-[#0B3D2E]">
                  密码
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setMessage(null);
                  }}
                  className="text-xs text-[#0B3D2E]/70 hover:text-[#0B3D2E] underline"
                >
                  忘记密码？
                </button>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] placeholder:text-[#0B3D2E]/40 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E]/30"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? '处理中...' : '登录'}
            </button>
          </form>

          {/* 注册链接 */}
          <p className="mt-6 text-center text-sm text-[#0B3D2E]/70">
            还没有账户？{' '}
            <Link href="/signup" className="font-medium text-[#0B3D2E] hover:text-[#0B3D2E]/80 underline">
              立即注册
            </Link>
          </p>

          {/* 第三方登录分隔线 */}
          <div className="mt-8">
            <div className="relative flex items-center">
              <div className="flex-1 border-t border-dashed border-[#E7E1D6]" />
              <span className="mx-3 text-xs uppercase tracking-widest text-[#0B3D2E]/50">
                或使用其他平台登录
              </span>
              <div className="flex-1 border-t border-dashed border-[#E7E1D6]" />
            </div>

            {/* 第三方登录按钮 */}
            <div className="mt-6 flex justify-center gap-4">
              <button
                type="button"
                onClick={() => handleOAuthLogin('twitter')}
                disabled={oauthProviderLoading !== null}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-[#0B3D2E]/20 bg-white text-[#0B3D2E] shadow-sm transition-all hover:border-[#0B3D2E] hover:bg-[#FAF6EF] disabled:opacity-50 disabled:cursor-not-allowed"
                title="使用 X 登录"
              >
                <span className="text-lg font-semibold">X</span>
              </button>
              <button
                type="button"
                onClick={() => handleOAuthLogin('github')}
                disabled={oauthProviderLoading !== null}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-[#0B3D2E]/20 bg-white text-[#0B3D2E] shadow-sm transition-all hover:border-[#0B3D2E] hover:bg-[#FAF6EF] disabled:opacity-50 disabled:cursor-not-allowed"
                title="使用 GitHub 登录"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </button>
              <button
                type="button"
                onClick={() => handleOAuthLogin('wechat')}
                disabled={oauthProviderLoading !== null}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-[#0B3D2E]/20 bg-white text-[#0B3D2E] shadow-sm transition-all hover:border-[#0B3D2E] hover:bg-[#FAF6EF] disabled:opacity-50 disabled:cursor-not-allowed"
                title="使用微信登录"
              >
                {/* 微信官方风格简化 logo：两个对话气泡 */}
                <svg className="h-6 w-6" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g fill="#1AAD19">
                    <path d="M20 8a12 12 0 100 24 12 12 0 000-24z"/>
                    <path d="M44 14a9 9 0 100 18 9 9 0 000-18z"/>
                  </g>
                  <path d="M18 28c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4 4 1.8 4 4z" fill="#fff"/>
                  <path d="M44 20c0 1.2-.9 2-2 2s-2-.8-2-2 .9-2 2-2 2 .8 2 2z" fill="#fff"/>
                </svg>
              </button>
            </div>
          </div>
        </AnimatedSection>

        {/* 忘记密码弹窗 */}
        {showForgotPassword && (
          <AnimatedSection variant="fadeUp" className="mt-4">
            <div className="rounded-lg border border-[#E7E1D6] bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#0B3D2E]">重置密码</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail('');
                    setMessage(null);
                  }}
                  className="text-[#0B3D2E]/60 hover:text-[#0B3D2E]"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-[#0B3D2E]">
                    注册邮箱
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] placeholder:text-[#0B3D2E]/40 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E]/30"
                    placeholder="your@email.com"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isSendingReset}
                    className="flex-1 rounded-xl bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSendingReset ? '发送中...' : '发送验证码'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordEmail('');
                      setMessage(null);
                    }}
                    className="rounded-xl border border-[#E7E1D6] bg-white px-4 py-2 text-sm font-medium text-[#0B3D2E] hover:bg-[#FAF6EF] transition-colors"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          </AnimatedSection>
        )}

      </div>
    </div>
  );
}

/**
 * 登录页面组件
 * 支持 Magic Link（邮件链接）和邮箱/密码登录
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAF6EF]">
          <div className="text-center">
            <p className="text-[#0B3D2E]/70">加载中...</p>
          </div>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}

