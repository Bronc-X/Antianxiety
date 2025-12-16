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
  const [inquiry, setInquiry] = useState<InquiryQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [isResponding, setIsResponding] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Fetch pending inquiry on mount
  useEffect(() => {
    fetchPendingInquiry();
  }, [userId]);

  const fetchPendingInquiry = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/inquiry/pending?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.hasInquiry && data.inquiry) {
          setInquiry(data.inquiry);
        }
      }
    } catch (error) {
      console.error('Error fetching pending inquiry:', error);
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
    if (!inquiry || !selectedOption) return;
    
    setIsResponding(true);
    try {
      const response = await fetch('/api/inquiry/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryId: inquiry.id,
          response: selectedOption,
        }),
      });
      
      if (response.ok) {
        onRespond?.(inquiry.id, selectedOption);
        handleDismiss();
      }
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setIsResponding(false);
    }
  };

  // Don't render if loading or no inquiry
  if (isLoading || !inquiry) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-lg"
        >
          <div className="rounded-2xl border border-[#E7E1D6] bg-gradient-to-br from-[#FFFDF8] via-[#FAF6EF] to-[#F5F0E8] shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E7E1D6]/50">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#9CAF88]/20 ring-1 ring-[#9CAF88]/40">
                  <MessageCircle className="w-4 h-4 text-[#9CAF88]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0B3D2E]">AI 主动问询</p>
                  <p className="text-[10px] text-[#0B3D2E]/50">帮助我更好地了解你</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1.5 hover:bg-[#E7E1D6]/50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-[#0B3D2E]/40" />
              </button>
            </div>

            {/* Question */}
            <div className="px-4 py-4">
              <div className="flex items-start gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[#C4A77D] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#0B3D2E] leading-relaxed">
                  {inquiry.question_text}
                </p>
              </div>

              {/* Options */}
              {inquiry.options && inquiry.options.length > 0 && (
                <div className="space-y-2">
                  {inquiry.options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleOptionSelect(option.value)}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                        selectedOption === option.value
                          ? 'border-[#0B3D2E] bg-[#0B3D2E]/5'
                          : 'border-[#E7E1D6] bg-white hover:border-[#C4A77D]/50'
                      }`}
                    >
                      <span className="text-sm text-[#0B3D2E]">{option.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Feed Recommendation (Requirement 5.1) */}
              {inquiry.feedContent && (
                <div className="mt-4 pt-4 border-t border-[#E7E1D6]/50">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-[#9CAF88]" />
                    <span className="text-xs text-[#0B3D2E]/60">为你推荐</span>
                  </div>
                  <a
                    href={inquiry.feedContent.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 rounded-xl border border-[#E7E1D6] bg-white hover:border-[#9CAF88]/50 hover:bg-[#F2F7F5] transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0B3D2E] line-clamp-2">
                          {inquiry.feedContent.title}
                        </p>
                        {inquiry.feedContent.relevance_explanation && (
                          <p className="text-xs text-[#9CAF88] mt-1">
                            {inquiry.feedContent.relevance_explanation}
                          </p>
                        )}
                      </div>
                      <ExternalLink className="w-4 h-4 text-[#0B3D2E]/40 flex-shrink-0" />
                    </div>
                  </a>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-[#E7E1D6]/50 bg-white/50">
              <button
                onClick={handleDismiss}
                className="flex-1 py-2.5 text-sm font-medium text-[#0B3D2E]/60 hover:text-[#0B3D2E] transition-colors"
              >
                稍后再说
              </button>
              <button
                onClick={handleSubmitResponse}
                disabled={!selectedOption || isResponding}
                className="flex-1 py-2.5 bg-[#0B3D2E] text-white text-sm font-medium rounded-xl hover:bg-[#0a3629] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                {isResponding ? (
                  <span>提交中...</span>
                ) : (
                  <>
                    <span>提交</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
