-- ============================================
-- AI方案闭环系统 - 用户计划表
-- ============================================

-- 1. 创建 user_plans 表（AI生成的方案）
CREATE TABLE IF NOT EXISTS public.user_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 方案来源和类型
  source TEXT NOT NULL DEFAULT 'ai_assistant', -- 'ai_assistant', 'manual'
  plan_type TEXT NOT NULL, -- 'exercise', 'diet', 'sleep', 'comprehensive'
  
  -- 方案内容
  title TEXT NOT NULL,
  content JSONB NOT NULL, -- 详细内容（运动/饮食/睡眠等）
  
  -- 方案属性
  difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5), -- 1-5星难度
  expected_duration_days INTEGER, -- 预期执行天数
  
  -- 状态
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'archived'
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 添加注释
COMMENT ON TABLE public.user_plans IS 'AI生成的用户健康方案';
COMMENT ON COLUMN public.user_plans.source IS '方案来源：ai_assistant（AI助理）或 manual（手动创建）';
COMMENT ON COLUMN public.user_plans.plan_type IS '方案类型：exercise（运动）, diet（饮食）, sleep（睡眠）, comprehensive（综合）';
COMMENT ON COLUMN public.user_plans.content IS '方案详细内容，JSON格式，例如：{"actions": [{"time": "07:00", "description": "空腹20个深蹲"}]}';
COMMENT ON COLUMN public.user_plans.status IS '方案状态：active（进行中）, completed（已完成）, archived（已归档）';

-- 创建索引
CREATE INDEX idx_user_plans_user_id ON public.user_plans(user_id);
CREATE INDEX idx_user_plans_status ON public.user_plans(status);
CREATE INDEX idx_user_plans_created_at ON public.user_plans(created_at DESC);

-- ============================================
-- 2. 创建 user_plan_completions 表（执行记录）
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_plan_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.user_plans(id) ON DELETE CASCADE,
  
  -- 执行日期和状态
  completion_date DATE NOT NULL,
  status TEXT NOT NULL, -- 'completed', 'partial', 'skipped'
  
  -- 详细记录
  completed_items JSONB, -- 完成的具体项目
  notes TEXT, -- 用户备注（例如："太忙了，改为明天"）
  
  -- 效果反馈
  feeling_score INTEGER CHECK (feeling_score >= 1 AND feeling_score <= 5), -- 1-5分主观感受
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加注释
COMMENT ON TABLE public.user_plan_completions IS '用户执行方案的每日记录';
COMMENT ON COLUMN public.user_plan_completions.status IS '执行状态：completed（完成）, partial（部分完成）, skipped（跳过）';
COMMENT ON COLUMN public.user_plan_completions.completed_items IS '完成的具体项目，JSON格式';
COMMENT ON COLUMN public.user_plan_completions.feeling_score IS '主观感受评分（1-5）';

-- 创建索引
CREATE INDEX idx_plan_completions_user_id ON public.user_plan_completions(user_id);
CREATE INDEX idx_plan_completions_plan_id ON public.user_plan_completions(plan_id);
CREATE INDEX idx_plan_completions_date ON public.user_plan_completions(completion_date DESC);
CREATE INDEX idx_plan_completions_user_date ON public.user_plan_completions(user_id, completion_date);

-- 防止同一天重复记录
CREATE UNIQUE INDEX idx_plan_completions_unique_user_plan_date 
ON public.user_plan_completions(user_id, plan_id, completion_date);

-- ============================================
-- 3. 创建触发器：自动更新 updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_plans_updated_at
  BEFORE UPDATE ON public.user_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_plan_completions_updated_at
  BEFORE UPDATE ON public.user_plan_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. 启用 Row Level Security (RLS)
-- ============================================

ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plan_completions ENABLE ROW LEVEL SECURITY;

-- user_plans RLS策略
CREATE POLICY "Users can view their own plans"
  ON public.user_plans
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own plans"
  ON public.user_plans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans"
  ON public.user_plans
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plans"
  ON public.user_plans
  FOR DELETE
  USING (auth.uid() = user_id);

-- user_plan_completions RLS策略
CREATE POLICY "Users can view their own plan completions"
  ON public.user_plan_completions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own plan completions"
  ON public.user_plan_completions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plan completions"
  ON public.user_plan_completions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plan completions"
  ON public.user_plan_completions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 5. 创建辅助函数：获取用户执行统计
-- ============================================

CREATE OR REPLACE FUNCTION get_user_plan_stats(p_user_id UUID, p_plan_id UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_days', COUNT(*),
    'completed_days', COUNT(*) FILTER (WHERE status = 'completed'),
    'partial_days', COUNT(*) FILTER (WHERE status = 'partial'),
    'skipped_days', COUNT(*) FILTER (WHERE status = 'skipped'),
    'completion_rate', 
      CASE 
        WHEN COUNT(*) > 0 THEN 
          ROUND((COUNT(*) FILTER (WHERE status IN ('completed', 'partial'))::NUMERIC / COUNT(*)) * 100, 2)
        ELSE 0
      END,
    'avg_feeling_score',
      ROUND(AVG(feeling_score) FILTER (WHERE feeling_score IS NOT NULL), 2)
  )
  INTO stats
  FROM user_plan_completions
  WHERE user_id = p_user_id AND plan_id = p_plan_id;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_plan_stats IS '获取用户执行某个方案的统计数据';

-- ============================================
-- 完成
-- ============================================
-- 执行此脚本后，将创建：
-- 1. user_plans 表：存储AI生成的健康方案
-- 2. user_plan_completions 表：记录每日执行情况
-- 3. RLS策略：确保用户只能访问自己的数据
-- 4. 辅助函数：get_user_plan_stats 用于统计执行率
