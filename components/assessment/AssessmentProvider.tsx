'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  AssessmentPhase, 
  AssessmentResponse, 
  QuestionStep, 
  ReportStep, 
  EmergencyStep,
  AnswerRecord 
} from '@/types/assessment';

interface AssessmentState {
  sessionId: string | null;
  phase: AssessmentPhase;
  currentStep: AssessmentResponse | null;
  history: AnswerRecord[];
  isLoading: boolean;
  error: string | null;
  language: 'zh' | 'en';
  countryCode: string;
  // 🆕 动态加载状态
  loadingContext: {
    lastQuestion?: string;
    lastAnswer?: string;
    questionCount: number;
  };
}

interface AssessmentContextType extends AssessmentState {
  startAssessment: () => Promise<void>;
  submitAnswer: (questionId: string, value: string | string[] | number | boolean) => Promise<void>;
  setLanguage: (lang: 'zh' | 'en') => void;
  resetAssessment: () => void;
  dismissEmergency: () => Promise<void>;
}

const AssessmentContext = createContext<AssessmentContextType | null>(null);

export function useAssessment() {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within AssessmentProvider');
  }
  return context;
}

interface AssessmentProviderProps {
  children: React.ReactNode;
}

export function AssessmentProvider({ children }: AssessmentProviderProps) {
  const [state, setState] = useState<AssessmentState>({
    sessionId: null,
    phase: 'welcome',
    currentStep: null,
    history: [],
    isLoading: false,
    error: null,
    language: 'zh',
    countryCode: 'CN',
    loadingContext: { questionCount: 0 }
  });

  // 检测用户语言
  useEffect(() => {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('en')) {
      setState(prev => ({ ...prev, language: 'en' }));
    }
    
    // 尝试获取国家代码
    fetch('https://ipapi.co/country/')
      .then(res => res.text())
      .then(code => {
        if (code && code.length === 2) {
          setState(prev => ({ ...prev, countryCode: code }));
        }
      })
      .catch(() => {});
  }, []);

  const startAssessment = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const res = await fetch('/api/assessment/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: state.language,
          country_code: state.countryCode
        })
      });

      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error(`服务器响应错误 (${res.status})`);
      }

      if (!res.ok) {
        // 特殊处理 401 未授权错误
        if (res.status === 401) {
          throw new Error(state.language === 'zh' 
            ? '请先登录后再使用症状评估功能' 
            : 'Please log in to use the symptom assessment feature');
        }
        const errorMsg = data?.error?.message || data?.message || `请求失败 (${res.status})`;
        throw new Error(errorMsg);
      }

      // 验证响应数据
      if (!data.session_id) {
        throw new Error('服务器返回数据格式错误');
      }

      setState(prev => ({
        ...prev,
        sessionId: data.session_id,
        phase: data.phase,
        currentStep: data,
        isLoading: false
      }));
    } catch (error) {
      console.error('Assessment start error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '未知错误'
      }));
    }
  }, [state.language, state.countryCode]);

  const submitAnswer = useCallback(async (
    questionId: string, 
    value: string | string[] | number | boolean
  ) => {
    if (!state.sessionId) return;

    // 🆕 保存当前问题和答案到 loadingContext
    const currentQuestion = (state.currentStep as QuestionStep)?.question?.text || '';
    const answerText = typeof value === 'string' ? value : JSON.stringify(value);
    
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      loadingContext: {
        lastQuestion: currentQuestion,
        lastAnswer: answerText,
        questionCount: prev.history.length + 1
      }
    }));

    try {
      const res = await fetch('/api/assessment/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: state.sessionId,
          answer: { question_id: questionId, value },
          language: state.language,
          country_code: state.countryCode
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || '提交答案失败');
      }

      // 更新历史
      const newHistory: AnswerRecord = {
        question_id: questionId,
        question_text: (state.currentStep as QuestionStep)?.question?.text || '',
        value,
        answered_at: new Date().toISOString()
      };

      setState(prev => ({
        ...prev,
        phase: data.phase,
        currentStep: data,
        history: [...prev.history, newHistory],
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '未知错误'
      }));
    }
  }, [state.sessionId, state.language, state.countryCode, state.currentStep]);

  const setLanguage = useCallback((lang: 'zh' | 'en') => {
    setState(prev => ({ ...prev, language: lang }));
  }, []);

  const resetAssessment = useCallback(() => {
    setState({
      sessionId: null,
      phase: 'welcome',
      currentStep: null,
      history: [],
      isLoading: false,
      error: null,
      language: state.language,
      countryCode: state.countryCode
    });
  }, [state.language, state.countryCode]);

  const dismissEmergency = useCallback(async () => {
    if (!state.sessionId) return;
    
    // 记录用户关闭紧急警告
    try {
      await fetch('/api/assessment/dismiss-emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: state.sessionId })
      });
    } catch (error) {
      console.error('Failed to log emergency dismissal:', error);
    }

    resetAssessment();
  }, [state.sessionId, resetAssessment]);

  return (
    <AssessmentContext.Provider value={{
      ...state,
      startAssessment,
      submitAnswer,
      setLanguage,
      resetAssessment,
      dismissEmergency
    }}>
      {children}
    </AssessmentContext.Provider>
  );
}
