# Implementation Plan

- [x] 1. Create Core Services and Utilities



  - [x] 1.1 Create Bio-Voltage recommendation service


    - Create `lib/bio-voltage.ts` with `getBioVoltageRecommendation` function
    - Implement stress/energy level to recommendation mapping
    - Export types: `BioVoltageRecommendation`, `BioVoltageTechnique`
    - _Requirements: 2.1, 2.2_
  - [ ]* 1.2 Write property test for Bio-Voltage high stress recommendation
    - **Property 3: Bio-Voltage High Stress Recommendation**
    - **Validates: Requirements 2.1**
  - [x]* 1.3 Write property test for Bio-Voltage low energy recommendation


    - **Property 4: Bio-Voltage Low Energy Recommendation**

    - **Validates: Requirements 2.2**
  - [x] 1.4 Create Consensus Meter utility functions
    - Create `lib/consensus-meter.ts` with `getConsensusLevel`, `formatConsensusText`, `formatVerificationText`
    - Implement three-tier consensus classification (high/emerging/controversial)
    - _Requirements: 3.2, 3.3_

  - [ ]* 1.5 Write property test for Consensus Meter formatting
    - **Property 5: Consensus Meter Percentage Formatting**
    - **Property 6: Consensus Meter Verification Text**
    - **Validates: Requirements 3.2, 3.3**
  - [x] 1.6 Create Active Inquiry service

    - Create `lib/active-inquiry.ts` with `generateActiveInquiry` function
    - Implement HRV dip detection and sleep pattern analysis
    - Generate contextual diagnostic questions
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ]* 1.7 Write property test for Active Inquiry
    - **Property 7: Active Inquiry Avoids Generic Greetings**
    - **Property 8: Active Inquiry References Data Points**
    - **Validates: Requirements 4.1, 4.2, 4.4**

- [ ] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.



- [x] 3. Create Insight API Endpoint

  - [x] 3.1 Create `/api/insight/generate` route

    - Create `app/api/insight/generate/route.ts`
    - Implement Constitutional AI system prompt for Metabolic Physiologist persona

    - Accept biometric data (sleep_hours, hrv, stress_level)
    - Return streaming text response
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3_

  - [x] 3.2 Implement fallback insights
    - Add static fallback insights for error scenarios
    - Handle LLM failures gracefully
    - _Requirements: 1.3, 1.4_
  - [ ]* 3.3 Write property test for Insight reframing
    - **Property 1: Insight Reframing Avoids Judgmental Language**
    - **Property 2: Insight Contains Positive Framing**
    - **Validates: Requirements 1.1, 1.2**



  - [ ]* 3.4 Write property test for API error handling
    - **Property 9: API Error Response Format**
    - **Validates: Requirements 5.4**



- [x] 4. Create UI Components
  - [x] 4.1 Create ConsensusMeter component

    - Create `components/ConsensusMeter.tsx`
    - Implement high-precision gauge visual with tick marks

    - Use three-color scheme: Green (High), Yellow (Emerging), Gray (Controversial)
    - Display percentage and verification text
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 4.2 Create BioVoltageCard component
    - Create `components/BioVoltageCard.tsx`
    - Implement calm pulsing circular animation (breathing glow effect)
    - Display title "Bio-Voltage Regulation"
    - Show recommended technique based on stress/energy level
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 4.3 Create BioVoltageAnimation component

    - Create `components/BioVoltageAnimation.tsx`
    - Implement organic, slow breathing glow animation
    - Use CSS animations or Framer Motion
    - Simulate Qi/Voltage flow visual
    - _Requirements: 2.3_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Update LandingContent Component


  - [x] 6.1 Integrate Insight API into top card

    - Replace current insight generation with `/api/insight/generate` call
    - Display reframed "Comforting Truth" insight
    - Handle loading and error states
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 6.2 Replace middle card with BioVoltageCard

    - Remove old "Physiological Status" card
    - Add BioVoltageCard with animation
    - Pass stress_level and energy data

    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 6.3 Replace bottom card with Scientific Consensus
    - Change title from "Evidence Base" to "Scientific Consensus"
    - Integrate ConsensusMeter component
    - Display sources with consensus percentage
    - _Requirements: 3.1, 3.2, 3.3, 3.4_


- [x] 7. Update Chat System for Active Inquiry

  - [x] 7.1 Update AIAssistantFloatingChat welcome message



    - Replace generic greeting with Active Inquiry question
    - Integrate `generateActiveInquiry` service
    - Display contextual diagnostic question on open
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 7.2 Update chat API system prompt

    - Modify `/api/chat/route.ts` system prompt
    - Add "Comforting Truth" tone instructions
    - Integrate Active Inquiry context
    - _Requirements: 4.2, 4.3_

- [ ] 8. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
