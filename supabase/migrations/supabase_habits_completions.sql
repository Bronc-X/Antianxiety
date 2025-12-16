-- ============================================
-- 创建 habits 和 habit_completions 表
-- 根据 README 要求，habits 表应该包含 min_resistance_level
-- habit_completions 表用于记录习惯打卡
-- ============================================

-- 注意：如果已经存在 user_habits 表，可以考虑重命名或创建新的 habits 表
-- 这里我们创建符合 README 要求的 habits 表

-- 创建 habits 表（习惯定义表）
CREATE TABLE IF NOT EXISTS public.habits (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL, -- 习惯标题（例如："10分钟冥想"）
  description TEXT, -- 习惯描述
  
  -- 兼容旧 user_habits 表的习惯循环字段
  cue TEXT, -- 线索（习惯循环的触发条件）
  response TEXT, -- 反应（习惯循环的行为）
  reward TEXT, -- 奖励（习惯循环的奖励机制）
  belief_score INTEGER CHECK (belief_score >= 1 AND belief_score <= 10), -- 信念分数 1-10
  
  min_resistance_level INTEGER NOT NULL DEFAULT 3 CHECK (min_resistance_level >= 1 AND min_resistance_level <= 5), -- 最小阻力等级 1-5
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加注释
COMMENT ON TABLE public.habits IS '习惯定义表，符合 README 架构要求，兼容旧 user_habits 表结构';
COMMENT ON COLUMN public.habits.title IS '习惯标题（例如："10分钟冥想"）';
COMMENT ON COLUMN public.habits.description IS '习惯描述';
COMMENT ON COLUMN public.habits.cue IS '习惯循环的线索/触发条件（兼容旧表）';
COMMENT ON COLUMN public.habits.response IS '习惯循环的反应/行为（兼容旧表）';
COMMENT ON COLUMN public.habits.reward IS '习惯循环的奖励机制（兼容旧表）';
COMMENT ON COLUMN public.habits.belief_score IS '用户对习惯有效性的信念分数 1-10（兼容旧表）';
COMMENT ON COLUMN public.habits.min_resistance_level IS '最小阻力等级（1-5），1 表示最容易，5 表示最难';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_created_at ON public.habits(created_at);

-- 启用 RLS
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "Users can view their own habits"
  ON public.habits
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habits"
  ON public.habits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits"
  ON public.habits
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits"
  ON public.habits
  FOR DELETE
  USING (auth.uid() = user_id);

-- 创建 habit_completions 表（习惯打卡表）
CREATE TABLE IF NOT EXISTS public.habit_completions (
  id BIGSERIAL PRIMARY KEY,
  habit_id BIGINT NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(), -- 完成时间
  user_notes TEXT, -- 用户备注（可选）
  belief_score_snapshot INTEGER CHECK (belief_score_snapshot >= 1 AND belief_score_snapshot <= 10), -- 完成时的信念分数快照
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加注释
COMMENT ON TABLE public.habit_completions IS '习惯打卡表，记录用户完成习惯的时间';
COMMENT ON COLUMN public.habit_completions.completed_at IS '完成时间';
COMMENT ON COLUMN public.habit_completions.user_notes IS '用户备注（可选）';
COMMENT ON COLUMN public.habit_completions.belief_score_snapshot IS '完成时的信念分数快照（1-10），用于贝叶斯计算';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON public.habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_id ON public.habit_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_completed_at ON public.habit_completions(completed_at DESC);

-- 启用 RLS
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "Users can view their own habit completions"
  ON public.habit_completions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habit completions"
  ON public.habit_completions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habit completions"
  ON public.habit_completions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habit completions"
  ON public.habit_completions
  FOR DELETE
  USING (auth.uid() = user_id);

-- 为 habits 表添加 updated_at 触发器
CREATE TRIGGER update_habits_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

