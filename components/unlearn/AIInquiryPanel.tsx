'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Sparkles, ChevronRight, X, Brain, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useInquiry } from '@/hooks/domain/useInquiry';

interface InquiryOption {
    label: string;
    value: string;
}

interface InquiryData {
    id: string;
    question_text: string;
    question_type: string;
    priority: string;
    data_gaps_addressed: string[];
    options: InquiryOption[];
}

interface AIInquiryPanelProps {
    onInquiryComplete?: (response: string) => void;
}

export default function AIInquiryPanel({ onInquiryComplete }: AIInquiryPanelProps) {
    const { language } = useI18n();
    const { loadPending, respond } = useInquiry();
    const [inquiry, setInquiry] = useState<InquiryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [responding, setResponding] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null); // New state
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        fetchPendingInquiry();
    }, [language]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchPendingInquiry();
        }, 60000);

        const handleFocus = () => fetchPendingInquiry();
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, [language]);

    const fetchPendingInquiry = async () => {
        try {
            setLoading(true);
            const data = await loadPending(language === 'zh-TW' ? 'zh' : language);

            if (data?.hasInquiry && data.inquiry) {
                setInquiry(data.inquiry);
                setDismissed(false);
            } else {
                setInquiry(null);
            }
        } catch (error) {
            console.error('Failed to fetch inquiry:', error);
            setInquiry(null);
        } finally {
            setLoading(false);
        }
    };

    const handleResponse = async (response: string) => {
        if (!inquiry) return;

        setSelectedOption(response); // Track clicked option
        setResponding(true);
        try {
            const ok = await respond(inquiry.id, response);
            if (ok) {
                setInquiry(null);
                onInquiryComplete?.(response);
            }
        } catch (error) {
            console.error('Failed to submit response:', error);
        } finally {
            setResponding(false);
            setSelectedOption(null);
        }
    };

    if (loading) {
        return (
            <section className="py-16 px-6" style={{ backgroundColor: '#0B3D2E' }}>
                <div className="max-w-[800px] mx-auto">
                    <div className="animate-pulse flex items-center gap-4 p-6 bg-white/5 border border-white/10">
                        <div className="w-12 h-12 bg-white/10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-white/10 rounded w-3/4" />
                            <div className="h-3 bg-white/10 rounded w-1/2" />
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (!inquiry || dismissed) {
        return null;
    }

    return (
        <section className="py-16 px-6" style={{ backgroundColor: '#0B3D2E' }}>
            <div className="max-w-[800px] mx-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={inquiry.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="relative p-8 bg-white/5 backdrop-blur-sm border border-white/10"
                    >
                        {/* Dismiss button */}
                        <button
                            onClick={() => setDismissed(true)}
                            className="absolute top-4 right-4 p-2 text-white/40 hover:text-white/60 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-[#D4AF37] flex items-center justify-center">
                                <Brain className="w-6 h-6 text-[#0B3D2E]" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold text-lg">
                                    {language === 'en' ? 'Max wants to understand you better' : 'Max 想更了解你'}
                                </h3>
                                <p className="text-white/50 text-sm">
                                    {language === 'en' ? 'AI Proactive Inquiry' : 'AI 主动问询'}
                                </p>
                            </div>
                        </div>

                        {/* Question */}
                        <p className="text-white text-xl leading-relaxed mb-8">
                            {inquiry.question_text}
                        </p>

                        {/* Options */}
                        <div className="grid gap-3">
                            {inquiry.options.map((option) => (
                                <motion.button
                                    key={option.value}
                                    onClick={() => handleResponse(option.value)}
                                    disabled={responding}
                                    className="flex items-center justify-between p-4 bg-white/10 border border-white/20 text-white font-medium hover:bg-[#D4AF37]/20 hover:border-[#D4AF37]/50 transition-all group disabled:opacity-50 disabled:cursor-wait"
                                    whileHover={{ x: responding ? 0 : 5 }}
                                    whileTap={{ scale: responding ? 1 : 0.98 }}
                                >
                                    <span className="text-white">
                                        {responding && selectedOption === option.value ? '提交中...' : option.label}
                                    </span>
                                    {responding && selectedOption === option.value ? (
                                        <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-[#D4AF37]" />
                                    )}
                                </motion.button>
                            ))}
                        </div>

                        {/* Priority indicator */}
                        {inquiry.priority === 'high' && (
                            <div className="mt-6 flex items-center gap-2 text-[#D4AF37] text-sm">
                                <Sparkles className="w-4 h-4" />
                                <span>{language === 'en' ? 'Helps calibrate your digital twin' : '帮助校准你的数字孪生'}</span>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </section>
    );
}
