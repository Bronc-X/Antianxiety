'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuestionStep } from '@/types/assessment';
import { Check } from 'lucide-react';

interface QuestionRendererProps {
  step: QuestionStep;
  onAnswer: (questionId: string, value: string | string[] | number | boolean) => void;
  language: 'zh' | 'en';
}

export function QuestionRenderer({ step, onAnswer, language }: QuestionRendererProps) {
  const { question } = step;
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [textValue, setTextValue] = useState('');
  const [scaleValue, setScaleValue] = useState(5);

  const handleSingleChoice = (value: string) => {
    onAnswer(question.id, value);
  };

  const handleMultipleChoice = (value: string) => {
    setSelectedValues(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  const handleSubmitMultiple = () => {
    if (selectedValues.length > 0) {
      onAnswer(question.id, selectedValues);
    }
  };

  const handleBoolean = (value: boolean) => {
    onAnswer(question.id, value);
  };

  const handleScale = () => {
    onAnswer(question.id, scaleValue);
  };

  const handleText = () => {
    if (textValue.trim()) {
      onAnswer(question.id, textValue.trim());
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 进度条 */}
      <div className="sticky top-0 bg-background pt-4 px-4 pb-2 z-10">
        <div className="h-2 bg-border rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary" 
            initial={{ width: 0 }}
            animate={{ width: `${question.progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-right">{question.progress}%</p>
      </div>

      {/* 问题内容 */}
      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* 问题文本 */}
            <h2 className="text-2xl font-bold text-foreground mb-3">
              {question.text}
            </h2>
            
            {question.description && (
              <p className="text-muted-foreground mb-8">
                {question.description}
              </p>
            )}

            {/* 单选题 */}
            {question.type === 'single_choice' && question.options && (
              <div className="space-y-3">
                {question.options.map((option, index) => (
                  <motion.button
                    key={option.value}
                    onClick={() => handleSingleChoice(option.value)}
                    className="w-full p-4 bg-card border-2 border-border rounded-xl text-left hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {option.icon && (
                      <span className="text-2xl">{option.icon}</span>
                    )}
                    <div className="flex-1">
                      <span className="font-medium text-card-foreground">{option.label}</span>
                      {option.description && (
                        <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {/* 多选题 */}
            {question.type === 'multiple_choice' && question.options && (
              <div className="space-y-3">
                {question.options.map((option, index) => (
                  <motion.button
                    key={option.value}
                    onClick={() => handleMultipleChoice(option.value)}
                    className={`w-full p-4 border-2 rounded-xl text-left transition-all flex items-center gap-4 ${
                      selectedValues.includes(option.value)
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card border-border hover:border-primary/50'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                      selectedValues.includes(option.value)
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground'
                    }`}>
                      {selectedValues.includes(option.value) && (
                        <Check className="w-4 h-4 text-primary-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-card-foreground">{option.label}</span>
                      {option.description && (
                        <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                      )}
                    </div>
                  </motion.button>
                ))}
                
                {selectedValues.length > 0 && (
                  <motion.button
                    onClick={handleSubmitMultiple}
                    className="w-full mt-6 py-4 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {language === 'zh' ? '继续' : 'Continue'}
                  </motion.button>
                )}
              </div>
            )}

            {/* 布尔题 */}
            {question.type === 'boolean' && (
              <div className="flex gap-4">
                <motion.button
                  onClick={() => handleBoolean(true)}
                  className="flex-1 py-6 bg-card border-2 border-border rounded-xl font-medium text-card-foreground hover:border-primary hover:bg-primary/5 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {language === 'zh' ? '是' : 'Yes'}
                </motion.button>
                <motion.button
                  onClick={() => handleBoolean(false)}
                  className="flex-1 py-6 bg-card border-2 border-border rounded-xl font-medium text-card-foreground hover:border-primary hover:bg-primary/5 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {language === 'zh' ? '否' : 'No'}
                </motion.button>
              </div>
            )}

            {/* 滑块题 */}
            {question.type === 'scale' && (
              <div className="space-y-6">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{language === 'zh' ? '轻微' : 'Mild'}</span>
                  <span>{language === 'zh' ? '严重' : 'Severe'}</span>
                </div>
                <input
                  type="range"
                  min={question.min || 1}
                  max={question.max || 10}
                  value={scaleValue}
                  onChange={(e) => setScaleValue(Number(e.target.value))}
                  className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="text-center">
                  <span className="text-4xl font-bold text-primary">{scaleValue}</span>
                  <span className="text-muted-foreground ml-1">/ {question.max || 10}</span>
                </div>
                <motion.button
                  onClick={handleScale}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-colors"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {language === 'zh' ? '继续' : 'Continue'}
                </motion.button>
              </div>
            )}

            {/* 文本输入 / 症状搜索 */}
            {(question.type === 'text' || question.type === 'symptom_search') && (
              <div className="space-y-4">
                <input
                  type="text"
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  placeholder={language === 'zh' ? '请输入...' : 'Type here...'}
                  className="w-full p-4 bg-card border-2 border-border rounded-xl text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleText();
                  }}
                />
                <motion.button
                  onClick={handleText}
                  disabled={!textValue.trim()}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: textValue.trim() ? 1.01 : 1 }}
                  whileTap={{ scale: textValue.trim() ? 0.99 : 1 }}
                >
                  {language === 'zh' ? '继续' : 'Continue'}
                </motion.button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
