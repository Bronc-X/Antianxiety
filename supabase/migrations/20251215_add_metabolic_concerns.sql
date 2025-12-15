-- ============================================
-- Add metabolic_concerns to profiles
-- Purpose: Persist "代谢健康困扰" selections for AI analysis & personalization
-- ============================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS metabolic_concerns TEXT[] DEFAULT '{}'::text[];

COMMENT ON COLUMN public.profiles.metabolic_concerns IS
'代谢健康困扰（多选）：easy_fatigue, belly_fat, muscle_loss, slow_recovery, carb_cravings';

-- Optional: accelerate filtering / containment queries on TEXT[]
CREATE INDEX IF NOT EXISTS idx_profiles_metabolic_concerns
  ON public.profiles USING gin (metabolic_concerns);

