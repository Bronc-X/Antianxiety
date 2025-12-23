# Implementation Plan

## Phase 1: Database Schema & Core Types

- [x] 1. Set up database schema and TypeScript types
  - [x] 1.1 Create Supabase migration for new tables (phase_goals, onboarding_answers, inquiry_history, user_activity_patterns, curated_feed_queue)
    - Include all RLS policies
    - Add indexes for common queries
    - _Requirements: 6.1, 6.3_
  - [x] 1.2 Create TypeScript interfaces for all data models
    - PhaseGoal, OnboardingAnswer, InquiryRecord, ActivityPattern, CuratedContent
    - _Requirements: 1.6, 2.1_
  - [x] 1.3 Write property test for Phase Goal structure
    - **Property 4: Phase Goal Generation Validity**
    - **Validates: Requirements 1.6, 2.1, 2.2**

## Phase 2: Adaptive Onboarding Flow

- [x] 2. Implement Decision Tree Engine
  - [x] 2.1 Create template questions array (exactly 3 questions)
    - Energy pattern, sleep pattern, stress tolerance
    - _Requirements: 1.2_
  - [x] 2.2 Write property test for template question count
    - **Property 1: Template Question Count Invariant**
    - **Validates: Requirements 1.2**
  - [x] 2.3 Implement AI decision tree question generator
    - Use streaming for fast response
    - Include reasoning for each question
    - _Requirements: 1.3_
  - [x] 2.4 Write property test for response time
    - **Property 3: Decision Tree Response Time**
    - **Validates: Requirements 1.3**
  - [x] 2.5 Implement question count limiter (max 7)
    - _Requirements: 1.5_
  - [x] 2.6 Write property test for total question limit
    - **Property 2: Total Question Limit**
    - **Validates: Requirements 1.5**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement Phase Goal Inference
  - [x] 4.1 Create goal inference algorithm from answers
    - Map answer patterns to goal types
    - Generate 1-2 prioritized goals
    - _Requirements: 1.6, 2.1_
  - [x] 4.2 Implement scientific citation fetcher
    - Query Semantic Scholar API for relevant papers
    - Cache citations for common goals
    - _Requirements: 2.2_
  - [x] 4.3 Create goal recommendation API endpoint
    - POST /api/onboarding/recommend-goals
    - Return goals with rationale and citations
    - _Requirements: 1.6, 2.1, 2.2_
  - [x] 4.4 Write property test for goal generation validity
    - **Property 4: Phase Goal Generation Validity**
    - **Validates: Requirements 1.6, 2.1, 2.2**

- [x] 5. Build Adaptive Onboarding UI Component
  - [x] 5.1 Create AdaptiveOnboardingFlow component
    - 3-minute countdown timer
    - Progress indicator
    - Loading state for AI questions
    - _Requirements: 1.1, 1.4_
  - [x] 5.2 Implement question transition animations
    - Smooth slide transitions
    - Subtle loading indicator
    - _Requirements: 1.4_
  - [x] 5.3 Create goal recommendation display
    - Show 1-2 goals with priority badges
    - Display rationale and citations
    - _Requirements: 2.1, 2.2_
  - [x] 5.4 Implement goal modification flow
    - AI explanation when user tries to modify
    - Confirmation dialog
    - _Requirements: 2.3, 2.4_
  - [x] 5.5 Write property test for goal modification persistence
    - **Property 6: Goal Modification Persistence**
    - **Validates: Requirements 2.4**

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Goal-Settings Synchronization

- [x] 7. Sync Phase Goals to Settings
  - [x] 7.1 Update Settings page to display Phase Goals
    - Remove manual goal selection UI
    - Show AI-recommended goals with edit option
    - _Requirements: 2.5_
  - [x] 7.2 Implement goal sync service
    - Bidirectional sync between onboarding and settings
    - _Requirements: 2.5_
  - [x] 7.3 Write property test for goal-settings sync
    - **Property 5: Goal-Settings Synchronization**
    - **Validates: Requirements 2.5**

## Phase 4: Adaptive Daily Calibration

- [x] 8. Implement Calibration Engine
  - [x] 8.1 Create anchor question definitions
    - Sleep hours (always asked)
    - Stress level (always asked)
    - _Requirements: 3.2_
  - [x] 8.2 Write property test for anchor question presence
    - **Property 8: Anchor Question Presence**
    - **Validates: Requirements 3.2**
  - [x] 8.3 Implement adaptive question generator
    - Generate questions based on Phase Goal
    - Reference previous answers for context
    - _Requirements: 3.1_
  - [x] 8.4 Write property test for goal alignment
    - **Property 7: Daily Calibration Goal Alignment**
    - **Validates: Requirements 3.1**
  - [x] 8.5 Implement 7-day evolution logic
    - Track consecutive days
    - Increment evolution level after 7 days
    - _Requirements: 3.3_
  - [x] 8.6 Write property test for evolution trigger
    - **Property 9: Seven-Day Evolution Trigger**
    - **Validates: Requirements 3.3**
  - [x] 8.7 Implement goal change detection
    - Detect when Phase Goal changes
    - Regenerate questions immediately
    - _Requirements: 3.5_
  - [x] 8.8 Write property test for goal change adaptation
    - **Property 10: Goal Change Adaptation**
    - **Validates: Requirements 3.5**

- [x] 9. Update Daily Calibration UI
  - [x] 9.1 Refactor DailyCheckin component
    - Use CalibrationEngine for questions
    - Support dynamic question types
    - _Requirements: 3.1, 3.2_
  - [x] 9.2 Add evolution indicator
    - Show current evolution level
    - Celebrate 7-day milestones
    - _Requirements: 3.3_

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: AI Active Inquiry System ✅ COMPLETE

- [x] 11. Implement Inquiry Engine
  - [x] 11.1 Create data gap analyzer
    - Identify missing or stale user data across 6 dimensions
    - Prioritize gaps by importance
    - _Requirements: 4.4_
    - **Implementation**: `lib/inquiry-engine.ts` - `detectDataGaps()`, `prioritizeGaps()`
  - [x] 11.2 Write property test for data gap prioritization
    - **Property 11: Inquiry Data Gap Prioritization**
    - **Validates: Requirements 4.4**
  - [x] 11.3 Implement inquiry question generator
    - Generate questions addressing top gaps
    - Include context from user profile
    - Multi-language support (zh, zh-TW, en)
    - _Requirements: 4.4_
    - **Implementation**: `lib/inquiry-engine.ts` - `generateQuestion()`, `INQUIRY_TEMPLATES`
  - [x] 11.4 Create activity pattern analyzer
    - Track user open times
    - Calculate optimal inquiry windows
    - _Requirements: 4.1_
    - **Implementation**: `app/api/inquiry/respond/route.ts` - Updates `user_activity_patterns`
  - [x] 11.5 Implement inquiry response handler
    - Update inquiry_history
    - Sync to daily_calibrations with value mapping
    - Update user_activity_patterns
    - _Requirements: 4.5_
    - **Implementation**: `app/api/inquiry/respond/route.ts` - 3-table sync
  - [x] 11.6 Write property test for response tracking
    - **Property 12: Inquiry Response Tracking**
    - **Validates: Requirements 4.5**
  - [x] 11.7 Implement inquiry context system
    - Extract insights from recent responses
    - Generate natural language summaries
    - **Implementation**: `lib/inquiry-context.ts` - `getInquiryContext()`, `generateInquirySummary()`

- [x] 12. Build Active Inquiry UI
  - [x] 12.1 Create ActiveInquiryBanner component
    - Display pending inquiry on app open
    - Dismissible with response options
    - Fixed positioning (bottom-right, z-index 99999)
    - Chat bubble design with Max branding
    - Multi-language support with i18n
    - Success state with animation
    - _Requirements: 4.3_
    - **Implementation**: `components/ActiveInquiryBanner.tsx`
  - [x] 12.2 Implement inquiry API endpoints
    - GET /api/inquiry/pending (with language parameter)
    - POST /api/inquiry/respond (with 3-table sync)
    - _Requirements: 4.3, 4.5_
    - **Implementation**: `app/api/inquiry/pending/route.ts`, `app/api/inquiry/respond/route.ts`
  - [x] 12.3 Add i18n translation keys
    - Translation keys for all UI text
    - **Implementation**: `lib/i18n-dict.ts` - `inquiry.*` keys

- [x] 13. Integrate Inquiry System with AI and Feed
  - [x] 13.1 Integrate inquiry context into AI chat
    - Fetch inquiry context before building user context
    - Inject inquiry summary into system prompt
    - AI guidance based on recent responses
    - **Implementation**: `app/api/chat/route.ts` - `getInquiryContext()`, `buildUserContext()`
  - [x] 13.2 Integrate inquiry context into content feed
    - Adjust tags based on sleep pattern
    - Prioritize stress management content
    - Add exercise and mood-based topics
    - **Implementation**: `app/api/curated-feed/route.ts` - Inquiry-driven adjustments
  - [x] 13.3 Create comprehensive documentation
    - System logic documentation (13 chapters)
    - UI implementation details
    - Integration guide
    - **Implementation**: `INQUIRY_SYSTEM_LOGIC.md`, `UI_LOGIC_UPDATE.md`, `INQUIRY_SYSTEM_INTEGRATION.md`

- [x] 14. Checkpoint - All inquiry system tests passing
  - ✅ All implementation complete
  - ✅ UI tested and verified
  - ✅ API endpoints functional
  - ✅ Data synchronization working
  - ✅ AI integration operational
  - ✅ Feed integration operational
  - ✅ Multi-language support verified
  - ✅ Documentation complete

## Phase 6: AI Feed Recommendations ✅ COMPLETE

- [x] 15. Implement Feed Recommendation Logic
  - [x] 15.1 Create relevance scoring algorithm
    - Score content against Phase Goals
    - Consider user engagement history
    - Inquiry-driven tag adjustments
    - _Requirements: 5.1_
    - **Implementation**: `app/api/curated-feed/route.ts` - `calculateTagRelevanceBoost()`
  - [x] 15.2 Implement recommendation selector
    - Select top content above threshold
    - Generate relevance explanation
    - _Requirements: 5.1, 5.2_
    - **Implementation**: `app/api/curated-feed/route.ts` - `buildBenefitText()`
  - [x] 15.3 Write property test for recommendation relevance
    - **Property 13: Feed Recommendation Relevance**
    - **Validates: Requirements 5.1, 5.2**
  - [x] 15.4 Implement engagement tracker
    - Track article reads
    - Update curated_feed_queue
    - _Requirements: 5.3_
  - [x] 15.5 Write property test for engagement tracking
    - **Property 14: Feed Engagement Tracking**
    - **Validates: Requirements 5.3**

- [x] 16. Integrate Recommendations with Inquiry
  - [x] 16.1 Add feed recommendation to inquiry options
    - Include recommended article in inquiry banner
    - Display relevance explanation
    - _Requirements: 5.1_
    - **Implementation**: `components/ActiveInquiryBanner.tsx` - Feed content display
  - [x] 16.2 Integrate inquiry context into feed curation
    - Adjust content based on inquiry insights
    - Prioritize topics based on user responses
    - **Implementation**: `app/api/curated-feed/route.ts` - Inquiry context integration

## Phase 7: Backend Content Curation Workflow

- [x] 16. Implement Content Curation Job
  - [x] 16.1 Create Supabase Edge Function for curation
    - Fetch content from Semantic Scholar API
    - Filter by user Phase Goals
    - _Requirements: 6.1, 6.2_
  - [x] 16.2 Implement content storage with relevance scores
    - Store in curated_feed_queue
    - Calculate and save relevance_score
    - _Requirements: 6.3_
  - [x] 16.3 Write property test for curation pipeline
    - **Property 15: Content Curation Pipeline**
    - **Validates: Requirements 6.1, 6.2, 6.3**
  - [x] 16.4 Implement inactive user detection
    - Skip users inactive for 7+ days
    - _Requirements: 6.5_
  - [x] 16.5 Write property test for inactive user handling
    - **Property 16: Inactive User Curation Reduction**
    - **Validates: Requirements 6.5**

- [x] 17. Set up Vercel Cron Scheduling (Changed from pg_cron)
  - [x] 17.1 Create Vercel Cron job for daily curation
    - `/api/cron/curate-content` runs daily at 3:00 AM UTC
    - Processes all active users with Phase Goals
    - _Requirements: 6.1_
  - [x] 17.2 Add monitoring and logging
    - Log execution metrics (processedUsers, totalContentCurated, errors)
    - Return detailed JSON response for monitoring
    - _Requirements: 6.4_

- [ ] 18. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 8: Cleanup and Integration

- [ ] 19. Remove Legacy Code
  - [x] 19.1 Remove old OnboardingFlow component
    - Replace with AdaptiveOnboardingFlow
    - _Requirements: 1.1_
  - [x] 19.2 Remove manual goal selection from Settings
    - Replace with Phase Goal display
    - _Requirements: 2.5_
  - [x] 19.3 Remove static DailyCheckin questions
    - Use CalibrationEngine exclusively
    - _Requirements: 3.1_

- [ ] 20. Final Integration Testing
  - [ ] 20.1 Test complete onboarding flow
    - Verify 3 template + up to 4 decision-tree questions
    - Verify goal generation and display
    - _Requirements: 1.1-1.6, 2.1-2.5_
  - [ ] 20.2 Test daily calibration evolution
    - Verify 7-day evolution trigger
    - Verify goal change adaptation
    - _Requirements: 3.1-3.5_
  - [ ] 20.3 Test active inquiry system
    - Verify inquiry generation and response
    - _Requirements: 4.1-4.5_
  - [ ] 20.4 Test content curation workflow
    - Verify daily curation execution
    - Verify inactive user handling
    - _Requirements: 6.1-6.5_

- [ ] 21. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
