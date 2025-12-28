-- Daily Questionnaire Responses Table
-- 存储用户每日问卷回答，用于 AI 分析

-- 创建问卷响应表
CREATE TABLE IF NOT EXISTS public.daily_questionnaire_responses (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- 问卷数据
  responses JSONB NOT NULL,           -- 问题ID -> 答案索引的映射
  questions TEXT[] NOT NULL,          -- 当天的问题ID列表
  
  -- 分析结果（AI 填充）
  ai_analysis JSONB,                  -- AI 分析结果
  insights TEXT[],                    -- 生成的洞察
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  response_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Ensure response_date exists for older schemas
ALTER TABLE public.daily_questionnaire_responses
  ADD COLUMN IF NOT EXISTS response_date DATE;

UPDATE public.daily_questionnaire_responses
SET response_date = created_at::date
WHERE response_date IS NULL;

ALTER TABLE public.daily_questionnaire_responses
  ALTER COLUMN response_date SET DEFAULT CURRENT_DATE,
  ALTER COLUMN response_date SET NOT NULL;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_questionnaire_user_id ON public.daily_questionnaire_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_created_at ON public.daily_questionnaire_responses(created_at DESC);

-- 创建唯一约束：每个用户每天只能提交一次
CREATE UNIQUE INDEX IF NOT EXISTS idx_questionnaire_user_date 
ON public.daily_questionnaire_responses(user_id, response_date);

-- 启用 RLS
ALTER TABLE public.daily_questionnaire_responses ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能看自己的数据
CREATE POLICY "Users can view their own questionnaire responses"
ON public.daily_questionnaire_responses
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own questionnaire responses"
ON public.daily_questionnaire_responses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 更新时间触发器
CREATE OR REPLACE FUNCTION update_questionnaire_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_questionnaire_updated_at
  BEFORE UPDATE ON public.daily_questionnaire_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_questionnaire_updated_at();

-- 添加表注释
COMMENT ON TABLE public.daily_questionnaire_responses IS '每日问卷响应表 - 存储用户每日状态问卷的回答';
COMMENT ON COLUMN public.daily_questionnaire_responses.responses IS '问题ID到答案索引的映射，如 {"sleep_quality": 3, "stress_level": 2}';
COMMENT ON COLUMN public.daily_questionnaire_responses.questions IS '当天展示的问题ID列表';
COMMENT ON COLUMN public.daily_questionnaire_responses.ai_analysis IS 'AI 分析结果，包含模式识别、趋势等';
COMMENT ON COLUMN public.daily_questionnaire_responses.response_date IS '问卷日期（用于每日唯一约束）';
