# Design Document: Adaptive Plan Follow-up System

## Overview

动态计划适应系统是一个智能健康计划管理模块，通过主动问询、执行追踪和智能平替，将静态健康方案转变为持续演化的个性化协议。系统的核心目标是达到95分以上的用户理解度评分，确保每个计划都真正适合该用户的生活方式和偏好。

**与现有系统集成**：本系统将与现有的 `AIAssistantChat` 组件和 `/api/chat` 端点深度集成，复用现有的：
- AI对话引擎（DeepSeek API + RAG）
- 用户档案系统（profiles表）
- 对话历史存储（ai_conversations表）
- 科学文献搜索（Scientific Search）
- AI记忆系统（ai_memory表 + pgvector）

### Key Design Principles

1. **对话优先** - 所有数据收集通过自然对话完成，遵循项目宪法的"Active Inquiry > Forms"原则，复用现有的 `AIAssistantChat` 组件
2. **科学支撑** - 每个行动项和解释都有多维度科学依据（生理学、神经学、心理学、行为学），复用现有的 `searchScientificTruth` 服务
3. **渐进适应** - 系统通过持续学习逐步理解用户，而非一次性收集所有信息，与现有的 `ai_memory` 系统集成
4. **California Calm** - UI保持高端杂志风格，使用Sand/Clay/Sage配色，避免医疗感
5. **Max人格一致性** - 问询对话保持Max的Bio-Operating System Co-pilot风格，使用现有的 `buildDynamicPersonaPrompt` 函数

## Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[Plan Dashboard UI<br/>PlanListWithActions.tsx]
        FollowUp[Follow-up Session Modal<br/>复用 AIAssistantChat]
        Checkbox[Action Item Checkboxes]
        Score[Understanding Score Display]
    end
    
    subgraph "Service Layer"
        FollowUpService[Follow-up Service]
        TrackingService[Execution Tracking Service]
        AlternativeService[Alternative Generation Service]
        ScoreService[Understanding Score Service]
        SchedulerService[Check-in Scheduler<br/>Cron Job]
    end
    
    subgraph "AI Layer - 复用现有"
        ChatAPI[/api/chat<br/>现有端点]
        ScientificSearch[searchScientificTruth<br/>现有服务]
        AIMemory[AI Memory System<br/>现有 pgvector]
        PersonaPrompt[buildDynamicPersonaPrompt<br/>现有函数]
    end
    
    subgraph "Data Layer"
        PlanStore[(user_plans<br/>现有表)]
        FollowUpStore[(follow_up_sessions<br/>新表)]
        TrackingStore[(execution_tracking<br/>新表)]
        HistoryStore[(plan_evolution_history<br/>新表)]
        ScoreStore[(user_understanding_scores<br/>新表)]
        ConvStore[(ai_conversations<br/>现有表)]
    end
    
    UI --> FollowUpService
    UI --> TrackingService
    FollowUp --> ChatAPI
    Checkbox --> AlternativeService
    Score --> ScoreService
    
    FollowUpService --> FollowUpStore
    FollowUpService --> ConvStore
    TrackingService --> TrackingStore
    AlternativeService --> ChatAPI
    AlternativeService --> ScientificSearch
    AlternativeService --> HistoryStore
    ScoreService --> ScoreStore
    ScoreService --> AIMemory
    
    SchedulerService --> FollowUpService
    ChatAPI --> PersonaPrompt
    ChatAPI --> AIMemory
```

### Integration Points with Existing System

| 现有组件 | 集成方式 | 用途 |
|---------|---------|------|
| `AIAssistantChat.tsx` | 复用/扩展 | 问询对话界面 |
| `/api/chat` | 调用 | AI对话生成 |
| `searchScientificTruth()` | 调用 | 为行动项生成科学解释 |
| `ai_memory` + `generateEmbedding()` | 调用 | 存储用户偏好学习 |
| `buildDynamicPersonaPrompt()` | 调用 | 保持Max人格一致性 |
| `ai_conversations` | 写入 | 存储问询对话历史 |
| `profiles` | 读取 | 获取用户档案和AI设置 |

## Components and Interfaces

### 0. Integration with Existing Chat System

问询会话将复用现有的 `/api/chat` 端点，通过特殊的系统提示注入问询上下文：

```typescript
// 问询专用系统提示扩展
const FOLLOW_UP_SYSTEM_PROMPT_EXTENSION = `
[FOLLOW-UP SESSION MODE - 主动问询模式]

你正在进行一次主动问询会话。目标是了解用户的当前状态和计划执行情况。

**问询类型**: {session_type} // 'morning' | 'evening'
**用户计划**: {plan_summary}
**今日待追踪行动项**: {action_items_to_track}

**问询流程**:
1. 先用温暖的方式问候用户当前感受
2. 如果是第二天及以后，询问昨日/今日的计划执行情况
3. 对于每个行动项，让用户选择：完成/部分完成/跳过/需要替换
4. 如果用户选择"需要替换"，追问原因并记录
5. 根据用户反馈调整后续建议

**语气**: 保持Max的Bio-Operating System Co-pilot风格，但更加温暖和关怀
**禁止**: 不要一次问太多问题，每次只问1-2个
`;

// 调用现有chat API时注入问询上下文
async function initiateFollowUpChat(
  userId: string, 
  sessionType: 'morning' | 'evening',
  planSummary: string,
  actionItems: ActionItem[]
): Promise<void> {
  const systemPromptExtension = FOLLOW_UP_SYSTEM_PROMPT_EXTENSION
    .replace('{session_type}', sessionType)
    .replace('{plan_summary}', planSummary)
    .replace('{action_items_to_track}', JSON.stringify(actionItems.map(a => a.title)));
  
  // 通过现有的 /api/chat 发送，附加问询上下文
  await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      messages: [{
        role: 'system',
        content: systemPromptExtension
      }, {
        role: 'assistant', 
        content: generateFollowUpGreeting(sessionType)
      }],
      followUpContext: {
        sessionId: generateSessionId(),
        sessionType,
        planId: planSummary.planId,
        actionItemIds: actionItems.map(a => a.id)
      }
    })
  });
}
```

### 1. Follow-up Session Manager

负责管理每日两次的主动问询会话。

```typescript
interface FollowUpSession {
  id: string;
  user_id: string;
  plan_id: string;
  session_type: 'morning' | 'evening';
  scheduled_at: string;
  started_at?: string;
  completed_at?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'missed';
  responses: FollowUpResponse[];
  sentiment_score: number; // -1 to 1
  summary?: string;
}

interface FollowUpResponse {
  question_type: 'feeling' | 'energy' | 'execution' | 'replacement';
  user_response: string;
  ai_interpretation: string;
  timestamp: string;
}

interface FollowUpService {
  scheduleSession(userId: string, planId: string, type: 'morning' | 'evening'): Promise<FollowUpSession>;
  startSession(sessionId: string): Promise<FollowUpSession>;
  recordResponse(sessionId: string, response: FollowUpResponse): Promise<void>;
  completeSession(sessionId: string): Promise<FollowUpSession>;
  getMissedSessions(userId: string): Promise<FollowUpSession[]>;
}
```

### 2. Execution Tracking System

追踪每个行动项的执行情况，支持勾选替换。

```typescript
interface ActionItem {
  id: string;
  plan_id: string;
  title: string;
  description: string;
  timing: string;
  duration: string;
  steps: string[];
  expected_outcome: string;
  scientific_rationale: ScientificExplanation;
  order: number;
  is_established: boolean; // 连续7天完成后标记
  replacement_count: number;
}

interface ExecutionRecord {
  id: string;
  action_item_id: string;
  user_id: string;
  date: string;
  status: 'completed' | 'partial' | 'skipped' | 'replaced';
  needs_replacement: boolean; // 用户勾选的替换标记
  user_notes?: string;
  replacement_reason?: string;
}

interface ExecutionTrackingService {
  recordExecution(record: Omit<ExecutionRecord, 'id'>): Promise<ExecutionRecord>;
  getExecutionHistory(actionItemId: string, days: number): Promise<ExecutionRecord[]>;
  calculateExecutionRate(planId: string): Promise<number>;
  flagForReplacement(actionItemId: string, reason: string): Promise<void>;
  getItemsNeedingReplacement(planId: string): Promise<ActionItem[]>;
}
```

### 3. Alternative Generation Engine

为需要替换的行动项生成科学等效的平替选项。

```typescript
interface AlternativeAction {
  id: string;
  original_action_id: string;
  title: string;
  description: string;
  timing: string;
  duration: string;
  steps: string[];
  expected_outcome: string;
  scientific_rationale: ScientificExplanation;
  similarity_score: number; // 与原行动的效果相似度 0-1
  user_fit_score: number; // 预测的用户适配度 0-1
  why_better_fit: string; // 为什么更适合该用户
}

interface AlternativeGenerationService {
  generateAlternatives(
    actionItem: ActionItem, 
    userProfile: UserPreferenceProfile,
    replacementReason: string
  ): Promise<AlternativeAction[]>;
  
  selectAlternative(
    originalActionId: string, 
    alternativeId: string
  ): Promise<ActionItem>;
  
  trackAlternativeSuccess(alternativeId: string, days: number): Promise<boolean>;
}
```

### 4. Scientific Explanation Generator

生成多维度科学解释。

```typescript
interface ScientificExplanation {
  physiology: string;      // 生理学角度
  neurology: string;       // 神经学角度
  psychology: string;      // 心理学角度
  behavioral_science: string; // 行为学角度
  summary: string;         // 综合摘要
  references?: string[];   // 科学文献引用
}

interface ProblemAnalysis {
  problem_description: string;
  root_causes: {
    physiological: string[];
    neurological: string[];
    psychological: string[];
    behavioral: string[];
  };
  scientific_explanation: ScientificExplanation;
}
```

### 5. User Understanding Score Calculator

计算和追踪用户理解度评分。

```typescript
interface UserUnderstandingScore {
  user_id: string;
  current_score: number; // 0-100
  score_breakdown: {
    completion_prediction_accuracy: number; // 行动完成预测准确率
    replacement_acceptance_rate: number;    // 替换建议接受率
    sentiment_prediction_accuracy: number;  // 情绪预测准确率
    preference_pattern_match: number;       // 偏好模式匹配度
  };
  is_deep_understanding: boolean; // score >= 95
  last_updated: string;
  history: ScoreHistoryEntry[];
}

interface ScoreHistoryEntry {
  date: string;
  score: number;
  factors_changed: string[];
}

interface UserPreferenceProfile {
  user_id: string;
  preferred_times: string[];
  avoided_activities: string[];
  successful_patterns: string[];
  physical_constraints: string[];
  lifestyle_factors: string[];
  learning_history: LearningEntry[];
}

interface LearningEntry {
  date: string;
  insight: string;
  confidence: number;
  source: 'execution' | 'feedback' | 'replacement' | 'conversation';
}

interface UnderstandingScoreService {
  calculateScore(userId: string): Promise<UserUnderstandingScore>;
  updateFromExecution(userId: string, record: ExecutionRecord): Promise<void>;
  updateFromFeedback(userId: string, feedback: FollowUpResponse): Promise<void>;
  updateFromReplacement(userId: string, accepted: boolean): Promise<void>;
  getScoreHistory(userId: string, days: number): Promise<ScoreHistoryEntry[]>;
  isDeepUnderstandingAchieved(userId: string): Promise<boolean>;
}
```

### 6. Plan Evolution Manager

管理计划的动态演化和历史记录。

```typescript
interface PlanEvolution {
  id: string;
  plan_id: string;
  version: number;
  changed_at: string;
  change_type: 'replacement' | 'addition' | 'removal' | 'modification';
  original_item?: ActionItem;
  new_item?: ActionItem;
  reason: string;
  user_initiated: boolean;
  understanding_score_at_change: number;
}

interface AdaptivePlan {
  id: string;
  user_id: string;
  title: string;
  problem_analysis: ProblemAnalysis;
  action_items: ActionItem[];
  version: number;
  created_at: string;
  last_evolved_at: string;
  evolution_count: number;
  user_summary?: string; // 用户偏好总结（演化3次后生成）
  status: 'active' | 'paused' | 'completed';
}

interface PlanEvolutionService {
  recordEvolution(evolution: Omit<PlanEvolution, 'id'>): Promise<PlanEvolution>;
  getEvolutionHistory(planId: string): Promise<PlanEvolution[]>;
  generateUserSummary(planId: string): Promise<string>;
  getCurrentVersion(planId: string): Promise<AdaptivePlan>;
}
```

## Data Models

### Database Schema

```sql
-- 问询会话表
CREATE TABLE follow_up_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES user_plans(id) ON DELETE CASCADE,
  session_type TEXT CHECK (session_type IN ('morning', 'evening')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'missed')),
  responses JSONB DEFAULT '[]',
  sentiment_score DECIMAL(3,2),
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 行动项表
CREATE TABLE plan_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES user_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  timing TEXT,
  duration TEXT,
  steps JSONB DEFAULT '[]',
  expected_outcome TEXT,
  scientific_rationale JSONB,
  item_order INTEGER DEFAULT 0,
  is_established BOOLEAN DEFAULT FALSE,
  replacement_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 执行追踪表
CREATE TABLE execution_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_item_id UUID REFERENCES plan_action_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  execution_date DATE NOT NULL,
  status TEXT CHECK (status IN ('completed', 'partial', 'skipped', 'replaced')),
  needs_replacement BOOLEAN DEFAULT FALSE,
  user_notes TEXT,
  replacement_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 计划演化历史表
CREATE TABLE plan_evolution_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES user_plans(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  change_type TEXT CHECK (change_type IN ('replacement', 'addition', 'removal', 'modification')),
  original_item JSONB,
  new_item JSONB,
  reason TEXT,
  user_initiated BOOLEAN DEFAULT TRUE,
  understanding_score_at_change DECIMAL(5,2)
);

-- 用户理解度评分表
CREATE TABLE user_understanding_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_score DECIMAL(5,2) DEFAULT 0,
  completion_prediction_accuracy DECIMAL(5,2) DEFAULT 0,
  replacement_acceptance_rate DECIMAL(5,2) DEFAULT 0,
  sentiment_prediction_accuracy DECIMAL(5,2) DEFAULT 0,
  preference_pattern_match DECIMAL(5,2) DEFAULT 0,
  is_deep_understanding BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户偏好档案表
CREATE TABLE user_preference_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  preferred_times JSONB DEFAULT '[]',
  avoided_activities JSONB DEFAULT '[]',
  successful_patterns JSONB DEFAULT '[]',
  physical_constraints JSONB DEFAULT '[]',
  lifestyle_factors JSONB DEFAULT '[]',
  learning_history JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE follow_up_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_evolution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_understanding_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preference_profiles ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY "Users can only access own follow_up_sessions" ON follow_up_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own execution_tracking" ON execution_tracking
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own understanding_scores" ON user_understanding_scores
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own preference_profiles" ON user_preference_profiles
  FOR ALL USING (auth.uid() = user_id);
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the acceptance criteria analysis, the following properties must be verified through property-based testing:

### Property 1: Check-in Scheduling Correctness

*For any* user with an active plan and *for any* time within a configured check-in window (morning 9:00-10:00 or evening 20:00-21:00), the system SHALL initiate exactly one Follow_Up_Session of the appropriate type.

**Validates: Requirements 1.1, 1.2**

### Property 2: Response Storage Completeness

*For any* user response to a Follow_Up_Session, the stored record SHALL contain: a valid timestamp, the user's response content, and a sentiment score in the range [-1, 1].

**Validates: Requirements 1.4**

### Property 3: Missed Session Recording

*For any* Follow_Up_Session that transitions to 'missed' status, the system SHALL record the missed session and the next scheduled session SHALL have an adjusted time.

**Validates: Requirements 1.5**

### Property 4: Execution Tracking Activation

*For any* plan that has been active for more than 24 hours, the Follow_Up_Session SHALL include execution tracking questions for all action items.

**Validates: Requirements 2.1**

### Property 5: Execution Rate Calculation

*For any* set of ExecutionRecords for a plan, the calculated execution rate SHALL equal (completed + 0.5 * partial) / total_records, and the result SHALL be in the range [0, 1].

**Validates: Requirements 2.4**

### Property 6: Consecutive Failure Flagging

*For any* ActionItem with 3 or more consecutive days of 'skipped' or 'needs_replacement' status, the item SHALL be flagged for automatic replacement suggestion.

**Validates: Requirements 2.5**

### Property 7: Alternative Generation Completeness

*For any* ActionItem marked for replacement, the system SHALL generate at least 3 AlternativeActions, and each alternative SHALL have: a non-empty title, a similarity_score in [0,1], and a non-empty scientific_rationale with all 4 domains populated.

**Validates: Requirements 3.2, 3.4**

### Property 8: Alternative Respects User Preferences

*For any* generated AlternativeAction, the action SHALL NOT match any pattern in the user's avoided_activities list, and SHALL NOT repeat any previously rejected alternative for the same original action.

**Validates: Requirements 3.3**

### Property 9: Plan Evolution History Preservation

*For any* plan modification (replacement, addition, removal), a PlanEvolution record SHALL be created with: the change_type, reason, and the understanding_score at the time of change.

**Validates: Requirements 3.5, 5.3**

### Property 10: Scientific Explanation Completeness

*For any* generated plan or action item, the ScientificExplanation SHALL contain non-empty strings for all 4 domains: physiology, neurology, psychology, and behavioral_science.

**Validates: Requirements 4.1, 4.4**

### Property 11: Minimum Action Items

*For any* newly generated plan, the action_items array SHALL contain at least 5 items.

**Validates: Requirements 4.2**

### Property 12: Action Item Field Completeness

*For any* ActionItem, the following fields SHALL be non-empty: title, description, timing, duration, steps (with at least 1 step), expected_outcome, and scientific_rationale.

**Validates: Requirements 4.3**

### Property 13: Established Habit Marking

*For any* ActionItem with 7 or more consecutive days of 'completed' status, the is_established flag SHALL be set to true.

**Validates: Requirements 5.2**

### Property 14: User Summary Generation

*For any* plan with evolution_count >= 3, the user_summary field SHALL be non-empty.

**Validates: Requirements 5.4**

### Property 15: Understanding Score Calculation

*For any* UserUnderstandingScore, the current_score SHALL equal the weighted average of: completion_prediction_accuracy (25%), replacement_acceptance_rate (25%), sentiment_prediction_accuracy (25%), and preference_pattern_match (25%), and all component scores SHALL be in the range [0, 100].

**Validates: Requirements 5.6, 5.9**

### Property 16: Deep Understanding Threshold

*For any* UserUnderstandingScore where current_score >= 95, the is_deep_understanding flag SHALL be true. *For any* score < 95, the flag SHALL be false.

**Validates: Requirements 5.8**

### Property 17: Plan Data Round-Trip Serialization

*For any* valid AdaptivePlan object, serializing to JSON and then deserializing SHALL produce an object equivalent to the original, with all fields including action_items and evolution history preserved.

**Validates: Requirements 6.5, 6.6**

## Error Handling

### User-Facing Errors

Following the project constitution's "Comforting Error" principle:

| Error Scenario | User Message (ZH) | User Message (EN) |
|----------------|-------------------|-------------------|
| Session scheduling failed | "让我们稍后再试，你的节奏不会被打乱" | "Let's try again later, your rhythm won't be disrupted" |
| Alternative generation failed | "正在寻找更适合你的方式..." | "Finding a better fit for you..." |
| Data sync failed | "你的进展已安全保存，正在同步中" | "Your progress is safely saved, syncing now" |
| Score calculation error | "正在重新评估，请稍候" | "Re-evaluating, please wait" |

### System-Level Error Handling

```typescript
interface AdaptivePlanError {
  code: 'SCHEDULING_ERROR' | 'GENERATION_ERROR' | 'SYNC_ERROR' | 'CALCULATION_ERROR';
  message: string;
  recoverable: boolean;
  retryAfter?: number; // seconds
  fallbackAction?: () => Promise<void>;
}

// Error recovery strategies
const errorRecoveryStrategies: Record<string, () => Promise<void>> = {
  SCHEDULING_ERROR: async () => {
    // Reschedule for next available window
  },
  GENERATION_ERROR: async () => {
    // Use cached alternatives or simpler generation
  },
  SYNC_ERROR: async () => {
    // Queue for background sync, continue with local data
  },
  CALCULATION_ERROR: async () => {
    // Use last known good score
  },
};
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure correctness.

#### Property-Based Testing Framework

- **Library**: fast-check (TypeScript PBT library)
- **Minimum iterations**: 100 per property
- **Test file location**: `__tests__/properties/adaptive-plan.property.test.ts`

#### Property Test Annotations

Each property-based test MUST be annotated with:
```typescript
/**
 * **Feature: adaptive-plan-followup, Property {number}: {property_text}**
 * **Validates: Requirements {X.Y}**
 */
```

#### Unit Testing

Unit tests will cover:
- Individual service method behavior
- Edge cases (empty plans, zero scores, boundary conditions)
- Integration between services
- API endpoint responses

#### Test Data Generators

```typescript
// Generators for property-based testing
const actionItemArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  timing: fc.string({ minLength: 1 }),
  duration: fc.string({ minLength: 1 }),
  steps: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 10 }),
  expected_outcome: fc.string({ minLength: 1 }),
  scientific_rationale: scientificExplanationArb,
  is_established: fc.boolean(),
  replacement_count: fc.nat({ max: 10 }),
});

const executionRecordArb = fc.record({
  status: fc.constantFrom('completed', 'partial', 'skipped', 'replaced'),
  needs_replacement: fc.boolean(),
  date: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
});

const understandingScoreArb = fc.record({
  completion_prediction_accuracy: fc.float({ min: 0, max: 100 }),
  replacement_acceptance_rate: fc.float({ min: 0, max: 100 }),
  sentiment_prediction_accuracy: fc.float({ min: 0, max: 100 }),
  preference_pattern_match: fc.float({ min: 0, max: 100 }),
});
```

### Test Coverage Requirements

- All 17 correctness properties must have corresponding property-based tests
- Critical paths (scheduling, scoring, serialization) require additional unit tests
- Integration tests for API endpoints
- E2E tests for the complete follow-up flow (optional)

