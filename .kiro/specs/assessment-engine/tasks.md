# Implementation Plan

## Phase 1: Foundation & Data Layer

- [x] 1. Set up database schema and types


  - [x] 1.1 Create Supabase migration for assessment_sessions table

    - Include id, user_id, phase, demographics, chief_complaint, symptoms, history, language, country_code, status, timestamps
    - _Requirements: 8.1, 8.2_

  - [x] 1.2 Create Supabase migration for assessment_reports table
    - Include id, session_id, user_id, conditions, urgency, next_steps, pdf_url, timestamps

    - _Requirements: 8.3_
  - [x] 1.3 Create RLS policies for both tables
    - Users can only access their own sessions and reports
    - _Requirements: 8.4_

  - [x] 1.4 Create TypeScript types and Zod schemas

    - AssessmentSession, AssessmentReport, Demographics, AnswerRecord types
    - AssessmentRequestSchema, AssessmentResponseSchema (discriminated union)
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [ ]* 1.5 Write property test for schema validation
    - **Property 7: API Response Schema Compliance**
    - **Property 13: Request Validation Strictness**
    - **Validates: Requirements 4.2, 6.1, 6.2, 6.3, 6.4, 6.5, 6.7**

- [x] 2. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: Core Assessment Engine

- [x] 3. Implement session management


  - [x] 3.1 Create /api/assessment/start endpoint


    - Generate unique session_id, initialize phase to "baseline"
    - Query The Brain for existing user health profile
    - Return first baseline question
    - _Requirements: 1.1, 1.2, 12.1, 12.2_

  - [x] 3.2 Create session restoration logic
    - Check for active sessions on start
    - Restore session state and continue from last question
    - Handle expired sessions (24 hour timeout)
    - _Requirements: 1.3, 1.4_
  - [ ]* 3.3 Write property tests for session management
    - **Property 1: Session Creation Uniqueness and Persistence**
    - **Property 2: Session State Round-Trip Consistency**
    - **Property 3: Session Expiration Correctness**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 8.1**

- [x] 4. Implement Red Flag Protocol


  - [x] 4.1 Create red flag pattern matcher


    - Define RED_FLAG_PATTERNS constant with cardiac, stroke, anaphylaxis patterns
    - Implement pattern matching logic with min_matches threshold
    - _Requirements: 9.6_
  - [x] 4.2 Create emergency response handler

    - Trigger emergency step_type when pattern detected
    - Set session status to "emergency_triggered"
    - Get emergency number based on country_code
    - _Requirements: 9.1, 9.2_

  - [x] 4.3 Create audit logging for red flag events
    - Log session_id, detected_pattern, timestamp, symptom data
    - _Requirements: 9.4_
  - [ ]* 4.4 Write property tests for Red Flag Protocol
    - **Property 10: Red Flag Protocol Trigger**
    - **Property 15: Red Flag Audit Logging**
    - **Validates: Requirements 4.9, 9.1, 9.2, 9.4**

- [x] 5. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: AI Question Generation

- [x] 6. Implement AI-driven question generation



  - [x] 6.1 Create /api/assessment/next endpoint

    - Accept session_id and answer
    - Update session history with new answer
    - Call AI to generate next question or report
    - _Requirements: 4.1, 4.7_

  - [x] 6.2 Create AI prompt template for question generation
    - Include demographics, chief_complaint, history context
    - Enforce structured JSON output with Zod schema
    - Support zh/en language output

    - _Requirements: 4.2, 10.2_
  - [x] 6.3 Implement termination conditions
    - Check question count >= 12 or AI confidence >= 80%

    - Transition to report phase when conditions met
    - _Requirements: 4.8_
  - [x] 6.4 Implement question type constraints
    - Ensure single_choice has 2-6 options with "I don't know"
    - Validate all question types have required fields
    - _Requirements: 4.3_
  - [x]* 6.5 Write property tests for question generation



    - **Property 8: Single Choice Option Constraints**
    - **Property 9: Assessment Termination Conditions**
    - **Validates: Requirements 4.3, 4.8**


- [x] 7. Implement phase transitions
  - [x] 7.1 Create baseline to chief_complaint transition

    - Validate all required baseline questions answered
    - Update session phase
    - _Requirements: 2.4_
  - [x] 7.2 Create chief_complaint to differential transition
    - Validate symptoms confirmed
    - Update session phase
    - _Requirements: 3.4_
  - [x] 7.3 Create symptom search and suggestion

    - Implement fuzzy search for symptom terms
    - Return related symptoms for confirmation
    - _Requirements: 3.2, 3.3_
  - [x]* 7.4 Write property tests for phase transitions




    - **Property 4: Phase Transition Completeness**
    - **Property 5: Symptom Search Relevance**
    - **Property 6: History Accumulation Invariant**


    - **Validates: Requirements 2.4, 3.2, 3.3, 3.4, 4.7, 8.2**

- [x] 8. Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Report Generation

- [x] 9. Implement report generation
  - [x] 9.1 Create /api/assessment/report endpoint
    - Generate structured report from session history
    - Rank conditions by probability
    - Mark best match condition
    - _Requirements: 5.1, 5.2_
  - [x] 9.2 Create report content generator
    - Include condition name, description, matched_symptoms, probability
    - Categorize urgency (emergency/urgent/routine/self_care)
    - Generate next_steps recommendations
    - _Requirements: 5.3, 5.4_
  - [x] 9.3 Store report and update session
    - Persist report to assessment_reports table
    - Mark session as "complete"
    - Store to The Brain memory system
    - _Requirements: 1.5, 8.3, 12.3_
  - [ ]* 9.4 Write property tests for report generation
    - **Property 11: Report Ranking Invariant**
    - **Property 12: Report Completeness**
    - **Property 17: Brain Integration Data Flow**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 12.3**

- [x] 10. Implement PDF export
  - [x] 10.1 Create /api/assessment/export endpoint
    - Generate PDF from report data
    - Apply Bio-Ledger branding (Sand, Clay, Sage colors)
    - Include disclaimer
    - _Requirements: 11.1, 11.2, 11.3, 11.5_
  - [x] 10.2 Implement email delivery
    - Send PDF to user's registered email
    - _Requirements: 11.4_





- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.


## Phase 5: Frontend Components

- [x] 12. Create assessment page structure
  - [x] 12.1 Create /app/assessment/page.tsx

    - Implement state machine for phase management
    - Handle session creation and restoration
    - _Requirements: 1.1, 1.3_

  - [x] 12.2 Create AssessmentProvider context
    - Manage session state, current question, history

    - Handle API calls and error states
    - _Requirements: 6.5_


- [x] 13. Create question components
  - [x] 13.1 Create WelcomeScreen component
    - Bio-Ledger branded intro with Continue button
    - Calm aesthetic with Sand/Sage colors
    - _Requirements: 7.6_
  - [x] 13.2 Create SingleChoiceQuestion component
    - Large tappable buttons with optional icons
    - Framer Motion animations
    - Haptic feedback on mobile
    - _Requirements: 7.1_
  - [x] 13.3 Create MultipleChoiceQuestion component
    - Checkboxes with title and description
    - "Add a symptom" button for chief_complaint phase

    - _Requirements: 7.2, 3.5_
  - [x] 13.4 Create BooleanQuestion component
    - Yes/No large buttons with icons

    - _Requirements: 7.3_
  - [x] 13.5 Create ScaleQuestion component
    - 1-10 slider with labeled endpoints
    - _Requirements: 7.4_

  - [x] 13.6 Create ProgressBar component
    - Show progress percentage at top of screen
    - Smooth animation on progress change

    - _Requirements: 7.7_


- [x] 14. Create voice input component




  - [x] 14.1 Create VoiceInputButton component



    - Microphone button with recording state indicator
    - Use Web Speech API for transcription


    - Support zh-CN and en-US languages
    - _Requirements: Voice Input Support_




  - [ ] 14.2 Integrate voice input with symptom search
    - Convert voice transcript to symptom search query

    - Show interim results while speaking


    - _Requirements: 3.1, 3.2_

- [-] 15. Create report components

  - [x] 15.1 Create ReportView component
    - Display conditions with "Best match" badge

    - Show matched symptoms as tags
    - Display probability percentage with visual bar
    - _Requirements: 7.5, 5.2, 5.3_
  - [x] 15.2 Create ConditionCard component
    - Condition name, description, probability
    - Expandable "Show more" for full description

    - _Requirements: 5.3_
  - [x] 15.3 Create NextStepsSection component
    - Display urgency-based recommendations
    - Action buttons for each step
    - _Requirements: 5.4_
  - [x] 15.4 Create ExportOptions component
    - Download PDF button
    - Email report option
    - _Requirements: 11.1, 11.4_

- [x] 16. Create emergency alert component
  - [x] 16.1 Create EmergencyAlert component
    - Full-screen red alert overlay
    - Clear emergency instructions
    - One-tap call button with dynamic emergency number
    - Dismiss with confirmation (logged)
    - _Requirements: 9.3, 9.5_

- [x] 17. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: Integration & Polish

- [x] 18. Integrate with The Brain
  - [x] 18.1 Query existing health profile on session start
    - Pre-fill baseline questions if data exists
    - Show confirmation UI for pre-filled data
    - _Requirements: 12.1, 12.2_
  - [x] 18.2 Store assessment results to memory
    - Generate embedding for assessment summary
    - Store with metadata (type, date, conditions, urgency)
    - _Requirements: 12.3_
  - [x] 18.3 Show historical context in report
    - Query previous assessments with similar symptoms
    - Display "You reported similar symptoms X months ago" if relevant
    - _Requirements: 12.4, 12.5_

- [x] 19. Implement multi-language support
  - [x] 19.1 Create language detection and selection
    - Detect from browser/app settings
    - Allow manual language switch
    - _Requirements: 10.1, 10.5_
  - [x] 19.2 Create localization strings
    - UI labels, buttons, instructions in zh/en
    - Error messages in both languages
    - _Requirements: 10.3_
  - [ ]* 19.3 Write property test for language consistency
    - **Property 16: Language Output Consistency**
    - **Validates: Requirements 10.2, 10.4**

- [ ] 20. Final integration and testing
  - [ ] 20.1 End-to-end flow testing
    - Test complete assessment flow from welcome to report
    - Test emergency flow with red flag patterns
    - Test session restoration
  - [ ]* 20.2 Write integration tests
    - API endpoint integration tests
    - Database operation tests
    - The Brain integration tests
  - [ ]* 20.3 Write property test for RLS
    - **Property 14: Row Level Security Enforcement**
    - **Validates: Requirements 8.4**

- [ ] 21. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
