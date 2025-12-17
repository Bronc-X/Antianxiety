# Requirements Document

## Introduction

本文档定义了"动态计划适应系统"（Adaptive Plan Follow-up System）的需求规格。该系统旨在通过主动问询和持续反馈，将用户的健康计划从静态方案转变为动态适应的个性化协议。系统每天主动询问用户感受，从第二天开始追踪计划执行情况，并根据用户反馈智能替换不适合的行动项，直到找到最适合该用户的方案。

## Glossary

- **Adaptive_Plan_System**: 动态计划适应系统，负责主动问询、执行追踪和计划优化的核心模块
- **Follow_Up_Session**: 问询会话，系统主动发起的用户状态检查对话
- **Execution_Tracking**: 执行追踪，记录用户对每个计划项的完成情况和反馈
- **Action_Item**: 行动项，计划中的具体执行动作，包含详细解释
- **Alternative_Action**: 平替行动，效果相似但更符合用户习惯的替代选项
- **Scientific_Explanation**: 科学解释，从生理学、神经学、心理学、行为学等角度对问题和行动的阐述
- **User_Preference_Profile**: 用户偏好档案，记录用户能坚持和需要替换的行动模式
- **Plan_Evolution_History**: 计划演化历史，记录计划从初始到当前的所有变更
- **User_Understanding_Score**: 用户理解度评分（0-100），衡量系统对用户偏好和习惯的理解程度，目标达到95分以上
- **Replacement_Checkbox**: 替换勾选框，用户可勾选表示该行动项需要被平替

## Requirements

### Requirement 1: 主动问询机制

**User Story:** As a user, I want the system to proactively check in with me twice daily, so that I can share how I'm feeling and stay engaged with my health plan.

#### Acceptance Criteria

1. WHEN a user has an active plan AND the current time reaches a configured morning check-in window (default 9:00-10:00) THEN the Adaptive_Plan_System SHALL initiate a Follow_Up_Session asking about the user's current feeling
2. WHEN a user has an active plan AND the current time reaches a configured evening check-in window (default 20:00-21:00) THEN the Adaptive_Plan_System SHALL initiate a Follow_Up_Session asking about the user's day and energy level
3. WHEN a Follow_Up_Session is initiated THEN the Adaptive_Plan_System SHALL use conversational AI to collect user feedback naturally without presenting a form
4. WHEN a user responds to a Follow_Up_Session THEN the Adaptive_Plan_System SHALL store the response with timestamp and sentiment analysis
5. WHEN a user misses a Follow_Up_Session THEN the Adaptive_Plan_System SHALL record the missed session and adjust the next check-in timing

### Requirement 2: 计划执行追踪

**User Story:** As a user, I want the system to track my plan execution starting from day 2, so that I can report which actions I completed and which ones don't fit my lifestyle.

#### Acceptance Criteria

1. WHEN a plan has been active for more than 24 hours THEN the Adaptive_Plan_System SHALL include execution tracking questions in the Follow_Up_Session
2. WHEN tracking execution THEN the Adaptive_Plan_System SHALL present each Action_Item individually and ask the user to select: completed, partially completed, skipped, or needs replacement
3. WHEN a user selects "needs replacement" for an Action_Item THEN the Adaptive_Plan_System SHALL ask follow-up questions about why the action doesn't fit (time constraints, physical limitations, preference, resources)
4. WHEN tracking is complete THEN the Adaptive_Plan_System SHALL calculate and display an execution rate for the plan
5. WHEN an Action_Item is marked as skipped or needs replacement for 3 consecutive days THEN the Adaptive_Plan_System SHALL flag the item for automatic replacement suggestion

### Requirement 3: 智能平替推荐

**User Story:** As a user, I want the system to suggest alternative actions when something doesn't work for me, so that I can find habits that actually fit my lifestyle while achieving similar health benefits.

#### Acceptance Criteria

1. WHEN displaying Action_Items for review THEN the Adaptive_Plan_System SHALL present each item with a checkbox that the user can select to indicate "needs replacement"
2. WHEN a user checks the replacement checkbox for one or more Action_Items THEN the Adaptive_Plan_System SHALL generate at least 3 Alternative_Actions for each selected item with similar efficacy
3. WHEN generating Alternative_Actions THEN the Adaptive_Plan_System SHALL consider the user's stated constraints, User_Preference_Profile, and historical rejection patterns
4. WHEN presenting Alternative_Actions THEN the Adaptive_Plan_System SHALL explain why each alternative achieves similar results from a scientific perspective and why it may better suit the user
5. WHEN a user selects an Alternative_Action THEN the Adaptive_Plan_System SHALL update the plan and record the change in Plan_Evolution_History with the reason for replacement
6. WHEN an Alternative_Action is selected THEN the Adaptive_Plan_System SHALL track its execution separately for the first 3 days to verify it fits better

### Requirement 4: 详细计划内容生成

**User Story:** As a user, I want my plan to include comprehensive scientific explanations and at least 5 detailed action items, so that I understand why each action helps and exactly how to execute it.

#### Acceptance Criteria

1. WHEN generating a new plan THEN the Adaptive_Plan_System SHALL include Scientific_Explanation covering: physiology, neurology, psychology, and behavioral science perspectives
2. WHEN generating a new plan THEN the Adaptive_Plan_System SHALL create a minimum of 5 Action_Items, each with detailed execution instructions
3. WHEN creating an Action_Item THEN the Adaptive_Plan_System SHALL include: specific timing, duration, step-by-step instructions, expected sensation/outcome, and scientific rationale
4. WHEN the user's problem is identified THEN the Adaptive_Plan_System SHALL provide a multi-dimensional explanation addressing root causes from at least 4 scientific domains
5. WHEN displaying plan content THEN the Adaptive_Plan_System SHALL organize information hierarchically with expandable detail sections

### Requirement 5: 计划动态演化与用户理解度评分

**User Story:** As a user, I want my plan to evolve based on my actual interactions and feedback, so that it becomes increasingly personalized and effective over time, with the system demonstrating deep understanding of my preferences.

#### Acceptance Criteria

1. WHEN user feedback indicates consistent difficulty with a category of actions THEN the Adaptive_Plan_System SHALL adjust future recommendations to avoid similar patterns
2. WHEN a user successfully maintains an action for 7 consecutive days THEN the Adaptive_Plan_System SHALL mark it as "established habit" and reduce check-in frequency for that item
3. WHEN generating plan updates THEN the Adaptive_Plan_System SHALL preserve the Plan_Evolution_History showing all changes and reasons
4. WHEN a plan has evolved more than 3 times THEN the Adaptive_Plan_System SHALL generate a summary of what works best for this specific user
5. WHEN displaying the current plan THEN the Adaptive_Plan_System SHALL show both the current version and highlight recent adaptations
6. WHEN any user interaction occurs THEN the Adaptive_Plan_System SHALL calculate and update a User_Understanding_Score (0-100) based on: successful action predictions, replacement accuracy, and feedback alignment
7. WHEN the User_Understanding_Score is below 95 THEN the Adaptive_Plan_System SHALL continue active learning and frequent check-ins to improve understanding
8. WHEN the User_Understanding_Score reaches 95 or above THEN the Adaptive_Plan_System SHALL display a "Deep Understanding Achieved" indicator and optimize check-in frequency
9. WHEN calculating User_Understanding_Score THEN the Adaptive_Plan_System SHALL consider: action completion rate prediction accuracy, replacement suggestion acceptance rate, sentiment prediction accuracy, and preference pattern matching

### Requirement 6: 数据持久化与同步

**User Story:** As a user, I want all my plan data, feedback, and evolution history to be saved and synced, so that I never lose my progress and can access it from any device.

#### Acceptance Criteria

1. WHEN any plan modification occurs THEN the Adaptive_Plan_System SHALL persist the change to the database within 5 seconds
2. WHEN storing Follow_Up_Session data THEN the Adaptive_Plan_System SHALL include: timestamp, user responses, sentiment score, and any action items discussed
3. WHEN storing Execution_Tracking data THEN the Adaptive_Plan_System SHALL record: action item ID, completion status, user notes, and replacement requests
4. WHEN a user accesses their plan from a different device THEN the Adaptive_Plan_System SHALL display the most recent version with full history
5. WHEN serializing plan data for storage THEN the Adaptive_Plan_System SHALL use a structured JSON format
6. WHEN deserializing plan data from storage THEN the Adaptive_Plan_System SHALL reconstruct the complete plan object with all history

