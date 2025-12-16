-- ============================================
-- 添加健康参数字段到 profiles 表
-- 请在 Supabase Dashboard → SQL Editor 中执行
-- ============================================

-- 添加核心健康字段
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS height_cm INTEGER,
ADD COLUMN IF NOT EXISTS weight_kg INTEGER,
ADD COLUMN IF NOT EXISTS body_fat_percentage NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS primary_goal TEXT,
ADD COLUMN IF NOT EXISTS target_weight_kg DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS weekly_goal_rate TEXT,
ADD COLUMN IF NOT EXISTS ai_profile_completed BOOLEAN DEFAULT FALSE;

-- 添加字段注释
COMMENT ON COLUMN public.profiles.gender IS '性别';
COMMENT ON COLUMN public.profiles.birth_date IS '出生日期';
COMMENT ON COLUMN public.profiles.height_cm IS '身高（厘米）';
COMMENT ON COLUMN public.profiles.weight_kg IS '体重（公斤）';
COMMENT ON COLUMN public.profiles.body_fat_percentage IS '体脂率';
COMMENT ON COLUMN public.profiles.primary_goal IS '主要健康目标';
COMMENT ON COLUMN public.profiles.target_weight_kg IS '目标体重';
COMMENT ON COLUMN public.profiles.weekly_goal_rate IS '每周目标速率';
COMMENT ON COLUMN public.profiles.ai_profile_completed IS 'AI资料收集完成标志';

-- 验证字段已添加
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
