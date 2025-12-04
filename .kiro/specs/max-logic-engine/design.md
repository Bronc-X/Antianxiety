# Design Document: Max Logic Engine

## Overview

Max Logic Engine 是 "No More Anxious" 平台的核心 AI 人格系统，包含两个主要模块：

1. **TARS Settings Module** - 用户可调节的 AI 人格参数系统
2. **Bayesian Belief Loop** - 基于贝叶斯推理的焦虑重构引擎

系统遵循 Project Constitution 中定义的 Max 人格规范：无形态的 Bio-Operating System Co-pilot，使用 J.A.R.V.I.S. 风格的语气（100% 理性、干式幽默、简洁、残酷诚实）。

## Architecture

```mermaid
graph TB
    subgraph "Frontend (Next.js)"
        UI[MaxSettings.tsx]
        Ritual[ReframingRitual.tsx]
        Animation[BayesianAnimation.tsx]
    end
    
    subgraph "API Layer"
        SettingsAPI[/api/max/settings]
        BeliefAPI[/api/max/belief]
        ResponseAPI[/api/max/response]
    end
    
    subgraph "Core Logic"
        BayesEngine[BayesianEngine.ts]
        ResponseGen[MaxResponseGenerator.ts]
        Validator[SettingsValidator.ts]
    end
    
    subgraph "Data Layer (Supabase)"
        Profiles[(profiles.ai_settings)]
        BeliefHistory[(belief_sessions)]
        Papers[(semantic_scholar_cache)]
    end
    
    UI --> SettingsAPI
    Ritual --> BeliefAPI
    Ritual --> ResponseAPI
    
    SettingsAPI --> Validator
    SettingsAPI --> Profiles
    
    BeliefAPI --> BayesEngine
    BayesEngine --> Papers
    BeliefAPI --> BeliefHistory
    
    ResponseAPI --> ResponseGen
    ResponseGen --> Profiles
```

## Components and Interfaces

### 1. Settings Validator (`lib/max/settings-validator.ts`)

```typescript
interface AISettings {
  honesty_level: number;  // 60-100
  humor_level: number;    // 0-100
  mode: 'TARS' | 'Zen Master' | 'Dr. House';
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitized: AISettings;
}

function validateAISettings(input: Partial<AISettings>): ValidationResult;
function getDefaultSettings(): AISettings;
```

### 2. Bayesian Engine (`lib/max/bayesian-engine.ts`)

```typescript
interface BeliefInput {
  prior: number;           // 0-100, user's initial belief
  hrv_data?: HRVData;      // Optional physiological data
  paper_ids?: string[];    // Semantic Scholar paper IDs
}

interface BeliefOutput {
  prior: number;
  likelihood: number;
  evidence: number;
  posterior: number;
  papers_used: Paper[];
  calculation_steps: CalculationStep[];
}

interface CalculationStep {
  step: number;
  description: string;
  value: number;
}

function calculatePosterior(input: BeliefInput): Promise<BeliefOutput>;
function calculateEvidenceWeight(papers: Paper[]): number;
```

### 3. Max Response Generator (`lib/max/response-generator.ts`)

```typescript
interface ResponseContext {
  settings: AISettings;
  event_type: 'slider_change' | 'belief_set' | 'ritual_complete' | 'general';
  data?: Record<string, unknown>;
}

interface MaxResponse {
  text: string;
  tone: 'neutral' | 'humorous' | 'serious';
}

function generateResponse(context: ResponseContext): MaxResponse;
function validatePhrases(text: string): { valid: boolean; violations: string[] };
```

### 4. UI Components

#### MaxSettings.tsx
- 工业/科幻风格的设置面板
- 两个滑块：honesty_level, humor_level
- 模式选择器：TARS / Zen Master / Dr. House
- 实时 Max 反馈文本区域

#### ReframingRitual.tsx
- Prior 信念滑块（0-100%）
- 证据展示区（HRV + 论文）
- 贝叶斯公式动画可视化
- Posterior 倒计时动画
- Max 结论消息

## Data Models

### Database Schema Updates

```sql
-- Add ai_settings to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS ai_settings JSONB DEFAULT '{
  "honesty_level": 90,
  "humor_level": 65,
  "mode": "TARS"
}'::jsonb;

-- Create belief_sessions table
CREATE TABLE IF NOT EXISTS belief_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prior_value INTEGER NOT NULL CHECK (prior_value >= 0 AND prior_value <= 100),
  posterior_value INTEGER NOT NULL CHECK (posterior_value >= 0 AND posterior_value <= 100),
  likelihood DECIMAL(3,2) NOT NULL,
  evidence_weight DECIMAL(3,2) NOT NULL,
  papers_used JSONB DEFAULT '[]'::jsonb,
  hrv_data JSONB,
  belief_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE belief_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own belief sessions"
ON belief_sessions FOR ALL
USING (auth.uid() = user_id);
```

### TypeScript Types

```typescript
// types/max.ts
export interface AISettings {
  honesty_level: number;
  humor_level: number;
  mode: 'TARS' | 'Zen Master' | 'Dr. House';
}

export interface BeliefSession {
  id: string;
  user_id: string;
  prior_value: number;
  posterior_value: number;
  likelihood: number;
  evidence_weight: number;
  papers_used: Paper[];
  hrv_data?: HRVData;
  belief_text?: string;
  created_at: string;
}

export interface Paper {
  id: string;
  title: string;
  relevance_score: number;
  url: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Settings Value Validation
*For any* input to the AI settings validator, `honesty_level` values outside 60-100 SHALL be rejected or clamped, and `humor_level` values outside 0-100 SHALL be rejected or clamped.
**Validates: Requirements 1.3, 1.4**

### Property 2: Settings Persistence Round-Trip
*For any* valid AI settings update, reading the settings back from the database SHALL return the exact values that were written.
**Validates: Requirements 1.2**

### Property 3: Mode Enum Validation
*For any* string input to the mode field, only "TARS", "Zen Master", or "Dr. House" SHALL be accepted; all other values SHALL be rejected.
**Validates: Requirements 1.5**

### Property 4: Bayesian Formula Correctness
*For any* valid Prior (0-100), Likelihood (0-1), and Evidence (0.1-0.9), the calculated Posterior SHALL equal `(Prior × Likelihood) / Evidence`, clamped to 0-100.
**Validates: Requirements 3.2, 3.4**

### Property 5: Evidence Weight Bounds
*For any* set of Semantic Scholar papers, the calculated evidence weight SHALL always be within the range 0.1 to 0.9.
**Validates: Requirements 3.3**

### Property 6: Max Phrase Compliance
*For any* response generated by Max, the text SHALL NOT contain forbidden phrases ("I feel", "I am sorry", "As an AI") AND SHALL contain at least one approved phrase pattern ("System detects", "Data suggests", "Bio-metrics indicate", "Processing", "Recalibrating").
**Validates: Requirements 5.3, 5.4**

### Property 7: Slider Feedback Generation
*For any* slider value change event, Max SHALL generate a non-empty text response reflecting the new value.
**Validates: Requirements 2.4**

### Property 8: Belief Data Isolation
*For any* user querying belief history, the returned records SHALL contain only sessions where `user_id` matches the authenticated user's ID.
**Validates: Requirements 6.2, 6.3**

### Property 9: TARS Mode Brevity
*For any* response generated in "TARS" mode, the response length SHALL be shorter than or equal to responses generated in other modes for the same context.
**Validates: Requirements 5.5**

## Error Handling

### Settings Validation Errors
- Invalid honesty_level: Clamp to nearest valid value (60 or 100), show toast "Recalibrating honesty parameters..."
- Invalid humor_level: Clamp to nearest valid value (0 or 100), show toast "Humor circuits adjusted"
- Invalid mode: Reject and keep current mode, show toast "Mode not recognized. Maintaining current configuration."

### Bayesian Calculation Errors
- Missing evidence: Use default evidence weight of 0.5, Max says "Insufficient data. Using baseline evidence weight."
- API failure (Semantic Scholar): Cache fallback, Max says "External data temporarily unavailable. Proceeding with cached evidence."
- Division by zero: Prevented by evidence weight minimum of 0.1

### Database Errors
- Connection failure: Retry with exponential backoff, show "Reconnecting to neural network..."
- RLS violation: Log security event, show "Access configuration error. Please re-authenticate."

## Testing Strategy

### Property-Based Testing Library
使用 **fast-check** 作为 TypeScript 的属性测试库。

### Unit Tests
- Settings validator: Test boundary values (60, 100 for honesty; 0, 100 for humor)
- Mode enum: Test all valid modes and invalid strings
- Bayesian formula: Test with known input/output pairs

### Property-Based Tests
每个正确性属性都将实现为一个属性测试：

1. **Property 1 Test**: 生成任意整数，验证 validator 正确约束范围
2. **Property 2 Test**: 生成有效设置，写入后读取验证一致性
3. **Property 3 Test**: 生成任意字符串，验证只有三个有效模式被接受
4. **Property 4 Test**: 生成有效的 Prior/Likelihood/Evidence，验证公式计算正确
5. **Property 5 Test**: 生成论文数组，验证 evidence weight 在 0.1-0.9 范围内
6. **Property 6 Test**: 生成各种上下文，验证响应不含禁用短语且含批准短语
7. **Property 7 Test**: 生成滑块值变化事件，验证生成非空响应
8. **Property 8 Test**: 模拟多用户场景，验证数据隔离
9. **Property 9 Test**: 生成相同上下文，比较 TARS 模式与其他模式的响应长度

### Test Configuration
- 每个属性测试运行最少 100 次迭代
- 使用 `fc.configureGlobal({ numRuns: 100 })` 配置 fast-check
- 测试文件命名: `*.property.test.ts`

### Test Annotation Format
每个属性测试必须包含注释：
```typescript
/**
 * **Feature: max-logic-engine, Property 1: Settings Value Validation**
 * **Validates: Requirements 1.3, 1.4**
 */
```
