-- ============================================================
-- Migration V2: Fix Profiles Table Trigger (Safe Version)
-- Date: 2024-11-24
-- Purpose: 安全版本 - 只插入必需字段
-- ============================================================

-- Step 1: 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 2: 创建新的触发器函数（只插入id）
-- 这是最安全的版本，只插入主键
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- 只插入id字段，其他字段使用数据库默认值
  INSERT INTO public.profiles (id)
  VALUES (new.id)
  ON CONFLICT (id) DO NOTHING;  -- 避免重复插入
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- 记录错误但不阻止用户注册
    RAISE WARNING 'Error creating profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: 创建触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: 验证触发器
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    RAISE NOTICE '✅ 触发器创建成功！';
  ELSE
    RAISE EXCEPTION '❌ 触发器创建失败！';
  END IF;
END $$;

-- ============================================================
-- 使用说明：
-- 1. 在Supabase Dashboard SQL Editor执行此脚本
-- 2. 如果仍然报错，请运行 CHECK_PROFILES_SCHEMA.sql 查看表结构
-- 3. 根据实际表结构调整触发器
-- ============================================================
