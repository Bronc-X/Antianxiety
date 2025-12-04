-- ============================================
-- Bayesian Belief Loop (认知天平系统) - Database Schema
-- 贝叶斯信念循环核心数据库结构
-- ============================================

-- ============================================
-- 1. bayesian_beliefs 表 - 核心信念记录表
-- ============================================
CREATE TABLE IF NOT EXISTS public.bayesian_beliefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  belief_context TEXT NOT NULL,
  prior_score INTEGER NOT NULL CHECK (prior_score >= 0 AND prior_score <= 100),
  posterior_score INTEGER NOT NULL CHECK (posterior_score >= 0 AND posterior_score <= 100),
  evidence_stack JSONB NOT NULL DEFAULT '[]',
  calculation_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_bayesian_beliefs_user_created 
  ON public.bayesian_beliefs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bayesian_beliefs_context 
  ON public.bayesian_beliefs(belief_context);

-- ============================================
-- 2. RLS 策略 - 用户数据隔离
-- ============================================
ALTER TABLE public.bayesian_beliefs ENABLE ROW LEVEL SECURITY;

-- 删除已存在的策略（如果有）
DROP POLICY IF EXISTS "Users can view their own beliefs" ON public.bayesian_beliefs;
DROP POLICY IF EXISTS "Users can insert their own beliefs" ON public.bayesian_beliefs;
DROP POLICY IF EXISTS "Users can update their own beliefs" ON public.bayesian_beliefs;
DROP POLICY IF EXISTS "Users can delete their own beliefs" ON public.bayesian_beliefs;

-- 创建 RLS 策略
CREATE POLICY "Users can view their own beliefs" 
  ON public.bayesian_beliefs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own beliefs" 
  ON public.bayesian_beliefs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own beliefs" 
  ON public.bayesian_beliefs FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own beliefs" 
  ON public.bayesian_beliefs FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- 3. evidence_cache 表 - Semantic Scholar 论文缓存
-- ============================================
CREATE TABLE IF NOT EXISTS public.evidence_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  belief_context TEXT NOT NULL,
  paper_id TEXT NOT NULL,
  title TEXT NOT NULL,
  abstract TEXT,
  citation_count INTEGER,
  consensus_score DECIMAL(3,2),
  url TEXT,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  UNIQUE(paper_id)
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_evidence_cache_context 
  ON public.evidence_cache(belief_context);

CREATE INDEX IF NOT EXISTS idx_evidence_cache_expires 
  ON public.evidence_cache(expires_at);

-- ============================================
-- 4. calculate_bayesian_posterior 函数
-- 核心贝叶斯计算函数
-- ============================================
CREATE OR REPLACE FUNCTION public.calculate_bayesian_posterior(
  p_prior INTEGER,
  p_evidence_stack JSONB
) RETURNS INTEGER AS $$
DECLARE
  v_likelihood DECIMAL;
  v_evidence DECIMAL;
  v_posterior DECIMAL;
  v_total_weight DECIMAL := 0;
  v_weighted_sum DECIMAL := 0;
  v_item JSONB;
  v_weight DECIMAL;
  v_consensus DECIMAL;
BEGIN
  -- 验证输入
  IF p_prior < 0 OR p_prior > 100 THEN
    RAISE EXCEPTION 'Prior score must be between 0 and 100';
  END IF;

  -- 如果证据栈为空，返回先验值
  IF p_evidence_stack IS NULL OR jsonb_array_length(p_evidence_stack) = 0 THEN
    RETURN p_prior;
  END IF;

  -- 第一遍：计算总权重
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_evidence_stack)
  LOOP
    v_weight := COALESCE((v_item->>'weight')::DECIMAL, 0.1);
    v_total_weight := v_total_weight + v_weight;
  END LOOP;

  -- 如果总权重为0，返回先验值
  IF v_total_weight = 0 THEN
    RETURN p_prior;
  END IF;

  -- 第二遍：计算归一化后的加权共识
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_evidence_stack)
  LOOP
    v_weight := COALESCE((v_item->>'weight')::DECIMAL, 0.1);
    v_consensus := COALESCE((v_item->>'consensus')::DECIMAL, 0.7);
    
    -- 归一化权重并累加
    v_weighted_sum := v_weighted_sum + 
      (v_weight / v_total_weight) * v_consensus;
  END LOOP;

  -- 似然度 = 加权共识平均值
  v_likelihood := v_weighted_sum;

  -- 证据强度基于总权重（归一化后）
  v_evidence := 0.5 + (LEAST(v_total_weight, 1.0) * 0.3);

  -- 贝叶斯公式: P(H|E) = P(E|H) * P(H) / P(E)
  -- 简化版本：posterior = likelihood * prior / evidence_strength
  v_posterior := (v_likelihood * (p_prior::DECIMAL / 100)) / v_evidence * 100;

  -- 钳制到有效范围 [0, 100]
  v_posterior := GREATEST(0, LEAST(100, v_posterior));

  RETURN ROUND(v_posterior)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.calculate_bayesian_posterior IS 
  '计算贝叶斯后验概率分数。输入先验分数(0-100)和证据栈JSONB，返回后验分数(0-100)';

-- ============================================
-- 5. 触发器函数 - 自动计算后验分数
-- ============================================
CREATE OR REPLACE FUNCTION public.trigger_bayesian_update_on_belief_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_calculated_posterior INTEGER;
BEGIN
  -- 计算后验分数
  v_calculated_posterior := public.calculate_bayesian_posterior(
    NEW.prior_score,
    NEW.evidence_stack
  );

  -- 更新后验分数
  NEW.posterior_score := v_calculated_posterior;
  
  -- 存储计算详情
  NEW.calculation_details := jsonb_build_object(
    'calculated_at', NOW(),
    'prior', NEW.prior_score,
    'posterior', v_calculated_posterior,
    'evidence_count', jsonb_array_length(COALESCE(NEW.evidence_stack, '[]'::jsonb))
  );

  NEW.updated_at := NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 发生错误时，保持原有的 posterior_score
    -- 记录错误但不中断插入
    RAISE WARNING 'Bayesian calculation failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.trigger_bayesian_update_on_belief_insert IS 
  '在插入新信念记录时自动计算后验分数的触发器函数';

-- ============================================
-- 6. 创建触发器
-- ============================================
DROP TRIGGER IF EXISTS trigger_bayesian_belief_insert ON public.bayesian_beliefs;

CREATE TRIGGER trigger_bayesian_belief_insert
  BEFORE INSERT ON public.bayesian_beliefs
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_bayesian_update_on_belief_insert();

-- 更新时也重新计算
DROP TRIGGER IF EXISTS trigger_bayesian_belief_update ON public.bayesian_beliefs;

CREATE TRIGGER trigger_bayesian_belief_update
  BEFORE UPDATE OF evidence_stack, prior_score ON public.bayesian_beliefs
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_bayesian_update_on_belief_insert();

-- ============================================
-- 7. 辅助函数：验证证据栈结构
-- ============================================
CREATE OR REPLACE FUNCTION public.validate_evidence_stack(p_evidence_stack JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  v_item JSONB;
  v_type TEXT;
  v_weight DECIMAL;
BEGIN
  -- 空数组是有效的
  IF p_evidence_stack IS NULL OR jsonb_array_length(p_evidence_stack) = 0 THEN
    RETURN TRUE;
  END IF;

  -- 验证每个证据项
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_evidence_stack)
  LOOP
    -- 必须有 type 字段
    v_type := v_item->>'type';
    IF v_type IS NULL OR v_type NOT IN ('bio', 'science', 'action') THEN
      RETURN FALSE;
    END IF;

    -- weight 必须在有效范围内
    v_weight := COALESCE((v_item->>'weight')::DECIMAL, 0);
    IF v_weight < 0 OR v_weight > 1 THEN
      RETURN FALSE;
    END IF;
  END LOOP;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.validate_evidence_stack IS 
  '验证证据栈JSONB结构是否有效';

-- ============================================
-- 8. 添加证据栈验证约束
-- ============================================
ALTER TABLE public.bayesian_beliefs 
  DROP CONSTRAINT IF EXISTS check_evidence_stack_valid;

ALTER TABLE public.bayesian_beliefs 
  ADD CONSTRAINT check_evidence_stack_valid 
  CHECK (public.validate_evidence_stack(evidence_stack));
