'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, Check, Lock, AlertCircle } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import BrutalistNav from './BrutalistNav';

type AuthMode = 'signup' | 'login';

export default function BrutalistAuth() {
    const [mode, setMode] = useState<AuthMode>('signup');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const supabase = createClientComponentClient();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                });
                if (error) throw error;
                setSuccess(true);
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push('/brutalist/calibration');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
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
                                className="brutalist-card p-8 space-y-6"
                            >
                                {/* Email */}
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-[#888] mb-2">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555]" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            placeholder="you@example.com"
                                            className="w-full bg-transparent border border-[#333] focus:border-white px-4 py-3 pl-12 text-white placeholder-[#555] outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-[#888] mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555]" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            placeholder="••••••••"
                                            className="w-full bg-transparent border border-[#333] focus:border-white px-4 py-3 pl-12 text-white placeholder-[#555] outline-none transition-colors"
                                        />
                                    </div>
                                </div>

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

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="brutalist-cta brutalist-cta-filled w-full group disabled:opacity-50"
                                >
                                    {loading ? (
                                        <span>Processing...</span>
                                    ) : (
                                        <>
                                            <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                        </>
                                    )}
                                </button>

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
