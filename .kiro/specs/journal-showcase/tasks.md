# Implementation Plan

- [x] 1. Create JournalShowcase component with paper data
  - [x] 1.1 Create paper data interface and static curated papers array
    - Define Paper interface with all required fields
    - Create CURATED_PAPERS array with 6 real academic papers on anxiety/stress research
    - Include both English and Chinese translations
    - _Requirements: 4.2, 4.3_
  - [x] 1.2 Implement JournalShowcase component
    - Create grid layout with responsive columns (2 on mobile, configurable on desktop)
    - Render paper cards with title, journal, year, abstract snippet (max 120 chars)
    - Add credibility badge (Top Journal / Peer Reviewed)
    - Display citation count when available
    - Apply California Calm color palette and Framer Motion hover animations
    - Support dark mode
    - _Requirements: 1.1, 1.2, 2.1, 2.3, 2.4, 3.1, 3.2, 3.3_
  - [ ]* 1.3 Write property tests for JournalShowcase
    - **Property 1: Paper data model completeness**
    - **Property 2: Paper card renders required metadata**
    - **Property 3: Credibility indicator presence**
    - **Property 4: Citation count conditional display**
    - **Validates: Requirements 1.2, 3.1, 3.2, 4.2**

- [x] 2. Integrate JournalShowcase into LandingContent
  - [x] 2.1 Replace XFeed with JournalShowcase in authority section
    - Remove XFeed import and usage
    - Add JournalShowcase component with language prop
    - Maintain existing section structure and styling
    - _Requirements: 1.1, 1.3, 1.4_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
