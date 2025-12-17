# Implementation Plan

## Phase 1: Database Schema & Core Types

- [x] 1. Set up database schema and TypeScript types


  - [x] 1.1 Create Supabase migration for new tables


    - Create `follow_up_sessions` table with RLS policies
    - Create `plan_action_items` table with RLS policies
    - Create `execution_tracking` table with RLS policies
    - Create `plan_evolution_history` table with RLS policies
    - Create `user_understanding_scores` table with RLS policies
    - Create `user_preference_profiles` table with RLS policies
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 1.2 Write property test for plan data serialization round-trip


    - **Property 17: Plan Data Round-Trip Serialization**
    - **Validates: Requirements 6.5, 6.6**

  - [x] 1.3 Create TypeScript type definitions

    - Define `FollowUpSession`, `ActionItem`, `ExecutionRecord` interfaces in `types/adaptive-plan.ts`
    - Define `AlternativeAction`, `ScientificExplanation`, `ProblemAnalysis` interfaces
    - Define `UserUnderstandingScore`, `UserPreferenceProfile` interfaces
    - Define `PlanEvolution`, `AdaptivePlan` interfaces
    - _Requirements: 4.3, 5.6_

## Phase 2: Core Services Implementation

- [x] 2. Implement Follow-up Session Service


  - [x] 2.1 Create follow-up service module


    - Create `lib/services/follow-up-service.ts`
    - Implement `scheduleSession()`, `startSession()`, `recordResponse()`, `completeSession()`
    - Implement `getMissedSessions()` for handling missed check-ins
    - _Requirements: 1.1, 1.2, 1.4, 1.5_
  - [x] 2.2 Write property test for check-in scheduling


    - **Property 1: Check-in Scheduling Correctness**
    - **Validates: Requirements 1.1, 1.2**
  - [x] 2.3 Write property test for response storage

    - **Property 2: Response Storage Completeness**
    - **Validates: Requirements 1.4**
  - [x] 2.4 Write property test for missed session handling

    - **Property 3: Missed Session Recording**
    - **Validates: Requirements 1.5**

- [x] 3. Implement Execution Tracking Service


  - [x] 3.1 Create execution tracking service module


    - Create `lib/services/execution-tracking-service.ts`
    - Implement `recordExecution()`, `getExecutionHistory()`
    - Implement `calculateExecutionRate()` with proper formula
    - Implement `flagForReplacement()`, `getItemsNeedingReplacement()`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 3.2 Write property test for execution rate calculation

    - **Property 5: Execution Rate Calculation**
    - **Validates: Requirements 2.4**
  - [x] 3.3 Write property test for consecutive failure flagging

    - **Property 6: Consecutive Failure Flagging**
    - **Validates: Requirements 2.5**
  - [x] 3.4 Write property test for execution tracking activation

    - **Property 4: Execution Tracking Activation**
    - **Validates: Requirements 2.1**

- [x] 4. Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Alternative Generation & Plan Evolution




- [x] 5. Implement Alternative Generation Service

  - [x] 5.1 Create alternative generation service module
    - Create `lib/services/alternative-generation-service.ts`
    - Implement `generateAlternatives()` using existing `/api/chat` endpoint
    - Implement `selectAlternative()` to update plan

    - Implement `trackAlternativeSuccess()` for 3-day verification
    - Integrate with `searchScientificTruth()` for scientific explanations

    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  - [x] 5.2 Write property test for alternative generation completeness

    - **Property 7: Alternative Generation Completeness**

    - **Validates: Requirements 3.2, 3.4**
  - [x] 5.3 Write property test for user preference respect
    - **Property 8: Alternative Respects User Preferences**
    - **Validates: Requirements 3.3**

- [x] 6. Implement Plan Evolution Service
  - [x] 6.1 Create plan evolution service module

    - Create `lib/services/plan-evolution-service.ts`
    - Implement `recordEvolution()` to track all plan changes
    - Implement `getEvolutionHistory()` for viewing changes
    - Implement `generateUserSummary()` after 3+ evolutions
    - Implement `getCurrentVersion()` with evolution highlights
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 6.2 Write property test for evolution history preservation
    - **Property 9: Plan Evolution History Preservation**
    - **Validates: Requirements 3.5, 5.3**

  - [x] 6.3 Write property test for established habit marking
    - **Property 13: Established Habit Marking**
    - **Validates: Requirements 5.2**
  - [x] 6.4 Write property test for user summary generation

    - **Property 14: User Summary Generation**
    - **Validates: Requirements 5.4**

- [x] 7. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Scientific Explanation & Plan Generation

- [x] 8. Implement Scientific Explanation Generator


  - [x] 8.1 Create scientific explanation generator


    - Create `lib/services/scientific-explanation-service.ts`
    - Implement `generateScientificExplanation()` with 4 domains (physiology, neurology, psychology, behavioral_science)
    - Implement `generateProblemAnalysis()` for root cause analysis
    - Integrate with existing `searchScientificTruth()` for citations
    - _Requirements: 4.1, 4.4_
  - [x] 8.2 Write property test for scientific explanation completeness

    - **Property 10: Scientific Explanation Completeness**
    - **Validates: Requirements 4.1, 4.4**

- [x] 9. Implement Detailed Plan Generator


  - [x] 9.1 Create detailed plan generator


    - Create `lib/services/detailed-plan-generator.ts`
    - Implement `generateDetailedPlan()` with minimum 5 action items
    - Implement `createActionItem()` with all required fields
    - Ensure each action item has: timing, duration, steps, expected_outcome, scientific_rationale
    - _Requirements: 4.2, 4.3_
  - [x] 9.2 Write property test for minimum action items

    - **Property 11: Minimum Action Items**
    - **Validates: Requirements 4.2**

  - [x] 9.3 Write property test for action item field completeness
    - **Property 12: Action Item Field Completeness**
    - **Validates: Requirements 4.3**


- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Understanding Score System

- [x] 11. Implement User Understanding Score Service


  - [x] 11.1 Create understanding score service module


    - Create `lib/services/understanding-score-service.ts`
    - Implement `calculateScore()` with 4 weighted components (25% each)
    - Implement `updateFromExecution()`, `updateFromFeedback()`, `updateFromReplacement()`
    - Implement `getScoreHistory()` for trend tracking
    - Implement `isDeepUnderstandingAchieved()` for 95+ threshold check
    - _Requirements: 5.6, 5.7, 5.8, 5.9_
  - [x] 11.2 Write property test for understanding score calculation

    - **Property 15: Understanding Score Calculation**
    - **Validates: Requirements 5.6, 5.9**
  - [x] 11.3 Write property test for deep understanding threshold

    - **Property 16: Deep Understanding Threshold**
    - **Validates: Requirements 5.8**

- [x] 12. Implement User Preference Profile Service

  - [x] 12.1 Create preference profile service module

    - Create `lib/services/preference-profile-service.ts`
    - Implement `updatePreferences()` from execution and feedback data
    - Implement `getAvoidedActivities()` for alternative filtering
    - Implement `getSuccessfulPatterns()` for recommendation optimization
    - Integrate with existing `ai_memory` system via `storeMemory()`
    - _Requirements: 3.3, 5.1_


- [x] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: API Endpoints

- [x] 14. Create API endpoints for follow-up system

  - [x] 14.1 Create follow-up session API


    - Create `app/api/follow-up/route.ts` for session management
    - Implement GET for fetching pending sessions
    - Implement POST for starting/completing sessions
    - Implement PATCH for recording responses
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 14.2 Create execution tracking API

    - Create `app/api/execution-tracking/route.ts`
    - Implement POST for recording execution status
    - Implement GET for fetching execution history
    - Implement PATCH for marking items for replacement
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 14.3 Create alternative generation API
    - Create `app/api/alternatives/route.ts`
    - Implement POST for generating alternatives for selected items
    - Implement PATCH for selecting an alternative
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [x] 14.4 Create understanding score API
    - Create `app/api/understanding-score/route.ts`
    - Implement GET for fetching current score and history
    - _Requirements: 5.6, 5.8_

- [x] 15. Create cron job for scheduled check-ins

  - [x] 15.1 Implement check-in scheduler

    - Create `app/api/cron/follow-up-scheduler/route.ts`
    - Implement morning check-in scheduling (9:00-10:00)
    - Implement evening check-in scheduling (20:00-21:00)
    - Handle timezone considerations
    - _Requirements: 1.1, 1.2_

## Phase 7: Frontend Components

- [x] 16. Create Follow-up Session UI


  - [x] 16.1 Create follow-up session modal component


    - Create `components/FollowUpSessionModal.tsx`
    - Integrate with existing `AIAssistantChat` for conversation
    - Display action items with checkboxes for replacement marking
    - Show execution status options (completed/partial/skipped/replace)
    - Use California Calm design (Sand/Clay/Sage colors)
    - _Requirements: 1.3, 2.2, 3.1_
  - [x] 16.2 Create follow-up notification banner

    - Create `components/FollowUpNotificationBanner.tsx`
    - Display pending check-in notification
    - Allow user to start or snooze session
    - _Requirements: 1.1, 1.2_

- [x] 17. Update Plan Dashboard UI


  - [x] 17.1 Enhance PlanListWithActions component

    - Update `components/PlanListWithActions.tsx`
    - Add action item checkboxes for replacement marking
    - Display execution rate and understanding score
    - Show plan evolution history with highlights
    - Display "Deep Understanding Achieved" badge when score >= 95
    - _Requirements: 2.4, 3.1, 5.5, 5.8_
  - [x] 17.2 Create action item detail view

    - Create `components/ActionItemDetail.tsx`
    - Display full scientific explanation (4 domains)
    - Show step-by-step instructions
    - Display execution history for the item
    - _Requirements: 4.3, 4.5_


- [x] 18. Create Alternative Selection UI

  - [x] 18.1 Create alternative selection modal
    - Create `components/AlternativeSelectionModal.tsx`
    - Display 3+ alternatives with similarity scores
    - Show scientific rationale for each alternative
    - Explain why each alternative may fit better
    - _Requirements: 3.2, 3.4_

- [x] 19. Create Understanding Score Display

  - [x] 19.1 Create understanding score widget
    - Create `components/UnderstandingScoreWidget.tsx`
    - Display current score with progress bar to 95
    - Show score breakdown (4 components)
    - Display "Deep Understanding Achieved" celebration when >= 95
    - _Requirements: 5.6, 5.8_

## Phase 8: Integration & Polish

- [x] 20. Integrate with existing chat system


  - [x] 20.1 Extend chat API for follow-up context

    - Update `app/api/chat/route.ts` to handle `followUpContext`
    - Inject follow-up system prompt extension when in session
    - Store follow-up responses in both `ai_conversations` and `follow_up_sessions`
    - _Requirements: 1.3, 1.4_

  - [x] 20.2 Update AIAssistantChat for follow-up mode
    - Update `components/AIAssistantChat.tsx` to support follow-up mode
    - Add action item tracking UI within chat
    - Display execution options inline
    - _Requirements: 1.3, 2.2_


- [x] 21. Add i18n translations

  - [x] 21.1 Add Chinese translations

    - Update `lib/i18n-dict.ts` with follow-up related strings
    - Add translations for: session types, execution statuses, score labels
    - _Requirements: All UI requirements_


- [x] 22. Final Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

