# Design Document

## Overview

每日校准系统将现有的被动监测升级为主动仪式。核心流程：定时提醒 → 极简输入 → 周数据对比 → 异常探询 → 任务生成。

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Local Push     │────▶│  Calibration     │────▶│  Anomaly        │
│  Notification   │     │  Sheet UI        │     │  Detection      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Dashboard      │◀────│  Task            │◀────│  Progressive    │
│  Update         │     │  Generation      │     │  Inquiry        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Components

1. **DailyCalibrationSheet** - 重构现有 DailyCheckin 组件
2. **WisdomCarousel** - 已存在，需微调
3. **CalibrationService** - 新建，处理数据对比和异常检测
4. **NotificationService** - 使用 @capacitor/local-notifications

## Data Models

```typescript
interface CalibrationInput {
  sleep_hours: number;      // 0-12
  stress_level: 'low' | 'medium' | 'high';
  exercise_intention: 'rest' | 'moderate' | 'challenge';
  timestamp: string;
}

interface CalibrationResult {
  input: CalibrationInput;
  anomalies: AnomalyType[];
  inquiry_response?: string;
  generated_task?: string;
}

type AnomalyType = 'sleep_deficit' | 'high_stress' | 'none';
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system.*

**Property 1: Sleep anomaly detection threshold**
*For any* calibration input where sleep_hours is more than 1.5 hours below the 7-day average, the system SHALL flag a sleep_deficit anomaly.
**Validates: Requirements 4.2**

**Property 2: Calibration data round-trip**
*For any* valid CalibrationInput object, serializing then deserializing SHALL produce an equivalent object.
**Validates: Requirements 7.4**

**Property 3: Weekly average calculation**
*For any* set of 7 daily sleep values, the calculated average SHALL equal the sum divided by count.
**Validates: Requirements 4.1**

## Testing Strategy

- Property-based tests using fast-check
- Unit tests for anomaly detection logic
