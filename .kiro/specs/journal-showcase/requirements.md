# Requirements Document

## Introduction

This feature replaces the X (Twitter) feed section on the Landing page with a curated showcase of public academic journals and research papers. The goal is to align with the "No More Anxious" philosophy of providing scientifically-grounded content rather than social media posts, reinforcing the platform's credibility through peer-reviewed research sources.

## Glossary

- **Journal Showcase**: A UI component displaying curated academic papers and journal articles
- **Landing Page**: The main authenticated user dashboard (`components/LandingContent.tsx`)
- **Authority Section**: The section currently titled "精选内容" (Curated Content) that displays content sources
- **Paper Card**: A visual card displaying paper metadata (title, authors, journal, abstract snippet)
- **Semantic Scholar**: Academic search engine API used for fetching paper metadata

## Requirements

### Requirement 1

**User Story:** As a user, I want to see curated academic journal articles instead of X tweets, so that I can trust the scientific foundation of the platform's health advice.

#### Acceptance Criteria

1. WHEN the Landing page loads THEN the Journal Showcase component SHALL display a grid of 4-6 curated academic paper cards
2. WHEN a paper card is displayed THEN the Journal Showcase component SHALL show the paper title, journal name, publication year, and a brief abstract snippet (max 120 characters)
3. WHEN a user clicks on a paper card THEN the Journal Showcase component SHALL open the paper's source URL in a new browser tab
4. WHEN the paper data fails to load THEN the Journal Showcase component SHALL display a graceful fallback with static example papers

### Requirement 2

**User Story:** As a user, I want the journal showcase to match the calm aesthetic of the app, so that the experience remains consistent and non-anxiety-inducing.

#### Acceptance Criteria

1. WHEN the Journal Showcase renders THEN the component SHALL use the California Calm color palette (Sand, Clay, Sage, Soft Black)
2. WHEN displaying paper metadata THEN the component SHALL use clean typography with adequate whitespace following the Monocle/Kinfolk aesthetic
3. WHEN the user hovers over a paper card THEN the component SHALL provide subtle visual feedback using Framer Motion animations
4. WHEN in dark mode THEN the Journal Showcase component SHALL adapt colors appropriately using the dark theme tokens

### Requirement 3

**User Story:** As a user, I want to see the scientific credibility of each paper, so that I can understand the authority of the information source.

#### Acceptance Criteria

1. WHEN a paper card is displayed THEN the Journal Showcase component SHALL show a journal credibility indicator (e.g., impact factor tier or "Peer Reviewed" badge)
2. WHEN the paper has citation count data THEN the Journal Showcase component SHALL display the citation count
3. WHEN displaying journal names THEN the Journal Showcase component SHALL show recognizable journal names (Nature, Science, JAMA, etc.) with appropriate styling

### Requirement 4

**User Story:** As a developer, I want the journal data to be easily maintainable, so that the curated papers can be updated without code changes.

#### Acceptance Criteria

1. WHEN the Journal Showcase initializes THEN the component SHALL load paper data from a static configuration file or data array
2. WHEN paper data is structured THEN the data model SHALL include: id, title, authors, journal, year, abstract, url, citationCount, and credibilityTier
3. WHEN adding new papers THEN the developer SHALL only need to update the data configuration without modifying component logic
