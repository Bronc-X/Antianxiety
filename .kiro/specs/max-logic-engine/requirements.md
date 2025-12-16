# Requirements Document

## Introduction

Max Logic Engine 是 "No More Anxious" 平台的核心 AI 人格系统。它包含两个主要模块：

1. **TARS Settings Module** - 用户可调节的 AI 人格参数（类似《星际穿越》中的 TARS 机器人设置）
2. **Bayesian Belief Loop** - 基于贝叶斯推理的焦虑重构引擎

Max 作为 Bio-Operating System Co-pilot，通过可调节的诚实度、幽默感和科学证据，帮助用户将主观焦虑信念转化为客观概率评估。

## Glossary

- **Max**: AI 助手人格，一个无形态的 Bio-Operating System Co-pilot
- **TARS Settings**: 用户可调节的 AI 人格参数面板（诚实度、幽默感、模式）
- **Bayesian Belief Loop**: 使用贝叶斯公式重构用户焦虑信念的算法
- **Prior**: 用户的初始信念强度（0-100%）
- **Likelihood**: 基于生理数据（HRV等）的可能性
- **Evidence Weight**: 来自 Semantic Scholar 论文的证据权重（0.1-0.9）
- **Posterior**: 经过证据调整后的最终概率
- **Reframing Ritual**: 将焦虑信念转化为客观概率的交互流程

## Requirements

### Requirement 1: AI Settings Storage

**User Story:** As a user, I want to customize Max's personality parameters, so that I can adjust the AI's communication style to my preferences.

#### Acceptance Criteria

1. WHEN the system initializes a user profile THEN the system SHALL create an `ai_settings` JSONB column with default values: `honesty_level: 90`, `humor_level: 65`, `mode: "TARS"`
2. WHEN a user updates any AI setting THEN the system SHALL persist the change to the `profiles.ai_settings` column immediately
3. WHEN the `honesty_level` value is set THEN the system SHALL constrain the value between 60 and 100 inclusive
4. WHEN the `humor_level` value is set THEN the system SHALL constrain the value between 0 and 100 inclusive
5. WHEN the `mode` value is set THEN the system SHALL accept only valid modes: "TARS", "Zen Master", or "Dr. House"

### Requirement 2: Max Settings UI Component

**User Story:** As a user, I want an industrial/sci-fi styled settings panel, so that I can visually adjust Max's personality in a retro-futuristic interface.

#### Acceptance Criteria

1. WHEN the MaxSettings component renders THEN the system SHALL display sliders for `honesty_level` and `humor_level` with industrial/sci-fi visual styling
2. WHEN a user drags the honesty slider THEN the system SHALL display the current value with a label indicating the honesty level
3. WHEN a user drags the humor slider to 100 THEN Max SHALL respond with contextual humor (e.g., "Self-destruct sequence initiated... just kidding.")
4. WHEN a user drags any slider THEN the system SHALL provide immediate text feedback from Max reflecting the new setting
5. WHEN the settings panel loads THEN the system SHALL fetch and display the user's current AI settings from the database

### Requirement 3: Bayesian Belief Calculation

**User Story:** As a user experiencing anxiety, I want the system to mathematically reframe my fears using evidence, so that I can see my anxious beliefs as adjustable probabilities rather than certainties.

#### Acceptance Criteria

1. WHEN a user inputs a belief (Prior) THEN the system SHALL accept a value between 0 and 100 representing their subjective certainty
2. WHEN the system calculates a Posterior THEN the system SHALL apply the formula: `Posterior = (Prior × Likelihood) / Evidence`
3. WHEN calculating evidence weight THEN the system SHALL derive the value from Semantic Scholar paper relevance scores (range 0.1-0.9)
4. WHEN the calculation completes THEN the system SHALL return a Posterior value between 0 and 100

### Requirement 4: Reframing Ritual Interaction Flow

**User Story:** As a user, I want to experience an animated "Reframing Ritual" that visualizes the math, so that I can see my anxiety probability decrease in real-time.

#### Acceptance Criteria

1. WHEN a user initiates a Reframing Ritual THEN the system SHALL display a slider for setting the Prior belief (0-100%)
2. WHEN the user sets a Prior THEN Max SHALL acknowledge the belief using approved phrases (e.g., "System detects belief at 90%")
3. WHEN Max injects evidence THEN the system SHALL display HRV data and relevant Semantic Scholar papers
4. WHEN the formula calculates THEN the system SHALL animate the mathematical visualization showing Prior, Likelihood, and Evidence
5. WHEN the Posterior is calculated THEN the system SHALL animate a countdown from Prior to Posterior value
6. WHEN the animation completes THEN Max SHALL conclude with the adjusted probability and ask for confirmation (e.g., "Probability adjusted to 12%. Proceed?")

### Requirement 5: Max Response Generation

**User Story:** As a user, I want Max to respond according to my configured settings, so that the AI's tone matches my preferences.

#### Acceptance Criteria

1. WHEN Max generates a response THEN the system SHALL adjust verbosity inversely proportional to the `honesty_level` setting
2. WHEN Max generates a response with `humor_level` above 50 THEN the system SHALL include dry, intellectual wit in responses
3. WHEN Max generates a response THEN the system SHALL never use forbidden phrases ("I feel...", "I am sorry...", "As an AI...")
4. WHEN Max generates a response THEN the system SHALL use approved phrases ("System detects...", "Data suggests...", "Bio-metrics indicate...")
5. WHEN the mode is "TARS" THEN Max SHALL prioritize brevity and dry humor
6. WHEN the mode is "Zen Master" THEN Max SHALL use calming, philosophical language
7. WHEN the mode is "Dr. House" THEN Max SHALL use blunt, diagnostic language

### Requirement 6: Belief Data Persistence

**User Story:** As a user, I want my belief reframing history saved, so that I can track my progress over time.

#### Acceptance Criteria

1. WHEN a Reframing Ritual completes THEN the system SHALL store the session data including Prior, Posterior, evidence used, and timestamp
2. WHEN storing belief data THEN the system SHALL associate the record with the authenticated user via RLS
3. WHEN a user requests belief history THEN the system SHALL return only records belonging to that user
