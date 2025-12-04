-- Assessment Engine Database Schema
-- Bio-Ledger Dynamic Health Assessment System

-- ============================================
-- 1. Assessment Sessions Table
-- ============================================
CREATE TABLE IF NOT EXISTS assessment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- State Machine
  phase TEXT NOT NULL DEFAULT 'welcome' 
    CHECK (phase IN ('welcome', 'baseline', 'chief_complaint', 'differential', 'report', 'emergency')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'expired', 'emergency_triggered')),
  
  -- Demographics (Baseline)
  demographics JSONB DEFAULT '{}'::jsonb,
  
  -- Chief Complaint & Symptoms
  chief_complaint TEXT,
  symptoms TEXT[] DEFAULT '{}',
  
  -- Question History
  history JSONB DEFAULT '[]'::jsonb,
  
  -- Localization
  language TEXT DEFAULT 'zh' CHECK (language IN ('zh', 'en')),
  country_code TEXT DEFAULT 'CN',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Index for user queries
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_user_id ON assessment_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_status ON assessment_sessions(status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_assessment_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_assessment_session_timestamp ON assessment_sessions;
CREATE TRIGGER trigger_update_assessment_session_timestamp
  BEFORE UPDATE ON assessment_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_assessment_session_timestamp();

-- ============================================
-- 2. Assessment Reports Table
-- ============================================
CREATE TABLE IF NOT EXISTS assessment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES assessment_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Report Content
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  urgency TEXT NOT NULL DEFAULT 'routine'
    CHECK (urgency IN ('emergency', 'urgent', 'routine', 'self_care')),
  next_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Export
  pdf_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for queries
CREATE INDEX IF NOT EXISTS idx_assessment_reports_session_id ON assessment_reports(session_id);
CREATE INDEX IF NOT EXISTS idx_assessment_reports_user_id ON assessment_reports(user_id);

-- ============================================
-- 3. Red Flag Audit Log Table
-- ============================================
CREATE TABLE IF NOT EXISTS assessment_red_flag_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES assessment_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Red Flag Details
  detected_pattern TEXT NOT NULL,
  symptom_data JSONB NOT NULL,
  was_dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_red_flag_logs_session_id ON assessment_red_flag_logs(session_id);

-- ============================================
-- 4. Row Level Security (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_red_flag_logs ENABLE ROW LEVEL SECURITY;

-- Sessions: Users can only access their own
DROP POLICY IF EXISTS "Users can view own sessions" ON assessment_sessions;
CREATE POLICY "Users can view own sessions"
  ON assessment_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sessions" ON assessment_sessions;
CREATE POLICY "Users can insert own sessions"
  ON assessment_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sessions" ON assessment_sessions;
CREATE POLICY "Users can update own sessions"
  ON assessment_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Reports: Users can only access their own
DROP POLICY IF EXISTS "Users can view own reports" ON assessment_reports;
CREATE POLICY "Users can view own reports"
  ON assessment_reports FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own reports" ON assessment_reports;
CREATE POLICY "Users can insert own reports"
  ON assessment_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Red Flag Logs: Users can only access their own
DROP POLICY IF EXISTS "Users can view own red flag logs" ON assessment_red_flag_logs;
CREATE POLICY "Users can view own red flag logs"
  ON assessment_red_flag_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own red flag logs" ON assessment_red_flag_logs;
CREATE POLICY "Users can insert own red flag logs"
  ON assessment_red_flag_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own red flag logs" ON assessment_red_flag_logs;
CREATE POLICY "Users can update own red flag logs"
  ON assessment_red_flag_logs FOR UPDATE
  USING (auth.uid() = user_id);
