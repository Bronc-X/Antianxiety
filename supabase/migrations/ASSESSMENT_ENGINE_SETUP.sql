-- ============================================
-- Assessment Engine Database Setup
-- Bio-Ledger Dynamic Health Assessment System
-- ============================================
-- 
-- 执行此 SQL 文件以创建评估引擎所需的数据库表
-- Execute this SQL file to create the database tables required for the assessment engine
--
-- 在 Supabase Dashboard 中执行:
-- 1. 打开 Supabase Dashboard
-- 2. 进入 SQL Editor
-- 3. 粘贴此文件内容
-- 4. 点击 Run
--

-- ============================================
-- 1. Assessment Sessions Table (评估会话表)
-- ============================================
CREATE TABLE IF NOT EXISTS assessment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- State Machine (状态机)
  phase TEXT NOT NULL DEFAULT 'welcome' 
    CHECK (phase IN ('welcome', 'baseline', 'chief_complaint', 'differential', 'report', 'emergency')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'expired', 'emergency_triggered')),
  
  -- Demographics (人口统计信息)
  demographics JSONB DEFAULT '{}'::jsonb,
  
  -- Chief Complaint & Symptoms (主诉和症状)
  chief_complaint TEXT,
  symptoms TEXT[] DEFAULT '{}',
  
  -- Question History (问答历史)
  history JSONB DEFAULT '[]'::jsonb,
  
  -- Localization (本地化)
  language TEXT DEFAULT 'zh' CHECK (language IN ('zh', 'en')),
  country_code TEXT DEFAULT 'CN',
  
  -- Timestamps (时间戳)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Index for user queries
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_user_id ON assessment_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_status ON assessment_sessions(status);

-- Auto-update updated_at trigger
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
-- 2. Assessment Reports Table (评估报告表)
-- ============================================
CREATE TABLE IF NOT EXISTS assessment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES assessment_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Report Content (报告内容)
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  urgency TEXT NOT NULL DEFAULT 'routine'
    CHECK (urgency IN ('emergency', 'urgent', 'routine', 'self_care')),
  next_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Export (导出)
  pdf_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessment_reports_session_id ON assessment_reports(session_id);
CREATE INDEX IF NOT EXISTS idx_assessment_reports_user_id ON assessment_reports(user_id);

-- ============================================
-- 3. Red Flag Audit Log Table (红旗审计日志表)
-- ============================================
CREATE TABLE IF NOT EXISTS assessment_red_flag_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES assessment_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Red Flag Details (红旗详情)
  detected_pattern TEXT NOT NULL,
  symptom_data JSONB NOT NULL,
  was_dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_red_flag_logs_session_id ON assessment_red_flag_logs(session_id);

-- ============================================
-- 4. Row Level Security (RLS) - 行级安全策略
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

-- ============================================
-- 完成! Setup Complete!
-- ============================================
-- 如果执行成功，您应该看到 "Success. No rows returned"
-- If successful, you should see "Success. No rows returned"
