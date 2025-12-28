# Requirements Document

## Introduction

Max 计划对话框修复规范。本文档针对用户反馈的五个核心问题进行修复：消息重复、层级问题、问题针对性不足、确认按钮设计问题、以及语言混合问题。

## Glossary

- **Max_Plan_Dialog**: Max 协助制定计划的对话框组件
- **Chat_Message**: 对话中的单条消息
- **Question_Generator**: 问题生成器，根据用户数据生成针对性问题
- **User_Profile**: 用户档案，包含所有已录入的健康数据
- **Language_Preference**: 用户语言偏好设置（zh/en）
- **Z_Index**: CSS 层级属性，控制元素堆叠顺序
- **Confirm_Button**: 确认计划按钮

## Requirements

### Requirement 1: 消息去重机制

**User Story:** As a user, I want each message to appear only once in the chat, so that the conversation feels natural and not confusing.

#### Acceptance Criteria

1. WHEN the System displays a Chat_Message, THE Max_Plan_Dialog SHALL ensure no duplicate messages with the same content appear consecutively
2. WHEN the User submits a response, THE System SHALL display the user's message exactly once
3. WHEN Max generates a response, THE System SHALL display Max's message exactly once
4. THE System SHALL use unique message IDs to track and prevent duplicate rendering
5. IF a duplicate message is detected, THEN THE System SHALL skip rendering the duplicate

### Requirement 2: 对话框层级优化

**User Story:** As a user, I want the chat dialog to appear above all other UI elements, so that I can interact with it without obstruction.

#### Acceptance Criteria

1. WHEN the Max_Plan_Dialog opens, THE Dialog SHALL render with z-index of 9999 or higher
2. THE Dialog backdrop SHALL cover all other UI elements including navigation bars and floating buttons
3. WHEN the Dialog is open, THE System SHALL prevent interaction with elements behind the backdrop
4. THE Dialog SHALL remain on top even when other modals or toasts appear
5. WHEN the Dialog closes, THE System SHALL restore normal z-index layering

### Requirement 3: 自适应问题生成

**User Story:** As a user, I want Max to ask me targeted questions based on all my recorded health data, so that the plan is truly personalized.

#### Acceptance Criteria

1. WHEN generating questions, THE Question_Generator SHALL analyze all available User_Profile data including: inquiry history, calibration logs, HRV data, and previous plan feedback
2. THE Question_Generator SHALL generate questions that fill gaps in the user's data profile
3. THE Question_Generator SHALL avoid asking about information already recorded in the User_Profile
4. WHEN the User has recent calibration data, THE System SHALL skip redundant questions about sleep, stress, and energy
5. THE Question_Generator SHALL generate at least 3 and at most 5 targeted questions based on data gaps
6. WHEN the User has comprehensive data, THE System SHALL proceed directly to plan generation with minimal questions

### Requirement 4: 确认按钮优化

**User Story:** As a user, I want the confirm button to be clearly visible and well-positioned, so that I can easily save my plan.

#### Acceptance Criteria

1. THE Confirm_Button SHALL be positioned at the bottom of the dialog with fixed positioning
2. THE Confirm_Button SHALL have sufficient padding from screen edges (minimum 16px)
3. THE Confirm_Button SHALL use the primary brand color (#0B3D2E) with adequate contrast
4. THE Confirm_Button SHALL have a minimum height of 48px for touch accessibility
5. THE Confirm_Button SHALL be visible without scrolling when plan items are displayed
6. WHEN the plan items list is long, THE Confirm_Button SHALL remain sticky at the bottom

### Requirement 5: 语言一致性

**User Story:** As a user, I want all text in the dialog to be in my preferred language, so that the experience is consistent and understandable.

#### Acceptance Criteria

1. WHEN the User's Language_Preference is 'zh', THE System SHALL display all UI text, Max messages, and options in Chinese
2. WHEN the User's Language_Preference is 'en', THE System SHALL display all UI text, Max messages, and options in English
3. THE System SHALL NOT mix languages within a single dialog session
4. WHEN generating plan items, THE System SHALL use the same language as the dialog
5. THE System SHALL use the language preference from the i18n context, not from browser headers
6. IF language preference changes mid-session, THEN THE System SHALL maintain the original session language until dialog closes

