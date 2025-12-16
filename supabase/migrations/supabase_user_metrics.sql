-- ============================================
-- 创建 user_metrics 表（真相/指标表）
-- 用于存储贝叶斯函数计算的结果
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_metrics (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  belief_curve_score DECIMAL(5,2), -- 由贝叶斯函数计算并写入（0.00-1.00）
  confidence_score DECIMAL(5,2), -- 由信心增强函数计算并写入（0.00-1.00）
  physical_performance_score DECIMAL(5,2), -- 身体机能表现分数（0.00-1.00）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date) -- 确保每个用户每天只有一条记录
);

-- 添加注释
COMMENT ON TABLE public.user_metrics IS '用户指标表（真相表），存储由数据库函数计算的结果';
COMMENT ON COLUMN public.user_metrics.belief_curve_score IS '信念曲线分数（0.00-1.00），由贝叶斯函数计算';
COMMENT ON COLUMN public.user_metrics.confidence_score IS '信心增强分数（0.00-1.00），由信心增强函数计算';
COMMENT ON COLUMN public.user_metrics.physical_performance_score IS '身体机能表现分数（0.00-1.00）';

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_metrics_user_id ON public.user_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_metrics_date ON public.user_metrics(date);
CREATE INDEX IF NOT EXISTS idx_user_metrics_user_date ON public.user_metrics(user_id, date DESC);

-- 启用 Row Level Security (RLS)
ALTER TABLE public.user_metrics ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：用户只能查看自己的指标
CREATE POLICY "Users can view their own metrics"
  ON public.user_metrics
  FOR SELECT
  USING (auth.uid() = user_id);

-- 为 user_metrics 表添加 updated_at 触发器
CREATE TRIGGER update_user_metrics_updated_at
  BEFORE UPDATE ON public.user_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

