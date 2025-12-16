# Requirements Document

## Introduction

Bio-Ledger Assessment Engine 是一个 AI 驱动的动态问诊系统，模仿 Ada Health 的交互模式。该系统结合决策树 (Decision Tree) 与贝叶斯推理 (Bayesian Inference)，通过结构化问答收集用户症状信息，最终生成概率化的健康评估报告。

核心理念：**Generative UI** - AI 不返回自由文本，而是返回结构化 JSON 指令，前端根据指令渲染对应的 UI 组件（单选、多选、滑块、报告卡片等）。

## Glossary

- **Assessment Engine**: 动态问诊引擎，负责生成下一个问题或最终报告
- **Baseline**: 基线信息收集阶段，包括性别、年龄、既往病史等先验概率因素
- **Chief Complaint**: 主诉，用户描述的主要症状
- **Differential Diagnosis**: 鉴别诊断，通过追问细化症状特征
- **Prior Probability**: 先验概率，基于人口统计学特征的初始风险评估
- **Generative UI**: 生成式 UI，后端返回 JSON schema，前端动态渲染对应组件
- **Assessment Session**: 一次完整的问诊会话，从开始到生成报告

## Requirements

### Requirement 1: Assessment Session Management

**User Story:** As a user, I want to start a new health assessment session, so that I can get personalized health insights based on my symptoms.

#### Acceptance Criteria

1. WHEN a user initiates a new assessment THEN the Assessment Engine SHALL create a unique session with a generated session_id and persist it to the database
2. WHEN a session is created THEN the Assessment Engine SHALL initialize the session state to "baseline" phase
3. WHEN a user returns to an incomplete session THEN the Assessment Engine SHALL restore the session state and continue from the last answered question
4. WHEN a session has been inactive for more than 24 hours THEN the Assessment Engine SHALL mark the session as expired and require a new session to start
5. WHEN a session is completed THEN the Assessment Engine SHALL persist the final report and mark the session as "complete"

### Requirement 2: Baseline Information Collection

**User Story:** As a user, I want to provide my basic health profile, so that the system can establish accurate prior probabilities for my assessment.

#### Acceptance Criteria

1. WHEN the baseline phase begins THEN the Assessment Engine SHALL present questions for biological sex using large icon buttons (Male/Female)
2. WHEN collecting age THEN the Assessment Engine SHALL present a numeric input or age range selector
3. WHEN collecting medical history THEN the Assessment Engine SHALL present a multiple-choice checklist for common conditions (hypertension, diabetes, smoking history, etc.)
4. WHEN all baseline questions are answered THEN the Assessment Engine SHALL transition the session to "chief_complaint" phase
5. WHEN a user skips a baseline question THEN the Assessment Engine SHALL record the skip and use population-average priors for that factor

### Requirement 3: Chief Complaint Input

**User Story:** As a user, I want to describe my main symptom, so that the system can focus the assessment on relevant conditions.

#### Acceptance Criteria

1. WHEN the chief_complaint phase begins THEN the Assessment Engine SHALL present a text input field with autocomplete suggestions
2. WHEN a user types a symptom THEN the Assessment Engine SHALL perform fuzzy search and display matching symptom terms
3. WHEN a symptom is selected THEN the Assessment Engine SHALL present related symptoms as a multiple-choice confirmation list
4. WHEN the user confirms symptoms THEN the Assessment Engine SHALL transition to "differential" phase
5. WHEN the user adds additional symptoms via "Add a symptom" THEN the Assessment Engine SHALL append them to the symptom list

### Requirement 4: Differential Diagnosis Questioning

**User Story:** As a user, I want to answer follow-up questions about my symptoms, so that the system can narrow down possible conditions.

#### Acceptance Criteria

1. WHEN the differential phase begins THEN the Assessment Engine SHALL generate the first diagnostic question based on chief complaint and baseline
2. WHEN generating a question THEN the Assessment Engine SHALL return a structured JSON object containing question text, type, options, and progress percentage
3. WHEN the question type is "single_choice" THEN the Assessment Engine SHALL provide 2-6 mutually exclusive options including "I don't know"
4. WHEN the question type is "multiple_choice" THEN the Assessment Engine SHALL allow selecting multiple options with checkboxes
5. WHEN the question type is "boolean" THEN the Assessment Engine SHALL present Yes/No buttons
6. WHEN the question type is "scale" THEN the Assessment Engine SHALL present a 1-10 severity slider
7. WHEN a user answers a question THEN the Assessment Engine SHALL update the session history and generate the next question using Bayesian reasoning
8. WHEN the AI determines confidence exceeds 80% or question count reaches 12 THEN the Assessment Engine SHALL transition to "report" phase
9. WHEN a high-risk pattern is detected (e.g., chest pain radiating to arm) THEN the Assessment Engine SHALL immediately transition to "report" phase with urgent flag

### Requirement 5: Assessment Report Generation

**User Story:** As a user, I want to receive a clear health assessment report, so that I can understand my possible conditions and next steps.

#### Acceptance Criteria

1. WHEN the report phase begins THEN the Assessment Engine SHALL generate a structured report with ranked conditions
2. WHEN displaying conditions THEN the Assessment Engine SHALL show the top match with "Best match" badge and probability percentage
3. WHEN displaying a condition THEN the Assessment Engine SHALL show condition name, description, matched symptoms as tags, and probability
4. WHEN generating next steps THEN the Assessment Engine SHALL categorize urgency as "emergency", "urgent", "routine", or "self_care"
5. WHEN the report is generated THEN the Assessment Engine SHALL offer to email the report as PDF (optional)
6. WHEN the user views the report THEN the Assessment Engine SHALL provide a "Back" button to review previous answers

### Requirement 6: API Structured Output

**User Story:** As a frontend developer, I want the API to return structured JSON responses, so that I can render the appropriate UI components dynamically.

#### Acceptance Criteria

1. WHEN the API receives a request THEN the Assessment Engine SHALL validate the request body against a defined Zod schema
2. WHEN generating the next step THEN the Assessment Engine SHALL return a discriminated union JSON with step_type "question" or "report"
3. WHEN returning a question THEN the Assessment Engine SHALL include: question_id, text, type, options (with value/label/description), progress, and category
4. WHEN returning a report THEN the Assessment Engine SHALL include: conditions array (name, probability, description, matched_symptoms), urgency level, and next_steps array
5. WHEN an error occurs THEN the Assessment Engine SHALL return a structured error response with error_code and user-friendly message
6. WHEN serializing API responses THEN the Assessment Engine SHALL encode them using the defined JSON schema
7. WHEN parsing API requests THEN the Assessment Engine SHALL validate them against the request schema and return validation errors if invalid

### Requirement 7: UI Component Rendering

**User Story:** As a user, I want a clean, calm interface similar to Ada Health, so that I can complete the assessment without anxiety.

#### Acceptance Criteria

1. WHEN rendering single_choice questions THEN the UI SHALL display large, tappable buttons with optional icons
2. WHEN rendering multiple_choice questions THEN the UI SHALL display checkboxes with title and description for each option
3. WHEN rendering boolean questions THEN the UI SHALL display two large buttons (Yes/No) with icons
4. WHEN rendering scale questions THEN the UI SHALL display a slider with labeled endpoints
5. WHEN rendering the report THEN the UI SHALL display condition cards with "Best match" badge, symptom tags, and probability bar
6. WHEN transitioning between questions THEN the UI SHALL animate smoothly using Framer Motion
7. WHEN displaying progress THEN the UI SHALL show a progress bar at the top of the screen

### Requirement 8: Data Persistence

**User Story:** As a user, I want my assessment data to be saved securely, so that I can access my history and the system can learn from my patterns.

#### Acceptance Criteria

1. WHEN a session is created THEN the Assessment Engine SHALL store it in the assessment_sessions table with user_id foreign key
2. WHEN a question is answered THEN the Assessment Engine SHALL append the answer to the session's history JSONB column
3. WHEN a report is generated THEN the Assessment Engine SHALL store it in the assessment_reports table linked to the session
4. WHEN querying user data THEN the Assessment Engine SHALL enforce Row Level Security (RLS) to ensure users only access their own data
5. WHEN storing sensitive health data THEN the Assessment Engine SHALL encrypt the data at rest using Supabase's encryption features

### Requirement 9: Safety Circuit Breaker (Red Flag Protocol)

**User Story:** As a user experiencing potentially life-threatening symptoms, I want to be immediately warned to seek emergency care, so that I do not delay critical medical attention.

#### Acceptance Criteria

1. WHEN the AI detects a high-risk symptom pattern during any phase THEN the Assessment Engine SHALL immediately trigger the Red Flag Protocol
2. WHEN the Red Flag Protocol is triggered THEN the Assessment Engine SHALL terminate all further questioning and bypass remaining steps
3. WHEN displaying the emergency warning THEN the UI SHALL render a full-screen red alert with clear instructions to call emergency services (120/911) or go to ER immediately
4. WHEN a red flag condition is detected THEN the Assessment Engine SHALL log the event with timestamp and symptom pattern for audit purposes
5. WHEN the emergency screen is displayed THEN the UI SHALL provide a one-tap button to call emergency services directly
6. THE Assessment Engine SHALL maintain a predefined list of red flag patterns including: chest pain radiating to left arm/jaw, sudden severe headache ("worst headache of life"), difficulty breathing with chest tightness, signs of stroke (FAST criteria), severe allergic reaction symptoms

### Requirement 10: Multi-language Support

**User Story:** As a user, I want to use the assessment in my preferred language, so that I can understand questions and reports clearly.

#### Acceptance Criteria

1. WHEN a user starts an assessment THEN the Assessment Engine SHALL detect the user's preferred language from browser/app settings
2. WHEN generating questions THEN the AI SHALL output questions in the user's selected language (Chinese or English)
3. WHEN displaying UI elements THEN the Assessment Engine SHALL use localized strings for buttons, labels, and instructions
4. WHEN generating the report THEN the Assessment Engine SHALL produce the report in the user's selected language
5. WHEN a user switches language mid-session THEN the Assessment Engine SHALL continue the session in the new language without data loss

### Requirement 11: PDF Report Export

**User Story:** As a user, I want to export my assessment report as a PDF, so that I can share it with my doctor or keep it for my records.

#### Acceptance Criteria

1. WHEN the report is generated THEN the Assessment Engine SHALL offer a "Download PDF" button
2. WHEN generating the PDF THEN the Assessment Engine SHALL include: assessment date, patient demographics (anonymized), symptoms list, conditions with probabilities, and recommended next steps
3. WHEN the PDF is generated THEN the Assessment Engine SHALL apply Bio-Ledger branding with calm color palette (Sand, Clay, Sage)
4. WHEN a user opts to email the report THEN the Assessment Engine SHALL send the PDF to the user's registered email address
5. WHEN generating the PDF THEN the Assessment Engine SHALL include a disclaimer stating this is not a medical diagnosis

### Requirement 12: Integration with The Brain (AI Memory System)

**User Story:** As a user, I want the assessment to leverage my existing health profile from The Brain, so that I don't have to repeat information and get more personalized insights.

#### Acceptance Criteria

1. WHEN starting an assessment THEN the Assessment Engine SHALL query The Brain for the user's existing health profile via pgvector
2. WHEN baseline information exists in The Brain THEN the Assessment Engine SHALL pre-fill baseline questions and allow user confirmation
3. WHEN the assessment is completed THEN the Assessment Engine SHALL store key findings back to The Brain's memory system
4. WHEN generating questions THEN the AI SHALL consider the user's historical assessments and health patterns from The Brain
5. WHEN displaying the report THEN the Assessment Engine SHALL show relevant historical context if available (e.g., "You reported similar symptoms 3 months ago")
