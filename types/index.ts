/**
 * Types Index
 * Central export point for all public TypeScript types
 * Requirements: 6.5
 */

// ============================================
// Existing Application Types
// ============================================

// AI Assistant types
export type {
  RoleType,
  AIAnalysisResult,
  MicroHabit,
  AIRecommendationPlan,
  AIAssistantProfile,
  ConversationRow,
} from './assistant';

// Logic/State types
export type {
  UserMode,
  TaskType,
  PrimaryConcern,
  EnrichedDailyLog,
  UserStateAnalysis,
  RecommendedTask,
} from './logic';

// ============================================
// Capacitor Migration Types
// ============================================

// Platform types
export type Platform = 'web' | 'android' | 'ios';

// Motion Component Props
export type {
  MotionButtonProps,
  PageTransitionProps,
  StaggerListProps,
  BreathingBackgroundProps,
} from '@/components/motion';

// Layout Component Props
export type { GlassCardProps } from '@/components/layout';

// Lottie Component Props
export type { LoadingAnimationProps } from '@/components/lottie/LoadingAnimation';
export type { SuccessAnimationProps } from '@/components/lottie/SuccessAnimation';
export type { EmptyStateAnimationProps, EmptyStateType } from '@/components/lottie/EmptyStateAnimation';

// Capacitor Hooks Types
export type {
  UseLottieOptions,
  UseLottieReturn,
  UseHapticsReturn,
  UsePreferencesReturn,
  UseNetworkReturn,
  NetworkStatus,
} from '@/hooks';

// Re-export Capacitor types for convenience
export { ImpactStyle, NotificationType } from '@/hooks';
export type { ConnectionType } from '@capacitor/network';

// ============================================
// Animation Types
// ============================================

/**
 * Animation size variants used across components
 */
export type AnimationSize = 'sm' | 'md' | 'lg';

/**
 * Button variant types for MotionButton
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive';

/**
 * Button size types for MotionButton
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

// ============================================
// Theme Types
// ============================================

/**
 * Theme mode for the application
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Color scheme CSS variables
 */
export interface ColorScheme {
  primary: string;
  background: string;
  accent: string;
  foreground: string;
  card: string;
  cardForeground: string;
  border: string;
  ring: string;
}
