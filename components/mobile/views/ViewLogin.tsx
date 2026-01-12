"use client";

/**
 * ViewLogin - Mobile Login Component
 * 
 * 移动端登录界面，支持邮箱登录和 OAuth
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    Loader2,
    Sparkles,
    ArrowRight,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/domain/useAuth";
import { useAuthProviders } from "@/hooks/domain/useAuthProviders";
import { useBrowser } from "@/hooks/useBrowser";
import MaxAvatar from "@/components/max/MaxAvatar";

const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
};

interface ViewLoginProps {
    onNavigate?: (view: string) => void;
}

export const ViewLogin = ({ onNavigate }: ViewLoginProps) => {
    const { signIn, isSigningIn, error: authError, clearError: clearAuthError } = useAuth();
    const { loadWeChatQr, loadRedditLogin, isLoading: isProviderLoading, error: providerError, clearError: clearProviderError } = useAuthProviders();
    const { open } = useBrowser();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearAuthError();

        const success = await signIn(email, password, '/mobile?view=home');
        if (success) {
            onNavigate?.('home');
        }
    };

    const handleWeChatLogin = async () => {
        clearProviderError();
        const data = await loadWeChatQr();
        if (data?.loginUrl) {
            await open(data.loginUrl);
        }
    };

    const handleRedditLogin = async () => {
        clearProviderError();
        const data = await loadRedditLogin();
        if (data?.url) {
            await open(data.url);
        }
    };

    const handleRegister = () => {
        onNavigate?.('register');
    };

    return (
        <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={{ type: "tween", ease: "anticipate", duration: 0.3 }}
            className="min-h-[calc(100vh-120px)] flex flex-col justify-center px-2 py-8"
        >
            {/* Logo & Welcome */}
            <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                    <div className="relative">
                        <MaxAvatar size={80} state="idle" className="shadow-xl shadow-emerald-500/20" />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -top-1 -right-1 p-1.5 bg-emerald-500 rounded-full"
                        >
                            <Sparkles size={12} className="text-white" />
                        </motion.div>
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50 mb-2">
                    Welcome Back
                </h1>
                <p className="text-stone-500 dark:text-stone-400 text-sm">
                    Sign in to continue your wellness journey
                </p>
            </div>

            {/* Error Message */}
            {authError && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-2"
                >
                    <AlertCircle size={16} className="text-red-500" />
                    <span className="text-sm text-red-600 dark:text-red-400">{authError}</span>
                </motion.div>
            )}
            {providerError && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-2"
                >
                    <AlertCircle size={16} className="text-amber-500" />
                    <span className="text-sm text-amber-700 dark:text-amber-300">{providerError}</span>
                </motion.div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Input */}
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                        <Mail size={18} />
                    </div>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        required
                        className={cn(
                            "w-full pl-12 pr-4 py-4 rounded-2xl",
                            "bg-white dark:bg-white/5",
                            "border border-stone-200 dark:border-white/10",
                            "text-emerald-950 dark:text-white placeholder:text-stone-400",
                            "focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500",
                            "transition-all"
                        )}
                    />
                </div>

                {/* Password Input */}
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                        <Lock size={18} />
                    </div>
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                        className={cn(
                            "w-full pl-12 pr-12 py-4 rounded-2xl",
                            "bg-white dark:bg-white/5",
                            "border border-stone-200 dark:border-white/10",
                            "text-emerald-950 dark:text-white placeholder:text-stone-400",
                            "focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500",
                            "transition-all"
                        )}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                {/* Forgot Password */}
                <div className="text-right">
                    <button
                        type="button"
                        className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                        Forgot password?
                    </button>
                </div>

                {/* Submit Button */}
                <motion.button
                    type="submit"
                    disabled={isSigningIn || !email || !password}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                        "w-full py-4 rounded-2xl font-semibold text-white",
                        "bg-gradient-to-r from-emerald-600 to-teal-600",
                        "shadow-lg shadow-emerald-500/30",
                        "flex items-center justify-center gap-2",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "transition-all hover:shadow-xl hover:shadow-emerald-500/40"
                    )}
                >
                    {isSigningIn ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Signing in...
                        </>
                    ) : (
                        <>
                            Sign In
                            <ArrowRight size={18} />
                        </>
                    )}
                </motion.button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-stone-200 dark:bg-white/10" />
                <span className="text-xs text-stone-400 uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-stone-200 dark:bg-white/10" />
            </div>

            <div className="space-y-3 mb-6">
                <motion.button
                    type="button"
                    onClick={handleWeChatLogin}
                    disabled={isProviderLoading}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                        "w-full py-3.5 rounded-2xl font-semibold",
                        "bg-[#1AAD19]/10 text-[#1AAD19] border border-[#1AAD19]/30",
                        "transition-all hover:bg-[#1AAD19]/15",
                        "flex items-center justify-center gap-2",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                >
                    {isProviderLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    WeChat Login
                </motion.button>
                <motion.button
                    type="button"
                    onClick={handleRedditLogin}
                    disabled={isProviderLoading}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                        "w-full py-3.5 rounded-2xl font-semibold",
                        "bg-[#FF4500]/10 text-[#FF4500] border border-[#FF4500]/30",
                        "transition-all hover:bg-[#FF4500]/15",
                        "flex items-center justify-center gap-2",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                >
                    {isProviderLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    Reddit Login
                </motion.button>
            </div>

            {/* Register Link */}
            <div className="text-center">
                <p className="text-stone-500 dark:text-stone-400 text-sm mb-3">
                    Don&apos;t have an account?
                </p>
                <motion.button
                    onClick={handleRegister}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                        "w-full py-4 rounded-2xl font-semibold",
                        "bg-white dark:bg-white/5",
                        "border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400",
                        "transition-all hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                    )}
                >
                    Create Account
                </motion.button>
            </div>
        </motion.div>
    );
};

export default ViewLogin;
