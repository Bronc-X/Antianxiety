-- Beta Signups Table
-- Run this in Supabase SQL editor to create the table for collecting beta emails

CREATE TABLE IF NOT EXISTS beta_signups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    source TEXT DEFAULT 'beta_landing',
    status TEXT DEFAULT 'pending', -- pending, invited, active
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invited_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_beta_signups_email ON beta_signups(email);
CREATE INDEX IF NOT EXISTS idx_beta_signups_status ON beta_signups(status);

-- Enable Row Level Security
ALTER TABLE beta_signups ENABLE ROW LEVEL SECURITY;

-- Allow insert from anonymous users (for signup form)
CREATE POLICY "Allow anonymous insert" ON beta_signups
    FOR INSERT TO anon
    WITH CHECK (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access" ON beta_signups
    FOR ALL TO service_role
    USING (true);
