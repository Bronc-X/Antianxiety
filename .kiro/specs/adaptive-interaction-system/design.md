# Design Document: Adaptive Interaction System

## Overview

本设计文档描述 No More Anxious 应用的自适应交互系统架构。该系统将注册问卷、每日校准、AI 主动问询、去噪信息流四个模块整合为一个智能闭环，核心围绕用户的"阶段性目标（Phase Goal）"运转。

### Design Principles

1. **Speed First**: AI 响应必须快速（<800ms），使用流式输出和预加载策略
2. **Data-Driven Personalization**: 所有交互基于用户数据，而非通用模板
3. **Progressive Disclosure**: 问题逐步深入，避免信息过载
4. **Scientific Grounding**: 所有推荐必须有科学依据

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  AdaptiveOnboarding  │  DailyCalibration  │  ActiveInquiryBanner │
│       Component      │     Component      │      Component       │
└──────────┬───────────┴─────────┬──────────┴──────────┬──────────┘
           │                     │                     │
           ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Routes (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  /api/onboarding/    │  /api/calibration/  │  /api/inquiry/     │
│  - next-question     │  - generate         │  - generate        │
│  - recommend-goals   │  - submit           │  - respond         │
└──────────┬───────────┴─────────┬──────────┴──────────┬──────────┘
           │                     │                     │
           ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI Service Layer (lib/)                       │
├─────────────────────────────────────────────────────────────────┤
│  DecisionTreeEngine  │  CalibrationEngine │  InquiryEngine      │
│  - generateQuestion  │  - selectQuestions │  - prioritizeGaps   │
│  - inferGoals        │  - evolveQuestions │  - generateQuestion │
└──────────┬───────────┴─────────┬──────────┴──────────┬──────────┘
           │                     │                     │
           ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Backend                            │
├─────────────────────────────────────────────────────────────────┤
│  user_profiles  │  onboarding_answers  │  daily_calibrations   │
│  phase_goals    │  inquiry_history     │  curated_feed         │
└──────────┬──────┴──────────────────────┴──────────┬─────────────┘
           │                                        │
           ▼                                        ▼
┌─────────────────────────────────────────────────────────────────┐
│              Background Jobs (pg_cron + Edge Functions)          │
├─────────────────────────────────────────────────────────────────┤
│  content-curator     │  inquiry-scheduler  │  goal-evaluator    │
│  (daily per user)    │  (adaptive timing)  │  (weekly review)   │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. AdaptiveOnboardingFlow Component

```typescript
interface AdaptiveOnboardingProps {
  onComplete: (result: OnboardingResult) => void;
}

interface OnboardingResult {
  answers: Record<string, string>;
  metabolicProfile: MetabolicProfile;
  recommendedGoals: PhaseGoal[];
}

interface PhaseGoal {
  id: string;
  type: 'sleep' | 'energy' | 'weight' | 'stress' | 'fitness';
  priority: 1 | 2;
  title: string;
  rationale: string;
  citations: Citation[];
}

interface Citation {
  title: string;
  authors: string;
  year: number;
  doi?: string;
  url?: string;
}
```

### 2. Decision Tree Engine

```typescript
interface DecisionTreeEngine {
  // 根据已有答案生成下一个问题
  generateNextQuestion(
    templateAnswers: Record<string, string>,
    previousDecisionAnswers: Record<string, string>
  ): Promise<DecisionQuestion>;
  
  // 基于所有答案推断阶段性目标
  inferPhaseGoals(
    allAnswers: Record<string, string>
  ): Promise<PhaseGoal[]>;
}

interface DecisionQuestion {
  id: string;
  question: string;
  description?: string;
  options: QuestionOption[];
  reasoning: string; // AI 为什么问这个问题
}
```

### 3. Daily Calibration Engine

```typescript
interface CalibrationEngine {
  // 生成今日校准问题
  generateDailyQuestions(
    userId: string,
    phaseGoals: PhaseGoal[],
    calibrationHistory: CalibrationRecord[]
  ): Promise<CalibrationQuestion[]>;
  
  // 判断是否需要大进阶
  shouldEvolve(
    consecutiveDays: number,
    progressMetrics: ProgressMetrics
  ): boolean;
}

interface CalibrationQuestion {
  id: string;
  type: 'anchor' | 'adaptive' | 'evolution';
  question: string;
  inputType: 'slider' | 'single' | 'multi' | 'text';
  options?: QuestionOption[];
  min?: number;
  max?: number;
}
```

### 4. Active Inquiry Engine

```typescript
interface InquiryEngine {
  // 生成主动问询问题
  generateInquiry(
    userId: string,
    context: InquiryContext
  ): Promise<InquiryQuestion>;
  
  // 计算最佳问询时机
  calculateOptimalTiming(
    userId: string,
    activityHistory: ActivityRecord[]
  ): Promise<InquiryTiming>;
}

interface InquiryContext {
  phaseGoals: PhaseGoal[];
  recentCalibrations: CalibrationRecord[];
  dataGaps: DataGap[];
  lastInquiryTime: Date;
}

interface InquiryTiming {
  suggestedTime: Date;
  confidence: number;
  reasoning: string;
}
```

## Data Models

### Database Schema Updates

```sql
-- 阶段性目标表
CREATE TABLE phase_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL, -- 'sleep', 'energy', 'weight', 'stress', 'fitness'
  priority INTEGER NOT NULL CHECK (priority IN (1, 2)),
  title TEXT NOT NULL,
  rationale TEXT NOT NULL,
  citations JSONB DEFAULT '[]',
  is_ai_recommended BOOLEAN DEFAULT true,
  user_modified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, priority)
);

-- 注册问卷答案表
CREATE TABLE onboarding_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  question_type TEXT NOT NULL, -- 'template', 'decision_tree'
  question_text TEXT NOT NULL,
  answer_value TEXT NOT NULL,
  answer_label TEXT,
  sequence_order INTEGER NOT NULL,
  ai_reasoning TEXT, -- AI 为什么问这个问题
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 每日校准记录表（扩展）
ALTER TABLE daily_calibrations ADD COLUMN IF NOT EXISTS
  question_evolution_level INTEGER DEFAULT 1;
ALTER TABLE daily_calibrations ADD COLUMN IF NOT EXISTS
  questions_asked JSONB DEFAULT '[]';

-- 主动问询历史表
CREATE TABLE inquiry_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL, -- 'diagnostic', 'feed_recommendation'
  priority TEXT NOT NULL, -- 'high', 'medium', 'low'
  data_gaps_addressed TEXT[],
  user_response TEXT,
  responded_at TIMESTAMPTZ,
  delivery_method TEXT NOT NULL, -- 'push', 'in_app'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户活动模式表（用于自适应时机）
CREATE TABLE user_activity_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0-6
  hour_of_day INTEGER NOT NULL, -- 0-23
  activity_score FLOAT DEFAULT 0, -- 0-1, 基于历史活跃度
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, day_of_week, hour_of_day)
);

-- 个性化内容队列表
CREATE TABLE curated_feed_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'paper', 'article', 'tip'
  title TEXT NOT NULL,
  summary TEXT,
  url TEXT,
  source TEXT NOT NULL,
  relevance_score FLOAT NOT NULL,
  matched_goals TEXT[],
  is_pushed BOOLEAN DEFAULT false,
  pushed_at TIMESTAMPTZ,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE phase_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiry_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE curated_feed_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own phase_goals" ON phase_goals
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own onboarding_answers" ON onboarding_answers
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own inquiry_history" ON inquiry_history
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own activity_patterns" ON user_activity_patterns
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own curated_feed" ON curated_feed_queue
  FOR ALL USING (auth.uid() = user_id);
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Template Question Count Invariant
*For any* onboarding flow initialization, the template questions array SHALL contain exactly 3 questions.
**Validates: Requirements 1.2**

### Property 2: Total Question Limit
*For any* sequence of user answers during onboarding, the total question count (template + decision-tree) SHALL NOT exceed 7.
**Validates: Requirements 1.5**

### Property 3: Decision Tree Response Time
*For any* valid user answer to a template question, the AI-generated next question SHALL be returned within 800ms.
**Validates: Requirements 1.3**

### Property 4: Phase Goal Generation Validity
*For any* completed onboarding answer set, the generated Phase Goals SHALL contain 1-2 goals, each with a priority (1 or 2), a non-empty rationale, and at least one citation.
**Validates: Requirements 1.6, 2.1, 2.2**

### Property 5: Goal-Settings Synchronization
*For any* Phase Goal set during onboarding, the same goal data SHALL be retrievable from the Settings page without modification.
**Validates: Requirements 2.5**

### Property 6: Goal Modification Persistence
*For any* user-confirmed goal modification, the database SHALL reflect the change within 1 second, and the user_modified flag SHALL be set to true.
**Validates: Requirements 2.4**

### Property 7: Daily Calibration Goal Alignment
*For any* user with a Phase Goal, the generated daily calibration questions SHALL include at least one question that references or relates to that goal.
**Validates: Requirements 3.1**

### Property 8: Anchor Question Presence
*For any* generated daily calibration question set, at least one question SHALL be of type 'anchor'.
**Validates: Requirements 3.2**

### Property 9: Seven-Day Evolution Trigger
*For any* user who completes 7 consecutive days of calibration, the question_evolution_level SHALL increment by 1.
**Validates: Requirements 3.3**

### Property 10: Goal Change Adaptation
*For any* Phase Goal change, the next daily calibration question set SHALL differ from the previous day's set in at least one adaptive question.
**Validates: Requirements 3.5**

### Property 11: Inquiry Data Gap Prioritization
*For any* user with identified data gaps, the generated inquiry question SHALL address the highest-priority gap.
**Validates: Requirements 4.4**

### Property 12: Inquiry Response Tracking
*For any* user response to an active inquiry, the inquiry_history record SHALL be updated with the response and responded_at timestamp.
**Validates: Requirements 4.5**

### Property 13: Feed Recommendation Relevance
*For any* feed content recommended to a user, the content SHALL have a relevance_score above the threshold AND include a non-empty relevance explanation.
**Validates: Requirements 5.1, 5.2**

### Property 14: Feed Engagement Tracking
*For any* user engagement with a recommended article, the curated_feed_queue record SHALL be updated with is_read=true and read_at timestamp.
**Validates: Requirements 5.3**

### Property 15: Content Curation Pipeline
*For any* active user during the curation job, the system SHALL fetch content, filter by Phase Goals, and store with relevance scores.
**Validates: Requirements 6.1, 6.2, 6.3**

### Property 16: Inactive User Curation Reduction
*For any* user inactive for 7+ days, the curation job SHALL skip or reduce content fetching for that user.
**Validates: Requirements 6.5**

## Error Handling

### Onboarding Errors
- **AI Timeout**: If decision-tree question generation exceeds 800ms, display a pre-cached fallback question and log the timeout
- **Goal Generation Failure**: If goal inference fails, present a manual goal selection UI as fallback
- **Network Error**: Cache partial answers locally and resume on reconnection

### Daily Calibration Errors
- **Question Generation Failure**: Fall back to anchor questions only
- **Evolution Calculation Error**: Maintain current evolution level and retry next day

### Active Inquiry Errors
- **Timing Calculation Failure**: Use default timing (9:00 AM, 3:00 PM local time)
- **Push Notification Failure**: Queue for in-app display on next open

### Content Curation Errors
- **API Rate Limit**: Implement exponential backoff and retry
- **Content Fetch Failure**: Log error and continue with cached content
- **Database Write Failure**: Retry with exponential backoff, alert on repeated failures

## Testing Strategy

### Unit Testing
- Test template question array initialization
- Test decision tree question generation logic
- Test goal inference algorithm
- Test calibration question selection
- Test evolution trigger conditions
- Test inquiry timing calculation
- Test content relevance scoring

### Property-Based Testing
We will use **fast-check** as the property-based testing library for TypeScript.

Each property test will:
1. Generate random but valid inputs (user answers, profiles, goals)
2. Execute the system under test
3. Verify the property holds for all generated inputs
4. Run a minimum of 100 iterations per property

Property tests will be tagged with the format:
`**Feature: adaptive-interaction-system, Property {number}: {property_text}**`

### Integration Testing
- Test onboarding flow end-to-end
- Test goal sync between onboarding and settings
- Test daily calibration evolution over 7 days
- Test inquiry delivery via push notification
- Test content curation job execution

### Performance Testing
- Verify decision-tree question generation < 800ms (P95)
- Verify goal generation < 2 seconds (P95)
- Verify goal modification persistence < 1 second (P95)
