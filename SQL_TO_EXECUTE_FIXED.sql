-- 修复版 SQL 脚本 - 安全处理已存在的表
-- 复制从这一行开始的所有内容，到文件末尾

-- 1. 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 创建 profiles 表（如果还没有）
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  language TEXT DEFAULT 'zh',
  user_persona_embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 如果 profiles 表已有其他字段，使用 ALTER TABLE 添加缺失的字段
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email') THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name') THEN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'language') THEN
    ALTER TABLE public.profiles ADD COLUMN language TEXT DEFAULT 'zh';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_persona_embedding') THEN
    ALTER TABLE public.profiles ADD COLUMN user_persona_embedding vector(1536);
  END IF;
END $$;

-- 3. 创建 habits 表（习惯定义表）
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  min_resistance_level INTEGER CHECK (min_resistance_level >= 1 AND min_resistance_level <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建 habit_completions 表（习惯打卡表）
CREATE TABLE IF NOT EXISTS public.habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  user_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 创建 ai_memory 表（AI 记忆表 - 向量表）
CREATE TABLE IF NOT EXISTS public.ai_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_text TEXT NOT NULL,
  embedding vector(1536),
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 创建 user_metrics 表（真相/指标表）
-- 先检查表是否存在，如果存在但结构不对，先删除再创建
DO $$
BEGIN
  -- 如果表存在但没有 date 列，添加该列
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_metrics') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_metrics' AND column_name = 'date') THEN
      ALTER TABLE public.user_metrics ADD COLUMN date DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_metrics' AND column_name = 'belief_curve_score') THEN
      ALTER TABLE public.user_metrics ADD COLUMN belief_curve_score FLOAT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_metrics' AND column_name = 'confidence_score') THEN
      ALTER TABLE public.user_metrics ADD COLUMN confidence_score FLOAT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_metrics' AND column_name = 'physical_performance_score') THEN
      ALTER TABLE public.user_metrics ADD COLUMN physical_performance_score FLOAT;
    END IF;
  END IF;
END $$;

-- 如果表不存在，创建它
CREATE TABLE IF NOT EXISTS public.user_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  belief_curve_score FLOAT,
  confidence_score FLOAT,
  physical_performance_score FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 7. 创建索引（使用 IF NOT EXISTS，如果表或列不存在会跳过）
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles(id);
CREATE INDEX IF NOT EXISTS habits_user_id_idx ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS habits_created_at_idx ON public.habits(created_at DESC);
CREATE INDEX IF NOT EXISTS habit_completions_user_id_idx ON public.habit_completions(user_id);
CREATE INDEX IF NOT EXISTS habit_completions_habit_id_idx ON public.habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS habit_completions_completed_at_idx ON public.habit_completions(completed_at DESC);
CREATE INDEX IF NOT EXISTS ai_memory_user_id_idx ON public.ai_memory(user_id);
CREATE INDEX IF NOT EXISTS ai_memory_created_at_idx ON public.ai_memory(created_at DESC);

-- 向量索引（需要表存在且有 embedding 列）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_memory' AND column_name = 'embedding') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ai_memory_embedding_idx') THEN
      CREATE INDEX ai_memory_embedding_idx ON public.ai_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
    END IF;
  END IF;
END $$;

-- user_metrics 索引（只有在 date 列存在时才创建）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_metrics' AND column_name = 'date') THEN
    CREATE INDEX IF NOT EXISTS user_metrics_user_id_idx ON public.user_metrics(user_id);
    CREATE INDEX IF NOT EXISTS user_metrics_date_idx ON public.user_metrics(date);
    CREATE INDEX IF NOT EXISTS user_metrics_user_date_idx ON public.user_metrics(user_id, date DESC);
  END IF;
END $$;

-- 8. 启用行级安全 (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_metrics ENABLE ROW LEVEL SECURITY;

-- 9. 创建 RLS 策略
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own habits" ON public.habits;
CREATE POLICY "Users can view own habits" ON public.habits FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own habits" ON public.habits;
CREATE POLICY "Users can create own habits" ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own habits" ON public.habits;
CREATE POLICY "Users can update own habits" ON public.habits FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own habits" ON public.habits;
CREATE POLICY "Users can delete own habits" ON public.habits FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own completions" ON public.habit_completions;
CREATE POLICY "Users can view own completions" ON public.habit_completions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own completions" ON public.habit_completions;
CREATE POLICY "Users can create own completions" ON public.habit_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own memories" ON public.ai_memory;
CREATE POLICY "Users can view own memories" ON public.ai_memory FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own memories" ON public.ai_memory;
CREATE POLICY "Users can create own memories" ON public.ai_memory FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own metrics" ON public.user_metrics;
CREATE POLICY "Users can view own metrics" ON public.user_metrics FOR SELECT USING (auth.uid() = user_id);

-- 10. 创建 updated_at 触发器函数
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_habits_updated_at ON public.habits;
CREATE TRIGGER update_habits_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

