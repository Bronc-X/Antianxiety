/**
 * Follow-up Session Modal Component
 * 问询会话模态框组件
 * 
 * Requirements: 1.3, 2.2, 3.1
 * - Integrate with existing AIAssistantChat for conversation
 * - Display action items with checkboxes for replacement marking
 * - Show execution status options
 * - Use California Calm design (Sand/Clay/Sage colors)
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, RotateCcw, Clock, AlertCircle } from 'lucide-react';
import type { FollowUpSession, ActionItem, ExecutionStatus } from '@/types/adaptive-plan';

interface FollowUpSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: FollowUpSession | null;
  actionItems: ActionItem[];
  onRecordExecution: (itemId: string, status: ExecutionStatus, needsReplacement: boolean) => void;
  onComplete: () => void;
}

const STATUS_OPTIONS: { value: ExecutionStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'completed', label: '完成', icon: <Check className="w-4 h-4" />, color: 'text-sage-600' },
  { value: 'partial', label: '部分完成', icon: <Clock className="w-4 h-4" />, color: 'text-clay-600' },
  { value: 'skipped', label: '跳过', icon: <AlertCircle className="w-4 h-4" />, color: 'text-sand-600' },
  { value: 'replaced', label: '需要替换', icon: <RotateCcw className="w-4 h-4" />, color: 'text-clay-700' },
];

export default function FollowUpSessionModal({
  isOpen,
  onClose,
  session,
  actionItems,
  onRecordExecution,
  onComplete,
}: FollowUpSessionModalProps) {
  const [itemStatuses, setItemStatuses] = useState<Record<string, { status: ExecutionStatus; needsReplacement: boolean }>>({});
  const [currentStep, setCurrentStep] = useState<'greeting' | 'tracking' | 'summary'>('greeting');

  useEffect(() => {
    if (isOpen && session) {
      // Initialize statuses
      const initialStatuses: Record<string, { status: ExecutionStatus; needsReplacement: boolean }> = {};
      actionItems.forEach(item => {
        initialStatuses[item.id] = { status: 'completed', needsReplacement: false };
      });
      setItemStatuses(initialStatuses);
      setCurrentStep('greeting');
    }
  }, [isOpen, session, actionItems]);

  const handleStatusChange = (itemId: string, status: ExecutionStatus) => {
    setItemStatuses(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        status,
        needsReplacement: status === 'replaced',
      },
    }));
  };

  const handleReplacementToggle = (itemId: string) => {
    setItemStatuses(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        needsReplacement: !prev[itemId]?.needsReplacement,
      },
    }));
  };

  const handleSubmit = () => {
    // Record all executions
    Object.entries(itemStatuses).forEach(([itemId, { status, needsReplacement }]) => {
      onRecordExecution(itemId, status, needsReplacement);
    });
    setCurrentStep('summary');
  };

  const getGreeting = () => {
    if (!session) return '';
    return session.session_type === 'morning'
      ? '早上好！让我们聊聊你今天的感受。'
      : '晚上好！今天过得怎么样？';
  };

  if (!isOpen || !session) return null;

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
          className="relative w-full max-w-lg mx-4 bg-[#FAFAFA] rounded-2xl shadow-xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#E8DFD0]">
            <h2 className="text-lg font-medium text-[#2C2C2C]">
              {session.session_type === 'morning' ? '晨间问询' : '晚间问询'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#E8DFD0] transition-colors"
            >
              <X className="w-5 h-5 text-[#2C2C2C]" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {currentStep === 'greeting' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <p className="text-[#2C2C2C] text-lg">{getGreeting()}</p>
                <button
                  onClick={() => setCurrentStep('tracking')}
                  className="w-full py-3 px-4 bg-[#9CAF88] text-white rounded-xl hover:bg-[#8A9D76] transition-colors"
                >
                  开始记录今日执行情况
                </button>
              </motion.div>
            )}

            {currentStep === 'tracking' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <p className="text-[#2C2C2C] mb-4">请记录每个行动项的执行情况：</p>
                
                {actionItems.map(item => (
                  <div
                    key={item.id}
                    className="p-4 bg-white rounded-xl border border-[#E8DFD0] space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-[#2C2C2C]">{item.title}</h3>
                        <p className="text-sm text-[#666] mt-1">{item.timing} · {item.duration}</p>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-[#C4A77D]">
                        <input
                          type="checkbox"
                          checked={itemStatuses[item.id]?.needsReplacement || false}
                          onChange={() => handleReplacementToggle(item.id)}
                          className="w-4 h-4 rounded border-[#C4A77D] text-[#C4A77D] focus:ring-[#C4A77D]"
                        />
                        需要平替
                      </label>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          onClick={() => handleStatusChange(item.id, option.value)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            itemStatuses[item.id]?.status === option.value
                              ? 'bg-[#9CAF88] text-white'
                              : 'bg-[#E8DFD0] text-[#2C2C2C] hover:bg-[#D8CFC0]'
                          }`}
                        >
                          {option.icon}
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleSubmit}
                  className="w-full py-3 px-4 bg-[#9CAF88] text-white rounded-xl hover:bg-[#8A9D76] transition-colors mt-4"
                >
                  提交记录
                </button>
              </motion.div>
            )}

            {currentStep === 'summary' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4"
              >
                <div className="w-16 h-16 mx-auto bg-[#9CAF88] rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-medium text-[#2C2C2C]">记录完成！</h3>
                <p className="text-[#666]">感谢你的反馈，我们会根据你的情况优化计划。</p>
                <button
                  onClick={() => {
                    onComplete();
                    onClose();
                  }}
                  className="w-full py-3 px-4 bg-[#C4A77D] text-white rounded-xl hover:bg-[#B4976D] transition-colors"
                >
                  完成
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
