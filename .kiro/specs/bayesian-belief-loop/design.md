# Design Document: Bayesian Belief Loop (认知天平系统)

## Overview

贝叶斯信念循环是 No More Anxious 的核心创新功能——一个"认知天平"系统，将贝叶斯公式可视化为动态天平，帮助用户用数学真相替代焦虑。

**核心理念**: "Truth is Comfort" —— 用数学真相替代焦虑

**两种交互模式**:
1. **主动式沉浸重构 (Active Ritual)**: 全屏沉浸体验，用于每日校准或用户主动触发"我很焦虑"
2. **被动式微修正 (Passive Nudge)**: 不打断的微提示，用于习惯完成或生理数据好转时

**技术亮点**:
- Framer Motion 高级动画 (spring physics, motion path, layoutId, AnimatePresence)
- PostgreSQL pl/pgsql 贝叶斯计算函数
- Semantic Scholar API 科学证据检索
- Capacitor Haptics 触觉反馈

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Frontend Layer (Next.js)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Active Ritual Flow (全屏沉浸)                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │ FearInput   │→ │ EvidenceRain│→ │ BayesianMoment│→│ ResultReveal│  │   │
│  │  │ (红色滑块)   │  │ (砝码落入)   │  │ (数字滚动)    │  │ (结果揭示)  │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Passive Nudge Flow (微提示)                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                   │   │
│  │  │ NudgeToast  │→ │ ParticleFly │→ │ ScoreUpdate │                   │   │
│  │  │ (顶部Toast) │  │ (粒子飞入)   │  │ (分数更新)   │                   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ CognitiveScale  │  │ AnxietyCurve    │  │ EvidenceStack   │             │
│  │ (认知天平组件)   │  │ (焦虑曲线图表)  │  │ (证据栈展示)    │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
│           │                    │                    │                       │
│           └────────────────────┼────────────────────┘                       │
│                                │                                            │
│                    ┌───────────▼───────────┐                               │
│                    │   BayesianDashboard   │                               │
│                    │   (贝叶斯仪表板)       │                               │
│                    └───────────┬───────────┘                               │
└────────────────────────────────┼───────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API Layer                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ /api/bayesian/  │  │ /api/bayesian/  │  │ /api/bayesian/  │             │
│  │ ritual          │  │ nudge           │  │ evidence        │             │
│  │ (主动仪式)       │  │ (被动微调)      │  │ (证据检索)      │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
│           │                    │                    │                       │
│           └────────────────────┼────────────────────┘                       │
│                                │                                            │
│                    ┌───────────▼───────────┐                               │
│                    │   Semantic Scholar    │                               │
│                    │   API Integration     │                               │
│                    └───────────────────────┘                               │
└────────────────────────────────┼───────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Database Layer (Supabase)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    PostgreSQL Functions                              │   │
│  │  ┌─────────────────────┐  ┌─────────────────────────────────────┐   │   │
│  │  │ calculate_bayesian_ │  │ trigger_bayesian_update_on_         │   │   │
│  │  │ posterior()         │  │ belief_insert()                     │   │   │
│  │  └─────────────────────┘  └─────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ bayesian_beliefs│  │ evidence_cache  │  │ user_metrics    │             │
│  │ (信念记录)       │  │ (证据缓存)      │  │ (用户指标)      │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. CognitiveScale Component (认知天平)

```typescript
interface CognitiveScaleProps {
  priorScore: number;           // 0-100, 左端红色
  posteriorScore: number;       // 0-100, 计算结果
  evidenceStack: Evidence[];    // 右端砝码
  isAnimating: boolean;
  onEvidenceTap?: (evidence: Evidence) => void;
}

interface Evidence {
  type: 'bio' | 'science' | 'action';
  value: string;                // e.g., "HRV=55ms"
  weight: number;               // 0.0-1.0
  source_id?: string;           // Semantic Scholar paper ID
  consensus?: number;           // 0.0-1.0 for science evidence
}
```

**Framer Motion 动画设计**:
```typescript
const scaleVariants = {
  initial: { rotate: 0 },
  tilted: { rotate: -15, transition: { type: "spring", stiffness: 100 } },
  balanced: { rotate: 0, transition: { type: "spring", stiffness: 50, damping: 10 } }
};

const weightVariants = {
  hidden: { y: -100, opacity: 0, scale: 0.5 },
  visible: { 
    y: 0, 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 20 }
  }
};
```

### 2. FearInputSlider Component (恐惧输入滑块)

```typescript
interface FearInputSliderProps {
  value: number;                // 0-100
  onChange: (value: number) => void;
  onSubmit: () => void;
  beliefContext: BeliefContext;
}

type BeliefContext = 
  | 'metabolic_crash'    // 代谢崩溃
  | 'cardiac_event'      // 心脏事件
  | 'social_rejection'   // 社交被拒
  | 'custom';            // 自定义
```

**视觉设计**:
- 全屏黑色背景 (#0A0A0A)
- 红色渐变滑块 (从暗红到亮红)
- 数字显示使用 useSpring 动画
- 提交时触发 Haptics.impact({ style: 'heavy' })

### 3. EvidenceRain Component (证据雨)

```typescript
interface EvidenceRainProps {
  evidences: Evidence[];
  onComplete: () => void;
  staggerDelay?: number;        // 默认 0.3s
}
```

**Framer Motion 动画序列**:
```typescript
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.2
    }
  }
};

const evidenceVariants = {
  hidden: { y: -200, opacity: 0, scale: 0 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
      mass: 1.5
    }
  }
};
```

### 4. BayesianMoment Component (贝叶斯时刻)

```typescript
interface BayesianMomentProps {
  prior: number;
  posterior: number;
  formula: {
    likelihood: number;
    evidence: number;
  };
  onComplete: () => void;
}
```

**数字滚动动画**:
```typescript
const NumberRoller: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const spring = useSpring(from, { stiffness: 50, damping: 20 });
  
  useEffect(() => {
    spring.set(to);
  }, [to]);
  
  return (
    <motion.span>
      {useTransform(spring, (v) => Math.round(v))}%
    </motion.span>
  );
};
```

### 5. PassiveNudge Component (被动微调)

```typescript
interface PassiveNudgeProps {
  actionType: string;           // e.g., "Breathing"
  correction: number;           // e.g., -5 (percentage points)
  targetPosition: { x: number; y: number };  // 焦虑指数位置
}
```

**粒子飞行动画 (Motion Path)**:
```typescript
const particleVariants = {
  initial: { 
    x: 0, 
    y: 0, 
    scale: 1, 
    opacity: 1 
  },
  animate: {
    x: [0, 50, targetPosition.x],
    y: [0, -30, targetPosition.y],
    scale: [1, 1.2, 0.5],
    opacity: [1, 1, 0],
    transition: {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1]  // Custom bezier
    }
  }
};
```

### 6. AnxietyCurve Component (焦虑曲线)

```typescript
interface AnxietyCurveProps {
  data: Array<{
    date: string;
    posteriorScore: number;
    evidenceStack: Evidence[];
  }>;
  timeRange: '7d' | '30d' | '90d' | 'all';
  onDataPointTap?: (point: DataPoint) => void;
}
```

**Framer Motion + Recharts 集成**:
- 使用 `motion.path` 包装 Recharts Line
- 路径绘制动画 `pathLength: [0, 1]`
- 数据点使用 `layoutId` 实现展开详情

## Data Models

### bayesian_beliefs Table (核心表)

```sql
CREATE TABLE bayesian_beliefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  belief_context TEXT NOT NULL,           -- 'metabolic_crash', 'cardiac_event', etc.
  prior_score INTEGER NOT NULL CHECK (prior_score >= 0 AND prior_score <= 100),
  posterior_score INTEGER NOT NULL CHECK (posterior_score >= 0 AND posterior_score <= 100),
  evidence_stack JSONB NOT NULL DEFAULT '[]',
  calculation_details JSONB,              -- 完整计算过程
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bayesian_beliefs_user ON bayesian_beliefs(user_id, created_at DESC);

-- RLS Policy
ALTER TABLE bayesian_beliefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own beliefs" ON bayesian_beliefs
  FOR ALL USING (auth.uid() = user_id);
```

### evidence_stack JSONB Schema

```json
[
  {
    "type": "bio",
    "value": "HRV=55ms",
    "weight": 0.3,
    "raw_data": { "hrv": 55, "unit": "ms" }
  },
  {
    "type": "science",
    "source_id": "paper_abc123",
    "title": "HRV and Anxiety: A Meta-Analysis",
    "consensus": 0.85,
    "citation_count": 234,
    "weight": 0.5,
    "url": "https://semanticscholar.org/paper/abc123"
  },
  {
    "type": "action",
    "action": "breathing_exercise",
    "duration_minutes": 5,
    "weight": 0.1
  }
]
```

### evidence_cache Table (科学证据缓存)

```sql
CREATE TABLE evidence_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  belief_context TEXT NOT NULL,
  paper_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  abstract TEXT,
  citation_count INTEGER,
  consensus_score DECIMAL(3,2),
  url TEXT,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX idx_evidence_cache_context ON evidence_cache(belief_context);
```

### PostgreSQL Bayesian Function

```sql
CREATE OR REPLACE FUNCTION calculate_bayesian_posterior(
  p_prior INTEGER,
  p_evidence_stack JSONB
) RETURNS INTEGER AS $$
DECLARE
  v_likelihood DECIMAL;
  v_evidence DECIMAL;
  v_posterior DECIMAL;
  v_total_weight DECIMAL := 0;
  v_weighted_sum DECIMAL := 0;
  v_item JSONB;
BEGIN
  -- Calculate normalized weights and weighted evidence
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_evidence_stack)
  LOOP
    v_total_weight := v_total_weight + (v_item->>'weight')::DECIMAL;
  END LOOP;
  
  -- Normalize and calculate likelihood
  IF v_total_weight > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_evidence_stack)
    LOOP
      v_weighted_sum := v_weighted_sum + 
        ((v_item->>'weight')::DECIMAL / v_total_weight) * 
        COALESCE((v_item->>'consensus')::DECIMAL, 0.7);
    END LOOP;
    v_likelihood := v_weighted_sum;
  ELSE
    v_likelihood := 0.5;  -- Default likelihood
  END IF;
  
  -- Bayesian calculation: P(H|E) = P(E|H) * P(H) / P(E)
  -- Simplified: posterior = likelihood * prior / evidence_strength
  v_evidence := 0.5 + (v_total_weight * 0.3);  -- Evidence strength based on weight
  v_posterior := (v_likelihood * (p_prior::DECIMAL / 100)) / v_evidence * 100;
  
  -- Clamp to valid range
  v_posterior := GREATEST(0, LEAST(100, v_posterior));
  
  RETURN ROUND(v_posterior)::INTEGER;
END;
$$ LANGUAGE plpgsql;
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Posterior Score Bounds Invariant
*For any* Bayesian calculation with any prior score (0-100) and any evidence stack, the resulting posterior score SHALL always be within the range [0, 100].
**Validates: Requirements 3.2, 7.2**

### Property 2: Evidence Weight Bounds
*For any* evidence in the evidence stack:
- Bio evidence weight SHALL be in range [0.2, 0.4]
- Science evidence weight SHALL be in range [0.3, 0.6]
- Action evidence weight SHALL be in range [0.05, 0.2]
**Validates: Requirements 5.2, 5.3, 5.4**

### Property 3: Weight Normalization Invariant
*For any* evidence stack with one or more items, after normalization, the sum of all weights SHALL equal 1.0 (within floating point tolerance of 0.001).
**Validates: Requirements 5.5**

### Property 4: Evidence Stack Round Trip
*For any* valid evidence stack object, serializing to JSON and deserializing back SHALL produce an equivalent object with all fields preserved (type, value, weight, source_id, consensus).
**Validates: Requirements 3.5, 7.3, 7.5**

### Property 5: Belief Score Persistence Round Trip
*For any* prior score submission with valid context, storing to bayesian_beliefs and retrieving SHALL return the same prior_score, belief_context, and timestamp (within 1 second tolerance).
**Validates: Requirements 1.4, 4.5**

### Property 6: Exaggeration Factor Calculation
*For any* prior and posterior where posterior > 0, the exaggeration factor X displayed in "你的恐惧被夸大了 X 倍" SHALL equal prior / posterior (rounded to 1 decimal place).
**Validates: Requirements 3.3**

### Property 7: Curve Color Coding Consistency
*For any* two consecutive data points in the anxiety curve:
- IF posterior[n] < posterior[n-1] THEN segment color SHALL be sage green (#9CAF88)
- IF posterior[n] > posterior[n-1] THEN segment color SHALL be clay (#C4A77D)
**Validates: Requirements 6.2, 6.3**

### Property 8: Passive Nudge Trigger Consistency
*For any* habit completion event, a Passive Nudge SHALL be triggered with a probability correction value in the range [-20, -1] percentage points.
**Validates: Requirements 4.1, 4.4**

### Property 9: Science Evidence Citation Filter
*For any* paper returned from Semantic Scholar query, the citation_count SHALL be greater than 50.
**Validates: Requirements 8.2**

### Property 10: Database Trigger Idempotency
*For any* belief record, triggering the Bayesian update function multiple times with the same evidence_stack SHALL produce the same posterior_score.
**Validates: Requirements 7.1, 7.2**

### Property 11: Graceful Degradation on API Failure
*For any* Bayesian calculation where Semantic Scholar API fails, the system SHALL still produce a valid posterior using only bio and action evidence, with posterior in range [0, 100].
**Validates: Requirements 8.5**

## Error Handling

### Database Errors
- **Trigger Failure**: 记录错误日志，保持前一个 posterior_score 不变，不向用户显示错误
- **Connection Timeout**: 使用本地缓存的最后已知分数，标记为"离线模式"
- **JSON Validation Failure**: 拒绝无效的 evidence_stack，返回友好错误消息

### Calculation Errors
- **Division by Zero**: 当 evidence strength = 0 时，使用默认值 0.5
- **NaN Results**: 回退到简单平均计算，记录异常
- **Out of Bounds**: 使用 GREATEST/LEAST 钳制到 [0, 100]

### API Errors
- **Semantic Scholar Timeout**: 使用 evidence_cache 中的缓存数据
- **Semantic Scholar Rate Limit**: 降级到仅使用 bio + action 证据
- **No Papers Found**: 使用预缓存的通用焦虑研究论文

### Animation Errors
- **Framer Motion Failure**: 降级为静态显示，无动画
- **Haptics Unavailable**: 静默跳过触觉反馈

### Error Messages (California Calm Style)
- ❌ "Error: Calculation failed"
- ✅ "正在重新校准您的认知天平，请稍候..."
- ❌ "API timeout"
- ✅ "科学证据正在路上，先用您的生理数据开始吧 🌱"
- ❌ "Invalid input"
- ✅ "让我们重新感受一下您的焦虑程度..."

## Testing Strategy

### Unit Testing (Vitest)
- 测试贝叶斯计算函数的边界条件
- 测试证据权重归一化逻辑
- 测试 JSON 序列化/反序列化
- 测试颜色编码逻辑

### Property-Based Testing (fast-check)
- 使用 fast-check 库进行属性测试
- 每个属性测试运行 100+ 次迭代
- 测试标注格式: `**Feature: bayesian-belief-loop, Property {number}: {property_text}**`

**Generator 策略**:
```typescript
// Prior score generator
const priorScoreArb = fc.integer({ min: 0, max: 100 });

// Evidence generator
const evidenceArb = fc.record({
  type: fc.constantFrom('bio', 'science', 'action'),
  value: fc.string({ minLength: 1, maxLength: 50 }),
  weight: fc.double({ min: 0.05, max: 0.6, noNaN: true }),
  consensus: fc.option(fc.double({ min: 0, max: 1, noNaN: true }))
});

// Evidence stack generator
const evidenceStackArb = fc.array(evidenceArb, { minLength: 1, maxLength: 5 });
```

### Integration Testing
- 测试数据库触发器与前端的端到端流程
- 测试 Semantic Scholar API 集成
- 测试离线/在线状态切换

### Visual Testing
- 使用 Storybook 测试 Framer Motion 动画组件
- 测试不同屏幕尺寸下的响应式布局
- 测试动画在低性能设备上的降级

### Animation Testing
- 验证 Framer Motion variants 正确应用
- 测试动画序列的时序正确性
- 测试 Haptics 触发时机
