'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { createClientSupabaseClient } from '@/lib/supabase-client';

interface BetaSignupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function BetaSignupModal({ isOpen, onClose }: BetaSignupModalProps) {
    const { language } = useI18n();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const supabase = createClientSupabaseClient();
            const { error: insertError } = await supabase
                .from('beta_signups')
                .insert({
                    email: email.toLowerCase().trim(),
                    source: 'welcome_modal',
                    status: 'pending'
                });

            if (insertError) {
                if (insertError.code === '23505') {
                    // Duplicate email - treat as success
                    setIsSuccess(true);
                } else {
                    throw insertError;
                }
            } else {
                setIsSuccess(true);
            }
        } catch (err: unknown) {
            console.error('Beta signup error:', err);
            setError(language === 'en'
                ? 'Something went wrong. Please try again.'
                : '出错了，请稍后再试。'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setEmail('');
        setIsSuccess(false);
        setError(null);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                >
                    <motion.div
                        className="bg-[#FAF6EF] dark:bg-[#1A1A1A] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-[#1A1A1A]/10 dark:border-white/10"
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header with decorative gradient */}
                        <div className="relative h-24 bg-gradient-to-br from-[#D4AF37]/20 via-[#9CAF88]/10 to-transparent">
                            <div className="absolute top-4 right-4">
                                <button
                                    onClick={handleClose}
                                    className="p-2 rounded-full bg-[#1A1A1A]/5 dark:bg-white/5 hover:bg-[#1A1A1A]/10 dark:hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5 text-[#1A1A1A]/60 dark:text-white/60" />
                                </button>
                            </div>
                            <div className="absolute -bottom-6 left-8">
                                <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#9CAF88] rounded-2xl flex items-center justify-center shadow-lg">
                                    <Sparkles className="w-8 h-8 text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="p-8 pt-10">
                            {!isSuccess ? (
                                <>
                                    <h2 className="text-2xl font-heading font-medium text-[#1A1A1A] dark:text-white mb-2">
                                        {language === 'en' ? 'Finding the 1001st User' : '寻找第 1001 位「抗焦虑者」'}
                                    </h2>
                                    <p className="text-[#1A1A1A]/60 dark:text-white/60 mb-6 leading-relaxed">
                                        {language === 'en'
                                            ? 'We are looking for pioneers willing to redefine their rhythm with data. Enter your email to get the key to calm.'
                                            : '我们不想要海量用户，只寻找愿意用数据重新定义生活节奏的先锋。输入邮箱，获取通往平静的密钥。'
                                        }
                                    </p>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1A1A]/30 dark:text-white/30" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder={language === 'en' ? 'Enter your email' : '输入你的邮箱'}
                                                required
                                                className="w-full pl-12 pr-4 py-4 bg-[#1A1A1A]/5 dark:bg-white/5 border border-[#1A1A1A]/10 dark:border-white/10 rounded-xl text-[#1A1A1A] dark:text-white placeholder:text-[#1A1A1A]/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 transition-all"
                                            />
                                        </div>

                                        {error && (
                                            <p className="text-red-500 text-sm">{error}</p>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isLoading || !email}
                                            className="w-full py-4 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#2A2A2A] dark:hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    {language === 'en' ? 'Submitting...' : '提交中...'}
                                                </>
                                            ) : (
                                                language === 'en' ? 'Request Access' : '申请密钥'
                                            )}
                                        </button>
                                    </form>

                                    <p className="text-xs text-[#1A1A1A]/40 dark:text-white/40 mt-4 text-center">
                                        {language === 'en'
                                            ? '12,450+ people are already in line. Early access ensures early peace.'
                                            : '已有 12,450+ 人正在排队。早一点加入，早一点解脱。'
                                        }
                                    </p>
                                </>
                            ) : (
                                <div className="text-center py-4">
                                    <div className="w-16 h-16 bg-[#9CAF88]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-8 h-8 text-[#9CAF88]" />
                                    </div>
                                    <h2 className="text-2xl font-heading font-medium text-[#1A1A1A] dark:text-white mb-2">
                                        {language === 'en' ? 'You\'re on the list!' : '你已加入名单！'}
                                    </h2>
                                    <p className="text-[#1A1A1A]/60 dark:text-white/60 mb-6">
                                        {language === 'en'
                                            ? 'We\'ll send you an invite code soon. Keep an eye on your inbox!'
                                            : '我们会尽快发送邀请码给你。请留意你的邮箱！'
                                        }
                                    </p>
                                    <button
                                        onClick={handleClose}
                                        className="px-8 py-3 bg-[#1A1A1A]/5 dark:bg-white/5 text-[#1A1A1A] dark:text-white rounded-xl font-medium hover:bg-[#1A1A1A]/10 dark:hover:bg-white/10 transition-colors"
                                    >
                                        {language === 'en' ? 'Got it' : '知道了'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
