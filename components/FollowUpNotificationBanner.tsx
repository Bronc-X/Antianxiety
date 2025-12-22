/**
 * Follow-up Notification Banner Component
 * 问询通知横幅组件
 * 
 * Requirements: 1.1, 1.2
 * - Display pending check-in notification
 * - Allow user to start or snooze session
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Clock, ArrowRight } from 'lucide-react';
import type { FollowUpSession } from '@/types/adaptive-plan';

interface FollowUpNotificationBannerProps {
  session: FollowUpSession | null;
  onStart: () => void;
  onSnooze: (minutes: number) => void;
  onDismiss: () => void;
}

export default function FollowUpNotificationBanner({
  session,
  onStart,
  onSnooze,
  onDismiss,
}: FollowUpNotificationBannerProps) {
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);

  if (!session || session.status !== 'pending') return null;

  const getMessage = () => {
    return session.session_type === 'morning'
      ? '早安！是时候记录一下你今天的感受了'
      : '晚安时间到了，来聊聊今天的情况吧';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 left-4 right-4 z-40 mx-auto max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-lg border border-[#E8DFD0] overflow-hidden">
          {/* Main Banner */}
          <div className="p-4 flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-[#9CAF88] rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-[#2C2C2C] font-medium">{getMessage()}</p>
              <p className="text-sm text-[#666] mt-1">
                {session.session_type === 'morning' ? '晨间问询' : '晚间问询'}
              </p>
            </div>
            
            <button
              onClick={onDismiss}
              className="flex-shrink-0 p-1 rounded-full hover:bg-[#E8DFD0] transition-colors"
            >
              <X className="w-4 h-4 text-[#666]" />
            </button>
          </div>

          {/* Actions */}
          <div className="px-4 pb-4 flex gap-2">
            <button
              onClick={onStart}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-[#9CAF88] text-white rounded-xl hover:bg-[#8A9D76] transition-colors"
            >
              开始
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowSnoozeOptions(!showSnoozeOptions)}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-[#E8DFD0] text-[#2C2C2C] rounded-xl hover:bg-[#D8CFC0] transition-colors"
            >
              <Clock className="w-4 h-4" />
              稍后
            </button>
          </div>

          {/* Snooze Options */}
          <AnimatePresence>
            {showSnoozeOptions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-[#E8DFD0] overflow-hidden"
              >
                <div className="p-4 flex gap-2">
                  {[15, 30, 60].map(minutes => (
                    <button
                      key={minutes}
                      onClick={() => {
                        onSnooze(minutes);
                        setShowSnoozeOptions(false);
                      }}
                      className="flex-1 py-2 px-3 text-sm bg-[#FAFAFA] text-[#2C2C2C] rounded-lg hover:bg-[#E8DFD0] transition-colors"
                    >
                      {minutes}分钟后
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
