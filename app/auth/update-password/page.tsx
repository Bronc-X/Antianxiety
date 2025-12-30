'use client';

import { useState, FormEvent, Suspense, useEffect } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import AnimatedSection from '@/components/AnimatedSection';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18n';

function UpdatePasswordContent() {
    const { t } = useI18n();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const router = useRouter();
    const supabase = createClientSupabaseClient();

    const handleUpdatePassword = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: '密码不匹配' });
            return;
        }
        if (password.length < 6) {
            setMessage({ type: 'error', text: '密码长度至少需要 6 位' });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({ password: password });

            if (error) {
                setMessage({ type: 'error', text: error.message });
                setIsLoading(false);
                return;
            }

            setMessage({ type: 'success', text: '密码修改成功！即将跳转...' });
            setTimeout(() => {
                router.push('/unlearn/app');
            }, 2000);

        } catch (err) {
            setMessage({ type: 'error', text: t('error.unknown') });
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#FAF6EF] dark:bg-neutral-950 px-4 py-12 transition-colors relative">
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
                    <h1 className="text-3xl font-semibold text-[#0B3D2E] dark:text-white">设置新密码</h1>
                    <p className="mt-2 text-sm text-[#0B3D2E]/80 dark:text-neutral-400">请输入您的新密码以完成重置</p>
                </AnimatedSection>

                <AnimatedSection variant="fadeUp" className="mt-8">
                    {message && (
                        <div className={`mb-4 rounded-md p-4 ${message.type === 'success' ? 'bg-[#0B3D2E]/10 dark:bg-emerald-900/30 text-[#0B3D2E] dark:text-emerald-300 border border-[#0B3D2E]/20 dark:border-emerald-700' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700'}`}>
                            <p className="text-sm">{message.text}</p>
                        </div>
                    )}

                    <form onSubmit={handleUpdatePassword} className="space-y-6 rounded-lg border border-[#E7E1D6] dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-[#0B3D2E] dark:text-neutral-200">新密码</label>
                            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full rounded-xl border border-[#E7E1D6] dark:border-neutral-700 bg-[#FFFDF8] dark:bg-neutral-800 px-3 py-2 text-sm text-[#0B3D2E] dark:text-white placeholder:text-[#0B3D2E]/40 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 dark:focus:ring-white/20 focus:border-[#0B3D2E]/30 dark:focus:border-neutral-600"
                                placeholder="至少 6 位字符" />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#0B3D2E] dark:text-neutral-200">确认新密码</label>
                            <input id="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                className="mt-1 block w-full rounded-xl border border-[#E7E1D6] dark:border-neutral-700 bg-[#FFFDF8] dark:bg-neutral-800 px-3 py-2 text-sm text-[#0B3D2E] dark:text-white placeholder:text-[#0B3D2E]/40 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 dark:focus:ring-white/20 focus:border-[#0B3D2E]/30 dark:focus:border-neutral-600"
                                placeholder="请再次输入密码" />
                        </div>
                        <button type="submit" disabled={isLoading}
                            className="w-full rounded-xl bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] dark:from-emerald-600 dark:via-emerald-700 dark:to-emerald-800 px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/40 dark:focus:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50">
                            {isLoading ? '更新中...' : '更新密码'}
                        </button>
                    </form>
                </AnimatedSection>
            </div>
        </div>
    );
}

export default function UpdatePasswordPage() {
    const { t } = useI18n();
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#FAF6EF] dark:bg-neutral-950"><div className="text-center"><p className="text-[#0B3D2E]/70 dark:text-neutral-400">{t('common.loading')}</p></div></div>}>
            <UpdatePasswordContent />
        </Suspense>
    );
}
