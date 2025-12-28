# Requirements Document

## Introduction

Max 协助制定计划对话系统是一个 AI 驱动的交互式计划制定功能。当用户点击"Max协助你一起制定计划"按钮时，系统会打开一个对话框，Max 会主动分析用户的问询结果、最近关注点和不适症状，结合 HRV 数据（如有），为用户生成个性化训练计划。每个计划项允许用户点击替换，直到用户确认后保存并开始执行。

## Glossary

- **Max**: AI 健康助手，负责与用户对话并生成个性化计划，使用 DeepSeek 3.2 或 Gemini 3 Flash 模型
- **Plan_Dialog**: Max 计划制定对话框组件
- **Plan_Item**: 计划中的单个行动项目
- **Inquiry_Data**: 用户问询系统收集的数据
- **HRV_Data**: 心率变异性数据，来自可穿戴设备
- **Calibration_Data**: 每日校准数据（睡眠、情绪、压力等）
- **Plan_Session**: 一次完整的计划制定会话
- **Replacement_Request**: 用户请求替换某个计划项的操作

## Requirements

### Requirement 1: 对话框初始化与数据分析

**User Story:** As a user, I want Max to automatically analyze my health data when I open the plan creation dialog, so that I can receive personalized recommendations based on my current state.

#### Acceptance Criteria

1. WHEN a user clicks the "Max协助你一起制定计划" button, THE Plan_Dialog SHALL open and display a loading state
2. WHEN the Plan_Dialog opens, THE System SHALL fetch the user's Inquiry_Data, Calibration_Data, and HRV_Data (if available)
3. IF the user has not completed any inquiry or calibration, THEN THE Max SHALL proactively ask about recent concerns and discomforts
4. WHEN data is successfully fetched, THE Max SHALL display a summary analysis of the user's current health state
5. THE Max SHALL present the analysis in a conversational, non-alarmist tone following the "California Calm" design philosophy

### Requirement 2: 主动问询缺失数据

**User Story:** As a user, I want Max to ask me about my recent concerns if I haven't provided that information, so that the plan can be tailored to my actual needs.

#### Acceptance Criteria

1. IF Inquiry_Data is empty or stale (older than 7 days), THEN THE Max SHALL ask the user about recent health concerns
2. IF Calibration_Data is missing, THEN THE Max SHALL ask about sleep quality, stress level, and energy level
3. WHEN the user provides responses to Max's questions, THE System SHALL store these responses for plan generation
4. THE Max SHALL limit proactive questions to a maximum of 3 to avoid overwhelming the user
5. WHEN the user skips a question, THE System SHALL proceed with available data

### Requirement 3: 个性化计划生成

**User Story:** As a user, I want Max to generate a personalized training plan based on my health data, so that I can follow actionable steps to improve my wellbeing.

#### Acceptance Criteria

1. WHEN sufficient data is collected, THE Max SHALL generate a personalized plan with 3-5 action items
2. THE Plan_Item SHALL include: title, action description, scientific rationale, and difficulty level
3. WHEN HRV_Data is available, THE System SHALL incorporate HRV insights into plan recommendations
4. THE Plan_Item SHALL be relevant to the user's identified concerns and goals
5. THE System SHALL display each Plan_Item with a "替换" (replace) button

### Requirement 4: 计划项替换功能

**User Story:** As a user, I want to replace individual plan items with alternatives, so that I can customize the plan to my preferences.

#### Acceptance Criteria

1. WHEN a user clicks the "替换" button on a Plan_Item, THE System SHALL generate an alternative item of similar category and difficulty
2. THE replacement item SHALL be different from the original but address the same health concern
3. THE System SHALL allow unlimited replacements until the user is satisfied
4. WHEN generating a replacement, THE System SHALL show a brief loading indicator
5. THE replaced item SHALL animate smoothly to indicate the change

### Requirement 5: 计划确认与保存

**User Story:** As a user, I want to confirm and save my plan, so that I can start executing it immediately.

#### Acceptance Criteria

1. WHEN the user clicks "确认计划" button, THE System SHALL save the plan to the database
2. THE saved plan SHALL include all finalized Plan_Items with their metadata
3. WHEN the plan is saved successfully, THE Plan_Dialog SHALL close and the plan list SHALL refresh
4. THE System SHALL display a success toast notification upon successful save
5. IF save fails, THEN THE System SHALL display an error message and allow retry

### Requirement 6: 历史计划查询

**User Story:** As a user, I want to view my historical plans, so that I can track my progress and review past recommendations.

#### Acceptance Criteria

1. WHEN a user clicks "历史计划" button, THE System SHALL display a list of completed and past plans
2. THE history list SHALL show plan title, creation date, completion percentage, and status
3. THE System SHALL sort history plans by date in descending order (newest first)
4. WHEN a user clicks on a historical plan, THE System SHALL expand to show plan details

### Requirement 7: 对话式交互体验

**User Story:** As a user, I want the plan creation process to feel like a natural conversation with Max, so that the experience is engaging and not clinical.

#### Acceptance Criteria

1. THE Max SHALL use conversational language appropriate to the user's language preference (zh/en)
2. THE Max SHALL display messages with typing animation to simulate natural conversation
3. THE Plan_Dialog SHALL support scrollable chat history within the session
4. WHEN the user sends a message, THE System SHALL process it and Max SHALL respond contextually
5. THE Max SHALL use the "California Calm" tone: warm, supportive, and solution-oriented

### Requirement 8: 数据隐私与安全

**User Story:** As a user, I want my health data to be handled securely, so that my privacy is protected.

#### Acceptance Criteria

1. THE System SHALL only fetch data for the authenticated user (RLS enforcement)
2. THE Plan_Session data SHALL be associated with the user's ID and not accessible to others
3. WHEN the dialog closes without saving, THE System SHALL not persist any draft data
4. THE System SHALL handle unauthorized access gracefully with appropriate error messages
