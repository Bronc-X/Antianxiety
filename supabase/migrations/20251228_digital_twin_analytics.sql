-- Digital Twin AI Analytics System
-- Created: 2025-12-28
-- Description: Tables for storing AI-powered health analysis results

-- ============================================
-- 1. digital_twin_analyses - 主分析结果表
-- ============================================
CREATE TABLE IF NOT EXISTS public.digital_twin_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 分析输入快照 (AggregatedUserData)
  input_snapshot JSONB NOT NULL,
  
  -- AI 分析结果
  physiological_assessment JSONB NOT NULL,
  longitudinal_predictions JSONB NOT NULL,
  adaptive_plan JSONB NOT NULL,
  
  -- 科学依据 (Semantic Scholar papers)
  papers_used JSONB DEFAULT '[]'::jsonb,
  
  -- 仪表盘数据（预计算）
  dashboard_data JSONB NOT NULL,
  
  -- 元数据
  model_used TEXT NOT NULL,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  analysis_version INTEGER DEFAULT 1,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '6 hours',
  
  -- 约束
  CONSTRAINT valid_assessment CHECK (jsonb_typeof(physiological_assessment) = 'object'),
  CONSTRAINT valid_predictions CHECK (jsonb_typeof(longitudinal_predictions) = 'object'),
  CONSTRAINT valid_plan CHECK (jsonb_typeof(adaptive_plan) = 'object'),
  CONSTRAINT valid_dashboard CHECK (jsonb_typeof(dashboard_data) = 'object')
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_dta_user_id 
  ON public.digital_twin_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_dta_user_created 
  ON public.digital_twin_analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dta_expires 
  ON public.digital_twin_analyses(expires_at);

-- RLS
ALTER TABLE public.digital_twin_analyses ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的分析
DROP POLICY IF EXISTS "Users can view own analyses" ON public.digital_twin_analyses;
CREATE POLICY "Users can view own analyses"
  ON public.digital_twin_analyses FOR SELECT
  USING (auth.uid() = user_id);

-- 用户可以插入自己的分析
DROP POLICY IF EXISTS "Users can insert own analyses" ON public.digital_twin_analyses;
CREATE POLICY "Users can insert own analyses"
  ON public.digital_twin_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role 可以管理所有分析（用于后台任务）
DROP POLICY IF EXISTS "Service role can manage all analyses" ON public.digital_twin_analyses;
CREATE POLICY "Service role can manage all analyses"
  ON public.digital_twin_analyses FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 2. analysis_history - 分析历史表（长期存储）
-- ============================================
CREATE TABLE IF NOT EXISTS public.analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.digital_twin_analyses(id) ON DELETE SET NULL,
  
  -- 关键指标快照
  anxiety_score DECIMAL(4,1) CHECK (anxiety_score >= 0 AND anxiety_score <= 100),
  sleep_quality DECIMAL(4,1) CHECK (sleep_quality >= 0 AND sleep_quality <= 100),
  stress_resilience DECIMAL(4,1) CHECK (stress_resilience >= 0 AND stress_resilience <= 100),
  mood_stability DECIMAL(4,1) CHECK (mood_stability >= 0 AND mood_stability <= 100),
  energy_level DECIMAL(4,1) CHECK (energy_level >= 0 AND energy_level <= 100),
  hrv_estimate DECIMAL(4,1) CHECK (hrv_estimate >= 0 AND hrv_estimate <= 100),
  
  overall_status TEXT CHECK (overall_status IN ('improving', 'stable', 'needs_attention')),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_ah_user_date 
  ON public.analysis_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ah_analysis_id 
  ON public.analysis_history(analysis_id);

-- RLS
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的历史
DROP POLICY IF EXISTS "Users can view own history" ON public.analysis_history;
CREATE POLICY "Users can view own history"
  ON public.analysis_history FOR SELECT
  USING (auth.uid() = user_id);

-- 用户可以插入自己的历史
DROP POLICY IF EXISTS "Users can insert own history" ON public.analysis_history;
CREATE POLICY "Users can insert own history"
  ON public.analysis_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role 可以管理所有历史
DROP POLICY IF EXISTS "Service role can manage all history" ON public.analysis_history;
CREATE POLICY "Service role can manage all history"
  ON public.analysis_history FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 3. 辅助函数
-- ============================================

-- 获取用户最新的有效分析
CREATE OR REPLACE FUNCTION public.get_latest_valid_analysis(p_user_id UUID)
RETURNS public.digital_twin_analyses AS $$
  SELECT *
  FROM public.digital_twin_analyses
  WHERE user_id = p_user_id
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 检查用户是否可以触发新分析（6小时限制）
CREATE OR REPLACE FUNCTION public.can_trigger_analysis(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  last_analysis_time TIMESTAMPTZ;
BEGIN
  SELECT created_at INTO last_analysis_time
  FROM public.digital_twin_analyses
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF last_analysis_time IS NULL THEN
    RETURN TRUE;
  END IF;
  
  RETURN (NOW() - last_analysis_time) > INTERVAL '6 hours';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 清理过期分析（保留最新的3个）
CREATE OR REPLACE FUNCTION public.cleanup_expired_analyses()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH ranked AS (
    SELECT id, user_id,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
    FROM public.digital_twin_analyses
  ),
  to_delete AS (
    SELECT id FROM ranked WHERE rn > 3
    UNION
    SELECT id FROM public.digital_twin_analyses WHERE expires_at < NOW() - INTERVAL '7 days'
  )
  DELETE FROM public.digital_twin_analyses
  WHERE id IN (SELECT id FROM to_delete);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. 注释
-- ============================================
COMMENT ON TABLE public.digital_twin_analyses IS 
  'AI-powered health analysis results for digital twin dashboard. Stores physiological assessments, predictions, and adaptive plans.';

COMMENT ON TABLE public.analysis_history IS 
  'Long-term storage of key health metrics from each analysis. Used for tracking progress over time.';

COMMENT ON FUNCTION public.get_latest_valid_analysis IS 
  'Returns the most recent non-expired analysis for a user.';

COMMENT ON FUNCTION public.can_trigger_analysis IS 
  'Checks if a user can trigger a new analysis (rate limited to 1 per 6 hours).';

COMMENT ON FUNCTION public.cleanup_expired_analyses IS 
  'Removes old analyses, keeping only the 3 most recent per user.';
