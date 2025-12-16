# Implementation Plan

- [x] 1. Create ConversationStateTracker module




  - [ ] 1.1 Create `lib/conversation-state.ts` with ConversationState interface and tracker class
    - Define ConversationState, ResponseStructure interfaces




    - Implement state initialization, update, and query methods
    - _Requirements: 1.1, 6.4_
  - [-] 1.2 Write property test for state tracking


    - **Property 7: User Detail Memory**
    - **Validates: Requirements 6.4**
  - [ ] 1.3 Write unit tests for ConversationStateTracker
    - Test state initialization
    - Test state updates across turns
    - _Requirements: 1.1, 6.4_

- [ ] 2. Create ResponseVariationEngine module
  - [x] 2.1 Create `lib/response-variation.ts` with variation strategy logic

    - Define VariationStrategy interface
    - Implement format selection based on turn count and history
    - Implement endearment rotation logic
    - _Requirements: 2.1, 2.2, 3.1, 3.2_
  - [x] 2.2 Write property test for format variation

    - **Property 2: Response Format Variation**
    - **Validates: Requirements 2.1, 2.2**

  - [ ] 2.3 Write property test for language variation
    - **Property 4: Language Expression Variation**

    - **Validates: Requirements 3.1, 3.2, 3.3**
  - [ ] 2.4 Write unit tests for ResponseVariationEngine
    - Test strategy selection logic
    - Test endearment rotation
    - _Requirements: 2.1, 2.2, 3.1, 3.2_

- [x] 3. Create ContextInjectionOptimizer module


  - [x] 3.1 Create `lib/context-optimizer.ts` with context injection decision logic


    - Define ContextInjectionDecision interface
    - Implement health context deduplication logic
    - Implement paper citation deduplication logic
    - _Requirements: 1.1, 4.1, 4.2_
  - [x] 3.2 Write property test for health context non-repetition

    - **Property 1: Health Context Non-Repetition**
    - **Validates: Requirements 1.1**

  - [ ] 3.3 Write property test for citation deduplication
    - **Property 5: Citation Deduplication**

    - **Validates: Requirements 4.1, 4.2**
  - [ ] 3.4 Write unit tests for ContextInjectionOptimizer
    - Test health context decision logic
    - Test paper exclusion logic
    - _Requirements: 1.1, 4.1, 4.2_

- [-] 4. Create PersonaPromptBuilder module


  - [ ] 4.1 Create `lib/persona-prompt.ts` with top-tier doctor + witty friend persona
    - Define PersonaConfig interface
    - Build dynamic persona prompt based on turn count
    - Include memory emphasis and confidence tone
    - _Requirements: 6.1, 6.2, 6.3, 6.5_
  - [x] 4.2 Write unit tests for PersonaPromptBuilder

    - Test persona prompt generation
    - Test turn-based variation
    - _Requirements: 6.1, 6.2_

- [x] 5. Checkpoint - Ensure all module tests pass


  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Integrate modules into Chat API


  - [x] 6.1 Update `app/api/chat/route.ts` to use ConversationStateTracker


    - Extract state from messages array
    - Update state after each response
    - _Requirements: 1.1, 6.4_
  - [x] 6.2 Integrate ResponseVariationEngine into system prompt building

    - Apply format variation strategy
    - Rotate endearments based on state
    - _Requirements: 2.1, 2.2, 3.1, 3.2_
  - [x] 6.3 Integrate ContextInjectionOptimizer into context building

    - Apply health context deduplication
    - Apply paper citation deduplication
    - _Requirements: 1.1, 4.1, 4.2_
  - [x] 6.4 Integrate PersonaPromptBuilder into system prompt

    - Replace current persona logic with new builder
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 6.5 Write property test for direct plan response

    - **Property 3: Follow-up Response Conciseness**
    - **Validates: Requirements 2.3, 5.2**

  - [ ] 6.6 Write property test for plan requests
    - **Property 6: Direct Plan Response**
    - **Validates: Requirements 5.1**

- [ ] 7. Update system prompt instructions
  - [x] 7.1 Add conversation-aware instructions to system prompt

    - Add instructions to avoid repeating health context
    - Add instructions to vary response format
    - Add instructions to reference previous context implicitly
    - _Requirements: 1.2, 1.3, 5.3_

  - [ ] 7.2 Update persona instructions for top-tier doctor + witty friend
    - Add Harvard/Mayo level expertise framing
    - Add exceptional memory emphasis
    - Add witty, personable tone guidance
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [x] 8. Checkpoint - Ensure all integration tests pass


  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Final Checkpoint - Full system verification



  - Ensure all tests pass, ask the user if questions arise.
