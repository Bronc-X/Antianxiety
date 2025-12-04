-- Max Logic Engine: AI Settings and Belief Sessions
-- Execute this SQL in Supabase SQL Editor

-- ============================================
-- 1. Add ai_settings JSONB column to profiles
-- ============================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS ai_settings JSONB DEFAULT '{
  "honesty_level": 90,
  "humor_level": 65,
  "mode": "TARS"
}'::jsonb;

-- Add constraint to validate ai_settings structure
ALTER TABLE profiles
ADD CONSTRAINT ai_settings_check CHECK (
  ai_settings IS NULL OR (
    (ai_settings->>'honesty_level')::int >= 60 AND 
    (ai_settings->>'honesty_level')::int <= 100 AND
    (ai_settings->>'humor_level')::int >= 0 AND 
    (ai_settings->>'humor_level')::int <= 100 AND
    ai_settings->>'mode' IN ('TARS', 'Zen Master', 'Dr. House')
  )
);

-- ============================================
-- 2. Create belief_sessions table
-- ============================================
CREATE TABLE IF NOT EXISTS belief_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prior_value INTEGER NOT NULL CHECK (prior_value >= 0 AND prior_value <= 100),
  posterior_value INTEGER NOT NULL CHECK (posterior_value >= 0 AND posterior_value <= 100),
  likelihood DECIMAL(4,3) NOT NULL CHECK (likelihood >= 0 AND likelihood <= 1),
  evidence_weight DECIMAL(3,2) NOT NULL CHECK (evidence_weight >= 0.1 AND evidence_weight <= 0.9),
  papers_used JSONB DEFAULT '[]'::jsonb,
  hrv_data JSONB,
  belief_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_belief_sessions_user_id ON belief_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_belief_sessions_created_at ON belief_sessions(created_at DESC);

-- ============================================
-- 3. Enable RLS and create policies
-- ============================================
ALTER TABLE belief_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own belief sessions
CREATE POLICY "Users can view own belief sessions"
ON belief_sessions FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own belief sessions
CREATE POLICY "Users can insert own belief sessions"
ON belief_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own belief sessions
CREATE POLICY "Users can update own belief sessions"
ON belief_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- Users can only delete their own belief sessions
CREATE POLICY "Users can delete own belief sessions"
ON belief_sessions FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 4. Grant permissions
-- ============================================
GRANT ALL ON belief_sessions TO authenticated;
