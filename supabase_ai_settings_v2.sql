-- AI Settings V2: 支持三种人格模式 + 诚实度/幽默感滑块
-- 在 Supabase Dashboard → SQL Editor 执行此脚本

-- ============================================
-- 1. 删除旧的约束（如果存在）
-- ============================================
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS ai_settings_check;

-- ============================================
-- 2. 添加或更新 ai_settings JSONB 字段
-- ============================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS ai_settings JSONB DEFAULT '{
  "honesty_level": 90,
  "humor_level": 65,
  "mode": "max"
}'::jsonb;

-- ============================================
-- 3. 添加新的约束（支持 0-100 范围和三种模式）
-- ============================================
ALTER TABLE profiles
ADD CONSTRAINT ai_settings_check CHECK (
  ai_settings IS NULL OR (
    (ai_settings->>'honesty_level')::int >= 0 AND 
    (ai_settings->>'honesty_level')::int <= 100 AND
    (ai_settings->>'humor_level')::int >= 0 AND 
    (ai_settings->>'humor_level')::int <= 100 AND
    ai_settings->>'mode' IN ('max', 'zen_master', 'dr_house')
  )
);

-- ============================================
-- 4. 更新现有用户的默认值（如果 ai_settings 为空）
-- ============================================
UPDATE profiles 
SET ai_settings = '{
  "honesty_level": 90,
  "humor_level": 65,
  "mode": "max"
}'::jsonb
WHERE ai_settings IS NULL;

-- ============================================
-- 5. 验证
-- ============================================
-- 运行以下查询检查字段是否添加成功：
-- SELECT id, ai_settings FROM profiles LIMIT 5;
