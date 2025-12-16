-- ============================================================
-- Migration: Add Missing Columns to Profiles Table
-- Date: 2024-11-24
-- Purpose: 确保profiles表有所有必需的列
-- ============================================================

-- Step 1: 添加缺失的列（如果不存在）
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ai_persona_context TEXT,
ADD COLUMN IF NOT EXISTS metabolic_profile JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS primary_concern TEXT,
ADD COLUMN IF NOT EXISTS ai_profile_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Step 2: 创建更新时间戳的触发器
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;

-- Step 4: 创建新触发器
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Step 5: 创建索引以提高性能
CREATE INDEX IF NOT EXISTS idx_profiles_metabolic_profile 
  ON public.profiles USING gin (metabolic_profile);

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed 
  ON public.profiles (onboarding_completed_at);

-- Step 6: 验证表结构
DO $$
DECLARE
  column_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name IN (
      'id', 
      'ai_persona_context', 
      'metabolic_profile',
      'onboarding_completed_at',
      'created_at',
      'updated_at'
    );
  
  IF column_count >= 6 THEN
    RAISE NOTICE '✅ Profiles表结构正确，包含 % 个必需列', column_count;
  ELSE
    RAISE WARNING '⚠️ Profiles表缺少某些列，当前只有 % 个必需列', column_count;
  END IF;
END $$;

-- ============================================================
-- 使用说明：
-- 1. 在Supabase Dashboard SQL Editor执行此脚本
-- 2. 看到"✅ Profiles表结构正确"消息即为成功
-- 3. 然后执行 20251124_fix_profiles_trigger_v2.sql
-- ============================================================
