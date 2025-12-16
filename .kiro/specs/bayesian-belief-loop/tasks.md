# Implementation Plan: Bayesian Belief Loop (认知天平系统)

## Phase 1: Database Foundation

- [x] 1. Set up database schema and core functions


  - [x] 1.1 Create bayesian_beliefs table

    - Create table with id, user_id, belief_context, prior_score, posterior_score, evidence_stack JSONB
    - Add CHECK constraints for score bounds (0-100)
    - Enable RLS policy for user data isolation
    - _Requirements: 1.4, 7.3_

  - [x] 1.2 Create evidence_cache table for Semantic Scholar papers
    - Store paper_id, title, citation_count, consensus_score, url
    - Add expiration timestamp (7 days default)

    - _Requirements: 8.4_
  - [x] 1.3 Implement calculate_bayesian_posterior PostgreSQL function
    - Parse evidence_stack JSONB
    - Normalize weights to sum 1.0
    - Apply Bayesian formula: posterior = (likelihood × prior) / evidence

    - Clamp result to [0, 100]
    - _Requirements: 7.2_
  - [x] 1.4 Write property test for posterior score bounds

    - **Property 1: Posterior Score Bounds Invariant**
    - **Validates: Requirements 3.2, 7.2**

  - [x] 1.5 Write property test for weight normalization

    - **Property 3: Weight Normalization Invariant**
    - **Validates: Requirements 5.5**
  - [x] 1.6 Create database trigger for Bayesian update on insert
    - Trigger calculate_bayesian_posterior on new belief record
    - Update posterior_score automatically
    - _Requirements: 7.1_
  - [x] 1.7 Write property test for trigger idempotency

    - **Property 10: Database Trigger Idempotency**
    - **Validates: Requirements 7.1, 7.2**

- [x] 2. Checkpoint - Ensure all database tests pass

  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: Evidence System



- [x] 3. Implement evidence weight calculation

  - [x] 3.1 Create lib/bayesian-evidence.ts


    - Define Evidence interface with type, value, weight, source_id, consensus
    - Implement weight bounds validation (bio: 0.2-0.4, science: 0.3-0.6, action: 0.05-0.2)
    - Implement weight normalization function
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [x] 3.2 Write property test for evidence weight bounds

    - **Property 2: Evidence Weight Bounds**
    - **Validates: Requirements 5.2, 5.3, 5.4**
  - [x] 3.3 Implement evidence_stack JSON serialization/deserialization

    - Create serialize and deserialize functions
    - Validate JSON structure before storage
    - _Requirements: 3.5, 7.5_

  - [x] 3.4 Write property test for evidence stack round trip





    - **Property 4: Evidence Stack Round Trip**
    - **Validates: Requirements 3.5, 7.3, 7.5**

- [x] 4. Integrate Semantic Scholar API


  - [x] 4.1 Create lib/services/bayesian-scholar.ts

    - Query Semantic Scholar for papers by belief_context
    - Filter papers with citation_count > 50
    - Map results to Evidence format with consensus score
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 4.2 Write property test for citation filter


    - **Property 9: Science Evidence Citation Filter**
    - **Validates: Requirements 8.2**

  - [x] 4.3 Implement fallback and caching logic
    - Cache papers in evidence_cache table
    - Use cached data on API failure
    - Graceful degradation to bio + action evidence only
    - _Requirements: 8.4, 8.5_

  - [x] 4.4 Write property test for graceful degradation
    - **Property 11: Graceful Degradation on API Failure**
    - **Validates: Requirements 8.5**

- [x] 5. Checkpoint - Ensure all evidence system tests pass

  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: API Layer

- [x] 6. Create Bayesian API endpoints


  - [x] 6.1 Create /api/bayesian/ritual endpoint

    - POST: Start Active Ritual with belief_context and prior_score
    - Collect bio evidence from user_metrics
    - Fetch science evidence from Semantic Scholar
    - Calculate and return posterior with evidence_stack
    - _Requirements: 1.1, 1.3, 1.4, 2.2, 2.3, 3.2_
  - [x] 6.2 Write property test for belief score persistence


    - **Property 5: Belief Score Persistence Round Trip**
    - **Validates: Requirements 1.4, 4.5**
  - [x] 6.3 Create /api/bayesian/nudge endpoint

    - POST: Trigger Passive Nudge on habit completion
    - Calculate probability correction (-1 to -20 percentage points)
    - Update posterior_score silently
    - _Requirements: 4.1, 4.4, 4.5_

  - [x] 6.4 Write property test for passive nudge trigger
    - **Property 8: Passive Nudge Trigger Consistency**
    - **Validates: Requirements 4.1, 4.4**
  - [x] 6.5 Create /api/bayesian/history endpoint

    - GET: Return belief history for anxiety curve
    - Support timeRange query param (7d, 30d, 90d, all)
    - Include evidence_stack for each data point
    - _Requirements: 6.1, 6.5_

- [x] 7. Checkpoint - Ensure all API tests pass

  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Core UI Components (Framer Motion)

- [x] 8. Implement FearInputSlider component



  - [x] 8.1 Create components/bayesian/FearInputSlider.tsx

    - Full-screen dark background (#0A0A0A)
    - Red gradient slider (0-100%)
    - Belief context selector (Metabolic Crash, Cardiac Event, Social Rejection, Custom)
    - Prompt text "你现在觉得这件事发生的可能性有多大？"
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 8.2 Add Framer Motion animations to slider

    - useSpring for number display animation
    - Scale animation on value change
    - _Requirements: 1.2_

  - [x] 8.3 Add Capacitor Haptics on submit
    - Haptics.impact({ style: 'heavy' }) on submit
    - _Requirements: 2.1_

- [x] 9. Implement EvidenceRain component

  - [x] 9.1 Create components/bayesian/EvidenceRain.tsx

    - Display evidence weights dropping onto scale
    - Green weights for bio evidence
    - Blue weights for science evidence
    - Additional weights for action evidence
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 9.2 Add Framer Motion spring physics animations
    - containerVariants with staggerChildren: 0.3
    - evidenceVariants with spring stiffness: 200, damping: 15

    - _Requirements: 2.2, 2.3, 2.4_
  - [x] 9.3 Add tap handler for science evidence
    - Open Semantic Scholar paper link on tap
    - _Requirements: 2.5_

- [x] 10. Implement BayesianMoment component

  - [x] 10.1 Create components/bayesian/BayesianMoment.tsx

    - Display P(H|E) formula with background glow
    - Number roller from prior to posterior using useSpring
    - Summary text "数学显示，你的恐惧被夸大了 X 倍"
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 10.2 Write property test for exaggeration factor

    - **Property 6: Exaggeration Factor Calculation**
    - **Validates: Requirements 3.3**

  - [x] 10.3 Add AnimatePresence for formula reveal
    - Framer Motion AnimatePresence for conditional rendering
    - variants with stagger children for summary reveal
    - _Requirements: 3.1, 3.3_

  - [x] 10.4 Add celebratory haptics on significant reduction
    - Haptics.notification({ type: 'success' }) when posterior < prior * 0.5
    - _Requirements: 3.4_


- [x] 11. Implement CognitiveScale component

  - [x] 11.1 Create components/bayesian/CognitiveScale.tsx

    - Visual scale with left (red/prior) and right (green-blue/evidence) sides
    - Tilt animation based on evidence weight
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 11.2 Add Framer Motion scale variants
    - scaleVariants: initial, tilted, balanced
    - Spring physics for natural movement
    - _Requirements: 2.2_

- [x] 12. Checkpoint - Ensure all core UI component tests pass

  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Passive Nudge System

- [x] 13. Implement PassiveNudge component


  - [x] 13.1 Create components/bayesian/PassiveNudge.tsx

    - Toast/dynamic island notification at top
    - Text format: "呼吸完成。皮质醇风险概率修正：-5%"
    - _Requirements: 4.2, 4.4_
  - [x] 13.2 Add Framer Motion slide-in animation

    - Spring physics for toast entrance
    - Fade out on completion
    - _Requirements: 4.2_
  - [x] 13.3 Add particle fly animation with motion path

    - Green particle flying to anxiety index
    - Bezier curve trajectory
    - Scale and opacity transitions
    - _Requirements: 4.3_

- [x] 14. Integrate nudge with habit completion


  - [x] 14.1 Hook into habit completion events


    - Listen for habit_completions INSERT
    - Trigger PassiveNudge component
    - Call /api/bayesian/nudge endpoint
    - _Requirements: 4.1, 4.5_


- [x] 15. Checkpoint - Ensure passive nudge system tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: Anxiety Curve Visualization

- [x] 16. Implement AnxietyCurve component

  - [x] 16.1 Create components/bayesian/AnxietyCurve.tsx

    - Line chart using Recharts
    - Time on X-axis, posterior_score (0-100%) on Y-axis
    - Smooth bezier curves
    - _Requirements: 6.1_
  - [x] 16.2 Add color coding for trend segments

    - Sage green (#9CAF88) for decreasing segments
    - Clay (#C4A77D) for increasing segments
    - _Requirements: 6.2, 6.3_
  - [x] 16.3 Write property test for curve color coding

    - **Property 7: Curve Color Coding Consistency**
    - **Validates: Requirements 6.2, 6.3**
  - [x] 16.4 Add Framer Motion path animation

    - Animate pathLength from 0 to 1 on mount
    - _Requirements: 6.1_

  - [x] 16.5 Add data point tap interaction
    - Use layoutId for expand animation
    - Show evidence_stack modal on tap
    - _Requirements: 6.5_

  - [x] 16.6 Handle empty state
    - Show encouraging placeholder for < 3 data points
    - Framer Motion fade and scale animation
    - _Requirements: 6.4_

- [x] 17. Checkpoint - Ensure anxiety curve tests pass

  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: Integration and Dashboard

- [x] 18. Create BayesianDashboard page


  - [x] 18.1 Create app/bayesian/page.tsx or integrate into /landing

    - CognitiveScale at top
    - "我很焦虑" button to trigger Active Ritual
    - AnxietyCurve with time range selector
    - Recent evidence stack display
    - _Requirements: All_
  - [x] 18.2 Implement Active Ritual flow

    - Full-screen modal sequence: FearInput → EvidenceRain → BayesianMoment → Result
    - Framer Motion AnimatePresence for step transitions
    - _Requirements: 1.1, 2.2, 3.1_
  - [x] 18.3 Implement data fetching with SWR

    - Fetch belief history from /api/bayesian/history
    - Handle loading and error states with California Calm messages
    - _Requirements: 6.1, 7.4_

- [x] 19. Integrate with Daily Calibration


  - [x] 19.1 Add Bayesian ritual trigger to DailyCalibrationSheet

    - Option to start Active Ritual after daily check-in
    - _Requirements: 1.1_
  - [x] 19.2 Connect bio evidence from daily calibration data

    - Use HRV, sleep quality, energy level as bio evidence
    - _Requirements: 2.2_


- [x] 20. Final Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.
