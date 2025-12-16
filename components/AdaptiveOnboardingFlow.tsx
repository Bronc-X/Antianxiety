'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Edit3, AlertCircle, Check, X } from 'lucide-react';
import { 
  getTemplateQuestions, 
  getNextDecisionTreeQuestion,
  shouldProceedToGoals,
  TEMPLATE_QUESTION_COUNT,
  MAX_TOTAL_QUESTIONS,
} from '@/lib/adaptive-onboarding';
import type { 
  OnboardingQuestion, 
  DecisionTreeQuestion,
  PhaseGoal,
  MetabolicProfile,
  OnboardingResult,
  GoalType,
} from '@/types/adaptive-interaction';
import { useI18n } from '@/lib/i18n';

interface AdaptiveOnboardingFlowProps {
  onComplete: (result: OnboardingResult) => void;
}

type FlowStep = 'questions' | 'analyzing' | 'goals';

interface GoalModificationState {
  isOpen: boolean;
  goalId: string | null;
  explanation: string;
  alternatives: Array<{ type: GoalType; title: string; rationale: string }>;
  isLoading: boolean;
  selectedAlternative: GoalType | null;
}

export default function AdaptiveOnboardingFlow({ onComplete }: AdaptiveOnboardingFlowProps) {
  const { language } = useI18n();
  const [step, setStep] = useState<FlowStep>('questions');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [templateAnswers, setTemplateAnswers] = useState<Record<string, string>>({});
  const [decisionTreeAnswers, setDecisionTreeAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState<OnboardingQuestion | DecisionTreeQuestion | null>(null);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [recommendedGoals, setRecommendedGoals] = useState<PhaseGoal[]>([]);
  const [metabolicProfile, setMetabolicProfile] = useState<MetabolicProfile | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes
  
  // Goal modification state (Requirement 2.3, 2.4)
  const [modificationState, setModificationState] = useState<GoalModificationState>({
    isOpen: false,
    goalId: null,
    explanation: '',
    alternatives: [],
    isLoading: false,
    selectedAlternative: null,
  });

  const templateQuestions = getTemplateQuestions(language === 'en' ? 'en' : 'zh');
  const totalAnswered = Object.keys(templateAnswers).length + Object.keys(decisionTreeAnswers).length;
  const progress = (totalAnswered / MAX_TOTAL_QUESTIONS) * 100;

  // Countdown timer
  useEffect(() => {
    if (step !== 'questions') return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  // Initialize first question
  useEffect(() => {
    if (templateQuestions.length > 0 && !currentQuestion) {
      setCurrentQuestion(templateQuestions[0]);
    }
  }, [templateQuestions, currentQuestion]);

  // Handle answer selection
  const handleAnswer = useCallback(async (questionId: string, value: string) => {
    const isTemplateQuestion = currentQuestionIndex < TEMPLATE_QUESTION_COUNT;
    
    if (isTemplateQuestion) {
      const newTemplateAnswers = { ...templateAnswers, [questionId]: value };
      setTemplateAnswers(newTemplateAnswers);
      
      // Check if we need to move to decision tree questions
      if (currentQuestionIndex < TEMPLATE_QUESTION_COUNT - 1) {
        // More template questions
        setCurrentQuestionIndex(prev => prev + 1);
        setCurrentQuestion(templateQuestions[currentQuestionIndex + 1]);
      } else {
        // Start decision tree questions
        setIsLoadingQuestion(true);
        const nextQuestion = getNextDecisionTreeQuestion(newTemplateAnswers, {});
        setIsLoadingQuestion(false);
        
        if (nextQuestion) {
          setCurrentQuestionIndex(prev => prev + 1);
          setCurrentQuestion(nextQuestion);
        } else {
          // No decision tree questions, proceed to goals
          await fetchGoals({ ...newTemplateAnswers });
        }
      }
    } else {
      const newDecisionAnswers = { ...decisionTreeAnswers, [questionId]: value };
      setDecisionTreeAnswers(newDecisionAnswers);
      
      // Check if we should proceed to goals
      if (shouldProceedToGoals(templateAnswers, newDecisionAnswers)) {
        await fetchGoals({ ...templateAnswers, ...newDecisionAnswers });
      } else {
        // Get next decision tree question
        setIsLoadingQuestion(true);
        const nextQuestion = getNextDecisionTreeQuestion(templateAnswers, newDecisionAnswers);
        setIsLoadingQuestion(false);
        
        if (nextQuestion) {
          setCurrentQuestionIndex(prev => prev + 1);
          setCurrentQuestion(nextQuestion);
        } else {
          await fetchGoals({ ...templateAnswers, ...newDecisionAnswers });
        }
      }
    }
  }, [currentQuestionIndex, templateAnswers, decisionTreeAnswers, templateQuestions]);

  // Fetch goals from API
  const fetchGoals = async (allAnswers: Record<string, string>) => {
    setStep('analyzing');
    
    try {
      const response = await fetch('/api/onboarding/recommend-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: allAnswers }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecommendedGoals(data.goals);
        setMetabolicProfile(data.metabolicProfile);
        
        // Short delay for animation
        setTimeout(() => {
          setStep('goals');
        }, 2000);
      } else {
        console.error('Failed to fetch goals');
        setStep('goals');
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      setStep('goals');
    }
  };

  // Handle goal modification request (Requirement 2.3)
  const handleModifyGoal = async (goal: PhaseGoal) => {
    setModificationState(prev => ({
      ...prev,
      isOpen: true,
      goalId: goal.id,
      isLoading: true,
      selectedAlternative: null,
    }));

    try {
      const response = await fetch('/api/onboarding/modify-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: goal.id,
          action: 'explain',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setModificationState(prev => ({
          ...prev,
          explanation: data.explanation,
          alternatives: data.alternativeGoals,
          isLoading: false,
        }));
      } else {
        setModificationState(prev => ({
          ...prev,
          explanation: '无法获取解释，请稍后再试。',
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Error fetching goal explanation:', error);
      setModificationState(prev => ({
        ...prev,
        explanation: '网络错误，请检查连接。',
        isLoading: false,
      }));
    }
  };

  // Confirm goal modification (Requirement 2.4)
  const handleConfirmModification = async () => {
    if (!modificationState.goalId || !modificationState.selectedAlternative) return;

    setModificationState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch('/api/onboarding/modify-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: modificationState.goalId,
          newGoalType: modificationState.selectedAlternative,
          action: 'confirm',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update local goals state
        setRecommendedGoals(prev => 
          prev.map(g => g.id === modificationState.goalId ? data.updatedGoal : g)
        );
        setModificationState({
          isOpen: false,
          goalId: null,
          explanation: '',
          alternatives: [],
          isLoading: false,
          selectedAlternative: null,
        });
      }
    } catch (error) {
      console.error('Error confirming modification:', error);
      setModificationState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Cancel modification
  const handleCancelModification = () => {
    setModificationState({
      isOpen: false,
      goalId: null,
      explanation: '',
      alternatives: [],
      isLoading: false,
      selectedAlternative: null,
    });
  };

  // Handle goal confirmation
  const handleConfirmGoals = () => {
    onComplete({
      answers: { ...templateAnswers, ...decisionTreeAnswers },
      metabolicProfile: metabolicProfile!,
      recommendedGoals,
    });
  };

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Analyzing step
  if (step === 'analyzing') {
    return (
      <div className="min-h-screen bg-[#FFFBF0] dark:bg-neutral-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            className="mx-auto w-32 h-32 rounded-full bg-gradient-to-br from-[#0B3D2E] to-[#0a3427] mb-8"
            animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <p className="text-2xl font-serif text-[#0B3D2E] dark:text-white">
            AI 正在分析你的代谢指纹...
          </p>
        </motion.div>
      </div>
    );
  }

  // Goals step
  if (step === 'goals') {
    return (
      <div className="min-h-screen bg-[#FFFBF0] dark:bg-neutral-950 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full"
        >
          <h2 className="text-3xl font-serif text-[#0B3D2E] dark:text-white mb-2 text-center">
            你的阶段性目标
          </h2>
          <p className="text-[#0B3D2E]/60 dark:text-neutral-400 text-center mb-8">
            基于你的回答，AI 为你推荐以下健康目标
          </p>

          <div className="space-y-4 mb-8">
            {recommendedGoals.map((goal, index) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-[#E7E1D6] dark:border-neutral-800"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    goal.priority === 1 
                      ? 'bg-[#0B3D2E] text-white' 
                      : 'bg-[#E7E1D6] text-[#0B3D2E]'
                  }`}>
                    {goal.priority === 1 ? '首要目标' : '次要目标'}
                  </span>
                  <button
                    onClick={() => handleModifyGoal(goal)}
                    className="flex items-center gap-1 text-sm text-[#0B3D2E]/60 hover:text-[#0B3D2E] dark:text-neutral-400 dark:hover:text-white transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    修改
                  </button>
                </div>
                <h3 className="text-xl font-semibold text-[#0B3D2E] dark:text-white mb-2">
                  {goal.title}
                </h3>
                <p className="text-[#0B3D2E]/70 dark:text-neutral-300 text-sm mb-3">
                  {goal.rationale}
                </p>
                {goal.citations.length > 0 && (
                  <p className="text-xs text-[#0B3D2E]/50 dark:text-neutral-500">
                    📚 {goal.citations[0].title} ({goal.citations[0].year})
                  </p>
                )}
                {goal.user_modified && (
                  <p className="text-xs text-[#9CAF88] mt-2">
                    ✓ 已根据你的偏好调整
                  </p>
                )}
              </motion.div>
            ))}
          </div>

          <motion.button
            onClick={handleConfirmGoals}
            className="w-full py-4 bg-[#0B3D2E] text-white rounded-2xl font-semibold hover:bg-[#0a3629] transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            确认目标，开始旅程
          </motion.button>
        </motion.div>

        {/* Goal Modification Dialog (Requirement 2.3) */}
        <AnimatePresence>
          {modificationState.isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={handleCancelModification}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-[#0B3D2E] dark:text-white">
                    为什么推荐这个目标？
                  </h3>
                  <button
                    onClick={handleCancelModification}
                    className="p-1 hover:bg-[#E7E1D6] dark:hover:bg-neutral-800 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-[#0B3D2E]/60 dark:text-neutral-400" />
                  </button>
                </div>

                {modificationState.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-[#0B3D2E] animate-spin" />
                    <span className="ml-2 text-[#0B3D2E]/60">AI 正在分析...</span>
                  </div>
                ) : (
                  <>
                    {/* AI Explanation */}
                    <div className="bg-[#FFFBF0] dark:bg-neutral-800 rounded-xl p-4 mb-6">
                      <div className="flex items-start gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-[#9CAF88] flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-[#0B3D2E]/80 dark:text-neutral-300">
                          {modificationState.explanation}
                        </p>
                      </div>
                    </div>

                    {/* Alternative Goals */}
                    {modificationState.alternatives.length > 0 && (
                      <>
                        <p className="text-sm text-[#0B3D2E]/60 dark:text-neutral-400 mb-3">
                          如果你想调整，可以选择以下替代目标：
                        </p>
                        <div className="space-y-3 mb-6">
                          {modificationState.alternatives.map((alt) => (
                            <button
                              key={alt.type}
                              onClick={() => setModificationState(prev => ({
                                ...prev,
                                selectedAlternative: alt.type,
                              }))}
                              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                modificationState.selectedAlternative === alt.type
                                  ? 'border-[#0B3D2E] bg-[#0B3D2E]/5'
                                  : 'border-[#E7E1D6] dark:border-neutral-700 hover:border-[#0B3D2E]/40'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-[#0B3D2E] dark:text-white">
                                  {alt.title}
                                </span>
                                {modificationState.selectedAlternative === alt.type && (
                                  <Check className="w-5 h-5 text-[#0B3D2E]" />
                                )}
                              </div>
                              <p className="text-sm text-[#0B3D2E]/60 dark:text-neutral-400 mt-1">
                                {alt.rationale}
                              </p>
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleCancelModification}
                        className="flex-1 py-3 border-2 border-[#E7E1D6] dark:border-neutral-700 text-[#0B3D2E] dark:text-white rounded-xl font-medium hover:bg-[#E7E1D6]/50 transition-colors"
                      >
                        保持原目标
                      </button>
                      <button
                        onClick={handleConfirmModification}
                        disabled={!modificationState.selectedAlternative || modificationState.isLoading}
                        className="flex-1 py-3 bg-[#0B3D2E] text-white rounded-xl font-medium hover:bg-[#0a3629] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {modificationState.isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                        ) : (
                          '确认修改'
                        )}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Questions step
  return (
    <div className="min-h-screen bg-[#FFFBF0] dark:bg-neutral-950 flex flex-col">
      {/* Progress bar */}
      <div className="sticky top-0 z-10 bg-[#FFFBF0] dark:bg-neutral-950 pt-4 px-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[#0B3D2E]/60 dark:text-neutral-400">
            问题 {totalAnswered + 1} / {MAX_TOTAL_QUESTIONS}
          </span>
          <span className="text-sm font-mono text-[#0B3D2E]/60 dark:text-neutral-400">
            ⏱ {formatTime(timeRemaining)}
          </span>
        </div>
        <div className="h-1 bg-[#E7E1D6] dark:bg-neutral-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#0B3D2E]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <AnimatePresence mode="wait">
            {currentQuestion && (
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-3xl sm:text-4xl font-serif text-[#0B3D2E] dark:text-white leading-tight mb-3">
                  {currentQuestion.question}
                </h2>
                
                {currentQuestion.description && (
                  <p className="text-lg text-[#0B3D2E]/70 dark:text-neutral-400 mb-8">
                    {currentQuestion.description}
                  </p>
                )}

                {'reasoning' in currentQuestion && currentQuestion.reasoning && (
                  <p className="text-sm text-[#9CAF88] mb-4 italic">
                    💡 {currentQuestion.reasoning}
                  </p>
                )}

                <div className="space-y-3 mt-8">
                  {currentQuestion.options.map((option, idx) => (
                    <motion.button
                      key={option.value}
                      onClick={() => handleAnswer(currentQuestion.id, option.value)}
                      disabled={isLoadingQuestion}
                      className="w-full text-left p-5 rounded-2xl border-2 border-[#E7E1D6] dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-[#0B3D2E]/40 hover:shadow-sm transition-all disabled:opacity-50"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <span className="text-lg text-[#0B3D2E]/80 dark:text-neutral-200">
                        {option.label}
                      </span>
                    </motion.button>
                  ))}
                </div>

                {isLoadingQuestion && (
                  <div className="flex items-center justify-center mt-6">
                    <Loader2 className="w-6 h-6 text-[#0B3D2E] animate-spin" />
                    <span className="ml-2 text-sm text-[#0B3D2E]/60">AI 正在思考下一个问题...</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
