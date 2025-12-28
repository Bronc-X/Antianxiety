# Requirements Document: Digital Twin AI Analytics

## Introduction

数字孪生 AI 分析系统是 "No More Anxious" 平台的核心智能引擎。它通过调用大语言模型和 Semantic Scholar 期刊 API，对用户的多维度数据进行深度分析，生成：
1. **生理状态评测** - 基于科学文献的健康状态分析
2. **自适应计划** - 个性化的干预和改善建议
3. **仪表盘数据** - 动态更新的可视化指标

这不是静态模板，而是基于用户真实数据的 AI 实时分析结果。

## Glossary

- **Digital_Twin_Engine**: 核心 AI 分析引擎，整合大模型和期刊 API 进行智能分析
- **Data_Collector**: 从多个数据源收集用户数据的服务
- **LLM_Analyzer**: 调用大语言模型进行数据分析的模块
- **Journal_API**: Semantic Scholar API，用于获取科学文献支持
- **Adaptive_Planner**: 基于分析结果生成个性化计划的模块
- **Dashboard_Generator**: 将分析结果转换为仪表盘数据的模块
- **Physiological_Assessment**: AI 生成的生理状态评测报告

## Requirements

### Requirement 1: Multi-Source Data Collection

**User Story:** As a user, I want the system to collect all my health-related data, so that AI can perform comprehensive analysis.

#### Acceptance Criteria

1. WHEN a user completes the clinical onboarding questionnaire, THE Data_Collector SHALL store GAD-7, PHQ-9, ISI, PSS-10 scores with timestamps
2. WHEN a user completes a daily calibration, THE Data_Collector SHALL store sleep duration, mood, stress level, and energy data
3. WHEN Max asks proactive questions, THE Data_Collector SHALL store the questions and user responses
4. WHEN a user converses with Max, THE Data_Collector SHALL store conversation summaries and extracted health indicators
5. THE Data_Collector SHALL maintain a unified user_health_data table with all data points and their sources

### Requirement 2: LLM-Powered Physiological Assessment

**User Story:** As a user, I want AI to analyze my data and provide a scientific assessment of my physiological state, so that I understand my current health status.

#### Acceptance Criteria

1. WHEN sufficient data is available, THE LLM_Analyzer SHALL call the large language model with structured user data
2. THE LLM_Analyzer SHALL include in the prompt: questionnaire scores, daily calibration trends, conversation insights, and baseline metrics
3. THE LLM_Analyzer SHALL request the model to output: current state assessment, trend analysis, and risk indicators
4. THE LLM_Analyzer SHALL format the output as structured JSON for dashboard consumption
5. IF the LLM call fails, THEN THE system SHALL retry with exponential backoff and fall back to cached analysis

### Requirement 3: Scientific Grounding via Journal API

**User Story:** As a user, I want my health insights to be backed by scientific research, so that I can trust the recommendations.

#### Acceptance Criteria

1. WHEN generating an assessment, THE Journal_API module SHALL query Semantic Scholar for relevant papers
2. THE Journal_API module SHALL search using keywords extracted from the user's primary concerns (e.g., "GAD treatment", "sleep anxiety correlation")
3. THE LLM_Analyzer SHALL incorporate paper abstracts and findings into the analysis prompt
4. THE Physiological_Assessment SHALL include citations to supporting research papers
5. THE system SHALL cache journal results to reduce API calls and improve response time

### Requirement 4: Adaptive Plan Generation

**User Story:** As a user, I want personalized recommendations based on my data, so that I can take actionable steps to improve my mental health.

#### Acceptance Criteria

1. WHEN the LLM_Analyzer completes assessment, THE Adaptive_Planner SHALL generate a personalized intervention plan
2. THE Adaptive_Planner SHALL consider: user's current state, historical trends, and scientific best practices
3. THE Adaptive_Planner SHALL output: daily focus areas, breathing exercises, sleep recommendations, and activity suggestions
4. WHEN user data changes significantly, THE Adaptive_Planner SHALL update the plan within 24 hours
5. THE Adaptive_Planner SHALL prioritize interventions based on the user's most pressing concerns

### Requirement 5: Dashboard Data Generation

**User Story:** As a user, I want to see my analysis results in a visual dashboard, so that I can quickly understand my health status.

#### Acceptance Criteria

1. THE Dashboard_Generator SHALL transform LLM analysis into structured dashboard data
2. THE Dashboard_Generator SHALL output: predicted longitudinal outcomes (3/6/9/12/15 weeks)
3. THE Dashboard_Generator SHALL output: treatment timeline with milestones
4. THE Dashboard_Generator SHALL output: baseline vs current comparison data
5. THE Dashboard_Generator SHALL output: metric endpoint charts with trend indicators
6. THE Dashboard_Generator SHALL include confidence intervals for all predictions

### Requirement 6: Real-Time Analysis Triggers

**User Story:** As a user, I want my dashboard to update automatically when I provide new data, so that I always see current insights.

#### Acceptance Criteria

1. WHEN a user completes a daily calibration, THE Digital_Twin_Engine SHALL trigger a re-analysis
2. WHEN a user has a significant conversation with Max (>5 exchanges), THE Digital_Twin_Engine SHALL queue a background analysis
3. THE system SHALL batch analysis requests to avoid excessive LLM calls (max 1 full analysis per 6 hours)
4. THE system SHALL perform incremental updates for minor data changes
5. THE Dashboard SHALL display "Last analyzed: [timestamp]" to show data freshness

### Requirement 7: Participant Profile Integration

**User Story:** As a user, I want my digital twin to reflect my personal information, so that the analysis feels personalized to me.

#### Acceptance Criteria

1. THE Digital_Twin_Engine SHALL use the user's profile data (age, gender, primary concern) in analysis
2. THE LLM_Analyzer SHALL adjust recommendations based on demographic factors
3. THE Dashboard SHALL display the user's initials and primary diagnosis
4. THE system SHALL NOT expose raw profile data in API responses beyond what's needed for display

### Requirement 8: Analysis History and Versioning

**User Story:** As a user, I want to see how my analysis has changed over time, so that I can track my progress.

#### Acceptance Criteria

1. THE system SHALL store each analysis result with a timestamp and version number
2. THE Dashboard SHALL allow users to view previous analysis snapshots
3. WHEN displaying historical data, THE system SHALL show the delta between current and previous assessments
4. THE system SHALL retain analysis history for at least 12 months

### Requirement 9: Data Privacy and Security

**User Story:** As a user, I want my health data and AI analysis to be secure, so that I feel safe using the platform.

#### Acceptance Criteria

1. THE Digital_Twin_Engine SHALL only process data belonging to the authenticated user
2. WHEN calling external APIs (LLM, Semantic Scholar), THE system SHALL NOT include personally identifiable information
3. THE system SHALL anonymize user data before sending to LLM (use user_id instead of name)
4. THE system SHALL enforce Row Level Security (RLS) on all analysis data tables
5. THE system SHALL log all analysis requests for audit purposes
