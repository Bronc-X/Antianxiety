-- Adaptive Interaction System Migration
-- Created: 2024-12-16
-- Description: Creates tables for adaptive onboarding, phase goals, daily calibration, 
--              active inquiry, and content curation

-- ============================================
-- 1. Phase Goals Table
-- ============================================
CREATE TABLE IF NOT EXISTS phase_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('sleep', 'energy', 'weight', 'stress', 'fitness')),
  priority INTEGER NOT NULL CHECK (priority IN (1, 2)),
  title TEXT NOT NULL,
  rationale TEXT NOT NULL,
  citations JSONB DEFAULT '[]'::jsonb,
  is_ai_recommended BOOLEAN DEFAULT true,
  user_modified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, priority)
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_phase_goals_user_id ON phase_goals(user_id);

-- ============================================
-- 2. Onboarding Answers Table
-- ============================================
CREATE TABLE IF NOT EXISTS onboarding_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_id TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('template', 'decision_tree')),
  question_text TEXT NOT NULL,
  answer_value TEXT NOT NULL,
  answer_label TEXT,
  sequence_order INTEGER NOT NULL,
  ai_reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user lookup and ordering
CREATE INDEX IF NOT EXISTS idx_onboarding_answers_user_id ON onboarding_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_answers_sequence ON onboarding_answers(user_id, sequence_order);

-- ============================================
-- 3. Inquiry History Table
-- ============================================
CREATE TABLE IF NOT EXISTS inquiry_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('diagnostic', 'feed_recommendation')),
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  data_gaps_addressed TEXT[] DEFAULT '{}',
  user_response TEXT,
  responded_at TIMESTAMPTZ,
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('push', 'in_app')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user lookup and pending inquiries
CREATE INDEX IF NOT EXISTS idx_inquiry_history_user_id ON inquiry_history(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_history_pending ON inquiry_history(user_id, responded_at) WHERE responded_at IS NULL;

-- ============================================
-- 4. User Activity Patterns Table
-- ============================================
CREATE TABLE IF NOT EXISTS user_activity_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  hour_of_day INTEGER NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  activity_score FLOAT DEFAULT 0 CHECK (activity_score >= 0 AND activity_score <= 1),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, day_of_week, hour_of_day)
);

-- Index for optimal timing lookup
CREATE INDEX IF NOT EXISTS idx_activity_patterns_user_time ON user_activity_patterns(user_id, day_of_week, hour_of_day);

-- ============================================
-- 5. Curated Feed Queue Table
-- ============================================
CREATE TABLE IF NOT EXISTS curated_feed_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('paper', 'article', 'tip')),
  title TEXT NOT NULL,
  summary TEXT,
  url TEXT,
  source TEXT NOT NULL,
  relevance_score FLOAT NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 1),
  matched_goals TEXT[] DEFAULT '{}',
  relevance_explanation TEXT,
  is_pushed BOOLEAN DEFAULT false,
  pushed_at TIMESTAMPTZ,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  UNIQUE(user_id, title),  -- For upsert support
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for feed queries
CREATE INDEX IF NOT EXISTS idx_curated_feed_user_id ON curated_feed_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_curated_feed_unread ON curated_feed_queue(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_curated_feed_relevance ON curated_feed_queue(user_id, relevance_score DESC);

-- ============================================
-- 6. Extend Daily Calibrations Table
-- ============================================
DO $$ 
BEGIN
  -- Add question_evolution_level column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'daily_calibrations' AND column_name = 'question_evolution_level'
  ) THEN
    ALTER TABLE daily_calibrations ADD COLUMN question_evolution_level INTEGER DEFAULT 1;
  END IF;
  
  -- Add questions_asked column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'daily_calibrations' AND column_name = 'questions_asked'
  ) THEN
    ALTER TABLE daily_calibrations ADD COLUMN questions_asked JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  -- Add phase_goal_id column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'daily_calibrations' AND column_name = 'phase_goal_id'
  ) THEN
    ALTER TABLE daily_calibrations ADD COLUMN phase_goal_id UUID REFERENCES phase_goals(id);
  END IF;
END $$;

-- ============================================
-- 7. Row Level Security Policies
-- ============================================

-- Phase Goals RLS
ALTER TABLE phase_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own phase_goals" ON phase_goals;
CREATE POLICY "Users can view own phase_goals" ON phase_goals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own phase_goals" ON phase_goals;
CREATE POLICY "Users can insert own phase_goals" ON phase_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own phase_goals" ON phase_goals;
CREATE POLICY "Users can update own phase_goals" ON phase_goals
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own phase_goals" ON phase_goals;
CREATE POLICY "Users can delete own phase_goals" ON phase_goals
  FOR DELETE USING (auth.uid() = user_id);

-- Onboarding Answers RLS
ALTER TABLE onboarding_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own onboarding_answers" ON onboarding_answers;
CREATE POLICY "Users can manage own onboarding_answers" ON onboarding_answers
  FOR ALL USING (auth.uid() = user_id);

-- Inquiry History RLS
ALTER TABLE inquiry_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own inquiry_history" ON inquiry_history;
CREATE POLICY "Users can manage own inquiry_history" ON inquiry_history
  FOR ALL USING (auth.uid() = user_id);

-- User Activity Patterns RLS
ALTER TABLE user_activity_patterns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own activity_patterns" ON user_activity_patterns;
CREATE POLICY "Users can manage own activity_patterns" ON user_activity_patterns
  FOR ALL USING (auth.uid() = user_id);

-- Curated Feed Queue RLS
ALTER TABLE curated_feed_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own curated_feed" ON curated_feed_queue;
CREATE POLICY "Users can manage own curated_feed" ON curated_feed_queue
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 8. Updated_at Trigger Function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to phase_goals
DROP TRIGGER IF EXISTS update_phase_goals_updated_at ON phase_goals;
CREATE TRIGGER update_phase_goals_updated_at
  BEFORE UPDATE ON phase_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to user_activity_patterns
DROP TRIGGER IF EXISTS update_activity_patterns_updated_at ON user_activity_patterns;
CREATE TRIGGER update_activity_patterns_updated_at
  BEFORE UPDATE ON user_activity_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. Helper Functions
-- ============================================

-- Function to get user's consecutive calibration days
CREATE OR REPLACE FUNCTION get_consecutive_calibration_days(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  consecutive_days INTEGER := 0;
  check_date DATE := CURRENT_DATE;
BEGIN
  LOOP
    IF EXISTS (
      SELECT 1 FROM daily_calibrations 
      WHERE user_id = p_user_id 
      AND DATE(created_at) = check_date
    ) THEN
      consecutive_days := consecutive_days + 1;
      check_date := check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  RETURN consecutive_days;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is inactive (7+ days)
CREATE OR REPLACE FUNCTION is_user_inactive(p_user_id UUID, p_days INTEGER DEFAULT 7)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM daily_calibrations 
    WHERE user_id = p_user_id 
    AND created_at > NOW() - (p_days || ' days')::INTERVAL
  );
END;
$$ LANGUAGE plpgsql;
