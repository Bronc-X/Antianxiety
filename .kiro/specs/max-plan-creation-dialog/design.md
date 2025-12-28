# Design Document: Max Plan Creation Dialog

## Overview

Max 协助制定计划对话系统是一个基于 AI 的交互式健康计划制定功能。该系统通过对话式界面，让 Max（AI 助手）分析用户的健康数据，主动询问缺失信息，并生成个性化的训练计划。用户可以替换不满意的计划项，直到确认后保存执行。

### 核心设计原则

1. **对话优先**: 使用自然对话而非表单收集数据
2. **California Calm**: 温暖、支持性的语调，避免医疗化语言
3. **渐进式交互**: 逐步展示信息，避免信息过载
4. **即时反馈**: 替换操作立即响应，流畅动画

## Architecture

```mermaid
graph TB
    subgraph Frontend
        PD[PlanDashboard] --> MPD[MaxPlanDialog]
        MPD --> CM[ChatMessages]
        MPD --> PI[PlanItems]
        MPD --> AB[ActionButtons]
    end
    
    subgraph API Layer
        MPD --> |fetch| APC[/api/max/plan-chat]
        MPD --> |fetch| APR[/api/max/plan-replace]
        MPD --> |fetch| APS[/api/plans/create]
    end
    
    subgraph Data Sources
        APC --> UP[unified_user_profiles]
        APC --> DWL[daily_wellness_logs]
        APC --> AI[active_inquiries]
        APC --> HRV[hrv_data]
    end
    
    subgraph AI Layer
        APC --> LLM[DeepSeek/Gemini]
        APR --> LLM
    end
```

## Components and Interfaces

### 1. MaxPlanDialog Component

主对话框组件，管理整个计划制定流程。

```typescript
interface MaxPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanCreated: () => void;
  language: 'zh' | 'en';
}

interface ChatMessage {
  id: string;
  role: 'max' | 'user' | 'system';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface PlanItemDraft {
  id: string;
  title: string;
  action: string;
  rationale: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  isReplacing?: boolean;
}

interface DialogState {
  phase: 'loading' | 'analyzing' | 'questioning' | 'generating' | 'reviewing' | 'saving';
  messages: ChatMessage[];
  planItems: PlanItemDraft[];
  userResponses: Record<string, string>;
  dataStatus: {
    hasInquiryData: boolean;
    hasCalibrationData: boolean;
    hasHrvData: boolean;
  };
}
```

### 2. API Endpoints

#### POST /api/max/plan-chat

处理对话消息和计划生成。

```typescript
interface PlanChatRequest {
  action: 'init' | 'respond' | 'generate';
  message?: string;
  sessionId?: string;
}

interface PlanChatResponse {
  sessionId: string;
  messages: ChatMessage[];
  planItems?: PlanItemDraft[];
  dataStatus: {
    hasInquiryData: boolean;
    hasCalibrationData: boolean;
    hasHrvData: boolean;
    inquirySummary?: string;
    calibrationSummary?: string;
    hrvSummary?: string;
  };
  nextAction: 'question' | 'generate' | 'review' | 'complete';
}
```

#### POST /api/max/plan-replace

替换单个计划项。

```typescript
interface PlanReplaceRequest {
  itemId: string;
  currentItem: PlanItemDraft;
  sessionId: string;
}

interface PlanReplaceResponse {
  newItem: PlanItemDraft;
}
```

### 3. AI Prompt Structure

```typescript
const PLAN_GENERATION_PROMPT = `
你是 Max，一位温暖、专业的健康顾问。你的任务是根据用户的健康数据生成个性化的训练计划。

## 用户数据摘要
{userData}

## 生成要求
1. 生成 3-5 个行动项
2. 每个项目包含：标题、具体行动、科学依据、难度等级
3. 使用温暖、鼓励的语调
4. 避免医疗化语言，使用"生物电压调节"而非"治疗焦虑"
5. 确保建议可执行且循序渐进

## 输出格式
返回 JSON 数组，每个元素包含：
- title: 简短标题
- action: 具体行动描述
- rationale: 科学依据（简洁）
- difficulty: easy/medium/hard
- category: sleep/stress/fitness/nutrition/mental/habits
`;
```

## Data Models

### Session State (In-Memory/Redis)

```typescript
interface PlanSession {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  state: DialogState;
  userData: {
    inquiry: InquiryData | null;
    calibration: CalibrationData | null;
    hrv: HrvData | null;
    profile: UnifiedProfile | null;
  };
}
```

### Database Schema Extension

```sql
-- 计划会话记录（可选，用于分析）
CREATE TABLE IF NOT EXISTS plan_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_data JSONB NOT NULL,
  final_plan_id UUID REFERENCES user_plans(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- RLS Policy
ALTER TABLE plan_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own sessions"
  ON plan_sessions FOR ALL
  USING (auth.uid() = user_id);
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Data Isolation

*For any* user session and any data fetch operation, the returned health data (inquiry, calibration, HRV) SHALL only contain records where user_id matches the authenticated user's ID.

**Validates: Requirements 8.1, 8.2**

### Property 2: Data-Driven Question Generation

*For any* user data state, if inquiry data is empty or older than 7 days, OR if calibration data is missing, the system SHALL generate proactive questions, and the total number of questions SHALL NOT exceed 3.

**Validates: Requirements 1.2, 1.3, 2.1, 2.2, 2.4**

### Property 3: User Response Persistence

*For any* user response to a Max question, the response SHALL be stored in the session state and SHALL be available for subsequent plan generation.

**Validates: Requirements 2.3**

### Property 4: Plan Generation Completeness

*For any* plan generation request with sufficient data, the generated plan SHALL contain between 3 and 5 items (inclusive), and each item SHALL have non-empty values for: title, action, rationale, difficulty (one of 'easy'|'medium'|'hard'), and category.

**Validates: Requirements 3.1, 3.2**

### Property 5: HRV Data Integration

*For any* plan generation where HRV data is available, at least one plan item's rationale or action SHALL reference HRV-related insights (e.g., "心率变异性", "HRV", "自主神经").

**Validates: Requirements 3.3**

### Property 6: Replacement Consistency

*For any* plan item replacement request, the returned replacement item SHALL have the same category as the original item, AND the replacement item's title and action SHALL be different from the original.

**Validates: Requirements 4.1, 4.2**

### Property 7: Save Data Integrity

*For any* successful plan save operation, all plan items from the review phase SHALL be persisted to the database with their complete metadata, AND closing the dialog without saving SHALL NOT persist any draft data.

**Validates: Requirements 5.2, 8.3**

### Property 8: History Display Correctness

*For any* history plan list, each item SHALL contain: title, creation date, completion percentage, and status, AND the list SHALL be sorted by creation date in descending order (newest first).

**Validates: Requirements 6.2, 6.3**

### Property 9: Language Preference Compliance

*For any* Max message generation, the output language SHALL match the user's language preference ('zh' or 'en'), and user messages SHALL receive contextually appropriate responses.

**Validates: Requirements 7.1, 7.4**

## Error Handling

### Error Categories

1. **Authentication Errors**: 401 响应，提示用户登录
2. **Data Fetch Errors**: 优雅降级，使用可用数据继续
3. **AI Generation Errors**: 重试机制，最多 3 次
4. **Save Errors**: 显示错误提示，允许重试

### Error Messages (California Calm Style)

```typescript
const ERROR_MESSAGES = {
  zh: {
    auth: '请先登录，让我们一起开始吧',
    dataFetch: '数据加载遇到了一点小问题，我们用现有信息继续',
    aiGeneration: '让我重新思考一下...',
    save: '保存时遇到了问题，请再试一次',
  },
  en: {
    auth: 'Please sign in to get started',
    dataFetch: 'Had a small hiccup loading data, let\'s continue with what we have',
    aiGeneration: 'Let me think about this again...',
    save: 'Had trouble saving, please try again',
  },
};
```

## Testing Strategy

### Unit Tests

- 组件渲染测试（对话框打开/关闭）
- 状态转换逻辑测试
- API 响应处理测试
- 错误处理测试

### Property-Based Tests

使用 fast-check 库进行属性测试，每个测试最少运行 100 次迭代：

1. **Property 1 (Data Isolation)**: 生成随机用户 ID 对，验证数据查询只返回对应用户数据
   - Tag: `Feature: max-plan-creation-dialog, Property 1: Data Isolation`

2. **Property 2 (Data-Driven Question Generation)**: 生成随机数据状态（有/无 inquiry、calibration），验证问题生成逻辑和数量限制
   - Tag: `Feature: max-plan-creation-dialog, Property 2: Data-Driven Question Generation`

3. **Property 4 (Plan Generation Completeness)**: 生成随机用户数据，验证生成的计划包含 3-5 项且结构完整
   - Tag: `Feature: max-plan-creation-dialog, Property 4: Plan Generation Completeness`

4. **Property 6 (Replacement Consistency)**: 生成随机计划项，验证替换后类别一致且内容不同
   - Tag: `Feature: max-plan-creation-dialog, Property 6: Replacement Consistency`

5. **Property 8 (History Display Correctness)**: 生成随机历史计划列表，验证排序正确性和字段完整性
   - Tag: `Feature: max-plan-creation-dialog, Property 8: History Display Correctness`

### Integration Tests

- 完整对话流程测试（从打开到保存）
- 计划保存和列表刷新测试
- 历史计划查询和展开测试
- 多语言切换测试

### Test Configuration

- 使用 Vitest 作为测试框架
- 使用 fast-check 进行属性测试
- 属性测试最少运行 100 次迭代
- 每个属性测试标注对应的设计属性编号
