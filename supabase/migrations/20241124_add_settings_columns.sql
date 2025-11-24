-- ============================================================
-- Migration: Add Settings Dashboard Columns to Profiles Table
-- Date: 2024-11-24
-- Purpose: 添加设置中心所需的AI调优和账号管理字段
-- ============================================================

-- Step 1: 添加AI调优相关列
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ai_personality TEXT,
ADD COLUMN IF NOT EXISTS current_focus TEXT;

-- Step 2: 确保已有 primary_goal 和 ai_persona_context（可能已存在）
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS primary_goal TEXT,
ADD COLUMN IF NOT EXISTS ai_persona_context TEXT;

-- Step 3: 添加注释说明字段用途
COMMENT ON COLUMN public.profiles.ai_personality IS 'AI性格设定：strict_coach, gentle_friend, science_nerd';
COMMENT ON COLUMN public.profiles.current_focus IS '用户当前关注点，如"膝盖疼痛，避免跑步"';
COMMENT ON COLUMN public.profiles.primary_goal IS '主要健康目标：lose_weight, improve_sleep, boost_energy, maintain_energy';
COMMENT ON COLUMN public.profiles.ai_persona_context IS 'AI上下文字符串，由updateSettings自动生成';

-- Step 4: 设置默认值（仅针对新记录）
ALTER TABLE public.profiles
ALTER COLUMN ai_personality SET DEFAULT 'gentle_friend',
ALTER COLUMN primary_goal SET DEFAULT 'maintain_energy';

-- Step 5: 验证列是否添加成功
DO $$
DECLARE
  column_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name IN (
      'ai_personality',
      'current_focus',
      'primary_goal',
      'ai_persona_context'
    );
  
  IF column_count >= 4 THEN
    RAISE NOTICE '✅ Settings Dashboard 列添加成功，共 % 个字段', column_count;
  ELSE
    RAISE WARNING '⚠️ 某些列未添加成功，当前只有 % 个字段', column_count;
  END IF;
END $$;

-- ============================================================
-- 使用说明：
-- 1. 在 Supabase Dashboard SQL Editor 执行此脚本
-- 2. 看到 "✅ Settings Dashboard 列添加成功" 消息即可
-- 3. 刷新应用页面，设置中心应该可以正常工作
-- ============================================================
