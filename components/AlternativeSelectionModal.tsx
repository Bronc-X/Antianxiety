/**
 * Alternative Selection Modal Component
 * 平替选择模态框组件
 * 
 * Requirements: 3.2, 3.4
 * - Display 3+ alternatives with similarity scores
 * - Show scientific rationale for each alternative
 * - Explain why each alternative may fit better
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Star, Clock, ArrowRight } from 'lucide-react';
import type { AlternativeAction } from '@/types/adaptive-plan';

interface AlternativeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  alternatives: AlternativeAction[];
  originalTitle: string;
  onSelect: (alternative: AlternativeAction) => void;
  loading?: boolean;
}

export default function AlternativeSelectionModal({
  isOpen,
  onClose,
  alternatives,
  originalTitle,
  onSelect,
  loading = false,
}: AlternativeSelectionModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const selected = alternatives.find(alt => alt.id === selectedId);
    if (selected) {
      onSelect(selected);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-2xl mx-4 bg-[#FAFAFA] rounded-2xl shadow-xl overflow-hidden max-h-[80vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#E8DFD0]">
            <div>
              <h2 className="text-lg font-medium text-[#2C2C2C]">选择平替方案</h2>
              <p className="text-sm text-[#666] mt-1">
                为「{originalTitle}」选择更适合你的替代方案
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#E8DFD0] transition-colors"
            >
              <X className="w-5 h-5 text-[#2C2C2C]" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-[#9CAF88] border-t-transparent rounded-full" />
              </div>
            ) : alternatives.length === 0 ? (
              <div className="text-center py-12 text-[#666]">
                暂无可用的替代方案
              </div>
            ) : (
              alternatives.map(alt => (
                <motion.div
                  key={alt.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedId(alt.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    selectedId === alt.id
                      ? 'border-[#9CAF88] bg-[#9CAF88]/5'
                      : 'border-[#E8DFD0] bg-white hover:border-[#C4A77D]'
                  }`}
                >
                  {/* Title and Scores */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-[#2C2C2C]">{alt.title}</h3>
                      <p className="text-sm text-[#666] mt-1">{alt.description}</p>
                    </div>
                    {selectedId === alt.id && (
                      <div className="flex-shrink-0 w-6 h-6 bg-[#9CAF88] rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Scores */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-[#C4A77D]" />
                      <span className="text-sm text-[#666]">
                        相似度 {Math.round(alt.similarity_score * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-[#9CAF88]" />
                      <span className="text-sm text-[#666]">
                        适配度 {Math.round(alt.user_fit_score * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Timing and Duration */}
                  <div className="flex items-center gap-4 mb-3 text-sm text-[#666]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {alt.timing}
                    </span>
                    <span>{alt.duration}</span>
                  </div>

                  {/* Why Better Fit */}
                  {alt.why_better_fit && (
                    <div className="p-3 bg-[#E8DFD0]/50 rounded-lg">
                      <p className="text-sm text-[#2C2C2C]">
                        <span className="font-medium">为什么更适合你：</span>
                        {alt.why_better_fit}
                      </p>
                    </div>
                  )}

                  {/* Scientific Rationale Preview */}
                  {alt.scientific_rationale.summary && (
                    <p className="text-sm text-[#666] mt-3 italic">
                      {alt.scientific_rationale.summary}
                    </p>
                  )}
                </motion.div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#E8DFD0] flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-[#E8DFD0] text-[#2C2C2C] rounded-xl hover:bg-[#E8DFD0] transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedId || loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-[#9CAF88] text-white rounded-xl hover:bg-[#8A9D76] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认选择
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
