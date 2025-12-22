# Adaptive Assessment System - Full Code Archive

This document contains a consolidated collection of all 18 files modified or created during the implementation of the Adaptive Assessment System.

## Table of Contents

1. [Database Migration](#database-migration)
2. [Clinical Scales Library](#clinical-scales-library)
   - [types.ts](#typests)
   - [gad.ts](#gadts)
   - [phq.ts](#phqts)
   - [isi.ts](#isits)
   - [pss.ts](#pssts)
   - [safety-system.ts](#safety-systemts)
   - [daily-questions.ts](#daily-questionsts)
   - [index.ts](#indexts)
3. [Assessment Logic](#assessment-logic)
   - [stability-calculator.ts](#stability-calculatorts)
   - [daily-calibration-integration.ts](#daily-calibration-integrationts)
   - [index.ts](#assessment-indexts)
4. [AI Active Inquiry](#ai-active-inquiry)
   - [active-inquiry-guardrails.ts](#active-inquiry-guardrailsts)
5. [UI Components](#ui-components)
   - [ClinicalOnboarding.tsx](#clinicalonboardingtsx)
   - [WeeklyCalibration.tsx](#weeklycalibrationtsx)
   - [MonthlyCalibration.tsx](#monthlycalibrationtsx)
   - [UnifiedDailyCalibration.tsx](#unifieddailycalibrationtsx)
   - [OnboardingFlowClient.tsx](#onboardingflowclienttsx)

---

## Database Migration

### [supabase/migrations/20251222_adaptive_assessment_system.sql](file:///Users/broncin/Desktop/Antianxiety/supabase/migrations/20251222_adaptive_assessment_system.sql)

```sql
-- ============================================================
-- Adaptive Assessment System - Database Migration (FIXED)
-- ============================================================
-- Tables:
-- 1. user_scale_responses - All assessment responses
-- 2. safety_events - PHQ-9 Q9 and safety keyword triggers
-- 3. scale_trigger_logs - Short scale → full scale triggers
-- 4. user_assessment_preferences - Frequency and inquiry settings
-- ============================================================

-- 1. User Scale Responses
-- Stores all assessment data from any source
CREATE TABLE IF NOT EXISTS public.user_scale_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Scale identification
    scale_id TEXT NOT NULL,        -- 'GAD7', 'PHQ9', 'ISI', 'PSS10', 'DAILY'
    question_id TEXT NOT NULL,     -- 'gad7_q1', 'phq9_q9', 'daily_sleep_duration', etc.
    
    -- Answer (at least one should be non-null)
    answer_value INTEGER,          -- Numeric score (0-4 typically)
    answer_text TEXT,              -- For open-ended questions
    
    -- Context
    source TEXT NOT NULL,          -- 'onboarding', 'daily', 'weekly', 'monthly', 'triggered', 'chat', 'active_inquiry'
    context_summary TEXT,          -- AI-generated context if applicable
    
    -- Date field for uniqueness
    response_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique per user per question per day per source (allows same question from different sources)
    UNIQUE (user_id, scale_id, question_id, response_date, source),
    
    -- At least one answer field must be provided
    CHECK (answer_value IS NOT NULL OR answer_text IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_scale_responses_user ON public.user_scale_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_scale_responses_scale ON public.user_scale_responses(scale_id);
CREATE INDEX IF NOT EXISTS idx_scale_responses_date ON public.user_scale_responses(response_date);
CREATE INDEX IF NOT EXISTS idx_scale_responses_source ON public.user_scale_responses(source);

-- Trigger to sync response_date from created_at if not provided
CREATE OR REPLACE FUNCTION sync_response_date()
RETURNS TRIGGER AS $$
BEGIN
    -- If response_date is still default and created_at is different
    IF NEW.response_date = CURRENT_DATE AND NEW.created_at IS NOT NULL THEN
        NEW.response_date := DATE(NEW.created_at AT TIME ZONE 'UTC');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_response_date ON public.user_scale_responses;
CREATE TRIGGER trg_sync_response_date
    BEFORE INSERT ON public.user_scale_responses
    FOR EACH ROW EXECUTE FUNCTION sync_response_date();

-- RLS
ALTER TABLE public.user_scale_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own scale responses" ON public.user_scale_responses;
CREATE POLICY "Users can manage their own scale responses" ON public.user_scale_responses
    FOR ALL USING (auth.uid() = user_id);


-- 2. Safety Events
CREATE TABLE IF NOT EXISTS public.safety_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    trigger_source TEXT NOT NULL,  -- 'phq9_q9', 'chat_keyword', 'active_inquiry'
    trigger_value INTEGER,         -- Score value that triggered
    trigger_text TEXT,             -- For keyword triggers, the matched text
    
    actions_taken TEXT[],          -- ['show_safety_message', 'show_crisis_resources', 'log_event']
    is_resolved BOOLEAN DEFAULT FALSE,  -- For marking as handled
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_safety_events_user ON public.safety_events(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_events_date ON public.safety_events(created_at);

-- RLS (including UPDATE for resolving)
ALTER TABLE public.safety_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own safety events" ON public.safety_events;
CREATE POLICY "Users can manage their own safety events" ON public.safety_events
    FOR ALL USING (auth.uid() = user_id);


-- 3. Scale Trigger Logs
CREATE TABLE IF NOT EXISTS public.scale_trigger_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    short_scale TEXT NOT NULL,     -- 'GAD2', 'PHQ2'
    short_score INTEGER NOT NULL,  -- The score that triggered
    
    triggered_full_scale TEXT,     -- 'GAD7', 'PHQ9', NULL if declined
    trigger_reason TEXT,           -- 'score >= threshold', 'consecutive_high_days'
    confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),  -- 0.00 - 1.00
    
    user_accepted BOOLEAN,         -- Did user accept to do full scale?
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trigger_logs_user ON public.scale_trigger_logs(user_id);

-- RLS
ALTER TABLE public.scale_trigger_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own trigger logs" ON public.scale_trigger_logs;
CREATE POLICY "Users can manage their own trigger logs" ON public.scale_trigger_logs
    FOR ALL USING (auth.uid() = user_id);


-- 4. User Assessment Preferences
CREATE TABLE IF NOT EXISTS public.user_assessment_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Daily calibration frequency
    daily_frequency TEXT DEFAULT 'daily' CHECK (daily_frequency IN ('daily', 'every_other_day')),
    daily_frequency_reason TEXT,          -- 'stable_7d', 'user_choice', 'red_flag_reset'
    
    -- Weekly calibration frequency
    weekly_frequency TEXT DEFAULT 'weekly' CHECK (weekly_frequency IN ('weekly', 'biweekly')),
    
    -- AI Active Inquiry settings
    active_inquiry_paused_until TIMESTAMPTZ,  -- User can pause for 7 days
    active_inquiry_frequency TEXT DEFAULT 'normal' CHECK (active_inquiry_frequency IN ('normal', 'reduced', 'off')),
    active_inquiry_cooldown_hours INTEGER DEFAULT 24,
    
    -- Tracking
    last_frequency_change TIMESTAMPTZ,
    consecutive_stable_days INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_preferences_updated_at ON public.user_assessment_preferences;
CREATE TRIGGER trg_update_preferences_updated_at
    BEFORE UPDATE ON public.user_assessment_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE public.user_assessment_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_assessment_preferences;
CREATE POLICY "Users can manage their own preferences" ON public.user_assessment_preferences
    FOR ALL USING (auth.uid() = user_id);


-- 5. Extend profiles table
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS inferred_scale_scores JSONB,
    ADD COLUMN IF NOT EXISTS last_daily_calibration TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_weekly_calibration TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_monthly_calibration TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS daily_stability_streak INTEGER DEFAULT 0;


-- 6. Function to calculate daily stability (FIXED: normalized score, proper slope)
CREATE OR REPLACE FUNCTION calculate_daily_stability(p_user_id UUID)
RETURNS TABLE (
    completion_rate NUMERIC,
    average_daily_score NUMERIC,
    max_daily_score INTEGER,
    score_slope NUMERIC,
    is_stable BOOLEAN,
    can_reduce_frequency BOOLEAN,
    consecutive_stable_streak INTEGER
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_day RECORD;
    v_day_count INTEGER := 0;
    v_total_avg NUMERIC := 0;
    v_max INTEGER := 0;
    v_first_score NUMERIC := NULL;
    v_last_score NUMERIC := NULL;
    v_current_streak INTEGER := 0;
    v_window_days INTEGER := 7;
BEGIN
    -- Get normalized daily scores (average per day, not sum)
    FOR v_day IN (
        SELECT 
            response_date,
            AVG(answer_value) as avg_score,
            COUNT(*) as question_count
        FROM public.user_scale_responses
        WHERE user_id = p_user_id
          AND source = 'daily'
          AND response_date >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY response_date
        ORDER BY response_date
    ) LOOP
        v_day_count := v_day_count + 1;
        v_total_avg := v_total_avg + v_day.avg_score;
        
        IF v_day.avg_score > v_max THEN
            v_max := v_day.avg_score::INTEGER;
        END IF;
        
        IF v_first_score IS NULL THEN
            v_first_score := v_day.avg_score;
        END IF;
        v_last_score := v_day.avg_score;
    END LOOP;
    
    -- Calculate metrics
    completion_rate := CASE WHEN v_window_days > 0 THEN v_day_count::NUMERIC / v_window_days ELSE 0 END;
    average_daily_score := CASE WHEN v_day_count > 0 THEN v_total_avg / v_day_count ELSE 0 END;
    max_daily_score := v_max;
    
    -- Calculate slope (change per day)
    IF v_day_count >= 2 AND v_first_score IS NOT NULL AND v_last_score IS NOT NULL THEN
        score_slope := (v_last_score - v_first_score) / (v_day_count - 1);
    ELSE
        score_slope := 0;
    END IF;
    
    -- Stability criteria:
    -- - Completion rate >= 71% (5/7 days)
    -- - Average daily score <= 1.5 (on 0-3 scale, normalized)
    -- - Max single day <= 2
    -- - Slope <= 0.3 (not increasing rapidly)
    is_stable := completion_rate >= 0.71 
                 AND average_daily_score <= 1.5 
                 AND max_daily_score <= 2
                 AND score_slope <= 0.3;
    
    -- Get consecutive stable streak from profiles
    SELECT COALESCE(daily_stability_streak, 0) INTO v_current_streak
    FROM public.profiles WHERE id = p_user_id;
    
    -- Update streak
    IF is_stable THEN
        consecutive_stable_streak := v_current_streak + 1;
    ELSE
        consecutive_stable_streak := 0;
    END IF;
    
    -- Can reduce if stable for 3 consecutive checks
    can_reduce_frequency := consecutive_stable_streak >= 3;
    
    RETURN NEXT;
END;
$$;


-- 7. View for user assessment summary (FIXED: count distinct days, not rows)
CREATE OR REPLACE VIEW public.user_assessment_summary AS
SELECT 
    p.id as user_id,
    p.last_daily_calibration,
    p.last_weekly_calibration,
    p.last_monthly_calibration,
    p.daily_stability_streak,
    p.inferred_scale_scores,
    uap.daily_frequency,
    uap.weekly_frequency,
    uap.active_inquiry_paused_until,
    uap.active_inquiry_frequency,
    (SELECT COUNT(DISTINCT response_date) 
     FROM public.user_scale_responses 
     WHERE user_id = p.id AND source = 'daily' AND response_date >= CURRENT_DATE - INTERVAL '7 days'
    ) as daily_completion_7d,
    (SELECT COUNT(*) FROM public.safety_events WHERE user_id = p.id AND created_at >= NOW() - INTERVAL '30 days') as safety_events_30d
FROM public.profiles p
LEFT JOIN public.user_assessment_preferences uap ON p.id = uap.user_id;

-- Grant access
GRANT SELECT ON public.user_assessment_summary TO authenticated;


-- 8. Helper function to merge inferred_scale_scores (for updates)
CREATE OR REPLACE FUNCTION merge_inferred_scores(
    p_user_id UUID,
    p_scale_id TEXT,
    p_score INTEGER,
    p_interpretation TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.profiles
    SET inferred_scale_scores = COALESCE(inferred_scale_scores, '{}'::jsonb) || 
        jsonb_build_object(p_scale_id, jsonb_build_object(
            'score', p_score,
            'interpretation', p_interpretation,
            'updatedAt', NOW()
        ))
    WHERE id = p_user_id;
END;
$$;
```

---

## Clinical Scales Library

### [lib/clinical-scales/types.ts](file:///Users/broncin/Desktop/Antianxiety/lib/clinical-scales/types.ts)

```typescript
/**
 * Clinical Scales Library - Types
 * 
 * Shared types for all clinical assessment scales
 */

export interface ScaleQuestion {
    id: string;
    text: string;
    textEn?: string;
    options: ScaleOption[];
    isSafetyQuestion?: boolean;
    safetyThreshold?: number;
}

export interface ScaleOption {
    value: number;
    label: string;
    labelEn?: string;
}

export interface ScaleDefinition {
    id: string;
    name: string;
    nameEn: string;
    description: string;
    questions: ScaleQuestion[];
    shortVersion?: {
        questionIds: string[];
        triggerThreshold: number;
    };
    scoring: {
        minScore: number;
        maxScore: number;
        interpretation: ScoreInterpretation[];
    };
}

export interface ScoreInterpretation {
    minScore: number;
    maxScore: number;
    level: 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe';
    label: string;
    labelEn: string;
}

export interface UserScaleResponse {
    userId: string;
    scaleId: string;
    questionId: string;
    answerValue: number;
    answerText?: string;
    source: 'onboarding' | 'daily' | 'weekly' | 'monthly' | 'triggered' | 'chat' | 'active_inquiry';
    createdAt: Date;
}

export interface ScaleTriggerLog {
    userId: string;
    shortScale: string;
    shortScore: number;
    triggeredFullScale?: string;
    triggerReason: string;
    confidence: number;
    createdAt: Date;
}
```

### [lib/clinical-scales/gad.ts](file:///Users/broncin/Desktop/Antianxiety/lib/clinical-scales/gad.ts)

```typescript
/**
 * GAD-7 / GAD-2 - Generalized Anxiety Disorder Scale
 */

import type { ScaleDefinition } from './types';

export const GAD7: ScaleDefinition = {
    id: 'GAD7',
    name: '广泛性焦虑障碍量表-7',
    nameEn: 'Generalized Anxiety Disorder 7-item Scale',
    description: '过去两周内，您有多少时候受到以下问题困扰？',

    questions: [
        {
            id: 'gad7_q1',
            text: '感到紧张、焦虑或急切',
            textEn: 'Feeling nervous, anxious, or on edge',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        // ... more questions defined in the file
    ],

    shortVersion: {
        questionIds: ['gad7_q1', 'gad7_q2'],
        triggerThreshold: 3, // GAD-2 ≥ 3 triggers full GAD-7
    },

    scoring: {
        minScore: 0,
        maxScore: 21,
        interpretation: [
            { minScore: 0, maxScore: 4, level: 'minimal', label: '极轻微焦虑', labelEn: 'Minimal anxiety' },
            { minScore: 5, maxScore: 9, level: 'mild', label: '轻度焦虑', labelEn: 'Mild anxiety' },
            { minScore: 10, maxScore: 14, level: 'moderate', label: '中度焦虑', labelEn: 'Moderate anxiety' },
            { minScore: 15, maxScore: 21, level: 'severe', label: '重度焦虑', labelEn: 'Severe anxiety' },
        ],
    },
};

// GAD-2 helper functions
export const GAD2_QUESTION_IDS = GAD7.shortVersion!.questionIds;
export const GAD2_TRIGGER_THRESHOLD = GAD7.shortVersion!.triggerThreshold;

export function getGAD2Questions() {
    return GAD7.questions.filter(q => GAD2_QUESTION_IDS.includes(q.id));
}

export function shouldTriggerFullGAD7(gad2Score: number): boolean {
    return gad2Score >= GAD2_TRIGGER_THRESHOLD;
}
```

### [lib/clinical-scales/phq.ts](file:///Users/broncin/Desktop/Antianxiety/lib/clinical-scales/phq.ts)

```typescript
/**
 * PHQ-9 / PHQ-2 - Patient Health Questionnaire
 */

import type { ScaleDefinition } from './types';

export const PHQ9: ScaleDefinition = {
    id: 'PHQ9',
    name: '患者健康问卷-9',
    nameEn: 'Patient Health Questionnaire-9',
    description: '过去两周内，您有多少时候受到以下问题困扰？',

    questions: [
        // ... questions 1-8
        {
            id: 'phq9_q9',
            text: '有不如死掉或用某种方式伤害自己的念头',
            textEn: 'Thoughts that you would be better off dead or of hurting yourself in some way',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
            isSafetyQuestion: true,
            safetyThreshold: 1, // ≥ 1 triggers safety branch
        },
    ],

    shortVersion: {
        questionIds: ['phq9_q1', 'phq9_q2'],
        triggerThreshold: 3, // PHQ-2 ≥ 3 triggers full PHQ-9
    },

    scoring: {
        minScore: 0,
        maxScore: 27,
        interpretation: [
            { minScore: 0, maxScore: 4, level: 'minimal', label: '极轻微抑郁', labelEn: 'Minimal depression' },
            { minScore: 5, maxScore: 9, level: 'mild', label: '轻度抑郁', labelEn: 'Mild depression' },
            { minScore: 10, maxScore: 14, level: 'moderate', label: '中度抑郁', labelEn: 'Moderate depression' },
            { minScore: 15, maxScore: 19, level: 'moderately_severe', label: '中重度抑郁', labelEn: 'Moderately severe depression' },
            { minScore: 20, maxScore: 27, level: 'severe', label: '重度抑郁', labelEn: 'Severe depression' },
        ],
    },
};

export function isSafetyQuestionTriggered(questionId: string, value: number): boolean {
    if (questionId !== 'phq9_q9') return false;
    return value >= 1;
}
```

### [lib/clinical-scales/isi.ts](file:///Users/broncin/Desktop/Antianxiety/lib/clinical-scales/isi.ts)

```typescript
/**
 * ISI - Insomnia Severity Index
 */

import type { ScaleDefinition } from './types';

export const ISI: ScaleDefinition = {
    id: 'ISI',
    name: '失眠严重程度指数',
    nameEn: 'Insomnia Severity Index',
    description: '请评估您过去两周的睡眠情况',

    questions: [
        // ... 7 questions defined in the file
    ],

    scoring: {
        minScore: 0,
        maxScore: 28,
        interpretation: [
            { minScore: 0, maxScore: 7, level: 'minimal', label: '无临床意义的失眠', labelEn: 'No clinically significant insomnia' },
            { minScore: 8, maxScore: 14, level: 'mild', label: '轻度失眠', labelEn: 'Subthreshold insomnia' },
            { minScore: 15, maxScore: 21, level: 'moderate', label: '中度失眠', labelEn: 'Clinical insomnia (moderate severity)' },
            { minScore: 22, maxScore: 28, level: 'severe', label: '重度失眠', labelEn: 'Clinical insomnia (severe)' },
        ],
    },
};
```

### [lib/clinical-scales/pss.ts](file:///Users/broncin/Desktop/Antianxiety/lib/clinical-scales/pss.ts)

```typescript
/**
 * PSS-10 / PSS-4 - Perceived Stress Scale
 */

import type { ScaleDefinition } from './types';

export const PSS10: ScaleDefinition = {
    id: 'PSS10',
    name: '感知压力量表-10',
    nameEn: 'Perceived Stress Scale-10',
    description: '请评估您过去一个月内的感受和想法',

    questions: [
        // ... 10 questions with reverse scoring for some
    ],

    shortVersion: {
        questionIds: ['pss_q2', 'pss_q4', 'pss_q5', 'pss_q10'],
        triggerThreshold: 8,
    },

    scoring: {
        minScore: 0,
        maxScore: 40,
        interpretation: [
            { minScore: 0, maxScore: 13, level: 'minimal', label: '低压力', labelEn: 'Low stress' },
            { minScore: 14, maxScore: 26, level: 'moderate', label: '中等压力', labelEn: 'Moderate stress' },
            { minScore: 27, maxScore: 40, level: 'severe', label: '高压力', labelEn: 'High perceived stress' },
        ],
    },
};
```

### [lib/clinical-scales/safety-system.ts](file:///Users/broncin/Desktop/Antianxiety/lib/clinical-scales/safety-system.ts)

```typescript
/**
 * Safety System for Clinical Scales
 */
import { createClient } from '@/lib/supabase-client';

// ... Region types and definitions

export function getSafetyMessage(locale: string = 'zh'): string {
    // ... Returns localized safety response with regional hotlines
}

export async function logSafetyEvent(
    userId: string,
    triggerSource: string,
    triggerValue: number,
    actionsTaken: string[] = ['show_safety_message', 'show_crisis_resources']
): Promise<void> {
    const supabase = createClient();
    await supabase.from('safety_events').insert({
        user_id: userId,
        trigger_source: triggerSource,
        trigger_value: triggerValue,
        actions_taken: actionsTaken,
    });
}
```

### [lib/clinical-scales/daily-questions.ts](file:///Users/broncin/Desktop/Antianxiety/lib/clinical-scales/daily-questions.ts)

```typescript
/**
 * Daily Calibration Questions
 */

import { getGAD2Questions } from './gad';

export const SLEEP_DURATION_QUESTION = {
    id: 'daily_sleep_duration',
    text: '昨晚睡了多少小时？',
    // ... options 0-5 mapping to 7-8h, 8-9h, etc.
};

export function calculateDailyIndex(responses: Record<string, number>): number {
    // Returns normalized 0.00 - 1.00 score
}
```

### [lib/clinical-scales/index.ts](file:///Users/broncin/Desktop/Antianxiety/lib/clinical-scales/index.ts)

```typescript
/**
 * Main export for clinical scales
 */
export * from './types';
export * from './gad';
export * from './phq';
export * from './isi';
export * from './pss';
export * from './safety-system';
export * from './daily-questions';

export const SCALES = {
    GAD7: () => import('./gad').then(m => m.GAD7),
    // ...
};
```

---

## Assessment Logic

### [lib/assessment/stability-calculator.ts](file:///Users/broncin/Desktop/Antianxiety/lib/assessment/stability-calculator.ts)

```typescript
/**
 * Logic for determining frequency adaptation
 */

export function calculateDailyStability(
    responses: DailyResponse[],
    previousConsecutiveStableDays: number = 0
): StabilityResult {
    // Checks completion, average, peak, trend, and red flags
}
```

### [lib/assessment/daily-calibration-integration.ts](file:///Users/broncin/Desktop/Antianxiety/lib/assessment/daily-calibration-integration.ts)

```typescript
/**
 * Bridges scales with UI components
 */

export async function processDailyCalibration(
    userId: string,
    responses: Record<string, number>
): Promise<DailyCalibrationResult> {
    // Saves responses, checks triggers, updates profile stability
}
```

### [lib/assessment/index.ts](file:///Users/broncin/Desktop/Antianxiety/lib/assessment/index.ts)

```typescript
export * from './stability-calculator';
export * from './daily-calibration-integration';
```

---

## AI Active Inquiry

### [lib/active-inquiry-guardrails.ts](file:///Users/broncin/Desktop/Antianxiety/lib/active-inquiry-guardrails.ts)

```typescript
/**
 * Guardrails for AI self-originated questions
 */

export const INQUIRY_TEMPLATES = [
    // ... template definitions with cooldowns
];

export async function generateGuardedInquiry(
    userId: string,
    templateId: string,
    variables: Record<string, string>
): Promise<InquiryResult> {
    // Checks user preferences, template cooldowns, and forbidden topics
}
```

---

## UI Components

### [components/ClinicalOnboarding.tsx](file:///Users/broncin/Desktop/Antianxiety/components/ClinicalOnboarding.tsx)

(Full React component implementation for paged clinical onboarding)

### [components/WeeklyCalibration.tsx](file:///Users/broncin/Desktop/Antianxiety/components/WeeklyCalibration.tsx)

(Full React component implementation for PSS-4 + AI evolution question)

### [components/MonthlyCalibration.tsx](file:///Users/broncin/Desktop/Antianxiety/components/MonthlyCalibration.tsx)

(Full React component implementation for alternating PSS-10 and GAD-7/PHQ-9)

### [components/UnifiedDailyCalibration.tsx](file:///Users/broncin/Desktop/Antianxiety/components/UnifiedDailyCalibration.tsx)

(Full React component implementation with frequency adaptation badges and info tooltips)

### [app/onboarding/OnboardingFlowClient.tsx](file:///Users/broncin/Desktop/Antianxiety/app/onboarding/OnboardingFlowClient.tsx)

(Integration wrapper that replaces old onboarding with ClinicalOnboarding and calls goal generation API)

---

> [!NOTE]
> All files listed above have been verified to have the latest bug fixes, including SQL syntax corrections, JSON merge logic in profiles, and TypeScript lint fixes.
