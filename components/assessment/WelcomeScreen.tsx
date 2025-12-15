'use client';

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { tr, type Language } from '@/lib/i18n';

interface WelcomeScreenProps {
  onStart: () => void;
  language: Language;
}

export function WelcomeScreen({ onStart, language }: WelcomeScreenProps) {
  return (
    <motion.div 
      className="flex flex-col items-center justify-center min-h-screen p-6 bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo */}
      <motion.div
        className="mb-8"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-soft">
          <Heart className="w-10 h-10 text-primary-foreground" />
        </div>
      </motion.div>

      {/* 标题 */}
      <motion.h1 
        className="text-3xl font-bold text-foreground mb-4 text-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {tr(language, { zh: '症状评估', en: 'Symptom Assessment' })}
      </motion.h1>

      {/* 描述 */}
      <motion.p 
        className="text-muted-foreground text-center max-w-sm mb-12 leading-relaxed"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        {tr(language, {
          zh: '让我们花几分钟时间了解您的症状。然后，我会帮助您决定下一步该怎么做。',
          en: "Let's take a few minutes to answer questions about your symptoms. Then I'll help you decide what to do next.",
        })}
      </motion.p>

      {/* 开始按钮 */}
      <motion.button
        onClick={onStart}
        className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium text-lg shadow-soft hover:opacity-90 transition-all hover:shadow-soft-lg active:scale-95"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {tr(language, { zh: '开始评估', en: 'Continue' })}
      </motion.button>

      {/* 免责声明 */}
      <motion.p 
        className="text-xs text-muted-foreground text-center max-w-xs mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        {tr(language, {
          zh: '此评估仅供参考，不能替代专业医疗诊断。',
          en: 'This assessment is for reference only and cannot replace professional medical diagnosis.',
        })}
      </motion.p>
    </motion.div>
  );
}
