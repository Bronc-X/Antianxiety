-- ============================================
-- 贝叶斯信念表 (Bayesian Beliefs Table)
-- 存储用户的焦虑校准历史记录
-- ============================================

-- 创建 bayesian_beliefs 表
CREATE TABLE IF NOT EXISTS public.bayesian_beliefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 信念上下文（焦虑场景）
  belief_context TEXT NOT NULL,
  
  -- 先验分数（用户输入的焦虑值 0-100）
  prior_score DECIMAL(5,2) NOT NULL CHECK (prior_score >= 0 AND prior_score <= 100),
  
  -- 后验分数（贝叶斯计算后的焦虑值 0-100）
  posterior_score DECIMAL(5,2) NOT NULL CHECK (posterior_score >= 0 AND posterior_score <= 100),
  
  -- 证据栈（JSON 数组，存储所有收集的证据）
  evidence_stack JSONB DEFAULT '[]'::jsonb,
  
  -- 计算详情（存储夸大因子等元数据）
  calculation_details JSONB DEFAULT '{}'::jsonb,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_bayesian_beliefs_user_id ON public.bayesian_beliefs(user_id);
CREATE INDEX IF NOT EXISTS idx_bayesian_beliefs_created_at ON public.bayesian_beliefs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bayesian_beliefs_context ON public.bayesian_beliefs(belief_context);
CREATE INDEX IF NOT EXISTS idx_bayesian_beliefs_user_date ON public.bayesian_beliefs(user_id, created_at DESC);

-- 启用 RLS
ALTER TABLE public.bayesian_beliefs ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能查看自己的数据
CREATE POLICY "Users can view own bayesian beliefs"
  ON public.bayesian_beliefs
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS 策略：用户只能插入自己的数据
CREATE POLICY "Users can insert own bayesian beliefs"
  ON public.bayesian_beliefs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS 策略：用户只能更新自己的数据
CREATE POLICY "Users can update own bayesian beliefs"
  ON public.bayesian_beliefs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS 策略：用户只能删除自己的数据
CREATE POLICY "Users can delete own bayesian beliefs"
  ON public.bayesian_beliefs
  FOR DELETE
  USING (auth.uid() = user_id);

-- 更新时间戳触发器
CREATE OR REPLACE FUNCTION public.update_bayesian_beliefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_bayesian_beliefs_updated_at ON public.bayesian_beliefs;
CREATE TRIGGER trigger_bayesian_beliefs_updated_at
  BEFORE UPDATE ON public.bayesian_beliefs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bayesian_beliefs_updated_at();

-- 添加表注释
COMMENT ON TABLE public.bayesian_beliefs IS '贝叶斯信念记录表 - 存储用户的焦虑校准历史';
COMMENT ON COLUMN public.bayesian_beliefs.belief_context IS '焦虑场景类型，如 metabolic_crash, heart_attack 等';
COMMENT ON COLUMN public.bayesian_beliefs.prior_score IS '用户输入的主观焦虑值（0-100）';
COMMENT ON COLUMN public.bayesian_beliefs.posterior_score IS '贝叶斯计算后的客观焦虑值（0-100）';
COMMENT ON COLUMN public.bayesian_beliefs.evidence_stack IS '收集的证据数组（生理数据 + 科学文献）';
COMMENT ON COLUMN public.bayesian_beliefs.calculation_details IS '计算元数据，包含夸大因子等';

-- ============================================
-- 验证表创建成功
-- ============================================
SELECT 
  'bayesian_beliefs table created successfully' as status,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'bayesian_beliefs';


-- ============================================
-- 证据缓存表 (Evidence Cache Table)
-- 缓存 Semantic Scholar 的论文搜索结果
-- ============================================

CREATE TABLE IF NOT EXISTS public.evidence_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 信念上下文（用于分类缓存）
  belief_context TEXT NOT NULL,
  
  -- 论文信息
  paper_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  abstract TEXT,
  citation_count INTEGER DEFAULT 0,
  consensus_score DECIMAL(3,2) DEFAULT 0.5,
  url TEXT,
  
  -- 缓存时间戳
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_evidence_cache_context ON public.evidence_cache(belief_context);
CREATE INDEX IF NOT EXISTS idx_evidence_cache_expires ON public.evidence_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_evidence_cache_citations ON public.evidence_cache(citation_count DESC);

-- 添加表注释
COMMENT ON TABLE public.evidence_cache IS '科学证据缓存表 - 存储 Semantic Scholar 论文搜索结果';
COMMENT ON COLUMN public.evidence_cache.belief_context IS '信念上下文类型';
COMMENT ON COLUMN public.evidence_cache.paper_id IS 'Semantic Scholar 论文 ID';
COMMENT ON COLUMN public.evidence_cache.consensus_score IS '基于引用数计算的共识分数 (0-1)';
COMMENT ON COLUMN public.evidence_cache.expires_at IS '缓存过期时间';

-- ============================================
-- 验证所有表创建成功
-- ============================================
SELECT 
  'All Bayesian tables created successfully' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'bayesian_beliefs') as bayesian_beliefs_exists,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'evidence_cache') as evidence_cache_exists;
