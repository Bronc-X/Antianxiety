-- Consolidated Early Access Table Setup
-- Run this entire script to fix the "relation does not exist" error

-- 1. Create the table if it doesn't exist (from 20260103 migration)
CREATE TABLE IF NOT EXISTS early_access_signups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    source TEXT DEFAULT 'marketing_landing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add the phone column if it doesn't exist (from 20260104 insert)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'early_access_signups' AND column_name = 'phone') THEN
        ALTER TABLE early_access_signups ADD COLUMN phone TEXT;
    END IF;
END $$;

-- 3. Create Indexes
CREATE INDEX IF NOT EXISTS idx_early_access_signups_email ON early_access_signups(email);
CREATE INDEX IF NOT EXISTS idx_early_access_signups_created_at ON early_access_signups(created_at);
CREATE INDEX IF NOT EXISTS idx_early_access_signups_phone ON early_access_signups(phone);

-- 4. Security Policies (RLS)
ALTER TABLE early_access_signups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflict when re-running
DROP POLICY IF EXISTS "Allow anonymous insert" ON early_access_signups;
DROP POLICY IF EXISTS "Allow service role full access" ON early_access_signups;

CREATE POLICY "Allow anonymous insert" ON early_access_signups
    FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "Allow service role full access" ON early_access_signups
    FOR ALL TO service_role
    USING (true);

-- 5. Helper Function
CREATE OR REPLACE FUNCTION get_early_access_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM early_access_signups);
END;
$$;
