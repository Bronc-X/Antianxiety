-- ============================================================
-- 检查Profiles表结构
-- 用于诊断注册错误
-- ============================================================

-- Step 1: 查看profiles表的所有列
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Step 2: 查看profiles表的约束
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'profiles';

-- Step 3: 检查触发器是否存在
SELECT 
    tgname AS trigger_name,
    tgenabled AS is_enabled,
    proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass
  AND tgname = 'on_auth_user_created';
