/**
 * Action Item Detail Component
 * 行动项详情组件
 * 
 * Requirements: 4.3, 4.5
 * - Display full scientific explanation (4 domains)
 * - Show step-by-step instructions
 * - Display execution history for the item
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Brain,
  Heart,
  Zap,
  Users
} from 'lucide-react';
import type { ActionItem, ExecutionRecord, ScientificExplanation } from '@/types/adaptive-plan';

interface ActionItemDetailProps {
  item: ActionItem;
  executionHistory?: ExecutionRecord[];
  onRequestReplacement?: () => void;
  className?: string;
}

const DOMAIN_ICONS: Record<keyof Omit<ScientificExplanation, 'summary' | 'references'>, React.ReactNode> = {
  physiology: <Heart className="w-4 h-4" />,
  neurology: <Brain className="w-4 h-4" />,
  psychology: <Zap className="w-4 h-4" />,
  behavioral_science: <Users className="w-4 h-4" />,
};

const DOMAIN_LABELS: Record<keyof Omit<ScientificExplanation, 'summary' | 'references'>, string> = {
  physiology: '生理学',
  neurology: '神经学',
  psychology: '心理学',
  behavioral_science: '行为学',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  completed: <CheckCircle className="w-4 h-4 text-[#9CAF88]" />,
  partial: <AlertCircle className="w-4 h-4 text-[#C4A77D]" />,
  skipped: <XCircle className="w-4 h-4 text-[#E8DFD0]" />,
  replaced: <AlertCircle className="w-4 h-4 text-[#C4A77D]" />,
};

export default function ActionItemDetail({
  item,
  executionHistory = [],
  onRequestReplacement,
  className = '',
}: ActionItemDetailProps) {
  const [showScience, setShowScience] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className={`bg-white rounded-2xl border border-[#E8DFD0] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-[#E8DFD0]">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-[#2C2C2C] text-lg">{item.title}</h3>
            <p className="text-sm text-[#666] mt-1">{item.description}</p>
          </div>
          {item.is_established && (
            <span className="px-2 py-1 bg-[#9CAF88]/10 text-[#9CAF88] text-xs rounded-full">
              已养成习惯
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4 mt-3 text-sm text-[#666]">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {item.timing}
          </span>
          <span>{item.duration}</span>
        </div>
      </div>

      {/* Steps */}
      <div className="p-4 border-b border-[#E8DFD0]">
        <h4 className="font-medium text-[#2C2C2C] mb-3">执行步骤</h4>
        <ol className="space-y-2">
          {item.steps.map((step, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#E8DFD0] rounded-full flex items-center justify-center text-sm text-[#2C2C2C]">
                {index + 1}
              </span>
              <span className="text-[#2C2C2C] pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Expected Outcome */}
      <div className="p-4 border-b border-[#E8DFD0]">
        <h4 className="font-medium text-[#2C2C2C] mb-2">预期效果</h4>
        <p className="text-[#666]">{item.expected_outcome}</p>
      </div>

      {/* Scientific Explanation */}
      <div className="border-b border-[#E8DFD0]">
        <button
          onClick={() => setShowScience(!showScience)}
          className="w-full p-4 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors"
        >
          <span className="font-medium text-[#2C2C2C]">科学解释</span>
          {showScience ? (
            <ChevronUp className="w-5 h-5 text-[#666]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#666]" />
          )}
        </button>
        
        <AnimatePresence>
          {showScience && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-4">
                {/* Summary */}
                {item.scientific_rationale.summary && (
                  <p className="text-[#666] italic">{item.scientific_rationale.summary}</p>
                )}
                
                {/* 4 Domains */}
                {(['physiology', 'neurology', 'psychology', 'behavioral_science'] as const).map(domain => (
                  <div key={domain} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#E8DFD0] rounded-lg flex items-center justify-center text-[#666]">
                      {DOMAIN_ICONS[domain]}
                    </div>
                    <div>
                      <h5 className="font-medium text-[#2C2C2C] text-sm">{DOMAIN_LABELS[domain]}</h5>
                      <p className="text-sm text-[#666] mt-1">
                        {item.scientific_rationale[domain] || '暂无解释'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Execution History */}
      {executionHistory.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full p-4 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors"
          >
            <span className="font-medium text-[#2C2C2C]">执行记录</span>
            {showHistory ? (
              <ChevronUp className="w-5 h-5 text-[#666]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#666]" />
            )}
          </button>
          
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-2">
                  {executionHistory.slice(0, 7).map((record, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-[#E8DFD0] last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        {STATUS_ICONS[record.status]}
                        <span className="text-sm text-[#2C2C2C]">
                          {new Date(record.date).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      <span className="text-sm text-[#666] capitalize">{record.status}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Actions */}
      {onRequestReplacement && (
        <div className="p-4 bg-[#FAFAFA]">
          <button
            onClick={onRequestReplacement}
            className="w-full py-2.5 px-4 border border-[#C4A77D] text-[#C4A77D] rounded-xl hover:bg-[#C4A77D] hover:text-white transition-colors"
          >
            请求平替方案
          </button>
        </div>
      )}
    </div>
  );
}
