-- ============================================
-- 创建 ai_reminders 表
-- 用于存储AI生成的预测性提醒和建议
-- ============================================

-- 创建 ai_reminders 表
CREATE TABLE IF NOT EXISTS public.ai_reminders (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('habit_prompt', 'stress_check', 'exercise_reminder', 'custom')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加注释
COMMENT ON TABLE public.ai_reminders IS 'AI预测性提醒表，存储AI生成的习惯提醒和健康建议';
COMMENT ON COLUMN public.ai_reminders.reminder_type IS '提醒类型：habit_prompt（习惯提示）、stress_check（压力检查）、exercise_reminder（运动提醒）、custom（自定义）';
COMMENT ON COLUMN public.ai_reminders.title IS '提醒标题';
COMMENT ON COLUMN public.ai_reminders.content IS '提醒内容';
COMMENT ON COLUMN public.ai_reminders.scheduled_at IS '提醒调度时间';
COMMENT ON COLUMN public.ai_reminders.read IS '是否已读';
COMMENT ON COLUMN public.ai_reminders.dismissed IS '是否已忽略';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ai_reminders_user_id ON public.ai_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_reminders_scheduled_at ON public.ai_reminders(scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_reminders_read ON public.ai_reminders(read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_ai_reminders_type ON public.ai_reminders(reminder_type);

-- 启用 RLS
ALTER TABLE public.ai_reminders ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "Users can view their own reminders"
  ON public.ai_reminders
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders"
  ON public.ai_reminders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
  ON public.ai_reminders
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
  ON public.ai_reminders
  FOR DELETE
  USING (auth.uid() = user_id);

-- 为 ai_reminders 表添加 updated_at 触发器
CREATE TRIGGER update_ai_reminders_updated_at
  BEFORE UPDATE ON public.ai_reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

