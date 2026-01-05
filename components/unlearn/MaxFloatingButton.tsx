'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/domain/useAuth';
import MaxAvatar from '@/components/max/MaxAvatar';

interface MaxFloatingButtonProps {
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export default function MaxFloatingButton({ isOpen: controlledOpen, onOpenChange }: MaxFloatingButtonProps) {
    const { language } = useI18n();
    const router = useRouter();
    const isControlled = typeof controlledOpen === 'boolean';
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = isControlled ? controlledOpen : internalOpen;
    const [showTooltip, setShowTooltip] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    // Use encapsulated hook (Bridge)
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    // Show tooltip after 3 seconds if user hasn't interacted
    useEffect(() => {
        if (!hasInteracted && !isOpen) {
            const timer = setTimeout(() => {
                setShowTooltip(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [hasInteracted, isOpen]);

    useEffect(() => {
        if (!showTooltip) {
            return;
        }

        const timer = setTimeout(() => {
            setShowTooltip(false);
        }, 5000);

        return () => clearTimeout(timer);
    }, [showTooltip]);

    useEffect(() => {
        if (isOpen) {
            setHasInteracted(true);
            setShowTooltip(false);
        }
    }, [isOpen]);

    const setOpen = (next: boolean) => {
        if (!isControlled) {
            setInternalOpen(next);
        }
        onOpenChange?.(next);
    };

    const handleClick = () => {
        // If not logged in, redirect to login
        if (!authLoading && !isAuthenticated) {
            router.push('/unlearn/login');
            return;
        }

        setOpen(false);
        setHasInteracted(true);
        setShowTooltip(false);
        router.push('/unlearn/max');
    };

    return (
        <>
            {/* Floating Button */}
            <div className="fixed bottom-24 right-6 z-[10000]">
                <AnimatePresence>
                    {showTooltip && !isOpen && (
                        <motion.div
                            initial={{ opacity: 0, x: 20, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.9 }}
                            className="absolute bottom-full right-0 mb-3 whitespace-nowrap"
                        >
                            <div className="relative px-4 py-3 bg-white text-[#1A1A1A] shadow-lg font-serif text-sm">
                                {/* Close button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowTooltip(false);
                                        setHasInteracted(true);
                                    }}
                                    className="absolute top-1 right-1 p-1 text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors"
                                    aria-label="Close tooltip"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                                <p className="font-medium pr-4">
                                    {language === 'en' ? 'Need help? Talk to Max!' : '需要帮助？和 Max 聊聊！'}
                                </p>
                                <p className="text-[#1A1A1A]/80 text-xs mt-1">
                                    {language === 'en' ? 'Your personal health agent is here' : '你的个人健康智能体在这里'}
                                </p>
                                {/* Arrow */}
                                <div className="absolute bottom-0 right-8 translate-y-full">
                                    <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white" />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    onClick={handleClick}
                    className="relative flex items-center gap-2 px-4 h-14 shadow-lg transition-colors rounded-full"
                    style={{
                        backgroundColor: isOpen ? '#0B3D2E' : '#D4AF37',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.div
                                key="close"
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 90, opacity: 0 }}
                            >
                                <X className="w-6 h-6 text-[#D4AF37]" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="open"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="flex items-center gap-2"
                            >
                                <MaxAvatar size={32} state="thinking" />
                                <span className="text-[#0B3D2E] font-bold text-base">Max</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>

        </>
    );
}
