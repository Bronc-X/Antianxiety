# Requirements Document

## Introduction

贝叶斯信念循环 (Bayesian Belief Loop) 是 No More Anxious 平台的核心差异化功能——一个"认知天平"系统。它将贝叶斯公式可视化为动态天平，帮助用户用数学真相替代焦虑。

**核心概念：认知天平 (The Cognitive Scale)**
- 左端（红）：先验焦虑 (Prior) —— 用户主观认为"坏事发生"的概率
- 右端（绿/蓝）：真相砝码 (Evidence) —— 生理数据 + 科学共识
- 结果：后验概率 (Posterior) —— 天平平衡后的最终读数

该系统支持两种交互模式：
1. **主动式沉浸重构 (Active Ritual)**: 全屏沉浸体验，用于每日校准或用户主动触发
2. **被动式微修正 (Passive Nudge)**: 不打断的微提示，用于习惯完成或生理数据好转时

## Glossary

- **Belief Context (信念上下文)**: 用户焦虑的具体场景，如 "Metabolic Crash" (代谢崩溃), "Cardiac Event" (心脏事件), "Social Rejection" (社交被拒)
- **Prior Score (先验分数)**: 用户输入的初始恐惧值 (0-100)
- **Posterior Score (后验分数)**: 贝叶斯计算后的修正值 (0-100)
- **Evidence Stack (证据栈)**: 存储所有权重来源的 JSONB 结构
- **Bio Evidence (生理证据)**: 来自用户生理数据的证据，如 HRV、睡眠质量
- **Science Evidence (科学证据)**: 来自 Semantic Scholar 的学术论文共识
- **Action Evidence (行为证据)**: 来自用户完成的健康行为，如呼吸练习
- **Cognitive Scale (认知天平)**: 贝叶斯公式的可视化表现形式
- **Active Ritual (主动仪式)**: 全屏沉浸式的焦虑重构体验
- **Passive Nudge (被动微调)**: 不打断用户的微小概率修正提示
- **Evidence Weight (证据权重)**: 每条证据对后验概率的影响程度 (0.0-1.0)

## Requirements

### Requirement 1

**User Story:** As a user experiencing anxiety, I want to input my current fear level about a specific concern, so that the system can help me recalibrate my perception with evidence.

#### Acceptance Criteria

1. WHEN a user triggers the Active Ritual (via daily calibration or "I'm anxious" button) THEN the system SHALL display a full-screen dark interface with a red slider
2. WHEN displaying the fear input THEN the system SHALL show the prompt "你现在觉得这件事发生的可能性有多大？" with a 0-100% slider
3. WHEN a user selects a belief context THEN the system SHALL offer predefined contexts (Metabolic Crash, Cardiac Event, Social Rejection) plus custom input
4. WHEN the prior score is submitted THEN the system SHALL store it in the bayesian_beliefs table with timestamp and context

### Requirement 2

**User Story:** As a user, I want to see evidence being "dropped onto the scale" with visual and haptic feedback, so that I can feel the weight of truth countering my anxiety.

#### Acceptance Criteria

1. WHEN evidence collection begins THEN the system SHALL trigger haptic feedback (Capacitor Haptics)
2. WHEN bio evidence is available THEN the system SHALL use Framer Motion to animate a green weight dropping onto the scale with spring physics and text like "检测到 HRV 稳定..."
3. WHEN science evidence is retrieved THEN the system SHALL use Framer Motion to animate a blue weight dropping onto the scale with stagger delay and paper citation
4. WHEN action evidence exists THEN the system SHALL use Framer Motion to animate an additional weight with scale and opacity transitions
5. WHEN the user taps on a science evidence weight THEN the system SHALL open the Semantic Scholar paper link

### Requirement 3

**User Story:** As a user, I want to see the Bayesian calculation happen dramatically, so that I can experience the "truth moment" when my fear is mathematically reduced.

#### Acceptance Criteria

1. WHEN all evidence is collected THEN the system SHALL use Framer Motion AnimatePresence to display the Bayesian formula P(H|E) with a subtle background glow animation
2. WHEN calculating the posterior THEN the system SHALL use Framer Motion useSpring to animate the number rolling down from prior to posterior with easing
3. WHEN the calculation completes THEN the system SHALL use Framer Motion variants to reveal the summary "数学显示，你的恐惧被夸大了 X 倍" with stagger children
4. WHEN the posterior is significantly lower than prior THEN the system SHALL use celebratory haptic feedback combined with Framer Motion scale pulse animation
5. WHEN displaying results THEN the system SHALL serialize the calculation to JSON and store in evidence_stack

### Requirement 4

**User Story:** As a user completing healthy actions, I want to receive passive probability corrections, so that my anxiety index updates without interrupting my flow.

#### Acceptance Criteria

1. WHEN a user completes a habit (e.g., breathing exercise) THEN the system SHALL trigger a Passive Nudge
2. WHEN triggering a Passive Nudge THEN the system SHALL use Framer Motion to slide in a toast/dynamic island notification from the top with spring physics
3. WHEN displaying the nudge THEN the system SHALL use Framer Motion motion path to animate a small green particle flying into the main anxiety index with bezier curve trajectory
4. WHEN the nudge completes THEN the system SHALL use Framer Motion to fade out the toast while showing text like "呼吸完成。皮质醇风险概率修正：-5%"
5. WHEN updating via Passive Nudge THEN the system SHALL silently update the posterior_score in the database

### Requirement 5

**User Story:** As a user, I want my evidence to be properly weighted and normalized, so that the Bayesian calculation produces meaningful results.

#### Acceptance Criteria

1. WHEN storing evidence THEN the system SHALL use the unified evidence_stack JSONB format with type, value, source_id, consensus, and weight fields
2. WHEN calculating weights THEN the system SHALL assign bio evidence weight between 0.2-0.4 based on data quality
3. WHEN calculating weights THEN the system SHALL assign science evidence weight between 0.3-0.6 based on consensus score
4. WHEN calculating weights THEN the system SHALL assign action evidence weight between 0.05-0.2 based on action type
5. WHEN all weights are summed THEN the system SHALL normalize them to total 1.0 before Bayesian calculation

### Requirement 6

**User Story:** As a user, I want to see my anxiety trend over time, so that I can observe how evidence accumulation reduces my baseline fear.

#### Acceptance Criteria

1. WHEN displaying the anxiety dashboard THEN the system SHALL use Framer Motion to animate the line chart drawing of posterior_score over time with path animation
2. WHEN the posterior score decreases THEN the system SHALL color the curve segment in sage green (#9CAF88) with Framer Motion color transition
3. WHEN the posterior score increases THEN the system SHALL color the curve segment in clay (#C4A77D) with Framer Motion color transition
4. WHEN the user has less than 3 data points THEN the system SHALL use Framer Motion to animate an encouraging placeholder message with fade and scale
5. WHEN the user taps a data point THEN the system SHALL use Framer Motion layoutId to expand and show the evidence_stack that contributed to that score

### Requirement 7

**User Story:** As a developer, I want the Bayesian calculations and evidence storage to be handled in the database, so that results are consistent and auditable.

#### Acceptance Criteria

1. WHEN a new belief record is created THEN the database trigger SHALL execute the Bayesian update function
2. WHEN calculating posterior THEN the system SHALL use PostgreSQL pl/pgsql function with the formula: posterior = (likelihood × prior) / evidence
3. WHEN storing results THEN the system SHALL write to bayesian_beliefs table with full evidence_stack JSONB
4. WHEN the calculation fails THEN the system SHALL log the error and maintain the previous posterior_score
5. WHEN serializing evidence_stack THEN the system SHALL validate JSON structure before storage

### Requirement 8

**User Story:** As a user, I want the system to retrieve relevant scientific evidence automatically, so that my anxiety is countered by real research.

#### Acceptance Criteria

1. WHEN a belief context is selected THEN the system SHALL query Semantic Scholar for relevant papers
2. WHEN retrieving papers THEN the system SHALL filter for high-consensus papers (citation count > 50)
3. WHEN displaying science evidence THEN the system SHALL show paper title, consensus score, and clickable link
4. WHEN no relevant papers are found THEN the system SHALL use cached general anxiety research as fallback
5. WHEN the API call fails THEN the system SHALL gracefully degrade to bio and action evidence only

