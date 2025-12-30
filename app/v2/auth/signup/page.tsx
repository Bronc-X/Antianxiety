'use client';

/**
 * V2 Signup Page
 * 
 * 调用 Supabase Auth 进行注册，成功后跳转到 Onboarding
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase-client';

export default function V2SignupPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError('密码不匹配');
            setIsLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('密码至少6个字符');
            setIsLoading(false);
            return;
        }

        try {
            const supabase = createClient();
            const { error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/v2/onboarding`,
                },
            });

            if (authError) {
                setError(authError.message);
                return;
            }

            console.log('[V2 Signup] 注册成功，跳转到 Onboarding');
            router.push('/v2/onboarding');
        } catch (err) {
            setError(err instanceof Error ? err.message : '注册失败');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <Link href="/v2/welcome" className="text-emerald-400 hover:text-emerald-300 mb-8 inline-flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    返回
                </Link>

                <h1 className="text-3xl font-bold text-white mb-2">注册</h1>
                <p className="text-emerald-400/60 mb-8">开始你的健康之旅</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-emerald-300 text-sm mb-2">邮箱</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800/50 border border-emerald-900/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600/50"
                            placeholder="your@email.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-emerald-300 text-sm mb-2">密码</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800/50 border border-emerald-900/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600/50"
                            placeholder="至少6个字符"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-emerald-300 text-sm mb-2">确认密码</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800/50 border border-emerald-900/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600/50"
                            placeholder="再次输入密码"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-900/30 border border-red-700/30 rounded-xl text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 rounded-xl text-white font-semibold transition-all"
                    >
                        {isLoading ? '注册中...' : '注册'}
                    </button>
                </form>

                <p className="text-center text-emerald-400/60 mt-6">
                    已有账号？{' '}
                    <Link href="/v2/auth/login" className="text-emerald-400 hover:text-emerald-300">
                        登录
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
