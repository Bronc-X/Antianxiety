'use client';

import { useState, FormEvent } from 'react';
import type { MouseEvent } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import AnimatedSection from '@/components/AnimatedSection';
import { countryDialingCodes } from '@/data/countryDialingCodes';

// 防止预渲染，因为这是客户端组件且需要环境变量
export const dynamic = 'force-dynamic';

/**
 * 注册页面组件
 * 新用户注册表单
 */
export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [signupMode, setSignupMode] = useState<'email' | 'phone'>('email');
  const [selectedDialCode, setSelectedDialCode] = useState(
    countryDialingCodes.find((item) => item.code === 'CN')?.dialCode || countryDialingCodes[0].dialCode
  );
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showWechatModal, setShowWechatModal] = useState(false);
  const [oauthProviderLoading, setOauthProviderLoading] = useState<'google' | 'twitter' | 'reddit' | null>(null);
  const wechatQrSrc =
    process.env.NEXT_PUBLIC_WECHAT_QR_URL ||
    'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=https%3A%2F%2Fmp.weixin.qq.com';
  const router = useRouter();
  const supabase = createClientSupabaseClient();

  // 处理用户注册
  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // 验证密码匹配
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: '两次输入的密码不匹配' });
      setIsLoading(false);
      return;
    }

    // 验证密码长度
    if (password.length < 6) {
      setMessage({ type: 'error', text: '密码长度至少为 6 个字符' });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // 注册成功，显示成功消息
        setMessage({
          type: 'success',
          text: '注册成功！请查收邮件以验证您的账户。',
        });

        // 如果用户已自动登录，重定向到仪表板
        if (data.session) {
          setTimeout(() => {
            router.push('/dashboard');
            router.refresh();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('注册时出错:', error);
      setMessage({
        type: 'error',
        text: '注册时发生错误，请稍后重试',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPhoneOtp = async (event: FormEvent<HTMLFormElement> | MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!phoneNumber.trim()) {
      setMessage({ type: 'error', text: '请输入手机号' });
      return;
    }

    const numericPhone = phoneNumber.replace(/\D/g, '');
    if (numericPhone.length < 6) {
      setMessage({ type: 'error', text: '手机号格式不正确，请确认后再试' });
      return;
    }

    const fullPhoneNumber = `${selectedDialCode}${numericPhone}`;

    setIsSendingOtp(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhoneNumber,
        options: {
          shouldCreateUser: true,
          data: {
            signup_method: 'phone',
          },
        },
      });

      if (error) {
        setMessage({
          type: 'error',
          text: error.message || '验证码发送失败，请稍后再试',
        });
        setIsSendingOtp(false);
        return;
      }

      setOtpSent(true);
      setMessage({
        type: 'success',
        text: '验证码已发送至您的手机，请注意查收。',
      });
    } catch (error) {
      console.error('发送手机验证码时出错:', error);
      setMessage({
        type: 'error',
        text: '发送验证码时发生错误，请稍后重试',
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyPhoneSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!otpSent) {
      setMessage({ type: 'error', text: '请先获取验证码' });
      return;
    }

    if (!otpCode || otpCode.trim().length < 4) {
      setMessage({ type: 'error', text: '请输入正确的验证码' });
      return;
    }

    const numericPhone = phoneNumber.replace(/\D/g, '');
    const fullPhoneNumber = `${selectedDialCode}${numericPhone}`;

    setIsVerifyingOtp(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: fullPhoneNumber,
        token: otpCode.trim(),
        type: 'sms',
      });

      if (error) {
        setMessage({
          type: 'error',
          text: error.message || '验证码验证失败，请重新获取',
        });
        setIsVerifyingOtp(false);
        return;
      }

      if (data?.session) {
        setMessage({
          type: 'success',
          text: '注册成功！正在为您跳转...',
        });
        setTimeout(() => {
          router.push('/landing');
          router.refresh();
        }, 1500);
      } else {
        setMessage({
          type: 'success',
          text: '验证码验证成功，请前往登录。',
        });
      }
    } catch (error) {
      console.error('验证手机验证码时出错:', error);
      setMessage({
        type: 'error',
        text: '验证发生异常，请稍后重试',
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleOAuthSignup = async (provider: 'google' | 'twitter' | 'reddit') => {
    setOauthProviderLoading(provider);
    setMessage(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as 'google' | 'twitter',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setMessage({
          type: 'error',
          text: error.message || '跳转第三方授权失败，请稍后再试。',
        });
      }
      if (data?.url) {
        window.location.assign(data.url);
      }
    } catch (error) {
      console.error('第三方注册出错:', error);
      setMessage({
        type: 'error',
        text: '第三方注册发生未知错误，请稍后重试。',
      });
    } finally {
      setOauthProviderLoading(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF6EF] px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <AnimatedSection variant="fadeUp" className="text-center">
          <h1 className="text-3xl font-semibold text-[#0B3D2E]">注册</h1>
          <p className="mt-2 text-sm text-[#0B3D2E]/80">
            创建您的账户，开始建立健康习惯
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <div className="flex items-center gap-2 rounded-full border border-[#0B3D2E]/20 bg-white px-3 py-1 text-xs text-[#0B3D2E] shadow-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1AAD19] text-white text-sm">微</span>
              <span>微信扫码</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-[#0B3D2E]/20 bg-white px-3 py-1 text-xs text-[#0B3D2E] shadow-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#EA4335]">G</span>
              <span>Google 注册</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-[#0B3D2E]/20 bg-white px-3 py-1 text-xs text-[#0B3D2E] shadow-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">X</span>
              <span>X 注册</span>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection variant="fadeUp" className="mt-8">
          <div className="mb-6 flex rounded-lg border border-[#E7E1D6] bg-white p-1">
            <button
              type="button"
              onClick={() => {
                setSignupMode('email');
                setMessage(null);
              }}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                signupMode === 'email'
                  ? 'bg-[#0B3D2E]/10 text-[#0B3D2E]'
                  : 'text-[#0B3D2E]/70 hover:text-[#0B3D2E]'
              }`}
            >
              邮箱注册
            </button>
            <button
              type="button"
              onClick={() => {
                setSignupMode('phone');
                setMessage(null);
              }}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                signupMode === 'phone'
                  ? 'bg-[#0B3D2E]/10 text-[#0B3D2E]'
                  : 'text-[#0B3D2E]/70 hover:text-[#0B3D2E]'
              }`}
            >
              手机号注册
            </button>
          </div>

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

          {signupMode === 'email' ? (
            <form
              onSubmit={handleSignup}
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

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#0B3D2E]">
                  密码
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] placeholder:text-[#0B3D2E]/40 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E]/30"
                  placeholder="至少 6 个字符"
                  minLength={6}
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-[#0B3D2E]"
                >
                  确认密码
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] placeholder:text-[#0B3D2E]/40 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E]/30"
                  placeholder="再次输入密码"
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-md bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? '注册中...' : '注册'}
              </button>
            </form>
          ) : (
            <form
              onSubmit={handleVerifyPhoneSignup}
              className="space-y-6 rounded-lg border border-[#E7E1D6] bg-white p-6 shadow-sm"
            >
              <div>
                <label className="block text-sm font-medium text-[#0B3D2E]">国家 / 地区</label>
                <select
                  value={selectedDialCode}
                  onChange={(event) => setSelectedDialCode(event.target.value)}
                  className="mt-1 block w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E]/30"
                >
                  {countryDialingCodes.map((country) => (
                    <option key={country.code} value={country.dialCode}>
                      {country.name} {country.dialCode}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-[#0B3D2E]">
                  手机号
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    value={selectedDialCode}
                    readOnly
                    className="w-20 rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E]"
                  />
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    className="flex-1 rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] placeholder:text-[#0B3D2E]/40 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E]/30"
                    placeholder="请输入手机号"
                  />
                </div>
                <p className="mt-2 text-xs text-[#0B3D2E]/60">
                  我们会向此号码发送一次性验证码，用于账号创建与验证。
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSendPhoneOtp}
                  disabled={isSendingOtp}
                  className="rounded-md border border-[#0B3D2E]/30 bg-white px-4 py-2 text-sm font-medium text-[#0B3D2E] transition-colors hover:border-[#0B3D2E] hover:bg-[#FAF6EF] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSendingOtp ? '发送中...' : '发送验证码'}
                </button>
                {otpSent && (
                  <span className="text-xs text-[#0B3D2E]/60">验证码已发送，如未收到可重新发送。</span>
                )}
              </div>

              {otpSent && (
                <div>
                  <label htmlFor="otpCode" className="block text-sm font-medium text-[#0B3D2E]">
                    验证码
                  </label>
                  <input
                    id="otpCode"
                    name="otpCode"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    value={otpCode}
                    onChange={(event) => setOtpCode(event.target.value)}
                    className="mt-1 block w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] placeholder:text-[#0B3D2E]/40 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E]/30 tracking-widest"
                    placeholder="输入短信验证码"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={!otpSent || isVerifyingOtp}
                className="w-full rounded-md bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isVerifyingOtp ? '验证中...' : '验证并注册'}
              </button>

              <p className="text-xs text-[#0B3D2E]/60">
                提示：如尚未在 Supabase 控制台配置短信服务商，请先完成设置后再尝试手机注册。
              </p>
            </form>
          )}

          <div className="mt-8">
            <div className="relative flex items-center">
              <div className="flex-1 border-t border-dashed border-[#E7E1D6]" />
              <span className="mx-3 text-xs uppercase tracking-widest text-[#0B3D2E]/50">
                或使用其他平台快速注册
              </span>
              <div className="flex-1 border-t border-dashed border-[#E7E1D6]" />
            </div>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => setShowWechatModal(true)}
                className="inline-flex w-full items-center justify-between rounded-md border border-[#0B3D2E]/30 bg-white px-4 py-2 text-sm font-medium text-[#0B3D2E] shadow-sm transition-all hover:border-[#0B3D2E] hover:bg-[#FAF6EF]"
              >
                <span className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1AAD19] text-sm font-semibold text-white">
                    微
                  </span>
                  <span>微信扫码注册</span>
                </span>
                <span className="text-xs text-[#0B3D2E]/60">秒级完成账号创建</span>
              </button>
              <button
                type="button"
                onClick={() => handleOAuthSignup('google')}
                disabled={oauthProviderLoading === 'google'}
                className="inline-flex w-full items-center justify-between rounded-md border border-[#E7E1D6] bg-white px-4 py-2 text-sm font-medium text-[#0B3D2E] shadow-sm transition-all hover:border-[#0B3D2E]/70 hover:bg-[#FAF6EF] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#F4C7C3] bg-white text-sm font-semibold text-[#EA4335]">
                    G
                  </span>
                  <span>使用 Google 创建账号</span>
                </span>
                <span className="text-xs text-[#0B3D2E]/60">
                  {oauthProviderLoading === 'google' ? '跳转中...' : '同步 Gmail 信息'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleOAuthSignup('twitter')}
                disabled={oauthProviderLoading === 'twitter'}
                className="inline-flex w-full items-center justify-between rounded-md border border-[#E7E1D6] bg-white px-4 py-2 text-sm font-medium text-[#0B3D2E] shadow-sm transition-all hover:border-[#0B3D2E]/70 hover:bg-[#FAF6EF] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                    X
                  </span>
                  <span>使用 X (Twitter) 创建账号</span>
                </span>
                <span className="text-xs text-[#0B3D2E]/60">
                  {oauthProviderLoading === 'twitter' ? '跳转中...' : '同步社交资料'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleOAuthSignup('reddit')}
                disabled={oauthProviderLoading === 'reddit'}
                className="inline-flex w-full items-center justify-between rounded-md border border-[#E7E1D6] bg-white px-4 py-2 text-sm font-medium text-[#0B3D2E] shadow-sm transition-all hover:border-[#0B3D2E]/70 hover:bg-[#FAF6EF] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF4500] text-sm font-semibold text-white">
                    R
                  </span>
                  <span>使用 Reddit 注册</span>
                </span>
                <span className="text-xs text-[#0B3D2E]/60">
                  {oauthProviderLoading === 'reddit' ? '跳转中...' : '同步 Reddit 账号'}
                </span>
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-[#0B3D2E]/70">
            已有账户？{' '}
            <Link href="/login" className="font-medium text-[#0B3D2E] hover:text-[#0B3D2E]/80 underline">
              立即登录
            </Link>
          </p>
        </AnimatedSection>

        {showWechatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <AnimatedSection variant="fadeUp" className="w-full max-w-sm">
              <div className="rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-lg">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#0B3D2E]">微信扫码注册 / 登录</h3>
                    <p className="mt-1 text-sm text-[#0B3D2E]/70">
                      使用微信扫一扫关注我们的官方服务，即可在微信内完成注册并同步到 Web 端。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowWechatModal(false)}
                    className="text-[#0B3D2E]/50 transition-colors hover:text-[#0B3D2E]"
                    aria-label="关闭微信扫码注册弹窗"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-[#0B3D2E]/10 bg-[#FFFDF8] px-5 py-6">
                  <div className="rounded-xl border border-[#0B3D2E]/10 bg-white p-3 shadow-inner">
                    <Image
                      src={wechatQrSrc}
                      alt="微信扫码注册二维码"
                      width={192}
                      height={192}
                      className="h-48 w-48 rounded-md object-contain"
                      unoptimized
                    />
                  </div>
                  <div className="text-center text-xs text-[#0B3D2E]/60">
                    <p>1. 打开微信 &gt; 扫一扫</p>
                    <p>2. 关注「No More anxious」官方服务</p>
                    <p>3. 按指引完成注册，账号自动登录</p>
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowWechatModal(false)}
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

