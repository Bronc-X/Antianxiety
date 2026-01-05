'use client';

import { useState, FormEvent, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AnimatedSection from '@/components/AnimatedSection';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/domain/useAuth';
import { useAuthProviders } from '@/hooks/domain/useAuthProviders';

function LoginFormContent() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const [isLoading, setIsLoading] = useState(false); // Removed, using hook loading state
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [oauthProviderLoading, setOauthProviderLoading] = useState<'twitter' | 'github' | 'reddit' | 'phone' | null>(null);
  const [showPhoneLogin, setShowPhoneLogin] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const searchParams = useSearchParams();
  const { loadRedditLogin } = useAuthProviders();
  const {
    user,
    isLoading: authInitLoading,
    signIn,
    signInWithOAuth,
    sendPhoneOtp,
    resetPassword,
    isSigningIn: authLoading,
    error: authError,
    clearError,
  } = useAuth();

  useEffect(() => {
    if (!authInitLoading && user) {
      const redirectTo = searchParams.get('redirectedFrom') || '/unlearn/onboarding';
      window.location.href = redirectTo;
    }
  }, [authInitLoading, searchParams, user]);

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

  const handleOAuthLogin = async (provider: 'twitter' | 'github' | 'reddit') => {
    setOauthProviderLoading(provider);
    setMessage(null);
    try {
      // Reddit uses custom OAuth flow
      if (provider === 'reddit') {
        const data = await loadRedditLogin();
        if (data?.url) {
          window.location.href = data.url;
        } else {
          setMessage({ type: 'error', text: t('error.auth') });
          setOauthProviderLoading(null);
        }
        return;
      }

      const redirectTo = `${window.location.origin}/auth/callback?next=/unlearn`;
      const url = await signInWithOAuth(provider, redirectTo);
      if (url) {
        window.location.assign(url);
        return;
      }
      setMessage({ type: 'error', text: authError || t('error.auth') });
    } catch (err) {
      setMessage({ type: 'error', text: t('error.unknown') });
    } finally {
      setOauthProviderLoading(null);
    }
  };

  // Handle phone login - now saves to waitlist instead of sending OTP (feature in beta)
  const handlePhoneLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setOauthProviderLoading('phone');
    setMessage(null);

    try {
      const res = await fetch('/api/phone-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber.trim() })
      });

      if (!res.ok) {
        setMessage({ type: 'error', text: t('signup.phoneBetaError') });
        return;
      }

      const data = await res.json();
      if (data.message === 'already_registered') {
        setMessage({ type: 'success', text: t('signup.phoneBetaAlready') });
      } else {
        setMessage({ type: 'success', text: t('signup.phoneBetaSuccess') });
      }
      setShowPhoneLogin(false);
      setPhoneNumber('');
    } catch (err) {
      setMessage({ type: 'error', text: t('signup.phoneBetaError') });
    } finally {
      setOauthProviderLoading(null);
    }
  };


  // Import at top level needs to be handled separately or added to existing imports
  // Assuming imports are handled in a separate block or manually checked

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleEmailPasswordLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // setIsLoading(true); // Handled by hook
    setMessage(null);

    // We can use the hook's returned promise boolean
    const redirectTo = searchParams.get('redirectedFrom') || '/unlearn/onboarding';
    const success = await signIn(email, password, redirectTo);

    if (success) {
      // Redirect is handled inside useAuth for success case (pushes to /unlearn usually, or we can customize if needed)
      // Wait, useAuth redirects to /unlearn. 
      // Login page might need to redirect to onboarding or intended destination.
      // Let's check useAuth implementation. It pushes to /unlearn.
      // The login page logic had specific redirect logic (query params).
      // We should ideally let the UI handle navigation if possible, or update useAuth to accept a redirect path.
      // For now, let's keep the hook usage:
      setMessage({ type: 'success', text: t('login.success') });
    } else {
      // Error state in hook will be updated, we can also set message here if we want immediate feedback
      setMessage({ type: 'error', text: authError || t('error.unknown') });
    }
  };

  // Sync auth hook error to local message
  useEffect(() => {
    if (authError) {
      setMessage({ type: 'error', text: authError });
    }
  }, [authError]);

  // Combined loading state
  // const isLoading = authLoading; // We can replace the local isLoading state usage with authLoading


  const handleForgotPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSendingReset(true);
    setMessage(null);
    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/unlearn/update-password`;
      const success = await resetPassword(forgotPasswordEmail, redirectTo);
      if (!success) {
        setMessage({ type: 'error', text: authError || t('error.unknown') });
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
    <div className="flex min-h-screen items-center justify-center bg-[#FAF6EF] dark:bg-neutral-950 px-4 py-12 transition-colors relative">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md space-y-8">
        <AnimatedSection variant="fadeUp" className="text-center">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#0B3D2E] dark:bg-white" />
              <span className="text-2xl font-extrabold tracking-wide text-[#0B3D2E] dark:text-white">
                AntiAnxiety<sup className="text-xs">™</sup>
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
            <button type="submit" disabled={authLoading}
              className="w-full rounded-xl bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] dark:from-emerald-600 dark:via-emerald-700 dark:to-emerald-800 px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/40 dark:focus:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50">
              {authLoading ? t('login.processing') : t('login.submit')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#0B3D2E]/70 dark:text-neutral-400">
            {t('login.noAccount')}{' '}
            <Link href="/unlearn/signup" className="font-medium text-[#0B3D2E] dark:text-white hover:text-[#0B3D2E]/80 dark:hover:text-neutral-300 underline">{t('login.signupNow')}</Link>
          </p>

          <div className="mt-8">
            <div className="relative flex items-center">
              <div className="flex-1 border-t border-dashed border-[#E7E1D6] dark:border-neutral-700" />
              <span className="mx-3 text-xs uppercase tracking-widest text-[#0B3D2E]/50 dark:text-neutral-500">{t('login.orOther')}</span>
              <div className="flex-1 border-t border-dashed border-[#E7E1D6] dark:border-neutral-700" />
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              {/* X (Twitter) */}
              <button type="button" onClick={() => handleOAuthLogin('twitter')} disabled={oauthProviderLoading !== null}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-sm transition-all hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('login.useX') || 'Sign in with X'}>
                <span className="text-lg font-semibold">X</span>
              </button>
              {/* GitHub */}
              <button type="button" onClick={() => handleOAuthLogin('github')} disabled={oauthProviderLoading !== null}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#24292e] text-white shadow-sm transition-all hover:bg-[#24292e]/80 disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('login.useGithub') || 'Sign in with GitHub'}>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
              </button>
              {/* Reddit */}
              <button type="button" onClick={() => handleOAuthLogin('reddit')} disabled={oauthProviderLoading !== null}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF4500] text-white shadow-sm transition-all hover:bg-[#FF4500]/80 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Sign in with Reddit">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" /></svg>
              </button>
              {/* Phone - Beta */}
              <div className="relative">
                <button type="button" onClick={() => setShowPhoneLogin(true)} disabled={oauthProviderLoading !== null}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition-all hover:bg-emerald-600/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t('signup.phoneBetaTitle')}>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </button>
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full">{t('signup.betaTesting')}</span>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {showForgotPassword && (
          <AnimatedSection variant="fadeUp" className="mt-4">
            <div
              ref={(el) => {
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className="rounded-lg border border-[#E7E1D6] dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm"
            >
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

        {/* Phone Login Modal - Beta */}
        {showPhoneLogin && (
          <AnimatedSection variant="fadeUp" className="mt-4">
            <div className="rounded-lg border border-[#E7E1D6] dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-[#0B3D2E] dark:text-white">{t('signup.phoneBetaTitle')}</h3>
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{t('signup.betaTesting')}</span>
                </div>
                <button type="button" onClick={() => { setShowPhoneLogin(false); setPhoneNumber(''); setMessage(null); }} className="text-[#0B3D2E]/60 dark:text-neutral-400 hover:text-[#0B3D2E] dark:hover:text-white">✕</button>
              </div>
              <p className="text-sm text-[#0B3D2E]/70 dark:text-neutral-400 mb-4">{t('signup.phoneBetaDesc')}</p>
              <form onSubmit={handlePhoneLogin} className="space-y-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-[#0B3D2E] dark:text-neutral-200">{t('signup.phone')}</label>
                  <input id="phone" type="tel" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-[#E7E1D6] dark:border-neutral-700 bg-[#FFFDF8] dark:bg-neutral-800 px-3 py-2 text-sm text-[#0B3D2E] dark:text-white placeholder:text-[#0B3D2E]/40 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 dark:focus:ring-white/20"
                    placeholder={t('signup.phoneBetaPlaceholder')} />
                  <p className="mt-1 text-xs text-neutral-500">{t('signup.phoneHint')}</p>
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={oauthProviderLoading === 'phone'}
                    className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50">
                    {oauthProviderLoading === 'phone' ? t('signup.phoneBetaSubmitting') : t('signup.phoneBetaSubmit')}
                  </button>
                  <button type="button" onClick={() => { setShowPhoneLogin(false); setPhoneNumber(''); }}
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
