/**
 * Adaptive Interaction System Types
 * 
 * Types for the adaptive onboarding, phase goals, daily calibration,
 * active inquiry, and content curation systems.
 */

// ============================================
// Phase Goals
// ============================================

export type GoalType = 'sleep' | 'energy' | 'weight' | 'stress' | 'fitness';

export interface Citation {
  title: string;
  authors: string;
  year: number;
  doi?: string;
  url?: string;
}

export interface PhaseGoal {
  id: string;
  user_id: string;
  goal_type: GoalType;
  priority: 1 | 2;
  title: string;
  rationale: string;
  citations: Citation[];
  is_ai_recommended: boolean;
  user_modified: boolean;
  created_at: string;
  updated_at: string;
}

export interface PhaseGoalInput {
  goal_type: GoalType;
  priority: 1 | 2;
  title: string;
  rationale: string;
  citations?: Citation[];
  is_ai_recommended?: boolean;
}

// ============================================
// Onboarding
// ============================================

export type QuestionType = 'template' | 'decision_tree';

export interface QuestionOption {
  label: string;
  value: string;
  score?: number;
  icon?: string;
  description?: string;
}

export interface OnboardingQuestion {
  id: string;
  question: string;
  description?: string;
  options: QuestionOption[];
  type: 'single' | 'multi';
}

export interface DecisionTreeQuestion extends OnboardingQuestion {
  reasoning: string; // AI's reasoning for asking this question
}

export interface OnboardingAnswer {
  id: string;
  user_id: string;
  question_id: string;
  question_type: QuestionType;
  question_text: string;
  answer_value: string;
  answer_label?: string;
  sequence_order: number;
  ai_reasoning?: string;
  created_at: string;
}

export interface OnboardingResult {
  answers: Record<string, string>;
  metabolicProfile: MetabolicProfile;
  recommendedGoals: PhaseGoal[];
}

export interface MetabolicProfile {
  energy_pattern: 'crash_afternoon' | 'stable' | 'variable';
  sleep_pattern: 'cortisol_imbalance' | 'normal' | 'occasional_issue';
  body_pattern: 'metabolic_slowdown' | 'slight_change' | 'healthy';
  stress_pattern: 'low_tolerance' | 'medium_tolerance' | 'high_tolerance';
  psychology: 'frustrated' | 'curious' | 'successful';
  overall_score: number;
  severity: 'high' | 'medium' | 'low';
}

// ============================================
// Daily Calibration
// ============================================

export type CalibrationQuestionType = 'anchor' | 'adaptive' | 'evolution';
export type CalibrationInputType = 'slider' | 'single' | 'multi' | 'text';

export interface CalibrationQuestion {
  id: string;
  type: CalibrationQuestionType;
  question: string;
  description?: string;
  inputType: CalibrationInputType;
  options?: QuestionOption[];
  min?: number;
  max?: number;
  goalRelation?: GoalType; // Which goal this question relates to
}

export interface CalibrationRecord {
  id: string;
  user_id: string;
  question_evolution_level: number;
  questions_asked: CalibrationQuestion[];
  answers: Record<string, string | number>;
  phase_goal_id?: string;
  created_at: string;
}

export interface ProgressMetrics {
  sleepQualityTrend: number; // -1 to 1
  stressTrend: number; // -1 to 1
  energyTrend: number; // -1 to 1
  consistencyScore: number; // 0 to 1
}

// ============================================
// Active Inquiry
// ============================================

export type InquiryQuestionType = 'diagnostic' | 'feed_recommendation';
export type InquiryPriority = 'high' | 'medium' | 'low';
export type DeliveryMethod = 'push' | 'in_app';

export interface DataGap {
  field: string;
  lastUpdated?: string;
  importance: InquiryPriority;
  description: string;
}

export interface InquiryQuestion {
  id: string;
  question_text: string;
  question_type: InquiryQuestionType;
  priority: InquiryPriority;
  data_gaps_addressed: string[];
  options?: QuestionOption[];
  feedContent?: CuratedContent; // If type is feed_recommendation
}

export interface InquiryRecord {
  id: string;
  user_id: string;
  question_text: string;
  question_type: InquiryQuestionType;
  priority: InquiryPriority;
  data_gaps_addressed: string[];
  user_response?: string;
  responded_at?: string;
  delivery_method: DeliveryMethod;
  created_at: string;
}

export interface InquiryContext {
  phaseGoals: PhaseGoal[];
  recentCalibrations: CalibrationRecord[];
  dataGaps: DataGap[];
  lastInquiryTime?: Date;
}

export interface InquiryTiming {
  suggestedTime: Date;
  confidence: number;
  reasoning: string;
}

// ============================================
// User Activity Patterns
// ============================================

export interface ActivityPattern {
  id: string;
  user_id: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  hour_of_day: number; // 0-23
  activity_score: number; // 0-1
  updated_at: string;
}

export interface ActivityRecord {
  timestamp: Date;
  action: 'app_open' | 'calibration' | 'chat' | 'feed_view';
}

// ============================================
// Curated Feed
// ============================================

export type ContentType = 'paper' | 'article' | 'tip';

export interface CuratedContent {
  id: string;
  user_id: string;
  content_type: ContentType;
  title: string;
  summary?: string;
  url?: string;
  source: string;
  relevance_score: number;
  matched_goals: GoalType[];
  relevance_explanation?: string;
  is_pushed: boolean;
  pushed_at?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface ContentCurationResult {
  content: CuratedContent[];
  totalFetched: number;
  totalFiltered: number;
  executionTimeMs: number;
}

// ============================================
// Engine Interfaces
// ============================================

export interface DecisionTreeEngine {
  generateNextQuestion(
    templateAnswers: Record<string, string>,
    previousDecisionAnswers: Record<string, string>
  ): Promise<DecisionTreeQuestion>;
  
  inferPhaseGoals(
    allAnswers: Record<string, string>
  ): Promise<PhaseGoal[]>;
}

export interface CalibrationEngine {
  generateDailyQuestions(
    userId: string,
    phaseGoals: PhaseGoal[],
    calibrationHistory: CalibrationRecord[]
  ): Promise<CalibrationQuestion[]>;
  
  shouldEvolve(
    consecutiveDays: number,
    progressMetrics: ProgressMetrics
  ): boolean;
}

export interface InquiryEngine {
  generateInquiry(
    userId: string,
    context: InquiryContext
  ): Promise<InquiryQuestion>;
  
  calculateOptimalTiming(
    userId: string,
    activityHistory: ActivityRecord[]
  ): Promise<InquiryTiming>;
}

// ============================================
// API Response Types
// ============================================

export interface OnboardingNextQuestionResponse {
  question: DecisionTreeQuestion;
  totalQuestions: number;
  isLastQuestion: boolean;
}

export interface GoalRecommendationResponse {
  goals: PhaseGoal[];
  metabolicProfile: MetabolicProfile;
}

export interface CalibrationGenerateResponse {
  questions: CalibrationQuestion[];
  evolutionLevel: number;
  isEvolutionDay: boolean;
}

export interface InquiryPendingResponse {
  hasInquiry: boolean;
  inquiry?: InquiryQuestion;
}
