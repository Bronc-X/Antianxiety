/**
 * Domain Hooks Barrel Export
 * 
 * Central export point for all MVVM domain hooks.
 * These hooks form "The Bridge" layer of the MVVM architecture.
 */

// Dashboard
export { useDashboard } from './useDashboard';

// Plans
export { usePlans } from './usePlans';
export type { UsePlansReturn, PlanData, CreatePlanInput, PlanItem } from './usePlans';


// Goals
export { useGoals } from './useGoals';
export type { UseGoalsReturn, PhaseGoal, CreateGoalInput } from './useGoals';

// Settings
export { useSettings } from './useSettings';
export type { UseSettingsReturn, SettingsData } from './useSettings';

// Max (AI Chat)
export { useMax } from './useMax';
export type { UseMaxReturn, ChatMessage, Conversation, LocalMessage } from './useMax';

// Calibration
export { useCalibration } from './useCalibration';
export type { UseCalibrationReturn, CalibrationStep } from './useCalibration';

// Calibration Log
export { useCalibrationLog } from './useCalibrationLog';
export type { UseCalibrationLogReturn, CalibrationData, CalibrationInput } from './useCalibrationLog';

// Feed
export { useFeed } from './useFeed';
export type { UseFeedReturn, FeedItem, FeedFilters, FeedFeedbackInput } from './useFeed';

// Curated Feed
export { useCuratedFeed } from './useCuratedFeed';
export type { UseCuratedFeedReturn } from './useCuratedFeed';

// Onboarding
export { useOnboarding } from './useOnboarding';
export type { UseOnboardingReturn, OnboardingProgress, OnboardingData } from './useOnboarding';

// Adaptive Onboarding
export { useAdaptiveOnboarding } from './useAdaptiveOnboarding';
export type { UseAdaptiveOnboardingReturn } from './useAdaptiveOnboarding';

// Phase Goals
export { usePhaseGoals } from './usePhaseGoals';
export type { UsePhaseGoalsReturn } from './usePhaseGoals';

// Assessment
export { useAssessment } from './useAssessment';
export type { UseAssessmentReturn } from './useAssessment';

// Assessment Library
export { useAssessmentLibrary } from './useAssessmentLibrary';
export type { UseAssessmentLibraryReturn, AssessmentType, AssessmentQuestion, AssessmentResult, AssessmentResponse } from './useAssessmentLibrary';

// Assessment Report
export { useAssessmentReport } from './useAssessmentReport';
export type { UseAssessmentReportReturn } from './useAssessmentReport';

// Analysis
export { useAnalysis } from './useAnalysis';
export type { UseAnalysisReturn, AnalysisReport, TrendData } from './useAnalysis';

// Profile
export { useProfile } from './useProfile';
export type { UseProfileReturn, UserProfile, UpdateProfileInput, SaveHealthProfileInput } from './useProfile';

// Profile Maintenance
export { useProfileMaintenance } from './useProfileMaintenance';
export type { UseProfileMaintenanceReturn } from './useProfileMaintenance';

// Auth
export { useAuth } from './useAuth';
export type { UseAuthReturn } from './useAuth';

// Auth Providers
export { useAuthProviders } from './useAuthProviders';
export type { UseAuthProvidersReturn } from './useAuthProviders';

// Insight
export { useInsight } from './useInsight';
export type { UseInsightReturn } from './useInsight';

// Understanding Score
export { useUnderstandingScore } from './useUnderstandingScore';
export type { UseUnderstandingScoreReturn } from './useUnderstandingScore';

// Deep Inference
export { useDeepInference } from './useDeepInference';
export type { UseDeepInferenceReturn } from './useDeepInference';

// Voice Analysis
export { useVoiceAnalysis } from './useVoiceAnalysis';
export type { UseVoiceAnalysisReturn } from './useVoiceAnalysis';

// Inquiry
export { useInquiry } from './useInquiry';
export type { UseInquiryReturn } from './useInquiry';

// Chat AI
export { useChatAI } from './useChatAI';
export type { UseChatAIReturn } from './useChatAI';

// AI Conversations
export { useAiConversation } from './useAiConversation';
export type { UseAiConversationReturn } from './useAiConversation';

// Chat Conversations
export { useChatConversation } from './useChatConversation';
export type { UseChatConversationReturn } from './useChatConversation';

// Assistant Profile
export { useAssistantProfile } from './useAssistantProfile';
export type { UseAssistantProfileReturn } from './useAssistantProfile';

// Max API
export { useMaxApi } from './useMaxApi';
export type { UseMaxApiReturn } from './useMaxApi';

// Wearables
export { useWearables } from './useWearables';
export type { UseWearablesReturn } from './useWearables';

// Beta Signup
export { useBetaSignup } from './useBetaSignup';
export type { UseBetaSignupReturn } from './useBetaSignup';

// Debug Session
export { useDebugSession } from './useDebugSession';
export type { UseDebugSessionReturn } from './useDebugSession';

// Bayesian History
export { useBayesianHistory } from './useBayesianHistory';
export type { UseBayesianHistoryReturn } from './useBayesianHistory';

// Bayesian Nudge
export { useBayesianNudgeAction } from './useBayesianNudgeAction';
export type { UseBayesianNudgeActionReturn } from './useBayesianNudgeAction';

// Habits
export { useHabits } from './useHabits';
export type { UseHabitsReturn, HabitData, HabitCreateInput } from './useHabits';

// Daily Questionnaire
export { useDailyQuestionnaire } from './useDailyQuestionnaire';
export type { UseDailyQuestionnaireReturn, DailyQuestionnaireSummary, DailyQuestionnaireResponse, SaveDailyQuestionnaireInput } from './useDailyQuestionnaire';

// AI Reminders
export { useAiReminders } from './useAiReminders';
export type { UseAiRemindersReturn, AiReminder } from './useAiReminders';

// Scale Calibration
export { useScaleCalibration } from './useScaleCalibration';
export type { UseScaleCalibrationReturn, WeeklyCalibrationInput, MonthlyCalibrationInput } from './useScaleCalibration';

// Digital Twin Curve
export { useDigitalTwinCurve, getCurrentWeekIndex, getMetricPredictions, getCurrentMilestone, getNextMilestone, getDataQualityStatus } from './useDigitalTwinCurve';
export type { UseDigitalTwinCurveReturn, CurveApiResponse } from './useDigitalTwinCurve';

// Ask Max Explain (Recommendation Explanations)
export { useAskMaxExplain } from './useAskMaxExplain';
export type { UseAskMaxExplainReturn, AskMaxParams, AskMaxState } from './useAskMaxExplain';

