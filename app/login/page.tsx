'use client';

import { useState, FormEvent, Suspense, useEffect } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import AnimatedSection from '@/components/AnimatedSection';

/**
 * 登录表单内容组件（使用 Suspense 包裹 useSearchParams）
 */
function LoginFormContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isMagicLink, setIsMagicLink] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [showWechatSignup, setShowWechatSignup] = useState(false);
  const [oauthProviderLoading, setOauthProviderLoading] = useState<'google' | 'twitter' | 'reddit' | null>(null);
  const [showNarrativePopup, setShowNarrativePopup] = useState(true);
  const [narrativePhase, setNarrativePhase] = useState<'enter' | 'stable' | 'exit'>('enter');
  const wechatQrSrc =
    process.env.NEXT_PUBLIC_WECHAT_QR_URL ||
    'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=https%3A%2F%2Fmp.weixin.qq.com';
  const searchParams = useSearchParams();
  const supabase = createClientSupabaseClient();
  
  // 监听认证状态变化
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // 登录成功，等待一下确保 cookies 同步
        await new Promise(resolve => setTimeout(resolve, 300));
        const redirectedFrom = searchParams.get('redirectedFrom') || '/landing';
        // 使用硬重定向确保服务器端能读取到 session
        window.location.href = redirectedFrom;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, searchParams]);

  useEffect(() => {
    if (!showNarrativePopup) {
      return;
    }
    const settleTimer = setTimeout(() => setNarrativePhase('stable'), 500);
    const exitTimer = setTimeout(() => setNarrativePhase('exit'), 4500);
    const hideTimer = setTimeout(() => setShowNarrativePopup(false), 5000);
    return () => {
      clearTimeout(settleTimer);
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, [showNarrativePopup]);
  const handleOAuthLogin = async (provider: 'google' | 'twitter' | 'reddit') => {
    setOauthProviderLoading(provider);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setMessage({
          type: 'error',
          text: error.message || '第三方登录失败，请稍后再试。',
        });
      }
    } catch (error) {
      console.error('第三方登录出错:', error);
      setMessage({
        type: 'error',
        text: '登录过程中出现未知错误，请稍后重试。',
      });
    } finally {
      setOauthProviderLoading(null);
    }
  };

  // 处理邮箱/密码登录
  const handleEmailPasswordLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
        setIsLoading(false);
        return;
      }

      if (data.user && data.session) {
        // 登录成功，session 已返回
        // onAuthStateChange 会处理重定向，这里只显示成功消息
        setMessage({ type: 'success', text: '登录成功，正在跳转...' });
        // 不在这里重定向，让 onAuthStateChange 处理
      } else if (data.user) {
        // 如果只有 user 没有 session，等待 session 设置
        setMessage({ type: 'success', text: '登录成功，正在设置会话...' });
        // onAuthStateChange 会处理重定向
      }
    } catch (error) {
      console.error('登录时出错:', error);
      setMessage({
        type: 'error',
        text: '登录时发生错误，请稍后重试',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 处理 Magic Link 登录
  const handleMagicLinkLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
        setIsLoading(false);
        return;
      }

      setMessage({
        type: 'success',
        text: '登录链接已发送到您的邮箱，请查收邮件并点击链接完成登录',
      });
    } catch (error) {
      console.error('发送 Magic Link 时出错:', error);
      setMessage({
        type: 'error',
        text: '发送登录链接时发生错误，请稍后重试',
      });
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="flex min-h-screen items-center justify-center bg-[#FAF6EF] px-4 py-12 relative overflow-hidden">
      {showNarrativePopup && (
        <div className="pointer-events-none fixed inset-0 z-40 flex justify-center">
          <div
            className={`pointer-events-auto mt-16 w-full max-w-2xl px-4 transition-all duration-700 ease-out ${
              narrativePhase === 'enter'
                ? 'translate-y-[-30px] opacity-0'
                : narrativePhase === 'exit'
                ? 'translate-y-[-60px] opacity-0'
                : 'translate-y-0 opacity-100'
            }`}
          >
            <div className="rounded-2xl border border-[#0B3D2E]/20 bg-gradient-to-br from-[#0B3D2E] via-[#06261c] to-[#020f0b] p-[1px] shadow-[0_20px_80px_rgba(11,61,46,0.35)]">
              <div className="rounded-2xl bg-[#FAF6EF] p-6 text-center text-[#0B3D2E]">
                <p className="text-base font-semibold tracking-wide">
                  你是否在社交平台看过太多25岁A9的故事；
                  <br />
                  天天封口搞钱，瞻前顾后；
                  <br />
                  我们将杀死对焦虑的贩卖行为。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
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

        <AnimatedSection variant="fadeUp" className="mt-8">
          <div className="mb-6 flex justify-center gap-4">
            <div className="flex items-center gap-2 rounded-full border border-[#0B3D2E]/20 bg-white px-3 py-1 text-xs text-[#0B3D2E] shadow-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1AAD19] text-white text-sm">微</span>
              <span>微信扫码</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-[#0B3D2E]/20 bg-white px-3 py-1 text-xs text-[#0B3D2E] shadow-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#EA4335]">G</span>
              <span>Google 登录</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-[#0B3D2E]/20 bg-white px-3 py-1 text-xs text-[#0B3D2E] shadow-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">X</span>
              <span>X 登录</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-[#0B3D2E]/20 bg-white px-3 py-1 text-xs text-[#0B3D2E] shadow-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FF4500] text-sm font-semibold text-white">R</span>
              <span>Reddit 登录</span>
            </div>
          </div>

          {/* 切换登录方式 */}
          <div className="mb-6 flex rounded-lg border border-[#E7E1D6] bg-white p-1">
            <button
              type="button"
              onClick={() => setIsMagicLink(false)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                !isMagicLink
                  ? 'bg-[#0B3D2E]/10 text-[#0B3D2E]'
                  : 'text-[#0B3D2E]/70 hover:text-[#0B3D2E]'
              }`}
            >
              邮箱/密码
            </button>
            <button
              type="button"
              onClick={() => setIsMagicLink(true)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                isMagicLink
                  ? 'bg-[#0B3D2E]/10 text-[#0B3D2E]'
                  : 'text-[#0B3D2E]/70 hover:text-[#0B3D2E]'
              }`}
            >
              Magic Link
            </button>
          </div>

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
            onSubmit={isMagicLink ? handleMagicLinkLogin : handleEmailPasswordLogin}
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
                className="mt-1 block w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] placeholder:text-[#0B3D2E]/40 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E]/30"
                placeholder="your@email.com"
              />
            </div>

            {!isMagicLink && (
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
                  className="mt-1 block w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] placeholder:text-[#0B3D2E]/40 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E]/30"
                  placeholder="••••••••"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? '处理中...' : isMagicLink ? '发送登录链接' : '登录'}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative flex items-center">
              <div className="flex-1 border-t border-dashed border-[#E7E1D6]" />
              <span className="mx-3 text-xs uppercase tracking-widest text-[#0B3D2E]/50">
                或使用其他平台登录
              </span>
              <div className="flex-1 border-t border-dashed border-[#E7E1D6]" />
            </div>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => setShowWechatSignup(true)}
                className="inline-flex w-full items-center justify-between rounded-md border border-[#0B3D2E]/30 bg-white px-4 py-2 text-sm font-medium text-[#0B3D2E] shadow-sm transition-all hover:border-[#0B3D2E] hover:bg-[#FAF6EF]"
              >
                <span className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1AAD19] text-sm font-semibold text-white">
                    微
                  </span>
                  <span>微信扫码登录</span>
                </span>
                <span className="text-xs text-[#0B3D2E]/60">推荐中国大陆用户</span>
              </button>
              <button
                type="button"
                onClick={() => handleOAuthLogin('google')}
                disabled={oauthProviderLoading === 'google'}
                className="inline-flex w-full items-center justify-between rounded-md border border-[#E7E1D6] bg-white px-4 py-2 text-sm font-medium text-[#0B3D2E] shadow-sm transition-all hover:border-[#0B3D2E]/70 hover:bg-[#FAF6EF] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#F4C7C3] bg-white text-sm font-semibold text-[#EA4335]">
                    G
                  </span>
                  <span>使用 Google 登录</span>
                </span>
                <span className="text-xs text-[#0B3D2E]/60">
                  {oauthProviderLoading === 'google' ? '跳转中...' : '同步 Gmail 用户'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleOAuthLogin('twitter')}
                disabled={oauthProviderLoading === 'twitter'}
                className="inline-flex w-full items-center justify-between rounded-md border border-[#E7E1D6] bg-white px-4 py-2 text-sm font-medium text-[#0B3D2E] shadow-sm transition-all hover:border-[#0B3D2E]/70 hover:bg-[#FAF6EF] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                    X
                  </span>
                  <span>使用 X 登录</span>
                </span>
                <span className="text-xs text-[#0B3D2E]/60">
                  {oauthProviderLoading === 'twitter' ? '跳转中...' : '同步 X (Twitter) 账号'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleOAuthLogin('reddit')}
                disabled={oauthProviderLoading === 'reddit'}
                className="inline-flex w-full items-center justify-between rounded-md border border-[#E7E1D6] bg-white px-4 py-2 text-sm font-medium text-[#0B3D2E] shadow-sm transition-all hover:border-[#0B3D2E]/70 hover:bg-[#FAF6EF] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF4500] text-sm font-semibold text-white">
                    R
                  </span>
                  <span>使用 Reddit 登录</span>
                </span>
                <span className="text-xs text-[#0B3D2E]/60">
                  {oauthProviderLoading === 'reddit' ? '跳转中...' : '同步 Reddit 账号'}
                </span>
              </button>
            </div>
          </div>

          {/* 注册链接 */}
          <p className="mt-6 text-center text-sm text-[#0B3D2E]/70">
            还没有账户？{' '}
            <Link href="/signup" className="font-medium text-[#0B3D2E] hover:text-[#0B3D2E]/80 underline">
              立即注册
            </Link>
          </p>
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
                    className="mt-1 block w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] placeholder:text-[#0B3D2E]/40 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E]/30"
                    placeholder="your@email.com"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isSendingReset}
                    className="flex-1 rounded-md bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/40 disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="rounded-md border border-[#E7E1D6] bg-white px-4 py-2 text-sm font-medium text-[#0B3D2E] hover:bg-[#FAF6EF] transition-colors"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          </AnimatedSection>
        )}

        {showWechatSignup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <AnimatedSection variant="fadeUp" className="w-full max-w-sm">
              <div className="rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-lg">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#0B3D2E]">微信扫码登录 / 注册</h3>
                    <p className="mt-1 text-sm text-[#0B3D2E]/70">
                      使用微信扫一扫关注官方小程序后即可快捷登录或一键创建账号。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowWechatSignup(false)}
                    className="text-[#0B3D2E]/50 transition-colors hover:text-[#0B3D2E]"
                    aria-label="关闭微信扫码弹窗"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-[#0B3D2E]/10 bg-[#FFFDF8] px-5 py-6">
                  <div className="rounded-xl border border-[#0B3D2E]/10 bg-white p-3 shadow-inner">
                    <Image
                      src={wechatQrSrc}
                      alt="微信扫码登录二维码"
                      width={192}
                      height={192}
                      className="h-48 w-48 rounded-md object-contain"
                      unoptimized
                    />
                  </div>
                  <div className="text-center text-xs text-[#0B3D2E]/60">
                    <p>1. 打开微信 &gt; 扫一扫</p>
                    <p>2. 关注「No More anxious」官方服务</p>
                    <p>3. 按指引完成绑定，账号将自动同步至 Web 端</p>
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowWechatSignup(false)}
                    className="flex-1 rounded-md border border-[#E7E1D6] bg-white px-4 py-2 text-sm font-medium text-[#0B3D2E] transition-colors hover:bg-[#FAF6EF]"
                  >
                    我已完成扫码
                  </button>
                  <Link
                    href="weixin://"
                    className="flex-1 rounded-md bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] px-4 py-2 text-center text-sm font-medium text-white shadow-md transition-all hover:shadow-lg"
                  >
                    打开微信
                  </Link>
                </div>
              </div>
            </AnimatedSection>
          </div>
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

