-- ============================================
-- 为 user_habits 表添加 belief_score 列
-- ============================================
ALTER TABLE public.user_habits
ADD COLUMN IF NOT EXISTS belief_score INTEGER DEFAULT 5;

-- 为 belief_score 列添加注释
COMMENT ON COLUMN public.user_habits.belief_score IS '信念分数（1-10分），表示用户相信这个习惯帮助缓解焦虑的程度';

-- ============================================
-- 创建 habit_log 表
-- ============================================
CREATE TABLE IF NOT EXISTS public.habit_log (
  id BIGSERIAL PRIMARY KEY,
  habit_id BIGINT NOT NULL REFERENCES public.user_habits(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  belief_score_snapshot INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 为 habit_log 表添加注释
COMMENT ON TABLE public.habit_log IS '习惯完成记录表，记录每次完成习惯时的信念分数快照';
COMMENT ON COLUMN public.habit_log.id IS '记录ID（自动递增）';
COMMENT ON COLUMN public.habit_log.habit_id IS '习惯ID，外键关联 user_habits.id';
COMMENT ON COLUMN public.habit_log.completed_at IS '完成时间';
COMMENT ON COLUMN public.habit_log.belief_score_snapshot IS '完成时的信念分数快照（1-10分）';

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_habit_log_habit_id ON public.habit_log(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_log_completed_at ON public.habit_log(completed_at);

-- 启用 Row Level Security (RLS)
ALTER TABLE public.habit_log ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：用户只能查看、插入自己的习惯完成记录
CREATE POLICY "Users can view their own habit logs"
  ON public.habit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_habits
      WHERE user_habits.id = habit_log.habit_id
      AND user_habits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own habit logs"
  ON public.habit_log
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_habits
      WHERE user_habits.id = habit_log.habit_id
      AND user_habits.user_id = auth.uid()
    )
  );

