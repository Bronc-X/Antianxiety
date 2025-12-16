# Assessment Engine Design Document

## Overview

Bio-Ledger Assessment Engine 是一个 AI 驱动的动态健康问诊系统，采用 Generative UI 模式。后端 AI 返回结构化 JSON 指令，前端根据指令动态渲染对应的 UI 组件。系统结合决策树与贝叶斯推理，通过 4 个阶段（Baseline → Chief Complaint → Differential → Report）完成健康评估。

核心设计原则：
- **结构化输出**: AI 永远返回 JSON schema，不返回自由文本
- **状态机驱动**: 显式管理问诊阶段，确保流程可控
- **安全优先**: Red Flag Protocol 确保危急情况立即熔断
- **深度集成**: 与 The Brain 记忆系统双向同步

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  AssessmentPage                                                  │
│  ├── WelcomeScreen (phase: welcome)                             │
│  ├── BaselineCollector (phase: baseline)                        │
│  ├── SymptomInput (phase: chief_complaint)                      │
│  ├── QuestionRenderer (phase: differential)                     │
│  │   ├── SingleChoiceQuestion                                   │
│  │   ├── MultipleChoiceQuestion                                 │
│  │   ├── BooleanQuestion                                        │
│  │   └── ScaleQuestion                                          │
│  ├── ReportView (phase: report)                                 │
│  └── EmergencyAlert (phase: emergency) ← Red Flag Protocol      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js API Routes)                │
├─────────────────────────────────────────────────────────────────┤
│  /api/assessment/start     → Create session, return first step  │
│  /api/assessment/next      → Process answer, return next step   │
│  /api/assessment/report    → Generate final report              │
│  /api/assessment/export    → Generate PDF                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI Decision Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Vercel AI SDK + Anthropic Claude                               │
│  ├── generateObject() with Zod schema enforcement               │
│  ├── Red Flag Pattern Matcher (pre-AI check)                    │
│  └── Bayesian Prior Calculator                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Layer (Supabase)                         │
├─────────────────────────────────────────────────────────────────┤
│  assessment_sessions (session state, history JSONB)             │
│  assessment_reports (final reports, linked to sessions)         │
│  ai_memory (pgvector - The Brain integration)                   │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### State Machine Definition

```typescript
type AssessmentPhase = 
  | 'welcome'           // 欢迎页
  | 'baseline'          // 基线信息收集
  | 'chief_complaint'   // 主诉输入
  | 'differential'      // 鉴别诊断问答
  | 'report'            // 报告展示
  | 'emergency';        // 红旗熔断

interface AssessmentSession {
  id: string;
  user_id: string;
  phase: AssessmentPhase;
  demographics: Demographics;
  chief_complaint: string | null;
  symptoms: string[];
  history: AnswerRecord[];
  created_at: string;
  updated_at: string;
  expires_at: string;
  status: 'active' | 'completed' | 'expired' | 'emergency_triggered';
}
```

### Voice Input Support

```typescript
// 语音输入配置
interface VoiceInputConfig {
  enabled: boolean;
  language: 'zh-CN' | 'en-US';
  continuous: boolean;
  interimResults: boolean;
}

// 语音转文字结果
interface VoiceTranscript {
  text: string;
  confidence: number;
  isFinal: boolean;
}

// 使用 Web Speech API
const useSpeechRecognition = (config: VoiceInputConfig) => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = config.language;
  recognition.continuous = config.continuous;
  recognition.interimResults = config.interimResults;
  
  return {
    start: () => recognition.start(),
    stop: () => recognition.stop(),
    onResult: (callback: (transcript: VoiceTranscript) => void) => {
      recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        callback({
          text: result[0].transcript,
          confidence: result[0].confidence,
          isFinal: result.isFinal
        });
      };
    }
  };
};
```

### API Request/Response Schemas

```typescript
// 请求体 Schema
const AssessmentRequestSchema = z.object({
  session_id: z.string().uuid(),
  answer: z.object({
    question_id: z.string(),
    value: z.union([z.string(), z.array(z.string()), z.number(), z.boolean()]),
    input_method: z.enum(['tap', 'type', 'voice']).optional() // 记录输入方式
  }).optional(),
  language: z.enum(['zh', 'en']).default('zh'),
  country_code: z.string().length(2).optional() // ISO 3166-1 alpha-2 for emergency number
});

// 响应体 - Discriminated Union
const QuestionStepSchema = z.object({
  step_type: z.literal('question'),
  session_id: z.string(),
  phase: z.enum(['baseline', 'chief_complaint', 'differential']),
  question: z.object({
    id: z.string(),
    text: z.string(),
    description: z.string().optional(),
    type: z.enum(['single_choice', 'multiple_choice', 'boolean', 'scale', 'text', 'symptom_search']),
    options: z.array(z.object({
      value: z.string(),
      label: z.string(),
      description: z.string().optional(),
      icon: z.string().optional()
    })).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    progress: z.number().min(0).max(100),
    category: z.enum(['demographics', 'history', 'location', 'severity', 'timing', 'associated', 'triggers'])
  })
});

const ReportStepSchema = z.object({
  step_type: z.literal('report'),
  session_id: z.string(),
  phase: z.literal('report'),
  report: z.object({
    conditions: z.array(z.object({
      name: z.string(),
      description: z.string(),
      probability: z.number().min(0).max(100),
      matched_symptoms: z.array(z.string()),
      is_best_match: z.boolean()
    })),
    urgency: z.enum(['emergency', 'urgent', 'routine', 'self_care']),
    next_steps: z.array(z.object({
      action: z.string(),
      icon: z.string()
    })),
    disclaimer: z.string()
  })
});

const EmergencyStepSchema = z.object({
  step_type: z.literal('emergency'),
  session_id: z.string(),
  phase: z.literal('emergency'),
  emergency: z.object({
    title: z.string(),
    message: z.string(),
    detected_pattern: z.string(),
    emergency_number: z.string(),
    instructions: z.array(z.string())
  })
});

const AssessmentResponseSchema = z.discriminatedUnion('step_type', [
  QuestionStepSchema,
  ReportStepSchema,
  EmergencyStepSchema
]);
```

### Red Flag Pattern Definitions

```typescript
const RED_FLAG_PATTERNS = [
  {
    id: 'cardiac_emergency',
    patterns: ['chest pain', 'radiating to arm', 'radiating to jaw', 'crushing pressure'],
    min_matches: 2,
    message_zh: '您描述的症状可能提示心脏紧急情况。请立即拨打急救电话或前往最近的急诊室。',
    message_en: 'Your symptoms may indicate a cardiac emergency. Call emergency services or go to the nearest ER immediately.'
  },
  {
    id: 'stroke_warning',
    patterns: ['sudden severe headache', 'worst headache', 'facial drooping', 'arm weakness', 'speech difficulty'],
    min_matches: 2,
    message_zh: '您描述的症状可能提示中风。时间就是大脑！请立即拨打急救电话。',
    message_en: 'Your symptoms may indicate a stroke. Time is brain! Call emergency services immediately.'
  },
  {
    id: 'anaphylaxis',
    patterns: ['difficulty breathing', 'throat swelling', 'severe allergic', 'hives spreading'],
    min_matches: 2,
    message_zh: '您可能正在经历严重过敏反应。请立即拨打急救电话并使用肾上腺素笔（如有）。',
    message_en: 'You may be experiencing anaphylaxis. Call emergency services immediately and use epinephrine if available.'
  }
];

// 地区急救电话配置
const EMERGENCY_NUMBERS: Record<string, { number: string; name: string }> = {
  CN: { number: '120', name: '急救中心' },
  US: { number: '911', name: 'Emergency Services' },
  UK: { number: '999', name: 'Emergency Services' },
  EU: { number: '112', name: 'Emergency Services' },
  AU: { number: '000', name: 'Emergency Services' },
  DEFAULT: { number: '112', name: 'Emergency Services' }
};

// 根据用户地区获取急救电话
function getEmergencyNumber(countryCode: string): { number: string; name: string } {
  return EMERGENCY_NUMBERS[countryCode] || EMERGENCY_NUMBERS.DEFAULT;
}
```

## Data Models

### Database Schema (Supabase)

```sql
-- Assessment Sessions Table
CREATE TABLE assessment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phase TEXT NOT NULL DEFAULT 'welcome',
  demographics JSONB DEFAULT '{}',
  chief_complaint TEXT,
  symptoms TEXT[] DEFAULT '{}',
  history JSONB DEFAULT '[]',
  language TEXT DEFAULT 'zh',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Assessment Reports Table
CREATE TABLE assessment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conditions JSONB NOT NULL,
  urgency TEXT NOT NULL,
  next_steps JSONB NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own sessions"
  ON assessment_sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own reports"
  ON assessment_reports FOR ALL
  USING (auth.uid() = user_id);
```

### Integration with The Brain

```typescript
// 从 The Brain 获取用户健康档案
async function getUserHealthProfile(userId: string): Promise<HealthProfile | null> {
  const { data } = await supabase
    .from('ai_memory')
    .select('content, metadata')
    .eq('user_id', userId)
    .eq('metadata->>type', 'health_profile')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  return data ? parseHealthProfile(data) : null;
}

// 将评估结果存入 The Brain
async function storeAssessmentToMemory(userId: string, report: AssessmentReport) {
  const embedding = await generateEmbedding(
    `Health assessment: ${report.conditions.map(c => c.name).join(', ')}`
  );
  
  await supabase.from('ai_memory').insert({
    user_id: userId,
    content: JSON.stringify(report),
    embedding,
    metadata: {
      type: 'assessment_result',
      date: new Date().toISOString(),
      conditions: report.conditions.map(c => c.name),
      urgency: report.urgency
    }
  });
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the acceptance criteria analysis, the following correctness properties must be validated through property-based testing:

### Property 1: Session Creation Uniqueness and Persistence
*For any* user initiating an assessment, the created session SHALL have a unique UUID that does not collide with any existing session, AND the session SHALL be persisted to the database with initial phase set to "baseline".
**Validates: Requirements 1.1, 1.2, 8.1**

### Property 2: Session State Round-Trip Consistency
*For any* valid session state (phase, demographics, history), saving the session and then restoring it SHALL produce an equivalent session object with all data intact.
**Validates: Requirements 1.3, 6.6**

### Property 3: Session Expiration Correctness
*For any* session with updated_at timestamp more than 24 hours in the past, querying the session SHALL return status "expired" or trigger expiration handling.
**Validates: Requirements 1.4**

### Property 4: Phase Transition Completeness
*For any* session completing the baseline phase (all required questions answered), the session SHALL transition to "chief_complaint" phase. *For any* session confirming symptoms, the session SHALL transition to "differential" phase.
**Validates: Requirements 2.4, 3.4**

### Property 5: Symptom Search Relevance
*For any* symptom search query, all returned results SHALL contain terms that fuzzy-match the query with a similarity score above threshold.
**Validates: Requirements 3.2**

### Property 6: History Accumulation Invariant
*For any* session where a user answers N questions, the session history array SHALL contain exactly N answer records, each with question_id, value, and timestamp.
**Validates: Requirements 4.7, 8.2**

### Property 7: API Response Schema Compliance
*For any* API response from the assessment endpoints, the response SHALL conform to the AssessmentResponseSchema discriminated union (either QuestionStepSchema, ReportStepSchema, or EmergencyStepSchema) with all required fields present.
**Validates: Requirements 4.2, 6.2, 6.3, 6.4**

### Property 8: Single Choice Option Constraints
*For any* question of type "single_choice", the options array SHALL contain between 2 and 6 options inclusive, AND one option SHALL have value "unknown" or label containing "I don't know".
**Validates: Requirements 4.3**

### Property 9: Assessment Termination Conditions
*For any* session in differential phase where question count >= 12 OR AI confidence >= 80%, the next step SHALL be of type "report".
**Validates: Requirements 4.8**

### Property 10: Red Flag Protocol Trigger
*For any* session where symptom patterns match a predefined red flag pattern (>= min_matches), the Assessment Engine SHALL immediately return step_type "emergency" and set session status to "emergency_triggered".
**Validates: Requirements 4.9, 9.1, 9.2**

### Property 11: Report Ranking Invariant
*For any* generated report, the conditions array SHALL be sorted by probability in descending order, AND exactly one condition SHALL have is_best_match set to true (the highest probability one).
**Validates: Requirements 5.1, 5.2**

### Property 12: Report Completeness
*For any* generated report, each condition SHALL contain non-empty name, description, probability (0-100), and matched_symptoms array. The report SHALL contain urgency from valid enum and non-empty next_steps array.
**Validates: Requirements 5.3, 5.4**

### Property 13: Request Validation Strictness
*For any* malformed request (missing required fields, invalid types, out-of-range values), the API SHALL return a structured error response with error_code and SHALL NOT process the request.
**Validates: Requirements 6.1, 6.5, 6.7**

### Property 14: Row Level Security Enforcement
*For any* database query for sessions or reports, the query SHALL only return records where user_id matches the authenticated user's ID.
**Validates: Requirements 8.4**

### Property 15: Red Flag Audit Logging
*For any* triggered Red Flag Protocol, an audit log entry SHALL be created containing session_id, detected_pattern, timestamp, and symptom data.
**Validates: Requirements 9.4**

### Property 16: Language Output Consistency
*For any* session with language set to "zh" or "en", all generated question texts and report content SHALL be in the specified language.
**Validates: Requirements 10.2, 10.4**

### Property 17: Brain Integration Data Flow
*For any* completed assessment, the report data SHALL be stored in ai_memory table with correct user_id, embedding vector, and metadata containing assessment type and conditions.
**Validates: Requirements 12.3**

## Error Handling

### Error Categories

| Error Code | Category | User Message (zh) | User Message (en) |
|------------|----------|-------------------|-------------------|
| `SESSION_NOT_FOUND` | 404 | 找不到您的评估会话，请重新开始 | Session not found, please start again |
| `SESSION_EXPIRED` | 410 | 您的评估会话已过期，请重新开始 | Your session has expired, please start again |
| `INVALID_REQUEST` | 400 | 请求格式有误，请稍后重试 | Invalid request format, please try again |
| `AI_GENERATION_FAILED` | 500 | AI 暂时无法响应，请稍后重试 | AI temporarily unavailable, please try again |
| `DATABASE_ERROR` | 500 | 数据保存失败，请稍后重试 | Failed to save data, please try again |

### Error Response Schema

```typescript
const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional()
  })
});
```

### Graceful Degradation

1. **AI Timeout**: If Claude doesn't respond within 30 seconds, return a generic follow-up question from a fallback pool
2. **Database Unavailable**: Cache session state in localStorage, sync when connection restored
3. **Red Flag False Positive**: Allow user to dismiss emergency screen with confirmation, but log the dismissal

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests:

- **Unit tests**: Verify specific examples, edge cases, and integration points
- **Property-based tests**: Verify universal properties that should hold across all inputs

### Property-Based Testing Framework

**Library**: `fast-check` (TypeScript property-based testing library)

**Configuration**: Each property test SHALL run a minimum of 100 iterations.

### Test Categories

#### 1. Schema Validation Tests (Property-Based)
- Generate random valid/invalid request bodies
- Verify Zod schema accepts valid inputs and rejects invalid ones
- Test discriminated union parsing

#### 2. State Machine Tests (Property-Based)
- Generate random sequences of phase transitions
- Verify all transitions follow valid paths
- Test session restoration after arbitrary states

#### 3. Red Flag Detection Tests (Property-Based)
- Generate random symptom combinations
- Verify red flag patterns are detected correctly
- Test edge cases (partial matches, near-misses)

#### 4. Report Generation Tests (Property-Based)
- Generate random session histories
- Verify reports are always well-formed
- Test ranking and best-match selection

#### 5. Integration Tests (Unit)
- Test API endpoints with mock AI responses
- Test database operations with test database
- Test Brain integration data flow

### Test File Structure

```
__tests__/
  assessment/
    schema.test.ts           # Schema validation tests
    state-machine.test.ts    # Phase transition tests
    red-flag.test.ts         # Red flag detection tests
    report.test.ts           # Report generation tests
    api.integration.test.ts  # API integration tests
```

### Property Test Annotation Format

Each property-based test SHALL be annotated with:
```typescript
/**
 * **Feature: assessment-engine, Property 7: API Response Schema Compliance**
 * **Validates: Requirements 4.2, 6.2, 6.3, 6.4**
 */
```
