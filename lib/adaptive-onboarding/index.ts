/**
 * Adaptive Onboarding Module
 * 
 * Exports all adaptive onboarding functionality including:
 * - Template questions (exactly 3)
 * - Decision tree engine
 * - Goal inference
 */

export {
  TEMPLATE_QUESTIONS,
  TEMPLATE_QUESTIONS_EN,
  getTemplateQuestions,
  validateTemplateQuestions,
} from './template-questions';

export {
  MAX_TOTAL_QUESTIONS,
  TEMPLATE_QUESTION_COUNT,
  MAX_DECISION_TREE_QUESTIONS,
  AI_RESPONSE_TIMEOUT_MS,
  selectDecisionTreeQuestions,
  getNextDecisionTreeQuestion,
  getTotalQuestionCount,
  shouldProceedToGoals,
  inferMetabolicProfile,
  inferPhaseGoals,
} from './decision-tree-engine';
