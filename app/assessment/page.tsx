'use client';

import { useState, useEffect } from 'react';
import { AssessmentProvider, useAssessment } from '@/components/assessment/AssessmentProvider';
import { WelcomeScreen, QuestionRenderer, ReportView, EmergencyAlert } from '@/components/assessment';
import { Loader2, Brain, Database, Sparkles, Activity } from 'lucide-react';
import { QuestionStep, ReportStep, EmergencyStep } from '@/types/assessment';
import { motion, AnimatePresence } from 'framer-motion';
import { type Language, tr } from '@/lib/i18n';

function AssessmentContent() {
  const { 
    phase, 
    currentStep, 
    isLoading, 
    error,
    startAssessment,
    submitAnswer,
    resetAssessment,
    dismissEmergency,
    language,
    loadingContext
  } = useAssessment();

  // 加载状态 - 高级动画体验
  if (isLoading) {
    return <AdvancedLoadingScreen language={language} loadingContext={loadingContext} />;
  }

  // 错误状态
  if (error) {
    const isAuthError = error.includes('登录') || error.includes('log in');
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-md text-center">
          <p className="text-destructive mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            {isAuthError && (
              <a
                href="/login"
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors"
              >
                {tr(language, { zh: '去登录', en: 'Log In' })}
              </a>
            )}
            <button
              onClick={resetAssessment}
              className="px-6 py-2 bg-muted text-muted-foreground rounded-lg hover:opacity-90 transition-colors"
            >
              {tr(language, { zh: '重新开始', en: 'Start Over' })}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 欢迎页
  if (phase === 'welcome' || !currentStep) {
    return <WelcomeScreen onStart={startAssessment} language={language} />;
  }

  // 紧急警告
  if (currentStep.step_type === 'emergency') {
    return (
      <EmergencyAlert 
        emergency={(currentStep as EmergencyStep).emergency}
        onDismiss={dismissEmergency}
        language={language}
      />
    );
  }

  // 报告页
  if (currentStep.step_type === 'report') {
    return (
      <ReportView 
        report={(currentStep as ReportStep).report}
        sessionId={(currentStep as ReportStep).session_id}
        onRestart={resetAssessment}
        language={language}
      />
    );
  }

  // 问题页
  return (
    <QuestionRenderer
      step={currentStep as QuestionStep}
      onAnswer={submitAnswer}
      language={language}
    />
  );
}

// 高级加载动画组件
interface LoadingContext {
  lastQuestion?: string;
  lastAnswer?: string;
  questionCount: number;
}

function AdvancedLoadingScreen({ language, loadingContext }: { language: Language; loadingContext?: LoadingContext }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  
  // 🆕 根据实际问答内容生成动态步骤
  const getDynamicSteps = () => {
    const qCount = loadingContext?.questionCount || 0;
    const lastQ = loadingContext?.lastQuestion || '';
    const lastA = loadingContext?.lastAnswer || '';
    
    if (language !== 'en') {
      return [
        { 
          icon: Database, 
          text: qCount > 0 ? `已收集 ${qCount} 条症状信息` : '连接医学知识库...', 
          detail: lastQ ? `上一问题: ${lastQ.slice(0, 20)}...` : '加载症状数据库' 
        },
        { 
          icon: Brain, 
          text: '贝叶斯推理计算中...', 
          detail: lastA ? `分析您的回答: "${lastA.slice(0, 15)}..."` : '计算条件概率分布' 
        },
        { 
          icon: Activity, 
          text: `匹配相似病例...`, 
          detail: qCount > 3 ? '已缩小诊断范围' : '扫描医学知识图谱' 
        },
        { 
          icon: Sparkles, 
          text: '生成下一个问题...', 
          detail: qCount > 6 ? '即将完成评估' : '优化问诊路径' 
        },
      ];
    }
    return [
      { 
        icon: Database, 
        text: qCount > 0 ? `Collected ${qCount} symptom data points` : 'Connecting medical database...', 
        detail: lastQ ? `Last question: ${lastQ.slice(0, 20)}...` : 'Loading symptom database' 
      },
      { 
        icon: Brain, 
        text: 'Running Bayesian inference...', 
        detail: lastA ? `Analyzing: "${lastA.slice(0, 15)}..."` : 'Computing probability distributions' 
      },
      { 
        icon: Activity, 
        text: 'Matching similar cases...', 
        detail: qCount > 3 ? 'Narrowing diagnosis' : 'Scanning medical knowledge graph' 
      },
      { 
        icon: Sparkles, 
        text: 'Generating next question...', 
        detail: qCount > 6 ? 'Assessment nearly complete' : 'Optimizing assessment path' 
      },
    ];
  };
  
  const steps = getDynamicSteps();

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, 2500);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return 15;
        return prev + Math.random() * 8 + 2;
      });
    }, 300);
    
    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [steps.length]);

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 relative overflow-hidden">
      {/* 背景水波动画 */}
      <div className="absolute inset-0 overflow-hidden">
        <svg className="absolute w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="none">
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9CAF88" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#0B3D2E" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          {[0, 1, 2].map((i) => (
            <motion.path
              key={i}
              d="M0,200 Q100,150 200,200 T400,200 L400,400 L0,400 Z"
              fill="url(#waveGradient)"
              initial={{ d: "M0,200 Q100,150 200,200 T400,200 L400,400 L0,400 Z" }}
              animate={{
                d: [
                  "M0,200 Q100,150 200,200 T400,200 L400,400 L0,400 Z",
                  "M0,220 Q100,180 200,220 T400,180 L400,400 L0,400 Z",
                  "M0,180 Q100,220 200,180 T400,220 L400,400 L0,400 Z",
                  "M0,200 Q100,150 200,200 T400,200 L400,400 L0,400 Z",
                ],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
              style={{ opacity: 0.3 - i * 0.08 }}
            />
          ))}
        </svg>
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 flex flex-col items-center">
        {/* 动态图标 */}
        <motion.div 
          className="relative w-24 h-24 mb-8"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {/* 外圈脉冲 */}
          <motion.div 
            className="absolute inset-0 rounded-full bg-[#9CAF88]/20"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div 
            className="absolute inset-2 rounded-full bg-[#9CAF88]/30"
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          />
          
          {/* 中心图标 */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-[#9CAF88] to-[#0B3D2E] flex items-center justify-center shadow-lg">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5, rotate: 180 }}
                transition={{ duration: 0.5 }}
              >
                <CurrentIcon className="w-8 h-8 text-white" />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* 主标题 */}
        <motion.h2 
          className="text-xl font-semibold text-[#0B3D2E] dark:text-white mb-2"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {tr(language, { zh: 'Bio-Ledger 智能分析中', en: 'Bio-Ledger Analyzing' })}
        </motion.h2>

        {/* 动态步骤显示 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center mb-6"
          >
            <p className="text-base text-[#0B3D2E]/80 dark:text-white/80 font-medium">
              {steps[currentStep].text}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {steps[currentStep].detail}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* 进度条 */}
        <div className="w-64 h-2 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden mb-4">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#9CAF88] to-[#0B3D2E] rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* 步骤指示器 */}
        <div className="flex gap-2 mb-6">
          {steps.map((_, i) => (
            <motion.div
              key={i}
              className={`w-2 h-2 rounded-full ${i === currentStep ? 'bg-[#0B3D2E]' : 'bg-gray-300'}`}
              animate={i === currentStep ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.5, repeat: i === currentStep ? Infinity : 0 }}
            />
          ))}
        </div>

        {/* 底部安抚文案 */}
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          {tr(language, {
            zh: '我们正在运用先进的医学 AI 为您匹配最精准的问诊路径',
            en: 'We are using advanced medical AI to match the most accurate assessment path for you',
          })}
        </p>
      </div>
    </div>
  );
}

export default function AssessmentPage() {
  return (
    <AssessmentProvider>
      <div className="min-h-screen bg-background">
        <AssessmentContent />
      </div>
    </AssessmentProvider>
  );
}
