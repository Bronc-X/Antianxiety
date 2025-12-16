-- 添加生活习惯字段到 profiles 表
-- 在 Supabase Dashboard → SQL Editor 执行

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS sleep_hours DECIMAL(4,1),
ADD COLUMN IF NOT EXISTS stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
ADD COLUMN IF NOT EXISTS energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
ADD COLUMN IF NOT EXISTS exercise_frequency TEXT;

-- 添加字段注释
COMMENT ON COLUMN public.profiles.sleep_hours IS '每日睡眠时长（小时）';
COMMENT ON COLUMN public.profiles.stress_level IS '压力水平（1-10）';
COMMENT ON COLUMN public.profiles.energy_level IS '精力水平（1-10）';
COMMENT ON COLUMN public.profiles.exercise_frequency IS '运动频率';
