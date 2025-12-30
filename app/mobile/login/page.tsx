"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/domain/useAuth";
import { useI18n } from "@/lib/i18n";
import InteractiveShape from "@/components/replication/InteractiveShape";
import { ChevronRight, Globe, Loader2, AlertCircle } from "lucide-react";

export default function MobileLoginPage() {
    const router = useRouter();
    const { signIn, signUp, isLoading: authLoading, error: authError, clearError } = useAuth();
    const { language, setLanguage, t } = useI18n(); // Assuming setLanguage works this way or similar

    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        clearError();

        const action = mode === 'login' ? signIn : signUp;
        const success = await action(email, password);

        if (success) {
            router.push('/mobile/dashboard');
        }
        setLoading(false);
    };

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'zh' : 'en');
    };

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col">
            {/* Background Ambient */}
            <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-indigo-100/50 to-transparent pointer-events-none" />

            {/* Language Switcher */}
            <div className="absolute top-6 right-6 z-20">
                <button
                    onClick={toggleLanguage}
                    className="flex items-center gap-2 px-4 py-2 bg-white/40 backdrop-blur-md rounded-full border border-white/50 shadow-sm text-sm font-medium text-slate-700 active:scale-95 transition-transform"
                >
                    <Globe className="w-4 h-4" />
                    {language === 'en' ? 'EN' : '中文'}
                </button>
            </div>

            {/* Visual Header */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 pt-20 pb-10">
                <div className="w-64 h-64 relative mb-8">
                    <div className="absolute inset-0 scale-75 opacity-80">
                        <InteractiveShape />
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">
                        {language === 'en' ? 'Welcome Back' : '欢迎回来'}
                    </h1>
                    <p className="text-slate-500 text-sm">
                        {language === 'en' ? 'Your journey to unlearning anxiety starts here.' : '您消除焦虑的旅程从这里开始。'}
                    </p>
                </motion.div>
            </div>

            {/* Form Section */}
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] p-8 pb-12 relative z-20"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    {authError && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {authError}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 ml-1 uppercase tracking-wider">
                                {language === 'en' ? 'Email' : '邮箱'}
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 ml-1 uppercase tracking-wider">
                                {language === 'en' ? 'Password' : '密码'}
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || authLoading}
                        className="w-full p-4 bg-slate-900 text-white rounded-2xl font-semibold shadow-lg shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading || authLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <span>{mode === 'login'
                                    ? (language === 'en' ? 'Sign In' : '登录')
                                    : (language === 'en' ? 'Create Account' : '创建账号')}
                                </span>
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setMode(mode === 'login' ? 'register' : 'login');
                                clearError();
                            }}
                            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            {mode === 'login'
                                ? (language === 'en' ? "Don't have an account? Sign up" : '还没有账号？立即注册')
                                : (language === 'en' ? "Already have an account? Sign in" : '已有账号？立即登录')}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
