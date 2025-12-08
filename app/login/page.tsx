'use client';

import { useState, FormEvent, Suspense, useEffect, useRef } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AnimatedSection from '@/components/AnimatedSection';
import { useI18n } from '@/lib/i18n';

function LoginFormContent() {
  const { t } = useI18n();
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
  
  useEffect(() => {
    const checkExistingSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const redirectTo = searchParams.get('redirectedFrom') || '/welcome';
        window.location.href = redirectTo;
      }
    };
    checkExistingSession();
  }, [supabase.auth, searchParams]);
  
  useEffect(() => {
    const error = searchParams.get('error');
    const details = searchParams.get('details');
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
      let errorMessage = t('error.auth');
      if (errorCode === 'otp_expired') {
        errorMessage = t('error.auth');
      }
      setMessage({ type: 'error', text: errorMessage });
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, [searchParams, t]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session && !isEmailLoginRedirectingRef.current) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const { data: { user }, error } = await supabase.auth.getUser();
        if (user && !error) {
          const redirectedFrom = searchParams.get('redirectedFrom') || '/welcome';
          window.location.href = redirectedFrom;
        } else {
          setMessage({ type: 'error', text: t('error.auth') });
        }
      }
    });
    return () => { subscription.unsubscribe(); };
  }, [supabase.auth, searchParams, t]);

  const handleOAuthLogin = async (provider: 'twitter' | 'github' | 'wechat') => {
    setOauthProviderLoading(provider);
    setMessage(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as 'twitter' | 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/welcome`,
          skipBrowserRedirect: false,
        },
      });
      if (error) {
        setMessage({ type: 'error', text: error.message || t('error.auth') });
        setOauthProviderLoading(null);
      }
      if (data?.url) { window.location.assign(data.url); }
    } catch (err) {
      setMessage({ type: 'error', text: t('error.unknown') });
      setOauthProviderLoading(null);
    }
  };

  const handleEmailPasswordLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage({ type: 'error', text: error.message });
        setIsLoading(false);
        return;
      }
      if (data.user && data.session) {
        setMessage({ type: 'success', text: t('login.success') });
        isEmailLoginRedirectingRef.current = true;
        setIsLoading(false);
        window.location.href = '/welcome';
        return;
      } else if (data.user) {
        setMessage({ type: 'success', text: t('login.sessionSetting') });
      } else {
        setMessage({ type: 'error', text: t('error.unknown') });
        setIsLoading(false);
      }
    } catch (err) {
      setMessage({ type: 'error', text: t('error.unknown') });
      setIsLoading(false);
    }
  };

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
      setMessage({ type: 'success', text: t('login.resetSent') });
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
    } catch (error) {
      setMessage({ type: 'error', text: t('error.unknown') });
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF6EF] dark:bg-neutral-950 px-4 py-12 transition-colors">
      <div className="w-full max-w-md space-y-8">
        <AnimatedSection variant="fadeUp" className="text-center">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#0B3D2E] dark:bg-white" />
              <span className="text-2xl font-extrabold tracking-wide text-[#0B3D2E] dark:text-white">
                No More anxious<sup className="text-xs">™</sup>
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-semibold text-[#0B3D2E] dark:text-white">{t('login.title')}</h1>
          <p className="mt-2 text-sm text-[#0B3D2E]/80 dark:text-neutral-400">{t('login.welcome')}</p>
        </AnimatedSection>

        <AnimatedSection variant="fadeUp">
          <div className="text-center px-6 py-2">
            <p className="text-sm text-[#0B3D2E]/60 dark:text-neutral-500 italic">{t('login.promise')}</p>
          </div>
        </AnimatedSection>

        <AnimatedSection variant="fadeUp" className="mt-8">
          {message && (
            <div className={`mb-4 rounded-md p-4 ${message.type === 'success' ? 'bg-[#0B3D2E]/10 dark:bg-emerald-900/30 text-[#0B3D2E] dark:text-emerald-300 border border-[#0B3D2E]/20 dark:border-emerald-700' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700'}`}>
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          <form onSubmit={handleEmailPasswordLogin} className="space-y-6 rounded-lg border border-[#E7E1D6] dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#0B3D2E] dark:text-neutral-200">{t('login.email')}</label>
              <input id="email" name="email" type="email" autoComplete="off" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-[#E7E1D6] dark:border-neutral-700 bg-[#FFFDF8] dark:bg-neutral-800 px-3 py-2 text-sm text-[#0B3D2E] dark:text-white placeholder:text-[#0B3D2E]/40 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 dark:focus:ring-white/20 focus:border-[#0B3D2E]/30 dark:focus:border-neutral-600"
                placeholder={t('login.emailPlaceholder')} />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-[#0B3D2E] dark:text-neutral-200">{t('login.password')}</label>
                <button type="button" onClick={() => { setShowForgotPassword(true); setMessage(null); }} className="text-xs text-[#0B3D2E]/70 dark:text-neutral-400 hover:text-[#0B3D2E] dark:hover:text-white underline">
                  {t('login.forgotPassword')}
                </button>
              </div>
              <input id="password" name="password" type="password" autoComplete="off" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-[#E7E1D6] dark:border-neutral-700 bg-[#FFFDF8] dark:bg-neutral-800 px-3 py-2 text-sm text-[#0B3D2E] dark:text-white placeholder:text-[#0B3D2E]/40 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 dark:focus:ring-white/20 focus:border-[#0B3D2E]/30 dark:focus:border-neutral-600"
                placeholder={t('login.passwordPlaceholder')} />
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full rounded-xl bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] dark:from-emerald-600 dark:via-emerald-700 dark:to-emerald-800 px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/40 dark:focus:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50">
              {isLoading ? t('login.processing') : t('login.submit')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#0B3D2E]/70 dark:text-neutral-400">
            {t('login.noAccount')}{' '}
            <Link href="/signup" className="font-medium text-[#0B3D2E] dark:text-white hover:text-[#0B3D2E]/80 dark:hover:text-neutral-300 underline">{t('login.signupNow')}</Link>
          </p>

          <div className="mt-8">
            <div className="relative flex items-center">
              <div className="flex-1 border-t border-dashed border-[#E7E1D6] dark:border-neutral-700" />
              <span className="mx-3 text-xs uppercase tracking-widest text-[#0B3D2E]/50 dark:text-neutral-500">{t('login.orOther')}</span>
              <div className="flex-1 border-t border-dashed border-[#E7E1D6] dark:border-neutral-700" />
            </div>
            <div className="mt-6 flex justify-center gap-4">
              {/* X (Twitter) - 黑色 */}
              <button type="button" onClick={() => handleOAuthLogin('twitter')} disabled={oauthProviderLoading !== null}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-sm transition-all hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('login.useX')}>
                <span className="text-lg font-semibold">X</span>
              </button>
              {/* GitHub - 深灰 */}
              <button type="button" onClick={() => handleOAuthLogin('github')} disabled={oauthProviderLoading !== null}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#24292e] text-white shadow-sm transition-all hover:bg-[#24292e]/80 disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('login.useGithub')}>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </button>
              {/* 微信 - 绿色 */}
              <button type="button" onClick={() => handleOAuthLogin('wechat')} disabled={oauthProviderLoading !== null}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1AAD19] text-white shadow-sm transition-all hover:bg-[#1AAD19]/80 disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('login.useWechat')}>
                <svg className="h-6 w-6" viewBox="0 0 1024 1024" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M690.1 377.4c5.9 0 11.8.2 17.6.5-15.8-73.2-88.5-127.5-177.2-127.5-95.4 0-172.8 63.8-172.8 142.3 0 44.4 24.1 80.8 64.3 108.8l-16.1 48.2 56.1-28.1c20.1 4 40.2 8.1 60.3 8.1 5.8 0 11.5-.3 17.2-.8-3.6-12.3-5.6-25.1-5.6-38.4 0-62.6 70.2-113.1 156.2-113.1zm-94.8-32.7c12 0 20.1 8.1 20.1 20.1 0 12-8.1 20.1-20.1 20.1s-20.1-8.1-20.1-20.1c0-12 8.1-20.1 20.1-20.1zm-136.2 40.2c-12 0-24.1-8.1-24.1-20.1 0-12 12.1-20.1 24.1-20.1 12 0 20.1 8.1 20.1 20.1 0 12-8.1 20.1-20.1 20.1zM889.7 539.4c0-66.3-64.3-120.4-136.2-120.4-80 0-140.2 54.1-140.2 120.4s60.2 120.4 140.2 120.4c16.1 0 32.2-4 48.2-8.1l44.1 24.1-12-40.2c32.1-24 56-56.1 55.9-96.2zm-176.3-20.1c-8.1 0-16.1-8.1-16.1-16.1 0-8.1 8.1-16.1 16.1-16.1 12 0 20.1 8.1 20.1 16.1 0 8-8.1 16.1-20.1 16.1zm80 0c-8.1 0-16.1-8.1-16.1-16.1 0-8.1 8.1-16.1 16.1-16.1 12 0 20.1 8.1 20.1 16.1 0 8-8.1 16.1-20.1 16.1z"/>
                </svg>
              </button>
            </div>
          </div>
        </AnimatedSection>

        {showForgotPassword && (
          <AnimatedSection variant="fadeUp" className="mt-4">
            <div className="rounded-lg border border-[#E7E1D6] dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#0B3D2E] dark:text-white">{t('login.resetPassword')}</h3>
                <button type="button" onClick={() => { setShowForgotPassword(false); setForgotPasswordEmail(''); setMessage(null); }} className="text-[#0B3D2E]/60 dark:text-neutral-400 hover:text-[#0B3D2E] dark:hover:text-white">✕</button>
              </div>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-[#0B3D2E] dark:text-neutral-200">{t('login.registeredEmail')}</label>
                  <input id="forgot-email" type="email" required value={forgotPasswordEmail} onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-[#E7E1D6] dark:border-neutral-700 bg-[#FFFDF8] dark:bg-neutral-800 px-3 py-2 text-sm text-[#0B3D2E] dark:text-white placeholder:text-[#0B3D2E]/40 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 dark:focus:ring-white/20 focus:border-[#0B3D2E]/30 dark:focus:border-neutral-600"
                    placeholder={t('login.emailPlaceholder')} />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={isSendingReset}
                    className="flex-1 rounded-xl bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] dark:from-emerald-600 dark:via-emerald-700 dark:to-emerald-800 px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/40 dark:focus:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50">
                    {isSendingReset ? t('login.sending') : t('login.sendCode')}
                  </button>
                  <button type="button" onClick={() => { setShowForgotPassword(false); setForgotPasswordEmail(''); setMessage(null); }}
                    className="rounded-xl border border-[#E7E1D6] dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-[#0B3D2E] dark:text-white hover:bg-[#FAF6EF] dark:hover:bg-neutral-700 transition-colors">
                    {t('common.cancel')}
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

export default function LoginPage() {
  const { t } = useI18n();
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#FAF6EF] dark:bg-neutral-950"><div className="text-center"><p className="text-[#0B3D2E]/70 dark:text-neutral-400">{t('common.loading')}</p></div></div>}>
      <LoginFormContent />
    </Suspense>
  );
}
