'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmergencyStep } from '@/types/assessment';
import { Phone, AlertTriangle, X } from 'lucide-react';
import { tr, type Language } from '@/lib/i18n';

interface EmergencyAlertProps {
  emergency: EmergencyStep['emergency'];
  onDismiss: () => void;
  language: Language;
}

export function EmergencyAlert({ emergency, onDismiss, language }: EmergencyAlertProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCall = () => {
    window.location.href = `tel:${emergency.emergency_number}`;
  };

  const handleDismiss = () => {
    setShowConfirm(true);
  };

  const confirmDismiss = () => {
    onDismiss();
  };

  return (
    <motion.div
      className="fixed inset-0 bg-red-600 z-50 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* 关闭按钮 */}
      <div className="absolute top-4 right-4">
        <button
          onClick={handleDismiss}
          className="p-2 text-white/70 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-white">
        {/* 警告图标 */}
        <motion.div
          className="mb-6"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <AlertTriangle className="w-20 h-20" />
        </motion.div>

        {/* 标题 */}
        <h1 className="text-3xl font-bold mb-4 text-center">
          {emergency.title}
        </h1>

        {/* 消息 */}
        <p className="text-lg text-center text-white/90 mb-8 max-w-md">
          {emergency.message}
        </p>

        {/* 拨打电话按钮 */}
        <motion.button
          onClick={handleCall}
          className="flex items-center gap-3 px-8 py-5 bg-white text-red-600 rounded-full font-bold text-xl shadow-2xl"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Phone className="w-7 h-7" />
          <span>
            {tr(language, { zh: '拨打', en: 'Call' })} {emergency.emergency_number}
          </span>
        </motion.button>

        <p className="mt-3 text-white/70 text-sm">
          {emergency.emergency_name}
        </p>

        {/* 指示列表 */}
        <div className="mt-10 w-full max-w-md">
          <h3 className="text-sm font-medium text-white/70 mb-3">
            {tr(language, { zh: '在等待帮助时：', en: 'While waiting for help:' })}
          </h3>
          <ul className="space-y-2">
            {emergency.instructions.map((instruction, index) => (
              <motion.li
                key={index}
                className="flex items-start gap-3 text-white/90"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                  {index + 1}
                </span>
                <span>{instruction}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      {/* 确认关闭对话框 */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="absolute inset-0 bg-black/50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-xl font-bold text-[#2C2C2C] mb-3">
                {tr(language, { zh: '确定要关闭吗？', en: 'Are you sure?' })}
              </h3>
              <p className="text-[#2C2C2C]/70 mb-6">
                {tr(language, {
                  zh: '您的症状可能需要紧急医疗关注。关闭此警告可能会延误重要的医疗救治。',
                  en: 'Your symptoms may require urgent medical attention. Dismissing this alert may delay important medical care.',
                })}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 bg-red-600 text-white rounded-full font-medium"
                >
                  {tr(language, { zh: '返回', en: 'Go back' })}
                </button>
                <button
                  onClick={confirmDismiss}
                  className="flex-1 py-3 bg-gray-200 text-[#2C2C2C] rounded-full font-medium"
                >
                  {tr(language, { zh: '我理解风险', en: 'I understand' })}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
