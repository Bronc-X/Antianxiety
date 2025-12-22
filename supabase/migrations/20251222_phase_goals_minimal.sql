-- Minimal Phase Goals Setup
-- Created: 2025-12-22
-- Purpose: Create only the necessary tables for PhaseGoalsDisplay component

-- ============================================
-- 1. Phase Goals Table (Required for Settings page)
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
-- 2. Row Level Security Policies
-- ============================================
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

-- ============================================
-- 3. Updated_at Trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_phase_goals_updated_at ON phase_goals;
CREATE TRIGGER update_phase_goals_updated_at
  BEFORE UPDATE ON phase_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
