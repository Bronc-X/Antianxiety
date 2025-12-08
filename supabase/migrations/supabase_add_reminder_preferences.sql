-- ============================================
-- 添加 reminder_preferences 字段到 profiles 表
-- ============================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS reminder_preferences JSONB DEFAULT '{}'::jsonb;

-- 添加注释
COMMENT ON COLUMN public.profiles.reminder_preferences IS '提醒偏好设置（JSON格式），包含提醒时间模式、活动选择、AI自动模式等';

