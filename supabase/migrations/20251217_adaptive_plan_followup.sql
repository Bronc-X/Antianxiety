-- Adaptive Plan Follow-up System Migration
-- 动态计划适应系统数据库迁移
-- Created: 2025-12-17

-- ============================================
-- 1. Follow-up Sessions Table (问询会话表)
-- ============================================
CREATE TABLE IF NOT EXISTS follow_up_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES user_plans(id) ON DELETE CASCADE NOT NULL,
  session_type TEXT CHECK (session_type IN ('morning', 'evening')) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'missed')) NOT NULL,
  responses JSONB DEFAULT '[]'::jsonb,
  sentiment_score DECIMAL(3,2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_follow_up_sessions_user_id ON follow_up_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_sessions_plan_id ON follow_up_sessions(plan_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_sessions_status ON follow_up_sessions(status);
CREATE INDEX IF NOT EXISTS idx_follow_up_sessions_scheduled_at ON follow_up_sessions(scheduled_at);

-- ============================================
-- 2. Plan Action Items Table (行动项表)
-- ============================================
CREATE TABLE IF NOT EXISTS plan_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES user_plans(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  timing TEXT,
  duration TEXT,
  steps JSONB DEFAULT '[]'::jsonb,
  expected_outcome TEXT,
  scientific_rationale JSONB,
  item_order INTEGER DEFAULT 0,
  is_established BOOLEAN DEFAULT FALSE,
  replacement_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_plan_action_items_plan_id ON plan_action_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_action_items_order ON plan_action_items(item_order);

-- ============================================
-- 3. Execution Tracking Table (执行追踪表)
-- ============================================
CREATE TABLE IF NOT EXISTS execution_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_item_id UUID REFERENCES plan_action_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  execution_date DATE NOT NULL,
  status TEXT CHECK (status IN ('completed', 'partial', 'skipped', 'replaced')) NOT NULL,
  needs_replacement BOOLEAN DEFAULT FALSE,
  user_notes TEXT,
  replacement_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_execution_tracking_action_item_id ON execution_tracking(action_item_id);
CREATE INDEX IF NOT EXISTS idx_execution_tracking_user_id ON execution_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_execution_tracking_date ON execution_tracking(execution_date);
CREATE INDEX IF NOT EXISTS idx_execution_tracking_status ON execution_tracking(status);

-- Unique constraint to prevent duplicate entries for same action item on same day
CREATE UNIQUE INDEX IF NOT EXISTS idx_execution_tracking_unique_daily 
  ON execution_tracking(action_item_id, execution_date);

-- ============================================
-- 4. Plan Evolution History Table (计划演化历史表)
-- ============================================
CREATE TABLE IF NOT EXISTS plan_evolution_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES user_plans(id) ON DELETE CASCADE NOT NULL,
  version INTEGER NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  change_type TEXT CHECK (change_type IN ('replacement', 'addition', 'removal', 'modification')) NOT NULL,
  original_item JSONB,
  new_item JSONB,
  reason TEXT,
  user_initiated BOOLEAN DEFAULT TRUE,
  understanding_score_at_change DECIMAL(5,2)
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_plan_evolution_history_plan_id ON plan_evolution_history(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_evolution_history_version ON plan_evolution_history(version);
CREATE INDEX IF NOT EXISTS idx_plan_evolution_history_changed_at ON plan_evolution_history(changed_at);

-- ============================================
-- 5. User Understanding Scores Table (用户理解度评分表)
-- ============================================
CREATE TABLE IF NOT EXISTS user_understanding_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  current_score DECIMAL(5,2) DEFAULT 0 CHECK (current_score >= 0 AND current_score <= 100),
  completion_prediction_accuracy DECIMAL(5,2) DEFAULT 0 CHECK (completion_prediction_accuracy >= 0 AND completion_prediction_accuracy <= 100),
  replacement_acceptance_rate DECIMAL(5,2) DEFAULT 0 CHECK (replacement_acceptance_rate >= 0 AND replacement_acceptance_rate <= 100),
  sentiment_prediction_accuracy DECIMAL(5,2) DEFAULT 0 CHECK (sentiment_prediction_accuracy >= 0 AND sentiment_prediction_accuracy <= 100),
  preference_pattern_match DECIMAL(5,2) DEFAULT 0 CHECK (preference_pattern_match >= 0 AND preference_pattern_match <= 100),
  is_deep_understanding BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_understanding_scores_user_id ON user_understanding_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_understanding_scores_deep ON user_understanding_scores(is_deep_understanding);

-- ============================================
-- 6. User Preference Profiles Table (用户偏好档案表)
-- ============================================
CREATE TABLE IF NOT EXISTS user_preference_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  preferred_times JSONB DEFAULT '[]'::jsonb,
  avoided_activities JSONB DEFAULT '[]'::jsonb,
  successful_patterns JSONB DEFAULT '[]'::jsonb,
  physical_constraints JSONB DEFAULT '[]'::jsonb,
  lifestyle_factors JSONB DEFAULT '[]'::jsonb,
  learning_history JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_preference_profiles_user_id ON user_preference_profiles(user_id);


-- ============================================
-- 7. Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE follow_up_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_evolution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_understanding_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preference_profiles ENABLE ROW LEVEL SECURITY;

-- Follow-up Sessions: Users can only access their own sessions
CREATE POLICY "Users can view own follow_up_sessions" ON follow_up_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own follow_up_sessions" ON follow_up_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own follow_up_sessions" ON follow_up_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own follow_up_sessions" ON follow_up_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Plan Action Items: Users can access items from their own plans
CREATE POLICY "Users can view own plan_action_items" ON plan_action_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_plans 
      WHERE user_plans.id = plan_action_items.plan_id 
      AND user_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own plan_action_items" ON plan_action_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_plans 
      WHERE user_plans.id = plan_action_items.plan_id 
      AND user_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own plan_action_items" ON plan_action_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_plans 
      WHERE user_plans.id = plan_action_items.plan_id 
      AND user_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own plan_action_items" ON plan_action_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_plans 
      WHERE user_plans.id = plan_action_items.plan_id 
      AND user_plans.user_id = auth.uid()
    )
  );

-- Execution Tracking: Users can only access their own tracking data
CREATE POLICY "Users can view own execution_tracking" ON execution_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own execution_tracking" ON execution_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own execution_tracking" ON execution_tracking
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own execution_tracking" ON execution_tracking
  FOR DELETE USING (auth.uid() = user_id);

-- Plan Evolution History: Users can access history from their own plans
CREATE POLICY "Users can view own plan_evolution_history" ON plan_evolution_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_plans 
      WHERE user_plans.id = plan_evolution_history.plan_id 
      AND user_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own plan_evolution_history" ON plan_evolution_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_plans 
      WHERE user_plans.id = plan_evolution_history.plan_id 
      AND user_plans.user_id = auth.uid()
    )
  );

-- User Understanding Scores: Users can only access their own scores
CREATE POLICY "Users can view own user_understanding_scores" ON user_understanding_scores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user_understanding_scores" ON user_understanding_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user_understanding_scores" ON user_understanding_scores
  FOR UPDATE USING (auth.uid() = user_id);

-- User Preference Profiles: Users can only access their own profiles
CREATE POLICY "Users can view own user_preference_profiles" ON user_preference_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user_preference_profiles" ON user_preference_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user_preference_profiles" ON user_preference_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 8. Trigger for updated_at timestamps
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for tables with updated_at
CREATE TRIGGER update_plan_action_items_updated_at
  BEFORE UPDATE ON plan_action_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_understanding_scores_updated_at
  BEFORE UPDATE ON user_understanding_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preference_profiles_updated_at
  BEFORE UPDATE ON user_preference_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. Helper Functions
-- ============================================

-- Function to calculate execution rate for a plan
CREATE OR REPLACE FUNCTION calculate_plan_execution_rate(p_plan_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_records INTEGER;
  completed_count INTEGER;
  partial_count INTEGER;
  execution_rate DECIMAL;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'partial')
  INTO total_records, completed_count, partial_count
  FROM execution_tracking et
  JOIN plan_action_items pai ON et.action_item_id = pai.id
  WHERE pai.plan_id = p_plan_id;
  
  IF total_records = 0 THEN
    RETURN 0;
  END IF;
  
  execution_rate := (completed_count + 0.5 * partial_count)::DECIMAL / total_records;
  RETURN ROUND(execution_rate, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to check if action item needs replacement (3 consecutive failures)
CREATE OR REPLACE FUNCTION check_consecutive_failures(p_action_item_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  consecutive_failures INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO consecutive_failures
  FROM (
    SELECT status
    FROM execution_tracking
    WHERE action_item_id = p_action_item_id
    ORDER BY execution_date DESC
    LIMIT 3
  ) recent
  WHERE status IN ('skipped', 'replaced') OR needs_replacement = TRUE;
  
  RETURN consecutive_failures >= 3;
END;
$$ LANGUAGE plpgsql;

-- Function to update understanding score
CREATE OR REPLACE FUNCTION update_understanding_score(p_user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  new_score DECIMAL;
  is_deep BOOLEAN;
BEGIN
  SELECT 
    (completion_prediction_accuracy * 0.25 + 
     replacement_acceptance_rate * 0.25 + 
     sentiment_prediction_accuracy * 0.25 + 
     preference_pattern_match * 0.25)
  INTO new_score
  FROM user_understanding_scores
  WHERE user_id = p_user_id;
  
  is_deep := new_score >= 95;
  
  UPDATE user_understanding_scores
  SET current_score = new_score,
      is_deep_understanding = is_deep,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN new_score;
END;
$$ LANGUAGE plpgsql;
