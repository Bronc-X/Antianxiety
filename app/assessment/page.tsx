'use client';

import { AssessmentProvider, useAssessment } from '@/components/assessment/AssessmentProvider';
import { WelcomeScreen, QuestionRenderer, ReportView, EmergencyAlert } from '@/components/assessment';
import { Loader2 } from 'lucide-react';
import { QuestionStep, ReportStep, EmergencyStep } from '@/types/assessment';

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
    language
  } = useAssessment();

  // 加载状态
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">
          {language === 'zh' ? 'Bio-Ledger 正在分析...' : 'Bio-Ledger is analyzing...'}
        </p>
      </div>
    );
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
                {language === 'zh' ? '去登录' : 'Log In'}
              </a>
            )}
            <button
              onClick={resetAssessment}
              className="px-6 py-2 bg-muted text-muted-foreground rounded-lg hover:opacity-90 transition-colors"
            >
              {language === 'zh' ? '重新开始' : 'Start Over'}
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

export default function AssessmentPage() {
  return (
    <AssessmentProvider>
      <div className="min-h-screen bg-background">
        <AssessmentContent />
      </div>
    </AssessmentProvider>
  );
}
