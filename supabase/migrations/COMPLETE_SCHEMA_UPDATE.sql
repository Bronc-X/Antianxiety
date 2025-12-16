-- 完整的数据库字段更新脚本
-- 在 Supabase Dashboard → SQL Editor 执行

-- 1. 添加基础健康字段
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS height_cm INTEGER,
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS body_fat_percentage NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS activity_level TEXT,
ADD COLUMN IF NOT EXISTS primary_goal TEXT,
ADD COLUMN IF NOT EXISTS target_weight_kg DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS weekly_goal_rate TEXT;

-- 2. 添加生活习惯字段
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS sleep_hours DECIMAL(4,1),
ADD COLUMN IF NOT EXISTS stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
ADD COLUMN IF NOT EXISTS energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
ADD COLUMN IF NOT EXISTS exercise_frequency TEXT,
ADD COLUMN IF NOT EXISTS caffeine_intake TEXT,
ADD COLUMN IF NOT EXISTS alcohol_intake TEXT,
ADD COLUMN IF NOT EXISTS smoking_status TEXT;

-- 3. 添加AI分析字段
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ai_profile_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_analysis_result JSONB,
ADD COLUMN IF NOT EXISTS ai_recommendation_plan JSONB;

-- 4. 添加字段注释
COMMENT ON COLUMN public.profiles.gender IS '性别';
COMMENT ON COLUMN public.profiles.birth_date IS '出生日期';
COMMENT ON COLUMN public.profiles.height_cm IS '身高（厘米）';
COMMENT ON COLUMN public.profiles.weight_kg IS '体重（公斤）';
COMMENT ON COLUMN public.profiles.body_fat_percentage IS '体脂率（%）';
COMMENT ON COLUMN public.profiles.activity_level IS '活动水平';
COMMENT ON COLUMN public.profiles.primary_goal IS '主要目标';
COMMENT ON COLUMN public.profiles.target_weight_kg IS '目标体重（公斤）';
COMMENT ON COLUMN public.profiles.weekly_goal_rate IS '每周目标速率';
COMMENT ON COLUMN public.profiles.sleep_hours IS '每日睡眠时长（小时）';
COMMENT ON COLUMN public.profiles.stress_level IS '压力水平（1-10）';
COMMENT ON COLUMN public.profiles.energy_level IS '精力水平（1-10）';
COMMENT ON COLUMN public.profiles.exercise_frequency IS '运动频率';
COMMENT ON COLUMN public.profiles.caffeine_intake IS '咖啡因摄入';
COMMENT ON COLUMN public.profiles.alcohol_intake IS '酒精摄入';
COMMENT ON COLUMN public.profiles.smoking_status IS '吸烟状况';
COMMENT ON COLUMN public.profiles.ai_profile_completed IS 'AI分析是否完成';
COMMENT ON COLUMN public.profiles.ai_analysis_result IS 'AI分析结果';
COMMENT ON COLUMN public.profiles.ai_recommendation_plan IS 'AI推荐方案';
