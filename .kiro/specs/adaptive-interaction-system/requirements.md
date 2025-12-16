# Requirements Document

## Introduction

本文档定义了 No More Anxious 应用的**自适应交互系统**重构需求。核心目标是将注册问卷、每日校准、AI 主动问询、去噪信息流四个模块打通，形成一个基于用户"阶段性目标"的智能闭环系统。

## Glossary

- **Adaptive Onboarding（自适应注册问卷）**: 由 3 道模板问题 + 最多 4 道 AI 决策树动态问题组成的注册流程，总计不超过 7 道题
- **Phase Goal（阶段性目标）**: 系统根据问卷结果推荐的 1-2 个优先健康目标（如"改善睡眠"、"提升能量"）
- **Daily Calibration（每日校准）**: 每日自适应问卷，根据阶段性目标动态调整问题内容
- **Active Inquiry（主动问询）**: AI 基于用户数据主动发起的诊断性问题
- **De-noised Feed（去噪信息流）**: 根据用户特征个性化推送的科学资讯和论文
- **Decision Tree（决策树）**: 基于用户前序回答动态生成后续问题的 AI 逻辑
- **Anchor Question（锚点问题）**: 每日校准中固定出现的基础问题

## Requirements

### Requirement 1: Adaptive Onboarding Questionnaire

**User Story:** As a new user, I want to complete a quick yet personalized onboarding questionnaire, so that the system can accurately understand my health profile and recommend appropriate goals.

#### Acceptance Criteria

1. WHEN a user starts the onboarding flow THEN the System SHALL display a 3-minute countdown timer to set user expectations
2. WHEN the onboarding begins THEN the System SHALL present exactly 3 template questions that apply to all users
3. WHEN a user answers a template question THEN the System SHALL use AI to generate the next decision-tree question within 800ms
4. WHEN generating decision-tree questions THEN the System SHALL display a subtle loading indicator without blocking user interaction
5. WHEN the total question count reaches 7 THEN the System SHALL proceed to goal recommendation regardless of decision-tree depth
6. WHEN a user completes all questions THEN the System SHALL generate 1-2 prioritized Phase Goals with scientific citations within 2 seconds

### Requirement 2: Phase Goal Recommendation and Modification

**User Story:** As a user who completed onboarding, I want to receive AI-recommended health goals that I can review and modify, so that I have ownership over my health journey while benefiting from AI insights.

#### Acceptance Criteria

1. WHEN onboarding completes THEN the System SHALL display 1-2 recommended Phase Goals with clear priority ranking
2. WHEN displaying Phase Goals THEN the System SHALL include a brief scientific rationale with at least one citation for each goal
3. WHEN a user attempts to modify a recommended goal THEN the System SHALL present an AI explanation of why the original recommendation was made
4. WHEN a user confirms goal modification THEN the System SHALL update the user profile and recalibrate all dependent systems within 1 second
5. WHEN Phase Goals are set THEN the System SHALL sync them to the Settings page, replacing the manual goal selection UI

### Requirement 3: Adaptive Daily Calibration

**User Story:** As a returning user, I want my daily check-in questions to evolve based on my progress and goals, so that I stay engaged and the system gathers increasingly relevant data.

#### Acceptance Criteria

1. WHEN a user opens daily calibration THEN the System SHALL generate questions tailored to their current Phase Goal
2. WHEN generating daily questions THEN the System SHALL include at least one anchor question for baseline tracking
3. WHEN a user completes 7 consecutive days of calibration THEN the System SHALL introduce a "major evolution" in question depth and focus
4. WHEN daily calibration questions change THEN the System SHALL maintain continuity by referencing previous answers when relevant
5. WHEN a user's Phase Goal changes THEN the System SHALL immediately adapt daily calibration questions to reflect the new goal

### Requirement 4: AI Active Inquiry System

**User Story:** As a user, I want the AI to proactively ask me the most relevant diagnostic questions at optimal times, so that I receive personalized insights without having to initiate every interaction.

#### Acceptance Criteria

1. WHEN determining inquiry timing THEN the System SHALL analyze user activity patterns to identify optimal engagement windows
2. WHEN the optimal inquiry window arrives THEN the System SHALL send a push notification with a single high-priority diagnostic question
3. WHEN a user opens the app THEN the System SHALL display an active inquiry question if one is pending and relevant
4. WHEN generating inquiry questions THEN the System SHALL prioritize questions that address gaps in user health data
5. WHEN a user responds to an inquiry THEN the System SHALL update the user profile and adjust future inquiry priorities accordingly

### Requirement 5: AI-Powered Feed Recommendations

**User Story:** As a user, I want the AI to proactively recommend relevant articles from my de-noised feed, so that I discover valuable content without endless scrolling.

#### Acceptance Criteria

1. WHEN the AI identifies highly relevant feed content THEN the System SHALL include a feed recommendation in the active inquiry
2. WHEN recommending feed content THEN the System SHALL explain why this content is relevant to the user's Phase Goal
3. WHEN a user engages with a recommended article THEN the System SHALL track engagement to improve future recommendations

### Requirement 6: Backend Content Curation Workflow

**User Story:** As a system administrator, I want an automated backend workflow that curates personalized content for each user, so that the de-noised feed remains fresh and relevant without manual intervention.

#### Acceptance Criteria

1. WHEN the scheduled curation job runs THEN the System SHALL fetch new content from configured APIs (Semantic Scholar, RSS feeds) for each active user
2. WHEN fetching content THEN the System SHALL filter results based on user Phase Goals, metabolic profile, and engagement history
3. WHEN new content is curated THEN the System SHALL store it in the user's personalized feed queue with relevance scores
4. WHEN the curation job completes THEN the System SHALL log execution metrics and any errors for monitoring
5. WHEN a user has not been active for 7 days THEN the System SHALL reduce curation frequency to conserve resources
