'use client';

import { useState, FormEvent } from 'react';
import type { MouseEvent } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import AnimatedSection from '@/components/AnimatedSection';
import LanguageSwitcher from '@/components/LanguageSwitcher';
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
    if (password.length < 8) {
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
        if (data.session) { setTimeout(() => { router.push('/onboarding'); router.refresh(); }, 2000); }
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
        setTimeout(() => { router.push('/onboarding'); router.refresh(); }, 1500);
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
    <div className="flex min-h-screen items-center justify-center bg-[#FAF6EF] dark:bg-neutral-950 px-4 py-12 transition-colors relative">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md space-y-8">
        <AnimatedSection variant="fadeUp" className="text-center">
          <h1 className="text-3xl font-semibold text-[#0B3D2E] dark:text-white">{t('signup.title')}</h1>
          <p className="mt-2 text-sm text-[#0B3D2E]/80 dark:text-neutral-400">{t('signup.subtitle')}</p>
        </AnimatedSection>

        <AnimatedSection variant="fadeUp" className="mt-8">
          <div className="mb-6 flex rounded-lg border border-[#E7E1D6] dark:border-neutral-700 bg-white dark:bg-neutral-900 p-1">
            <button type="button" onClick={() => { setSignupMode('email'); setMessage(null); }}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${signupMode === 'email' ? 'bg-[#0B3D2E]/10 dark:bg-white/10 text-[#0B3D2E] dark:text-white' : 'text-[#0B3D2E]/70 dark:text-neutral-400 hover:text-[#0B3D2E] dark:hover:text-white'}`}>
              {t('signup.emailSignup')}
            </button>
            <button type="button" onClick={() => { setSignupMode('phone'); setMessage(null); }}
              disabled={true}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors cursor-not-allowed opacity-50 text-[#0B3D2E]/70 dark:text-neutral-400`}>
              {t('signup.phoneSignup')} (Beta测试中)
            </button>
          </div>

          {message && (
            <div className={`mb-4 rounded-md p-4 ${message.type === 'success' ? 'bg-[#0B3D2E]/10 dark:bg-emerald-900/30 text-[#0B3D2E] dark:text-emerald-300 border border-[#0B3D2E]/20 dark:border-emerald-700' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700'}`}>
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          {signupMode === 'email' ? (
            <form onSubmit={handleSignup} className="space-y-6 rounded-lg border border-[#E7E1D6] dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#0B3D2E] dark:text-neutral-200">{t('login.email')}</label>
                <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-[#E7E1D6] dark:border-neutral-700 bg-[#FFFDF8] dark:bg-neutral-800 px-3 py-2 text-sm text-[#0B3D2E] dark:text-white placeholder:text-[#0B3D2E]/40 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 dark:focus:ring-white/20 focus:border-[#0B3D2E]/30 dark:focus:border-neutral-600"
                  placeholder={t('login.emailPlaceholder')} />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#0B3D2E] dark:text-neutral-200">{t('signup.password')}</label>
                <input id="password" name="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-[#E7E1D6] dark:border-neutral-700 bg-[#FFFDF8] dark:bg-neutral-800 px-3 py-2 text-sm text-[#0B3D2E] dark:text-white placeholder:text-[#0B3D2E]/40 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 dark:focus:ring-white/20 focus:border-[#0B3D2E]/30 dark:focus:border-neutral-600"
                  placeholder={t('signup.passwordPlaceholder')} minLength={8} />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#0B3D2E] dark:text-neutral-200">{t('signup.confirmPassword')}</label>
                <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-[#E7E1D6] dark:border-neutral-700 bg-[#FFFDF8] dark:bg-neutral-800 px-3 py-2 text-sm text-[#0B3D2E] dark:text-white placeholder:text-[#0B3D2E]/40 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 dark:focus:ring-white/20 focus:border-[#0B3D2E]/30 dark:focus:border-neutral-600"
                  placeholder={t('signup.confirmPlaceholder')} minLength={8} />
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full rounded-md bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] dark:from-emerald-600 dark:via-emerald-700 dark:to-emerald-800 px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/40 dark:focus:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50">
                {isLoading ? t('signup.processing') : t('signup.submit')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyPhoneSignup} className="space-y-6 rounded-lg border border-[#E7E1D6] dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
              <div>
                <label className="block text-sm font-medium text-[#0B3D2E] dark:text-neutral-200">{t('signup.country')}</label>
                <select value={selectedDialCode} onChange={(event) => setSelectedDialCode(event.target.value)}
                  className="mt-1 block w-full rounded-md border border-[#E7E1D6] dark:border-neutral-700 bg-[#FFFDF8] dark:bg-neutral-800 px-3 py-2 text-sm text-[#0B3D2E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 dark:focus:ring-white/20 focus:border-[#0B3D2E]/30 dark:focus:border-neutral-600">
                  {countryDialingCodes.map((country) => (<option key={country.code} value={country.dialCode}>{country.name} {country.dialCode}</option>))}
                </select>
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-[#0B3D2E] dark:text-neutral-200">{t('signup.phone')}</label>
                <div className="mt-1 flex gap-2">
                  <input value={selectedDialCode} readOnly className="w-20 rounded-md border border-[#E7E1D6] dark:border-neutral-700 bg-[#FFFDF8] dark:bg-neutral-800 px-3 py-2 text-sm text-[#0B3D2E] dark:text-white" />
                  <input id="phoneNumber" name="phoneNumber" type="tel" autoComplete="tel" required value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)}
                    className="flex-1 rounded-md border border-[#E7E1D6] dark:border-neutral-700 bg-[#FFFDF8] dark:bg-neutral-800 px-3 py-2 text-sm text-[#0B3D2E] dark:text-white placeholder:text-[#0B3D2E]/40 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 dark:focus:ring-white/20 focus:border-[#0B3D2E]/30 dark:focus:border-neutral-600"
                    placeholder={t('signup.phonePlaceholder')} />
                </div>
                <p className="mt-2 text-xs text-[#0B3D2E]/60 dark:text-neutral-500">{t('signup.phoneHint')}</p>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={handleSendPhoneOtp} disabled={isSendingOtp}
                  className="rounded-md border border-[#0B3D2E]/30 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-[#0B3D2E] dark:text-white transition-colors hover:border-[#0B3D2E] dark:hover:border-neutral-500 hover:bg-[#FAF6EF] dark:hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {isSendingOtp ? t('login.sending') : t('signup.sendOtp')}
                </button>
                {otpSent && (<span className="text-xs text-[#0B3D2E]/60 dark:text-neutral-500">{t('signup.otpSent')}</span>)}
              </div>
              {otpSent && (
                <div>
                  <label htmlFor="otpCode" className="block text-sm font-medium text-[#0B3D2E] dark:text-neutral-200">{t('signup.otpCode')}</label>
                  <input id="otpCode" name="otpCode" type="text" inputMode="numeric" autoComplete="one-time-code" required value={otpCode} onChange={(event) => setOtpCode(event.target.value)}
                    className="mt-1 block w-full rounded-md border border-[#E7E1D6] dark:border-neutral-700 bg-[#FFFDF8] dark:bg-neutral-800 px-3 py-2 text-sm text-[#0B3D2E] dark:text-white placeholder:text-[#0B3D2E]/40 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 dark:focus:ring-white/20 focus:border-[#0B3D2E]/30 dark:focus:border-neutral-600 tracking-widest"
                    placeholder={t('signup.otpPlaceholder')} />
                </div>
              )}
              <button type="submit" disabled={!otpSent || isVerifyingOtp}
                className="w-full rounded-md bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] dark:from-emerald-600 dark:via-emerald-700 dark:to-emerald-800 px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/40 dark:focus:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50">
                {isVerifyingOtp ? t('signup.verifying') : t('signup.verifyAndSignup')}
              </button>
              <p className="text-xs text-[#0B3D2E]/60 dark:text-neutral-500">{t('signup.smsHint')}</p>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-[#0B3D2E]/70 dark:text-neutral-400">
            {t('signup.hasAccount')}{' '}
            <Link href="/login" className="font-medium text-[#0B3D2E] dark:text-white hover:text-[#0B3D2E]/80 dark:hover:text-neutral-300 underline">{t('signup.loginNow')}</Link>
          </p>

          <div className="mt-8">
            <div className="relative flex items-center">
              <div className="flex-1 border-t border-dashed border-[#E7E1D6] dark:border-neutral-700" />
              <span className="mx-3 text-xs uppercase tracking-widest text-[#0B3D2E]/50 dark:text-neutral-500">{t('login.orOther')}</span>
              <div className="flex-1 border-t border-dashed border-[#E7E1D6] dark:border-neutral-700" />
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
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
              </button>
              {/* 微信 - 绿色 */}
              <button type="button" onClick={() => setShowWechatModal(true)} disabled={oauthProviderLoading !== null}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1AAD19] text-white shadow-sm transition-all hover:bg-[#1AAD19]/80 disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('login.useWechat')}>
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.045c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.269-.03-.406-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z" />
                </svg>
              </button>
            </div>
          </div>
        </AnimatedSection>

        {showWechatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowWechatModal(false)}>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-[#0B3D2E] dark:text-white text-center mb-4">{t('signup.wechatScan')}</h3>
              <div className="flex justify-center mb-4">
                <Image src={wechatQrSrc} alt="WeChat QR Code" width={220} height={220} className="rounded-lg" />
              </div>
              <p className="text-sm text-[#0B3D2E]/70 dark:text-neutral-400 text-center">{t('signup.wechatHint')}</p>
              <button onClick={() => setShowWechatModal(false)} className="mt-4 w-full py-2 rounded-xl border border-[#E7E1D6] dark:border-neutral-700 text-[#0B3D2E] dark:text-white text-sm font-medium hover:bg-[#FAF6EF] dark:hover:bg-neutral-800 transition-colors">
                {t('common.close')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
