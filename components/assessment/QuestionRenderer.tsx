'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuestionStep } from '@/types/assessment';
import { Check, ChevronRight, Edit3, Info } from 'lucide-react';
import { tr, type Language } from '@/lib/i18n';
import { maybeCnToTw } from '@/lib/i18n-core';

// 量表来源映射
const SCALE_SOURCES: Record<string, { zh: string; en: string; citation: string }> = {
  'gad': { zh: 'GAD-7 广泛性焦虑障碍量表', en: 'GAD-7 Anxiety Scale', citation: 'Spitzer et al., 2006' },
  'phq': { zh: 'PHQ-9 患者健康问卷', en: 'PHQ-9 Depression Scale', citation: 'Kroenke et al., 2001' },
  'psqi': { zh: 'PSQI 睡眠质量指数', en: 'PSQI Sleep Index', citation: 'Buysse et al., 1989' },
  'pss': { zh: 'PSS 压力知觉量表', en: 'PSS Stress Scale', citation: 'Cohen et al., 1983' },
  'baseline': { zh: '基础评估', en: 'Baseline Assessment', citation: 'Clinical Standard' },
  'differential': { zh: '鉴别诊断', en: 'Differential Diagnosis', citation: 'Clinical Protocol' },
  'chief_complaint': { zh: '主诉评估', en: 'Chief Complaint', citation: 'Medical Standard' },
};

interface QuestionRendererProps {
  step: QuestionStep;
  onAnswer: (questionId: string, value: string | string[] | number | boolean) => void;
  language: Language;
}

export function QuestionRenderer({ step, onAnswer, language }: QuestionRendererProps) {
  const { question } = step;
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [textValue, setTextValue] = useState('');
  const [scaleValue, setScaleValue] = useState(5);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [showSourceTooltip, setShowSourceTooltip] = useState(false);

  // 获取当前量表来源
  const getScaleSource = () => {
    const phase = step.phase;
    const qid = question.id.toLowerCase();
    if (qid.includes('gad') || qid.includes('anxiety')) return SCALE_SOURCES['gad'];
    if (qid.includes('phq') || qid.includes('depression')) return SCALE_SOURCES['phq'];
    if (qid.includes('sleep') || qid.includes('psqi')) return SCALE_SOURCES['psqi'];
    if (qid.includes('stress') || qid.includes('pss')) return SCALE_SOURCES['pss'];
    return SCALE_SOURCES[phase] || SCALE_SOURCES['baseline'];
  };
  const scaleSource = getScaleSource();

  const handleSingleChoice = (value: string) => {
    // 如果选择"以上都不是"，显示自定义输入框
    if (value === 'none_of_above') {
      setShowCustomInput(true);
      return;
    }
    onAnswer(question.id, value);
  };

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      // 发送自定义描述，让 AI 重新调整问诊方向
      onAnswer(question.id, `custom: ${customValue.trim()}`);
    }
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
    <div className="flex flex-col w-full">
      {/* 进度条 */}
      <div className="mb-6">
        <div className="h-1 bg-emerald-50 rounded-full overflow-hidden mb-2">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-600 to-[#0B3D2E]"
            initial={{ width: 0 }}
            animate={{ width: `${question.progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-bold text-emerald-800/30 uppercase tracking-widest">{question.progress}% Complete</p>
          <div
            className="group relative flex items-center gap-1.5 cursor-help"
          >
            <Info className="w-3.5 h-3.5 text-emerald-800/30" />
            <span className="text-[10px] font-bold text-emerald-800/30 uppercase tracking-widest">
              {language === 'en' ? scaleSource.en : scaleSource.zh}
            </span>
            {/* Rich Source Tooltip */}
            <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-white rounded-xl shadow-2xl border border-emerald-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <p className="text-[10px] font-bold text-emerald-800/30 uppercase tracking-widest mb-1.5">Source Citation</p>
              <p className="text-xs text-emerald-900 font-medium leading-relaxed">{scaleSource.citation}</p>
              <p className="text-[10px] text-emerald-800/60 mt-1">{language === 'en' ? scaleSource.en : scaleSource.zh}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 问题内容 */}
      <div className="max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* 问题文本 */}
            <h2 className="text-xl md:text-2xl font-semibold text-[#0B3D2E] mb-2 leading-tight">
              {maybeCnToTw(language, question.text)}
            </h2>

            {question.description && (
              <p className="text-sm md:text-base text-emerald-800/60 mb-8 leading-relaxed">
                {maybeCnToTw(language, question.description)}
              </p>
            )}

            {/* 单选题 */}
            {question.type === 'single_choice' && question.options && (
              <div className="space-y-3">
                <AnimatePresence mode="wait">
                  {showCustomInput ? (
                    // 自定义输入模式
                    <motion.div
                      key="custom-input"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-2 text-emerald-800/40 mb-2">
                        <Edit3 className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {tr(language, { zh: '请描述您的实际情况：', en: 'Please describe your situation:' })}
                        </span>
                      </div>
                      <textarea
                        value={customValue}
                        onChange={(e) => setCustomValue(e.target.value)}
                        placeholder={tr(language, { zh: '例如：我的症状是...', en: 'e.g., My symptom is...' })}
                        className="w-full p-4 bg-emerald-50/20 border border-emerald-100 rounded-2xl text-[#0B3D2E] placeholder:text-emerald-800/30 focus:border-emerald-500/50 focus:outline-none transition-colors min-h-[120px] resize-none"
                        autoFocus
                      />
                      <div className="flex gap-4">
                        <motion.button
                          onClick={() => {
                            setShowCustomInput(false);
                            setCustomValue('');
                          }}
                          className="flex-1 py-4 bg-emerald-50 text-emerald-700 rounded-2xl font-medium hover:bg-emerald-100 transition-colors"
                          whileTap={{ scale: 0.98 }}
                        >
                          {tr(language, { zh: '返回选项', en: 'Back' })}
                        </motion.button>
                        <motion.button
                          onClick={handleCustomSubmit}
                          disabled={!customValue.trim()}
                          className="flex-1 py-4 bg-[#0B3D2E] text-white rounded-2xl font-medium hover:bg-[#06261c] transition-colors disabled:opacity-50"
                          whileTap={{ scale: customValue.trim() ? 0.98 : 1 }}
                        >
                          {tr(language, { zh: '提交', en: 'Submit' })}
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : (
                    // 正常选项模式
                    <motion.div key="options" className="space-y-3">
                      {question.options.map((option, index) => (
                        <motion.button
                          key={option.value}
                          onClick={() => handleSingleChoice(option.value)}
                          className={`
                            w-full p-4 md:p-5 border-2 rounded-2xl text-left transition-all flex items-center gap-4 relative group/opt
                            ${option.value === 'none_of_above'
                              ? 'border-dashed border-emerald-200 hover:border-emerald-400 bg-emerald-50/10'
                              : 'border-emerald-50/50 bg-emerald-50/20 hover:bg-emerald-50 hover:border-emerald-100'
                            }
                          `}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          {option.icon && (
                            <span className="text-2xl flex-shrink-0">{option.icon}</span>
                          )}
                          {option.value === 'none_of_above' && (
                            <Edit3 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <span className="font-semibold text-[#0B3D2E] md:text-lg block">
                              {maybeCnToTw(language, option.label)}
                            </span>
                            {option.description && (
                              <p className="text-sm text-emerald-800/60 mt-0.5 leading-relaxed">
                                {maybeCnToTw(language, option.description)}
                              </p>
                            )}
                          </div>
                          <div className="w-6 h-6 rounded-full border-2 border-emerald-200 flex-shrink-0 group-hover/opt:border-emerald-400 transition-colors flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-transparent group-hover/opt:bg-emerald-100 transition-colors" />
                          </div>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* 多选题 */}
            {question.type === 'multiple_choice' && question.options && (
              <div className="space-y-3">
                {question.options.map((option, index) => (
                  <motion.button
                    key={option.value}
                    onClick={() => handleMultipleChoice(option.value)}
                    className={`
                        w-full p-4 md:p-5 border-2 rounded-2xl text-left transition-all flex items-center gap-4 group/opt
                        ${selectedValues.includes(option.value)
                        ? 'bg-[#0B3D2E] border-[#0B3D2E] text-white'
                        : 'bg-emerald-50/20 border-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-100 text-[#0B3D2E]'
                      }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selectedValues.includes(option.value)
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-emerald-200 group-hover/opt:border-emerald-400'
                      }`}>
                      {selectedValues.includes(option.value) && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold md:text-lg block">
                        {maybeCnToTw(language, option.label)}
                      </span>
                      {option.description && (
                        <p className={`text-sm mt-0.5 leading-relaxed ${selectedValues.includes(option.value) ? 'text-emerald-50' : 'text-emerald-800/60'
                          }`}>
                          {maybeCnToTw(language, option.description)}
                        </p>
                      )}
                    </div>
                  </motion.button>
                ))}

                {selectedValues.length > 0 && (
                  <motion.button
                    onClick={handleSubmitMultiple}
                    className="w-full mt-8 py-4 bg-[#0B3D2E] text-white rounded-2xl font-bold text-lg hover:bg-[#06261c] transition-colors shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <span>{tr(language, { zh: '确认并继续', en: 'Confirm & Continue' })}</span>
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
            )}

            {/* 布尔题 */}
            {question.type === 'boolean' && (
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  onClick={() => handleBoolean(true)}
                  className="py-12 bg-emerald-50/20 border-2 border-emerald-50/50 rounded-3xl font-bold text-xl text-[#0B3D2E] hover:border-emerald-400 hover:bg-[#0B3D2E] hover:text-white transition-all flex flex-col items-center gap-2"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-3xl">✓</span>
                  {tr(language, { zh: '是', en: 'Yes' })}
                </motion.button>
                <motion.button
                  onClick={() => handleBoolean(false)}
                  className="py-12 bg-emerald-50/20 border-2 border-emerald-50/50 rounded-3xl font-bold text-xl text-[#0B3D2E] hover:border-rose-400 hover:bg-rose-500 hover:text-white transition-all flex flex-col items-center gap-2"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-3xl">✕</span>
                  {tr(language, { zh: '否', en: 'No' })}
                </motion.button>
              </div>
            )}

            {/* 滑块题 */}
            {question.type === 'scale' && (
              <div className="space-y-10 py-6">
                <div className="relative pt-2">
                  <input
                    type="range"
                    min={question.min || 1}
                    max={question.max || 10}
                    value={scaleValue}
                    onChange={(e) => setScaleValue(Number(e.target.value))}
                    className="w-full h-3 bg-emerald-100 rounded-full appearance-none cursor-pointer accent-[#0B3D2E]"
                  />
                  <div className="flex justify-between mt-4 text-xs font-bold text-emerald-800/40 uppercase tracking-widest px-1">
                    <span>{tr(language, { zh: '轻微', en: 'Mild' })}</span>
                    <span>{tr(language, { zh: '中等', en: 'Moderate' })}</span>
                    <span>{tr(language, { zh: '严重', en: 'Severe' })}</span>
                  </div>
                </div>

                <div className="text-center bg-emerald-50/30 rounded-3xl p-10 border border-emerald-100/50">
                  <motion.span
                    key={scaleValue}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-7xl font-bold text-[#0B3D2E] block leading-none"
                  >
                    {scaleValue}
                  </motion.span>
                  <span className="text-emerald-800/40 font-bold uppercase tracking-widest text-sm mt-2 block">Intensity Level</span>
                </div>

                <motion.button
                  onClick={handleScale}
                  className="w-full py-4 bg-[#0B3D2E] text-white rounded-2xl font-bold text-lg hover:bg-[#06261c] transition-all shadow-lg shadow-emerald-900/10"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {tr(language, { zh: '继续', en: 'Continue' })}
                </motion.button>
              </div>
            )}

            {/* 文本输入 / 症状搜索 */}
            {(question.type === 'text' || question.type === 'symptom_search') && (
              <div className="space-y-6">
                <div className="relative">
                  <input
                    type="text"
                    value={textValue}
                    onChange={(e) => setTextValue(e.target.value)}
                    placeholder={tr(language, { zh: '请输入描述...', en: 'Type description here...' })}
                    className="w-full p-5 bg-emerald-50/20 border border-emerald-100 rounded-2xl text-[#0B3D2E] placeholder:text-emerald-800/30 focus:border-emerald-500/50 focus:outline-none transition-all text-lg shadow-inner"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleText();
                    }}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-800/20 pointer-events-none">
                    <Edit3 className="w-5 h-5" />
                  </div>
                </div>

                <p className="text-xs text-emerald-800/40 px-2 leading-relaxed">
                  {tr(language, {
                    zh: '提示：详细的描述能帮助 AI 更准确地识别您的临床分型。',
                    en: 'Tip: Detailed descriptions help AI identify your clinical subtype more accurately.'
                  })}
                </p>

                <motion.button
                  onClick={handleText}
                  disabled={!textValue.trim()}
                  className="w-full py-4 bg-[#0B3D2E] text-white rounded-2xl font-bold text-lg hover:bg-[#06261c] transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/10"
                  whileHover={{ scale: textValue.trim() ? 1.01 : 1 }}
                  whileTap={{ scale: textValue.trim() ? 0.99 : 1 }}
                >
                  {tr(language, { zh: '继续', en: 'Continue' })}
                </motion.button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
