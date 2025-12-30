-- ============================================
-- Complete Database Schema Fix Migration V2
-- Fixes ALL missing columns - Skips existing tables
-- Date: 2025-12-30
-- ============================================

-- ============================================
-- 1. Fix user_plans table
-- ============================================
ALTER TABLE public.user_plans 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS target_date DATE;

-- Set plan_type default for future inserts
ALTER TABLE public.user_plans 
ALTER COLUMN plan_type SET DEFAULT 'comprehensive';

-- Update existing null plan_type values
UPDATE public.user_plans 
SET plan_type = 'comprehensive' 
WHERE plan_type IS NULL;

-- Copy title to name if name is null
UPDATE public.user_plans 
SET name = title 
WHERE name IS NULL AND title IS NOT NULL;

-- ============================================
-- 2. Fix phase_goals table (priority column)
-- ============================================
DO $$ 
BEGIN
    -- Add priority column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'phase_goals' 
        AND column_name = 'priority'
    ) THEN
        ALTER TABLE public.phase_goals ADD COLUMN priority TEXT DEFAULT 'medium';
    END IF;
EXCEPTION WHEN undefined_table THEN
    -- phase_goals table doesn't exist, skip
    NULL;
END $$;

-- ============================================
-- 3. Fix daily_wellness_logs table
-- ============================================
DO $$
BEGIN
    ALTER TABLE public.daily_wellness_logs
    ADD COLUMN IF NOT EXISTS energy_level INTEGER,
    ADD COLUMN IF NOT EXISTS anxiety_level INTEGER,
    ADD COLUMN IF NOT EXISTS sleep_quality INTEGER;
EXCEPTION WHEN undefined_table THEN
    -- Table doesn't exist, skip
    NULL;
END $$;

-- ============================================
-- 4. Fix profiles table
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Shanghai',
ADD COLUMN IF NOT EXISTS notification_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS wearable_connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS wearable_type TEXT,
ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_logs INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'zh',
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS onboarding_completed_steps JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sleep_quality_baseline INTEGER,
ADD COLUMN IF NOT EXISTS stress_level_baseline INTEGER,
ADD COLUMN IF NOT EXISTS energy_level_baseline INTEGER,
ADD COLUMN IF NOT EXISTS exercise_frequency TEXT,
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'zh';

-- ============================================
-- 5. Ensure assessment tables exist (skip if exist)
-- ============================================
CREATE TABLE IF NOT EXISTS public.assessment_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_zh TEXT,
    description TEXT,
    category TEXT DEFAULT 'general',
    question_count INTEGER DEFAULT 0,
    estimated_minutes INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assessment_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_type_id UUID REFERENCES public.assessment_types(id) ON DELETE CASCADE,
    question_order INTEGER NOT NULL,
    text TEXT NOT NULL,
    text_zh TEXT,
    type TEXT DEFAULT 'scale',
    options JSONB,
    min_value INTEGER DEFAULT 0,
    max_value INTEGER DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assessment_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_type_id UUID REFERENCES public.assessment_types(id),
    score INTEGER NOT NULL,
    max_score INTEGER DEFAULT 100,
    severity_level TEXT DEFAULT 'minimal',
    interpretation TEXT,
    interpretation_zh TEXT,
    responses JSONB,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. Ensure analysis table exists (skip if exist)
-- ============================================
CREATE TABLE IF NOT EXISTS public.analysis_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_type TEXT DEFAULT 'weekly',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    summary TEXT,
    summary_zh TEXT,
    insights JSONB DEFAULT '[]'::jsonb,
    metrics JSONB DEFAULT '{}'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. Enable RLS on new tables
-- ============================================
ALTER TABLE public.assessment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_reports ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. RLS Policies (with IF NOT EXISTS logic)
-- ============================================
DO $$
BEGIN
    -- assessment_types: anyone can view
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assessment_types' AND policyname = 'Anyone can view assessment types') THEN
        CREATE POLICY "Anyone can view assessment types" ON public.assessment_types FOR SELECT USING (true);
    END IF;
    
    -- assessment_questions: anyone can view
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assessment_questions' AND policyname = 'Anyone can view assessment questions') THEN
        CREATE POLICY "Anyone can view assessment questions" ON public.assessment_questions FOR SELECT USING (true);
    END IF;
    
    -- assessment_results: users can manage own
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assessment_results' AND policyname = 'Users can manage own results') THEN
        CREATE POLICY "Users can manage own results" ON public.assessment_results FOR ALL USING (auth.uid() = user_id);
    END IF;
    
    -- analysis_reports: users can manage own
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analysis_reports' AND policyname = 'Users can manage own reports') THEN
        CREATE POLICY "Users can manage own reports" ON public.analysis_reports FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- ============================================
-- Done! Skipped chat tables since they exist with different schema
-- ============================================
