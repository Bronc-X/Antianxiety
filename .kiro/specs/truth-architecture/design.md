# Design Document: Truth Architecture

## Overview

本设计文档描述了 Neuromind "真相架构"的技术实现方案。核心目标是将系统从通用健康追踪器转型为"抗焦虑认知假肢"，通过认知重构将生理数据转化为安慰性真相。

### 核心哲学
- **真相即安慰**: "Truth is the comfort after discarding imagination"
- **认知重构**: 将症状解释为生物适应性，而非失败
- **科学锚定**: 所有建议基于可验证的科学共识

### 视觉风格 (Calm Tech)
- 保持 Classic Beige 背景 (`#FAF6EF`)
- 卡片式布局
- Bio-Voltage 动画：缓慢呼吸式发光，模拟"气"或"模拟电压"的有机感

## Architecture

```mermaid
graph TB
    subgraph Frontend
        LC[LandingContent.tsx]
        CM[ConsensusMeter.tsx]
        BV[BioVoltageCard.tsx]
        FC[FloatingChat.tsx]
    end
    
    subgraph API Layer
        IG[/api/insight/generate]
        CH[/api/chat]
    end
    
    subgraph Services
        RF[ReframingService]
        BVS[BioVoltageService]
        AIS[ActiveInquiryService]
    end
    
    subgraph Data
        DL[(daily_logs)]
        UP[(user_profiles)]
    end
    
    LC --> IG
    LC --> CM
    LC --> BV
    FC --> CH
    
    IG --> RF
    CH --> AIS
    BV --> BVS
    
    RF --> DL
    AIS --> DL
    BVS --> UP
```

## Components and Interfaces

### 1. Insight API (`/api/insight/generate`)

```typescript
// Request
interface InsightRequest {
  sleep_hours: number;
  hrv: number;
  stress_level: number;
  exercise_minutes?: number;
}

// Response: Streaming text response
// Headers: x-neuromind-sources: JSON array of sources
```

**Constitutional AI System Prompt:**
```
You are a Metabolic Physiologist. Your role is to reframe symptoms as biological adaptations.

RULES:
1. NEVER use judgmental language (bad, failure, warning, deprivation)
2. ALWAYS use "bio-electric" or "adaptation" framing
3. Use metaphors: mitochondria, nervous system recalibration, bio-voltage
4. Be empathetic but precise
5. Keep responses to 1-2 sentences

EXAMPLES:
- Low sleep → "Your mitochondria are prioritizing repair over output. This is a physiological adaptation, not a failure."
- Low HRV → "Your nervous system is recalibrating. This temporary state reflects your body's intelligent response to recent demands."
```

### 2. Bio-Voltage Service

```typescript
interface BioVoltageRecommendation {
  title: string;
  description: string;
  technique: 'six_healing_sounds' | 'zhan_zhuang' | 'box_breathing';
  duration_minutes: number;
}

function getBioVoltageRecommendation(
  stressLevel: number,
  energyLevel: number
): BioVoltageRecommendation {
  if (stressLevel > 7) {
    return {
      title: 'Six Healing Sounds',
      description: 'Discharge excess noise',
      technique: 'six_healing_sounds',
      duration_minutes: 5
    };
  }
  if (stressLevel < 4 || energyLevel < 4) {
    return {
      title: 'Standing Meditation (Zhan Zhuang)',
      description: 'Grounding to recharge',
      technique: 'zhan_zhuang',
      duration_minutes: 10
    };
  }
  return {
    title: 'Box Breathing',
    description: 'Maintain equilibrium',
    technique: 'box_breathing',
    duration_minutes: 3
  };
}
```

### 3. Consensus Meter Component

```typescript
interface ConsensusMeterProps {
  percentage: number;  // 0-100
  metaAnalysisCount: number;
  sources: ScientificSource[];
}

type ConsensusLevel = 'high' | 'emerging' | 'controversial';

function getConsensusLevel(percentage: number): ConsensusLevel {
  if (percentage >= 70) return 'high';      // Green
  if (percentage >= 40) return 'emerging';  // Yellow
  return 'controversial';                    // Gray
}

function formatConsensusText(percentage: number): string {
  const level = getConsensusLevel(percentage);
  const labels = {
    high: 'High Consensus',
    emerging: 'Emerging Evidence',
    controversial: 'Controversial'
  };
  return `${labels[level]} (${percentage}%)`;
}

function formatVerificationText(count: number): string {
  return `Verified by ${count} meta-analyses`;
}
```

### 4. Active Inquiry Service

```typescript
interface ActiveInquiryContext {
  dailyLogs: DailyLog[];
  profile: UserProfile;
}

interface DiagnosticQuestion {
  question: string;
  dataPoints: string[];
  possibleTriggers: string[];
}

function generateActiveInquiry(context: ActiveInquiryContext): DiagnosticQuestion {
  const latestLog = context.dailyLogs[0];
  
  // Detect HRV dip pattern
  if (latestLog?.hrv && latestLog.hrv < 50) {
    return {
      question: `I noticed your HRV dipped to ${latestLog.hrv}ms. Was there a specific stress trigger, or did you have a high-carb lunch?`,
      dataPoints: [`HRV: ${latestLog.hrv}ms`],
      possibleTriggers: ['stress', 'high-carb meal', 'poor sleep']
    };
  }
  
  // Detect sleep pattern
  if (latestLog?.sleep_hours && latestLog.sleep_hours < 6) {
    return {
      question: `Your sleep was ${latestLog.sleep_hours}h last night. Was this due to late work, or difficulty falling asleep?`,
      dataPoints: [`Sleep: ${latestLog.sleep_hours}h`],
      possibleTriggers: ['late work', 'insomnia', 'environment']
    };
  }
  
  // Default contextual greeting
  return {
    question: `Based on your recent data, how are you feeling right now?`,
    dataPoints: [],
    possibleTriggers: []
  };
}
```

## Data Models

### Daily Log (existing, extended)
```typescript
interface DailyLog {
  id: string;
  user_id: string;
  sleep_hours: number;
  hrv: number;
  stress_level: number;
  exercise_duration_minutes: number;
  created_at: string;
  // New fields for pattern detection
  hrv_timestamps?: { time: string; value: number }[];
}
```

### Scientific Source
```typescript
interface ScientificSource {
  title: string;
  url: string;
  citations: number;
  consensus_percentage: number;
  meta_analysis_count: number;
  source_type: 'meta_analysis' | 'rct' | 'observational';
}
```

### Reframed Insight
```typescript
interface ReframedInsight {
  content: string;
  framing_type: 'adaptation' | 'recalibration' | 'optimization';
  sources: ScientificSource[];
  generated_at: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, the following properties have been identified:

### Property 1: Insight Reframing Avoids Judgmental Language
*For any* biometric input (sleep_hours, hrv, stress_level), the generated insight SHALL NOT contain judgmental words from the forbidden list ["failure", "bad", "warning", "deprivation", "problem", "danger"].
**Validates: Requirements 1.2**

### Property 2: Insight Contains Positive Framing
*For any* biometric input, the generated insight SHALL contain at least one positive framing term from the approved list ["adaptation", "recalibrating", "prioritizing", "intelligent response", "bio-electric", "mitochondria"].
**Validates: Requirements 1.1, 1.2**

### Property 3: Bio-Voltage High Stress Recommendation
*For any* stress_level > 7, the getBioVoltageRecommendation function SHALL return a recommendation with technique "six_healing_sounds" and description containing "Discharge".
**Validates: Requirements 2.1**

### Property 4: Bio-Voltage Low Energy Recommendation
*For any* stress_level < 4 OR energy_level < 4, the getBioVoltageRecommendation function SHALL return a recommendation with technique "zhan_zhuang" and description containing "Grounding".
**Validates: Requirements 2.2**

### Property 5: Consensus Meter Percentage Formatting
*For any* percentage value (0-100), the formatConsensusText function SHALL return a string containing the exact percentage value and a consensus level label.
**Validates: Requirements 3.2**

### Property 6: Consensus Meter Verification Text
*For any* meta_analysis_count >= 0, the formatVerificationText function SHALL return a string in the format "Verified by {count} meta-analyses".
**Validates: Requirements 3.3**

### Property 7: Active Inquiry Avoids Generic Greetings
*For any* user context with available daily logs, the generated greeting SHALL NOT contain generic phrases ["How can I help", "What can I do for you", "Hello, how are you"].
**Validates: Requirements 4.1**

### Property 8: Active Inquiry References Data Points
*For any* user context with non-empty daily logs, the generated diagnostic question SHALL reference at least one specific data value from the logs.
**Validates: Requirements 4.2, 4.4**

### Property 9: API Error Response Format
*For any* invalid API request, the error response SHALL contain a status code >= 400 and a JSON body with an "error" field.
**Validates: Requirements 5.4**

## Error Handling

### API Layer
- **Invalid Input**: Return 400 with descriptive error message
- **Authentication Failure**: Return 401 with "Unauthorized" message
- **Rate Limiting**: Return 429 with retry-after header
- **LLM Failure**: Return fallback static insight, log error

### Frontend Layer
- **Network Error**: Display cached insight if available, show retry button
- **Streaming Failure**: Gracefully degrade to static content
- **Missing Data**: Show placeholder with "No data yet" message

### Fallback Insights
```typescript
const FALLBACK_INSIGHTS = {
  low_sleep: "Your body is in repair mode. Rest when you can.",
  low_hrv: "Your nervous system is recalibrating. This is temporary.",
  default: "Your biometrics look balanced. Stay hydrated."
};
```

## Testing Strategy

### Unit Testing
- Test pure functions: `getBioVoltageRecommendation`, `getConsensusLevel`, `formatConsensusText`, `formatVerificationText`
- Test Active Inquiry generation logic
- Test fallback insight selection

### Property-Based Testing
使用 **fast-check** 库进行属性测试。

**Configuration:**
- Minimum 100 iterations per property
- Seed-based reproducibility for debugging

**Test Annotations:**
每个属性测试必须使用以下格式注释：
```typescript
// **Feature: truth-architecture, Property {number}: {property_text}**
```

**Properties to Test:**
1. Insight reframing language validation (Property 1, 2)
2. Bio-Voltage recommendation determinism (Property 3, 4)
3. Consensus Meter formatting (Property 5, 6)
4. Active Inquiry greeting validation (Property 7, 8)
5. API error response format (Property 9)

### Integration Testing
- Test `/api/insight/generate` endpoint with various inputs
- Test streaming response handling
- Test error scenarios

### Visual Testing (Manual)
- Bio-Voltage animation smoothness
- Consensus Meter color transitions
- Mobile responsiveness
