/**
 * Domain Hooks (The Bridge)
 * 
 * This directory contains domain-specific hooks that:
 * - Call Server Actions for data operations
 * - Manage loading, error, and offline states
 * - Provide a typed interface for presentational components
 * 
 * Rules:
 * - NO UI-specific code (no JSX, no styling)
 * - NO platform-specific logic
 * - All hooks must return DomainHookReturn pattern
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

// Export domain hooks
export { useDashboard } from './useDashboard';
// export { useCalibration } from './useCalibration';
// export { usePlans } from './usePlans';

// Re-export types for convenience
export type {
  DomainHookReturn,
  OptimisticHookReturn,
  UseDashboardReturn,
} from '@/types/architecture';
