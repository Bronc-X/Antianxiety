'use client';

/**
 * V2 Login Page
 * 
 * 调用 Supabase Auth 进行登录
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase-client';

export default function V2LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setError(authError.message);
                return;
            }

            console.log('[V2 Login] 登录成功');
            router.push('/v2/home');
        } catch (err) {
            setError(err instanceof Error ? err.message : '登录失败');
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

                <h1 className="text-3xl font-bold text-white mb-2">登录</h1>
                <p className="text-emerald-400/60 mb-8">欢迎回来</p>

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
                            placeholder="••••••••"
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
                        {isLoading ? '登录中...' : '登录'}
                    </button>
                </form>

                <p className="text-center text-emerald-400/60 mt-6">
                    没有账号？{' '}
                    <Link href="/v2/auth/signup" className="text-emerald-400 hover:text-emerald-300">
                        注册
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
