'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, Check, Lock, AlertCircle } from 'lucide-react';
import BrutalistNav from './BrutalistNav';
import { useAuth } from '@/hooks/domain/useAuth';

type AuthMode = 'signup' | 'login';

export default function BrutalistAuth() {
    const [mode, setMode] = useState<AuthMode>('signup');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [success, setSuccess] = useState(false);

    const { signIn, signUp, isSigningIn, isSigningUp, error } = useAuth();
    const isSubmitting = mode === 'signup' ? isSigningUp : isSigningIn;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (mode === 'signup') {
                const success = await signUp(email, password, {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    shouldRedirect: false,
                });
                if (success) setSuccess(true);
            } else {
                const success = await signIn(email, password, '/brutalist/calibration');
            }
        } catch (err: any) {
            console.error(err);
        }
    };

    return (
        <div className="brutalist-page min-h-screen">
            <BrutalistNav />

            <main className="pt-20 px-6 flex items-center justify-center min-h-screen">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md"
                >
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="brutalist-h2 mb-4">
                            {mode === 'signup' ? 'Join the Beta' : 'Welcome Back'}
                        </h1>
                        <p className="brutalist-body">
                            {mode === 'signup'
                                ? 'Limited to 500 users. Your data stays on your device.'
                                : 'Continue your optimization journey.'}
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {success ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="brutalist-card p-8 text-center"
                            >
                                <div className="w-16 h-16 mx-auto mb-6 border border-[#00FF94] flex items-center justify-center">
                                    <Check className="w-8 h-8 signal-green" />
                                </div>
                                <h2 className="brutalist-h3 mb-4">Check Your Email</h2>
                                <p className="brutalist-body mb-6">
                                    We've sent a verification link to <strong className="text-white">{email}</strong>
                                </p>
                                <div className="brutalist-badge inline-flex">
                                    <Lock className="w-3 h-3" />
                                    <span>Secure. Private. Local.</span>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.form
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onSubmit={handleSubmit}
                                className={`brutalist-card p-8 space-y-6 ${isSubmitting ? 'animate-pulse' : ''}`}
                            >
                                {/* Email */}
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-[var(--brutalist-muted)] mb-2">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brutalist-muted)]" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            placeholder="you@example.com"
                                            className="w-full bg-transparent border border-[var(--brutalist-border)] focus:border-[var(--signal-green)] px-4 py-3 pl-12 outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-[var(--brutalist-muted)] mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brutalist-muted)]" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            placeholder="••••••••"
                                            className="w-full bg-transparent border border-[var(--brutalist-border)] focus:border-[var(--signal-green)] px-4 py-3 pl-12 outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="brutalist-cta brutalist-cta-filled w-full group disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <span>Processing...</span>
                                    ) : (
                                        <>
                                            <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                        </>
                                    )}
                                </button>

                                {/* Error */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-3 p-4 border border-red-500/50 bg-red-500/10 text-red-400"
                                    >
                                        <AlertCircle className="w-5 h-5 shrink-0" />
                                        <span className="text-sm">{error}</span>
                                    </motion.div>
                                )}

                                {/* Toggle Mode */}
                                <p className="text-center text-sm text-[#888]">
                                    {mode === 'signup' ? (
                                        <>
                                            Already have an account?{' '}
                                            <button
                                                type="button"
                                                onClick={() => setMode('login')}
                                                className="text-white hover:signal-green transition-colors"
                                            >
                                                Sign in
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            Don't have an account?{' '}
                                            <button
                                                type="button"
                                                onClick={() => setMode('signup')}
                                                className="text-white hover:signal-green transition-colors"
                                            >
                                                Join beta
                                            </button>
                                        </>
                                    )}
                                </p>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {/* Privacy Note */}
                    <p className="text-center mt-8 text-xs text-[#555]">
                        No data is uploaded. All processing happens on-device.
                    </p>
                </motion.div>
            </main>
        </div>
    );
}
