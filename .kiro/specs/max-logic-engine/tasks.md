# Implementation Plan

- [x] 1. Set up database schema and types


  - [x] 1.1 Add ai_settings JSONB column to profiles table


    - Execute SQL to add column with default values
    - _Requirements: 1.1_

  - [x] 1.2 Create belief_sessions table with RLS

    - Create table with all required columns and constraints
    - Enable RLS and create user isolation policy
    - _Requirements: 6.1, 6.2_
  - [x] 1.3 Create TypeScript types for Max


    - Create `types/max.ts` with AISettings, BeliefSession, Paper interfaces
    - _Requirements: 1.1, 3.1_

- [x] 2. Implement Settings Validator


  - [x] 2.1 Create settings validator module


    - Create `lib/max/settings-validator.ts`
    - Implement validateAISettings() with range constraints
    - Implement getDefaultSettings()
    - _Requirements: 1.3, 1.4, 1.5_
  - [x] 2.2 Write property test for settings validation


    - **Property 1: Settings Value Validation**
    - **Validates: Requirements 1.3, 1.4**
  - [x] 2.3 Write property test for mode enum validation

    - **Property 3: Mode Enum Validation**


    - **Validates: Requirements 1.5**

- [x] 3. Implement Bayesian Engine

  - [x] 3.1 Create Bayesian engine module

    - Create `lib/max/bayesian-engine.ts`
    - Implement calculatePosterior() with formula: (Prior × Likelihood) / Evidence
    - Implement calculateEvidenceWeight() with 0.1-0.9 bounds
    - _Requirements: 3.2, 3.3, 3.4_

  - [x] 3.2 Write property test for Bayesian formula

    - **Property 4: Bayesian Formula Correctness**
    - **Validates: Requirements 3.2, 3.4**
  - [x] 3.3 Write property test for evidence weight bounds

    - **Property 5: Evidence Weight Bounds**
    - **Validates: Requirements 3.3**

- [x] 4. Implement Max Response Generator



  - [x] 4.1 Create response generator module

    - Create `lib/max/response-generator.ts`
    - Implement generateResponse() with settings-aware tone
    - Implement validatePhrases() for forbidden/approved phrase checking
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [x] 4.2 Write property test for phrase compliance


    - **Property 6: Max Phrase Compliance**
    - **Validates: Requirements 5.3, 5.4**
  - [x] 4.3 Write property test for TARS mode brevity

    - **Property 9: TARS Mode Brevity**
    - **Validates: Requirements 5.5**

- [x] 5. Checkpoint - Ensure all core logic tests pass


  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Create API Routes


  - [x] 6.1 Create settings API route


    - Create `app/api/max/settings/route.ts`
    - Implement GET to fetch user's ai_settings
    - Implement PATCH to update ai_settings
    - _Requirements: 1.2, 2.5_
  - [x] 6.2 Write property test for settings persistence


    - **Property 2: Settings Persistence Round-Trip**
    - **Validates: Requirements 1.2**
  - [x] 6.3 Create belief API route


    - Create `app/api/max/belief/route.ts`
    - Implement POST to calculate and store belief session
    - Implement GET to fetch belief history
    - _Requirements: 3.1, 6.1, 6.3_
  - [x] 6.4 Write property test for belief data isolation


    - **Property 8: Belief Data Isolation**
    - **Validates: Requirements 6.2, 6.3**

  - [x] 6.5 Create response API route

    - Create `app/api/max/response/route.ts`
    - Implement POST to generate Max response based on context
    - _Requirements: 5.1, 5.2_

- [x] 7. Implement MaxSettings UI Component


  - [x] 7.1 Create MaxSettings component


    - Create `components/max/MaxSettings.tsx`
    - Implement industrial/sci-fi styled sliders for honesty and humor
    - Implement mode selector dropdown
    - _Requirements: 2.1, 2.2_
  - [x] 7.2 Add real-time Max feedback

    - Integrate response API for slider change feedback
    - Display Max's contextual responses in feedback area
    - Handle humor slider at 100 with special response
    - _Requirements: 2.3, 2.4_

  - [ ] 7.3 Write property test for slider feedback
    - **Property 7: Slider Feedback Generation**
    - **Validates: Requirements 2.4**

- [x] 8. Implement Reframing Ritual UI



  - [-] 8.1 Create ReframingRitual component

    - Create `components/max/ReframingRitual.tsx`
    - Implement Prior belief slider (0-100%)

    - Display evidence section (HRV + papers)

    - _Requirements: 4.1, 4.3_
  - [x] 8.2 Create BayesianAnimation component




    - Create `components/max/BayesianAnimation.tsx`

    - Implement formula visualization with Framer Motion
    - Implement countdown animation from Prior to Posterior



    - _Requirements: 4.4, 4.5_
  - [x] 8.3 Integrate Max responses in ritual flow


    - Add Max acknowledgment when Prior is set
    - Add Max conclusion with Posterior and confirmation prompt
    - _Requirements: 4.2, 4.6_


- [x] 9. Final Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.
