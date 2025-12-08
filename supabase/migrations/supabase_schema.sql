-- ============================================
-- 创建 profiles 表
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  age INTEGER,
  primary_concern TEXT,
  activity_level TEXT,
  circadian_rhythm TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 为 profiles 表添加注释
COMMENT ON TABLE public.profiles IS '用户配置文件表，链接到 auth.users';
COMMENT ON COLUMN public.profiles.id IS '用户ID，外键关联 auth.users.id';
COMMENT ON COLUMN public.profiles.username IS '用户名';
COMMENT ON COLUMN public.profiles.age IS '年龄';
COMMENT ON COLUMN public.profiles.primary_concern IS '主要关注点（例如：anxiety, sleep）';
COMMENT ON COLUMN public.profiles.activity_level IS '活动水平（例如：low, medium, high）';
COMMENT ON COLUMN public.profiles.circadian_rhythm IS '昼夜节律（例如：morning, night）';

-- 启用 Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：用户只能查看和更新自己的资料
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 创建触发器函数：自动创建 profile 记录
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 创建触发器：当 auth.users 创建新用户时触发
-- ============================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 创建 user_habits 表
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_habits (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  habit_name TEXT NOT NULL,
  cue TEXT,
  response TEXT,
  reward TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 为 user_habits 表添加注释
COMMENT ON TABLE public.user_habits IS '用户习惯表';
COMMENT ON COLUMN public.user_habits.id IS '习惯ID（自动递增）';
COMMENT ON COLUMN public.user_habits.user_id IS '用户ID，外键关联 profiles.id';
COMMENT ON COLUMN public.user_habits.habit_name IS '习惯名称';
COMMENT ON COLUMN public.user_habits.cue IS '线索（触发习惯的提示）';
COMMENT ON COLUMN public.user_habits.response IS '反应（习惯行为）';
COMMENT ON COLUMN public.user_habits.reward IS '奖励（习惯带来的好处）';

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_habits_user_id ON public.user_habits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_habits_created_at ON public.user_habits(created_at);

-- 启用 Row Level Security (RLS)
ALTER TABLE public.user_habits ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：用户只能查看、插入、更新和删除自己的习惯
CREATE POLICY "Users can view their own habits"
  ON public.user_habits
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habits"
  ON public.user_habits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits"
  ON public.user_habits
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits"
  ON public.user_habits
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 创建更新 updated_at 的触发器函数
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 profiles 表添加 updated_at 触发器
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 为 user_habits 表添加 updated_at 触发器
CREATE TRIGGER update_user_habits_updated_at
  BEFORE UPDATE ON public.user_habits
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

