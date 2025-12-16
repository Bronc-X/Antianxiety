# Implementation Plan

- [x] 1. Set up font loading infrastructure
  - [x] 1.1 Configure Inter font via next/font/google in layout.tsx
    - Import Inter from next/font/google with latin subset
    - Set display: swap for performance
    - Create CSS variable --font-inter
    - _Requirements: 3.1, 3.3_
  - [x] 1.2 Add @font-face declaration for Smiley Sans in globals.css
    - Use jsDelivr CDN URL for woff2 file
    - Set font-display: swap
    - Register as "Smiley Sans"
    - _Requirements: 3.2, 3.3, 3.4_

- [x] 2. Implement CSS variable system
  - [x] 2.1 Define --font-sans variable for body text
    - Include Inter, system fonts, and Chinese font fallbacks
    - Order: Inter → system → PingFang SC → HarmonyOS Sans → Microsoft YaHei → sans-serif
    - _Requirements: 2.1, 5.1, 5.2, 5.3_
  - [x] 2.2 Define --font-heading variable for headings
    - Include Inter and Smiley Sans
    - Order: Inter → Smiley Sans → sans-serif
    - _Requirements: 1.1, 1.2_

- [x] 3. Apply typography styles to elements
  - [x] 3.1 Style body element with body font stack
    - Apply --font-sans font-family
    - Set line-height: 1.6
    - Set color: #111827 (soft black)
    - Apply -webkit-font-smoothing: antialiased
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 3.2 Style heading elements with heading font stack
    - Target h1, h2, h3, h4, h5, h6, .brand-text
    - Apply --font-heading font-family
    - Set appropriate letter-spacing
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 4. Tailwind CSS integration
  - [x] 4.1 Configure font utilities in @theme inline block
    - Define font-sans utility mapping to body font stack
    - Define font-heading utility mapping to heading font stack
    - _Requirements: 4.1, 4.2_
  - [x] 4.2 Apply global styles in globals.css
    - Override default body font-family
    - Target heading selectors
    - _Requirements: 4.3, 4.4_

- [ ]* 5. Property-based tests (optional)
  - [ ]* 5.1 Write property test for font stack order
    - **Property 1: Font Stack Order Preservation**
    - **Validates: Requirements 1.1**
  - [ ]* 5.2 Write property test for body font completeness
    - **Property 2: Body Font Stack Completeness**
    - **Validates: Requirements 2.1, 5.1, 5.2, 5.3**
  - [ ]* 5.3 Write property test for configuration round-trip
    - **Property 3: Configuration Round-Trip**
    - **Validates: Requirements 6.1, 6.2**
