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
