# Requirements Document

## Introduction

本规范定义了 Neuromind 从通用健康追踪器向"抗焦虑认知假肢"的核心转型。核心哲学是"真相即是抛弃想象后的安慰"。系统将用户的生理数据重新框架为"安慰性真相"，而非引发焦虑的警告。

## Glossary

- **Neuromind**: 抗焦虑认知假肢系统，帮助用户通过科学真相获得内心平静
- **Comforting Truth (安慰性真相)**: 将生理症状重新框架为生物适应性解释，而非失败或警告
- **Bio-Voltage (生物电压)**: 基于道家内丹和迷走神经理论的能量调节概念
- **Consensus Meter (共识仪表)**: 显示科学共识程度的可视化组件
- **Active Inquiry (主动询问)**: AI 基于用户数据主动提出贝叶斯诊断问题的交互模式
- **Cognitive Reframing (认知重构)**: 将负面数据解读转化为中性或积极的生物学解释
- **HRV**: 心率变异性，反映自主神经系统状态的生物指标
- **Constitutional AI**: 基于宪法原则约束的 AI 系统提示方法

## Requirements

### Requirement 1: Insight Engine (认知重构引擎)

**User Story:** As a user with low sleep or HRV data, I want to receive comforting biological explanations instead of anxiety-inducing warnings, so that I can understand my body without feeling judged.

#### Acceptance Criteria

1. WHEN the Insight API receives user biometric data (sleep_hours, hrv) THEN the Neuromind SHALL generate a reframed explanation using metabolic physiology metaphors
2. WHEN the system generates an insight THEN the Neuromind SHALL avoid judgmental language and use "bio-electric" or "adaptation" framing
3. WHEN sleep_hours is below 7 THEN the Neuromind SHALL explain the symptom as "mitochondria prioritizing repair" rather than "sleep deprivation detected"
4. WHEN HRV is low THEN the Neuromind SHALL frame it as "nervous system recalibrating" rather than "stress detected"
5. WHEN the API endpoint `/api/insight/generate` receives a POST request THEN the Neuromind SHALL return a streaming text response with the reframed insight

### Requirement 2: Bio-Voltage Mission Card (生物电压调节卡片)

**User Story:** As an anxious user, I want to receive specific micro-habit recommendations based on my current anxiety level, so that I can take immediate action to regulate my nervous system.

#### Acceptance Criteria

1. WHEN the user's stress_level is high (>7) THEN the Neuromind SHALL recommend "Six Healing Sounds (Exhale focus)" with the description "Discharge excess noise"
2. WHEN the user's stress_level is low (<4) or energy is low THEN the Neuromind SHALL recommend "Standing Meditation (Zhan Zhuang)" with the description "Grounding to recharge"
3. WHEN the Bio-Voltage card renders THEN the Neuromind SHALL display a calm pulsing circular animation simulating Qi/Voltage flow
4. WHEN the card title displays THEN the Neuromind SHALL show "Bio-Voltage Regulation" instead of "Core Mission"

### Requirement 3: Consensus Meter (科学共识仪表)

**User Story:** As a user seeking scientific validation, I want to see the level of scientific consensus behind each insight, so that I can trust the information I receive.

#### Acceptance Criteria

1. WHEN displaying scientific sources THEN the Neuromind SHALL show a "Consensus Meter" gauge component
2. WHEN the Consensus Meter renders THEN the Neuromind SHALL display a percentage value (e.g., "High Consensus (85%)")
3. WHEN the Consensus Meter renders THEN the Neuromind SHALL show verification text (e.g., "Verified by 12 meta-analyses")
4. WHEN the card title displays THEN the Neuromind SHALL show "Scientific Consensus" instead of "Evidence Base"

### Requirement 4: Active Inquiry Chat (主动询问聊天)

**User Story:** As a user opening the chat assistant, I want the AI to proactively ask me a specific diagnostic question based on my data, so that I feel understood and can provide relevant context.

#### Acceptance Criteria

1. WHEN the chat assistant opens THEN the Neuromind SHALL NOT display a generic greeting like "How can I help?"
2. WHEN the chat assistant opens with available user data THEN the Neuromind SHALL generate a Bayesian diagnostic question based on detected patterns
3. WHEN HRV data shows a dip at a specific time THEN the Neuromind SHALL ask about potential triggers (e.g., "Was there a stress trigger or high-carb lunch?")
4. WHEN generating the initial question THEN the Neuromind SHALL reference specific data points from the user's daily logs

### Requirement 5: Insight API Endpoint

**User Story:** As a frontend developer, I want a dedicated API endpoint for generating reframed insights, so that the insight generation logic is separated from the general chat functionality.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/insight/generate` THEN the Neuromind SHALL accept a JSON body with biometric data (sleep_hours, hrv, stress_level)
2. WHEN processing the insight request THEN the Neuromind SHALL use a Constitutional AI system prompt that enforces the "Metabolic Physiologist" persona
3. WHEN the insight is generated THEN the Neuromind SHALL return a streaming text response
4. WHEN the API encounters an error THEN the Neuromind SHALL return an appropriate error response with status code and message
