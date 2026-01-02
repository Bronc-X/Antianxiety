'use client';

/**
 * ProactiveInquiryModal
 * 
 * Max AI 主动问询弹窗组件
 * 简洁优雅，不打扰用户
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { InquiryQuestion } from '@/types/adaptive-interaction';

interface ProactiveInquiryModalProps {
    inquiry: InquiryQuestion | null;
    isVisible: boolean;
    onAnswer: (answer: string) => void;
    onDismiss: () => void;
}

export function ProactiveInquiryModal({
    inquiry,
    isVisible,
    onAnswer,
    onDismiss,
}: ProactiveInquiryModalProps) {
    if (!inquiry) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                        onClick={onDismiss}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 z-50"
                    >
                        <div className="bg-gradient-to-br from-emerald-900/95 to-emerald-950/95 rounded-2xl border border-emerald-700/30 shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="px-4 py-3 border-b border-emerald-700/20 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center">
                                    <span className="text-xl">🧠</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-emerald-200 text-sm font-medium">Max 关心你</p>
                                    <p className="text-emerald-400/60 text-xs">主动问询</p>
                                </div>
                                <button
                                    onClick={onDismiss}
                                    className="text-emerald-400/60 hover:text-emerald-300 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Question */}
                            <div className="px-4 py-4">
                                <p className="text-emerald-100 text-lg font-medium leading-relaxed">
                                    {inquiry.question_text}
                                </p>
                            </div>

                            {/* Options */}
                            <div className="px-4 pb-4 space-y-2">
                                {inquiry.options?.map((option, index) => (
                                    <motion.button
                                        key={option.value}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => onAnswer(option.value)}
                                        className="w-full px-4 py-3 bg-emerald-800/30 hover:bg-emerald-700/40 border border-emerald-600/20 hover:border-emerald-500/40 rounded-xl text-left text-emerald-200 transition-all duration-200 group"
                                    >
                                        <span className="group-hover:translate-x-1 inline-block transition-transform">
                                            {option.label}
                                        </span>
                                    </motion.button>
                                ))}
                            </div>

                            {/* Skip button */}
                            <div className="px-4 pb-4">
                                <button
                                    onClick={onDismiss}
                                    className="w-full py-2 text-emerald-400/50 hover:text-emerald-400/80 text-sm transition-colors"
                                >
                                    稍后再说
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default ProactiveInquiryModal;
