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
export type { UsePlansReturn, PlanData, CreatePlanInput } from './usePlans';

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
export type { UseCalibrationReturn, CalibrationData, CalibrationInput } from './useCalibration';

// Feed
export { useFeed } from './useFeed';
export type { UseFeedReturn, FeedItem, FeedFilters } from './useFeed';

// Onboarding
export { useOnboarding } from './useOnboarding';
export type { UseOnboardingReturn, OnboardingProgress, OnboardingData } from './useOnboarding';

// Assessment
export { useAssessment } from './useAssessment';
export type { UseAssessmentReturn, AssessmentType, AssessmentQuestion, AssessmentResult, AssessmentResponse } from './useAssessment';

// Analysis
export { useAnalysis } from './useAnalysis';
export type { UseAnalysisReturn, AnalysisReport, TrendData } from './useAnalysis';

// Profile
export { useProfile } from './useProfile';
export type { UseProfileReturn, UserProfile, UpdateProfileInput } from './useProfile';

// Auth
export { useAuth } from './useAuth';
export type { UseAuthReturn } from './useAuth';
