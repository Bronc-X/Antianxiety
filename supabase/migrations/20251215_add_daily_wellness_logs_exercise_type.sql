-- ============================================
-- Add exercise_type to daily_wellness_logs
-- Purpose: Persist exercise modality from daily check-in UI
-- ============================================

ALTER TABLE public.daily_wellness_logs
ADD COLUMN IF NOT EXISTS exercise_type TEXT;

COMMENT ON COLUMN public.daily_wellness_logs.exercise_type IS '运动类型（可选），例如：跑步/力量训练/瑜伽/散步等';

