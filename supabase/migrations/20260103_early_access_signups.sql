-- Early Access Signups Table
-- For collecting emails during pre-launch marketing campaign

CREATE TABLE IF NOT EXISTS early_access_signups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    source TEXT DEFAULT 'marketing_landing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_early_access_signups_email ON early_access_signups(email);
CREATE INDEX IF NOT EXISTS idx_early_access_signups_created_at ON early_access_signups(created_at);

-- Enable Row Level Security
ALTER TABLE early_access_signups ENABLE ROW LEVEL SECURITY;

-- Allow insert from anonymous users (for signup form)
CREATE POLICY "Allow anonymous insert" ON early_access_signups
    FOR INSERT TO anon
    WITH CHECK (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access" ON early_access_signups
    FOR ALL TO service_role
    USING (true);

-- Function to get signup count
CREATE OR REPLACE FUNCTION get_early_access_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM early_access_signups);
END;
$$;
