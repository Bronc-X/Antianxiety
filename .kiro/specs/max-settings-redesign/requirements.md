# Requirements Document

## Introduction

This feature redesigns the Max AI Settings interface to simplify the user experience. The key changes include:
- Unifying the AI name as "Max" throughout the interface
- Reorganizing the layout to place honesty level in the second section
- Automatically determining personality mode based on humor level slider position
- Removing the manual personality mode card selector

The humor slider will automatically map to three personality styles:
- 0-33%: Dr. House style (直接-诊断)
- 33-66%: Zen Master style (平静-哲学)
- 66-100%: MAX style (简洁-幽默)

## Glossary

- **Max**: The AI assistant/co-pilot in the No More Anxious application
- **Humor Level**: A slider value (0-100) that controls the AI's humor and automatically determines personality mode
- **Honesty Level**: A slider value (60-100) that controls how direct/diplomatic the AI responses are
- **Personality Mode**: The AI's communication style, automatically derived from humor level
- **Dr. House Style**: Direct, diagnostic communication style (humor 0-33%)
- **Zen Master Style**: Calm, philosophical communication style (humor 33-66%)
- **MAX Style**: Concise, witty communication style (humor 66-100%)

## Requirements

### Requirement 1

**User Story:** As a user, I want the AI to be consistently named "Max" throughout the settings interface, so that I have a clear understanding of who I am configuring.

#### Acceptance Criteria

1. WHEN the settings interface loads THEN the system SHALL display "Max" as the AI name in all headers and labels
2. WHEN the system generates feedback messages THEN the system SHALL use "Max" as the AI identifier

### Requirement 2

**User Story:** As a user, I want to adjust the humor level slider and see the personality style automatically update, so that I do not need to manually select personality cards.

#### Acceptance Criteria

1. WHEN the humor level slider value is between 0 and 33 THEN the system SHALL display "Dr. House" style indicator with "直接-诊断" label
2. WHEN the humor level slider value is between 33 and 66 THEN the system SHALL display "Zen Master" style indicator with "平静-哲学" label
3. WHEN the humor level slider value is between 66 and 100 THEN the system SHALL display "MAX" style indicator with "简洁-幽默" label
4. WHEN the user drags the humor slider THEN the system SHALL update the personality style indicator in real-time
5. WHEN the personality style changes THEN the system SHALL persist the derived mode to the backend

### Requirement 3

**User Story:** As a user, I want the honesty level control to appear in the second section of the settings, so that the interface layout matches my mental model.

#### Acceptance Criteria

1. WHEN the settings interface renders THEN the system SHALL display the honesty level slider in the second section after the header/feedback area
2. WHEN the settings interface renders THEN the system SHALL display the humor level slider in the third section after honesty

### Requirement 4

**User Story:** As a user, I want the personality mode cards to be removed from the interface, so that I have a simpler configuration experience.

#### Acceptance Criteria

1. WHEN the settings interface renders THEN the system SHALL NOT display the three personality mode selection cards
2. WHEN the humor slider determines the personality mode THEN the system SHALL display the current mode as a read-only indicator near the humor slider

### Requirement 5

**User Story:** As a user, I want to see visual feedback when the personality style changes, so that I understand the impact of my humor level adjustment.

#### Acceptance Criteria

1. WHEN the personality style changes due to slider movement THEN the system SHALL animate the style indicator transition
2. WHEN the personality style changes THEN the system SHALL update the style indicator color to match the new mode
