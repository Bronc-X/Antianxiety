-- 修复 user_metrics 表的 date 列问题
-- 如果 user_metrics 表已存在但没有 date 列，执行这个脚本

-- 检查并添加缺失的列
DO $$
BEGIN
  -- 如果表存在但没有 date 列，添加该列
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_metrics') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_metrics' AND column_name = 'date') THEN
      ALTER TABLE public.user_metrics ADD COLUMN date DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
    
    -- 添加其他可能缺失的列
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_metrics' AND column_name = 'belief_curve_score') THEN
      ALTER TABLE public.user_metrics ADD COLUMN belief_curve_score FLOAT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_metrics' AND column_name = 'confidence_score') THEN
      ALTER TABLE public.user_metrics ADD COLUMN confidence_score FLOAT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_metrics' AND column_name = 'physical_performance_score') THEN
      ALTER TABLE public.user_metrics ADD COLUMN physical_performance_score FLOAT;
    END IF;
    
    -- 添加唯一约束（如果还没有）
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'user_metrics_user_id_date_key'
    ) THEN
      ALTER TABLE public.user_metrics ADD CONSTRAINT user_metrics_user_id_date_key UNIQUE (user_id, date);
    END IF;
  ELSE
    -- 如果表不存在，创建它
    CREATE TABLE public.user_metrics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      belief_curve_score FLOAT,
      confidence_score FLOAT,
      physical_performance_score FLOAT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, date)
    );
  END IF;
END $$;

-- 创建索引（只有在 date 列存在时才创建）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_metrics' AND column_name = 'date') THEN
    CREATE INDEX IF NOT EXISTS user_metrics_user_id_idx ON public.user_metrics(user_id);
    CREATE INDEX IF NOT EXISTS user_metrics_date_idx ON public.user_metrics(date);
    CREATE INDEX IF NOT EXISTS user_metrics_user_date_idx ON public.user_metrics(user_id, date DESC);
  END IF;
END $$;

