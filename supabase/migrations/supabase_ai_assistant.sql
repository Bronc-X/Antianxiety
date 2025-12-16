-- ============================================
-- AI 助理系统数据库扩展
-- ============================================

-- 扩展 profiles 表，添加详细的生理和运动信息
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS age_range TEXT, -- 年龄段选择（如 '25-34'）
ADD COLUMN IF NOT EXISTS height_cm INTEGER,
ADD COLUMN IF NOT EXISTS weight_kg INTEGER,
ADD COLUMN IF NOT EXISTS body_fat_percentage NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS sleep_hours DECIMAL(4,1),
ADD COLUMN IF NOT EXISTS stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
ADD COLUMN IF NOT EXISTS energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
ADD COLUMN IF NOT EXISTS chronic_conditions TEXT[], -- 基础慢性疾病
ADD COLUMN IF NOT EXISTS exercise_types TEXT[], -- 运动类型数组
ADD COLUMN IF NOT EXISTS exercise_frequency TEXT, -- 运动频率
ADD COLUMN IF NOT EXISTS exercise_duration_minutes INTEGER, -- 单次运动时长
ADD COLUMN IF NOT EXISTS has_fitness_app BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fitness_app_name TEXT,
ADD COLUMN IF NOT EXISTS can_sync_fitness_data BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hobbies TEXT[], -- 爱好数组
ADD COLUMN IF NOT EXISTS work_schedule TEXT, -- 工作时间安排
ADD COLUMN IF NOT EXISTS meal_pattern TEXT, -- 饮食模式
ADD COLUMN IF NOT EXISTS caffeine_intake TEXT, -- 咖啡因摄入
ADD COLUMN IF NOT EXISTS alcohol_intake TEXT, -- 酒精摄入
ADD COLUMN IF NOT EXISTS smoking_status TEXT, -- 吸烟状态
ADD COLUMN IF NOT EXISTS primary_focus_topics TEXT[], -- 关注的生理/焦虑话题
ADD COLUMN IF NOT EXISTS medical_conditions TEXT[], -- 医疗状况
ADD COLUMN IF NOT EXISTS medications TEXT[], -- 药物
ADD COLUMN IF NOT EXISTS daily_checkin_time TIME, -- 每日提醒时间
ADD COLUMN IF NOT EXISTS body_function_score INTEGER DEFAULT 0, -- 身体机能分数（0-100）
ADD COLUMN IF NOT EXISTS primary_goal TEXT,
ADD COLUMN IF NOT EXISTS goal_focus_notes TEXT,
ADD COLUMN IF NOT EXISTS target_weight_kg DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS weekly_goal_rate TEXT,
ADD COLUMN IF NOT EXISTS weekly_goal_custom DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS ai_profile_completed BOOLEAN DEFAULT FALSE, -- AI资料收集完成标志
ADD COLUMN IF NOT EXISTS ai_analysis_result JSONB, -- AI分析结果（JSON格式）
ADD COLUMN IF NOT EXISTS ai_recommendation_plan JSONB; -- AI推荐方案（JSON格式）

-- 添加注释
COMMENT ON COLUMN public.profiles.gender IS '性别';
COMMENT ON COLUMN public.profiles.birth_date IS '出生日期';
COMMENT ON COLUMN public.profiles.age_range IS '年龄段';
COMMENT ON COLUMN public.profiles.height_cm IS '身高（厘米）';
COMMENT ON COLUMN public.profiles.weight_kg IS '体重（公斤）';
COMMENT ON COLUMN public.profiles.body_fat_percentage IS '体脂率';
COMMENT ON COLUMN public.profiles.sleep_hours IS '平均睡眠时长（小时）';
COMMENT ON COLUMN public.profiles.stress_level IS '压力水平（1-10）';
COMMENT ON COLUMN public.profiles.energy_level IS '精力水平（1-10）';
COMMENT ON COLUMN public.profiles.chronic_conditions IS '基础慢性疾病';
COMMENT ON COLUMN public.profiles.exercise_types IS '运动类型数组';
COMMENT ON COLUMN public.profiles.exercise_frequency IS '运动频率';
COMMENT ON COLUMN public.profiles.exercise_duration_minutes IS '单次运动时长（分钟）';
COMMENT ON COLUMN public.profiles.has_fitness_app IS '是否有运动记录App';
COMMENT ON COLUMN public.profiles.fitness_app_name IS '运动App名称';
COMMENT ON COLUMN public.profiles.can_sync_fitness_data IS '是否可以同步运动数据';
COMMENT ON COLUMN public.profiles.hobbies IS '爱好数组';
COMMENT ON COLUMN public.profiles.primary_focus_topics IS '关注的生理/焦虑话题';
COMMENT ON COLUMN public.profiles.ai_profile_completed IS 'AI资料收集是否完成';
COMMENT ON COLUMN public.profiles.daily_checkin_time IS '每日检查提醒时间';
COMMENT ON COLUMN public.profiles.body_function_score IS '身体机能分数（0-100）';
COMMENT ON COLUMN public.profiles.primary_goal IS '用户的主要健康目标';
COMMENT ON COLUMN public.profiles.goal_focus_notes IS '针对目标的补充描述或指标';
COMMENT ON COLUMN public.profiles.target_weight_kg IS 'AI 规划的目标体重';
COMMENT ON COLUMN public.profiles.weekly_goal_rate IS '每周目标速率选择';
COMMENT ON COLUMN public.profiles.weekly_goal_custom IS '自定义的每周目标速率';
COMMENT ON COLUMN public.profiles.ai_analysis_result IS 'AI分析结果（JSON格式）';
COMMENT ON COLUMN public.profiles.ai_recommendation_plan IS 'AI推荐方案（JSON格式）';

-- ============================================
-- 创建 AI 对话历史表
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB, -- 存储额外信息，如时间戳、上下文等
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加注释
COMMENT ON TABLE public.ai_conversations IS 'AI对话历史表';
COMMENT ON COLUMN public.ai_conversations.role IS '角色：user（用户）、assistant（AI助理）、system（系统）';
COMMENT ON COLUMN public.ai_conversations.content IS '对话内容';
COMMENT ON COLUMN public.ai_conversations.metadata IS '元数据（JSON格式）';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON public.ai_conversations(created_at);

-- 启用 RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "Users can view their own conversations"
  ON public.ai_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
  ON public.ai_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 创建 AI 提醒/通知表
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_reminders (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL, -- 提醒类型：habit_prompt, stress_check, exercise_reminder等
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL, -- 计划提醒时间
  sent_at TIMESTAMPTZ, -- 实际发送时间
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB, -- 存储额外信息
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加注释
COMMENT ON TABLE public.ai_reminders IS 'AI提醒/通知表';
COMMENT ON COLUMN public.ai_reminders.reminder_type IS '提醒类型';
COMMENT ON COLUMN public.ai_reminders.scheduled_at IS '计划提醒时间';
COMMENT ON COLUMN public.ai_reminders.sent_at IS '实际发送时间';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ai_reminders_user_id ON public.ai_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_reminders_scheduled_at ON public.ai_reminders(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_ai_reminders_sent_at ON public.ai_reminders(sent_at);

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

-- ============================================
-- 创建 AI 记忆表（长期记忆）
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_memories (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL, -- 记忆类型：preference, pattern, insight等
  key TEXT NOT NULL, -- 记忆键
  value JSONB NOT NULL, -- 记忆值（JSON格式）
  importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10), -- 重要性（1-10）
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, memory_type, key) -- 确保每个用户每种类型的每个键只有一条记录
);

-- 添加注释
COMMENT ON TABLE public.ai_memories IS 'AI长期记忆表';
COMMENT ON COLUMN public.ai_memories.memory_type IS '记忆类型';
COMMENT ON COLUMN public.ai_memories.key IS '记忆键';
COMMENT ON COLUMN public.ai_memories.value IS '记忆值（JSON格式）';
COMMENT ON COLUMN public.ai_memories.importance IS '重要性（1-10）';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ai_memories_user_id ON public.ai_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_memories_type_key ON public.ai_memories(memory_type, key);
CREATE INDEX IF NOT EXISTS idx_ai_memories_importance ON public.ai_memories(importance DESC);

-- 启用 RLS
ALTER TABLE public.ai_memories ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "Users can view their own memories"
  ON public.ai_memories
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memories"
  ON public.ai_memories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories"
  ON public.ai_memories
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 为 ai_memories 表添加 updated_at 触发器
CREATE TRIGGER update_ai_memories_updated_at
  BEFORE UPDATE ON public.ai_memories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 创建每日个人记录表
-- ============================================
CREATE TABLE IF NOT EXISTS public.daily_wellness_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sleep_duration_minutes INTEGER,
  sleep_quality TEXT,
  exercise_duration_minutes INTEGER,
  mood_status TEXT,
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

COMMENT ON TABLE public.daily_wellness_logs IS '每日健康记录表';
COMMENT ON COLUMN public.daily_wellness_logs.sleep_duration_minutes IS '睡眠时长（分钟）';
COMMENT ON COLUMN public.daily_wellness_logs.sleep_quality IS '睡眠评分/质量';
COMMENT ON COLUMN public.daily_wellness_logs.exercise_duration_minutes IS '运动时长（分钟）';
COMMENT ON COLUMN public.daily_wellness_logs.mood_status IS '心情状态';
COMMENT ON COLUMN public.daily_wellness_logs.stress_level IS '压力等级（1-10）';

CREATE INDEX IF NOT EXISTS idx_daily_wellness_logs_user_id ON public.daily_wellness_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_wellness_logs_date ON public.daily_wellness_logs(log_date);

ALTER TABLE public.daily_wellness_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wellness logs"
  ON public.daily_wellness_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wellness logs"
  ON public.daily_wellness_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wellness logs"
  ON public.daily_wellness_logs
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_daily_wellness_logs_updated_at
  BEFORE UPDATE ON public.daily_wellness_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

