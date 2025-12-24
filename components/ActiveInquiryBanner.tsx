'use client';

/**
 * Active Inquiry Banner Component
 * 
 * Displays pending AI inquiry questions when user opens the app.
 * Dismissible with response options.
 * 
 * Requirements: 4.3 - Display active inquiry question if one is pending
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Sparkles, ChevronRight, BookOpen, ExternalLink } from 'lucide-react';
import type { InquiryQuestion, CuratedContent } from '@/types/adaptive-interaction';
import { useI18n } from '@/lib/i18n';

interface ActiveInquiryBannerProps {
  userId: string;
  onDismiss?: () => void;
  onRespond?: (questionId: string, response: string) => void;
}

export default function ActiveInquiryBanner({
  userId,
  onDismiss,
  onRespond
}: ActiveInquiryBannerProps) {
  const { t, language } = useI18n();
  const [inquiries, setInquiries] = useState<InquiryQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [isResponding, setIsResponding] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [responses, setResponses] = useState<Array<{ inquiryId: string; response: string }>>([]);

  const currentInquiry = inquiries[currentIndex] || null;
  const totalQuestions = inquiries.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  // Fetch pending inquiry on mount
  useEffect(() => {
    fetchPendingInquiry();
  }, [userId, language]);

  const fetchPendingInquiry = async () => {
    setIsLoading(true);
    try {
      // Map language to API format (zh-TW → zh, en → en)
      const apiLang = language === 'zh-TW' ? 'zh' : language;

      // Fetch single pending inquiry (API handles deduplication via cooldown)
      const response = await fetch(`/api/inquiry/pending?language=${apiLang}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.hasInquiry && data.inquiry) {
          // Only add if we haven't already displayed this inquiry
          const seenIds = JSON.parse(sessionStorage.getItem('seen_inquiry_ids') || '[]') as string[];
          if (!seenIds.includes(data.inquiry.id)) {
            setInquiries([data.inquiry]);
            setCurrentIndex(0);
            console.log('📋 [Inquiry] Loaded question:', data.inquiry.question_text);
          } else {
            console.log('📋 [Inquiry] Already seen this inquiry, skipping');
          }
        } else {
          console.log('📋 [Inquiry] No pending questions');
        }
      } else {
        console.error('📋 [Inquiry] API error:', response.status);
      }
    } catch (error) {
      console.error('📋 [Inquiry] Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss?.();
    }, 300);
  };

  const handleOptionSelect = (value: string) => {
    setSelectedOption(value);
  };

  const handleSubmitResponse = async () => {
    if (!currentInquiry || !selectedOption) return;

    setIsResponding(true);
    try {
      const response = await fetch('/api/inquiry/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          inquiryId: currentInquiry.id,
          response: selectedOption,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [Inquiry] Response submitted:', data.message);

        // Mark this inquiry as seen to prevent duplicate display
        const seenIds = JSON.parse(sessionStorage.getItem('seen_inquiry_ids') || '[]') as string[];
        if (!seenIds.includes(currentInquiry.id)) {
          seenIds.push(currentInquiry.id);
          sessionStorage.setItem('seen_inquiry_ids', JSON.stringify(seenIds));
        }

        // Store response
        setResponses([...responses, { inquiryId: currentInquiry.id, response: selectedOption }]);

        // Check if there are more questions
        if (!isLastQuestion) {
          // Move to next question
          setSelectedOption(null);
          setCurrentIndex(currentIndex + 1);
          setIsResponding(false);
        } else {
          // All questions answered, show success
          setShowSuccess(true);

          // Dismiss after showing success
          setTimeout(() => {
            responses.forEach(r => onRespond?.(r.inquiryId, r.response));
            onRespond?.(currentInquiry.id, selectedOption);
            handleDismiss();
          }, 2000);
        }
      } else {
        console.error('❌ [Inquiry] Submit failed:', response.status);
        setIsResponding(false);
      }
    } catch (error) {
      console.error('❌ [Inquiry] Submit error:', error);
      setIsResponding(false);
    }
  };

  // Don't render if loading or no inquiry
  if (isLoading || !currentInquiry) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed bottom-24 right-6 z-[99999] max-w-sm"
        >
          {/* Chat bubble container */}
          <div className="relative">
            {/* Main bubble */}
            <div className="rounded-3xl border border-white/20 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-gradient-to-r from-[#9CAF88]/10 to-transparent">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#9CAF88] to-[#7a9268] shadow-lg">
                    <MessageCircle className="w-4.5 h-4.5 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0B3D2E] dark:text-white">{t('inquiry.maxAsks')}</p>
                    <p className="text-[10px] text-[#0B3D2E]/50 dark:text-white/50">
                      {totalQuestions > 1 ? `${currentIndex + 1}/${totalQuestions} ${t('inquiry.activeCare')}` : t('inquiry.activeCare')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-[#0B3D2E]/40 dark:text-white/40" />
                </button>
              </div>

              {/* Question */}
              <div className="px-5 py-4">
                {showSuccess ? (
                  /* Success State */
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#9CAF88] to-[#7a9268] shadow-lg mb-4">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-base font-semibold text-[#0B3D2E] dark:text-white mb-2">
                      {language === 'en' ? 'Thank you!' : '感谢你的回答！'}
                    </p>
                    <p className="text-sm text-[#0B3D2E]/60 dark:text-white/60 text-center">
                      {language === 'en'
                        ? 'This helps me understand you better.'
                        : '这将帮助我更好地了解你的状态。'}
                    </p>
                  </div>
                ) : (
                  /* Question State */
                  <>
                    <div className="flex items-start gap-2.5 mb-4">
                      <Sparkles className="w-4 h-4 text-[#C4A77D] flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-[#0B3D2E] dark:text-white leading-relaxed">
                        {currentInquiry.question_text}
                      </p>
                    </div>

                    {/* Options */}
                    {currentInquiry.options && currentInquiry.options.length > 0 && (
                      <div className="space-y-2">
                        {currentInquiry.options.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleOptionSelect(option.value)}
                            disabled={isResponding}
                            className={`w-full text-left px-4 py-3 rounded-2xl border-2 transition-all ${selectedOption === option.value
                              ? 'border-[#9CAF88] bg-[#9CAF88]/10 shadow-sm'
                              : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-[#9CAF88]/50 hover:bg-[#9CAF88]/5'
                              } ${isResponding ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <span className="text-sm text-[#0B3D2E] dark:text-white font-medium">{option.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Feed Recommendation */}
                    {currentInquiry.feedContent && (
                      <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="w-4 h-4 text-[#9CAF88]" />
                          <span className="text-xs text-[#0B3D2E]/60 dark:text-white/60">{t('inquiry.recommendedForYou')}</span>
                        </div>
                        <a
                          href={currentInquiry.feedContent.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:border-[#9CAF88]/50 hover:bg-[#9CAF88]/5 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#0B3D2E] dark:text-white line-clamp-2">
                                {currentInquiry.feedContent.title}
                              </p>
                              {currentInquiry.feedContent.relevance_explanation && (
                                <p className="text-xs text-[#9CAF88] mt-1">
                                  {currentInquiry.feedContent.relevance_explanation}
                                </p>
                              )}
                            </div>
                            <ExternalLink className="w-4 h-4 text-[#0B3D2E]/40 dark:text-white/40 flex-shrink-0" />
                          </div>
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Actions */}
              {!showSuccess && (
                <div className="flex items-center gap-2 px-5 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50">
                  <button
                    onClick={handleDismiss}
                    disabled={isResponding}
                    className="flex-1 py-2.5 text-sm font-medium text-[#0B3D2E]/60 dark:text-white/60 hover:text-[#0B3D2E] dark:hover:text-white transition-colors disabled:opacity-50"
                  >
                    {t('inquiry.laterButton')}
                  </button>
                  <button
                    onClick={handleSubmitResponse}
                    disabled={!selectedOption || isResponding}
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#9CAF88] to-[#7a9268] text-white text-sm font-medium rounded-xl hover:from-[#8a9f78] hover:to-[#6a8258] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 shadow-lg shadow-[#9CAF88]/20"
                  >
                    {isResponding ? (
                      <span>{t('inquiry.submitting')}</span>
                    ) : (
                      <>
                        <span>{t('inquiry.submitButton')}</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Chat bubble tail pointing down-right */}
            <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl transform rotate-45 border-r border-b border-white/20"></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
