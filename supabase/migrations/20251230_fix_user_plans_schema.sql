-- ============================================
-- Fix user_plans table schema to match Server Actions
-- Migration: Add missing columns expected by app/actions/plans.ts
-- ============================================

-- Add missing columns to user_plans table
ALTER TABLE public.user_plans 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
ADD COLUMN IF NOT EXISTS target_date DATE;

-- Update existing rows to have default name from title
UPDATE public.user_plans 
SET name = title 
WHERE name IS NULL AND title IS NOT NULL;

-- Add comments
COMMENT ON COLUMN public.user_plans.name IS '计划名称（兼容 MVVM 层）';
COMMENT ON COLUMN public.user_plans.description IS '计划描述';
COMMENT ON COLUMN public.user_plans.category IS '计划分类：general, exercise, diet, sleep, mental';
COMMENT ON COLUMN public.user_plans.progress IS '完成进度百分比 0-100';
COMMENT ON COLUMN public.user_plans.target_date IS '目标完成日期';

-- Create index for better querying
CREATE INDEX IF NOT EXISTS idx_user_plans_category ON public.user_plans(category);
