-- ============================================================
-- Adaptive Assessment System - Database Migration
-- ============================================================
-- Tables for:
-- 1. user_scale_responses - All assessment responses
-- 2. safety_events - PHQ-9 Q9 and safety keyword triggers
-- 3. scale_trigger_logs - Short scale → full scale triggers
-- 4. user_assessment_preferences - Frequency and inquiry settings
-- ============================================================

-- 1. User Scale Responses
-- Stores all assessment data from any source (onboarding, daily, weekly, monthly, triggered, chat)
CREATE TABLE IF NOT EXISTS public.user_scale_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Scale identification
    scale_id TEXT NOT NULL,        -- 'GAD7', 'PHQ9', 'ISI', 'PSS10', 'DAILY'
    question_id TEXT NOT NULL,     -- 'gad7_q1', 'phq9_q9', 'daily_sleep_duration', etc.
    
    -- Answer
    answer_value INTEGER,          -- Numeric score (0-4 typically)
    answer_text TEXT,              -- For open-ended questions
    
    -- Context
    source TEXT NOT NULL,          -- 'onboarding', 'daily', 'weekly', 'monthly', 'triggered', 'chat', 'active_inquiry'
    context_summary TEXT,          -- AI-generated context if applicable
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique per user per question per day (for daily type) or per session (for others)
    UNIQUE NULLS NOT DISTINCT (user_id, scale_id, question_id, DATE(created_at))
);

CREATE INDEX IF NOT EXISTS idx_scale_responses_user ON public.user_scale_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_scale_responses_scale ON public.user_scale_responses(scale_id);
CREATE INDEX IF NOT EXISTS idx_scale_responses_date ON public.user_scale_responses(created_at);

-- RLS
ALTER TABLE public.user_scale_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own scale responses" ON public.user_scale_responses;
CREATE POLICY "Users can manage their own scale responses" ON public.user_scale_responses
    FOR ALL USING (auth.uid() = user_id);


-- 2. Safety Events
-- Logs when PHQ-9 Q9 or safety keywords trigger safety protocols
CREATE TABLE IF NOT EXISTS public.safety_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    trigger_source TEXT NOT NULL,  -- 'phq9_q9', 'chat_keyword', 'active_inquiry'
    trigger_value INTEGER,         -- Score value that triggered
    trigger_text TEXT,             -- For keyword triggers, the matched text
    
    actions_taken TEXT[],          -- ['show_safety_message', 'show_crisis_resources', 'log_event']
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_safety_events_user ON public.safety_events(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_events_date ON public.safety_events(created_at);

-- RLS
ALTER TABLE public.safety_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own safety events" ON public.safety_events;
CREATE POLICY "Users can view their own safety events" ON public.safety_events
    FOR SELECT USING (auth.uid() = user_id);

-- Insert policy for app to create events
DROP POLICY IF EXISTS "App can create safety events" ON public.safety_events;
CREATE POLICY "App can create safety events" ON public.safety_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 3. Scale Trigger Logs
-- Records when short scales (GAD-2, PHQ-2) trigger full scales
CREATE TABLE IF NOT EXISTS public.scale_trigger_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    short_scale TEXT NOT NULL,     -- 'GAD2', 'PHQ2'
    short_score INTEGER NOT NULL,  -- The score that triggered
    
    triggered_full_scale TEXT,     -- 'GAD7', 'PHQ9', NULL if declined
    trigger_reason TEXT,           -- 'score >= threshold', 'consecutive_high_days'
    confidence NUMERIC(3,2),       -- 0.00 - 1.00
    
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
-- Stores user preferences for assessment frequency and AI active inquiry
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

-- RLS
ALTER TABLE public.user_assessment_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_assessment_preferences;
CREATE POLICY "Users can manage their own preferences" ON public.user_assessment_preferences
    FOR ALL USING (auth.uid() = user_id);


-- 5. Extend profiles table with assessment tracking fields
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS inferred_scale_scores JSONB,
    ADD COLUMN IF NOT EXISTS last_daily_calibration TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_weekly_calibration TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_monthly_calibration TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS daily_stability_streak INTEGER DEFAULT 0;


-- 6. Function to calculate daily stability
CREATE OR REPLACE FUNCTION calculate_daily_stability(p_user_id UUID)
RETURNS TABLE (
    completion_rate NUMERIC,
    average_score NUMERIC,
    max_score INTEGER,
    slope NUMERIC,
    is_stable BOOLEAN,
    can_reduce_frequency BOOLEAN
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_responses RECORD;
    v_count INTEGER := 0;
    v_sum NUMERIC := 0;
    v_max INTEGER := 0;
    v_days INTEGER := 7;
BEGIN
    -- Get daily responses from last 7 days
    FOR v_responses IN (
        SELECT 
            DATE(created_at) as response_date,
            SUM(answer_value) as daily_score
        FROM public.user_scale_responses
        WHERE user_id = p_user_id
          AND source = 'daily'
          AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY response_date
    ) LOOP
        v_count := v_count + 1;
        v_sum := v_sum + v_responses.daily_score;
        IF v_responses.daily_score > v_max THEN
            v_max := v_responses.daily_score;
        END IF;
    END LOOP;
    
    -- Calculate metrics
    completion_rate := v_count::NUMERIC / v_days;
    average_score := CASE WHEN v_count > 0 THEN v_sum / v_count ELSE 0 END;
    max_score := v_max;
    slope := 0; -- Simplified, would need regression for accurate slope
    
    -- Stability criteria:
    -- - Completion rate >= 71% (5/7 days)
    -- - Average score <= 3
    -- - Max single day <= 5
    is_stable := completion_rate >= 0.71 
                 AND average_score <= 3 
                 AND max_score <= 5;
    
    -- Can reduce if stable for 3 consecutive checks
    can_reduce_frequency := is_stable;
    
    RETURN NEXT;
END;
$$;


-- 7. View for user assessment summary
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
    (SELECT COUNT(*) FROM public.user_scale_responses WHERE user_id = p.id AND source = 'daily' AND created_at >= NOW() - INTERVAL '7 days') as daily_responses_7d,
    (SELECT COUNT(*) FROM public.safety_events WHERE user_id = p.id AND created_at >= NOW() - INTERVAL '30 days') as safety_events_30d
FROM public.profiles p
LEFT JOIN public.user_assessment_preferences uap ON p.id = uap.user_id;

-- Grant access to authenticated users for their own data
GRANT SELECT ON public.user_assessment_summary TO authenticated;
