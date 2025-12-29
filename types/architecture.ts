/**
 * MVVM Architecture Core Types
 * 
 * This file defines the foundational types for the three-layer architecture:
 * - The Brain (Server Actions): ActionResult<T>
 * - The Bridge (Domain Hooks): DomainHookReturn<T>
 * - The Skin (Presentational Components): Component Props interfaces
 * 
 * Requirements: 1.4, 7.1, 7.2, 7.6, 7.7
 */

// ============================================
// Server Action Types (The Brain)
// ============================================

/**
 * Standard return type for all Server Actions.
 * IMPORTANT: All data must be JSON-serializable (no Date, Set, Map, class instances)
 * 
 * @example
 * // Success case
 * return { success: true, data: { profile: {...} } }
 * 
 * // Error case
 * return { success: false, error: 'Please sign in to continue' }
 */
export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Helper type to extract data type from ActionResult
 */
export type ActionData<T> = T extends ActionResult<infer U> ? U : never;

// ============================================
// Domain Hook Types (The Bridge)
// ============================================

/**
 * Base interface for all Domain Hook return values.
 * All domain hooks should extend or implement this pattern.
 * 
 * Requirements: 2.3, 2.4
 */
export interface DomainHookReturn<TData, TActions extends Record<string, (...args: unknown[]) => unknown> = Record<string, never>> {
  // Core data
  data: TData | null;
  
  // Loading states
  isLoading: boolean;
  
  // Error state
  error: string | null;
  
  // Network state
  isOffline: boolean;
  
  // Actions (feature-specific)
  actions: TActions;
}

/**
 * Extended hook return with optimistic update support.
 * Use this for hooks that need instant UI feedback.
 * 
 * Requirements: 8.1, 8.2, 8.3
 */
export interface OptimisticHookReturn<TData, TActions extends Record<string, (...args: unknown[]) => unknown> = Record<string, never>> 
  extends DomainHookReturn<TData, TActions> {
  // Server-confirmed data
  data: TData | null;
  
  // UI-priority data (use this for rendering)
  optimisticData: TData | null;
  
  // Manual mutation function
  mutate: (data?: TData, shouldRevalidate?: boolean) => Promise<void>;
}

// ============================================
// Presentational Component Types (The Skin)
// ============================================

/**
 * Base props interface for presentational components.
 * All presentational components should receive hook return as props.
 */
export interface PresentationalProps<THookReturn> {
  hook: THookReturn;
}

/**
 * Device type for routing decisions
 */
export type DeviceType = 'desktop' | 'mobile';

/**
 * Props for page-level client components that handle device routing
 */
export interface DeviceRoutingProps {
  isMobile: boolean;
}

// ============================================
// Serialization Utilities
// ============================================

/**
 * Type guard to check if a value is JSON-serializable.
 * Server Actions must only return serializable data.
 * 
 * Requirements: 7.6
 */
export type JSONSerializable = 
  | string 
  | number 
  | boolean 
  | null 
  | JSONSerializable[] 
  | { [key: string]: JSONSerializable };

/**
 * Utility type to ensure an object is serializable.
 * Use this to validate Server Action return types at compile time.
 */
export type EnsureSerializable<T> = T extends JSONSerializable ? T : never;

// ============================================
// Common Data Types
// ============================================

/**
 * Unified user profile data structure.
 * Used across dashboard and profile features.
 */
export interface UnifiedProfile {
  demographics: {
    gender?: string;
    age?: number;
    bmi?: number;
  };
  health_goals: Array<{ goal_text: string; category: string }>;
  health_concerns: string[];
  lifestyle_factors: {
    sleep_hours?: number;
    exercise_frequency?: string;
    stress_level?: string;
  };
  recent_mood_trend: 'improving' | 'stable' | 'declining';
  ai_inferred_traits: Record<string, unknown>;
  last_aggregated_at: string; // ISO string, not Date
}

/**
 * Daily wellness log entry.
 */
export interface WellnessLog {
  log_date: string; // ISO string
  sleep_duration_minutes: number | null;
  mood_status: string | null;
  stress_level: number | null;
}

/**
 * Hardware/wearable data point.
 */
export interface HardwareDataPoint {
  value: number;
  source: string;
  recorded_at: string; // ISO string
}

/**
 * Aggregated hardware data from wearables.
 */
export interface HardwareData {
  hrv?: HardwareDataPoint;
  resting_heart_rate?: HardwareDataPoint;
  sleep_score?: HardwareDataPoint;
  spo2?: HardwareDataPoint;
}

// ============================================
// Dashboard-Specific Types
// ============================================

/**
 * Dashboard data returned by getDashboardData action.
 */
export interface DashboardData {
  profile: UnifiedProfile | null;
  weeklyLogs: WellnessLog[];
  hardwareData: HardwareData | null;
}

/**
 * Dashboard hook actions interface.
 */
export interface DashboardActions {
  sync: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Complete return type for useDashboard hook.
 */
export interface UseDashboardReturn {
  // Data
  profile: UnifiedProfile | null;
  weeklyLogs: WellnessLog[];
  hardwareData: HardwareData | null;
  
  // States
  isLoading: boolean;
  isSyncing: boolean;
  isOffline: boolean;
  error: string | null;
  
  // Actions
  sync: () => Promise<void>;
  refresh: () => Promise<void>;
  mutate: (data?: DashboardData, shouldRevalidate?: boolean) => Promise<void>;
}
