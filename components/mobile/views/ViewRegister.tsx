"use client";

/**
 * ViewRegister - Mobile Registration Component
 * 
 * 移动端注册界面，注册后自动跳转到问卷
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
    AlertCircle,
    ArrowLeft,
    User,
    Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/domain/useAuth";
import { useBetaSignup } from "@/hooks/domain/useBetaSignup";
import MaxAvatar from "@/components/max/MaxAvatar";

const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
};

interface ViewRegisterProps {
    onNavigate?: (view: string) => void;
}

export const ViewRegister = ({ onNavigate }: ViewRegisterProps) => {
    const { signUp, isSigningUp, error: authError, clearError: clearAuthError } = useAuth();
    const { submit, isSubmitting, error: betaError, clearError: clearBetaError } = useBetaSignup();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [betaMessage, setBetaMessage] = useState<string | null>(null);

    const passwordsMatch = password === confirmPassword;
    const passwordStrong = password.length >= 8;
    const isFormValid = email && password && confirmPassword && passwordsMatch && passwordStrong && agreed;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearAuthError();

        if (!isFormValid) return;

        const success = await signUp(email, password, {
            redirectTo: '/mobile?view=onboarding',
            shouldRedirect: false
        });

        if (success) {
            // 注册成功，跳转到问卷
            onNavigate?.('onboarding');
        }
    };

    const handleBetaSignup = async () => {
        clearBetaError();
        setBetaMessage(null);

        if (!email.trim()) {
            setBetaMessage("Please enter an email to join the beta.");
            return;
        }

        const success = await submit(email.trim());
        if (success) {
            setBetaMessage("You're on the beta list. We'll reach out soon.");
        }
    };

    const handleBack = () => {
        onNavigate?.('login');
    };

    return (
        <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={{ type: "tween", ease: "anticipate", duration: 0.3 }}
            className="min-h-[calc(100vh-120px)] flex flex-col py-4 px-2"
        >
            {/* Back Button */}
            <button
                onClick={handleBack}
                className="flex items-center gap-2 text-stone-500 dark:text-stone-400 mb-4 hover:text-emerald-600"
            >
                <ArrowLeft size={18} />
                <span className="text-sm">Back to Login</span>
            </button>

            {/* Header */}
            <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                    <div className="relative">
                        <MaxAvatar size={60} state="thinking" className="shadow-lg shadow-emerald-500/20" />
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute -top-1 -right-1 p-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                        >
                            <Sparkles size={10} className="text-white" />
                        </motion.div>
                    </div>
                </div>
                <h1 className="text-xl font-bold text-emerald-950 dark:text-emerald-50 mb-1">
                    Create Account
                </h1>
                <p className="text-stone-500 dark:text-stone-400 text-sm">
                    Start your wellness journey with Max
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

            {/* Register Form */}
            <form onSubmit={handleSubmit} className="space-y-3 flex-1">
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
                            "w-full pl-12 pr-4 py-3.5 rounded-2xl",
                            "bg-white dark:bg-white/5",
                            "border border-stone-200 dark:border-white/10",
                            "text-emerald-950 dark:text-white placeholder:text-stone-400",
                            "focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500",
                            "transition-all text-sm"
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
                        placeholder="Password (min 8 characters)"
                        required
                        className={cn(
                            "w-full pl-12 pr-12 py-3.5 rounded-2xl",
                            "bg-white dark:bg-white/5",
                            "border border-stone-200 dark:border-white/10",
                            "text-emerald-950 dark:text-white placeholder:text-stone-400",
                            "focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500",
                            "transition-all text-sm",
                            password && !passwordStrong && "border-amber-500"
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

                {/* Password Strength Indicator */}
                {password && (
                    <div className="flex items-center gap-2 px-1">
                        <div className={cn(
                            "h-1 flex-1 rounded-full",
                            passwordStrong ? "bg-emerald-500" : "bg-amber-500"
                        )} />
                        <span className={cn(
                            "text-xs",
                            passwordStrong ? "text-emerald-600" : "text-amber-600"
                        )}>
                            {passwordStrong ? "Strong" : "Weak"}
                        </span>
                    </div>
                )}

                {/* Confirm Password Input */}
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                        <Lock size={18} />
                    </div>
                    <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        required
                        className={cn(
                            "w-full pl-12 pr-12 py-3.5 rounded-2xl",
                            "bg-white dark:bg-white/5",
                            "border border-stone-200 dark:border-white/10",
                            "text-emerald-950 dark:text-white placeholder:text-stone-400",
                            "focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500",
                            "transition-all text-sm",
                            confirmPassword && !passwordsMatch && "border-red-500"
                        )}
                    />
                    {confirmPassword && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            {passwordsMatch ? (
                                <Check size={18} className="text-emerald-500" />
                            ) : (
                                <AlertCircle size={18} className="text-red-500" />
                            )}
                        </div>
                    )}
                </div>

                {/* Terms Agreement */}
                <label className="flex items-start gap-3 p-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                        I agree to the <span className="text-emerald-600">Terms of Service</span> and{" "}
                        <span className="text-emerald-600">Privacy Policy</span>
                    </span>
                </label>

                {/* Submit Button */}
                <motion.button
                    type="submit"
                    disabled={isSigningUp || !isFormValid}
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
                    {isSigningUp ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Creating account...
                        </>
                    ) : (
                        <>
                            Create Account
                            <ArrowRight size={18} />
                        </>
                    )}
                </motion.button>
            </form>

            <div className="mt-6 p-4 rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-white/5 space-y-3">
                <div>
                    <h3 className="text-sm font-semibold text-emerald-950 dark:text-emerald-50">Beta Access</h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                        If sign-up is closed, join the waitlist with your email.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleBetaSignup}
                    disabled={isSubmitting}
                    className={cn(
                        "w-full py-3 rounded-xl font-semibold text-emerald-700",
                        "bg-emerald-50 border border-emerald-200",
                        "transition-all hover:bg-emerald-100",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                >
                    {isSubmitting ? "Submitting..." : "Join Beta Waitlist"}
                </button>
                {(betaError || betaMessage) && (
                    <p className={cn(
                        "text-xs",
                        betaError ? "text-rose-500" : "text-emerald-600"
                    )}>
                        {betaError || betaMessage}
                    </p>
                )}
            </div>

            {/* Login Link */}
            <div className="text-center mt-4 pt-4 border-t border-stone-100 dark:border-white/5">
                <p className="text-stone-500 dark:text-stone-400 text-sm">
                    Already have an account?{" "}
                    <button
                        onClick={handleBack}
                        className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                    >
                        Sign In
                    </button>
                </p>
            </div>
        </motion.div>
    );
};

export default ViewRegister;
