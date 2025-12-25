-- 修复 Beta 注册表缺失的问题
-- 如果你之前没有执行过 20251223_beta_signups.sql，请执行此脚本

CREATE TABLE IF NOT EXISTS beta_signups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    source TEXT DEFAULT 'beta_landing',
    status TEXT DEFAULT 'pending', -- pending, invited, active
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invited_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_beta_signups_email ON beta_signups(email);

-- 启用 RLS
ALTER TABLE beta_signups ENABLE ROW LEVEL SECURITY;

-- 允许匿名用户插入（用于注册表单）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'beta_signups' AND policyname = 'Allow anonymous insert'
    ) THEN
        CREATE POLICY "Allow anonymous insert" ON beta_signups
            FOR INSERT TO anon
            WITH CHECK (true);
    END IF;
END $$;

-- 允许服务角色完全访问
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'beta_signups' AND policyname = 'Allow service role full access'
    ) THEN
        CREATE POLICY "Allow service role full access" ON beta_signups
            FOR ALL TO service_role
            USING (true);
    END IF;
END $$;
