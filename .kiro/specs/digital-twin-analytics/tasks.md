# Implementation Plan: Digital Twin AI Analytics

## Overview

实现数字孪生 AI 分析系统，整合用户多维度数据，通过 LLM 和 Semantic Scholar API 生成个性化健康分析、预测和自适应计划。

## Tasks

- [x] 1. Set up database schema and types
  - [x] 1.1 Create digital_twin_analyses table migration
    - Create `supabase/migrations/YYYYMMDD_digital_twin_analytics.sql`
    - Include digital_twin_analyses and analysis_history tables
    - Add RLS policies for data isolation
    - _Requirements: 9.1, 9.2_
  - [x] 1.2 Create TypeScript types for digital twin
    - Create `types/digital-twin.ts`
    - Define interfaces: AggregatedUserData, PhysiologicalAssessment, LongitudinalPredictions, AdaptivePlan, DashboardData
    - _Requirements: 2.5, 3.1, 3.3_

- [x] 2. Implement Data Aggregator
  - [x] 2.1 Create data aggregator module
    - Create `lib/digital-twin/data-aggregator.ts`
    - Implement aggregateUserData() to collect from profiles, daily_calibrations, chat_messages
    - Implement getCalibrationTrend() for time-series analysis
    - _Requirements: 1.1, 1.2, 1.3, 1.5_
  - [x] 2.2 Write property tests for data aggregator
    - **Property 1: Baseline Data Storage Round-Trip**
    - **Property 2: Calibration Data Append Invariant**
    - **Property 3: Timeline Ordering**
    - **Validates: Requirements 1.1, 1.2, 1.5**

- [x] 3. Implement LLM Analyzer
  - [x] 3.1 Create LLM analyzer module
    - Create `lib/digital-twin/llm-analyzer.ts`
    - Implement buildAnalysisPrompt() with structured user data
    - Implement analyzeWithLLM() calling Claude API
    - Implement parseAnalysisResponse() for structured output
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 3.2 Integrate Semantic Scholar for scientific grounding
    - Use existing `lib/services/semantic-scholar.ts`
    - Add health-specific keyword extraction
    - Include paper citations in analysis prompt
    - _Requirements: 3.5 (scientific basis)_
  - [x] 3.3 Write property tests for LLM analyzer
    - **Property 4: Analysis Threshold Enforcement**
    - **Property 5: Prediction Confidence Intervals**
    - **Validates: Requirements 2.1, 2.5, 2.6**

- [x] 4. Implement Prediction Engine
  - [x] 4.1 Create prediction engine module
    - Create `lib/digital-twin/prediction-engine.ts`
    - Implement generatePredictions() for 6 timepoints
    - Implement calculateMilestones() based on registration date
    - Calculate confidence intervals for all metrics
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 4.2 Write property tests for prediction engine
    - **Property 6: Prediction Timepoint Completeness**
    - **Property 7: Metric Completeness**
    - **Property 9: Timeline Milestone Consistency**
    - **Validates: Requirements 3.1, 3.3, 4.1, 4.2, 4.3, 4.5**

- [x] 5. Implement Adaptive Planner
  - [x] 5.1 Create adaptive planner module
    - Create `lib/digital-twin/adaptive-planner.ts`
    - Implement generateAdaptivePlan() based on assessment
    - Include daily focus, breathing exercises, sleep recommendations
    - Reference scientific papers for rationale
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Implement Dashboard Generator
  - [x] 6.1 Create dashboard generator module
    - Create `lib/digital-twin/dashboard-generator.ts`
    - Implement generateDashboardData() transforming analysis to UI data
    - Include participant info, prediction table, timeline, charts
    - Calculate summary statistics
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.2, 6.4_
  - [x] 6.2 Write property tests for dashboard generator
    - **Property 8: Baseline Display Completeness**
    - **Property 10: Summary Statistics Presence**
    - **Property 11: Participant Metadata Completeness**
    - **Validates: Requirements 5.1, 5.2, 5.4, 6.2, 6.4, 8.1, 8.2, 8.3**

- [x] 7. Checkpoint - Core modules complete
  - Ensure all core modules compile without errors
  - Run existing tests to verify no regressions
  - Ask the user if questions arise

- [x] 8. Implement API Routes
  - [x] 8.1 Create analyze API endpoint
    - Create `app/api/digital-twin/analyze/route.ts`
    - Implement POST handler for triggering analysis
    - Include rate limiting (max 1 full analysis per 6 hours)
    - Store results in digital_twin_analyses table
    - _Requirements: 7.1, 7.2_
  - [x] 8.2 Create dashboard API endpoint
    - Create `app/api/digital-twin/dashboard/route.ts`
    - Implement GET handler for fetching dashboard data
    - Return cached data if fresh, trigger re-analysis if stale
    - _Requirements: 7.2, 7.3, 7.4_
  - [x] 8.3 Write property tests for API security
    - **Property 13: Data Isolation (RLS)**
    - **Property 14: Prompt Confidentiality**
    - **Validates: Requirements 9.1, 9.2, 9.3**

- [x] 9. Implement Privacy Controls
  - [x] 9.1 Add medical history consent check
    - Modify dashboard generator to check consent flag
    - Exclude sensitive data when consent not granted
    - _Requirements: 8.4_
  - [x] 9.2 Write property test for privacy
    - **Property 12: Medical History Privacy**
    - **Validates: Requirements 8.4**

- [x] 10. Update Frontend Component
  - [ ] 10.1 Refactor ParticipantDigitalTwin to use real data
    - Update `components/unlearn/ParticipantDigitalTwin.tsx`
    - Replace static data with API calls to `/api/digital-twin/dashboard`
    - Add loading and error states
    - Show "collecting data" state when insufficient data
    - _Requirements: 2.6, 7.2, 7.3, 7.4_
  - [ ] 10.2 Add data refresh trigger
    - Trigger re-analysis after daily calibration completion
    - Show "Analyzing..." indicator during refresh
    - _Requirements: 7.1_

- [ ] 11. Final Checkpoint - Integration complete
  - Run all property tests
  - Verify end-to-end flow: Questionnaire → Calibrations → Analysis → Dashboard
  - Ensure all tests pass, ask the user if questions arise

## Notes

- All tasks are required for comprehensive testing
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The system uses existing Semantic Scholar integration from `lib/services/semantic-scholar.ts`
- LLM calls use the existing AI model configuration from `lib/ai/model-config.ts`
