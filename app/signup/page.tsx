'use client';

import { useState, FormEvent } from 'react';
import type { MouseEvent } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import AnimatedSection from '@/components/AnimatedSection';
import { countryDialingCodes } from '@/data/countryDialingCodes';
import { useI18n } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default function SignupPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
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
  const [oauthProviderLoading, setOauthProviderLoading] = useState<'twitter' | 'github' | 'wechat' | null>(null);
  const wechatQrSrc = process.env.NEXT_PUBLIC_WECHAT_QR_URL || 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=https%3A%2F%2Fmp.weixin.qq.com';
  const router = useRouter();
  const supabase = createClientSupabaseClient();

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: t('signup.passwordMismatch') });
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: t('signup.passwordTooShort') });
      setIsLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) { setMessage({ type: 'error', text: error.message }); setIsLoading(false); return; }
      if (data.user) {
        setMessage({ type: 'success', text: t('signup.success') });
        if (data.session) { setTimeout(() => { router.push('/landing'); router.refresh(); }, 2000); }
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('error.unknown') });
    } finally { setIsLoading(false); }
  };

  const handleSendPhoneOtp = async (event: FormEvent<HTMLFormElement> | MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!phoneNumber.trim()) { setMessage({ type: 'error', text: t('signup.phonePlaceholder') }); return; }
    const numericPhone = phoneNumber.replace(/\D/g, '');
    if (numericPhone.length < 6) { setMessage({ type: 'error', text: t('error.unknown') }); return; }
    const fullPhoneNumber = `${selectedDialCode}${numericPhone}`;
    setIsSendingOtp(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhoneNumber,
        options: { shouldCreateUser: true, data: { signup_method: 'phone' } },
      });
      if (error) { setMessage({ type: 'error', text: error.message }); setIsSendingOtp(false); return; }
      setOtpSent(true);
      setMessage({ type: 'success', text: t('signup.otpSent') });
    } catch (error) {
      setMessage({ type: 'error', text: t('error.unknown') });
    } finally { setIsSendingOtp(false); }
  };

  const handleVerifyPhoneSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!otpSent) { setMessage({ type: 'error', text: t('signup.sendOtp') }); return; }
    if (!otpCode || otpCode.trim().length < 4) { setMessage({ type: 'error', text: t('signup.otpPlaceholder') }); return; }
    const numericPhone = phoneNumber.replace(/\D/g, '');
    const fullPhoneNumber = `${selectedDialCode}${numericPhone}`;
    setIsVerifyingOtp(true);
    setMessage(null);
    try {
      const { data, error } = await supabase.auth.verifyOtp({ phone: fullPhoneNumber, token: otpCode.trim(), type: 'sms' });
      if (error) { setMessage({ type: 'error', text: error.message }); setIsVerifyingOtp(false); return; }
      if (data?.session) {
        setMessage({ type: 'success', text: t('signup.redirecting') });
        setTimeout(() => { router.push('/landing'); router.refresh(); }, 1500);
      } else {
        setMessage({ type: 'success', text: t('signup.otpSuccess') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('error.unknown') });
    } finally { setIsVerifyingOtp(false); }
  };

  const handleOAuthSignup = async (provider: 'twitter' | 'github' | 'wechat') => {
    setOauthProviderLoading(provider);
    setMessage(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as 'twitter' | 'github',
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`, skipBrowserRedirect: false },
      });
      if (error) { setMessage({ type: 'error', text: error.message }); setOauthProviderLoading(null); }
      if (data?.url) { window.location.assign(data.url); }
    } catch (error) {
      setMessage({ type: 'error', text: t('error.unknown') });
      setOauthProviderLoading(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF6EF] px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <AnimatedSection variant="fadeUp" className="text-center">
          <h1 className="text-3xl font-semibold text-[#0B3D2E]">{t('signup.title')}</h1>
          <p className="mt-2 text-sm text-[#0B3D2E]/80">{t('signup.subtitle')}</p>
          <div className="mt-4 flex justify-center gap-4">
            <div className="flex items-center gap-2 rounded-full border border-[#0B3D2E]/20 bg-white px-3 py-1 text-xs text-[#0B3D2E] shadow-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1AAD19] text-white text-sm">微</span>
              <span>{t('signup.wechatScan')}</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-[#0B3D2E]/20 bg-white px-3 py-1 text-xs text-[#0B3D2E] shadow-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">X</span>
              <span>{t('signup.xSignup')}</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-[#0B3D2E]/20 bg-white px-3 py-1 text-xs text-[#0B3D2E] shadow-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#24292e] text-white text-xs">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              </span>
              <span>{t('signup.githubSignup')}</span>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection variant="fadeUp" className="mt-8">
          <div className="mb-6 flex rounded-lg border border-[#E7E1D6] bg-white p-1">
            <button type="button" onClick={() => { setSignupMode('email'); setMessage(null); }}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${signupMode === 'email' ? 'bg-[#0B3D2E]/10 text-[#0B3D2E]' : 'text-[#0B3D2E]/70 hover:text-[#0B3D2E]'}`}>
              {t('signup.emailSignup')}
            </button>
            <button type="button" onClick={() => { setSignupMode('phone'); setMessage(null); }}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${signupMode === 'phone' ? 'bg-[#0B3D2E]/10 text-[#0B3D2E]' : 'text-[#0B3D2E]/70 hover:text-[#0B3D2E]'}`}>
              {t('signup.phoneSignup')}
            </button>
          </div>

          {message && (
            <div className={`mb-4 rounded-md p-4 ${message.type === 'success' ? 'bg-[#0B3D2E]/10 text-[#0B3D2E] border border-[#0B3D2E]/20' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          {signupMode === 'email' ? (
            <form onSubmit={handleSignup} className="space-y-6 rounded-lg border border-[#E7E1D6] bg-white p-6 shadow-sm">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#0B3D2E]">{t('login.email')}</label>
                <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] placeholder:text-[#0B3D2E]/40 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E]/30"
                  placeholder={t('login.emailPlaceholder')} />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#0B3D2E]">{t('signup.password')}</label>
                <input id="password" name="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] placeholder:text-[#0B3D2E]/40 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E]/30"
                  placeholder={t('signup.passwordPlaceholder')} minLength={6} />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#0B3D2E]">{t('signup.confirmPassword')}</label>
                <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] placeholder:text-[#0B3D2E]/40 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E]/30"
                  placeholder={t('signup.confirmPlaceholder')} minLength={6} />
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full rounded-md bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/40 disabled:cursor-not-allowed disabled:opacity-50">
                {isLoading ? t('signup.processing') : t('signup.submit')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyPhoneSignup} className="space-y-6 rounded-lg border border-[#E7E1D6] bg-white p-6 shadow-sm">
              <div>
                <label className="block text-sm font-medium text-[#0B3D2E]">{t('signup.country')}</label>
                <select value={selectedDialCode} onChange={(event) => setSelectedDialCode(event.target.value)}
                  className="mt-1 block w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E]/30">
                  {countryDialingCodes.map((country) => (<option key={country.code} value={country.dialCode}>{country.name} {country.dialCode}</option>))}
                </select>
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-[#0B3D2E]">{t('signup.phone')}</label>
                <div className="mt-1 flex gap-2">
                  <input value={selectedDialCode} readOnly className="w-20 rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E]" />
                  <input id="phoneNumber" name="phoneNumber" type="tel" autoComplete="tel" required value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)}
                    className="flex-1 rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] placeholder:text-[#0B3D2E]/40 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E]/30"
                    placeholder={t('signup.phonePlaceholder')} />
                </div>
                <p className="mt-2 text-xs text-[#0B3D2E]/60">{t('signup.phoneHint')}</p>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={handleSendPhoneOtp} disabled={isSendingOtp}
                  className="rounded-md border border-[#0B3D2E]/30 bg-white px-4 py-2 text-sm font-medium text-[#0B3D2E] transition-colors hover:border-[#0B3D2E] hover:bg-[#FAF6EF] disabled:cursor-not-allowed disabled:opacity-60">
                  {isSendingOtp ? t('login.sending') : t('signup.sendOtp')}
                </button>
                {otpSent && (<span className="text-xs text-[#0B3D2E]/60">{t('signup.otpSent')}</span>)}
              </div>
              {otpSent && (
                <div>
                  <label htmlFor="otpCode" className="block text-sm font-medium text-[#0B3D2E]">{t('signup.otpCode')}</label>
                  <input id="otpCode" name="otpCode" type="text" inputMode="numeric" autoComplete="one-time-code" required value={otpCode} onChange={(event) => setOtpCode(event.target.value)}
                    className="mt-1 block w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] placeholder:text-[#0B3D2E]/40 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E]/30 tracking-widest"
                    placeholder={t('signup.otpPlaceholder')} />
                </div>
              )}
              <button type="submit" disabled={!otpSent || isVerifyingOtp}
                className="w-full rounded-md bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/40 disabled:cursor-not-allowed disabled:opacity-50">
                {isVerifyingOtp ? t('signup.verifying') : t('signup.verifyAndSignup')}
              </button>
              <p className="text-xs text-[#0B3D2E]/60">{t('signup.smsHint')}</p>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-[#0B3D2E]/70">
            {t('signup.hasAccount')}{' '}
            <Link href="/login" className="font-medium text-[#0B3D2E] hover:text-[#0B3D2E]/80 underline">{t('signup.loginNow')}</Link>
          </p>

          <div className="mt-8">
            <div className="relative flex items-center">
              <div className="flex-1 border-t border-dashed border-[#E7E1D6]" />
              <span className="mx-3 text-xs uppercase tracking-widest text-[#0B3D2E]/50">{t('login.orOther')}</span>
              <div className="flex-1 border-t border-dashed border-[#E7E1D6]" />
            </div>
            <div className="mt-6 flex justify-center gap-4">
              {/* X (Twitter) - 黑色 */}
              <button type="button" onClick={() => handleOAuthSignup('twitter')} disabled={oauthProviderLoading !== null}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-sm transition-all hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('login.useX')}>
                <span className="text-lg font-semibold">X</span>
              </button>
              {/* GitHub - 深灰 */}
              <button type="button" onClick={() => handleOAuthSignup('github')} disabled={oauthProviderLoading !== null}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#24292e] text-white shadow-sm transition-all hover:bg-[#24292e]/80 disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('login.useGithub')}>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </button>
              {/* 微信 - 绿色 */}
              <button type="button" onClick={() => setShowWechatModal(true)} disabled={oauthProviderLoading !== null}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1AAD19] text-white shadow-sm transition-all hover:bg-[#1AAD19]/80 disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('login.useWechat')}>
                <svg className="h-6 w-6" viewBox="0 0 1024 1024" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M690.1 377.4c5.9 0 11.8.2 17.6.5-15.8-73.2-88.5-127.5-177.2-127.5-95.4 0-172.8 63.8-172.8 142.3 0 44.4 24.1 80.8 64.3 108.8l-16.1 48.2 56.1-28.1c20.1 4 40.2 8.1 60.3 8.1 5.8 0 11.5-.3 17.2-.8-3.6-12.3-5.6-25.1-5.6-38.4 0-62.6 70.2-113.1 156.2-113.1zm-94.8-32.7c12 0 20.1 8.1 20.1 20.1 0 12-8.1 20.1-20.1 20.1s-20.1-8.1-20.1-20.1c0-12 8.1-20.1 20.1-20.1zm-136.2 40.2c-12 0-24.1-8.1-24.1-20.1 0-12 12.1-20.1 24.1-20.1 12 0 20.1 8.1 20.1 20.1 0 12-8.1 20.1-20.1 20.1zM889.7 539.4c0-66.3-64.3-120.4-136.2-120.4-80 0-140.2 54.1-140.2 120.4s60.2 120.4 140.2 120.4c16.1 0 32.2-4 48.2-8.1l44.1 24.1-12-40.2c32.1-24 56-56.1 55.9-96.2zm-176.3-20.1c-8.1 0-16.1-8.1-16.1-16.1 0-8.1 8.1-16.1 16.1-16.1 12 0 20.1 8.1 20.1 16.1 0 8-8.1 16.1-20.1 16.1zm80 0c-8.1 0-16.1-8.1-16.1-16.1 0-8.1 8.1-16.1 16.1-16.1 12 0 20.1 8.1 20.1 16.1 0 8-8.1 16.1-20.1 16.1z"/>
                </svg>
              </button>
            </div>
          </div>
        </AnimatedSection>

        {showWechatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowWechatModal(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-[#0B3D2E] text-center mb-4">{t('signup.wechatScan')}</h3>
              <div className="flex justify-center mb-4">
                <Image src={wechatQrSrc} alt="WeChat QR Code" width={220} height={220} className="rounded-lg" />
              </div>
              <p className="text-sm text-[#0B3D2E]/70 text-center">{t('signup.wechatHint')}</p>
              <button onClick={() => setShowWechatModal(false)} className="mt-4 w-full py-2 rounded-xl border border-[#E7E1D6] text-[#0B3D2E] text-sm font-medium hover:bg-[#FAF6EF] transition-colors">
                {t('common.close')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
